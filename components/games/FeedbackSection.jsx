import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

export default function FeedbackSection({ selected, isCorrect, pointsEarned, question }) {
  const isTimeout = selected === "TIMEOUT";

  const bgColor = isTimeout
    ? "rgba(100,100,100,0.06)"
    : isCorrect
      ? "rgba(16,185,129,0.06)"
      : "rgba(239,68,68,0.06)";

  const borderColor = isTimeout
    ? COLORS.textMuted
    : isCorrect
      ? COLORS.success
      : COLORS.danger;

  const titleColor = isTimeout
    ? COLORS.textMuted
    : isCorrect
      ? COLORS.success
      : COLORS.danger;

  const icon  = isTimeout ? "⏱️" : isCorrect ? "✅" : "❌";
  const title = isTimeout
    ? "Time's Up!"
    : isCorrect
      ? `Correct! +${pointsEarned} pts`
      : "Wrong Answer";

  return (
    <View style={[styles.box, { backgroundColor: bgColor, borderTopColor: borderColor }]}>

      {/* Result row */}
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
          <Text style={styles.answer}>
            Correct answer:{" "}
            <Text style={styles.answerValue}>{question?.answer}</Text>
          </Text>
        </View>
      </View>

      {/* Explanation */}
      <View style={styles.explanationBox}>
        <Text style={styles.explanationTitle}>🧠 Why?</Text>
        <Text style={styles.explanationText}>{question?.explanation}</Text>
      </View>

      {/* Tip */}
      {question?.tip && (
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>{question.tip}</Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderTopWidth: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  icon:  { fontSize: 32 },
  title: { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  answer:{ color: COLORS.textSecondary, fontSize: 13 },
  answerValue: { fontWeight: "800", color: COLORS.textPrimary },

  explanationBox: {
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  explanationTitle: {
    color: COLORS.textPrimary, fontSize: 13,
    fontWeight: "700", marginBottom: 6,
  },
  explanationText: {
    color: COLORS.textSecondary, fontSize: 13, lineHeight: 20,
  },

  tipBox: {
    backgroundColor: "rgba(59,130,246,0.08)",
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.borderBlue,
  },
  tipText: {
    color: COLORS.primary, fontSize: 12,
    lineHeight: 18, fontStyle: "italic",
  },
});