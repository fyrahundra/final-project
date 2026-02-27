ALTER TABLE "course" ADD COLUMN "join_id" text;--> statement-breakpoint
UPDATE "course" SET "join_id" = gen_random_uuid()::text WHERE "join_id" IS NULL;--> statement-breakpoint
ALTER TABLE "course" ALTER COLUMN "join_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_join_id_unique" UNIQUE("join_id");