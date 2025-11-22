-- XP System Database Schema
-- Run this after your existing database setup

-- XP Transaction History
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'milestone',
    'consistency',
    'social',
    'performance',
    'red_flag',
    'achievement'
  )),
  related_partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  xp_reward INTEGER NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Peer Validations (for actions that need group approval)
CREATE TABLE IF NOT EXISTS peer_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  related_partner_id UUID REFERENCES partners(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  validators JSONB DEFAULT '[]', -- Array of user IDs who validated
  required_validations INTEGER DEFAULT 2,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- User Stats Extension (for streaks and tracking)
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_xp_earned INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_validations_user ON peer_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_validations_status ON peer_validations(status);

-- RLS Policies
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_validations ENABLE ROW LEVEL SECURITY;

-- XP Transactions: Users can view their own and their group members'
CREATE POLICY "Users can view xp_transactions in their groups"
  ON xp_transactions FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert xp_transactions"
  ON xp_transactions FOR INSERT
  WITH CHECK (true);

-- Achievements: Users can view their own
CREATE POLICY "Users can view their own achievements"
  ON achievements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert achievements"
  ON achievements FOR INSERT
  WITH CHECK (true);

-- Peer Validations: Group members can view and update
CREATE POLICY "Group members can view peer_validations"
  ON peer_validations FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create peer_validations"
  ON peer_validations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Group members can update peer_validations"
  ON peer_validations FOR UPDATE
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- Function to automatically update user level when XP changes
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level formula: level = floor(xp / 1000) + 1
  -- Level 1: 0-999 XP, Level 2: 1000-1999 XP, etc.
  RETURN FLOOR(xp / 1000.0) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to add XP and auto-level user
CREATE OR REPLACE FUNCTION add_xp_to_user(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN) AS $$
DECLARE
  v_old_xp INTEGER;
  v_old_level INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Get current XP and level
  SELECT current_xp, level INTO v_old_xp, v_old_level
  FROM users
  WHERE id = p_user_id;

  -- Calculate new XP (minimum 0)
  v_new_xp := GREATEST(0, v_old_xp + p_amount);

  -- Calculate new level
  v_new_level := calculate_level(v_new_xp);

  -- Update user
  UPDATE users
  SET
    current_xp = v_new_xp,
    level = v_new_level,
    total_xp_earned = total_xp_earned + GREATEST(0, p_amount)
  WHERE id = p_user_id;

  -- Return results
  RETURN QUERY SELECT v_new_xp, v_new_level, (v_new_level > v_old_level);
END;
$$ LANGUAGE plpgsql;

-- Function to check and update daily streak
CREATE OR REPLACE FUNCTION update_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_new_streak INTEGER;
BEGIN
  SELECT last_activity_date, streak_count
  INTO v_last_activity, v_current_streak
  FROM users
  WHERE id = p_user_id;

  -- Check if activity is today
  IF v_last_activity = CURRENT_DATE THEN
    -- Already updated today
    RETURN v_current_streak;
  END IF;

  -- Check if streak continues (yesterday)
  IF v_last_activity = CURRENT_DATE - INTERVAL '1 day' THEN
    v_new_streak := v_current_streak + 1;
  ELSE
    -- Streak broken
    v_new_streak := 1;
  END IF;

  -- Update user
  UPDATE users
  SET
    last_activity_date = CURRENT_DATE,
    streak_count = v_new_streak
  WHERE id = p_user_id;

  RETURN v_new_streak;
END;
$$ LANGUAGE plpgsql;
