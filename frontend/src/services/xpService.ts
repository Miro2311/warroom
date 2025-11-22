import { supabase } from "@/lib/supabase";
import {
  XPReason,
  XPCategory,
  XP_REWARDS,
  LevelUpResult,
  XPTransaction,
} from "@/types/xp";

export class XPService {
  /**
   * Award XP to a user for a specific action
   */
  static async awardXP(
    userId: string,
    groupId: string,
    reason: XPReason,
    category: XPCategory,
    relatedPartnerId?: string,
    metadata?: Record<string, any>
  ): Promise<LevelUpResult | null> {
    try {
      // Get XP amount from config
      const amount = this.getXPAmount(reason);

      console.log(`[XP] Awarding ${amount} XP to user ${userId} for reason: ${reason}`);

      // Record XP transaction
      const { error: transactionError } = await supabase
        .from("xp_transactions")
        .insert({
          user_id: userId,
          group_id: groupId,
          amount,
          reason,
          category,
          related_partner_id: relatedPartnerId,
          metadata: metadata || {},
        });

      if (transactionError) {
        console.error("[XP] Error recording XP transaction:", transactionError);
        return null;
      }

      console.log(`[XP] Transaction recorded successfully`);

      // Update user XP and level using the database function
      const { data, error } = await supabase.rpc("add_xp_to_user", {
        p_user_id: userId,
        p_amount: amount,
      });

      if (error) {
        console.error("[XP] Error updating user XP:", error);
        return null;
      }

      const result = data[0] as LevelUpResult;
      console.log(`[XP] User updated: ${result.new_xp} XP, Level ${result.new_level}${result.leveled_up ? ' (LEVEL UP!)' : ''}`);

      return result;
    } catch (error) {
      console.error("[XP] Error awarding XP:", error);
      return null;
    }
  }

  /**
   * Get XP amount for a specific reason
   */
  private static getXPAmount(reason: XPReason): number {
    const mapping: Record<XPReason, keyof typeof XP_REWARDS> = {
      status_talking_to_dating: "STATUS_TALKING_TO_DATING",
      status_dating_to_exclusive: "STATUS_DATING_TO_EXCLUSIVE",
      status_to_complicated: "STATUS_TO_COMPLICATED",
      clean_breakup: "CLEAN_BREAKUP",
      second_chance: "SECOND_CHANCE",
      partner_added: "PARTNER_ADDED",
      timeline_event_added: "TIMELINE_EVENT_ADDED",
      weekly_update_bonus: "WEEKLY_UPDATE_BONUS",
      decay_cleanup: "DECAY_CLEANUP",
      complete_profile: "COMPLETE_PROFILE",
      partner_info_updated: "PARTNER_INFO_UPDATED",
      partner_photo_added: "PARTNER_PHOTO_ADDED",
      sticky_note_created: "STICKY_NOTE_CREATED",
      peer_validation: "PEER_VALIDATION",
      poke_decayed_node: "POKE_DECAYED_NODE",
      red_flag_help: "RED_FLAG_HELP",
      low_simp_index: "LOW_SIMP_INDEX",
      high_intimacy: "HIGH_INTIMACY",
      balanced_dating: "BALANCED_DATING",
      simp_index_improved: "SIMP_INDEX_IMPROVED",
      intimacy_improved: "INTIMACY_IMPROVED",
      red_flag_documented: "RED_FLAG_DOCUMENTED",
      critical_red_flag_early: "CRITICAL_RED_FLAG_EARLY",
      toxic_relationship_ended: "TOXIC_RELATIONSHIP_ENDED",
      high_simp_penalty: "HIGH_SIMP_PENALTY",
      partner_neglect: "PARTNER_NEGLECT",
      serial_dating_penalty: "SERIAL_DATING_PENALTY",
      ignored_decay: "IGNORED_DECAY",
      achievement_unlocked: "COMPLETE_PROFILE", // Default fallback
    };

    const key = mapping[reason];
    return XP_REWARDS[key] || 0;
  }

