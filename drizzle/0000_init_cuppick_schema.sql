CREATE TABLE "brand_program_tiers" (
	"brand_program_id" text NOT NULL,
	"step_no" smallint NOT NULL,
	"threshold" integer NOT NULL,
	"reward_name" text NOT NULL,
	CONSTRAINT "brand_program_tiers_brand_program_id_step_no_pk" PRIMARY KEY("brand_program_id","step_no"),
	CONSTRAINT "uq_brand_program_tiers_threshold" UNIQUE("brand_program_id","threshold"),
	CONSTRAINT "chk_brand_program_tiers_step_no" CHECK ("brand_program_tiers"."step_no" >= 1),
	CONSTRAINT "chk_brand_program_tiers_threshold" CHECK ("brand_program_tiers"."threshold" between 1 and 999999),
	CONSTRAINT "chk_brand_program_tiers_reward_len" CHECK (char_length("brand_program_tiers"."reward_name") between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "brand_programs" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"display_name" text NOT NULL,
	"program_type" text,
	"exchange_threshold" integer,
	"min_store_count" integer,
	"per_store_separated" boolean DEFAULT false NOT NULL,
	"reference_status" text DEFAULT 'confirmed' NOT NULL,
	"display_order" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_brand_programs_brand_name" UNIQUE("brand_id","display_name"),
	CONSTRAINT "chk_brand_programs_program_type" CHECK ("brand_programs"."program_type" in ('cumulative', 'store_conditional', 'tiered')),
	CONSTRAINT "chk_brand_programs_reference_status" CHECK ("brand_programs"."reference_status" in ('confirmed', 'unconfirmed', 'suspended')),
	CONSTRAINT "chk_brand_programs_name_len" CHECK (char_length("brand_programs"."display_name") between 1 and 100),
	CONSTRAINT "chk_brand_programs_tiered_single_threshold" CHECK (not ("brand_programs"."program_type" = 'tiered' and "brand_programs"."exchange_threshold" is not null)),
	CONSTRAINT "chk_brand_programs_min_store_scope" CHECK ("brand_programs"."min_store_count" is null or "brand_programs"."program_type" = 'store_conditional'),
	CONSTRAINT "chk_brand_programs_threshold_range" CHECK ("brand_programs"."exchange_threshold" is null or "brand_programs"."exchange_threshold" between 1 and 999999),
	CONSTRAINT "chk_brand_programs_min_store_range" CHECK ("brand_programs"."min_store_count" is null or "brand_programs"."min_store_count" >= 1)
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"display_order" smallint NOT NULL,
	"reference_status" text DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_brands_display_name" UNIQUE("display_name"),
	CONSTRAINT "chk_brands_reference_status" CHECK ("brands"."reference_status" in ('confirmed', 'unconfirmed', 'suspended')),
	CONSTRAINT "chk_brands_display_name_len" CHECK (char_length("brands"."display_name") between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "coupon_store_snapshot_entries" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"store_id" uuid,
	"store_name_raw" text,
	"preserved_quantity" integer NOT NULL,
	"required_quantity" integer NOT NULL,
	CONSTRAINT "chk_coupon_snapshot_entries_preserved" CHECK ("coupon_store_snapshot_entries"."preserved_quantity" between 0 and 999999),
	CONSTRAINT "chk_coupon_snapshot_entries_required" CHECK ("coupon_store_snapshot_entries"."required_quantity" >= 1),
	CONSTRAINT "chk_coupon_snapshot_entries_store_identity" CHECK (num_nonnulls("coupon_store_snapshot_entries"."store_id", "coupon_store_snapshot_entries"."store_name_raw") = 1),
	CONSTRAINT "chk_coupon_snapshot_entries_store_name_len" CHECK ("coupon_store_snapshot_entries"."store_name_raw" is null or char_length("coupon_store_snapshot_entries"."store_name_raw") between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "coupon_store_snapshots" (
	"coupon_id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source_stamp_balance_id" uuid,
	"list_completeness" text DEFAULT 'partial' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_coupon_store_snapshots_completeness" CHECK ("coupon_store_snapshots"."list_completeness" in ('complete', 'partial', 'unknown'))
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"brand_id" text NOT NULL,
	"brand_program_id" text,
	"name" text NOT NULL,
	"coupon_kind" text NOT NULL,
	"lifecycle" text DEFAULT 'held' NOT NULL,
	"issued_at" timestamp with time zone,
	"usable_from" timestamp with time zone,
	"usable_from_precision" text,
	"expires_on" date,
	"date_trust" text DEFAULT 'unknown' NOT NULL,
	"used_at" timestamp with time zone,
	"condition_note" text,
	"source_stamp_event_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_coupons_id_user" UNIQUE("id","user_id"),
	CONSTRAINT "chk_coupons_coupon_kind" CHECK ("coupons"."coupon_kind" in ('stamp', 'event_other', 'unknown')),
	CONSTRAINT "chk_coupons_lifecycle" CHECK ("coupons"."lifecycle" in ('held', 'used', 'expired', 'conversion_cancelled')),
	CONSTRAINT "chk_coupons_date_trust_value" CHECK ("coupons"."date_trust" in ('confirmed', 'estimated', 'unknown', 'no_limit')),
	CONSTRAINT "chk_coupons_usable_from_precision" CHECK ("coupons"."usable_from_precision" in ('date', 'minute')),
	CONSTRAINT "chk_coupons_name_len" CHECK (char_length("coupons"."name") between 1 and 100),
	CONSTRAINT "chk_coupons_condition_note_len" CHECK ("coupons"."condition_note" is null or char_length("coupons"."condition_note") <= 2000),
	CONSTRAINT "chk_coupons_date_trust" CHECK (("coupons"."date_trust" in ('confirmed', 'estimated')) = ("coupons"."expires_on" is not null)),
	CONSTRAINT "chk_coupons_usable_precision" CHECK (("coupons"."usable_from" is null) = ("coupons"."usable_from_precision" is null)),
	CONSTRAINT "chk_coupons_used_at" CHECK (("coupons"."lifecycle" = 'used') = ("coupons"."used_at" is not null)),
	CONSTRAINT "chk_coupons_usable_before_expiry" CHECK ("coupons"."usable_from" is null or "coupons"."expires_on" is null or ("coupons"."usable_from" at time zone 'Asia/Seoul')::date <= "coupons"."expires_on")
);
--> statement-breakpoint
CREATE TABLE "saved_places" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"latitude" numeric(9, 6) NOT NULL,
	"longitude" numeric(10, 6) NOT NULL,
	"display_order" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_saved_places_user_slot" UNIQUE("user_id","display_order"),
	CONSTRAINT "chk_saved_places_name_len" CHECK (char_length("saved_places"."name") between 1 and 100),
	CONSTRAINT "chk_saved_places_slot_range" CHECK ("saved_places"."display_order" between 1 and 10),
	CONSTRAINT "chk_saved_places_latitude" CHECK ("saved_places"."latitude" between -90 and 90),
	CONSTRAINT "chk_saved_places_longitude" CHECK ("saved_places"."longitude" between -180 and 180)
);
--> statement-breakpoint
CREATE TABLE "stamp_balance_store_counts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"stamp_balance_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"store_id" uuid,
	"store_name_raw" text,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_balance_store_counts_quantity" CHECK ("stamp_balance_store_counts"."quantity" between 0 and 999999),
	CONSTRAINT "chk_balance_store_counts_store_identity" CHECK (num_nonnulls("stamp_balance_store_counts"."store_id", "stamp_balance_store_counts"."store_name_raw") = 1),
	CONSTRAINT "chk_balance_store_counts_store_name_len" CHECK ("stamp_balance_store_counts"."store_name_raw" is null or char_length("stamp_balance_store_counts"."store_name_raw") between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "stamp_balances" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"brand_id" text NOT NULL,
	"brand_program_id" text,
	"purpose" text,
	"accrual_scope" text NOT NULL,
	"store_id" uuid,
	"store_name_raw" text,
	"unidentified_key" text,
	"current_quantity" integer NOT NULL,
	"official_quantity" integer,
	"official_checked_at" timestamp with time zone,
	"composition_status" text DEFAULT 'valid' NOT NULL,
	"composition_checked_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_stamp_balances_id_user" UNIQUE("id","user_id"),
	CONSTRAINT "chk_stamp_balances_accrual_scope" CHECK ("stamp_balances"."accrual_scope" in ('common', 'store', 'unknown')),
	CONSTRAINT "chk_stamp_balances_composition_status" CHECK ("stamp_balances"."composition_status" in ('valid', 'needs_check')),
	CONSTRAINT "chk_stamp_balances_current_quantity" CHECK ("stamp_balances"."current_quantity" between 0 and 999999),
	CONSTRAINT "chk_stamp_balances_official_quantity" CHECK ("stamp_balances"."official_quantity" is null or "stamp_balances"."official_quantity" between 0 and 999999),
	CONSTRAINT "chk_stamp_balances_official_pair" CHECK (("stamp_balances"."official_quantity" is null) = ("stamp_balances"."official_checked_at" is null)),
	CONSTRAINT "chk_stamp_balances_store_identity" CHECK (num_nonnulls("stamp_balances"."store_id", "stamp_balances"."store_name_raw") <= 1),
	CONSTRAINT "chk_stamp_balances_store_scope" CHECK (("stamp_balances"."store_id" is null and "stamp_balances"."store_name_raw" is null) or "stamp_balances"."accrual_scope" = 'store'),
	CONSTRAINT "chk_stamp_balances_unidentified_key" CHECK (("stamp_balances"."brand_program_id" is not null and "stamp_balances"."purpose" is not null and "stamp_balances"."accrual_scope" <> 'unknown') or "stamp_balances"."unidentified_key" is not null),
	CONSTRAINT "chk_stamp_balances_store_name_len" CHECK ("stamp_balances"."store_name_raw" is null or char_length("stamp_balances"."store_name_raw") between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "stamp_events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"stamp_balance_id" uuid,
	"event_type" text NOT NULL,
	"quantity_delta" integer,
	"quantity_before" integer,
	"quantity_after" integer,
	"target_version" integer,
	"occurred_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"store_id" uuid,
	"store_name_raw" text,
	"applied_via" text,
	"tier_threshold" integer,
	"note" text,
	"request_id" text,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "uq_stamp_events_id_user" UNIQUE("id","user_id"),
	CONSTRAINT "chk_stamp_events_event_type" CHECK ("stamp_events"."event_type" in ('initial_import', 'accrual_added', 'balance_set', 'official_confirmed', 'expired', 'expiry_restored', 'converted', 'conversion_cancelled', 'deleted', 'restored')),
	CONSTRAINT "chk_stamp_events_applied_via" CHECK ("stamp_events"."applied_via" in ('direct', 'already_reflected', 'balance_reconciled')),
	CONSTRAINT "chk_stamp_events_quantity_before" CHECK ("stamp_events"."quantity_before" is null or "stamp_events"."quantity_before" between 0 and 999999),
	CONSTRAINT "chk_stamp_events_quantity_after" CHECK ("stamp_events"."quantity_after" is null or "stamp_events"."quantity_after" between 0 and 999999),
	CONSTRAINT "chk_stamp_events_store_identity" CHECK (num_nonnulls("stamp_events"."store_id", "stamp_events"."store_name_raw") <= 1),
	CONSTRAINT "chk_stamp_events_note_len" CHECK ("stamp_events"."note" is null or char_length("stamp_events"."note") <= 2000),
	CONSTRAINT "chk_stamp_events_store_name_len" CHECK ("stamp_events"."store_name_raw" is null or char_length("stamp_events"."store_name_raw") between 1 and 100)
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"brand_id" text,
	"brand_program_id" text,
	"name" text NOT NULL,
	"address" text,
	"latitude" numeric(9, 6),
	"longitude" numeric(10, 6),
	"map_provider" text,
	"provider_place_id" text,
	"store_status" text DEFAULT 'active' NOT NULL,
	"source" text,
	"fetched_at" timestamp with time zone,
	"previous_store_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_stores_provider_place" UNIQUE("map_provider","provider_place_id"),
	CONSTRAINT "chk_stores_store_status" CHECK ("stores"."store_status" in ('active', 'closed_confirmed', 'needs_check')),
	CONSTRAINT "chk_stores_name_len" CHECK (char_length("stores"."name") between 1 and 100),
	CONSTRAINT "chk_stores_latitude" CHECK ("stores"."latitude" is null or "stores"."latitude" between -90 and 90),
	CONSTRAINT "chk_stores_longitude" CHECK ("stores"."longitude" is null or "stores"."longitude" between -180 and 180),
	CONSTRAINT "chk_stores_coords_paired" CHECK (("stores"."latitude" is null) = ("stores"."longitude" is null))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"auth_provider" text NOT NULL,
	"provider_subject" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"withdrawal_requested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_users_provider_subject" UNIQUE("auth_provider","provider_subject"),
	CONSTRAINT "chk_users_auth_provider" CHECK ("users"."auth_provider" in ('google', 'naver', 'kakao')),
	CONSTRAINT "chk_users_status" CHECK ("users"."status" in ('active', 'withdrawing')),
	CONSTRAINT "chk_users_withdrawal_consistency" CHECK (("users"."status" = 'withdrawing') = ("users"."withdrawal_requested_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "brand_program_tiers" ADD CONSTRAINT "brand_program_tiers_brand_program_id_brand_programs_id_fk" FOREIGN KEY ("brand_program_id") REFERENCES "public"."brand_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_programs" ADD CONSTRAINT "brand_programs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_store_snapshot_entries" ADD CONSTRAINT "coupon_store_snapshot_entries_coupon_id_coupon_store_snapshots_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon_store_snapshots"("coupon_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_store_snapshot_entries" ADD CONSTRAINT "coupon_store_snapshot_entries_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_store_snapshots" ADD CONSTRAINT "coupon_store_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_store_snapshots" ADD CONSTRAINT "coupon_store_snapshots_source_stamp_balance_id_stamp_balances_id_fk" FOREIGN KEY ("source_stamp_balance_id") REFERENCES "public"."stamp_balances"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_store_snapshots" ADD CONSTRAINT "fk_coupon_store_snapshots_coupon" FOREIGN KEY ("coupon_id","user_id") REFERENCES "public"."coupons"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_brand_program_id_brand_programs_id_fk" FOREIGN KEY ("brand_program_id") REFERENCES "public"."brand_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stamp_balance_store_counts" ADD CONSTRAINT "stamp_balance_store_counts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stamp_balance_store_counts" ADD CONSTRAINT "stamp_balance_store_counts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stamp_balance_store_counts" ADD CONSTRAINT "fk_balance_store_counts_balance" FOREIGN KEY ("stamp_balance_id","user_id") REFERENCES "public"."stamp_balances"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stamp_balances" ADD CONSTRAINT "stamp_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stamp_balances" ADD CONSTRAINT "stamp_balances_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stamp_balances" ADD CONSTRAINT "stamp_balances_brand_program_id_brand_programs_id_fk" FOREIGN KEY ("brand_program_id") REFERENCES "public"."brand_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stamp_balances" ADD CONSTRAINT "stamp_balances_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stamp_events" ADD CONSTRAINT "stamp_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stamp_events" ADD CONSTRAINT "stamp_events_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stamp_events" ADD CONSTRAINT "fk_stamp_events_balance" FOREIGN KEY ("stamp_balance_id","user_id") REFERENCES "public"."stamp_balances"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_brand_program_id_brand_programs_id_fk" FOREIGN KEY ("brand_program_id") REFERENCES "public"."brand_programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_previous_store_id_stores_id_fk" FOREIGN KEY ("previous_store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_brand_programs_brand_order" ON "brand_programs" USING btree ("brand_id","display_order");--> statement-breakpoint
CREATE INDEX "ix_brands_display_order" ON "brands" USING btree ("display_order");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_coupon_snapshot_entries_store_id" ON "coupon_store_snapshot_entries" USING btree ("coupon_id","store_id") WHERE "coupon_store_snapshot_entries"."store_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_coupon_snapshot_entries_store_name" ON "coupon_store_snapshot_entries" USING btree ("coupon_id","store_name_raw") WHERE "coupon_store_snapshot_entries"."store_name_raw" is not null;--> statement-breakpoint
CREATE INDEX "ix_coupons_user_lifecycle" ON "coupons" USING btree ("user_id","lifecycle") WHERE "coupons"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "ix_coupons_user_expiry" ON "coupons" USING btree ("user_id","expires_on") WHERE "coupons"."deleted_at" is null and "coupons"."lifecycle" = 'held';--> statement-breakpoint
CREATE INDEX "ix_coupons_source_event" ON "coupons" USING btree ("source_stamp_event_id");--> statement-breakpoint
CREATE INDEX "ix_coupons_deleted" ON "coupons" USING btree ("deleted_at") WHERE "coupons"."deleted_at" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_balance_store_counts_store_id" ON "stamp_balance_store_counts" USING btree ("stamp_balance_id","store_id") WHERE "stamp_balance_store_counts"."store_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_balance_store_counts_store_name" ON "stamp_balance_store_counts" USING btree ("stamp_balance_id","store_name_raw") WHERE "stamp_balance_store_counts"."store_name_raw" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_stamp_balance_unit_no_store" ON "stamp_balances" USING btree ("user_id","brand_id","brand_program_id","purpose","accrual_scope") WHERE "stamp_balances"."deleted_at" is null and "stamp_balances"."brand_program_id" is not null and "stamp_balances"."purpose" is not null and "stamp_balances"."accrual_scope" <> 'unknown' and "stamp_balances"."store_id" is null and "stamp_balances"."store_name_raw" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_stamp_balance_unit_store_id" ON "stamp_balances" USING btree ("user_id","brand_id","brand_program_id","purpose","accrual_scope","store_id") WHERE "stamp_balances"."deleted_at" is null and "stamp_balances"."brand_program_id" is not null and "stamp_balances"."purpose" is not null and "stamp_balances"."accrual_scope" <> 'unknown' and "stamp_balances"."store_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_stamp_balance_unit_store_name" ON "stamp_balances" USING btree ("user_id","brand_id","brand_program_id","purpose","accrual_scope","store_name_raw") WHERE "stamp_balances"."deleted_at" is null and "stamp_balances"."brand_program_id" is not null and "stamp_balances"."purpose" is not null and "stamp_balances"."accrual_scope" <> 'unknown' and "stamp_balances"."store_name_raw" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_stamp_balance_unidentified" ON "stamp_balances" USING btree ("user_id","unidentified_key") WHERE "stamp_balances"."deleted_at" is null and "stamp_balances"."unidentified_key" is not null;--> statement-breakpoint
CREATE INDEX "ix_stamp_balances_user" ON "stamp_balances" USING btree ("user_id") WHERE "stamp_balances"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "ix_stamp_balances_user_brand" ON "stamp_balances" USING btree ("user_id","brand_id") WHERE "stamp_balances"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "ix_stamp_balances_deleted" ON "stamp_balances" USING btree ("deleted_at") WHERE "stamp_balances"."deleted_at" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_stamp_events_request" ON "stamp_events" USING btree ("user_id","request_id") WHERE "stamp_events"."request_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_stamp_events_initial_import" ON "stamp_events" USING btree ("stamp_balance_id") WHERE "stamp_events"."event_type" = 'initial_import' and "stamp_events"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "ix_stamp_events_balance_time" ON "stamp_events" USING btree ("stamp_balance_id","occurred_at");--> statement-breakpoint
CREATE INDEX "ix_stamp_events_user_time" ON "stamp_events" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "ix_stamp_events_recorded" ON "stamp_events" USING btree ("recorded_at");--> statement-breakpoint
CREATE INDEX "ix_stores_brand_program" ON "stores" USING btree ("brand_program_id");--> statement-breakpoint
CREATE INDEX "ix_stores_brand" ON "stores" USING btree ("brand_id");