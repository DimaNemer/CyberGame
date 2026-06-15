import {
  View, Text, TouchableOpacity,
  StyleSheet, Dimensions, ScrollView,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../constants/colors";

const { width, height } = Dimensions.get("window");

// ── Questions ─────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 1,
    emoji:    "🎯",
    title:    "What's your goal?",
    subtitle: "We'll personalize your experience",
    type:     "single",
    options:  [
      { id: "fun",   label: "Play & Have Fun",        emoji: "🎮" },
      { id: "learn", label: "Learn Cybersecurity",    emoji: "🧠" },
      { id: "rank",  label: "Compete & Rank Up",      emoji: "🏆" },
      { id: "all",   label: "All of the above",       emoji: "🎯" },
    ],
  },
  {
    id: 2,
    emoji:    "📊",
    title:    "Your experience level?",
    subtitle: "No wrong answers — be honest!",
    type:     "single",
    options:  [
      { id: "beginner",      label: "Complete Beginner",   emoji: "🐣" },
      { id: "some",          label: "Some Knowledge",      emoji: "📚" },
      { id: "intermediate",  label: "I study IT/CS",       emoji: "💻" },
      { id: "advanced",      label: "I work in IT/Cyber",  emoji: "🛡️" },
    ],
  },
  {
    id: 3,
    emoji:    "🔍",
    title:    "What interests you?",
    subtitle: "Pick as many as you like",
    type:     "multi",
    options:  [
      { id: "phishing",    label: "Phishing",     emoji: "🎣" },
      { id: "quantum",     label: "Quantum",      emoji: "⚛️" },
      { id: "hacking",     label: "Hacking",      emoji: "💻" },
      { id: "crypto",      label: "Crypto",       emoji: "🔐" },
      { id: "ai",          label: "AI Security",  emoji: "🛡️" },
      { id: "logic",       label: "Logic",        emoji: "🌀" },
    ],
  },
];
// ─────────────────────────────────────────────────────────

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState({ 1: null, 2: null, 3: [] });

  const question   = QUESTIONS[step];
  const isLast     = step === QUESTIONS.length - 1;
  const isMulti    = question.type === "multi";
  const canContinue = isMulti
    ? answers[question.id].length > 0
    : answers[question.id] !== null;

  const handleSingle = (optionId) => {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  };

  const handleMulti = (optionId) => {
    setAnswers((prev) => {
      const current = prev[question.id];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [question.id]: updated };
    });
  };

  const handleNext = () => {
    if (!canContinue) return;
    if (isLast) {
      // TODO: save answers to Supabase onboarding table
      // await supabase.from("onboarding").insert({
      //   id:          session.user.id,
      //   goal:        answers[1],
      //   skill_level: answers[2],
      //   interests:   answers[3],
      //   completed:   true,
      // });
      router.replace("/(tabs)/dashboard");
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSkip = () => {
    router.replace("/(tabs)/dashboard");
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* Top bar — back + skip */}
      <View style={styles.topBar}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        {QUESTIONS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i <= step && styles.progressSegmentActive,
              i < step  && styles.progressSegmentDone,
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressText}>
        Step {step + 1} of {QUESTIONS.length}
      </Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* Question header */}
        <View style={styles.questionHeader}>
          <View style={styles.questionIconBox}>
            <Text style={styles.questionIcon}>{question.emoji}</Text>
          </View>
          <Text style={styles.questionTitle}>{question.title}</Text>
          <Text style={styles.questionSub}>{question.subtitle}</Text>
        </View>

        {/* Options */}
        <View style={[
          styles.optionsGrid,
          isMulti && styles.optionsGridMulti,
        ]}>
          {question.options.map((opt) => {
            const selected = isMulti
              ? answers[question.id].includes(opt.id)
              : answers[question.id] === opt.id;

            return (
              <TouchableOpacity
                key={opt.id}
                style={[
                  isMulti ? styles.optionCardMulti : styles.optionCard,
                  selected && styles.optionCardSelected,
                ]}
                onPress={() =>
                  isMulti ? handleMulti(opt.id) : handleSingle(opt.id)
                }
                activeOpacity={0.8}
              >
                {selected && (
                  <View style={styles.selectedTick}>
                    <Text style={styles.selectedTickText}>✓</Text>
                  </View>
                )}
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={[
                  styles.optionLabel,
                  selected && styles.optionLabelSelected,
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* Bottom button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.continueBtn,
            !canContinue && styles.continueBtnDisabled,
          ]}
          onPress={handleNext}
          disabled={!canContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>
            {isLast ? "🚀  Get Started" : "Continue  →"}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 8 },

  // Top bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn:  { minWidth: 60 },
  backText: { color: COLORS.primary, fontSize: 15, fontWeight: "600" },
  skipText: { color: COLORS.textMuted, fontSize: 14, fontWeight: "600" },

  // Progress
  progressRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  progressSegment: {
    flex: 1, height: 4, borderRadius: 99,
    backgroundColor: COLORS.bgCardLight,
  },
  progressSegmentActive: {
    backgroundColor: COLORS.primary,
  },
  progressSegmentDone: {
    backgroundColor: COLORS.primary,
    opacity: 0.5,
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: 12, textAlign: "center",
    marginBottom: 24,
  },

  // Question header
  questionHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  questionIconBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1, borderColor: COLORS.borderBlue,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 6,
  },
  questionIcon:  { fontSize: 38 },
  questionTitle: {
    color: COLORS.textPrimary,
    fontSize: 24, fontWeight: "800",
    textAlign: "center", marginBottom: 8,
    letterSpacing: 0.3,
  },
  questionSub: {
    color: COLORS.textSecondary,
    fontSize: 14, textAlign: "center",
  },

  // Single select options
  optionsGrid: { gap: 12 },
  optionCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16, padding: 18,
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
    gap: 14, position: "relative",
  },
  optionCardSelected: {
    backgroundColor: COLORS.primaryGlow,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },

  // Multi select options (2 column grid)
  optionsGridMulti: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionCardMulti: {
    width: (width - 48 - 12) / 2,
    backgroundColor: COLORS.bgCard,
    borderRadius: 16, padding: 18,
    alignItems: "center",
    borderWidth: 1, borderColor: COLORS.border,
    gap: 10, position: "relative",
    minHeight: 110,
    justifyContent: "center",
  },

  selectedTick: {
    position: "absolute", top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  selectedTickText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  optionEmoji: { fontSize: 28 },
  optionLabel: {
    color: COLORS.textSecondary,
    fontSize: 14, fontWeight: "600",
    textAlign: "center",
  },
  optionLabelSelected: { color: COLORS.textPrimary },

  // Bottom button
  bottomBar: {
    paddingHorizontal: 24, paddingTop: 16,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16, padding: 18,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  continueBtnDisabled: {
    backgroundColor: COLORS.bgCardLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueBtnText: {
    color: "#fff", fontSize: 16, fontWeight: "800",
  },
});