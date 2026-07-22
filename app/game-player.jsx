import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Animated,
  Dimensions, Modal,
} from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAudioPlayer } from "expo-audio";
import AsyncStorage from "@react-native-async-storage/async-storage";


// ── Game components ────────────────────────────────────────
import EmailCard       from "../components/games/EmailCard";
import CodeCard        from "../components/games/CodeCard";
import BreachCard      from "../components/games/BreachCard";
import AnswerButtons   from "../components/games/AnswerButtons";
import TourOverlay     from "../components/games/TourOverlay";
import CipherCard      from "../components/games/CipherCard";
import AISecurityCard  from "../components/games/AISecurityCard";
import CryptoMazeGame from "../components/games/crypto-maze/CryptoMazeGame";
import NetworkHunterGame from "../components/games/network-hunter/NetworkHunterGame";

// ── Game data ──────────────────────────────────────────────
import {
  GAME_TIMERS,
  GAME_SCORING,
  GAME_MUSIC,
  TOUR_STEPS,
  GLOSSARY,
  HELP_TIPS,
} from "../lib/gameContent";

// ── Shared ─────────────────────────────────────────────────
import { COLORS } from "../constants/colors";
import { getCurrentUser, getGameQuestions, saveGameSession } from "../lib/api";
import { supabase } from "../lib/supabase";

const WIN_THRESHOLD = 0.6;

const DIFF_COLORS = {
  EASY:   { text: COLORS.success, bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)"  },
  MEDIUM: { text: COLORS.warning, bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)"  },
  HARD:   { text: "#f97316",      bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)"  },
  EXPERT: { text: "#c084fc",      bg: "rgba(192,132,252,0.12)", border: "rgba(192,132,252,0.3)" },
};

