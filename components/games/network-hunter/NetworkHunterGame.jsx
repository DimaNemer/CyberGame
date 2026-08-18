import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  AppState,
} from "react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS } from "../../../constants/colors";
import { saveGameSession } from "../../../lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

import NetworkMap from "./NetworkMap";
import InvestigationCard from "./InvestigationCard";
import HunterAnswerButtons from "./HunterAnswerButtons";
import TourOverlay from "../TourOverlay";
import GameGuideModal from "../GameGuideModal";

import {
  TOUR_STEPS,
  GLOSSARY,
  HELP_TIPS,
} from "../../../lib/gameContent";

const CLUE_SECONDS = 45;
const ANSWER_SECONDS = 20;
const SPEED_BONUS_SECONDS = 8;

const CORRECT_POINTS = 200;
const SPEED_BONUS_POINTS = 50;

const WIN_REQUIRED = 3;


function safelySortQuestions(questions) {
  return [...questions].sort((a, b) => {
    const aOrder = Number(a?.order_num) || 0;
    const bOrder = Number(b?.order_num) || 0;

    return aOrder - bOrder;
  });
}

function validateQuestion(question) {
  const options = question?.options;

  return Boolean(
    question?.answer &&
      options &&
      Array.isArray(options.clues) &&
      options.clues.length > 0 &&
      Array.isArray(options.choices) &&
      options.choices.length === 4 &&
      typeof options.question === "string",
  );
}

export default function NetworkHunterGame({
  questions,
  gameInfo,
  user,
  pauseMusic,
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
const [introReady, setIntroReady] = useState(false);

const [showTour, setShowTour] = useState(false);
const [tourStep, setTourStep] = useState(0);

const [showGuide, setShowGuide] = useState(false);
const [guideMode, setGuideMode] = useState("glossary");
  const validQuestions = useMemo(
    () =>
      safelySortQuestions(
        Array.isArray(questions)
          ? questions.filter(validateQuestion)
          : [],
      ),
    [questions],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState("clues");
  const [visibleClueCount, setVisibleClueCount] = useState(1);

  const [timeLeft, setTimeLeft] = useState(CLUE_SECONDS);

  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);

  const [score, setScore] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);

  const [inputLocked, setInputLocked] = useState(false);

const deadlineRef = useRef(null);
  const intervalRef = useRef(null);
  const finishedRef = useRef(false);

  const scoreRef = useRef(0);
  const solvedRef = useRef(0);

  const currentQuestion = validQuestions[currentIndex] ?? null;
  const clues = currentQuestion?.options?.clues ?? [];

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    solvedRef.current = solvedCount;
  }, [solvedCount]);

const updateTimer = useCallback(() => {
  if (!deadlineRef.current) {
    return phase === "answering"
      ? ANSWER_SECONDS
      : CLUE_SECONDS;
  }

  const remaining = Math.max(
    0,
    Math.ceil(
      (deadlineRef.current - Date.now()) / 1000,
    ),
  );

  setTimeLeft(remaining);

  return remaining;
}, [phase]);

  const startPhaseTimer = useCallback((seconds) => {
    clearInterval(intervalRef.current);

    deadlineRef.current = Date.now() + seconds * 1000;
    setTimeLeft(seconds);

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((deadlineRef.current - Date.now()) / 1000),
      );

      setTimeLeft(remaining);
    }, 250);
  }, []);
  const startHunterGame = useCallback(() => {
  setShowGuide(false);
  setIntroReady(true);

  setPhase("clues");
  setVisibleClueCount(1);
  setSelected(null);
  setIsCorrect(null);
  setPointsEarned(0);
  setInputLocked(false);

  startPhaseTimer(CLUE_SECONDS);
}, [startPhaseTimer]);
useEffect(() => {
  let mounted = true;

  async function prepareIntro() {
    if (!user?.id || !gameInfo?.id) {
      if (mounted) {
        startHunterGame();
      }
      return;
    }

    try {
      const key =
        `howto_seen_${user.id}_${gameInfo.id}`;

      const seen = await AsyncStorage.getItem(key);

      if (!mounted) return;

      if (seen === "true") {
        startHunterGame();
      } else {
        setIntroReady(false);
        setTourStep(0);
        setShowTour(true);
      }
    } catch (error) {
      console.error(
        "[NetworkHunter intro]",
        error?.message,
      );

      if (mounted) {
        startHunterGame();
      }
    }
  }

  prepareIntro();

  return () => {
    mounted = false;
  };
}, [
  gameInfo?.id,
  startHunterGame,
  user?.id,
]);
const handleTourNext = useCallback(async () => {
  const steps =
    TOUR_STEPS["Network Hunter"] ?? [];

  const nextStep = tourStep + 1;

  if (nextStep < steps.length) {
    setTourStep(nextStep);
    return;
  }

  try {
    if (user?.id && gameInfo?.id) {
      const key =
        `howto_seen_${user.id}_${gameInfo.id}`;

      await AsyncStorage.setItem(key, "true");
    }
  } catch (error) {
    console.error(
      "[NetworkHunter tour]",
      error?.message,
    );
  }

  setShowTour(false);
  setGuideMode("glossary");
  setShowGuide(true);
}, [
  gameInfo?.id,
  tourStep,
  user?.id,
]);

