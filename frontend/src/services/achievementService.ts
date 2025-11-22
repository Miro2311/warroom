import { supabase } from "@/lib/supabase";
import { Achievement } from "@/types/xp";
import { XPService } from "./xpService";

export interface AchievementDefinition {
  type: string;
  name: string;
  description: string;
  xpReward: number;
  checkCondition: (userId: string, groupId: string) => Promise<boolean>;
}

export class AchievementService {
  private static achievements: AchievementDefinition[] = [
    {
      type: "first_partner",
      name: "First Steps",
      description: "Add your first partner to the system",
      xpReward: 50,
      checkCondition: async (userId: string) => {
        const { data } = await supabase
          .from("partners")
          .select("id")
          .eq("user_id", userId);
        return (data?.length || 0) === 1;
      },
    },
    {
      type: "five_partners",
      name: "Player Status",
      description: "Reach 5 partners in your system",
      xpReward: 200,
      checkCondition: async (userId: string) => {
        const { data } = await supabase
          .from("partners")
          .select("id")
          .eq("user_id", userId);
        return (data?.length || 0) >= 5;
      },
    },
    {
      type: "ten_partners",
      name: "Casanova",
      description: "Reach 10 partners in your system",
      xpReward: 500,
      checkCondition: async (userId: string) => {
        const { data } = await supabase
          .from("partners")
          .select("id")
          .eq("user_id", userId);
        return (data?.length || 0) >= 10;
      },
    },
    {
      type: "first_exclusive",
      name: "Commitment Issues Solved",
      description: "Get your first exclusive relationship",
      xpReward: 150,
      checkCondition: async (userId: string) => {
        const { data } = await supabase
          .from("partners")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "Exclusive");
        return (data?.length || 0) >= 1;
      },
    },
    {
      type: "low_simp_master",
      name: "Efficiency Expert",
      description: "Maintain Simp Index under 100 on 3 different partners",
      xpReward: 300,
      checkCondition: async (userId: string) => {
        const { data } = await supabase
          .from("partners")
          .select("simp_index")
          .eq("user_id", userId)
          .not("status", "eq", "Graveyard");

        const lowSimpCount =
          data?.filter((p: any) => p.simp_index && p.simp_index < 100).length || 0;
        return lowSimpCount >= 3;
      },
    },
    {
      type: "intimacy_champion",
      name: "Intimacy Champion",
      description: "Reach intimacy score of 10 with a partner",
      xpReward: 250,
      checkCondition: async (userId: string) => {
        const { data } = await supabase
          .from("partners")
          .select("intimacy_score")
          .eq("user_id", userId)
          .eq("intimacy_score", 10);
        return (data?.length || 0) >= 1;
      },
    },
    {
      type: "data_enthusiast",
      name: "Data Enthusiast",
      description: "Log 50 timeline events",
      xpReward: 200,
      checkCondition: async (userId: string) => {
        const { data: partners } = await supabase
          .from("partners")
          .select("id")
          .eq("user_id", userId);

        if (!partners || partners.length === 0) return false;

        const partnerIds = partners.map((p) => p.id);
        const { count } = await supabase
          .from("timeline_events")
          .select("id", { count: "exact", head: true })
          .in("partner_id", partnerIds);

        return (count || 0) >= 50;
      },
    },
    {
      type: "weekly_warrior",
      name: "Weekly Warrior",
      description: "Earn the weekly update bonus 4 times",
      xpReward: 150,
      checkCondition: async (userId: string) => {
        const { data } = await supabase
          .from("xp_transactions")
          .select("id")
          .eq("user_id", userId)
          .eq("reason", "weekly_update_bonus");
        return (data?.length || 0) >= 4;
      },
    },
    {
      type: "streak_legend",
      name: "Streak Legend",
      description: "Maintain a 30-day activity streak",
      xpReward: 500,
      checkCondition: async (userId: string) => {
        const { data } = await supabase
          .from("users")
          .select("streak_count")
          .eq("id", userId)
          .maybeSingle();
        return (data?.streak_count || 0) >= 30;
      },
    },
    {
      type: "red_flag_detector",
      name: "Red Flag Detector",
      description: "Document 10 red flags",
      xpReward: 150,
      checkCondition: async (userId: string) => {
        const { data: partners } = await supabase
          .from("partners")
          .select("id")
          .eq("user_id", userId);

        if (!partners || partners.length === 0) return false;

        const partnerIds = partners.map((p) => p.id);
        const { count } = await supabase
          .from("timeline_events")
          .select("id", { count: "exact", head: true })
          .in("partner_id", partnerIds)
          .eq("event_type", "red_flag");

        return (count || 0) >= 10;
      },
    },
    {
      type: "graveyard_reaper",
      name: "Graveyard Reaper",
      description: "Move 5 partners to the graveyard",
      xpReward: 100,
      checkCondition: async (userId: string) => {
        const { data } = await supabase
          .from("partners")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "Graveyard");
        return (data?.length || 0) >= 5;
      },
    },
    {
      type: "phoenix",
      name: "Phoenix",
      description: "Successfully revive a relationship from the graveyard",
      xpReward: 200,
      checkCondition: async (userId: string, groupId: string) => {
        const { data } = await supabase
          .from("xp_transactions")
          .select("id")
          .eq("user_id", userId)
          .eq("reason", "second_chance");
        return (data?.length || 0) >= 1;
      },
    },
    {
      type: "social_butterfly",
      name: "Social Butterfly",
      description: "Create 20 sticky notes/roasts",
      xpReward: 100,
      checkCondition: async (userId: string) => {
        const { data } = await supabase
          .from("xp_transactions")
          .select("id")
          .eq("user_id", userId)
          .eq("reason", "sticky_note_created");
        return (data?.length || 0) >= 20;
      },
    },
    {
      type: "validator",
      name: "The Validator",
      description: "Validate 10 peer actions",
      xpReward: 150,
      checkCondition: async (userId: string) => {
        const { data } = await supabase
          .from("xp_transactions")
          .select("id")
          .eq("user_id", userId)
          .eq("reason", "peer_validation");
        return (data?.length || 0) >= 10;
      },
    },
    {
      type: "level_10",
      name: "Veteran",
      description: "Reach Level 10",
      xpReward: 1000,
      checkCondition: async (userId: string) => {
        const { data } = await supabase
          .from("users")
          .select("level")
          .eq("id", userId)
          .maybeSingle();
        return (data?.level || 0) >= 10;
      },
    },
  ];

  /**
   * Check if user has unlocked a specific achievement
   */
  static async hasAchievement(
    userId: string,
    achievementType: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("id")
        .eq("user_id", userId)
        .eq("achievement_type", achievementType)
        .limit(1);

      if (error) {
        console.error("Error checking achievement:", error);
        console.error("Error details:", { code: error.code, message: error.message, details: error.details });
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error("Exception checking achievement:", error);
      return false;
    }
  }

  /**
   * Unlock an achievement for a user
   */
  static async unlockAchievement(
    userId: string,
    groupId: string,
    achievementDef: AchievementDefinition
  ): Promise<Achievement | null> {
    try {
      // Check if already unlocked
      const hasIt = await this.hasAchievement(userId, achievementDef.type);
      if (hasIt) return null;

      // Create achievement record
      const { data: achievement, error: achievementError } = await supabase
        .from("achievements")
        .insert({
          user_id: userId,
          achievement_type: achievementDef.type,
          achievement_name: achievementDef.name,
          achievement_description: achievementDef.description,
          xp_reward: achievementDef.xpReward,
        })
        .select()
        .single();

      if (achievementError) {
        console.error("Error unlocking achievement:", achievementError);
        return null;
      }

      // Award XP
      await XPService.awardXP(
        userId,
        groupId,
        "achievement_unlocked",
        "achievement",
        undefined,
        {
          achievement_type: achievementDef.type,
          achievement_name: achievementDef.name,
        }
      );

      return achievement;
    } catch (error) {
      console.error("Error unlocking achievement:", error);
      return null;
    }
  }

  /**
   * Check all achievements for a user
   */
  static async checkAchievements(
    userId: string,
    groupId: string
  ): Promise<Achievement[]> {
    const unlockedAchievements: Achievement[] = [];

    for (const achievementDef of this.achievements) {
      try {
        // Skip if already unlocked
        const hasIt = await this.hasAchievement(userId, achievementDef.type);
        if (hasIt) continue;

        // Check condition
        const conditionMet = await achievementDef.checkCondition(userId, groupId);

        if (conditionMet) {
          const achievement = await this.unlockAchievement(
            userId,
            groupId,
            achievementDef
          );
          if (achievement) {
            unlockedAchievements.push(achievement);
          }
        }
      } catch (error) {
        console.error(
          `Error checking achievement ${achievementDef.type}:`,
          error
        );
      }
    }

    return unlockedAchievements;
  }

  /**
   * Get all achievements for a user
   */
  static async getUserAchievements(userId: string): Promise<Achievement[]> {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)
        .order("unlocked_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching achievements:", error);
      return [];
    }
  }

  /**
   * Get all available achievements (for progress tracking)
   */
  static getAllAchievementDefinitions(): AchievementDefinition[] {
    return this.achievements;
  }

  /**
   * Get achievement progress for a user
   */
  static async getAchievementProgress(
    userId: string,
    groupId: string
  ): Promise<
    Array<{
      definition: AchievementDefinition;
      unlocked: boolean;
      unlockedAt?: string;
    }>
  > {
    const userAchievements = await this.getUserAchievements(userId);
    const unlockedMap = new Map(
      userAchievements.map((a) => [a.achievement_type, a])
    );

    return this.achievements.map((def) => ({
      definition: def,
      unlocked: unlockedMap.has(def.type),
      unlockedAt: unlockedMap.get(def.type)?.unlocked_at,
    }));
  }
}
