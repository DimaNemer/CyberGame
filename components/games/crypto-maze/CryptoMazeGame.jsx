import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
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

import MazeMap from "./MazeMap";
import MazeQuestionCard from "./MazeQuestionCard";
import MazeAnswerButtons from "./MazeAnswerButtons";

const TOTAL_SECONDS = 180;

const STAGE_POINTS = {
  1: 100,
  2: 200,
  3: 300,
  4: 400,
  5: 500,
};

function getQuestionStage(question) {
  const stage = Number(question?.options?.stage);

  if (!Number.isInteger(stage) || stage < 1 || stage > 5) {
    return null;
  }

  return stage;
}

function sortQuestionsSafely(questions) {
  return [...questions].sort((a, b) => {
    const aOrder = Number(a?.order_num) || 0;
    const bOrder = Number(b?.order_num) || 0;

    return aOrder - bOrder;
  });
}

export default function CryptoMazeGame({
  questions,
  gameInfo,
  user,
  pauseMusic,
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const orderedQuestions = useMemo(
    () => sortQuestionsSafely(questions ?? []),
    [questions],
  );

  const questionsByStage = useMemo(() => {
    const grouped = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };

    orderedQuestions.forEach((question) => {
      const stage = getQuestionStage(question);

      if (stage) {
        grouped[stage].push(question);
      }
    });

    return grouped;
  }, [orderedQuestions]);

  const [currentStage, setCurrentStage] = useState(1);
  const [stageQuestionIndex, setStageQuestionIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);

  const [phase, setPhase] = useState("playing");
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [message, setMessage] = useState("");

  const [inputLocked, setInputLocked] = useState(false);

  const deadlineRef = useRef(Date.now() + TOTAL_SECONDS * 1000);
  const intervalRef = useRef(null);
  const finishStartedRef = useRef(false);
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(TOTAL_SECONDS);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const stageQuestions = questionsByStage[currentStage] ?? [];
  const currentQuestion =
    stageQuestions[stageQuestionIndex] ?? stageQuestions[0] ?? null;

  const currentStageTotal = stageQuestions.length;

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const updateRemainingTime = useCallback(() => {
    const remaining = Math.max(
      0,
      Math.ceil((deadlineRef.current - Date.now()) / 1000),
    );

    timeLeftRef.current = remaining;
    setTimeLeft(remaining);

    return remaining;
  }, []);

  const finishMaze = useCallback(
    async ({ won }) => {
      if (finishStartedRef.current) return;

      finishStartedRef.current = true;
      clearInterval(intervalRef.current);
      setInputLocked(true);
      setPhase("finished");

      try {
        pauseMusic?.();
      } catch {}

      const remaining = updateRemainingTime();

      const timeBonus = won ? remaining * 10 : 0;
      const finalScore = won
        ? scoreRef.current + timeBonus
        : scoreRef.current;

      const durationSecs = Math.max(
        0,
        Math.min(TOTAL_SECONDS - remaining, TOTAL_SECONDS),
      );

      const result = won ? "win" : "loss";

      try {
        if (user?.id && gameInfo?.id) {
          await saveGameSession({
            gameId: gameInfo.id,
            playerId: user.id,
            score: finalScore,
            result,
            durationSecs,
          });
        }
      } catch (error) {
        console.error("[CryptoMaze save]", error?.message);
      } finally {
        router.replace({
          pathname: "/game-result",
          params: {
            id: gameInfo?.id ?? "",
            score: finalScore,
            correct: completedStages.length + (won ? 1 : 0),
            total: 5,
            result,
            gameTitle: gameInfo?.title ?? "Crypto Maze",
            gameIcon: gameInfo?.icon ?? "🔐",
            timeBonus,
          },
        });
      }
    },
    [
      completedStages.length,
      gameInfo,
      pauseMusic,
      router,
      updateRemainingTime,
      user,
    ],
  );

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const remaining = updateRemainingTime();

      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        finishMaze({ won: false });
      }
    }, 250);

    return () => clearInterval(intervalRef.current);
  }, [finishMaze, updateRemainingTime]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (nextState === "active" && phase !== "finished") {
          const remaining = updateRemainingTime();

          if (remaining <= 0) {
            finishMaze({ won: false });
          }
        }
      },
    );

    return () => subscription.remove();
  }, [finishMaze, phase, updateRemainingTime]);

  const triggerWrongAnimation = useCallback(() => {
    shakeAnim.setValue(0);

    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -1,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 1,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shakeAnim]);

  const handleAnswer = useCallback(
    (answer) => {
      if (
        phase !== "playing" ||
        inputLocked ||
        !currentQuestion ||
        typeof answer !== "string"
      ) {
        return;
      }

      setInputLocked(true);

      const correct = answer === currentQuestion.answer;

      setSelected(answer);
      setIsCorrect(correct);
      setPhase("feedback");

      if (correct) {
        setPointsEarned(0);
        setMessage("Correct! The lock mechanism is responding.");
      } else {
        setPointsEarned(0);
        setMessage(
          currentStage === 1
            ? "Wrong answer. The gateway remains locked."
            : `Wrong answer. The maze sends you back to Stage ${
                currentStage - 1
              }.`,
        );

        triggerWrongAnimation();
      }
    },
    [
      currentQuestion,
      currentStage,
      inputLocked,
      phase,
      triggerWrongAnimation,
    ],
  );

  const handleContinue = useCallback(async () => {
    if (phase !== "feedback" || !currentQuestion) return;

    if (!isCorrect) {
      const previousStage = Math.max(1, currentStage - 1);

      setCurrentStage(previousStage);
      setStageQuestionIndex(0);
      setSelected(null);
      setIsCorrect(null);
      setPointsEarned(0);
      setMessage("");
      setInputLocked(false);
      setPhase("playing");
      return;
    }

    const nextQuestionIndex = stageQuestionIndex + 1;
    const stageFinished = nextQuestionIndex >= stageQuestions.length;

    if (!stageFinished) {
      setStageQuestionIndex(nextQuestionIndex);
      setSelected(null);
      setIsCorrect(null);
      setPointsEarned(0);
      setMessage("");
      setInputLocked(false);
      setPhase("playing");
      return;
    }

    const alreadyAwarded = completedStages.includes(currentStage);
    const stagePoints = alreadyAwarded
      ? 0
      : STAGE_POINTS[currentStage] ?? 0;

    if (!alreadyAwarded) {
      setCompletedStages((previous) => [
        ...previous,
        currentStage,
      ]);

      setScore((previous) => {
        const nextScore = previous + stagePoints;
        scoreRef.current = nextScore;
        return nextScore;
      });
    }

    if (currentStage === 5) {
      if (!alreadyAwarded) {
        scoreRef.current += 0;
      }

      await finishMaze({ won: true });
      return;
    }

    setCurrentStage((previous) => previous + 1);
    setStageQuestionIndex(0);
    setSelected(null);
    setIsCorrect(null);
    setPointsEarned(stagePoints);
    setMessage(
      alreadyAwarded
        ? "Stage already unlocked. Moving forward."
        : `Stage ${currentStage} complete! +${stagePoints} points`,
    );
    setInputLocked(false);
    setPhase("playing");
  }, [
    completedStages,
    currentQuestion,
    currentStage,
    finishMaze,
    isCorrect,
    phase,
    stageQuestionIndex,
    stageQuestions.length,
  ]);

  const handleQuit = useCallback(() => {
    clearInterval(intervalRef.current);

    try {
      pauseMusic?.();
    } catch {}

    router.back();
  }, [pauseMusic, router]);

  const timerColor =
    timeLeft > 90
      ? COLORS.success
      : timeLeft > 30
        ? COLORS.warning
        : COLORS.danger;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${String(seconds).padStart(2, "0")}`;

  const timerProgress = `${Math.max(
    0,
    Math.min(100, (timeLeft / TOTAL_SECONDS) * 100),
  )}%`;

  const shakeTranslate = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-8, 0, 8],
  });

  if (!currentQuestion) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>
          Invalid Crypto Maze data
        </Text>
        <Text style={styles.errorText}>
          Every maze stage must contain at least one valid question.
        </Text>

        <TouchableOpacity
          style={styles.errorButton}
          onPress={handleQuit}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
            {gameInfo?.icon ?? "🔐"} Crypto Maze
          </Text>
          <Text style={styles.stageStatus}>
            Stage {currentStage} of 5
          </Text>
        </View>

        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
      </View>

      <View style={styles.timerSection}>
        <View style={styles.timerHeader}>
          <Text style={styles.timerLabel}>
            ⏱️ ESCAPE TIME
          </Text>

          <Text style={[styles.timerValue, { color: timerColor }]}>
            {formattedTime}
          </Text>
        </View>

        <View style={styles.timerTrack}>
          <View
            style={[
              styles.timerFill,
              {
                width: timerProgress,
                backgroundColor: timerColor,
              },
            ]}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MazeMap
          currentStage={currentStage}
          completedStages={completedStages}
        />

        {!!message && phase === "playing" && (
          <View style={styles.stageMessage}>
            <Text style={styles.stageMessageText}>{message}</Text>
          </View>
        )}

        <Animated.View
          style={{
            transform: [{ translateX: shakeTranslate }],
          }}
        >
          <MazeQuestionCard
            question={currentQuestion}
            phase={phase}
            selected={selected}
            isCorrect={isCorrect}
            pointsEarned={pointsEarned}
            stageQuestionNumber={stageQuestionIndex + 1}
            stageQuestionTotal={currentStageTotal}
          />
        </Animated.View>

        {phase === "playing" && (
          <MazeAnswerButtons
            question={currentQuestion}
            onAnswer={handleAnswer}
            disabled={inputLocked}
          />
        )}

        {phase === "feedback" && (
          <>
            <View
              style={[
                styles.resultNotice,
                isCorrect
                  ? styles.resultNoticeCorrect
                  : styles.resultNoticeWrong,
              ]}
            >
              <Text
                style={[
                  styles.resultNoticeText,
                  {
                    color: isCorrect
                      ? COLORS.success
                      : COLORS.danger,
                  },
                ]}
              >
                {message}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.continueButton,
                !isCorrect && styles.continueButtonWrong,
              ]}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.continueButtonText}>
                {!isCorrect
                  ? currentStage === 1
                    ? "Try Gateway Again ↺"
                    : `Return to Stage ${currentStage - 1} ↩`
                  : stageQuestionIndex + 1 < stageQuestions.length
                    ? "Continue Through Chamber →"
                    : currentStage === 5
                      ? "Unlock Exit 🏆"
                      : `Unlock Stage ${currentStage + 1} →`}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
  stageStatus: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  scoreBox: {
    minWidth: 52,
    alignItems: "center",
    backgroundColor: "rgba(168,85,247,0.1)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.3)",
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
    color: "#c084fc",
    fontSize: 14,
    fontWeight: "900",
    marginTop: 1,
  },

  timerSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  timerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  timerLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  timerValue: {
    fontSize: 18,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  timerTrack: {
    height: 7,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: COLORS.bgCardLight,
  },
  timerFill: {
    height: "100%",
    borderRadius: 99,
  },

  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
  },

  stageMessage: {
    backgroundColor: "rgba(168,85,247,0.1)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.3)",
    borderRadius: 12,
    padding: 11,
  },
  stageMessageText: {
    color: "#d8b4fe",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  resultNotice: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  resultNoticeCorrect: {
    backgroundColor: "rgba(16,185,129,0.1)",
    borderColor: "rgba(16,185,129,0.3)",
  },
  resultNoticeWrong: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.3)",
  },
  resultNoticeText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  continueButton: {
    backgroundColor: "#7c3aed",
    borderRadius: 16,
    padding: 17,
    alignItems: "center",
  },
  continueButtonWrong: {
    backgroundColor: COLORS.danger,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
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