const handleTourSkip = useCallback(async () => {
  try {
    if (user?.id && gameInfo?.id) {
      const key =
        `howto_seen_${user.id}_${gameInfo.id}`;

      await AsyncStorage.setItem(key, "true");
    }
  } catch (error) {
    console.error(
      "[NetworkHunter skip]",
      error?.message,
    );
  }

  setShowTour(false);
  startHunterGame();
}, [
  gameInfo?.id,
  startHunterGame,
  user?.id,
]);
  const finishGame = useCallback(
    async (finalSolved = solvedRef.current) => {
      if (finishedRef.current) return;

      finishedRef.current = true;
      clearInterval(intervalRef.current);
      setInputLocked(true);

      try {
        pauseMusic?.();
      } catch {}

      const result =
        finalSolved >= WIN_REQUIRED ? "win" : "loss";

      try {
        if (user?.id && gameInfo?.id) {
          await saveGameSession({
            gameId: gameInfo.id,
            playerId: user.id,
            score: Math.max(0, scoreRef.current),
            result,
            durationSecs: Math.min(
              validQuestions.length *
                (CLUE_SECONDS + ANSWER_SECONDS),
              86400,
            ),
          });
        }
      } catch (error) {
        console.error(
          "[NetworkHunter save]",
          error?.message,
        );
      } finally {
        router.replace({
          pathname: "/game-result",
          params: {
            id: gameInfo?.id ?? "",
            score: scoreRef.current,
            correct: finalSolved,
            total: validQuestions.length,
            result,
            gameTitle:
              gameInfo?.title ?? "Network Hunter",
            gameIcon: gameInfo?.icon ?? "🕵️",
          },
        });
      }
    },
    [
      gameInfo,
      pauseMusic,
      router,
      user,
      validQuestions.length,
    ],
  );

  const moveToAnswerPhase = useCallback(() => {
    setVisibleClueCount(clues.length);
    setPhase("answering");
    setSelected(null);
    setIsCorrect(null);
    setPointsEarned(0);
    setInputLocked(false);

    startPhaseTimer(ANSWER_SECONDS);
  }, [clues.length, startPhaseTimer]);

  const handleTimerExpired = useCallback(() => {
    if (phase === "clues") {
      moveToAnswerPhase();
      return;
    }

    if (phase === "answering") {
      clearInterval(intervalRef.current);
      setSelected("TIMEOUT");
      setIsCorrect(false);
      setPointsEarned(0);
      setInputLocked(true);
      setPhase("feedback");
    }
  }, [moveToAnswerPhase, phase]);

