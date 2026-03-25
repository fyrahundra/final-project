ALTER TABLE "user_assignment" ADD COLUMN "turned_in_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assignment" DROP COLUMN "turned_in";--> statement-breakpoint
ALTER TABLE "assignment" DROP COLUMN "turned_in_at";