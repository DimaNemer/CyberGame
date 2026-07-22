import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import { COLORS } from "../../constants/colors";
import FeedbackSection from "./FeedbackSection";

const { width } = Dimensions.get("window");

export default function CodeCard({ question, phase, selected, isCorrect, pointsEarned }) {
  return (
    <View style={[
      styles.card,
      phase === "feedback" && {
        borderColor: selected === "TIMEOUT" ? COLORS.textMuted
          : isCorrect ? COLORS.success : COLORS.danger,
        borderWidth: 2,
      },
    ]}>
      {/* Code editor header */}
      <View style={styles.header}>
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: "#ef4444" }]} />
          <View style={[styles.dot, { backgroundColor: "#f59e0b" }]} />
          <View style={[styles.dot, { backgroundColor: "#10b981" }]} />
        </View>
        <Text style={styles.lang}>
          {question?.options?.language ?? "Code"}
        </Text>
      </View>

      {/* Code body */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text style={styles.code}>
          {question?.options?.code ?? ""}
        </Text>
      </ScrollView>

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
    backgroundColor: "#0d1117", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(48,54,61,0.8)", overflow: "hidden",
  },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: "#161b22",
    borderBottomWidth: 1, borderBottomColor: "rgba(48,54,61,0.8)",
  },
  dots: { flexDirection: "row", gap: 6 },
  dot:  { width: 12, height: 12, borderRadius: 6 },
  lang: { color: "#8b949e", fontSize: 12, fontWeight: "600" },
  code: {
    color: "#e6edf3", fontSize: 13,
    fontFamily: "monospace", lineHeight: 22,
    padding: 16, minWidth: width - 48,
  },
});