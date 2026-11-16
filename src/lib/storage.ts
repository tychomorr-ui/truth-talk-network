import { EMPTY_PROFILE, GOALS, type Goal, type Profile } from "./truthTalk";

export const PROFILE_STORAGE_KEY = "truth-talk.profile.v2";
export const RELAY_STORAGE_KEY = "truth-talk.relays.v1";
const TEXT_FIELDS: Array<keyof Profile> = ["projectName", "oneLine", "problem", "solution", "founderStory", "fundingAsk", "website", "repositoryUrl", "license", "demoUrl", "tags", "evidenceLinks", "limitations"];
const MAX_FIELD_LENGTH = 8_000;

export function cloneEmptyProfile(): Profile {
  return { ...EMPTY_PROFILE, goals: [] };
}

function parseProfile(value: unknown): Profile | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<Profile>;
  if (!TEXT_FIELDS.every((key) => typeof candidate[key] === "string" && (candidate[key] as string).length <= MAX_FIELD_LENGTH)) return null;
  if (!Array.isArray(candidate.goals) || !candidate.goals.every((goal) => GOALS.includes(goal as Goal))) return null;
  return { ...cloneEmptyProfile(), ...candidate, goals: [...new Set(candidate.goals as Goal[])] };
}

export function loadProfile(storage: Storage = window.localStorage): { profile: Profile; restored: boolean } {
  const raw = storage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) return { profile: cloneEmptyProfile(), restored: false };
  try {
    const profile = parseProfile(JSON.parse(raw));
    return profile ? { profile, restored: true } : { profile: cloneEmptyProfile(), restored: false };
  } catch { return { profile: cloneEmptyProfile(), restored: false }; }
}

export function saveProfile(profile: Profile, storage: Storage = window.localStorage): void {
  storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function loadRelays(storage: Storage = window.localStorage): string[] {
  const raw = storage.getItem(RELAY_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed.slice(0, 5) : [];
  } catch { return []; }
}

export function saveRelays(relays: string[], storage: Storage = window.localStorage): void {
  storage.setItem(RELAY_STORAGE_KEY, JSON.stringify(relays));
}
