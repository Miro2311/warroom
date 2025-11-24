import { supabase } from "@/lib/supabase";

/**
 * Partner Sync Utility
 *
 * Partners are like "global profiles" - the same partner (same nickname + user_id)
 * should be synchronized across all groups. This utility handles that sync.
 */

interface PartnerIdentifier {
  nickname: string;
  user_id: string;
}

/**
 * Create a new partner in ALL groups the user is a member of
 * Call this after creating a new partner
 */
export async function syncNewPartner(
  userId: string,
  originalGroupId: string,
  partnerData: {
    id: string;
    nickname: string;
    status: string;
    financial_total: number;
    time_total: number;
    intimacy_score: number;
  }
): Promise<void> {
  console.log("=== syncNewPartner START ===");
  console.log(`syncNewPartner called for "${partnerData.nickname}" (user: ${userId}, group: ${originalGroupId})`);

  try {
    // Find all groups the user is a member of (except the original)
    const { data: memberships, error: memberError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId)
      .neq("group_id", originalGroupId);

    if (memberError) {
      console.error("Error fetching group memberships:", memberError);
      return;
    }

    if (!memberships || memberships.length === 0) {
      console.log("No other groups to sync partner to (user is only in one group)");
      return;
    }

    console.log(`Syncing new partner to ${memberships.length} other groups`);

    // Create the partner in each other group
    for (const membership of memberships) {
      const newPartner = {
        nickname: partnerData.nickname,
        user_id: userId,
        group_id: membership.group_id,
        status: partnerData.status,
        financial_total: partnerData.financial_total,
        time_total: partnerData.time_total,
        intimacy_score: partnerData.intimacy_score,
      };

      const { error: insertError } = await supabase
        .from("partners")
        .insert(newPartner);

      if (insertError) {
        console.error(`Error creating partner in group ${membership.group_id}:`, insertError);
      } else {
        console.log(`Created partner in group ${membership.group_id}`);
      }
    }
  } catch (error) {
    console.error("Error in syncNewPartner:", error);
  }
  console.log("=== syncNewPartner END ===");
}

/**
 * Find all partner IDs that match the same person (same nickname + user_id)
 */
export async function findMatchingPartnerIds(partnerId: string): Promise<string[]> {
  try {
    // Get the partner's identifying info
    const { data: partner, error } = await supabase
      .from("partners")
      .select("nickname, user_id")
      .eq("id", partnerId)
      .single();

    if (error || !partner) {
      console.error("Error finding partner:", error);
      return [partnerId];
    }

    console.log(`Finding matching partners for: "${partner.nickname}" (user: ${partner.user_id})`);

    // Find all partners with same nickname + user_id (case-insensitive)
    const { data: matchingPartners, error: matchError } = await supabase
      .from("partners")
      .select("id, nickname, group_id")
      .eq("user_id", partner.user_id)
      .ilike("nickname", partner.nickname);

    if (matchError || !matchingPartners) {
      console.error("Error finding matching partners:", matchError);
      return [partnerId];
    }

    console.log(`Found ${matchingPartners.length} matching partners:`, matchingPartners);

    return matchingPartners.map(p => p.id);
  } catch (error) {
    console.error("Error in findMatchingPartnerIds:", error);
    return [partnerId];
  }
}

/**
 * Sync partner core data across all matching partners
 * Call this after updating partner details (nickname, status, time_total, intimacy_score, etc.)
 */
export async function syncPartnerData(
  partnerId: string,
  updates: {
    nickname?: string;
    status?: string;
    time_total?: number;
    intimacy_score?: number;
    cause_of_death?: string | null;
    cause_of_death_custom?: string | null;
    graveyard_date?: string | null;
    last_updated_at?: string;
  }
): Promise<void> {
  try {
    const partnerIds = await findMatchingPartnerIds(partnerId);

    // If nickname is being changed, we need to update all matching partners first
    // before we can no longer find them by the old nickname
    for (const pid of partnerIds) {
      if (pid === partnerId) continue; // Skip the original (already updated)

      const { error } = await supabase
        .from("partners")
        .update(updates)
        .eq("id", pid);

      if (error) {
        console.error(`Error syncing partner ${pid}:`, error);
      }
    }

    console.log(`Synced partner data to ${partnerIds.length} partners`);
  } catch (error) {
    console.error("Error in syncPartnerData:", error);
  }
}

/**
 * Sync a new timeline event to all matching partners
 * Call this after creating a timeline event
 */
