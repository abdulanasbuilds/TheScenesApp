import { useSyncExternalStore } from "react";
import {
  EMPTY_ONBOARDING_PROFILE,
  ONBOARDING_STORAGE_KEY,
  type OnboardingProfile,
} from "./contracts";

/**
 * A tiny localStorage-backed store for first-run onboarding selections.
 *
 * The store is intentionally framework-light: the onboarding route writes it, and the learner home
 * and creator overview read it. It is the documented fixture-mode persistence ("localStorage in
 * fixture mode"); connected mode also persists the display name through the existing profile
 * function, but role/focus stay browser-local until a reviewed profile field exists.
 */

let cache: OnboardingProfile | null = null;
const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function normalize(value: unknown): OnboardingProfile {
  if (!value || typeof value !== "object") return EMPTY_ONBOARDING_PROFILE;
  const record = value as Record<string, unknown>;
  return {
    role: record.role === "creator" ? "creator" : "learner",
    focusAreas: Array.isArray(record.focusAreas)
      ? record.focusAreas.filter((item): item is string => typeof item === "string")
      : [],
    displayName: typeof record.displayName === "string" ? record.displayName : "",
    avatarHue:
      typeof record.avatarHue === "number" ? record.avatarHue : EMPTY_ONBOARDING_PROFILE.avatarHue,
    firstCourseId: typeof record.firstCourseId === "string" ? record.firstCourseId : null,
    completedAt: typeof record.completedAt === "string" ? record.completedAt : null,
  };
}

function readProfile(): OnboardingProfile {
  if (!isBrowser()) return EMPTY_ONBOARDING_PROFILE;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return EMPTY_ONBOARDING_PROFILE;
    return normalize(JSON.parse(raw));
  } catch {
    return EMPTY_ONBOARDING_PROFILE;
  }
}

export function getOnboardingProfile(): OnboardingProfile {
  if (!cache) cache = readProfile();
  return cache;
}

function notify() {
  listeners.forEach((listener) => listener());
}

export function saveOnboardingProfile(next: OnboardingProfile): void {
  cache = next;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be unavailable (private mode). The in-memory value still guides this session.
    }
  }
  notify();
}

export function updateOnboardingProfile(patch: Partial<OnboardingProfile>): void {
  saveOnboardingProfile({ ...getOnboardingProfile(), ...patch });
}

export function resetOnboardingProfile(): void {
  cache = EMPTY_ONBOARDING_PROFILE;
  if (isBrowser()) {
    try {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    } catch {
      // Ignore unavailable storage.
    }
  }
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

if (isBrowser()) {
  window.addEventListener("storage", (event) => {
    if (event.key !== ONBOARDING_STORAGE_KEY) return;
    cache = null;
    notify();
  });
}

/**
 * Reads the stored onboarding profile. `hydrated` is false during server rendering and the first
 * hydration pass, so callers can avoid rendering browser-dependent guidance into the server markup.
 */
export function useOnboardingProfile(): { profile: OnboardingProfile; hydrated: boolean } {
  const stored = useSyncExternalStore<OnboardingProfile | null>(
    subscribe,
    getOnboardingProfile,
    () => null,
  );
  return {
    profile: stored ?? EMPTY_ONBOARDING_PROFILE,
    hydrated: stored !== null,
  };
}
