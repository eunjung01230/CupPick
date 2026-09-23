"use client";

/**
 * CupPick 홈(지도) 화면.
 *
 * 화면 구조·문안·색은 docs/design/cuppick -v2/CupPick v2.dc.html 의 지도 화면을
 * 따른다. 이번 범위는 화면 골격이며 다음은 아직 연결하지 않았다.
 * - Naver Map / Kakao Map: 지도 영역은 크기만 유지하는 placeholder다.
 * - 실제 위치 취득·주변 매장 조회(F02·F03): 목록은 design-sample.ts 의 표본이다.
 * - 외부 지도 길찾기(F05): 버튼 자리만 두고 비활성으로 둔다.
 *
 * 비로그인에는 혜택 판정 배지·잔액 요약·저장한 장소를 노출하지 않는다
 * (docs/05-policy.md POL02.1 · docs/04-features.md F01·F02).
 */
import { useMemo, useState } from "react";
import {
  BRAND_META,
  BRAND_ORDER,
  CAFES,
  DEFAULT_LOCATION,
  QUERY_LOCATIONS,
  SAVED_PLACES,
  WALK_RANGES,
  matchLocation,
  programName,
  type BrandProgram,
  type LocationKey,
  type WalkRange,
} from "./design-sample.ts";
import { LoginSheet } from "./LoginSheet.tsx";
import styles from "./HomeScreen.module.css";

/** 지도 핀 표시 방식. 디자인의 pinMode다. */
type PinMode = "near" | "all";

type NearbyCafe = {
  id: string;
  brandId: string;
  program: BrandProgram | null;
  name: string;
  x: string;
  y: string;
  walk: number;
};

type CafeGroup = {
  id: string;
  name: string;
  short: string;
  color: string;
  nearestWalk: number;
  stores: { id: string; name: string; walk: number }[];
};

