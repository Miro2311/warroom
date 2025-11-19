-- Temporär RLS deaktivieren für Development
-- WICHTIG: Nur für lokale Entwicklung! In Production RLS wieder aktivieren!

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE partners DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE sticky_notes DISABLE ROW LEVEL SECURITY;

-- Notiz: Später wieder aktivieren mit:
-- ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;
