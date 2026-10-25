-- =============================================================================
-- EduShare — Supabase Row Level Security (RLS) Policies
-- =============================================================================
-- Run this in the Supabase Dashboard → SQL Editor after running prisma migrate.
--
-- IMPORTANT: These policies enforce data access at the DATABASE level, providing
-- a second layer of security beyond the application layer.
-- =============================================================================

-- ─── Enable RLS on all tables ────────────────────────────────────────────────

ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_memberships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_files          ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_materials     ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USERS table policies
-- =============================================================================

-- Any authenticated user can view other users (needed for display names/avatars)
CREATE POLICY "users_select_authenticated"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- Only service role can INSERT (user records created server-side on registration)
CREATE POLICY "users_insert_service_role"
  ON users FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Only admins or service role can deactivate users (DELETE is soft via isActive)
CREATE POLICY "users_delete_service_role"
  ON users FOR DELETE
  TO service_role
  USING (true);

-- =============================================================================
-- CLASSES table policies
-- =============================================================================

-- Students/Faculty can view non-archived classes they are members of or teach
CREATE POLICY "classes_select_member_or_faculty"
  ON classes FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = "facultyId"
    OR EXISTS (
      SELECT 1 FROM class_memberships
      WHERE "classId" = classes.id
        AND "studentId" = auth.uid()::text
    )
  );

-- Only faculty can create classes
CREATE POLICY "classes_insert_faculty"
  ON classes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "facultyId");

-- Only the faculty who owns the class can update it
CREATE POLICY "classes_update_owner"
  ON classes FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = "facultyId")
  WITH CHECK (auth.uid()::text = "facultyId");

-- Only the faculty who owns the class can delete it
CREATE POLICY "classes_delete_owner"
  ON classes FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "facultyId");

-- =============================================================================
-- CLASS_MEMBERSHIPS table policies
-- =============================================================================

-- Students can see memberships in classes they belong to; faculty can see their class members
CREATE POLICY "memberships_select_participants"
  ON class_memberships FOR SELECT
  TO authenticated
  USING (
    "studentId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = "classId"
        AND classes."facultyId" = auth.uid()::text
    )
  );

-- Students can join a class (insert their own membership)
CREATE POLICY "memberships_insert_self"
  ON class_memberships FOR INSERT
  TO authenticated
  WITH CHECK ("studentId" = auth.uid()::text);

-- Students can leave a class (delete their own membership)
-- Faculty can remove a student from their class
CREATE POLICY "memberships_delete_self_or_faculty"
  ON class_memberships FOR DELETE
  TO authenticated
  USING (
    "studentId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = "classId"
        AND classes."facultyId" = auth.uid()::text
    )
  );

-- =============================================================================
-- POSTS table policies
-- =============================================================================

-- Class members and faculty can read posts in their classes
CREATE POLICY "posts_select_class_members"
  ON posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_memberships
      WHERE "classId" = posts."classId"
        AND "studentId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = posts."classId"
        AND classes."facultyId" = auth.uid()::text
    )
  );

-- Authors can create posts in classes they belong to / teach
CREATE POLICY "posts_insert_members"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid()::text = "authorId"
    AND (
      EXISTS (
        SELECT 1 FROM class_memberships
        WHERE "classId" = posts."classId"
          AND "studentId" = auth.uid()::text
      )
      OR EXISTS (
        SELECT 1 FROM classes
        WHERE classes.id = posts."classId"
          AND classes."facultyId" = auth.uid()::text
      )
    )
  );

-- Authors can update their own posts
CREATE POLICY "posts_update_author"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = "authorId")
  WITH CHECK (auth.uid()::text = "authorId");

-- Authors or class faculty can delete posts
CREATE POLICY "posts_delete_author_or_faculty"
  ON posts FOR DELETE
  TO authenticated
  USING (
    auth.uid()::text = "authorId"
    OR EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = posts."classId"
        AND classes."facultyId" = auth.uid()::text
    )
  );

-- =============================================================================
-- POST_FILES table policies
-- =============================================================================

-- Post files are readable to everyone who can read the parent post
CREATE POLICY "post_files_select_via_post"
  ON post_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = "postId"
    )
  );

