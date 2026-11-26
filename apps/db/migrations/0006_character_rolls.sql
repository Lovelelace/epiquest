CREATE TABLE "character_rolls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"label" text NOT NULL,
	"expression" text NOT NULL,
	"dice" jsonb NOT NULL,
	"modifier" integer NOT NULL,
	"total" integer NOT NULL,
	"visibility" text NOT NULL,
	"rolled_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "character_rolls" ADD CONSTRAINT "character_rolls_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "character_rolls_character_idx" ON "character_rolls" USING btree ("character_id","rolled_at");