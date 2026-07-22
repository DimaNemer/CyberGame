
import {
  View, Text, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, Dimensions,
  ActivityIndicator,
} from "react-native";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Navbar from "../../components/Navbar";
import GameCard from "../../components/games/GameCard";
import { COLORS } from "../../constants/colors";
import { getPublishedGames } from "../../lib/api";

const { width } = Dimensions.get("window");
const FILTERS = ["All", "Cybersecurity", "Quantum", "Hacking", "Phishing", "Crypto", "AI Security"];

export default function Games() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [games,        setGames]   = useState([]);
  const [search,       setSearch]  = useState("");
  const [activeFilter, setFilter]  = useState("All");
  const [loading,      setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const data = await getPublishedGames();
      setGames(data ?? []);
    } catch (err) {
      console.error("[Games]", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => games.filter((g) => {
    const matchFilter = activeFilter === "All" || g.category === activeFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      g.title.toLowerCase().includes(q) ||
      g.category?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  }), [games, search, activeFilter]);

  const liveGames  = filtered.filter((g) => g.is_live);
  const otherGames = filtered.filter((g) => !g.is_live);

  if (loading) {
    return (
      <View style={styles.screen}>
        <Navbar />
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading games...</Text>
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎮 Games</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filtered.length} games</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search games or categories..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f;
            const cat    = COLORS.category[f];
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterChip,
                  active && {
                    backgroundColor: cat ? cat.bg : COLORS.primary,
                    borderColor:     cat ? cat.accent : COLORS.primary,
                  },
                ]}
                onPress={() => setFilter(f)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.filterText,
                  active && { color: cat ? cat.accent : "#fff" },
                ]}>
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Empty */}
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={styles.emptyTitle}>No games found</Text>
            <Text style={styles.emptyText}>Try a different search or filter</Text>
          </View>
        )}

        {/* Live Now */}
        {liveGames.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.livePulse} />
              <Text style={styles.sectionTitle}>Live Now</Text>
              <Text style={styles.sectionCount}>{liveGames.length} active</Text>
            </View>
            <View style={styles.grid}>
              {liveGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onPress={() => router.push({
                    pathname: "/game-player",
                    params: { id: game.id },
                  })}
                />
              ))}
            </View>
          </>
        )}

        {/* Other Games */}
        {otherGames.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {liveGames.length > 0 ? "More Games" : "All Games"}
              </Text>
              <Text style={styles.sectionCount}>{otherGames.length} games</Text>
            </View>
            <View style={styles.grid}>
              {otherGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onPress={() => router.push({
                    pathname: "/game-player",
                    params: { id: game.id },
                  })}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:        { flex: 1, backgroundColor: COLORS.bg },
  scroll:        { flex: 1 },
  content:       { padding: 16, paddingTop: 20 },
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText:   { color: COLORS.textSecondary, fontSize: 14 },

  header:      { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  headerTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: "800" },
  countBadge: {
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1, borderColor: COLORS.borderBlue,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  countText: { color: COLORS.primary, fontSize: 12, fontWeight: "600" },

  searchBox: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 11, marginBottom: 14, gap: 10,
  },
  searchIcon:  { fontSize: 16 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14 },
  clearBtn:    { color: COLORS.textMuted, fontSize: 16, padding: 2 },

  filtersRow: { gap: 8, paddingRight: 16, marginBottom: 20 },
  filterChip: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  filterText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "600" },

  sectionHeader: {
    flexDirection: "row", alignItems: "center",
    gap: 8, marginBottom: 12, marginTop: 4,
  },
  livePulse:    { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.live },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "700", flex: 1 },
  sectionCount: { color: COLORS.textMuted, fontSize: 12 },
  grid:         { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 24 },

  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyIcon:  { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptyText:  { color: COLORS.textSecondary, fontSize: 14 },
});