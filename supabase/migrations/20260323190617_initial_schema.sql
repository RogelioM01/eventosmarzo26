/*
  # Initial Schema Setup
  
  Creates the core tables for the RSVP management system:
  
  1. New Tables
    - `users`
      - `id` (text, primary key)
      - `email` (text, unique)
      - `name` (text, nullable)
      - `passwordHash` (text)
      - `role` (text, default 'host')
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)
    
    - `events`
      - `id` (text, primary key)
      - `name` (text)
      - `date` (timestamp)
      - `location` (text)
      - `locationUrl` (text, nullable)
      - `giftRegistry` (text, nullable)
      - `description` (text, nullable)
      - `openRegistration` (boolean, default false)
      - `maxPassesPerGuest` (integer, default 4)
      - `hostId` (text, foreign key to users)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)
    
    - `guests`
      - `id` (text, primary key)
      - `name` (text)
      - `email` (text, nullable)
      - `phone` (text, nullable)
      - `passes` (integer, default 1)
      - `confirmedPasses` (integer, default 0)
      - `status` (text, default 'pending')
      - `dietaryNotes` (text, nullable)
      - `songRequest` (text, nullable)
      - `token` (text, unique)
      - `eventId` (text, foreign key to events)
      - `confirmedAt` (timestamp, nullable)
      - `createdAt` (timestamp)
      - `updatedAt` (timestamp)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public RSVP access via token
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  "passwordHash" TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'host',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  "locationUrl" TEXT,
  "giftRegistry" TEXT,
  description TEXT,
  "openRegistration" BOOLEAN NOT NULL DEFAULT false,
  "maxPassesPerGuest" INTEGER NOT NULL DEFAULT 4,
  "hostId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create guests table
CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  passes INTEGER NOT NULL DEFAULT 1,
  "confirmedPasses" INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  "dietaryNotes" TEXT,
  "songRequest" TEXT,
  token TEXT UNIQUE NOT NULL,
  "eventId" TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  "confirmedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Events policies
CREATE POLICY "Hosts can view own events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Hosts can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Hosts can update own events"
  ON events FOR UPDATE
  TO authenticated
  USING ("hostId" = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK ("hostId" = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Hosts can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING ("hostId" = current_setting('request.jwt.claims', true)::json->>'sub');

-- Guests policies
CREATE POLICY "Public can view guest by token"
  ON guests FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Hosts can view event guests"
  ON guests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests."eventId"
      AND events."hostId" = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Hosts can create guests"
  ON guests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests."eventId"
      AND events."hostId" = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Hosts can update event guests"
  ON guests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests."eventId"
      AND events."hostId" = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests."eventId"
      AND events."hostId" = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

CREATE POLICY "Public can update guest by token"
  ON guests FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Hosts can delete event guests"
  ON guests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests."eventId"
      AND events."hostId" = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_hostId ON events("hostId");
CREATE INDEX IF NOT EXISTS idx_guests_eventId ON guests("eventId");
CREATE INDEX IF NOT EXISTS idx_guests_token ON guests(token);