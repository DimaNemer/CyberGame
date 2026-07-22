import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS } from "../../../constants/colors";

export default function HunterAnswerButtons({
  question,
  onAnswer,
  disabled = false,
}) {
  const choices = Array.isArray(question?.options?.choices)
    ? question.options.choices
    : [];

  return (
    <View style={styles.container}>
      {choices.map((choice, index) => (
        <TouchableOpacity
          key={`${index}-${choice}`}
          style={[
            styles.button,
            disabled && styles.buttonDisabled,
          ]}
          onPress={() => {
            if (!disabled) {
              onAnswer(choice);
            }
          }}
          disabled={disabled}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Investigation answer ${index + 1}: ${choice}`}
        >
          <View style={styles.letterBox}>
            <Text style={styles.letter}>
              {["A", "B", "C", "D"][index] ?? index + 1}
            </Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.answerLabel}>
              ANALYSIS OPTION
            </Text>

            <Text style={styles.answerText}>
              {choice}
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.22)",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  letterBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
  },
  letter: {
    color: "#22d3ee",
    fontSize: 13,
    fontWeight: "900",
  },
  content: {
    flex: 1,
  },
  answerLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  answerText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  arrow: {
    color: "#22d3ee",
    fontSize: 24,
    fontWeight: "300",
  },
});