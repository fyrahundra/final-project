ALTER TABLE "user_assignment" ADD COLUMN "saved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assignment" DROP COLUMN "saved_at";