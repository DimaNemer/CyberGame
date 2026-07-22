import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";
import FeedbackSection from "./FeedbackSection";

export default function EmailCard({ question, phase, selected, isCorrect, pointsEarned }) {
  const emailData = question?.options ?? {};

  return (
    <View style={[
      styles.card,
      phase === "feedback" && {
        borderColor: selected === "TIMEOUT" ? COLORS.textMuted
          : isCorrect ? COLORS.success : COLORS.danger,
        borderWidth: 2,
      },
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 20 }}>✉️</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.from} numberOfLines={1}>
            From: {emailData.sender ?? "unknown@domain.com"}
          </Text>
          <Text style={styles.subject} numberOfLines={1}>
            {emailData.subject ?? "No subject"}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Body */}
      <Text style={styles.body}>
        {emailData.body ?? question?.question}
      </Text>

      {/* Feedback */}
      {phase === "feedback" && (
        <FeedbackSection
          selected={selected}
          isCorrect={isCorrect}
          pointsEarned={pointsEarned}
          question={question}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, overflow: "hidden",
  },
  header: {
    flexDirection: "row", alignItems: "flex-start",
    padding: 14, gap: 12, backgroundColor: COLORS.bgCardLight,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.bg, alignItems: "center",
    justifyContent: "center", borderWidth: 1,
    borderColor: COLORS.border, flexShrink: 0,
  },
  meta:    { flex: 1 },
  from:    { color: COLORS.textPrimary, fontSize: 13, fontWeight: "700", marginBottom: 3 },
  subject: { color: COLORS.textSecondary, fontSize: 12 },
  divider: { height: 1, backgroundColor: COLORS.border },
  body:    { color: COLORS.textPrimary, fontSize: 14, lineHeight: 22, padding: 16 },
});