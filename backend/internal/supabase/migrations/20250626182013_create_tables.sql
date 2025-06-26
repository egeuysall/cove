CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE groups (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        name TEXT NOT NULL,
                        created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                        created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_owner_access ON groups
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

CREATE TABLE group_members (
                               user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                               group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
                               joined_at TIMESTAMPTZ DEFAULT NOW(),
                               PRIMARY KEY (user_id, group_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY members_can_select ON group_members
  FOR SELECT
                 TO authenticated
                 USING (user_id = auth.uid());

CREATE POLICY members_can_insert ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE TABLE links (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
                       user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
                       url TEXT NOT NULL,
                       title TEXT,
                       comment TEXT,
                       created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE links ENABLE ROW LEVEL SECURITY;

CREATE POLICY members_can_select_links ON links
  FOR SELECT
                 TO authenticated
                 USING (EXISTS (
                 SELECT 1 FROM group_members
                 WHERE group_members.group_id = links.group_id
                 AND group_members.user_id = auth.uid()
                 ));

CREATE POLICY members_can_insert_links ON links
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = links.group_id
      AND group_members.user_id = auth.uid()
  ));

CREATE POLICY members_can_update_own_links ON links
  FOR UPDATE
                        TO authenticated
                        USING (user_id = auth.uid());

CREATE POLICY members_can_delete_own_links ON links
  FOR DELETE
TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE invites (
                         code TEXT PRIMARY KEY,
                         group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
                         used_by UUID REFERENCES auth.users(id),
                         created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY authenticated_can_select_invites ON invites
  FOR SELECT
                 TO authenticated
                 USING (true);

CREATE POLICY authenticated_can_insert_invites ON invites
  FOR INSERT
  TO authenticated
  WITH CHECK (true);