export default function GamePlayer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();

  const [phase,        setPhase]        = useState("loading");
  const [questions,    setQuestions]    = useState([]);
  const [currentIdx,   setCurrentIdx]   = useState(0);
  const [score,        setScore]        = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(20);
  const [timerMax,     setTimerMax]     = useState(20);
  const [selected,     setSelected]     = useState(null);
  const [isCorrect,    setIsCorrect]    = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [startTime,    setStartTime]    = useState(null);
  const [gameStartAt,  setGameStartAt]  = useState(null);
  const [user,         setUser]         = useState(null);
  const [gameInfo,     setGameInfo]     = useState(null);
  const [scoring,      setScoring]      = useState(GAME_SCORING.default);
  const [error,        setError]        = useState("");
  const [showHelp,     setShowHelp]     = useState(false);
  const [helpUsed,     setHelpUsed]     = useState(false);
  const [isMuted,      setIsMuted]      = useState(false);
  const [musicReady,   setMusicReady]   = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showTour,     setShowTour]     = useState(false);
  const [tourStep,     setTourStep]     = useState(0);
  const [musicSource,  setMusicSource]  = useState(null);

  const intervalRef  = useRef(null);
  const timerPaused  = useRef(false);
  const timeLeftRef  = useRef(20);
  const userRef      = useRef(null);
  const flashAnim    = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const player = useAudioPlayer(musicSource);

  const playMusic = useCallback(() => {
    try {
      if (!isMuted && musicSource) {
        player.loop = true; player.volume = 1.0; player.play();
      }
    } catch (e) {}
  }, [isMuted, musicSource, player]);

  const pauseMusic = useCallback(() => {
    try { player.pause(); } catch (e) {}
  }, [player]);

  const toggleMute = useCallback(() => {
    try {
      if (isMuted) { player.volume = 1.0; player.play(); }
      else { player.pause(); }
      setIsMuted(p => !p);
    } catch (e) {}
  }, [isMuted, player]);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      try { player.pause(); } catch (e) {}
    };
  }, []);

  useEffect(() => { loadGame(); }, []);

  useEffect(() => {
    if (musicSource && musicReady) playMusic();
  }, [musicSource, musicReady]);

  const loadGame = async () => {
    try {
      if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
        setError("Invalid game."); return;
      }

      const [currentUser, gameData, qs] = await Promise.all([
        getCurrentUser(),
        supabase
          .from("games")
          .select("id, title, category, difficulty, icon, description")
          .eq("id", id)
          .eq("is_published", true)
          .eq("status", "approved")
          .single(),
        getGameQuestions(id),
      ]);

      if (!currentUser)                     { router.replace("/welcome"); return; }
      if (gameData.error || !gameData.data) { setError("Game not found."); return; }
      if (!qs || qs.length === 0)           { setError("No questions available."); return; }

      const title    = gameData.data.title;
      const timer    = GAME_TIMERS[title]  ?? GAME_TIMERS.default;
      const sc       = GAME_SCORING[title] ?? GAME_SCORING.default;
    //  const shuffled = [...qs].sort(() => Math.random() - 0.5); replace this with below one
const requiresOrderedQuestions =
  title === "Crypto Maze" ||
  title === "Network Hunter";

const preparedQuestions =
  requiresOrderedQuestions
    ? [...qs].sort(
        (a, b) =>
          (Number(a?.order_num) || 0) -
          (Number(b?.order_num) || 0)
      )
    : [...qs].sort(() => Math.random() - 0.5);

      userRef.current = currentUser;
      setUser(currentUser);
      setGameInfo(gameData.data);
     // setQuestions(shuffled); rerplace this with below one
      setQuestions(preparedQuestions);
      setTimerMax(timer);
      setTimeLeft(timer);
      setScoring(sc);
      timeLeftRef.current = timer;

      const src = GAME_MUSIC[title] ?? null;
      if (src) setMusicSource(src);
//thisis new
if (title === "Crypto Maze") {
  setGameStartAt(Date.now());
  setPhase("maze");
  setMusicReady(true);
  return;
}
if (title === "Network Hunter") {
  setGameStartAt(Date.now());
  setPhase("hunter");
  setMusicReady(true);
  return;
}

      const storageKey = `howto_seen_${currentUser.id}_${id}`;
      const seen = await AsyncStorage.getItem(storageKey);
      if (!seen) {
        setPhase("tour");
        setTourStep(0);
        setShowTour(true);
      } else {
      //  beginGame(shuffled, timer);
      beginGame(preparedQuestions, timer); 
      }
    } catch (err) {
      console.error("[GamePlayer]", err.message);
      setError("Failed to load game.");
    }
  };

  const beginGame = (qs, timer) => {
    setGameStartAt(Date.now());
    setPhase("playing");
    startTimer(timer ?? timerMax);
    setMusicReady(true);
  };

  const handleTourNext = async () => {
    const steps   = TOUR_STEPS[gameInfo?.title] ?? [];
    const nextIdx = tourStep + 1;
    if (nextIdx >= steps.length) {
      const key = `howto_seen_${userRef.current?.id}_${id}`;
      await AsyncStorage.setItem(key, "true");
      setShowTour(false);
      if (GLOSSARY[gameInfo?.title]) {
        setPhase("glossary");
        setShowGlossary(true);
      } else {
        beginGame(questions, timerMax);
      }
    } else {
      setTourStep(nextIdx);
    }
  };

  const handleTourSkip = async () => {
    const key = `howto_seen_${userRef.current?.id}_${id}`;
    await AsyncStorage.setItem(key, "true");
    setShowTour(false);
    beginGame(questions, timerMax);
  };

  const handleGlossaryOpen = () => {
    if (phase === "playing") {
      timerPaused.current = true;
      clearInterval(intervalRef.current);
      progressAnim.stopAnimation();
      pauseMusic();
    }
    setShowGlossary(true);
  };

  const handleGlossaryClose = () => {
    setShowGlossary(false);
    if (phase === "glossary") {
      beginGame(questions, timerMax);
    } else if (phase === "playing") {
      timerPaused.current = false;
      resumeTimer();
      playMusic();
    }
  };

  const handleHelpPress = () => {
    if (phase !== "playing") return;
    if (!helpUsed) {
      timerPaused.current = true;
      clearInterval(intervalRef.current);
      progressAnim.stopAnimation();
      pauseMusic();
      setHelpUsed(true);
    }
    setShowHelp(true);
  };

  const handleHelpClose = () => {
    setShowHelp(false);
    if (timerPaused.current && phase === "playing") {
      timerPaused.current = false;
      resumeTimer();
      playMusic();
    }
  };

  const startTimer = useCallback((seconds) => {
    const secs = seconds ?? timerMax;
    timeLeftRef.current = secs;
    setTimeLeft(secs);
    setStartTime(Date.now());
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0, duration: secs * 1000, useNativeDriver: false,
    }).start();
    intervalRef.current = setInterval(() => {
      if (timerPaused.current) return;
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(intervalRef.current);
        handleTimeout();
      }
    }, 1000);
  }, [timerMax]);

  const resumeTimer = useCallback(() => {
    const remaining = timeLeftRef.current;
    if (remaining <= 0) return;
    Animated.timing(progressAnim, {
      toValue: 0, duration: remaining * 1000, useNativeDriver: false,
    }).start();
    intervalRef.current = setInterval(() => {
      if (timerPaused.current) return;
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(intervalRef.current);
        handleTimeout();
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    progressAnim.stopAnimation();
  }, []);

  const handleTimeout = useCallback(() => {
    setSelected("TIMEOUT");
    setIsCorrect(false);
    setPointsEarned(0);
    setPhase("feedback");
    triggerFlash(false);
  }, []);

  const handleAnswer = useCallback((answer) => {
    if (phase !== "playing") return;
    stopTimer();
    const question = questions[currentIdx];
    const correct  = answer === question.answer;
    const elapsed  = (Date.now() - startTime) / 1000;
    let points = 0;
    if (correct) {
      points = scoring.correct;
      if (elapsed < scoring.fastSec)     points += scoring.bonusFast;
      else if (elapsed < scoring.medSec) points += scoring.bonusMed;
    }
    setSelected(answer);
    setIsCorrect(correct);
    setPointsEarned(points);
    setScore(prev => prev + points);
    if (correct) setCorrectCount(prev => prev + 1);
    setPhase("feedback");
    triggerFlash(correct);
  }, [phase, questions, currentIdx, startTime, stopTimer, scoring]);

  const triggerFlash = (correct) => {
    flashAnim.setValue(0);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 150, useNativeDriver: false }),
      Animated.timing(flashAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
    ]).start();
  };

  const handleNext = useCallback(async () => {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) { await finishGame(); return; }
    timerPaused.current = false;
    setCurrentIdx(nextIdx);
    setSelected(null);
    setIsCorrect(null);
    setPointsEarned(0);
    setHelpUsed(false);
    setPhase("playing");
    startTimer(timerMax);
  }, [currentIdx, questions, timerMax]);

  const finishGame = async () => {
    setPhase("finished");
    pauseMusic();
    try {
      if (!user?.id || !gameInfo?.id) return;
      const durationSecs = Math.floor((Date.now() - gameStartAt) / 1000);
      const result = correctCount / questions.length >= WIN_THRESHOLD ? "win" : "loss";
      await saveGameSession({
        gameId: gameInfo.id, playerId: user.id,
        score, result, durationSecs: Math.min(durationSecs, 86400),
      });
      router.replace({
        pathname: "/game-result",
        params: {
          id, score, correct: correctCount,
          total: questions.length, result,
          gameTitle: gameInfo.title, gameIcon: gameInfo.icon,
        },
      });
    } catch (err) {
      console.error("[finishGame]", err.message);
      router.replace({
        pathname: "/game-result",
        params: {
          id, score, correct: correctCount,
          total: questions.length,
          result: correctCount / questions.length >= WIN_THRESHOLD ? "win" : "loss",
          gameTitle: gameInfo?.title ?? "Game",
          gameIcon:  gameInfo?.icon  ?? "🎮",
        },
      });
    }
  };

  const flashBg = flashAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [COLORS.bg, isCorrect
      ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)"],
  });

  const timerColor = timeLeft > timerMax * 0.6
    ? COLORS.success
    : timeLeft > timerMax * 0.3
      ? COLORS.warning
      : COLORS.danger;

  const question     = questions[currentIdx];
  const diff         = DIFF_COLORS[question?.difficulty] || DIFF_COLORS.MEDIUM;
  const questionType = question?.type ?? "phishing";
  const hasGlossary  = !!GLOSSARY[gameInfo?.title];
  const helpTips     = HELP_TIPS[questionType] ?? HELP_TIPS.phishing;

  const isEmail   = !question?.type || question?.type === "phishing";
  const isCode    = question?.type === "code";
  const isBreach  = question?.type === "breach";
  const isCipher  = question?.type === "cipher" || question?.type === "theory" || question?.type === "circuit";
    const isAI = question?.type === "ai";

  const instructionMap = {
    phishing: "Is this email real or a phishing attempt?",
    code:     "What security vulnerability exists in this code?",
    breach:   "What is the correct incident response action?",
    cipher:   "Decode the encrypted message:",
    theory:   "Answer this quantum computing question:",
    circuit:  "Identify the quantum gate operation:",
    ai:       "Analyze the conversation and identify the AI security threat:",
  };
  const instructionText = instructionMap[questionType] ?? instructionMap.phishing;

  if (questions.length === 0 && !error) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.screen, styles.center, { padding: 24 }]}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  //new
