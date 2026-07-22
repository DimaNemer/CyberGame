import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../../constants/colors";
import FeedbackSection from "../FeedbackSection";

const STAGE_CONFIG = {
  1: {
    icon: "🚪",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.1)",
    border: "rgba(56,189,248,0.3)",
  },
  2: {
    icon: "🔑",
    color: "#818cf8",
    bg: "rgba(129,140,248,0.1)",
    border: "rgba(129,140,248,0.3)",
  },
  3: {
    icon: "✍️",
    color: "#c084fc",
    bg: "rgba(192,132,252,0.1)",
    border: "rgba(192,132,252,0.3)",
  },
  4: {
    icon: "⛓️",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.3)",
  },
  5: {
    icon: "🏆",
    color: "#10b981",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.3)",
  },
};

export default function MazeQuestionCard({
  question,
  phase,
  selected,
  isCorrect,
  pointsEarned,
  stageQuestionNumber,
  stageQuestionTotal,
}) {
  const options = question?.options ?? {};
  const stage = Number(options.stage) || 1;
  const config = STAGE_CONFIG[stage] ?? STAGE_CONFIG[1];

  return (
    <View
      style={[
        styles.card,
        { borderColor: config.border },
        phase === "feedback" && {
          borderColor:
            selected === "TIMEOUT"
              ? COLORS.textMuted
              : isCorrect
                ? COLORS.success
                : COLORS.danger,
          borderWidth: 2,
        },
      ]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: config.bg,
            borderBottomColor: config.border,
          },
        ]}
      >
        <View
          style={[
            styles.stageIconBox,
            {
              backgroundColor: config.bg,
              borderColor: config.border,
            },
          ]}
        >
          <Text style={styles.stageIcon}>{config.icon}</Text>
        </View>

        <View style={styles.headerContent}>
          <Text style={[styles.stageLabel, { color: config.color }]}>
            STAGE {stage}
          </Text>

          <Text style={styles.stageName}>
            {options.stage_name ?? `Chamber ${stage}`}
          </Text>
        </View>

        <View style={styles.questionCounter}>
          <Text style={styles.questionCounterText}>
            {stageQuestionNumber}/{stageQuestionTotal}
          </Text>
        </View>
      </View>

      <View style={styles.storySection}>
        <Text style={styles.storyLabel}>📜 MAZE STORY</Text>
        <Text style={styles.storyText}>
          {options.story ?? "A cryptographic challenge blocks your path."}
        </Text>
      </View>

      <View style={styles.questionSection}>
        <View style={styles.puzzleLabelRow}>
          <Text style={styles.puzzleIcon}>🧩</Text>
          <Text style={[styles.puzzleLabel, { color: config.color }]}>
            DOOR CHALLENGE
          </Text>
        </View>

        <Text style={styles.questionText}>
          {options.question ?? question?.question}
        </Text>
      </View>

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
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 14,
    borderBottomWidth: 1,
  },
  stageIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stageIcon: {
    fontSize: 22,
  },
  headerContent: {
    flex: 1,
  },
  stageLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.9,
  },
  stageName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 3,
  },
  questionCounter: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  questionCounterText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },

  storySection: {
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  storyLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginBottom: 7,
  },
  storyText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    fontStyle: "italic",
  },

  questionSection: {
    padding: 16,
  },
  puzzleLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
  },
  puzzleIcon: {
    fontSize: 14,
  },
  puzzleLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  questionText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "800",
  },
});