/**
 * Partner Sync Utility - DEPRECATED
 *
 * This file is no longer needed because partners are now GLOBAL.
 * Each partner belongs to a user (not a group), so there's nothing to sync.
 *
 * Old behavior: Partners were duplicated across groups and synced
 * New behavior: One partner per user, visible in all groups they're in
 *
 * Intel data (notes, ratings, red flags) remains group-specific.
 */

// Export empty functions for backwards compatibility (in case any imports remain)
export async function syncNewPartner(): Promise<void> {
  // No-op: Partners are global now
}

export async function findMatchingPartnerIds(partnerId: string): Promise<string[]> {
  return [partnerId]; // Just return the partner itself
}

export async function syncPartnerData(): Promise<void> {
  // No-op: Partners are global now
}

export async function syncTimelineEvent(): Promise<void> {
  // No-op: Timeline events belong to the single global partner
}

export async function syncDeleteTimelineEvent(): Promise<void> {
  // No-op: Timeline events belong to the single global partner
}

export async function copyPartnersToNewGroup(): Promise<void> {
  // No-op: Partners are global and don't need to be copied to groups
}
