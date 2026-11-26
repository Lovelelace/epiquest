CREATE TABLE "srd_imports" (
	"srd_version" text PRIMARY KEY NOT NULL,
	"source_repository" text NOT NULL,
	"source_ref" text NOT NULL,
	"source_commit" text NOT NULL,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL
);
