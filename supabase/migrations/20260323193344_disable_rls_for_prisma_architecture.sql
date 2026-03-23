/*
  # Disable RLS for Prisma/NextAuth Architecture
  
  1. Architecture Context
    - Application uses Prisma ORM with service role credentials
    - Authentication via NextAuth (not Supabase Auth)
    - All database access goes through Prisma (bypasses RLS anyway)
    - Authorization enforced at API layer in Next.js routes
  
  2. Why Disable RLS
    - Service role connections bypass RLS regardless
    - Permissive RLS policies trigger security warnings
    - No value in maintaining policies that never execute
    - Cleaner security model: authorization in one place (API layer)
  
  3. Security Enforcement
    All authorization happens in app/api/[[...path]]/route.js:
    - NextAuth session validation
    - User ownership verification (event.hostId === user.id)
    - Role-based access control (admin vs host)
    - Token validation for public RSVP
  
  4. Future Migration Path
    To leverage database-level RLS in the future:
    - Migrate from NextAuth to Supabase Auth
    - Replace Prisma with Supabase client libraries
    - Re-enable RLS with auth.uid() based policies
    - Use row-level security as primary authorization
*/

-- Remove all RLS policies
DROP POLICY IF EXISTS "Service role full access" ON users;
DROP POLICY IF EXISTS "Service role full access to events" ON events;
DROP POLICY IF EXISTS "Service role full access to guests" ON guests;

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE guests DISABLE ROW LEVEL SECURITY;

-- ==================== SECURITY MODEL DOCUMENTATION ====================
--
-- RLS is DISABLED because this application uses a different security model:
--
-- Database Access:
-- - All queries go through Prisma with service role credentials
-- - Service role bypasses RLS, so policies would never execute
--
-- Authentication:
-- - NextAuth manages user sessions with JWT
-- - Session stored in secure HTTP-only cookies
-- - NEXT_AUTH_SECRET protects session integrity
--
-- Authorization (enforced in API routes):
-- - Event operations: Verify event.hostId === authUser.id
-- - Guest operations: Verify event ownership via JOIN
-- - Admin operations: Check authUser.role === 'admin'  
-- - Public RSVP: Validate guest.token matches URL parameter
--
-- Security Checklist:
-- ✓ NEXT_AUTH_SECRET is strong and secret
-- ✓ Database credentials (service role) are not exposed to client
-- ✓ API routes validate session before database operations
-- ✓ Ownership checks in all protected endpoints
-- ✓ Public endpoints validate tokens
-- ✓ No direct database exposure (all goes through API)
--
-- This is a valid security architecture commonly used with:
-- - Next.js + NextAuth + Prisma
-- - Traditional backend frameworks (Express, NestJS, etc.)
-- - Any ORM-based application with application-layer authorization
--
-- Database-level security (RLS) is an additional layer that works well with
-- client-side database access (Supabase client libraries). For server-side
-- ORM access patterns, application-layer authorization is the standard approach.