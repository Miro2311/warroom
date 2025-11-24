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

    // Find all partners with same nickname + user_id
    const { data: matchingPartners, error: matchError } = await supabase
      .from("partners")
      .select("id")
      .eq("nickname", partner.nickname)
      .eq("user_id", partner.user_id);

    if (matchError || !matchingPartners) {
      console.error("Error finding matching partners:", matchError);
      return [partnerId];
    }

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
