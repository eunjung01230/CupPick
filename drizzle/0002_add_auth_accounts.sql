CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"auth_provider" text NOT NULL,
	"provider_subject" text NOT NULL,
	"provider_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_auth_accounts_provider_subject" UNIQUE("auth_provider","provider_subject"),
	CONSTRAINT "chk_auth_accounts_provider" CHECK ("auth_accounts"."auth_provider" in ('google', 'naver', 'kakao'))
);
--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_auth_accounts_user" ON "auth_accounts" USING btree ("user_id");