ALTER TABLE "course" ADD COLUMN "join_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "theme" text DEFAULT 'light' NOT NULL;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_join_id_unique" UNIQUE("join_id");