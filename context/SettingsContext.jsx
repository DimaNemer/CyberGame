import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "cybergame_settings_v2";

export const DEFAULT_SETTINGS = Object.freeze({
  soundEnabled: true,
  vibration: true,
  timerSound: true,
  showHints: true,
  textSize: "medium",
});

const VALID_BOOLEAN_KEYS = Object.freeze([
  "soundEnabled",
  "vibration",
  "timerSound",
  "showHints",
]);

const VALID_TEXT_SIZES = Object.freeze([
  "small",
  "medium",
  "large",
]);

const SettingsContext = createContext(null);

function validateSettings(value) {
  const safe = {
    ...DEFAULT_SETTINGS,
  };

  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return safe;
  }

  for (const key of VALID_BOOLEAN_KEYS) {
    if (typeof value[key] === "boolean") {
      safe[key] = value[key];
    }
  }

  if (
    VALID_TEXT_SIZES.includes(
      value.textSize
    )
  ) {
    safe.textSize = value.textSize;
  }

  return safe;
}

export function SettingsProvider({
  children,
}) {
  const [settings, setSettings] =
    useState(DEFAULT_SETTINGS);

  const [settingsReady, setSettingsReady] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const stored =
          await AsyncStorage.getItem(
            SETTINGS_KEY
          );

        if (!mounted) {
          return;
        }

        if (!stored) {
          setSettings(
            DEFAULT_SETTINGS
          );

          return;
        }

        let parsed;

        try {
          parsed = JSON.parse(stored);
        } catch {
          parsed = null;
        }

        setSettings(
          validateSettings(parsed)
        );
      } catch (error) {
        console.error(
          "[SettingsContext load]",
          error?.message
        );

        if (mounted) {
          setSettings(
            DEFAULT_SETTINGS
          );
        }
      } finally {
        if (mounted) {
          setSettingsReady(true);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(
    async (nextSettings) => {
      const safe =
        validateSettings(
          nextSettings
        );

      setSettings(safe);

      try {
        await AsyncStorage.setItem(
          SETTINGS_KEY,
          JSON.stringify(safe)
        );
      } catch (error) {
        console.error(
          "[SettingsContext save]",
          error?.message
        );
      }

      return safe;
    },
    []
  );

  const toggleSetting =
    useCallback(
      async (key) => {
        if (
          !VALID_BOOLEAN_KEYS.includes(
            key
          )
        ) {
          return;
        }

        const next = {
          ...settings,
          [key]: !settings[key],
        };

        await persist(next);
      },
      [
        persist,
        settings,
      ]
    );

  const setTextSize =
    useCallback(
      async (size) => {
        if (
          !VALID_TEXT_SIZES.includes(
            size
          )
        ) {
          return;
        }

        await persist({
          ...settings,
          textSize: size,
        });
      },
      [
        persist,
        settings,
      ]
    );

  const resetLocalSettings =
    useCallback(async () => {
      await persist(
        DEFAULT_SETTINGS
      );
    }, [persist]);

  const value = useMemo(
    () => ({
      settings,
      settingsReady,

      toggleSetting,
      setTextSize,
      resetLocalSettings,
    }),
    [
      settings,
      settingsReady,
      toggleSetting,
      setTextSize,
      resetLocalSettings,
    ]
  );

  return (
    <SettingsContext.Provider
      value={value}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context =
    useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings must be used inside SettingsProvider"
    );
  }

  return context;
}