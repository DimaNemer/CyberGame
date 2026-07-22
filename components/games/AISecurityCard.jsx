import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";
import FeedbackSection from "./FeedbackSection";

const ROLE_CONFIG = {
  ai: {
    icon: "🤖",
    label: "AI",
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.1)",
    border: "rgba(34,211,238,0.3)",
    align: "right",
  },
  system: {
    icon: "⚙️",
    label: "SYSTEM",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.1)",
    border: "rgba(167,139,250,0.3)",
    align: "center",
  },
  attacker: {
    icon: "🎭",
    label: "ATTACKER",
    color: COLORS.danger,
    bg: "rgba(239,68,68,0.1)",
    border: "rgba(239,68,68,0.3)",
    align: "left",
  },
  user: {
    icon: "👤",
    label: "USER",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.1)",
    border: "rgba(96,165,250,0.3)",
    align: "left",
  },
};

function getRoleConfig(role) {
  const normalizedRole = role?.toLowerCase() ?? "user";

  if (ROLE_CONFIG[normalizedRole]) {
    return ROLE_CONFIG[normalizedRole];
  }

  return {
    icon: "👤",
    label: normalizedRole.toUpperCase(),
    color: COLORS.textSecondary,
    bg: COLORS.bgCardLight,
    border: COLORS.border,
    align: "left",
  };
}

export default function AISecurityCard({
  question,
  phase,
  selected,
  isCorrect,
  pointsEarned,
}) {
  const options = question?.options ?? {};
  const conversation = Array.isArray(options.conversation)
    ? options.conversation
    : [];

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <Text style={styles.headerIcon}>🤖</Text>
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>AI SECURITY ANALYSIS</Text>
          <Text style={styles.scenarioText}>
            {options.scenario ?? "AI System"}
          </Text>
        </View>

        <View style={styles.monitorBadge}>
          <View style={styles.monitorDot} />
          <Text style={styles.monitorText}>MONITORING</Text>
        </View>
      </View>

      {/* Conversation area */}
      <View style={styles.conversationArea}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationTitle}>LIVE CONVERSATION</Text>
          <Text style={styles.encryptedIndicator}>🔒 SECURE CHANNEL</Text>
        </View>

        {conversation.length > 0 ? (
          <View style={styles.messages}>
            {conversation.map((message, index) => {
              const role = message?.role ?? "user";
              const config = getRoleConfig(role);

              const isRight = config.align === "right";
              const isCenter = config.align === "center";

              return (
                <View
                  key={`${role}-${index}`}
                  style={[
                    styles.messageRow,
                    isRight && styles.messageRowRight,
                    isCenter && styles.messageRowCenter,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      {
                        backgroundColor: config.bg,
                        borderColor: config.border,
                      },
                      isRight && styles.messageBubbleRight,
                      isCenter && styles.systemBubble,
                    ]}
                  >
                    <View style={styles.messageRoleRow}>
                      <Text style={styles.messageRoleIcon}>
                        {config.icon}
                      </Text>

                      <Text
                        style={[
                          styles.messageRole,
                          { color: config.color },
                        ]}
                      >
                        {config.label}
                      </Text>
                    </View>

                    <Text style={styles.messageText}>
                      {message?.msg ?? ""}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyConversation}>
            <Text style={styles.emptyConversationText}>
              No conversation data available.
            </Text>
          </View>
        )}
      </View>

      {/* Security question */}
      <View style={styles.questionSection}>
        <View style={styles.questionLabelRow}>
          <View style={styles.alertIconBox}>
            <Text style={styles.alertIcon}>🛡️</Text>
          </View>

          <Text style={styles.questionLabel}>SECURITY ASSESSMENT</Text>
        </View>

        <Text style={styles.questionText}>
          {options.question ?? question?.question}
        </Text>

        <Text style={styles.questionHint}>
          Analyze the conversation and identify the security issue.
        </Text>
      </View>

      {/* Existing shared feedback */}
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
    borderColor: "rgba(34,211,238,0.25)",
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    backgroundColor: "rgba(34,211,238,0.07)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(34,211,238,0.18)",
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.3)",
  },
  headerIcon: {
    fontSize: 23,
  },
  headerContent: {
    flex: 1,
  },
  headerLabel: {
    color: "#22d3ee",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  scenarioText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 3,
  },
  monitorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16,185,129,0.1)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.25)",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  monitorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  monitorText: {
    color: COLORS.success,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  conversationArea: {
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  conversationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  conversationTitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  encryptedIndicator: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  messages: {
    gap: 10,
  },
  messageRow: {
    alignItems: "flex-start",
  },
  messageRowRight: {
    alignItems: "flex-end",
  },
  messageRowCenter: {
    alignItems: "center",
  },
  messageBubble: {
    maxWidth: "88%",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopLeftRadius: 4,
  },
  messageBubbleRight: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 4,
  },
  systemBubble: {
    maxWidth: "96%",
    borderRadius: 10,
  },
  messageRoleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },
  messageRoleIcon: {
    fontSize: 12,
  },
  messageRole: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  messageText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  emptyConversation: {
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyConversationText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
  },

  questionSection: {
    padding: 16,
    backgroundColor: "rgba(167,139,250,0.06)",
    borderTopWidth: 1,
    borderTopColor: "rgba(167,139,250,0.18)",
  },
  questionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  alertIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  alertIcon: {
    fontSize: 13,
  },
  questionLabel: {
    color: "#a78bfa",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  questionText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 23,
  },
  questionHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 7,
  },
});