useEffect(() => {
  return () => {
    clearInterval(intervalRef.current);
  };
}, []);

  useEffect(() => {
    if (timeLeft <= 0 && !finishedRef.current) {
      handleTimerExpired();
    }
  }, [handleTimerExpired, timeLeft]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState) => {
     if (
  nextState === "active" &&
  introReady &&
  deadlineRef.current
) {
          const remaining = updateTimer();

          if (remaining <= 0) {
            handleTimerExpired();
          }
        }
      },
    );

    return () => subscription.remove();
  }, [handleTimerExpired, introReady, updateTimer]);

  const revealNextClue = useCallback(() => {
    if (
      phase !== "clues" ||
      visibleClueCount >= clues.length
    ) {
      return;
    }

    setVisibleClueCount((previous) =>
      Math.min(previous + 1, clues.length),
    );
  }, [clues.length, phase, visibleClueCount]);

  const handleStartAnalysis = useCallback(() => {
    if (phase !== "clues") return;

    moveToAnswerPhase();
  }, [moveToAnswerPhase, phase]);

  const handleAnswer = useCallback(
    (answer) => {
      if (
        phase !== "answering" ||
        inputLocked ||
        !currentQuestion ||
        typeof answer !== "string"
      ) {
        return;
      }

      setInputLocked(true);
      clearInterval(intervalRef.current);

      const correct =
        answer === currentQuestion.answer;

      let earned = 0;

      if (correct) {
        earned = CORRECT_POINTS;

        const elapsed =
          ANSWER_SECONDS - timeLeft;

        if (elapsed < SPEED_BONUS_SECONDS) {
          earned += SPEED_BONUS_POINTS;
        }

        setScore((previous) => {
          const next = previous + earned;
          scoreRef.current = next;
          return next;
        });

        setSolvedCount((previous) => {
          const next = previous + 1;
          solvedRef.current = next;
          return next;
        });
      }

      setSelected(answer);
      setIsCorrect(correct);
      setPointsEarned(earned);
      setPhase("feedback");
    },
    [
      currentQuestion,
      inputLocked,
      phase,
      timeLeft,
    ],
  );

  const handleNextInvestigation = useCallback(async () => {
    if (phase !== "feedback") return;

    const nextIndex = currentIndex + 1;

    if (nextIndex >= validQuestions.length) {
      await finishGame();
      return;
    }

    setCurrentIndex(nextIndex);
    setVisibleClueCount(1);
    setSelected(null);
    setIsCorrect(null);
    setPointsEarned(0);
    setInputLocked(false);
    setPhase("clues");

    startPhaseTimer(CLUE_SECONDS);
  }, [
    currentIndex,
    finishGame,
    phase,
    startPhaseTimer,
    validQuestions.length,
  ]);

  const handleQuit = useCallback(() => {
    clearInterval(intervalRef.current);

    try {
      pauseMusic?.();
    } catch {}

    router.back();
  }, [pauseMusic, router]);

  if (!currentQuestion) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.errorIcon}>⚠️</Text>

        <Text style={styles.errorTitle}>
          Invalid Network Hunter data
        </Text>

        <Text style={styles.errorText}>
          Each investigation must contain clues, four
          choices, a question and a correct answer.
        </Text>

        <TouchableOpacity
          style={styles.errorButton}
          onPress={handleQuit}
        >
          <Text style={styles.errorButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const timerColor =
    timeLeft > 25
      ? COLORS.success
      : timeLeft > 10
        ? COLORS.warning
        : COLORS.danger;

  const timerMaximum =
    phase === "clues"
      ? CLUE_SECONDS
      : ANSWER_SECONDS;

  const timerWidth = `${Math.max(
    0,
    Math.min(100, (timeLeft / timerMaximum) * 100),
  )}%`;

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + 8 },
        ]}
      >
        <TouchableOpacity
          style={styles.quitButton}
          onPress={handleQuit}
          activeOpacity={0.8}
        >
          <Text style={styles.quitText}>✕ Quit</Text>
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <Text style={styles.gameTitle}>
            {gameInfo?.icon ?? "🕵️"} Network Hunter
          </Text>

          <Text style={styles.investigationCount}>
            Investigation {currentIndex + 1} of{" "}
            {validQuestions.length}
          </Text>
        </View>
<View style={styles.guideActions}>
  <TouchableOpacity
    style={styles.guideIconButton}
    onPress={() => {
      setGuideMode("glossary");
      setShowGuide(true);
    }}
    activeOpacity={0.8}
    accessibilityRole="button"
    accessibilityLabel="Open Network Hunter guide"
  >
    <Text style={styles.guideIconText}>
      📖
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.guideIconButton}
    onPress={() => {
      setGuideMode("help");
      setShowGuide(true);
    }}
    activeOpacity={0.8}
    accessibilityRole="button"
    accessibilityLabel="Open Network Hunter tips"
  >
    <Text style={styles.guideIconText}>
      ?
    </Text>
  </TouchableOpacity>
</View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>SOLVED</Text>
          <Text style={styles.statValue}>
            {solvedCount}/{WIN_REQUIRED}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>PHASE</Text>
          <Text style={styles.statValue}>
            {phase === "clues"
              ? "INVESTIGATE"
              : phase === "answering"
                ? "ANALYZE"
                : "RESULT"}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>TIMER</Text>
          <Text
            style={[
              styles.statValue,
              { color: timerColor },
            ]}
          >
            {timeLeft}s
          </Text>
        </View>
      </View>

      <View style={styles.timerTrack}>
        <View
          style={[
            styles.timerFill,
            {
              width: timerWidth,
              backgroundColor: timerColor,
            },
          ]}
        />
      </View>
