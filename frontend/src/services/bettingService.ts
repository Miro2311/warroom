import { supabase } from "@/lib/supabase";
import type {
  Bet,
  BetMaster,
  BetMasterVote,
  BetOdds,
  Wager,
  BetTransaction,
  BetCategory,
  BetType,
} from "@/types";

// =============================================
// BET MASTER
// =============================================

export async function getBetMaster(groupId: string): Promise<BetMaster | null> {
  const { data, error } = await supabase
    .from("group_bet_master")
    .select(`
      *,
      user:user_id(*)
    `)
    .eq("group_id", groupId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // No bet master yet
    throw error;
  }

  return data;
}

export async function voteForBetMaster(
  groupId: string,
  candidateId: string
): Promise<BetMasterVote> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  // Check if already voted
  const { data: existing, error: existingError } = await supabase
    .from("bet_master_votes")
    .select()
    .eq("group_id", groupId)
    .eq("voter_id", user.user.id)
    .maybeSingle();

  if (existingError) {
    console.error("Error checking existing vote:", existingError);
    throw new Error(`Failed to check existing vote: ${existingError.message}`);
  }

  if (existing) {
    // Update vote
    const { data, error } = await supabase
      .from("bet_master_votes")
      .update({ candidate_id: candidateId })
      .eq("id", existing.id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("Error updating vote:", error);
      throw new Error(`Failed to update vote: ${error.message}`);
    }
    if (!data) {
      throw new Error("Failed to update vote: No data returned");
    }
    return data;
  }

  // Create new vote
  const { data, error } = await supabase
    .from("bet_master_votes")
    .insert({
      group_id: groupId,
      voter_id: user.user.id,
      candidate_id: candidateId,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating vote:", error);
    throw new Error(`Failed to create vote: ${error.message}`);
  }
  return data;
}

export async function getBetMasterVotes(
  groupId: string
): Promise<BetMasterVote[]> {
  const { data, error } = await supabase
    .from("bet_master_votes")
    .select("*")
    .eq("group_id", groupId);

  if (error) throw error;
  return data || [];
}