  /**
   * Handle status change XP rewards
   */
  static async handleStatusChange(
    userId: string,
    groupId: string,
    partnerId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<LevelUpResult | null> {
    console.log(`[XP] Status change detected: ${oldStatus} -> ${newStatus}`);

    let reason: XPReason | null = null;

    // Talking -> Dating
    if (oldStatus === "Talking" && newStatus === "Dating") {
      reason = "status_talking_to_dating";
    }
    // Dating -> Exclusive
    else if (oldStatus === "Dating" && newStatus === "Exclusive") {
      reason = "status_dating_to_exclusive";
    }
    // Anything -> It's Complicated (penalty)
    else if (newStatus === "It's Complicated") {
      reason = "status_to_complicated";
    }
    // Moving to Graveyard (clean breakup)
    else if (newStatus === "Graveyard") {
      reason = "clean_breakup";
    }
    // Coming back from Graveyard (second chance)
    else if (oldStatus === "Graveyard" && newStatus !== "Graveyard") {
      reason = "second_chance";
    }

    if (reason) {
      console.log(`[XP] Status change qualifies for XP: ${reason}`);
      return await this.awardXP(userId, groupId, reason, "milestone", partnerId, {
        old_status: oldStatus,
        new_status: newStatus,
      });
    } else {
      console.log(`[XP] Status change does not qualify for XP`);
    }

    return null;
  }

  /**
   * Handle timeline event XP
   */
  static async handleTimelineEvent(
    userId: string,
    groupId: string,
    partnerId: string,
    eventType: string
  ): Promise<LevelUpResult | null> {
    // Award XP for adding timeline event
    const result = await this.awardXP(
      userId,
      groupId,
      "timeline_event_added",
      "consistency",
      partnerId,
      { event_type: eventType }
    );

    // Check for weekly update bonus
    await this.checkWeeklyBonus(userId, groupId);

    return result;
  }

  /**
   * Check and award weekly update bonus
   */
  static async checkWeeklyBonus(
    userId: string,
    groupId: string
  ): Promise<void> {
    try {
      // Get XP transactions from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentTransactions } = await supabase
        .from("xp_transactions")
        .select("created_at, reason")
        .eq("user_id", userId)
        .gte("created_at", sevenDaysAgo.toISOString());

      if (!recentTransactions) return;

      // Check if there were timeline events on different days
      const eventDays = new Set(
        recentTransactions
          .filter((t) => t.reason === "timeline_event_added")
          .map((t) => new Date(t.created_at).toDateString())
      );

      // Check if weekly bonus was already awarded this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data: weeklyBonuses } = await supabase
        .from("xp_transactions")
        .select("id")
        .eq("user_id", userId)
        .eq("reason", "weekly_update_bonus")
        .gte("created_at", weekStart.toISOString());

      // Award bonus if user has events on 3+ different days and no bonus this week
      if (eventDays.size >= 3 && (!weeklyBonuses || weeklyBonuses.length === 0)) {
        await this.awardXP(userId, groupId, "weekly_update_bonus", "consistency");
      }
    } catch (error) {
      console.error("Error checking weekly bonus:", error);
    }
  }

  /**
   * Update user streak and check for decay cleanup XP
   */
  static async updateStreak(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc("update_user_streak", {
        p_user_id: userId,
      });

      if (error) {
        console.error("Error updating streak:", error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error("Error updating streak:", error);
      return 0;
    }
  }

  /**
   * Award XP for cleaning up decayed node
   */
  static async awardDecayCleanup(
    userId: string,
    groupId: string,
    partnerId: string
  ): Promise<LevelUpResult | null> {
    return await this.awardXP(
      userId,
      groupId,
      "decay_cleanup",
      "consistency",
      partnerId
    );
  }

  /**
   * Check and award performance-based XP
   */
  static async checkPerformanceRewards(
    userId: string,
    groupId: string,
    partnerId: string,
    simpIndex?: number,
    intimacyScore?: number
  ): Promise<void> {
    try {
      // Low Simp Index reward
      if (simpIndex !== undefined && simpIndex > 0 && simpIndex < 100) {
        // Check if already awarded this month
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { data: existing } = await supabase
          .from("xp_transactions")
          .select("id")
          .eq("user_id", userId)
          .eq("reason", "low_simp_index")
          .eq("related_partner_id", partnerId)
          .gte("created_at", monthStart.toISOString());

        if (!existing || existing.length === 0) {
          await this.awardXP(
            userId,
            groupId,
            "low_simp_index",
            "performance",
            partnerId,
            { simp_index: simpIndex }
          );
        }
      }

      // High Intimacy reward
      if (intimacyScore !== undefined && intimacyScore >= 8) {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { data: existing } = await supabase
          .from("xp_transactions")
          .select("id")
          .eq("user_id", userId)
          .eq("reason", "high_intimacy")
          .eq("related_partner_id", partnerId)
          .gte("created_at", monthStart.toISOString());

        if (!existing || existing.length === 0) {
          await this.awardXP(
            userId,
            groupId,
            "high_intimacy",
            "performance",
            partnerId,
            { intimacy_score: intimacyScore }
          );
        }
      }
    } catch (error) {
      console.error("Error checking performance rewards:", error);
    }
  }

  /**
   * Award XP for red flag documentation
   */
  static async awardRedFlagXP(
    userId: string,
    groupId: string,
    partnerId: string,
    severity: string
  ): Promise<LevelUpResult | null> {
    let reason: XPReason = "red_flag_documented";

    if (severity === "Critical") {
      reason = "critical_red_flag_early";
    }

    return await this.awardXP(userId, groupId, reason, "red_flag", partnerId, {
      severity,
    });
  }

  /**
   * Award XP for ending toxic relationship
   */
  static async awardToxicBreakupXP(
    userId: string,
    groupId: string,
    partnerId: string
  ): Promise<LevelUpResult | null> {
    // Check if partner had critical red flags
    const { data: redFlags } = await supabase
      .from("timeline_events")
      .select("severity")
      .eq("partner_id", partnerId)
      .eq("event_type", "red_flag")
      .eq("severity", "Critical");

    if (redFlags && redFlags.length > 0) {
      return await this.awardXP(
        userId,
        groupId,
        "toxic_relationship_ended",
        "red_flag",
        partnerId
      );
    }

    return null;
  }

  /**
   * Get user's XP history
   */
  static async getXPHistory(
    userId: string,
    limit: number = 50
  ): Promise<XPTransaction[]> {
    try {
      const { data, error } = await supabase
        .from("xp_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching XP history:", error);
      return [];
    }
  }

  /**
   * Get XP earned in time period
   */
  static async getXPEarned(
    userId: string,
    startDate: Date,
    endDate?: Date
  ): Promise<number> {
    try {
      let query = supabase
        .from("xp_transactions")
        .select("amount")
        .eq("user_id", userId)
        .gte("created_at", startDate.toISOString());

      if (endDate) {
        query = query.lte("created_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.reduce((sum, t) => sum + t.amount, 0) || 0;
    } catch (error) {
      console.error("Error calculating XP earned:", error);
      return 0;
    }
  }

  /**
   * Award XP for adding a new partner
   */
  static async awardPartnerAdded(
    userId: string,
    groupId: string,
    partnerId: string
  ): Promise<LevelUpResult | null> {
    return await this.awardXP(
      userId,
      groupId,
      "partner_added",
      "milestone",
      partnerId
    );
  }

  /**
   * Award XP for updating partner info
   */
  static async awardPartnerInfoUpdated(
    userId: string,
    groupId: string,
    partnerId: string,
    updatedFields: string[]
  ): Promise<LevelUpResult | null> {
    return await this.awardXP(
      userId,
      groupId,
      "partner_info_updated",
      "consistency",
      partnerId,
      { updated_fields: updatedFields }
    );
  }

  /**
   * Award XP for adding partner photo
   */
  static async awardPartnerPhotoAdded(
    userId: string,
    groupId: string,
    partnerId: string
  ): Promise<LevelUpResult | null> {
    return await this.awardXP(
      userId,
      groupId,
      "partner_photo_added",
      "consistency",
      partnerId
    );
  }

  /**
   * Check and apply penalties based on partner metrics
   */
  static async checkPenalties(
    userId: string,
    groupId: string,
    partnerId: string,
    simpIndex?: number,
    lastUpdated?: string
  ): Promise<void> {
    try {
      // High Simp Index penalty (once per partner per month)
      if (simpIndex !== undefined && simpIndex > 500) {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { data: existing } = await supabase
          .from("xp_transactions")
          .select("id")
          .eq("user_id", userId)
          .eq("reason", "high_simp_penalty")
          .eq("related_partner_id", partnerId)
          .gte("created_at", monthStart.toISOString());

        if (!existing || existing.length === 0) {
          await this.awardXP(
            userId,
            groupId,
            "high_simp_penalty",
            "performance",
            partnerId,
            { simp_index: simpIndex }
          );
        }
      }

      // Partner neglect penalty (not updated in 30+ days)
      if (lastUpdated) {
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceUpdate >= 30) {
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);

          const { data: existing } = await supabase
            .from("xp_transactions")
            .select("id")
            .eq("user_id", userId)
            .eq("reason", "partner_neglect")
            .eq("related_partner_id", partnerId)
            .gte("created_at", monthStart.toISOString());

          if (!existing || existing.length === 0) {
            await this.awardXP(
              userId,
              groupId,
              "partner_neglect",
              "consistency",
              partnerId,
              { days_since_update: daysSinceUpdate }
            );
          }
        }
      }
    } catch (error) {
      console.error("Error checking penalties:", error);
    }
  }

  /**
   * Check for improvement rewards (simp index or intimacy)
   */
  static async checkImprovementRewards(
    userId: string,
    groupId: string,
    partnerId: string,
    oldSimpIndex?: number,
    newSimpIndex?: number,
    oldIntimacy?: number,
    newIntimacy?: number
  ): Promise<void> {
    try {
      // Simp Index improvement (reduced by 100+ points)
      if (
        oldSimpIndex !== undefined &&
        newSimpIndex !== undefined &&
        oldSimpIndex - newSimpIndex >= 100
      ) {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { data: existing } = await supabase
          .from("xp_transactions")
          .select("id")
          .eq("user_id", userId)
          .eq("reason", "simp_index_improved")
          .eq("related_partner_id", partnerId)
          .gte("created_at", monthStart.toISOString());

        if (!existing || existing.length === 0) {
          await this.awardXP(
            userId,
            groupId,
            "simp_index_improved",
            "performance",
            partnerId,
            { old_simp: oldSimpIndex, new_simp: newSimpIndex }
          );
        }
      }

      // Intimacy improvement (increased by 2+ points)
      if (
        oldIntimacy !== undefined &&
        newIntimacy !== undefined &&
        newIntimacy - oldIntimacy >= 2
      ) {
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { data: existing } = await supabase
          .from("xp_transactions")
          .select("id")
          .eq("user_id", userId)
          .eq("reason", "intimacy_improved")
          .eq("related_partner_id", partnerId)
          .gte("created_at", monthStart.toISOString());

        if (!existing || existing.length === 0) {
          await this.awardXP(
            userId,
            groupId,
            "intimacy_improved",
            "performance",
            partnerId,
            { old_intimacy: oldIntimacy, new_intimacy: newIntimacy }
          );
        }
      }
    } catch (error) {
      console.error("Error checking improvement rewards:", error);
    }
  }

  /**
   * Check for serial dating penalty
   */
  static async checkSerialDatingPenalty(
    userId: string,
    groupId: string
  ): Promise<void> {
    try {
      // Check for 3+ breakups in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentBreakups } = await supabase
        .from("partners")
        .select("id, graveyard_date")
        .eq("user_id", userId)
        .eq("status", "Graveyard")
        .gte("graveyard_date", thirtyDaysAgo.toISOString());

      if (recentBreakups && recentBreakups.length >= 3) {
        // Check if penalty already applied this month
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const { data: existing } = await supabase
          .from("xp_transactions")
          .select("id")
          .eq("user_id", userId)
          .eq("reason", "serial_dating_penalty")
          .gte("created_at", monthStart.toISOString());

        if (!existing || existing.length === 0) {
          await this.awardXP(
            userId,
            groupId,
            "serial_dating_penalty",
            "performance",
            undefined,
            { breakup_count: recentBreakups.length }
          );
        }
      }
    } catch (error) {
      console.error("Error checking serial dating penalty:", error);
    }
  }
}