export function HomeScreen({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [location, setLocation] = useState<LocationKey>(DEFAULT_LOCATION);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [range, setRange] = useState<WalkRange>(30);
  const [pinMode, setPinMode] = useState<PinMode>("near");
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);

  const nearbyCafes = useMemo<NearbyCafe[]>(
    () =>
      CAFES.map((cafe) => ({
        id: cafe.id,
        brandId: cafe.brandId,
        program: cafe.program,
        name: cafe.name,
        x: cafe.x,
        y: cafe.y,
        walk: cafe.walkMinutes[location],
      }))
        // 도보 15분이 기본, 30분이 MVP 최대다(F03).
        .filter((cafe) => cafe.walk <= range)
        .sort((a, b) => a.walk - b.walk || a.name.localeCompare(b.name, "ko")),
    [location, range],
  );

  const groups = useMemo<CafeGroup[]>(() => {
    const result: CafeGroup[] = [];

    for (const brandId of BRAND_ORDER) {
      const meta = BRAND_META[brandId];
      const brandCafes = nearbyCafes.filter((cafe) => cafe.brandId === brandId);
      // 프로그램이 갈리는 브랜드는 프로그램별로 나눠 묶는다(POL26.3).
      const programs = [...new Set(brandCafes.map((cafe) => cafe.program))];

      for (const program of programs) {
        const stores = brandCafes.filter((cafe) => cafe.program === program);
        if (stores.length === 0) continue;

        const name = programName(brandId, program);
        result.push({
          id: program ? `${brandId}:${program}` : brandId,
          name,
          short: meta.short,
          color: meta.color,
          nearestWalk: stores[0].walk,
          stores: stores.map((store) => ({
            id: store.id,
            name: store.name.replace(`${name} `, "").replace(`${meta.name} `, ""),
            walk: store.walk,
          })),
        });
      }
    }

    return result.sort((a, b) => a.nearestWalk - b.nearestWalk);
  }, [nearbyCafes]);

  const pins = useMemo(
    () =>
      pinMode === "all"
        ? nearbyCafes
        : nearbyCafes.filter(
            (cafe, index, all) => all.findIndex((other) => other.brandId === cafe.brandId) === index,
          ),
    [nearbyCafes, pinMode],
  );

  const currentLocation = QUERY_LOCATIONS[location];

  function applyLocationQuery() {
    const matched = matchLocation(locationQuery);

    if (!matched) {
      // 찾지 못하면 조회 위치를 그대로 둔다. 매장 0개로 바꾸지 않는다(F02).
      setLocationNotice(
        locationQuery.trim()
          ? `"${locationQuery.trim()}" 위치를 찾지 못했어요. 조회 위치는 그대로 둡니다.`
          : "주소 또는 지역명을 입력해 주세요.",
      );
      return;
    }

    setLocation(matched);
    setUsingCurrentLocation(false);
    setLocationQuery("");
    setLocationNotice(null);
  }

  function selectLocation(next: LocationKey) {
    setLocation(next);
    setUsingCurrentLocation(false);
    setLocationQuery("");
    setLocationNotice(null);
  }

  function useCurrentLocation() {
    // 실제 위치 취득(F02)은 아직 연결하지 않았다. 기본 조회 위치로 되돌리는
    // 디자인 흐름만 재현한다.
    setLocation(DEFAULT_LOCATION);
    setUsingCurrentLocation(true);
    setLocationQuery("");
    setLocationNotice(null);
  }

  function toggleGroup(groupId: string) {
    setExpandedGroups((current) =>
      current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId],
    );
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>C</span>
          <span className={styles.brandName}>CupPick</span>
        </div>
        {!isAuthenticated && (
          <button className={styles.headerAction} onClick={() => setLoginSheetOpen(true)} type="button">
            로그인
          </button>
        )}
      </header>

      {!isAuthenticated && (
        <div className={styles.guestBanner}>
          <span className={styles.guestDot} />
          <span className={styles.guestText}>게스트 모드 · 내 혜택은 로그인 후</span>
        </div>
      )}

      <div className={styles.locationBar}>
        <div className={styles.locationRow}>
          <div className={styles.searchField}>
            <span aria-hidden className={styles.searchIcon}>
              ⌕
            </span>
            <input
              aria-label="주소·지역명으로 위치 변경"
              className={styles.searchInput}
              onChange={(event) => setLocationQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                applyLocationQuery();
              }}
              placeholder="주소·지역명으로 위치 변경"
              type="text"
              value={locationQuery}
            />
            <button className={styles.searchSubmit} onClick={applyLocationQuery} type="button">
              이 위치로
            </button>
          </div>
          <button
            aria-label="현재 위치로 이동"
            aria-pressed={usingCurrentLocation}
            className={`${styles.gpsButton} ${usingCurrentLocation ? styles.gpsButtonActive : ""}`}
            onClick={useCurrentLocation}
            type="button"
          >
            ◎
          </button>
        </div>

        {locationNotice && (
          <p className={styles.locationNotice} role="status">
            {locationNotice}
          </p>
        )}

        {/* 저장한 장소는 계정 데이터다. 비로그인에는 제공하지 않는다(F02). */}
        {isAuthenticated && (
          <div className={styles.presetRow}>
            <span className={styles.presetLabel}>자주 가는 곳</span>
            {SAVED_PLACES.map((place) => {
              const active = !usingCurrentLocation && location === place.location;
              return (
                <button
                  className={`${styles.pill} ${active ? styles.pillActive : ""}`}
                  key={place.id}
                  onClick={() => selectLocation(place.location)}
                  type="button"
                >
                  {place.label} · {QUERY_LOCATIONS[place.location].name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 지도 영역. Naver Map 연결 전이라 실제 크기·레이아웃만 유지한다. */}
      <div className={styles.map} data-map-placeholder="naver-map">
        <div className={styles.mapGrid} />
        <span className={styles.mapUserDot} />

        {pins.map((pin) => {
          const meta = BRAND_META[pin.brandId];
          const badgeClass = `${styles.pinBadge} ${pinMode === "all" ? styles.pinBadgeDense : ""}`;
          const content = (
            <>
              <span className={badgeClass} style={{ background: meta.color }}>
                {meta.short}
              </span>
              {pinMode === "near" && (
                <span className={styles.pinLabel} style={{ color: meta.color }}>
                  도보 {pin.walk}분
                </span>
              )}
            </>
          );

          // 비로그인이 핀을 누르면 매장 상세 대신 로그인으로 연결한다(POL02.1).
          return isAuthenticated ? (
            <span className={styles.mapPin} key={pin.id} style={{ left: pin.x, top: pin.y }}>
              {content}
            </span>
          ) : (
            <button
              aria-label={`${pin.name} 상세는 로그인 후 확인`}
              className={`${styles.mapPin} ${styles.mapPinButton}`}
              key={pin.id}
              onClick={() => setLoginSheetOpen(true)}
              style={{ left: pin.x, top: pin.y }}
              type="button"
            >
              {content}
            </button>
          );
        })}

        <span className={styles.mapLocaleBadge}>
          📍 {currentLocation.name} 기준{usingCurrentLocation ? " · 현재 위치" : ""}
        </span>

        <div className={styles.mapControls}>
          <div className={styles.mapControlRow}>
            {WALK_RANGES.map((walkRange) => (
              <button
                className={`${styles.pill} ${styles.pillSmall} ${range === walkRange ? styles.pillActive : ""}`}
                key={walkRange}
                onClick={() => setRange(walkRange)}
                type="button"
              >
                도보 {walkRange}분
              </button>
            ))}
          </div>
          <div className={styles.mapControlRow}>
            <button
              className={`${styles.pill} ${styles.pillSmall} ${pinMode === "near" ? styles.pillActive : ""}`}
              onClick={() => setPinMode("near")}
              type="button"
            >
              브랜드별 1곳
            </button>
            <button
              className={`${styles.pill} ${styles.pillSmall} ${pinMode === "all" ? styles.pillActive : ""}`}
              onClick={() => setPinMode("all")}
              type="button"
            >
              모든 지점
            </button>
          </div>
        </div>

        {/* 지도 확대·축소는 실제 지도가 붙은 뒤에 동작한다. */}
        <div className={styles.mapZoom}>
          <button aria-label="확대" className={styles.zoomButton} disabled type="button">
            +
          </button>
          <button aria-label="축소" className={styles.zoomButton} disabled type="button">
            −
          </button>
        </div>

        {process.env.NODE_ENV !== "production" && (
          <span className={styles.mapPendingNote}>지도 미연결</span>
        )}
      </div>

      <div className={styles.filterBar}>
        {/*
          디자인의 '적립 가능'·'쿠폰 사용' 필터는 내 혜택 잔액으로 판정한다.
          해당 데이터 경로(F06~)가 아직 없어 이번 골격은 '전체'만 둔다.
        */}
        <span className={`${styles.pill} ${styles.pillActive} ${styles.pillStatic}`}>전체</span>
        <span className={styles.filterCount}>
          {groups.length}개 브랜드 · {nearbyCafes.length}곳
        </span>
      </div>

      <div className={styles.cardList}>
        {groups.length === 0 && (
          <p className={styles.emptyState}>이 범위에는 표시할 매장이 없어요.</p>
        )}

        {groups.map((group) => {
          const expanded = expandedGroups.includes(group.id);
          return (
            <article className={styles.card} key={group.id}>
              <div className={styles.cardHead}>
                <span className={styles.cardMark} style={{ background: group.color }}>
                  {group.short}
                </span>
                <div className={styles.cardTitle}>
                  <p className={styles.cardName}>{group.name}</p>
                  <p className={styles.cardNear}>
                    지점 {group.stores.length}곳 · 도보 {group.nearestWalk}분
                  </p>
                </div>
              </div>

              <div className={styles.cardMeta}>
                {/* 비로그인에는 혜택 판정·잔액을 표시하지 않는다(POL02.1). */}
                {!isAuthenticated && <span className={styles.lockNote}>🔒 혜택 정보는 로그인 후 확인</span>}
                <span className={styles.summaryPill}>
                  <span className={styles.summaryDot} />
                  지점 {group.stores.length}곳
                </span>
              </div>

              <button
                aria-expanded={expanded}
                className={styles.toggleButton}
                onClick={() => toggleGroup(group.id)}
                type="button"
              >
                {expanded ? "접기" : `지점 ${group.stores.length}곳 보기`}
              </button>

              {expanded && (
                <div className={styles.storeList}>
                  {group.stores.map((store) => (
                    <div className={styles.storeRow} key={store.id}>
                      <div className={styles.storeTitle}>
                        <p className={styles.storeName}>{store.name}</p>
                        <p className={`${styles.storeWalk} ${styles.storeWalkKnown}`}>도보 {store.walk}분</p>
                      </div>
                      {/* 외부 지도 길찾기(F05)는 아직 연결하지 않았다. */}
                      <button className={styles.directionsButton} disabled type="button">
                        길찾기
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </article>
          );
        })}

        {!isAuthenticated && groups.length > 0 && (
          <button className={styles.registerCta} onClick={() => setLoginSheetOpen(true)} type="button">
            ＋ 혜택 등록하기 (로그인 필요)
          </button>
        )}
      </div>

      {loginSheetOpen && <LoginSheet onDismiss={() => setLoginSheetOpen(false)} />}
    </div>
  );
}