export async function electBetMaster(
  groupId: string,
  userId: string
): Promise<BetMaster> {
  // Count votes
  const { count, error: countError } = await supabase
    .from("bet_master_votes")
    .select("*", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("candidate_id", userId);

  if (countError) {
    console.error("Error counting votes:", countError);
    throw new Error(`Failed to count votes: ${countError.message}`);
  }

  // Check if bet master already exists
  const { data: existing, error: existingError } = await supabase
    .from("group_bet_master")
    .select()
    .eq("group_id", groupId)
    .maybeSingle();

  if (existingError) {
    console.error("Error checking existing bet master:", existingError);
    throw new Error(`Failed to check existing bet master: ${existingError.message}`);
  }

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("group_bet_master")
      .update({
        user_id: userId,
        total_votes: count || 0,
        elected_at: new Date().toISOString(),
      })
      .eq("group_id", groupId)
      .select("*")
      .single();

    if (error) {
      console.error("Error updating bet master:", error);
      throw new Error(`Failed to update bet master: ${error.message}`);
    }
    return data;
  }

  // Create new
  const { data, error } = await supabase
    .from("group_bet_master")
    .insert({
      group_id: groupId,
      user_id: userId,
      total_votes: count || 0,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating bet master:", error);
    throw new Error(`Failed to create bet master: ${error.message}`);
  }
  return data;
}

// =============================================
// BETS
// =============================================

export async function getBets(groupId: string): Promise<Bet[]> {
  const { data, error } = await supabase
    .from("bets")
    .select(`
      *,
      creator:creator_id(id, username, avatar_url, level),
      target_user:target_user_id(id, username, avatar_url, level),
      resolver:resolved_by(id, username, avatar_url)
    `)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getBet(betId: string): Promise<Bet | null> {
  const { data, error } = await supabase
    .from("bets")
    .select("*")
    .eq("id", betId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
}

export async function createBet(params: {
  groupId: string;
  targetUserId: string;
  title: string;
  description?: string;
  betType: BetType;
  category: BetCategory;
  deadline: string;
  stakeAmount: number;
  outcomeType?: "boolean" | "number" | "date";
}): Promise<Bet> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("bets")
    .insert({
      group_id: params.groupId,
      creator_id: user.user.id,
      target_user_id: params.targetUserId,
      title: params.title,
      description: params.description,
      bet_type: params.betType,
      category: params.category,
      deadline: params.deadline,
      stake_amount: params.stakeAmount,
      outcome_type: params.outcomeType || "boolean",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function lockBet(betId: string): Promise<Bet> {
  const { data, error } = await supabase
    .from("bets")
    .update({ status: "locked" })
    .eq("id", betId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function resolveBet(
  betId: string,
  winningOutcome: any,
  resolutionNotes?: string
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { error } = await supabase.rpc("resolve_bet", {
    p_bet_id: betId,
    p_resolved_by: user.user.id,
    p_winning_outcome: winningOutcome,
    p_resolution_notes: resolutionNotes,
  });

  if (error) throw error;
}

export async function getBetSettlement(betId: string) {
  const { data, error } = await supabase.rpc("get_bet_settlement", {
    p_bet_id: betId,
  });

  if (error) throw error;
  return data || [];
}

// =============================================
// SETTLEMENTS
// =============================================

export async function getGroupSettlements(groupId: string) {
  const { data, error } = await supabase
    .from("settlements")
    .select(`
      *,
      payer:payer_id(id, username, avatar_url),
      receiver:receiver_id(id, username, avatar_url),
      bet:bet_id(id, title, category)
    `)
    .eq("group_id", groupId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function markSettlementAsPaid(settlementId: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("settlements")
    .update({
      status: "paid",
      marked_paid_at: new Date().toISOString(),
      marked_paid_by: user.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", settlementId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================
// ODDS
// =============================================

export async function getBetOdds(betId: string): Promise<BetOdds[]> {
  const { data, error } = await supabase
    .from("bet_odds")
    .select("*")
    .eq("bet_id", betId);

  if (error) throw error;
  return data || [];
}

export async function calculateAndStoreBetOdds(
  betId: string,
  userId: string,
  category: BetCategory
): Promise<BetOdds> {
  // Call the database function to calculate odds
  const { data: oddsData, error: calcError } = await supabase.rpc(
    "calculate_bet_odds",
    {
      p_user_id: userId,
      p_category: category,
    }
  );

  if (calcError) throw calcError;

  const odds = Array.isArray(oddsData) ? oddsData[0] : oddsData;

  // Store the calculated odds
  const { data, error } = await supabase
    .from("bet_odds")
    .upsert({
      bet_id: betId,
      user_id: userId,
      odds_success: odds.odds_success,
      odds_failure: odds.odds_failure,
      confidence_score: odds.confidence,
      calculated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

// =============================================
// WAGERS
// =============================================

export async function getWagers(betId: string): Promise<Wager[]> {
  const { data, error } = await supabase
    .from("wagers")
    .select("*")
    .eq("bet_id", betId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getUserWagers(userId: string): Promise<Wager[]> {
  const { data, error } = await supabase
    .from("wagers")
    .select(`
      *,
      bet:bet_id(
        id,
        title,
        description,
        category,
        status,
        deadline,
        total_pot
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function placeWager(
  betId: string,
  amount: number,
  prediction: any,
  odds: number
): Promise<Wager> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data, error } = await supabase.rpc("place_wager", {
    p_bet_id: betId,
    p_user_id: user.user.id,
    p_amount: amount,
    p_prediction: prediction,
    p_odds: odds,
  });

  if (error) throw error;

  // Fetch the created wager
  const { data: wager, error: fetchError } = await supabase
    .from("wagers")
    .select("*")
    .eq("id", data)
    .single();

  if (fetchError) throw fetchError;
  return wager;
}

// =============================================
// TRANSACTIONS
// =============================================

export async function getUserTransactions(
  userId: string,
  limit = 50
): Promise<BetTransaction[]> {
  const { data, error } = await supabase
    .from("bet_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getUserBalance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("users")
    .select("bet_currency")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data?.bet_currency || 0;
}

export async function getGroupLeaderboard(groupId: string, limit = 10) {
  // Get all group members with their betting currency and stats
  const { data, error } = await supabase
    .from("group_members")
    .select(`
      user_id,
      users!inner(
        id,
        username,
        avatar_url,
        level,
        bet_currency
      )
    `)
    .eq("group_id", groupId)
    .order("users(bet_currency)", { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Calculate additional stats for each user
  const leaderboardWithStats = await Promise.all(
    (data || []).map(async (member: any) => {
      const user = member.users;

      // Get user's wager stats
      const { data: wagers } = await supabase
        .from("wagers")
        .select("status, amount, payout_amount")
        .eq("user_id", user.id);

      const wonWagers = wagers?.filter((w) => w.status === "won") || [];
      const lostWagers = wagers?.filter((w) => w.status === "lost") || [];
      const totalWon = wonWagers.reduce((sum, w) => sum + (w.payout_amount || 0), 0);
      const totalLost = lostWagers.reduce((sum, w) => sum + w.amount, 0);
      const netProfit = totalWon - totalLost;
      const winRate = wagers && wagers.length > 0
        ? Math.round((wonWagers.length / wagers.length) * 100)
        : 0;

      return {
        ...user,
        totalWon,
        totalLost,
        netProfit,
        winRate,
        totalBets: wagers?.length || 0,
      };
    })
  );

  return leaderboardWithStats;
}

// =============================================
// WEEKLY SYSTEM BETS
// =============================================

export async function generateWeeklyBets(groupId: string): Promise<Bet[]> {
  // This would contain logic to auto-generate 3 weekly bets
  // For now, just a placeholder
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // Check if already generated this week
  const { data: existing } = await supabase
    .from("weekly_system_bets")
    .select()
    .eq("group_id", groupId)
    .gte("week_start", weekStart.toISOString())
    .single();

  if (existing) {
    // Already generated
    return [];
  }

  // Get group members
  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  if (!members || members.length === 0) return [];

  // Generate 3 random bets
  const betTemplates = [
    {
      title: "First Date This Week",
      category: "first_date" as BetCategory,
      description: "Will {user} go on a first date this week?",
    },
    {
      title: "Intimacy Milestone",
      category: "sex" as BetCategory,
      description: "Will {user} reach a new intimacy level?",
    },
    {
      title: "Big Spender",
      category: "money_spent" as BetCategory,
      description: "Will {user} spend over $100 on dates this week?",
    },
  ];

  const generatedBets: Bet[] = [];

  for (let i = 0; i < Math.min(3, betTemplates.length); i++) {
    const template = betTemplates[i];
    const randomMember = members[Math.floor(Math.random() * members.length)];

    try {
      const bet = await createBet({
        groupId,
        targetUserId: randomMember.user_id,
        title: template.title,
        description: template.description.replace(
          "{user}",
          randomMember.user_id
        ),
        betType: "system",
        category: template.category,
        deadline: weekEnd.toISOString(),
        stakeAmount: 100,
      });

      generatedBets.push(bet);
    } catch (error) {
      console.error("Failed to create weekly bet:", error);
    }
  }

  // Record that we generated this week
  await supabase.from("weekly_system_bets").insert({
    group_id: groupId,
    week_start: weekStart.toISOString(),
    week_end: weekEnd.toISOString(),
    bets_generated: generatedBets.length,
  });

  return generatedBets;
}
