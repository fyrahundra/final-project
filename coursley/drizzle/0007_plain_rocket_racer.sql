ALTER TABLE "course" ADD COLUMN IF NOT EXISTS "join_id" text;--> statement-breakpoint
UPDATE "course" SET "join_id" = gen_random_uuid()::text WHERE "join_id" IS NULL;--> statement-breakpoint
ALTER TABLE "course" ALTER COLUMN "join_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone;--> statement-breakpoint
UPDATE "user" SET "created_at" = now() WHERE "created_at" IS NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "theme" text;--> statement-breakpoint
UPDATE "user" SET "theme" = 'light' WHERE "theme" IS NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "theme" SET DEFAULT 'light';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "theme" SET NOT NULL;--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'course_join_id_unique'
	) THEN
		ALTER TABLE "course" ADD CONSTRAINT "course_join_id_unique" UNIQUE("join_id");
	END IF;
END $$;