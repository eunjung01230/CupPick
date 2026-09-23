ALTER TABLE "users" DROP CONSTRAINT "uq_users_provider_subject";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "chk_users_auth_provider";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "auth_provider";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "provider_subject";