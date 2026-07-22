import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

export default function AnswerButtons({ question, onAnswer }) {
  const type    = question?.type;
  const choices = question?.options?.choices ?? [];

  // ── Phishing Trap — REAL / PHISHING ───────────────────
  if (!type || type === "phishing") {
    return (
      <View style={styles.rowButtons}>
        <TouchableOpacity
          style={styles.realBtn}
          onPress={() => onAnswer("REAL")}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>✅</Text>
          <Text style={styles.realText}>REAL</Text>
          <Text style={styles.btnSub}>Legitimate email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.phishBtn}
          onPress={() => onAnswer("PHISHING")}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>🎣</Text>
          <Text style={styles.phishText}>PHISHING</Text>
          <Text style={styles.btnSub}>Suspicious email</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Zero Day — A B C D multiple choice ────────────────
  if (type === "code") {
    return (
      <View style={styles.choicesGrid}>
        {choices.map((choice, i) => (
          <TouchableOpacity
            key={i}
            style={styles.choiceBtn}
            onPress={() => onAnswer(choice)}
            activeOpacity={0.85}
          >
            <View style={styles.choiceLabel}>
              <Text style={styles.choiceLetter}>
                {["A", "B", "C", "D"][i]}
              </Text>
            </View>
            <Text style={styles.choiceText}>{choice}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // ── Binary Breach — incident response choices ──────────
  if (type === "breach") {
    return (
      <View style={styles.breachChoices}>
        {choices.map((choice, i) => (
          <TouchableOpacity
            key={i}
            style={styles.breachBtn}
            onPress={() => onAnswer(choice)}
            activeOpacity={0.85}
          >
            <View style={styles.breachLabel}>
              <Text style={styles.breachLetter}>
                {["A", "B", "C", "D"][i]}
              </Text>
            </View>
            <Text style={styles.breachText}>{choice}</Text>
            <Text style={styles.breachArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  // ── Quantum Cipher — cipher/theory/circuit choices ─────
  if (type === "cipher" || type === "theory" || type === "circuit") {
    return (
      <View style={styles.cipherChoices}>
        {choices.map((choice, i) => (
          <TouchableOpacity
            key={i}
            style={styles.cipherBtn}
            onPress={() => onAnswer(choice)}
            activeOpacity={0.85}
          >
            <View style={styles.cipherLabel}>
              <Text style={styles.cipherLetter}>
                {["A", "B", "C", "D"][i]}
              </Text>
            </View>
            <Text style={styles.cipherText}>{choice}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
  // ── AI Security — attack identification choices ─────────
  if (type === "ai") {
    return (
      <View style={styles.aiChoices}>
        {choices.map((choice, i) => (
          <TouchableOpacity
            key={i}
            style={styles.aiBtn}
            onPress={() => onAnswer(choice)}
            activeOpacity={0.85}
          >
            <View style={styles.aiLabel}>
              <Text style={styles.aiLetter}>
                {["A", "B", "C", "D"][i]}
              </Text>
            </View>

            <View style={styles.aiChoiceContent}>
              <Text style={styles.aiChoiceLabel}>
                SECURITY ASSESSMENT
              </Text>
              <Text style={styles.aiText}>{choice}</Text>
            </View>

            <Text style={styles.aiArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  // ── Phishing Trap ──────────────────────────────────────
  rowButtons: { flexDirection: "row", gap: 12 },
  realBtn: {
    flex: 1, backgroundColor: "rgba(16,185,129,0.1)",
    borderWidth: 2, borderColor: "rgba(16,185,129,0.35)",
    borderRadius: 18, padding: 18, alignItems: "center",
  },
  phishBtn: {
    flex: 1, backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 2, borderColor: "rgba(239,68,68,0.35)",
    borderRadius: 18, padding: 18, alignItems: "center",
  },
  btnIcon:   { fontSize: 28, marginBottom: 6 },
  realText:  { color: COLORS.success, fontSize: 16, fontWeight: "800", marginBottom: 4 },
  phishText: { color: COLORS.danger,  fontSize: 16, fontWeight: "800", marginBottom: 4 },
  btnSub:    { color: COLORS.textMuted, fontSize: 11 },

  // ── Zero Day ───────────────────────────────────────────
  choicesGrid: { gap: 10 },
  choiceBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  choiceLabel: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1, borderColor: COLORS.borderBlue,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  choiceLetter: { color: COLORS.primary, fontSize: 13, fontWeight: "800" },
  choiceText:   { color: COLORS.textPrimary, fontSize: 14, flex: 1 },

  // ── Binary Breach ──────────────────────────────────────
  breachChoices: { gap: 10 },
  breachBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
  },
  breachLabel: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  breachLetter: { color: COLORS.danger, fontSize: 13, fontWeight: "800" },
  breachText:   { color: COLORS.textPrimary, fontSize: 13, flex: 1, lineHeight: 19 },
  breachArrow:  { color: COLORS.textMuted, fontSize: 16 },

  // ── Quantum Cipher ─────────────────────────────────────
  cipherChoices: { gap: 10 },
  cipherBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "rgba(129,140,248,0.25)",
  },
  cipherLabel: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(129,140,248,0.15)",
    borderWidth: 1, borderColor: "rgba(129,140,248,0.4)",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cipherLetter: { color: "#818cf8", fontSize: 13, fontWeight: "800" },
  cipherText:   { color: COLORS.textPrimary, fontSize: 13, flex: 1, lineHeight: 19 },

    // ── AI Security ─────────────────────────────────────────
  aiChoices: {
    gap: 10,
  },
  aiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.22)",
  },
  aiLabel: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  aiLetter: {
    color: "#22d3ee",
    fontSize: 13,
    fontWeight: "800",
  },
  aiChoiceContent: {
    flex: 1,
  },
  aiChoiceLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  aiText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  aiArrow: {
    color: "#22d3ee",
    fontSize: 24,
    fontWeight: "300",
  },
});