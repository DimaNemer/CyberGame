import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../../constants/colors";
import FeedbackSection from "../FeedbackSection";

export default function InvestigationCard({
  question,
  visibleClueCount,
  phase,
  selected,
  isCorrect,
  pointsEarned,
}) {
  const options = question?.options ?? {};

  const clues = Array.isArray(options.clues)
    ? options.clues
    : [];

  const visibleClues = clues.slice(0, visibleClueCount);

  return (
    <View
      style={[
        styles.card,
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
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>🔎</Text>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>
            ACTIVE INVESTIGATION
          </Text>

          <Text style={styles.incidentName}>
            {options.incident ?? "Unknown Network Incident"}
          </Text>
        </View>

        <View style={styles.evidenceBadge}>
          <Text style={styles.evidenceText}>
            {visibleClueCount}/{clues.length}
          </Text>
        </View>
      </View>

      <View style={styles.cluesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            📡 NETWORK EVIDENCE
          </Text>

          <Text style={styles.sectionStatus}>
            LIVE FEED
          </Text>
        </View>

        {visibleClues.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyText}>
              Scanning network activity...
            </Text>
          </View>
        ) : (
          <View style={styles.clueList}>
            {visibleClues.map((clue, index) => (
              <View
                key={`${index}-${clue}`}
                style={styles.clueRow}
              >
                <View style={styles.clueNumber}>
                  <Text style={styles.clueNumberText}>
                    {index + 1}
                  </Text>
                </View>

                <View style={styles.clueContent}>
                  <Text style={styles.clueLabel}>
                    EVIDENCE #{index + 1}
                  </Text>

                  <Text style={styles.clueText}>
                    {clue}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {(phase === "answering" || phase === "feedback") && (
        <View style={styles.questionSection}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionIcon}>🎯</Text>

            <Text style={styles.questionLabel}>
              INVESTIGATION CONCLUSION
            </Text>
          </View>

          <Text style={styles.questionText}>
            {options.question ?? question?.question}
          </Text>
        </View>
      )}

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
    borderColor: "rgba(34,211,238,0.24)",
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 14,
    backgroundColor: "rgba(34,211,238,0.07)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(34,211,238,0.18)",
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.3)",
  },
  headerIconText: {
    fontSize: 22,
  },
  headerContent: {
    flex: 1,
  },
  headerLabel: {
    color: "#22d3ee",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  incidentName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 3,
  },
  evidenceBadge: {
    minWidth: 42,
    alignItems: "center",
    backgroundColor: "rgba(34,211,238,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.28)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  evidenceText: {
    color: "#22d3ee",
    fontSize: 11,
    fontWeight: "900",
  },

  cluesSection: {
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.13)",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  sectionStatus: {
    color: COLORS.success,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },

  clueList: {
    gap: 9,
  },
  clueRow: {
    flexDirection: "row",
    gap: 10,
    padding: 11,
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clueNumber: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.3)",
  },
  clueNumberText: {
    color: "#22d3ee",
    fontSize: 11,
    fontWeight: "900",
  },
  clueContent: {
    flex: 1,
  },
  clueLabel: {
    color: "#22d3ee",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  clueText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  questionSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: "rgba(245,158,11,0.05)",
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
  },
  questionIcon: {
    fontSize: 14,
  },
  questionLabel: {
    color: COLORS.warning,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  questionText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 23,
  },
});