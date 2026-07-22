import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
} from "react-native";
import { COLORS } from "../../constants/colors";

const { width } = Dimensions.get("window");
const CARD_W = (width - 48) / 2;

export default function GameCard({ game, onPress }) {
  const diff     = COLORS.diff[game.difficulty]     || COLORS.diff.MEDIUM;
  const catColor = COLORS.category[game.category]   || COLORS.category.Cybersecurity;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: catColor.bg }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      {/* Glow overlay */}
      <View style={[styles.glowOverlay, { backgroundColor: catColor.glow }]} />

      {/* Decorative circles */}
      <View style={[styles.circle1, { borderColor: catColor.accent + "30" }]} />
      <View style={[styles.circle2, { borderColor: catColor.accent + "20" }]} />

      {/* Top badges */}
      <View style={styles.topRow}>
        <View style={[styles.diffBadge, {
          backgroundColor: diff.bg,
          borderColor: diff.border,
        }]}>
          <Text style={[styles.diffText, { color: diff.text }]}>
            {game.difficulty}
          </Text>
        </View>
        {game.live && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      {/* Icon + category */}
      <Text style={styles.gameIcon}>{game.icon}</Text>
      <Text style={[styles.category, { color: catColor.accent }]}>
        {game.category}
      </Text>

      {/* Title + desc */}
      <Text style={styles.title} numberOfLines={2}>{game.title}</Text>
      <Text style={styles.desc}  numberOfLines={2}>{game.description}</Text>

      {/* Bottom row */}
      <View style={styles.bottomRow}>
        <Text style={styles.playersText}>
          {game.live ? `👥 ${game.players}` : "🎮 Solo"}
        </Text>
        <View style={[styles.playBtn, { borderColor: catColor.accent + "60" }]}>
          <Text style={[styles.playText, { color: catColor.accent }]}>▶</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    minHeight: 210,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  glowOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 60, borderRadius: 20,
  },
  circle1: {
    position: "absolute", top: -24, right: -24,
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  circle2: {
    position: "absolute", bottom: 16, right: -16,
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 1,
    backgroundColor: "transparent",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  diffBadge: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  diffText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(239,68,68,0.2)",
    borderWidth: 1, borderColor: "rgba(239,68,68,0.4)",
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  liveDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: COLORS.live,
  },
  liveText: { color: "#fca5a5", fontSize: 10, fontWeight: "800" },

  gameIcon: { fontSize: 38, marginBottom: 6 },
  category: { fontSize: 11, fontWeight: "700", marginBottom: 5, letterSpacing: 0.5 },
  title: {
    color: "#f8fafc", fontSize: 15,
    fontWeight: "800", marginBottom: 5, letterSpacing: 0.1,
  },
  desc: {
    color: "rgba(248,250,252,0.6)",
    fontSize: 11, lineHeight: 16, marginBottom: 12,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playersText: { color: "rgba(248,250,252,0.55)", fontSize: 11 },
  playBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  playText: { fontSize: 12, fontWeight: "700" },
});