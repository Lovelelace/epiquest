CREATE TYPE "public"."srd_size" AS ENUM('tiny', 'small', 'medium', 'large', 'huge', 'gargantuan');--> statement-breakpoint
CREATE TYPE "public"."srd_item_kind" AS ENUM('equipment', 'magic_item');--> statement-breakpoint
CREATE TABLE "srd_backgrounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"raw" jsonb NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', name), 'A') || setweight(to_tsvector('english', description), 'B')) STORED NOT NULL,
	CONSTRAINT "srd_backgrounds_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "srd_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"raw" jsonb NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', name), 'A') || setweight(to_tsvector('english', description), 'B')) STORED NOT NULL,
	"hit_die" integer NOT NULL,
	CONSTRAINT "srd_classes_slug_unique" UNIQUE("slug"),
	CONSTRAINT "srd_classes_hit_die_check" CHECK ("srd_classes"."hit_die" in (6, 8, 10, 12))
);
--> statement-breakpoint
CREATE TABLE "srd_subclasses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"raw" jsonb NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', name), 'A') || setweight(to_tsvector('english', description), 'B')) STORED NOT NULL,
	"class_id" uuid NOT NULL,
	CONSTRAINT "srd_subclasses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "srd_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"raw" jsonb NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', name), 'A') || setweight(to_tsvector('english', description), 'B')) STORED NOT NULL,
	CONSTRAINT "srd_conditions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "srd_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"raw" jsonb NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', name), 'A') || setweight(to_tsvector('english', description), 'B')) STORED NOT NULL,
	"kind" "srd_item_kind" NOT NULL,
	"category" text NOT NULL,
	"rarity" text,
	CONSTRAINT "srd_items_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "srd_monsters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"raw" jsonb NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', name), 'A') || setweight(to_tsvector('english', description), 'B')) STORED NOT NULL,
	"size" "srd_size" NOT NULL,
	"type" text NOT NULL,
	"challenge_rating" double precision NOT NULL,
	"armor_class" integer NOT NULL,
	"hit_points" integer NOT NULL,
	CONSTRAINT "srd_monsters_slug_unique" UNIQUE("slug"),
	CONSTRAINT "srd_monsters_challenge_rating_check" CHECK ("srd_monsters"."challenge_rating" >= 0),
	CONSTRAINT "srd_monsters_hit_points_check" CHECK ("srd_monsters"."hit_points" > 0)
);
--> statement-breakpoint
CREATE TABLE "srd_species" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"raw" jsonb NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', name), 'A') || setweight(to_tsvector('english', description), 'B')) STORED NOT NULL,
	"parent_id" uuid,
	"size" "srd_size",
	"speed" integer,
	CONSTRAINT "srd_species_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "srd_spell_classes" (
	"spell_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	CONSTRAINT "srd_spell_classes_spell_id_class_id_pk" PRIMARY KEY("spell_id","class_id")
);
--> statement-breakpoint
CREATE TABLE "srd_spells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"raw" jsonb NOT NULL,
	"search" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', name), 'A') || setweight(to_tsvector('english', description), 'B')) STORED NOT NULL,
	"level" integer NOT NULL,
	"school" text NOT NULL,
	"casting_time" text NOT NULL,
	"range" text NOT NULL,
	"duration" text NOT NULL,
	"is_ritual" boolean DEFAULT false NOT NULL,
	"requires_concentration" boolean DEFAULT false NOT NULL,
	CONSTRAINT "srd_spells_slug_unique" UNIQUE("slug"),
	CONSTRAINT "srd_spells_level_check" CHECK ("srd_spells"."level" between 0 and 9)
);
--> statement-breakpoint
ALTER TABLE "srd_subclasses" ADD CONSTRAINT "srd_subclasses_class_id_srd_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."srd_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srd_species" ADD CONSTRAINT "srd_species_parent_id_srd_species_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."srd_species"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srd_spell_classes" ADD CONSTRAINT "srd_spell_classes_spell_id_srd_spells_id_fk" FOREIGN KEY ("spell_id") REFERENCES "public"."srd_spells"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srd_spell_classes" ADD CONSTRAINT "srd_spell_classes_class_id_srd_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."srd_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "srd_backgrounds_search_idx" ON "srd_backgrounds" USING gin ("search");--> statement-breakpoint
CREATE INDEX "srd_classes_search_idx" ON "srd_classes" USING gin ("search");--> statement-breakpoint
CREATE INDEX "srd_subclasses_class_idx" ON "srd_subclasses" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "srd_subclasses_search_idx" ON "srd_subclasses" USING gin ("search");--> statement-breakpoint
CREATE INDEX "srd_conditions_search_idx" ON "srd_conditions" USING gin ("search");--> statement-breakpoint
CREATE INDEX "srd_items_kind_category_idx" ON "srd_items" USING btree ("kind","category");--> statement-breakpoint
CREATE INDEX "srd_items_search_idx" ON "srd_items" USING gin ("search");--> statement-breakpoint
CREATE INDEX "srd_monsters_challenge_rating_idx" ON "srd_monsters" USING btree ("challenge_rating");--> statement-breakpoint
CREATE INDEX "srd_monsters_type_idx" ON "srd_monsters" USING btree ("type");--> statement-breakpoint
CREATE INDEX "srd_monsters_search_idx" ON "srd_monsters" USING gin ("search");--> statement-breakpoint
CREATE INDEX "srd_species_parent_idx" ON "srd_species" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "srd_species_search_idx" ON "srd_species" USING gin ("search");--> statement-breakpoint
CREATE INDEX "srd_spell_classes_class_idx" ON "srd_spell_classes" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "srd_spells_level_school_idx" ON "srd_spells" USING btree ("level","school");--> statement-breakpoint
CREATE INDEX "srd_spells_search_idx" ON "srd_spells" USING gin ("search");