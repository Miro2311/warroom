import { supabase } from "@/lib/supabase";
import { PeerValidation } from "@/types/xp";
import { XPService } from "./xpService";

export class PeerValidationService {
  /**
   * Create a peer validation request
   */
  static async createValidationRequest(
    userId: string,
    groupId: string,
    actionType: string,
    actionDescription: string,
    xpAmount: number,
    relatedPartnerId?: string,
    metadata?: Record<string, any>
  ): Promise<PeerValidation | null> {
    try {
      const { data, error } = await supabase
        .from("peer_validations")
        .insert({
          user_id: userId,
          group_id: groupId,
          action_type: actionType,
          action_description: actionDescription,
          xp_amount: xpAmount,
          related_partner_id: relatedPartnerId,
          metadata: metadata || {},
          status: "pending",
          validators: [],
          required_validations: 2,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating validation request:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error creating validation request:", error);
      return null;
    }
  }

  /**
   * Validate an action (approve)
   */
  static async validateAction(
    validationId: string,
    validatorId: string
  ): Promise<boolean> {
    try {
      // Get current validation
      const { data: validation, error: fetchError } = await supabase
        .from("peer_validations")
        .select("*")
        .eq("id", validationId)
        .single();

      if (fetchError || !validation) {
        console.error("Error fetching validation:", fetchError);
        return false;
      }

      // Check if already validated by this user
      const validators = validation.validators as string[];
      if (validators.includes(validatorId)) {
        console.log("User already validated this action");
        return false;
      }

      // Check if validator is not the action owner
      if (validation.user_id === validatorId) {
        console.error("Cannot validate own action");
        return false;
      }

      // Add validator
      const newValidators = [...validators, validatorId];
      const newStatus =
        newValidators.length >= validation.required_validations
          ? "approved"
          : "pending";

      // Update validation
      const { error: updateError } = await supabase
        .from("peer_validations")
        .update({
          validators: newValidators,
          status: newStatus,
          resolved_at: newStatus === "approved" ? new Date().toISOString() : null,
        })
        .eq("id", validationId);

      if (updateError) {
        console.error("Error updating validation:", updateError);
        return false;
      }

      // Award XP to validator
      await XPService.awardXP(
        validatorId,
        validation.group_id,
        "peer_validation",
        "social"
      );

      // If approved, award XP to action owner
      if (newStatus === "approved") {
        await XPService.awardXP(
          validation.user_id,
          validation.group_id,
          validation.action_type as any,
          "milestone",
          validation.related_partner_id || undefined,
          validation.metadata as Record<string, any>
        );
      }

      return true;
    } catch (error) {
      console.error("Error validating action:", error);
      return false;
    }
  }

  /**
   * Reject a validation request
   */
  static async rejectAction(
    validationId: string,
    validatorId: string
  ): Promise<boolean> {
    try {
      // Get current validation
      const { data: validation, error: fetchError } = await supabase
        .from("peer_validations")
        .select("*")
        .eq("id", validationId)
        .single();

      if (fetchError || !validation) {
        console.error("Error fetching validation:", fetchError);
        return false;
      }

      // Check if validator is not the action owner
      if (validation.user_id === validatorId) {
        console.error("Cannot reject own action");
        return false;
      }

      // Update validation to rejected
      const { error: updateError } = await supabase
        .from("peer_validations")
        .update({
          status: "rejected",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", validationId);

      if (updateError) {
        console.error("Error rejecting validation:", updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error rejecting action:", error);
      return false;
    }
  }

  /**
   * Get pending validations for a group
   */
  static async getPendingValidations(
    groupId: string,
    excludeUserId?: string
  ): Promise<PeerValidation[]> {
    try {
      let query = supabase
        .from("peer_validations")
        .select("*")
        .eq("group_id", groupId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (excludeUserId) {
        query = query.neq("user_id", excludeUserId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching pending validations:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching pending validations:", error);
      return [];
    }
  }

  /**
   * Get user's validation requests
   */
  static async getUserValidations(userId: string): Promise<PeerValidation[]> {
    try {
      const { data, error } = await supabase
        .from("peer_validations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user validations:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching user validations:", error);
      return [];
    }
  }

  /**
   * Delete expired pending validations (older than 7 days)
   */
  static async cleanupExpiredValidations(): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { error } = await supabase
        .from("peer_validations")
        .delete()
        .eq("status", "pending")
        .lt("created_at", sevenDaysAgo.toISOString());

      if (error) {
        console.error("Error cleaning up expired validations:", error);
      }
    } catch (error) {
      console.error("Error cleaning up expired validations:", error);
    }
  }
}
