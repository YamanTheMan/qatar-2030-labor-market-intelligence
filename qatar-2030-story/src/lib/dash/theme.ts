"use client";

import { BASE_PATH } from "@/lib/basePath";
import { useEffect, useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const KEY = "q2030-theme";

function stored(): Theme {
  try {
    return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

let current: Theme = typeof window === "undefined" ? "light" : stored();
/** The attribute is only applied while the dashboard is on screen; other pages stay light. */
let active = false;
const listeners = new Set<() => void>();

function apply() {
  const root = document.documentElement;
  if (active && current === "dark") root.dataset.theme = "dark";
  else delete root.dataset.theme;
}

export function setTheme(t: Theme) {
  current = t;
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* private mode: the choice lasts for this visit only */
  }
  apply();
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/** Light by default: the choice is the reader's, not the operating system's. */
export function useTheme(): Theme {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => "light",
  );
}

/** Call once from the dashboard root. */
export function useDashboardTheme() {
  useEffect(() => {
    active = true;
    apply();
    return () => {
      active = false;
      apply();
    };
  }, []);
}

/** Runs before first paint so a dark-theme reader never sees a light flash. */
export const THEME_BOOT_SCRIPT = `try{if(location.pathname===(${JSON.stringify(BASE_PATH)}+"/")&&localStorage.getItem("${KEY}")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;
