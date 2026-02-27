ALTER TABLE "assignment" DROP CONSTRAINT "assignment_course_id_course_id_fk";
--> statement-breakpoint
ALTER TABLE "course" DROP CONSTRAINT "course_instructor_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "enrollment" DROP CONSTRAINT "enrollment_student_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "enrollment" DROP CONSTRAINT "enrollment_course_id_course_id_fk";
--> statement-breakpoint
ALTER TABLE "session" DROP CONSTRAINT "session_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_assignment" DROP CONSTRAINT "user_assignment_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_assignment" DROP CONSTRAINT "user_assignment_assignment_id_assignment_id_fk";
--> statement-breakpoint
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_instructor_id_user_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_student_id_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assignment" ADD CONSTRAINT "user_assignment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assignment" ADD CONSTRAINT "user_assignment_assignment_id_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignment"("id") ON DELETE cascade ON UPDATE no action;