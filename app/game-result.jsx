import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, Animated,
} from "react-native";
import { useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

export default function GameResult() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const {
    id, score, correct,
    total, result, gameTitle, gameIcon,
  } = params;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const scoreNum   = parseInt(score)   || 0;
  const correctNum = parseInt(correct) || 0;
  const totalNum   = parseInt(total)   || 10;
  const accuracy   = Math.round((correctNum / totalNum) * 100);
  const isWin      = result === "win";
  const xpEarned   = isWin ? 25 : 5;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1, tension: 50, friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getPerformance = () => {
    if (accuracy >= 90) return { label: "Expert",      emoji: "🏆", color: COLORS.rank[1]  };
    if (accuracy >= 70) return { label: "Great",       emoji: "🌟", color: COLORS.success  };
    if (accuracy >= 60) return { label: "Good",        emoji: "✅", color: COLORS.primary  };
    if (accuracy >= 40) return { label: "Fair",        emoji: "📚", color: COLORS.warning  };
    return                     { label: "Keep Trying", emoji: "💪", color: COLORS.danger   };
  };

  const perf = getPerformance();

  const TIPS = [
    "Always check the sender domain character by character before clicking any link.",
    "Urgency and threats in emails are the most common phishing tactics — slow down when you feel pressured.",
    "Real companies never ask for payment details or passwords via email.",
    "When in doubt, go directly to the website by typing the URL yourself.",
    "Domain spoofing uses letters that look like numbers — paypa1 vs paypal.",
  ];

  const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* Result Hero */}
        <Animated.View style={[
          styles.heroCard,
          { transform: [{ scale: scaleAnim }] },
        ]}>
          <View style={styles.heroBg} />

          <Text style={styles.resultEmoji}>
            {isWin ? "🏆" : "💪"}
          </Text>
          <Text style={[
            styles.resultTitle,
            { color: isWin ? COLORS.success : COLORS.warning },
          ]}>
            {isWin ? "You Won!" : "Good Try!"}
          </Text>
          <Text style={styles.gameLabel}>
            {gameIcon} {gameTitle}
          </Text>

          {/* Score */}
          <View style={styles.scoreBig}>
            <Text style={styles.scoreBigLabel}>Final Score</Text>
            <Text style={styles.scoreBigValue}>
              {scoreNum.toLocaleString()}
            </Text>
          </View>

          {/* Performance badge */}
          <View style={[styles.perfBadge, { borderColor: perf.color + "50" }]}>
            <Text style={styles.perfEmoji}>{perf.emoji}</Text>
            <Text style={[styles.perfLabel, { color: perf.color }]}>
              {perf.label}
            </Text>
          </View>
        </Animated.View>

        {/* Stats */}
        <Animated.View style={[styles.statsCard, { opacity: fadeAnim }]}>
          {[
            { label: "Correct",   value: `${correctNum}/${totalNum}`, icon: "✅", color: COLORS.success  },
            { label: "Accuracy",  value: `${accuracy}%`,              icon: "🎯", color: COLORS.primary  },
            { label: "XP Earned", value: `+${xpEarned}`,              icon: "⚡", color: COLORS.rank[1]  },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>
                {s.value}
              </Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* What you learned */}
        <Animated.View style={[styles.learnCard, { opacity: fadeAnim }]}>
          <Text style={styles.learnTitle}>🧠 Real World Application</Text>
          <Text style={styles.learnText}>
            The skills you just practised apply directly to real life.
            Phishing attacks are responsible for over 90% of successful
            cyber attacks worldwide. Every email you correctly identified
            is a skill that protects you and your organisation.
          </Text>
        </Animated.View>

        {/* Tip */}
        <Animated.View style={[styles.tipCard, { opacity: fadeAnim }]}>
          <Text style={styles.tipTitle}>💡 Remember This</Text>
          <Text style={styles.tipText}>{randomTip}</Text>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View style={[styles.btnGroup, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.playAgainBtn}
            onPress={() => router.replace({
              pathname: "/game-player",
              params: { id },
            })}
            activeOpacity={0.85}
          >
            <Text style={styles.playAgainText}>🔄  Play Again</Text>
          </TouchableOpacity>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() => router.replace("/(tabs)/dashboard")}
              activeOpacity={0.85}
            >
              <Text style={styles.homeBtnText}>🏠 Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.leaderBtn}
              onPress={() => router.replace("/(tabs)/leaderboard")}
              activeOpacity={0.85}
            >
              <Text style={styles.leaderBtnText}>🏆 Leaderboard</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, gap: 16 },

  // Hero
  heroCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 24, padding: 28,
    borderWidth: 1, borderColor: COLORS.borderBlue,
    alignItems: "center", overflow: "hidden",
  },
  heroBg: {
    position: "absolute", top: -60, left: "20%",
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: "rgba(59,130,246,0.05)",
  },
  resultEmoji:   { fontSize: 64, marginBottom: 12 },
  resultTitle:   { fontSize: 28, fontWeight: "800", marginBottom: 6 },
  gameLabel:     { color: COLORS.textSecondary, fontSize: 14, marginBottom: 24 },
  scoreBig:      { alignItems: "center", marginBottom: 16 },
  scoreBigLabel: { color: COLORS.textMuted, fontSize: 13, marginBottom: 4 },
  scoreBigValue: {
    color: COLORS.textPrimary, fontSize: 52,
    fontWeight: "800", letterSpacing: -1,
  },
  perfBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  perfEmoji: { fontSize: 20 },
  perfLabel: { fontSize: 15, fontWeight: "700" },

  // Stats
  statsCard: {
    flexDirection: "row",
    backgroundColor: COLORS.bgCard,
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  statItem:  { flex: 1, alignItems: "center", gap: 4 },
  statIcon:  { fontSize: 22 },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { color: COLORS.textMuted, fontSize: 11 },

  // Learn card
  learnCard: {
    backgroundColor: "rgba(16,185,129,0.06)",
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "rgba(16,185,129,0.2)",
  },
  learnTitle: {
    color: COLORS.success, fontSize: 14,
    fontWeight: "700", marginBottom: 8,
  },
  learnText: {
    color: COLORS.textSecondary, fontSize: 13, lineHeight: 20,
  },

  // Tip card
  tipCard: {
    backgroundColor: "rgba(59,130,246,0.06)",
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.borderBlue,
  },
  tipTitle: {
    color: COLORS.primary, fontSize: 14,
    fontWeight: "700", marginBottom: 8,
  },
  tipText: {
    color: COLORS.textSecondary, fontSize: 13,
    lineHeight: 20, fontStyle: "italic",
  },

  // Buttons
  btnGroup:     { gap: 10 },
  playAgainBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16,
    padding: 16, alignItems: "center",
    shadowColor: COLORS.primary, shadowOpacity: 0.4,
    shadowRadius: 12, elevation: 6,
  },
  playAgainText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  btnRow:   { flexDirection: "row", gap: 10 },
  homeBtn: {
    flex: 1, backgroundColor: COLORS.bgCard,
    borderRadius: 14, padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
  },
  homeBtnText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700" },

  leaderBtn: {
    flex: 1,
    backgroundColor: "rgba(251,191,36,0.08)",
    borderRadius: 14, padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(251,191,36,0.25)",
  },
  leaderBtnText: { color: COLORS.rank[1], fontSize: 14, fontWeight: "700" },
});