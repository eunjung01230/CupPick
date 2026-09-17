-- Drizzle DSL이 표현하지 못하는 제약 두 건을 보완한다.
-- 0000 자동 생성 결과는 수정하지 않고 여기서 교체/추가한다.

-- 1. saved_places 슬롯 유니크를 지연 검사 가능한 제약으로 교체한다.
--    INITIALLY IMMEDIATE이므로 평소 동작은 0000과 같고, 순서 재배열 트랜잭션에서만
--    SET CONSTRAINTS "uq_saved_places_user_slot" DEFERRED 로 커밋 시점까지 미룬다.
--    (1<->2 교환처럼 중간 상태에서 일시적으로 중복이 생기는 경우)
--    이름을 0000과 동일하게 유지해 drizzle 스냅샷과 어긋나지 않게 한다.
ALTER TABLE "saved_places" DROP CONSTRAINT "uq_saved_places_user_slot";--> statement-breakpoint
ALTER TABLE "saved_places" ADD CONSTRAINT "uq_saved_places_user_slot" UNIQUE ("user_id", "display_order") DEFERRABLE INITIALLY IMMEDIATE;--> statement-breakpoint

-- 2. coupons -> stamp_events 복합 FK.
--    다른 계정의 전환 사건에 쿠폰을 연결하는 저장을 DB가 막는다(06 §10.2).
--    참조 대상은 0000의 "uq_stamp_events_id_user" UNIQUE("id","user_id")다.
--
--    ON DELETE SET NULL (source_stamp_event_id):
--      원 사건이 지워져도 쿠폰은 남아야 하므로 source_stamp_event_id만 비우고
--      NOT NULL인 user_id는 유지한다. 컬럼 목록 지정은 PostgreSQL 15+ 문법이다.
--
--    MATCH SIMPLE(기본값)이어야 한다. source_stamp_event_id가 NULL인 독립 등록 쿠폰은
--    user_id가 채워져 있어도 제약을 통과해야 하는데, MATCH FULL이면 거부된다.
ALTER TABLE "coupons" ADD CONSTRAINT "fk_coupons_source_stamp_event" FOREIGN KEY ("source_stamp_event_id", "user_id") REFERENCES "public"."stamp_events" ("id", "user_id") ON DELETE SET NULL ("source_stamp_event_id") ON UPDATE NO ACTION;
