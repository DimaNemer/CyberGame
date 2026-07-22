import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS } from "../../../constants/colors";

export default function MazeAnswerButtons({
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
            if (!disabled) onAnswer(choice);
          }}
          activeOpacity={0.85}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Answer ${index + 1}: ${choice}`}
        >
          <View style={styles.letterBox}>
            <Text style={styles.letter}>
              {["A", "B", "C", "D"][index] ?? index + 1}
            </Text>
          </View>

          <Text style={styles.choiceText}>{choice}</Text>

          <View style={styles.doorIconBox}>
            <Text style={styles.doorIcon}>🚪</Text>
          </View>
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
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.25)",
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
    backgroundColor: "rgba(168,85,247,0.13)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.38)",
  },
  letter: {
    color: "#c084fc",
    fontSize: 13,
    fontWeight: "900",
  },
  choiceText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },
  doorIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgCardLight,
  },
  doorIcon: {
    fontSize: 14,
  },
});