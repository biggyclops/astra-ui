import { useState, useCallback, useEffect } from "react";
import {
  type AstraSettings,
  defaultSettings,
  SETTINGS_STORAGE_KEY,
} from "@shared/settings";

function loadSettings(): AstraSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return deepMerge(defaultSettings, parsed);
  } catch {
    return defaultSettings;
  }
}

function deepMerge<T extends Record<string, any>>(base: T, override: Partial<T>): T {
  const result = { ...base };
  for (const key in override) {
    if (
      override[key] !== null &&
      typeof override[key] === "object" &&
      !Array.isArray(override[key]) &&
      typeof base[key] === "object" &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(base[key], override[key] as any);
    } else if (override[key] !== undefined) {
      result[key] = override[key] as any;
    }
  }
  return result;
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AstraSettings>(loadSettings);

  const setSettings = useCallback((updater: (prev: AstraSettings) => AstraSettings) => {
    setSettingsState((prev) => {
      const next = updater(prev);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateSection = useCallback(<K extends keyof AstraSettings>(
    section: K,
    patch: Partial<AstraSettings[K]>
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...patch },
    }));
  }, [setSettings]);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    setSettingsState(defaultSettings);
  }, []);

  const exportSettings = useCallback(() => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "astra-settings.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [settings]);

  const importSettings = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const merged = deepMerge(defaultSettings, parsed);
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
        setSettingsState(merged);
      } catch {
        console.error("Failed to import settings");
      }
    };
    reader.readAsText(file);
  }, []);

  return { settings, updateSection, resetSettings, exportSettings, importSettings };
}
