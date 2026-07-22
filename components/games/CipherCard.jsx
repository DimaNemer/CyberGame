import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";
import FeedbackSection from "./FeedbackSection";

const TYPE_CONFIG = {
  cipher: {
    icon:       "🔐",
    label:      "Cipher Challenge",
    color:      "#818cf8",
    bg:         "rgba(129,140,248,0.12)",
    border:     "rgba(129,140,248,0.3)",
  },
  theory: {
    icon:       "⚛️",
    label:      "Quantum Theory",
    color:      "#38bdf8",
    bg:         "rgba(56,189,248,0.12)",
    border:     "rgba(56,189,248,0.3)",
  },
  circuit: {
    icon:       "🔌",
    label:      "Quantum Circuit",
    color:      "#a78bfa",
    bg:         "rgba(167,139,250,0.12)",
    border:     "rgba(167,139,250,0.3)",
  },
};

export default function CipherCard({
  question, phase, selected, isCorrect, pointsEarned,
}) {
  const qType    = question?.type ?? "cipher";
  const config   = TYPE_CONFIG[qType] ?? TYPE_CONFIG.cipher;
  const options  = question?.options ?? {};
  const isCipher = qType === "cipher";
  const isCircuit = qType === "circuit";

  return (
    <View style={[
      styles.card,
      { borderColor: config.border },
      phase === "feedback" && {
        borderColor: selected === "TIMEOUT" ? COLORS.textMuted
          : isCorrect ? COLORS.success : COLORS.danger,
        borderWidth: 2,
      },
    ]}>

      {/* Header */}
      <View style={[styles.header, { backgroundColor: config.bg }]}>
        <Text style={styles.headerIcon}>{config.icon}</Text>
        <View>
          <Text style={[styles.headerLabel, { color: config.color }]}>
            {config.label}
          </Text>
          <Text style={styles.headerType}>
            {options.cipher_type ?? "Quantum Challenge"}
          </Text>
        </View>
      </View>

      {/* Challenge body */}
      <View style={styles.body}>

        {/* Encrypted message / question */}
        <View style={[styles.encryptedBox, { borderColor: config.border }]}>
          <Text style={styles.encryptedLabel}>
            {isCipher   ? "🔒 Encrypted Message:"
             : isCircuit ? "⚡ Circuit Expression:"
             : "📋 Statement:"}
          </Text>
          <Text style={[styles.encryptedText, { color: config.color }]}>
            {options.encrypted ?? question?.question}
          </Text>
        </View>

        {/* Extra context for theory questions */}
        {qType === "theory" && (
          <View style={styles.contextBox}>
            <Text style={styles.contextLabel}>🧠 Context:</Text>
            <Text style={styles.contextText}>{question?.question}</Text>
          </View>
        )}

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
    backgroundColor: COLORS.bgCard,
    borderRadius: 20, borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row", alignItems: "center",
    gap: 12, padding: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerIcon:  { fontSize: 28 },
  headerLabel: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  headerType:  { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },

  body: { padding: 16, gap: 12 },

  encryptedBox: {
    borderWidth: 1, borderRadius: 14,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  encryptedLabel: {
    color: COLORS.textMuted, fontSize: 11,
    fontWeight: "700", marginBottom: 10,
    letterSpacing: 0.5,
  },
  encryptedText: {
    fontSize: 22, fontWeight: "800",
    fontFamily: "monospace",
    letterSpacing: 3, lineHeight: 32,
  },

  contextBox: {
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  contextLabel: {
    color: COLORS.textSecondary, fontSize: 11,
    fontWeight: "700", marginBottom: 6,
  },
  contextText: {
    color: COLORS.textPrimary, fontSize: 13, lineHeight: 20,
  },
});