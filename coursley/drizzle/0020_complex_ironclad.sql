ALTER TABLE "assignment" ADD COLUMN "type" text DEFAULT 'essay' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_assignment" ADD COLUMN "type" text DEFAULT 'essay' NOT NULL;