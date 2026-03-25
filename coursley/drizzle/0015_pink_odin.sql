ALTER TABLE "user" ALTER COLUMN "is_admin" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment" ADD COLUMN "turned_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment" ADD COLUMN "due_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assignment" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment" ADD COLUMN "turned_in_at" timestamp with time zone;