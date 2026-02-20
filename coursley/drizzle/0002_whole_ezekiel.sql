ALTER TABLE "assignment" DROP CONSTRAINT "assignment_course_id_course_id_fk";--> statement-breakpoint
ALTER TABLE "enrollment" DROP CONSTRAINT "enrollment_course_id_course_id_fk";--> statement-breakpoint
ALTER TABLE "assignment" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "course" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "assignment" ALTER COLUMN "course_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "enrollment" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "enrollment" ALTER COLUMN "course_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE no action ON UPDATE no action;