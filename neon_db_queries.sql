-- LabMate PostgreSQL Database Schema
-- Run these queries sequentially to set up your Neon DB

-- 1. Create 'users' table
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

-- 2. Create 'recent_searches' table (Now with user relations and image fields)
CREATE TABLE IF NOT EXISTS "recent_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"query" text,
	"image" text,
	"result" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- 3. Create 'emergency_alerts' table
CREATE TABLE IF NOT EXISTS "emergency_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"location" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL
);

-- 4. Create 'equipment_records' table
CREATE TABLE IF NOT EXISTS "equipment_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"details" jsonb NOT NULL,
	"image_url" text
);

-- 5. Create 'chemical_records' table
CREATE TABLE IF NOT EXISTS "chemical_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hazards" text[],
	"precautions" text[],
	"image_url" text
);

-- 6. Create 'papers' table
CREATE TABLE IF NOT EXISTS "papers" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"abstract" text NOT NULL,
	"url" text NOT NULL,
	"cached" boolean DEFAULT false
);

-- Add Foreign Key Constraints
DO $$ BEGIN
 ALTER TABLE "recent_searches" ADD CONSTRAINT "recent_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "emergency_alerts" ADD CONSTRAINT "emergency_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
