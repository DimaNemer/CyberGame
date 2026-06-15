import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { getSession } from "../lib/api";
import { supabase } from "../lib/supabase";
import { COLORS } from "../constants/colors";

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await getSession();
      if (session) {
        router.replace("/(tabs)/dashboard");
      } else {
        router.replace("/welcome");
      }
    } catch {
      router.replace("/welcome");
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: "center",
    alignItems: "center",
  },
});