CREATE TABLE "character_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"step" text DEFAULT 'species' NOT NULL,
	"choices" jsonb NOT NULL,
	"ability_rolls" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
