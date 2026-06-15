import {
  View, Text, TouchableOpacity, StyleSheet,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

const NAV_ITEMS = [
  { label: "Home",    icon: "🏠", route: "/(tabs)/dashboard"   },
  { label: "Games",   icon: "🎮", route: "/(tabs)/games"       },
  { label: "Ranks",   icon: "🏆", route: "/(tabs)/leaderboard" },
  { label: "Chat",    icon: "💬", route: "/(tabs)/chat"        },
  { label: "Profile", icon: "👤", route: "/(tabs)/profile"     },
];

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const insets   = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top || 36 }]}>
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <Text style={styles.logoIcon}>🛡️</Text>
          <Text style={styles.logoText}>CyberGame</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => router.replace("/welcome")}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>⏻  Log Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {NAV_ITEMS.map((item) => {
          const active = pathname.includes(
            item.route.replace("/(tabs)/", "")
          );
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => router.push(item.route)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{item.icon}</Text>
              <Text style={[
                styles.tabLabel,
                active && styles.tabLabelActive,
              ]}>
                {item.label}
              </Text>
              {active && <View style={styles.activeLine} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  logoRow:  { flexDirection: "row", alignItems: "center", gap: 8 },
  logoIcon: { fontSize: 22 },
  logoText: {
    color: COLORS.textPrimary,
    fontWeight: "800", fontSize: 19,
    letterSpacing: 0.5,
  },
  logoutBtn: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
  },
  logoutText: { color: "#fca5a5", fontSize: 12, fontWeight: "700" },

  tabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tabItem: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    position: "relative",
    minWidth: 52,
  },
  tabItemActive: {
    backgroundColor: COLORS.primaryGlow,
  },
  tabIcon:       { fontSize: 19, marginBottom: 2 },
  tabLabel:      { color: COLORS.textMuted, fontSize: 10, fontWeight: "600" },
  tabLabelActive:{ color: COLORS.primary },
  activeLine: {
    position: "absolute", bottom: -6,
    width: "60%", height: 2,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
});