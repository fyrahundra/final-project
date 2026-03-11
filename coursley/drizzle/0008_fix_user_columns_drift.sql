ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone;--> statement-breakpoint
UPDATE "user" SET "created_at" = now() WHERE "created_at" IS NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "theme" text;--> statement-breakpoint
UPDATE "user" SET "theme" = 'light' WHERE "theme" IS NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "theme" SET DEFAULT 'light';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "theme" SET NOT NULL;