<GameGuideModal
  visible={showGuide}
  title="Network Hunter Guide"
  glossary={
    GLOSSARY["Network Hunter"] ?? []
  }
  tips={HELP_TIPS.hunt ?? []}
  mode={guideMode}
  onClose={() => {
    if (!introReady) {
      startHunterGame();
    } else {
      setShowGuide(false);
    }
  }}
/>

{showTour && (
  <TourOverlay
    steps={
      TOUR_STEPS["Network Hunter"] ?? []
    }
    currentStep={tourStep}
    onNext={handleTourNext}
    onSkip={handleTourSkip}
  />
)}
           <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <NetworkMap
          investigationNumber={currentIndex + 1}
          suspiciousLevel={visibleClueCount}
          clueCount={visibleClueCount}
          totalClues={clues.length}
        />

        <InvestigationCard
          question={currentQuestion}
          visibleClueCount={visibleClueCount}
          phase={phase}
          selected={selected}
          isCorrect={isCorrect}
          pointsEarned={pointsEarned}
        />

        {phase === "clues" && (
          <View style={styles.clueActions}>
            {visibleClueCount < clues.length && (
              <TouchableOpacity
                style={styles.revealButton}
                onPress={revealNextClue}
                activeOpacity={0.85}
              >
                <Text style={styles.revealButtonText}>
                  Reveal Next Clue 🔎
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.analysisButton,
                visibleClueCount < clues.length &&
                  styles.analysisButtonSecondary,
              ]}
              onPress={handleStartAnalysis}
              activeOpacity={0.85}
            >
              <Text style={styles.analysisButtonText}>
                {visibleClueCount >= clues.length
                  ? "Analyze Evidence →"
                  : "Analyze Now"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === "answering" && (
          <HunterAnswerButtons
            question={currentQuestion}
            onAnswer={handleAnswer}
            disabled={inputLocked}
          />
        )}

        {phase === "feedback" && (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextInvestigation}
            activeOpacity={0.85}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex + 1 >= validQuestions.length
                ? "See Investigation Results 🏆"
                : "Next Investigation →"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <GameGuideModal
        visible={showGuide}
        title="Network Hunter Guide"
        glossary={GLOSSARY["Network Hunter"] ?? []}
        tips={HELP_TIPS.hunt ?? []}
        mode={guideMode}
        onClose={() => {
          if (!introReady) {
            startHunterGame();
          } else {
            setShowGuide(false);
          }
        }}
      />

      {showTour && (
        <TourOverlay
          steps={TOUR_STEPS["Network Hunter"] ?? []}
          currentStep={tourStep}
          onNext={handleTourNext}
          onSkip={handleTourSkip}
        />
      )}
    </View>
  );
}
    

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
guideActions: {
  flexDirection: "row",
  gap: 6,
  marginRight: 7,
},

guideIconButton: {
  width: 34,
  height: 34,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: COLORS.bgCardLight,
  borderWidth: 1,
  borderColor: COLORS.border,
},

guideIconText: {
  color: COLORS.textPrimary,
  fontSize: 15,
  fontWeight: "900",
},
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  quitButton: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  quitText: {
    color: "#fca5a5",
    fontSize: 12,
    fontWeight: "700",
  },
  topCenter: {
    flex: 1,
    alignItems: "center",
  },
  gameTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  investigationCount: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  scoreBox: {
    minWidth: 52,
    alignItems: "center",
    backgroundColor: "rgba(34,211,238,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.3)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  scoreLabel: {
    color: COLORS.textMuted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  scoreValue: {
    color: "#22d3ee",
    fontSize: 14,
    fontWeight: "900",
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: COLORS.bgCard,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },

  timerTrack: {
    height: 5,
    backgroundColor: COLORS.bgCardLight,
  },
  timerFill: {
    height: "100%",
  },

  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
  },

  clueActions: {
    gap: 10,
  },
  revealButton: {
    backgroundColor: "rgba(34,211,238,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.35)",
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
  },
  revealButtonText: {
    color: "#22d3ee",
    fontSize: 14,
    fontWeight: "800",
  },
  analysisButton: {
    backgroundColor: "#0891b2",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  analysisButtonSecondary: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  analysisButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },

  nextButton: {
    backgroundColor: "#0891b2",
    borderRadius: 16,
    padding: 17,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },

  errorIcon: {
    fontSize: 46,
    marginBottom: 14,
  },
  errorTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 18,
  },
  errorButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  errorButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
});
