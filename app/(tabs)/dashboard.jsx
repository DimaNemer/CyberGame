import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import { COLORS } from "../../constants/colors";
import {
  getCurrentUser,
  getProfile,
  getStreak,
  getFeaturedGames,
  getRecentActivity,
  getGlobalLeaderboard,
} from "../../lib/api";

const { width } = Dimensions.get("window");
const CARD_W    = width * 0.60;
const RANK_COLORS = { 1: COLORS.rank[1], 2: COLORS.rank[2], 3: COLORS.rank[3] };

// ── Fallback mock while real data loads ───────────────────
const MOCK_GAMES = [
  { id: "1", title: "Phishing Trap",  category: "Phishing", difficulty: "HARD",   icon: "🎣", is_live: true,  players: 0 },
  { id: "2", title: "Quantum Cipher", category: "Quantum",  difficulty: "EXPERT", icon: "⚛️", is_live: false, players: 0 },
  { id: "3", title: "Binary Breach",  category: "Hacking",  difficulty: "MEDIUM", icon: "💻", is_live: true,  players: 0 },
];
// ─────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile,  setProfile]  = useState(null);
  const [streak,   setStreak]   = useState({ current_streak: 0 });
  const [games,    setGames]    = useState(MOCK_GAMES);
  const [activity, setActivity] = useState([]);
  const [rank,     setRank]     = useState("—");
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) { router.replace("/welcome"); return; }

      // Load all data in parallel
      const [prof, str, featuredGames, recentActivity, leaderboard] =
        await Promise.all([
          getProfile(user.id),
          getStreak(user.id),
          getFeaturedGames(),
          getRecentActivity(5),
          getGlobalLeaderboard(100),
        ]);

      if (prof)            setProfile(prof);
      if (str)             setStreak(str);
      if (featuredGames?.length)  setGames(featuredGames);
      if (recentActivity?.length) setActivity(recentActivity);

      // Calculate rank
      if (leaderboard?.length && prof) {
        const userRank = leaderboard.findIndex(p => p.id === prof.id) + 1;
        setRank(userRank > 0 ? `#${userRank}` : "—");
      }

    } catch (err) {
      console.error("[Dashboard]", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <Navbar />
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Navbar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Welcome Banner */}
        <View style={styles.banner}>
          <View>
            <Text style={styles.bannerGreet}>Welcome back 👋</Text>
            <Text style={styles.bannerName}>
              {profile?.username ?? "Player"}
            </Text>
          </View>
          <View style={styles.xpBadge}>
            <Text style={styles.xpLabel}>⚡ XP</Text>
            <Text style={styles.xpValue}>
              {(profile?.xp ?? 0).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Rank",   value: rank,                           icon: "🏆", color: COLORS.rank[1] },
            { label: "Streak", value: `${streak.current_streak}`,     icon: "🔥", color: "#f97316"      },
            { label: "Wins",   value: `${profile?.total_wins ?? 0}`,  icon: "✅", color: COLORS.success },
          ].map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Featured Games */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎮 Featured Games</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/games")}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsRow}
        >
          {games.map((game) => {
            const cat  = COLORS.category[game.category] || COLORS.category.Cybersecurity;
            const diff = COLORS.diff[game.difficulty]   || COLORS.diff.MEDIUM;
            return (
              <TouchableOpacity
                key={game.id}
                style={[styles.gameCard, { backgroundColor: cat.bg }]}
                activeOpacity={0.85}
                onPress={() => router.push("/(tabs)/games")}
              >
                <View style={styles.cardTopRow}>
                  <View style={[styles.diffBadge, {
                    backgroundColor: diff.bg,
                    borderColor: diff.border,
                  }]}>
                    <Text style={[styles.diffText, { color: diff.text }]}>
                      {game.difficulty}
                    </Text>
                  </View>
                  {game.is_live && (
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardIcon}>{game.icon ?? "🎮"}</Text>
                <Text style={[styles.cardCategory, { color: cat.accent }]}>
                  {game.category}
                </Text>
                <Text style={styles.cardTitle}>{game.title}</Text>
                <Text style={styles.cardPlayers}>
                  {game.is_live ? `👥 ${game.plays ?? 0} plays` : "🎮 Single player"}
                </Text>
                <View style={[styles.playBtn, { borderColor: cat.accent + "60" }]}>
                  <Text style={[styles.playText, { color: cat.accent }]}>▶</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚡ Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/leaderboard")}>
            <Text style={styles.seeAll}>Full board →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityCard}>
          {activity.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyText}>No activity yet — play a game! 🎮</Text>
            </View>
          ) : (
            activity.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.activityRow,
                  index < activity.length - 1 && styles.activityBorder,
                ]}
              >
                <Text style={[
                  styles.activityRank,
                  { color: RANK_COLORS[index + 1] || COLORS.textMuted },
                ]}>
                  #{index + 1}
                </Text>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityPlayer}>
                    {item.profiles?.username ?? "Unknown"}
                  </Text>
                  <Text style={styles.activityGame}>
                    {item.games?.title ?? "Unknown game"}
                  </Text>
                </View>
                <View style={styles.activityRight}>
                  <Text style={styles.activityScore}>
                    {item.score.toLocaleString()}
                  </Text>
                  <Text style={styles.activityTime}>
                    {new Date(item.played_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: COLORS.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingTop: 20 },

  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText:   { color: COLORS.textSecondary, fontSize: 14 },

  banner: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", backgroundColor: COLORS.bgCard,
    borderRadius: 18, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.borderBlue,
  },
  bannerGreet: { color: COLORS.textSecondary, fontSize: 13 },
  bannerName:  { color: COLORS.textPrimary, fontSize: 21, fontWeight: "800", marginTop: 2 },
  xpBadge: {
    backgroundColor: COLORS.primaryGlow, borderRadius: 14,
    padding: 12, alignItems: "center",
    borderWidth: 1, borderColor: COLORS.borderBlue,
  },
  xpLabel: { color: COLORS.primary, fontSize: 11, fontWeight: "700" },
  xpValue: { color: COLORS.textPrimary, fontSize: 20, fontWeight: "800" },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: COLORS.bgCard,
    borderRadius: 14, padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  statIcon:  { fontSize: 22, marginBottom: 5 },
  statValue: { fontSize: 17, fontWeight: "800" },
  statLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 3 },

  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 12,
  },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700" },
  seeAll:       { color: COLORS.primary, fontSize: 13, fontWeight: "600" },

  cardsRow: { gap: 12, paddingRight: 16, marginBottom: 24 },
  gameCard: {
    width: CARD_W, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000", shadowOpacity: 0.4,
    shadowRadius: 12, elevation: 6,
    minHeight: 200, justifyContent: "space-between",
  },
  cardTopRow:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  diffBadge:    { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  diffText:     { fontSize: 10, fontWeight: "800" },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(239,68,68,0.2)",
    borderWidth: 1, borderColor: "rgba(239,68,68,0.4)",
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  liveDot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: COLORS.live },
  liveText:     { color: "#fca5a5", fontSize: 10, fontWeight: "800" },
  cardIcon:     { fontSize: 36, marginBottom: 10 },
  cardCategory: { fontSize: 11, fontWeight: "700", marginBottom: 4 },
  cardTitle:    { color: "#f8fafc", fontSize: 15, fontWeight: "800", marginBottom: 8 },
  cardPlayers:  { color: "rgba(248,250,252,0.55)", fontSize: 12, marginBottom: 12 },
  playBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1, alignItems: "center",
    justifyContent: "center", alignSelf: "flex-end",
  },
  playText: { fontSize: 12, fontWeight: "700" },

  activityCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border,
    overflow: "hidden", marginBottom: 8,
  },
  activityRow: {
    flexDirection: "row", alignItems: "center", padding: 14, gap: 12,
  },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  activityRank:   { width: 32, fontSize: 14, fontWeight: "800", textAlign: "center" },
  activityInfo:   { flex: 1 },
  activityPlayer: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "600" },
  activityGame:   { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  activityRight:  { alignItems: "flex-end" },
  activityScore:  { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
  activityTime:   { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },

  emptyActivity: { padding: 24, alignItems: "center" },
  emptyText:     { color: COLORS.textMuted, fontSize: 13 },
});