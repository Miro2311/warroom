import { useState, useEffect } from "react";
import { XPService } from "@/services/xpService";
import { AchievementService } from "@/services/achievementService";
import { XPTransaction, Achievement, LevelUpResult } from "@/types/xp";
import { useStore } from "@/store/useStore";

export function useXP() {
  const { user, currentGroupId } = useStore();
  const [xpHistory, setXpHistory] = useState<XPTransaction[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);

  // Load XP history
  const loadXPHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const history = await XPService.getXPHistory(user.id);
      setXpHistory(history);
    } catch (error) {
      console.error("Error loading XP history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load achievements
  const loadAchievements = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userAchievements = await AchievementService.getUserAchievements(
        user.id
      );
      setAchievements(userAchievements);
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check for new achievements
  const checkAchievements = async () => {
    if (!user || !currentGroupId) return;
    try {
      const newAchievements = await AchievementService.checkAchievements(
        user.id,
        currentGroupId
      );
      if (newAchievements.length > 0) {
        setAchievements((prev) => [...newAchievements, ...prev]);
        return newAchievements;
      }
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
    return [];
  };

  // Update streak
  const updateStreak = async () => {
    if (!user) return 0;
    try {
      return await XPService.updateStreak(user.id);
    } catch (error) {
      console.error("Error updating streak:", error);
      return 0;
    }
  };

  useEffect(() => {
    if (user) {
      loadXPHistory();
      loadAchievements();
    }
  }, [user?.id]);

  return {
    xpHistory,
    achievements,
    loading,
    loadXPHistory,
    loadAchievements,
    checkAchievements,
    updateStreak,
  };
}
