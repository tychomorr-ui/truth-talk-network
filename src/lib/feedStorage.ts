const STORAGE_KEY = "truth-talk.feed-local-filters.v1";
export type FeedLocalFilters = { hiddenEventIds: string[]; mutedPubkeys: string[] };
const empty: FeedLocalFilters = { hiddenEventIds: [], mutedPubkeys: [] };

function isEventId(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }
function isPubkey(value: unknown): value is string { return typeof value === "string" && /^[0-9a-f]{64}$/.test(value); }

export function loadFeedLocalFilters(storage: Storage = window.localStorage): FeedLocalFilters {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...empty };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { ...empty };
    const value = parsed as Record<string, unknown>;
    return {
      hiddenEventIds: Array.isArray(value.hiddenEventIds) ? [...new Set(value.hiddenEventIds.filter(isEventId))].slice(0, 2_000) : [],
      mutedPubkeys: Array.isArray(value.mutedPubkeys) ? [...new Set(value.mutedPubkeys.filter(isPubkey))].slice(0, 1_000) : [],
    };
  } catch { return { ...empty }; }
}

export function saveFeedLocalFilters(filters: FeedLocalFilters, storage: Storage = window.localStorage): void {
  const safe: FeedLocalFilters = {
    hiddenEventIds: [...new Set(filters.hiddenEventIds.filter(isEventId))].slice(0, 2_000),
    mutedPubkeys: [...new Set(filters.mutedPubkeys.filter(isPubkey))].slice(0, 1_000),
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(safe));
}
