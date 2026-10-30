-- ==============================================================================
-- Ethyra Consulting Services - Supabase Database Security Hardening Script
-- Execute this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Ensure Row Level Security (RLS) is strictly enabled on tables
ALTER TABLE IF EXISTS public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webinar_registrations ENABLE ROW LEVEL SECURITY;

-- 2. Clean up any overly permissive legacy policies
DROP POLICY IF EXISTS "Public can view contacts" ON public.contact_messages;
DROP POLICY IF EXISTS "Public can update contacts" ON public.contact_messages;
DROP POLICY IF EXISTS "Public can delete contacts" ON public.contact_messages;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.contact_messages;
DROP POLICY IF EXISTS "Enable update for all users" ON public.contact_messages;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.contact_messages;

DROP POLICY IF EXISTS "Public can view webinar registrations" ON public.webinar_registrations;
DROP POLICY IF EXISTS "Public can update webinar registrations" ON public.webinar_registrations;
DROP POLICY IF EXISTS "Public can delete webinar registrations" ON public.webinar_registrations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.webinar_registrations;
DROP POLICY IF EXISTS "Enable update for all users" ON public.webinar_registrations;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.webinar_registrations;

-- 3. Policy: Public Visitors can ONLY INSERT contact inquiries (Write-Only)
-- Public users (anon role) CANNOT read, alter, or delete any past entries.
DROP POLICY IF EXISTS "Public insert only for contact_messages" ON public.contact_messages;
CREATE POLICY "Public insert only for contact_messages"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL AND
    email IS NOT NULL AND
    length(email) > 3 AND
    message IS NOT NULL
  );

-- 4. Policy: Public Visitors can ONLY INSERT webinar registrations (Write-Only)
-- Public users (anon role) CANNOT view attendee rosters or delete entries.
DROP POLICY IF EXISTS "Public insert only for webinar_registrations" ON public.webinar_registrations;
CREATE POLICY "Public insert only for webinar_registrations"
  ON public.webinar_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    full_name IS NOT NULL AND
    email IS NOT NULL AND
    length(email) > 3
  );

-- 5. Performance & Security Audit Indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_created_at ON public.webinar_registrations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webinar_registrations_email ON public.webinar_registrations(email);

-- ==============================================================================
-- NOTE:
-- Because NO SELECT, UPDATE, or DELETE policies exist for the 'anon' role,
-- PostgreSQL guarantees that anonymous visitors and automated scrapers CANNOT
-- read or tamper with submitted data even if they have the public anon key.
-- Only your private Supabase Dashboard (service_role) can view and export records.
-- ==============================================================================
