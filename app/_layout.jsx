import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SettingsProvider } from "../context/SettingsContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="game-player" />
          <Stack.Screen name="game-result" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}