export async function syncTimelineEvent(
  originalPartnerId: string,
  eventData: {
    event_type: string;
    title: string;
    description?: string | null;
    event_date: string;
    amount?: number | null;
    partner_amount?: number | null;
    category?: string | null;
    severity?: string | null;
    intimacy_change?: number | null;
  }
): Promise<void> {
  try {
    const partnerIds = await findMatchingPartnerIds(originalPartnerId);

    for (const pid of partnerIds) {
      if (pid === originalPartnerId) continue; // Skip the original (already created)

      const { error } = await supabase
        .from("timeline_events")
        .insert({
          partner_id: pid,
          ...eventData,
        });

      if (error) {
        console.error(`Error syncing timeline event to partner ${pid}:`, error);
      }
    }

    console.log(`Synced timeline event to ${partnerIds.length - 1} other partners`);
  } catch (error) {
    console.error("Error in syncTimelineEvent:", error);
  }
}

/**
 * Delete a timeline event from all matching partners
 * Uses the event's unique identifiers (title, event_date, event_type) to find matches
 */
export async function syncDeleteTimelineEvent(
  originalPartnerId: string,
  eventData: {
    title: string;
    event_date: string;
    event_type: string;
  }
): Promise<void> {
  try {
    const partnerIds = await findMatchingPartnerIds(originalPartnerId);

    for (const pid of partnerIds) {
      if (pid === originalPartnerId) continue; // Skip the original (already deleted)

      const { error } = await supabase
        .from("timeline_events")
        .delete()
        .eq("partner_id", pid)
        .eq("title", eventData.title)
        .eq("event_date", eventData.event_date)
        .eq("event_type", eventData.event_type);

      if (error) {
        console.error(`Error deleting synced timeline event from partner ${pid}:`, error);
      }
    }

    console.log(`Deleted synced timeline event from ${partnerIds.length - 1} other partners`);
  } catch (error) {
    console.error("Error in syncDeleteTimelineEvent:", error);
  }
}

/**
 * Copy all user's partners to a new group when they join it
 * Call this after a user joins a new group
 */
export async function copyPartnersToNewGroup(
  userId: string,
  newGroupId: string
): Promise<void> {
  console.log("=== copyPartnersToNewGroup START ===");
  console.log(`Copying partners for user ${userId} to new group ${newGroupId}`);

  try {
    // Get all partners from user's other groups
    const { data: existingPartners, error: fetchError } = await supabase
      .from("partners")
      .select("*")
      .eq("user_id", userId)
      .neq("group_id", newGroupId);

    if (fetchError) {
      console.error("Error fetching existing partners:", fetchError);
      return;
    }

    if (!existingPartners || existingPartners.length === 0) {
      console.log("No existing partners to copy");
      return;
    }

    // Get unique partners by nickname (in case same partner exists in multiple groups)
    const uniquePartners = new Map();
    for (const partner of existingPartners) {
      const key = partner.nickname.toLowerCase();
      if (!uniquePartners.has(key)) {
        uniquePartners.set(key, partner);
      }
    }

    console.log(`Found ${uniquePartners.size} unique partners to copy`);

    // Copy each unique partner to the new group
    for (const [, partner] of uniquePartners) {
      const newPartner = {
        nickname: partner.nickname,
        user_id: userId,
        group_id: newGroupId,
        status: partner.status,
        financial_total: partner.financial_total,
        time_total: partner.time_total,
        intimacy_score: partner.intimacy_score,
        cause_of_death: partner.cause_of_death,
        cause_of_death_custom: partner.cause_of_death_custom,
        graveyard_date: partner.graveyard_date,
      };

      const { data: createdPartner, error: insertError } = await supabase
        .from("partners")
        .insert(newPartner)
        .select()
        .single();

      if (insertError) {
        console.error(`Error copying partner "${partner.nickname}":`, insertError);
      } else {
        console.log(`Copied partner "${partner.nickname}" to new group`);

        // Also copy timeline events for this partner
        if (createdPartner) {
          await copyTimelineEventsToPartner(partner.id, createdPartner.id);
        }
      }
    }

    console.log("=== copyPartnersToNewGroup END ===");
  } catch (error) {
    console.error("Error in copyPartnersToNewGroup:", error);
  }
}

/**
 * Copy all timeline events from one partner to another
 */
async function copyTimelineEventsToPartner(
  sourcePartnerId: string,
  targetPartnerId: string
): Promise<void> {
  try {
    const { data: events, error: fetchError } = await supabase
      .from("timeline_events")
      .select("*")
      .eq("partner_id", sourcePartnerId);

    if (fetchError || !events || events.length === 0) {
      return;
    }

    for (const event of events) {
      const { error: insertError } = await supabase
        .from("timeline_events")
        .insert({
          partner_id: targetPartnerId,
          event_type: event.event_type,
          title: event.title,
          description: event.description,
          event_date: event.event_date,
          amount: event.amount,
          partner_amount: event.partner_amount,
          category: event.category,
          severity: event.severity,
          intimacy_change: event.intimacy_change,
          metadata: event.metadata,
        });

      if (insertError) {
        console.error(`Error copying timeline event:`, insertError);
      }
    }

    console.log(`Copied ${events.length} timeline events to new partner`);
  } catch (error) {
    console.error("Error copying timeline events:", error);
  }
}