if (phase === "maze" && gameInfo?.title === "Crypto Maze") {
  return (
    <CryptoMazeGame
      questions={questions}
      gameInfo={gameInfo}
      user={user}
      pauseMusic={pauseMusic}
    />
  );
}

if (
  phase === "hunter" &&
  gameInfo?.title === "Network Hunter"
) {
  return (
    <NetworkHunterGame
      questions={questions}
      gameInfo={gameInfo}
      user={user}
      pauseMusic={pauseMusic}
    />
  );
}
  return (
    <Animated.View style={[styles.screen, { backgroundColor: flashBg }]}>

      {/* ── Help Modal ─────────────────────────────────── */}
      <Modal visible={showHelp} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>💡 Quick Tips</Text>
            {!helpUsed ? (
              <View style={styles.helpPausedBadge}>
                <Text style={styles.helpPausedText}>⏸️ Timer paused for this question</Text>
              </View>
            ) : (
              <View style={styles.helpWarning}>
                <Text style={styles.helpWarningText}>⚠️ Timer is still running — decide quickly!</Text>
              </View>
            )}
            <View style={styles.helpTips}>
              {helpTips.map((tip, i) => (
                <View key={i} style={styles.helpTipRow}>
                  <Text style={styles.helpTipText}>{tip}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.helpCloseBtn} onPress={handleHelpClose} activeOpacity={0.85}>
              <Text style={styles.helpCloseBtnText}>
                {helpUsed ? "Close — Timer Running! ⚡" : "Got it — Resume ▶"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Glossary Modal ─────────────────────────────── */}
      <Modal visible={showGlossary} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <View style={styles.glossaryCard}>
            <Text style={styles.glossaryTitle}>📖 Glossary</Text>
            <Text style={styles.glossarySubtitle}>
              {phase === "glossary"
                ? "Read these definitions before you start!"
                : "Reference guide — tap close to resume."}
            </Text>
            <ScrollView style={styles.glossaryScroll} showsVerticalScrollIndicator={false}>
              {(GLOSSARY[gameInfo?.title] ?? []).map((item, i) => (
                <View key={i} style={styles.glossaryItem}>
                  <View style={styles.glossaryItemHeader}>
                    <Text style={styles.glossaryIcon}>{item.icon}</Text>
                    <Text style={styles.glossaryTerm}>{item.term}</Text>
                  </View>
                  <Text style={styles.glossarySimple}>{item.simple}</Text>
                  <View style={styles.glossaryExampleBox}>
                    <Text style={styles.glossaryExampleLabel}>Example:</Text>
                    <Text style={styles.glossaryExampleText}>{item.example}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalBtn} onPress={handleGlossaryClose} activeOpacity={0.85}>
              <Text style={styles.modalBtnText}>
                {phase === "glossary"
                  ? "🎮  I'm Ready — Start Game!"
                  : "✅  Close & Resume Game"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Top Bar ───────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.quitBtn}
          onPress={() => { pauseMusic(); router.back(); }}
          activeOpacity={0.8}
        >
          <Text style={styles.quitText}>✕ Quit</Text>
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.gameTitle}>{gameInfo?.icon} {gameInfo?.title}</Text>
          <Text style={styles.questionCount}>
            Question {currentIdx + 1} of {questions.length}
          </Text>
        </View>
        <View style={styles.topRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={toggleMute} activeOpacity={0.8}>
            <Text style={styles.iconBtnText}>{isMuted ? "🔇" : "🔊"}</Text>
          </TouchableOpacity>
          {hasGlossary && (
            <TouchableOpacity style={styles.glossaryBtn} onPress={handleGlossaryOpen} activeOpacity={0.8}>
              <Text style={styles.glossaryBtnText}>📖</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.helpBtn, helpUsed && styles.helpBtnUsed]}
            onPress={handleHelpPress}
            activeOpacity={0.8}
          >
            <Text style={styles.helpBtnText}>?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Score Banner */}
      <View style={styles.scoreBanner}>
        <Text style={styles.scoreBannerText}>⚡ Score: {score}</Text>
      </View>

      {/* Progress Dots */}
      <View style={styles.progressRow}>
        {questions.map((_, i) => (
          <View key={i} style={[
            styles.progressDot,
            i < currentIdx   && styles.progressDotDone,
            i === currentIdx && styles.progressDotActive,
          ]} />
        ))}
      </View>

      {/* Timer Bar */}
      <View style={styles.timerRow}>
        <View style={styles.timerBarBg}>
          <Animated.View style={[
            styles.timerBarFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1], outputRange: ["0%", "100%"],
              }),
              backgroundColor: timerColor,
            },
          ]} />
        </View>
        <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}s</Text>
      </View>

      {/* Game Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Difficulty + Instruction */}
        <View style={styles.questionTopRow}>
          <View style={[styles.diffBadge, {
            backgroundColor: diff.bg, borderColor: diff.border,
          }]}>
            <Text style={[styles.diffText, { color: diff.text }]}>
              {question?.difficulty}
            </Text>
          </View>
          <Text style={styles.instructionText}>{instructionText}</Text>
        </View>

        {/* Game Card */}
        {isEmail && (
          <EmailCard
            question={question} phase={phase}
            selected={selected} isCorrect={isCorrect}
            pointsEarned={pointsEarned}
          />
        )}
        {isCode && (
          <CodeCard
            question={question} phase={phase}
            selected={selected} isCorrect={isCorrect}
            pointsEarned={pointsEarned}
          />
        )}
        {isBreach && (
          <BreachCard
            question={question} phase={phase}
            selected={selected} isCorrect={isCorrect}
            pointsEarned={pointsEarned}
          />
        )}
        {isCipher && (
          <CipherCard
            question={question} phase={phase}
            selected={selected} isCorrect={isCorrect}
            pointsEarned={pointsEarned}
          />
        )}

        {isAI && (
          <AISecurityCard
            question={question}
            phase={phase}
            selected={selected}
            isCorrect={isCorrect}
            pointsEarned={pointsEarned}
          />
        )}
        
        {/* Answer Buttons */}
        {phase === "playing" && (
          <AnswerButtons question={question} onAnswer={handleAnswer} />
        )}

        {/* Next Button */}
        {phase === "feedback" && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>
              {currentIdx + 1 >= questions.length ? "See Results 🏆" : "Next Question →"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Tour Overlay */}
      {showTour && (
        <TourOverlay
          steps={TOUR_STEPS[gameInfo?.title] ?? TOUR_STEPS["Phishing Trap"]}
          currentStep={tourStep}
          onNext={handleTourNext}
          onSkip={handleTourSkip}
        />
      )}

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, backgroundColor: COLORS.bg },
  center:      { justifyContent: "center", alignItems: "center" },
  loadingText: { color: COLORS.textSecondary, fontSize: 15, marginTop: 16 },
  errorText:   { color: COLORS.danger, fontSize: 16, marginBottom: 20, textAlign: "center" },
  backBtn: {
    backgroundColor: COLORS.bgCard, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  backBtnText: { color: COLORS.primary, fontWeight: "600" },

  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.88)",
    justifyContent: "center", alignItems: "center",
  },
  modalBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    padding: 16, alignItems: "center",
    shadowColor: COLORS.primary, shadowOpacity: 0.4,
    shadowRadius: 12, elevation: 6,
  },
  modalBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  helpCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: "rgba(245,158,11,0.3)",
    width: "90%", maxWidth: 400,
  },
  helpTitle: {
    color: COLORS.textPrimary, fontSize: 20,
    fontWeight: "800", marginBottom: 14, textAlign: "center",
  },
  helpPausedBadge: {
    backgroundColor: "rgba(16,185,129,0.12)", borderRadius: 10,
    padding: 10, marginBottom: 14,
    borderWidth: 1, borderColor: "rgba(16,185,129,0.3)",
  },
  helpPausedText:   { color: COLORS.success, fontSize: 12, fontWeight: "600", textAlign: "center" },
  helpTips:         { gap: 8, marginBottom: 16 },
  helpTipRow: {
    backgroundColor: COLORS.bgCardLight, borderRadius: 10,
    padding: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  helpTipText:      { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  helpWarning: {
    backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 10,
    padding: 10, marginBottom: 14,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
  },
  helpWarningText:  { color: COLORS.danger, fontSize: 12, fontWeight: "600", textAlign: "center" },
  helpCloseBtn:     { backgroundColor: COLORS.warning, borderRadius: 14, padding: 14, alignItems: "center" },
  helpCloseBtnText: { color: "#000", fontSize: 15, fontWeight: "800" },

  glossaryCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: "rgba(192,132,252,0.3)",
    width: "92%", maxWidth: 420, maxHeight: "88%",
  },
  glossaryTitle: {
    color: COLORS.textPrimary, fontSize: 20,
    fontWeight: "800", textAlign: "center", marginBottom: 6,
  },
  glossarySubtitle: {
    color: COLORS.textSecondary, fontSize: 12,
    textAlign: "center", marginBottom: 16,
  },
  glossaryScroll:   { maxHeight: 380, marginBottom: 16 },
  glossaryItem: {
    backgroundColor: COLORS.bgCardLight, borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  glossaryItemHeader:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  glossaryIcon:         { fontSize: 20 },
  glossaryTerm:         { color: COLORS.textPrimary, fontSize: 14, fontWeight: "800", flex: 1 },
  glossarySimple:       { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 10 },
  glossaryExampleBox: {
    backgroundColor: "rgba(192,132,252,0.08)", borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: "rgba(192,132,252,0.2)",
  },
  glossaryExampleLabel: { color: "#c084fc", fontSize: 11, fontWeight: "700", marginBottom: 3 },
  glossaryExampleText:  { color: COLORS.textSecondary, fontSize: 12, lineHeight: 17, fontStyle: "italic" },

  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 10,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  quitBtn: {
    backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)", borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  quitText:      { color: "#fca5a5", fontSize: 12, fontWeight: "700" },
  topCenter:     { alignItems: "center", flex: 1 },
  gameTitle:     { color: COLORS.textPrimary, fontSize: 13, fontWeight: "700" },
  questionCount: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  topRight:      { flexDirection: "row", gap: 8, alignItems: "center" },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
  },
  iconBtnText:  { fontSize: 16 },
  helpBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1, borderColor: COLORS.borderBlue,
    alignItems: "center", justifyContent: "center",
  },
  helpBtnUsed:     { backgroundColor: "rgba(100,100,100,0.1)", borderColor: COLORS.textMuted },
  helpBtnText:     { color: COLORS.primary, fontSize: 15, fontWeight: "800" },
  glossaryBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(192,132,252,0.12)",
    borderWidth: 1, borderColor: "rgba(192,132,252,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  glossaryBtnText: { fontSize: 15 },

  scoreBanner: {
    backgroundColor: COLORS.bgCard, paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    alignItems: "center",
  },
  scoreBannerText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },

  progressRow: {
    flexDirection: "row", gap: 4,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: COLORS.bgCard, justifyContent: "center",
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  progressDot:       { flex: 1, height: 4, borderRadius: 99, backgroundColor: COLORS.bgCardLight, maxWidth: 28 },
  progressDotDone:   { backgroundColor: COLORS.success },
  progressDotActive: { backgroundColor: COLORS.primary },

  timerRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 10, gap: 12,
  },
  timerBarBg:   { flex: 1, height: 6, backgroundColor: COLORS.bgCardLight, borderRadius: 99, overflow: "hidden" },
  timerBarFill: { height: "100%", borderRadius: 99 },
  timerText:    { fontSize: 14, fontWeight: "800", minWidth: 30, textAlign: "right" },

  scroll:  { flex: 1 },
  content: { padding: 16, gap: 14 },

  questionTopRow:  { flexDirection: "row", alignItems: "center", gap: 10 },
  diffBadge:       { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexShrink: 0 },
  diffText:        { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  instructionText: { color: COLORS.textSecondary, fontSize: 13, flex: 1 },

  nextBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16,
    padding: 18, alignItems: "center",
    shadowColor: COLORS.primary, shadowOpacity: 0.4,
    shadowRadius: 16, elevation: 8,
  },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});