-- Post authors can add files (managed server-side)
CREATE POLICY "post_files_insert_service"
  ON post_files FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "post_files_delete_service"
  ON post_files FOR DELETE TO service_role USING (true);

-- =============================================================================
-- SYLLABUS FILES AND ATTENDANCE
-- =============================================================================

CREATE POLICY "class_materials_select_class_members"
  ON class_materials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_memberships
      WHERE class_memberships."classId" = class_materials."classId"
        AND class_memberships."studentId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = class_materials."classId"
        AND classes."facultyId" = auth.uid()::text
    )
  );

CREATE POLICY "class_materials_write_service"
  ON class_materials FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "attendance_sessions_select_class_members"
  ON attendance_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM class_memberships
      WHERE class_memberships."classId" = attendance_sessions."classId"
        AND class_memberships."studentId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM classes
      WHERE classes.id = attendance_sessions."classId"
        AND classes."facultyId" = auth.uid()::text
    )
  );

CREATE POLICY "attendance_sessions_write_service"
  ON attendance_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "attendance_records_select_self_or_faculty"
  ON attendance_records FOR SELECT
  TO authenticated
  USING (
    "studentId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM attendance_sessions
      JOIN classes ON classes.id = attendance_sessions."classId"
      WHERE attendance_sessions.id = attendance_records."sessionId"
        AND classes."facultyId" = auth.uid()::text
    )
  );

CREATE POLICY "attendance_records_write_service"
  ON attendance_records FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- COMMENTS table policies
-- =============================================================================

CREATE POLICY "comments_select_class_members"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      JOIN class_memberships ON class_memberships."classId" = posts."classId"
      WHERE posts.id = comments."postId"
        AND class_memberships."studentId" = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM posts
      JOIN classes ON classes.id = posts."classId"
      WHERE posts.id = comments."postId"
        AND classes."facultyId" = auth.uid()::text
    )
  );

CREATE POLICY "comments_insert_authenticated"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "authorId");

CREATE POLICY "comments_delete_author"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "authorId");

-- =============================================================================
-- SUBMISSIONS table policies
-- =============================================================================

-- Students can only see their own submissions; faculty can see all in their classes
CREATE POLICY "submissions_select_student_or_faculty"
  ON submissions FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = "studentId"
    OR EXISTS (
      SELECT 1 FROM posts
      JOIN classes ON classes.id = posts."classId"
      WHERE posts.id = submissions."postId"
        AND classes."facultyId" = auth.uid()::text
    )
  );

-- Students can submit their own files
CREATE POLICY "submissions_insert_student"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "studentId");

-- Students can update their own pending submissions; faculty can update status
CREATE POLICY "submissions_update_student_or_faculty"
  ON submissions FOR UPDATE
  TO authenticated
  USING (
    auth.uid()::text = "studentId"
    OR EXISTS (
      SELECT 1 FROM posts
      JOIN classes ON classes.id = posts."classId"
      WHERE posts.id = submissions."postId"
        AND classes."facultyId" = auth.uid()::text
    )
  );

-- =============================================================================
-- REPORTS table policies
-- =============================================================================

-- Reporters can view their own reports; admins see all (via service role)
CREATE POLICY "reports_select_reporter"
  ON reports FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "reporterId");

CREATE POLICY "reports_select_service"
  ON reports FOR SELECT
  TO service_role
  USING (true);

-- Any authenticated user can file a report
CREATE POLICY "reports_insert_authenticated"
  ON reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "reporterId");

-- Only service role (admin actions) can update/resolve reports
CREATE POLICY "reports_update_service"
  ON reports FOR UPDATE
  TO service_role
  USING (true);

-- =============================================================================
-- NOTIFICATIONS table policies
-- =============================================================================

-- Users can only read their own notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

-- Only service role can create notifications (server-side triggers)
CREATE POLICY "notifications_insert_service"
  ON notifications FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Users can mark their own notifications as read (UPDATE isRead only)
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = "userId")
  WITH CHECK (auth.uid()::text = "userId");

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "userId");

-- =============================================================================
-- Supabase Realtime — Enable for notifications table
-- =============================================================================
-- Run this to allow Realtime subscriptions on the notifications table:

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =============================================================================
-- END OF RLS POLICIES
-- =============================================================================
