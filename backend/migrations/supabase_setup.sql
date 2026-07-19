-- =============================================================================
-- FinScenario — Supabase Setup SQL
-- =============================================================================
-- Run this ENTIRE file in the Supabase SQL Editor (Dashboard → SQL Editor).
-- These statements configure triggers on auth.users and Row Level Security,
-- which cannot be managed through Alembic.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. AUTO-CREATE PROFILE ON NEW USER SIGNUP
-- ─────────────────────────────────────────────────────────────────────────────
-- When Supabase Auth creates a new row in auth.users (on sign-up), this
-- trigger automatically inserts a corresponding row in public.profiles.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$;

-- Drop existing trigger if present (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ENABLE ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS POLICIES — profiles
-- ─────────────────────────────────────────────────────────────────────────────
-- Users can only read/write their own profile row.

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS POLICIES — scenarios
-- ─────────────────────────────────────────────────────────────────────────────
-- Users can only read/write their own scenario rows.

CREATE POLICY "Users can view their own scenarios"
    ON public.scenarios FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scenarios"
    ON public.scenarios FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios"
    ON public.scenarios FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenarios"
    ON public.scenarios FOR DELETE
    USING (auth.uid() = user_id);
