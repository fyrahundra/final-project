CREATE TABLE "user_assignment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"assignment_id" text NOT NULL,
	"content" text NOT NULL,
	"content_title" text,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_assignment" ADD CONSTRAINT "user_assignment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_assignment" ADD CONSTRAINT "user_assignment_assignment_id_assignment_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."assignment"("id") ON DELETE no action ON UPDATE no action;