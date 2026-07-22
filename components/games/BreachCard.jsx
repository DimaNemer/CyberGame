import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";
import FeedbackSection from "./FeedbackSection";

export default function BreachCard({ question, phase, selected, isCorrect, pointsEarned }) {
  const severity = question?.options?.severity ?? "HIGH";

  const severityColor =
    severity === "CRITICAL" ? COLORS.danger
    : severity === "HIGH"   ? "#f97316"
    : COLORS.warning;

  const severityBg =
    severity === "CRITICAL" ? "rgba(239,68,68,0.15)"
    : severity === "HIGH"   ? "rgba(249,115,22,0.15)"
    : "rgba(245,158,11,0.15)";

  return (
    <View style={[
      styles.card,
      phase === "feedback" && {
        borderColor: selected === "TIMEOUT" ? COLORS.textMuted
          : isCorrect ? COLORS.success : COLORS.danger,
        borderWidth: 2,
      },
    ]}>
      {/* Severity header */}
      <View style={[styles.header, { backgroundColor: severityBg }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.alertIcon}>🚨</Text>
          <View>
            <Text style={[styles.severity, { color: severityColor }]}>
              {severity} ALERT
            </Text>
            <Text style={styles.system}>
              System: {question?.options?.system ?? "Unknown"}
            </Text>
          </View>
        </View>
        <View style={[styles.pulseDot, { backgroundColor: severityColor }]} />
      </View>

      {/* Alert body */}
      <View style={styles.body}>
        <Text style={styles.alertTitle}>
          {question?.options?.alert ?? "Security Alert"}
        </Text>
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>📋 Details:</Text>
          <Text style={styles.detailText}>
            {question?.options?.detail ?? ""}
          </Text>
        </View>
      </View>

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
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  alertIcon:  { fontSize: 28 },
  severity:   { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  system:     { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  pulseDot:   { width: 10, height: 10, borderRadius: 5 },
  body:       { padding: 16, gap: 12 },
  alertTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "800", lineHeight: 24 },
  detailBox: {
    backgroundColor: COLORS.bgCardLight, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  detailLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "700", marginBottom: 6 },
  detailText:  { color: COLORS.textPrimary, fontSize: 13, lineHeight: 20 },
});