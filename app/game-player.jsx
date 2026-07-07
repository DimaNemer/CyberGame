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
import { COLORS } from "../constants/colors";
import { getCurrentUser, getGameQuestions, saveGameSession } from "../lib/api";
import { supabase } from "../lib/supabase";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ── Game constants ─────────────────────────────────────────
const WIN_THRESHOLD = 0.6;

const GAME_TIMERS = {
  "Phishing Trap": 15,
  "Zero Day":      30,
  "Binary Breach": 20,
  default:         20,
};

const GAME_SCORING = {
  "Phishing Trap": { correct: 100, bonusFast: 50,  bonusMed: 25, fastSec: 5,  medSec: 10 },
  "Zero Day":      { correct: 100, bonusFast: 75,  bonusMed: 40, fastSec: 8,  medSec: 15 },
  "Binary Breach": { correct: 150, bonusFast: 100, bonusMed: 50, fastSec: 5,  medSec: 10 },
  default:         { correct: 100, bonusFast: 50,  bonusMed: 25, fastSec: 5,  medSec: 10 },
};

const GAME_MUSIC = {
  "Phishing Trap": require("../assets/sounds/phishing-trap.mp3"),
  "Zero Day":      require("../assets/sounds/zero-day.mp3"),
  "Binary Breach": require("../assets/sounds/binary-breach.mp3"),
};

// ── Tour steps ─────────────────────────────────────────────
const TOUR_STEPS = {
  "Phishing Trap": [
    {
      title:    "👋 Welcome to Phishing Trap!",
      desc:     "You are a cybersecurity analyst. Your job is to spot fake phishing emails before they cause damage.",
      position: "center", highlight: null,
    },
    {
      title:    "📧 Read The Email",
      desc:     "A simulated email appears showing the sender address, subject line and body. Read every detail carefully.",
      position: "bottom", highlight: "content",
    },
    {
      title:    "⏱️ Watch The Timer",
      desc:     "You have 15 seconds to decide. The bar turns yellow then red as time runs low. Faster answers earn bonus points!",
      position: "bottom", highlight: "timer",
    },
    {
      title:    "✅ Tap Your Answer",
      desc:     "Tap REAL if the email looks legitimate, or PHISHING if it looks suspicious. After each answer you will learn exactly why.",
      position: "top", highlight: "buttons",
    },
    {
      title:    "💡 Need Help?",
      desc:     "Tap the ? button anytime for tips. First press pauses the timer — after that it keeps running. You are ready!",
      position: "bottom", highlight: "topbar",
    },
  ],
  "Zero Day": [
    {
      title:    "👋 Welcome to Zero Day!",
      desc:     "You are a security code reviewer. Find dangerous vulnerabilities in code before hackers exploit them.",
      position: "center", highlight: null,
    },
    {
      title:    "💻 Read The Code",
      desc:     "A real code snippet appears in Python, JavaScript or PHP. Look for security mistakes in how user input is handled.",
      position: "bottom", highlight: "content",
    },
    {
      title:    "⏱️ Watch The Timer",
      desc:     "You have 30 seconds — code needs more reading time. Stay calm and read carefully.",
      position: "bottom", highlight: "timer",
    },
    {
      title:    "🔍 Choose The Vulnerability",
      desc:     "Select which security vulnerability exists from 4 choices. After each question you will see why and how to fix it.",
      position: "top", highlight: "buttons",
    },
    {
      title:    "📖 Glossary & Tips",
      desc:     "Tap 📖 to review vulnerability definitions anytime. Tap ? for quick tips during the game.",
      position: "bottom", highlight: "topbar",
    },
  ],
  "Binary Breach": [
    {
      title:    "👋 Welcome to Binary Breach!",
      desc:     "You are an incident responder. Security alerts are incoming — choose the correct action before the system is fully breached.",
      position: "center", highlight: null,
    },
    {
      title:    "🚨 Read The Alert",
      desc:     "Each alert shows the attack type, affected system and severity level. Read every detail before deciding.",
      position: "bottom", highlight: "content",
    },
    {
      title:    "⏱️ Act Fast",
      desc:     "You have 20 seconds per alert. Real incidents require fast decisions — hesitation costs systems.",
      position: "bottom", highlight: "timer",
    },
    {
      title:    "🛡️ Choose Your Response",
      desc:     "Select the correct defensive action from 4 choices. Wrong responses make the breach worse.",
      position: "top", highlight: "buttons",
    },
    {
      title:    "💡 Need Help?",
      desc:     "Tap ? anytime for incident response tips. First press pauses the timer. You are ready!",
      position: "bottom", highlight: "topbar",
    },
  ],
};

// ── Glossary ───────────────────────────────────────────────
const GLOSSARY = {
  "Zero Day": [
    {
      term: "SQL Injection", icon: "💉",
      simple: "When user input is mixed directly into a database command, attackers can insert their own commands to steal or destroy data.",
      example: "Typing ' OR 1=1 -- in a login box can bypass authentication entirely.",
    },
    {
      term: "XSS (Cross-Site Scripting)", icon: "🖥️",
      simple: "When a website displays user input without checking it, attackers can inject malicious code that runs in other users browsers.",
      example: "Posting a comment with script code that steals other visitors login sessions.",
    },
    {
      term: "Hardcoded Credentials", icon: "🔑",
      simple: "Passwords or secret keys written directly in the code instead of stored securely.",
      example: "If this code is ever shared or leaked, anyone can see the password instantly.",
    },
    {
      term: "Command Injection", icon: "⚡",
      simple: "When user input is passed to system commands, attackers can run their own commands on the server.",
      example: "Typing ; rm -rf / could delete every file on the server.",
    },
    {
      term: "Insecure Deserialization", icon: "📦",
      simple: "Loading untrusted data in a format that can execute code, allowing attackers to run malicious programs.",
      example: "A malicious file disguised as normal data that runs hidden code when opened.",
    },
    {
      term: "File Inclusion Attack", icon: "📁",
      simple: "When user input controls which file gets loaded by the server, attackers can access private or system files.",
      example: "Requesting ?file=/etc/passwd to read sensitive system information.",
    },
    {
      term: "CSRF", icon: "🎭",
      simple: "Tricking a logged-in users browser into performing an action they did not intend, like transferring money.",
      example: "Clicking a malicious link while logged into your bank triggers an unwanted transfer.",
    },
    {
      term: "User Enumeration", icon: "🔍",
      simple: "When a system reveals whether a username or email exists, helping attackers build a list of real accounts.",
      example: "A login form saying wrong password vs user not found leaks which emails are registered.",
    },
  ],
  "Binary Breach": [
    {
      term: "Brute Force Attack", icon: "🔨",
      simple: "An attacker automatically tries thousands of password combinations per second until one works.",
      example: "50 failed logins per minute from the same IP is always automated brute forcing.",
    },
    {
      term: "Data Exfiltration", icon: "📤",
      simple: "When an attacker secretly copies and sends your data to their own servers outside your network.",
      example: "Your database server sending gigabytes of data to a foreign IP at 3 AM.",
    },
    {
      term: "Lateral Movement", icon: "↔️",
      simple: "After compromising one machine, an attacker moves across your network to reach more valuable systems.",
      example: "A compromised workstation scanning all internal IPs to find servers to attack next.",
    },
    {
      term: "Ransomware", icon: "🔒",
      simple: "Malware that encrypts all your files and demands payment to restore access.",
      example: "Files suddenly renamed to .locked extension across all servers simultaneously.",
    },
    {
      term: "Backdoor", icon: "🚪",
      simple: "A hidden account or program an attacker installs to maintain access to your system secretly.",
      example: "A new admin account created at 3 AM by an unknown automated process.",
    },
    {
      term: "Man-in-the-Middle", icon: "👤",
      simple: "An attacker positions themselves between you and a website, intercepting all your communications.",
      example: "A fake certificate intercepting bank traffic and stealing login credentials in real time.",
    },
    {
      term: "Zero-Day", icon: "💀",
      simple: "A vulnerability that has no fix yet because the software vendor has not patched it.",
      example: "An Apache exploit being actively used before a security patch is available.",
    },
    {
      term: "WAF (Web Application Firewall)", icon: "🛡️",
      simple: "A security tool that filters and blocks malicious web traffic before it reaches your application.",
      example: "Blocking a specific exploit pattern to stop a zero-day attack as a temporary fix.",
    },
  ],
};

const DIFF_COLORS = {
  EASY:   { text: COLORS.success, bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)"  },
  MEDIUM: { text: COLORS.warning, bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)"  },
  HARD:   { text: "#f97316",      bg: "rgba(249,115,22,0.12)",  border: "rgba(249,115,22,0.3)"  },
  EXPERT: { text: "#c084fc",      bg: "rgba(192,132,252,0.12)", border: "rgba(192,132,252,0.3)" },
};

// ── Tour Overlay ───────────────────────────────────────────
function TourOverlay({ steps, currentStep, onNext, onSkip }) {
  const step       = steps[currentStep];
  const isLast     = currentStep === steps.length - 1;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const bounceRef  = useRef(null);

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();

    if (bounceRef.current) bounceRef.current.stop();
    bounceRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -10, duration: 500, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0,   duration: 500, useNativeDriver: true }),
      ])
    );
    bounceRef.current.start();
    return () => { if (bounceRef.current) bounceRef.current.stop(); };
  }, [currentStep]);

  const isCenter = step?.position === "center";
  const isBottom = step?.position === "bottom" && !isCenter;
  const isTop    = step?.position === "top";

  const getHighlight = () => {
    switch (step?.highlight) {
      case "timer":   return { top: 130, height: 52 };
      case "content": return { top: 205, height: 210 };
      case "buttons": return { bottom: 85, height: 130 };
      case "topbar":  return { top: 52,  height: 80  };
      default:        return null;
    }
  };

  const getArrowPosition = () => {
    switch (step?.highlight) {
      case "timer":   return { top: 178,    left: "50%", marginLeft: -12 };
      case "content": return { top: 410,    left: "50%", marginLeft: -12 };
      case "topbar":  return { top: 128,    right: 55 };
      case "buttons": return { bottom: 210, left: "50%", marginLeft: -12 };
      default:        return null;
    }
  };

  const highlight  = getHighlight();
  const arrowPos   = getArrowPosition();
  const arrowChar  = step?.highlight === "buttons" ? "↓" : "↑";

  return (
    <View style={tourStyles.container}>
      <View style={tourStyles.dimFull} />
      {highlight && <View style={[tourStyles.highlight, highlight]} />}
      {arrowPos && (
        <Animated.Text style={[
          tourStyles.arrowPointer, arrowPos,
          { transform: [{ translateY: bounceAnim }] },
        ]}>
          {arrowChar}
        </Animated.Text>
      )}
      <TouchableOpacity style={tourStyles.skipBtn} onPress={onSkip}>
        <Text style={tourStyles.skipText}>Skip Tour</Text>
      </TouchableOpacity>
      <View style={[tourStyles.dotsRow, isTop && { bottom: undefined, top: 260 }]}>
        {steps.map((_, i) => (
          <View key={i} style={[
            tourStyles.dot,
            i === currentStep && tourStyles.dotActive,
            i < currentStep  && tourStyles.dotDone,
          ]} />
        ))}
      </View>
      <Animated.View style={[
        tourStyles.tooltip,
        isBottom && tourStyles.tooltipBottom,
        isTop    && tourStyles.tooltipTop,
        isCenter && tourStyles.tooltipCenter,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}>
        {isBottom && <View style={tourStyles.tooltipArrowUp} />}
        {isTop    && <View style={tourStyles.tooltipArrowDown} />}
        <Text style={tourStyles.tooltipTitle}>{step?.title}</Text>
        <Text style={tourStyles.tooltipDesc}>{step?.desc}</Text>
        <View style={tourStyles.tooltipFooter}>
          <Text style={tourStyles.stepCount}>{currentStep + 1} / {steps.length}</Text>
          <TouchableOpacity style={tourStyles.nextBtn} onPress={onNext} activeOpacity={0.85}>
            <Text style={tourStyles.nextBtnText}>
              {isLast ? "🎮  Start Game!" : "Next →"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

// ── Main Component ─────────────────────────────────────────
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

  const intervalRef  = useRef(null);
  const timerPaused  = useRef(false);
  const timeLeftRef  = useRef(20);
  const userRef      = useRef(null);
  const flashAnim    = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const [musicSource, setMusicSource] = useState(null);
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
      else          { player.pause(); }
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

      if (!currentUser)                  { router.replace("/welcome"); return; }
      if (gameData.error || !gameData.data) { setError("Game not found."); return; }
      if (!qs || qs.length === 0)        { setError("No questions available."); return; }

      const title    = gameData.data.title;
      const timer    = GAME_TIMERS[title]  ?? GAME_TIMERS.default;
      const sc       = GAME_SCORING[title] ?? GAME_SCORING.default;
      const shuffled = [...qs].sort(() => Math.random() - 0.5);

      userRef.current = currentUser;
      setUser(currentUser);
      setGameInfo(gameData.data);
      setQuestions(shuffled);
      setTimerMax(timer);
      setTimeLeft(timer);
      setScoring(sc);
      timeLeftRef.current = timer;

      const src = GAME_MUSIC[title] ?? null;
      if (src) setMusicSource(src);

      const storageKey = `howto_seen_${currentUser.id}_${id}`;
      const seen = await AsyncStorage.getItem(storageKey);
      if (!seen) {
        setPhase("tour");
        setTourStep(0);
        setShowTour(true);
      } else {
        beginGame(shuffled, timer);
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
      const storageKey = `howto_seen_${userRef.current?.id}_${id}`;
      await AsyncStorage.setItem(storageKey, "true");
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
    const storageKey = `howto_seen_${userRef.current?.id}_${id}`;
    await AsyncStorage.setItem(storageKey, "true");
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
        params: { id, score, correct: correctCount, total: questions.length,
                  result, gameTitle: gameInfo.title, gameIcon: gameInfo.icon },
      });
    } catch (err) {
      console.error("[finishGame]", err.message);
      router.replace({
        pathname: "/game-result",
        params: { id, score, correct: correctCount, total: questions.length,
                  result: correctCount / questions.length >= WIN_THRESHOLD ? "win" : "loss",
                  gameTitle: gameInfo?.title ?? "Game", gameIcon: gameInfo?.icon ?? "🎮" },
      });
    }
  };

  const flashBg = flashAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [COLORS.bg, isCorrect
      ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)"],
  });

  const timerColor = timeLeft > timerMax * 0.6
    ? COLORS.success : timeLeft > timerMax * 0.3 ? COLORS.warning : COLORS.danger;

  const question   = questions[currentIdx];
  const diff       = DIFF_COLORS[question?.difficulty] || DIFF_COLORS.MEDIUM;
  const isEmail    = !question?.type || question?.type === "phishing";
  const isCode     = question?.type === "code";
  const isBreach   = question?.type === "breach";

  const choices    = question?.options?.choices ?? [];
  const emailData  = question?.options ?? {};

  const severityColor =
    question?.options?.severity === "CRITICAL" ? COLORS.danger
    : question?.options?.severity === "HIGH"   ? "#f97316"
    : COLORS.warning;

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

  const hasGlossary = !!GLOSSARY[gameInfo?.title];
  const helpTips = isCode ? [
    "🔍 Look for user input being used without validation.",
    "💉 Any concatenation of user data into SQL is injection.",
    "🖥️ innerHTML with user data = XSS vulnerability.",
    "🔑 Passwords or API keys in code = hardcoded credentials.",
    "⚡ shell=True with user input = command injection.",
  ] : isBreach ? [
    "🚨 CRITICAL alerts always require immediate isolation or blocking.",
    "📊 Check the system name — payment servers need extra caution.",
    "⏰ Attacks at 3 AM or odd hours are almost always malicious.",
    "🔒 Ransomware — isolate first, restore backup second, never pay.",
    "📋 Data breaches require legal notification within 72 hours.",
  ] : [
    "🔍 Check the sender domain character by character.",
    "⚡ Urgency and threats are red flags.",
    "🔗 Real companies never send password or payment links.",
    "✅ Legitimate emails are calm and require no action.",
    "💳 No real company asks for payment details via email.",
  ];

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
                : "Reference guide — tap close to resume your game."}
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
                {phase === "glossary" ? "🎮  I'm Ready — Start Game!" : "✅  Close & Resume Game"}
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Difficulty + Instruction */}
        <View style={styles.questionTopRow}>
          <View style={[styles.diffBadge, { backgroundColor: diff.bg, borderColor: diff.border }]}>
            <Text style={[styles.diffText, { color: diff.text }]}>{question?.difficulty}</Text>
          </View>
          <Text style={styles.instructionText}>
            {isCode   && "What security vulnerability exists in this code?"}
            {isBreach && "What is the correct incident response action?"}
            {isEmail  && "Is this email real or a phishing attempt?"}
          </Text>
        </View>

        {/* ── Email Card ────────────────────────────── */}
        {isEmail && (
          <View style={[
            styles.emailCard,
            phase === "feedback" && {
              borderColor: selected === "TIMEOUT" ? COLORS.textMuted
                : isCorrect ? COLORS.success : COLORS.danger,
              borderWidth: 2,
            },
          ]}>
            <View style={styles.emailHeader}>
              <View style={styles.emailAvatar}>
                <Text style={{ fontSize: 20 }}>✉️</Text>
              </View>
              <View style={styles.emailMeta}>
                <Text style={styles.emailFrom} numberOfLines={1}>
                  From: {emailData.sender ?? "unknown@domain.com"}
                </Text>
                <Text style={styles.emailSubject} numberOfLines={1}>
                  {emailData.subject ?? "No subject"}
                </Text>
              </View>
            </View>
            <View style={styles.emailDivider} />
            <Text style={styles.emailBody}>{emailData.body ?? question?.question}</Text>
            {phase === "feedback" && (
              <FeedbackSection selected={selected} isCorrect={isCorrect}
                pointsEarned={pointsEarned} question={question} />
            )}
          </View>
        )}

        {/* ── Code Card ─────────────────────────────── */}
        {isCode && (
          <View style={[
            styles.codeCard,
            phase === "feedback" && {
              borderColor: selected === "TIMEOUT" ? COLORS.textMuted
                : isCorrect ? COLORS.success : COLORS.danger,
              borderWidth: 2,
            },
          ]}>
            <View style={styles.codeHeader}>
              <View style={styles.codeDots}>
                <View style={[styles.codeDot, { backgroundColor: "#ef4444" }]} />
                <View style={[styles.codeDot, { backgroundColor: "#f59e0b" }]} />
                <View style={[styles.codeDot, { backgroundColor: "#10b981" }]} />
              </View>
              <Text style={styles.codeLang}>{question?.options?.language ?? "Code"}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text style={styles.codeText}>{question?.options?.code ?? ""}</Text>
            </ScrollView>
            {phase === "feedback" && (
              <FeedbackSection selected={selected} isCorrect={isCorrect}
                pointsEarned={pointsEarned} question={question} />
            )}
          </View>
        )}

        {/* ── Breach Alert Card ─────────────────────── */}
        {isBreach && (
          <View style={[
            styles.breachCard,
            phase === "feedback" && {
              borderColor: selected === "TIMEOUT" ? COLORS.textMuted
                : isCorrect ? COLORS.success : COLORS.danger,
              borderWidth: 2,
            },
          ]}>
            {/* Severity header */}
            <View style={[styles.breachHeader, {
              backgroundColor: question?.options?.severity === "CRITICAL"
                ? "rgba(239,68,68,0.15)"
                : question?.options?.severity === "HIGH"
                  ? "rgba(249,115,22,0.15)"
                  : "rgba(245,158,11,0.15)",
            }]}>
              <View style={styles.breachHeaderLeft}>
                <Text style={styles.breachAlertIcon}>🚨</Text>
                <View>
                  <Text style={[styles.breachSeverity, { color: severityColor }]}>
                    {question?.options?.severity} ALERT
                  </Text>
                  <Text style={styles.breachSystem}>
                    System: {question?.options?.system}
                  </Text>
                </View>
              </View>
              <View style={[styles.breachPulseDot, { backgroundColor: severityColor }]} />
            </View>

            {/* Alert body */}
            <View style={styles.breachBody}>
              <Text style={styles.breachAlertTitle}>
                {question?.options?.alert}
              </Text>
              <View style={styles.breachDetailBox}>
                <Text style={styles.breachDetailLabel}>📋 Details:</Text>
                <Text style={styles.breachDetailText}>
                  {question?.options?.detail}
                </Text>
              </View>
            </View>

            {phase === "feedback" && (
              <FeedbackSection selected={selected} isCorrect={isCorrect}
                pointsEarned={pointsEarned} question={question} />
            )}
          </View>
        )}

        {/* ── Phishing Trap Buttons ─────────────────── */}
        {isEmail && phase === "playing" && (
          <View style={styles.answerRow}>
            <TouchableOpacity style={styles.realBtn}
              onPress={() => handleAnswer("REAL")} activeOpacity={0.85}>
              <Text style={styles.answerBtnIcon}>✅</Text>
              <Text style={styles.realBtnText}>REAL</Text>
              <Text style={styles.answerBtnSub}>Legitimate email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.phishBtn}
              onPress={() => handleAnswer("PHISHING")} activeOpacity={0.85}>
              <Text style={styles.answerBtnIcon}>🎣</Text>
              <Text style={styles.phishBtnText}>PHISHING</Text>
              <Text style={styles.answerBtnSub}>Suspicious email</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Zero Day Choices ──────────────────────── */}
        {isCode && phase === "playing" && (
          <View style={styles.choicesGrid}>
            {choices.map((choice, i) => (
              <TouchableOpacity key={i} style={styles.choiceBtn}
                onPress={() => handleAnswer(choice)} activeOpacity={0.85}>
                <View style={styles.choiceLabel}>
                  <Text style={styles.choiceLetter}>{["A","B","C","D"][i]}</Text>
                </View>
                <Text style={styles.choiceText}>{choice}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Binary Breach Response Buttons ────────── */}
        {isBreach && phase === "playing" && (
          <View style={styles.breachChoices}>
            {choices.map((choice, i) => (
              <TouchableOpacity key={i} style={styles.breachChoiceBtn}
                onPress={() => handleAnswer(choice)} activeOpacity={0.85}>
                <View style={styles.breachChoiceIcon}>
                  <Text style={styles.breachChoiceLetter}>{["A","B","C","D"][i]}</Text>
                </View>
                <Text style={styles.breachChoiceText}>{choice}</Text>
                <Text style={styles.breachChoiceArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
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

// ── Feedback Section ───────────────────────────────────────
function FeedbackSection({ selected, isCorrect, pointsEarned, question }) {
  return (
    <View style={[styles.feedbackBox, {
      backgroundColor: selected === "TIMEOUT" ? "rgba(100,100,100,0.06)"
        : isCorrect ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
      borderTopColor: selected === "TIMEOUT" ? COLORS.textMuted
        : isCorrect ? COLORS.success : COLORS.danger,
    }]}>
      <View style={styles.feedbackHeader}>
        <Text style={styles.feedbackIcon}>
          {selected === "TIMEOUT" ? "⏱️" : isCorrect ? "✅" : "❌"}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.feedbackTitle, {
            color: selected === "TIMEOUT" ? COLORS.textMuted
              : isCorrect ? COLORS.success : COLORS.danger,
          }]}>
            {selected === "TIMEOUT" ? "Time's Up!"
              : isCorrect ? `Correct! +${pointsEarned} pts` : "Wrong Answer"}
          </Text>
          <Text style={styles.feedbackAnswer}>
            Correct answer:{" "}
            <Text style={{ fontWeight: "800", color: COLORS.textPrimary }}>
              {question?.answer}
            </Text>
          </Text>
        </View>
      </View>
      <View style={styles.explanationBox}>
        <Text style={styles.explanationTitle}>🧠 Why?</Text>
        <Text style={styles.explanationText}>{question?.explanation}</Text>
      </View>
      {question?.tip && (
        <View style={styles.tipBox}>
          <Text style={styles.tipText}>{question.tip}</Text>
        </View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────
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
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  modalBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  helpCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: "rgba(245,158,11,0.3)",
    width: "90%", maxWidth: 400,
  },
  helpTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: "800", marginBottom: 14, textAlign: "center" },
  helpPausedBadge: {
    backgroundColor: "rgba(16,185,129,0.12)", borderRadius: 10, padding: 10,
    marginBottom: 14, borderWidth: 1, borderColor: "rgba(16,185,129,0.3)",
  },
  helpPausedText:   { color: COLORS.success, fontSize: 12, fontWeight: "600", textAlign: "center" },
  helpTips:         { gap: 8, marginBottom: 16 },
  helpTipRow: {
    backgroundColor: COLORS.bgCardLight, borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  helpTipText:  { color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  helpWarning: {
    backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 10, padding: 10,
    marginBottom: 14, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
  },
  helpWarningText:  { color: COLORS.danger, fontSize: 12, fontWeight: "600", textAlign: "center" },
  helpCloseBtn:     { backgroundColor: COLORS.warning, borderRadius: 14, padding: 14, alignItems: "center" },
  helpCloseBtnText: { color: "#000", fontSize: 15, fontWeight: "800" },

  glossaryCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: "rgba(192,132,252,0.3)",
    width: "92%", maxWidth: 420, maxHeight: "88%",
  },
  glossaryTitle:    { color: COLORS.textPrimary, fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  glossarySubtitle: { color: COLORS.textSecondary, fontSize: 12, textAlign: "center", marginBottom: 16 },
  glossaryScroll:   { maxHeight: 380, marginBottom: 16 },
  glossaryItem: {
    backgroundColor: COLORS.bgCardLight, borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
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
    backgroundColor: COLORS.bgCardLight, borderWidth: 1, borderColor: COLORS.border,
    alignItems: "center", justifyContent: "center",
  },
  iconBtnText: { fontSize: 16 },
  helpBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.borderBlue,
    alignItems: "center", justifyContent: "center",
  },
  helpBtnUsed:     { backgroundColor: "rgba(100,100,100,0.1)", borderColor: COLORS.textMuted },
  helpBtnText:     { color: COLORS.primary, fontSize: 15, fontWeight: "800" },
  glossaryBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(192,132,252,0.12)", borderWidth: 1,
    borderColor: "rgba(192,132,252,0.3)", alignItems: "center", justifyContent: "center",
  },
  glossaryBtnText: { fontSize: 15 },

  scoreBanner: {
    backgroundColor: COLORS.bgCard, paddingVertical: 6, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, alignItems: "center",
  },
  scoreBannerText: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },

  progressRow: {
    flexDirection: "row", gap: 4, paddingHorizontal: 16, paddingVertical: 10,
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

  // Email
  emailCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, overflow: "hidden",
  },
  emailHeader: {
    flexDirection: "row", alignItems: "flex-start",
    padding: 14, gap: 12, backgroundColor: COLORS.bgCardLight,
  },
  emailAvatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.bg,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: COLORS.border, flexShrink: 0,
  },
  emailMeta:    { flex: 1 },
  emailFrom:    { color: COLORS.textPrimary, fontSize: 13, fontWeight: "700", marginBottom: 3 },
  emailSubject: { color: COLORS.textSecondary, fontSize: 12 },
  emailDivider: { height: 1, backgroundColor: COLORS.border },
  emailBody:    { color: COLORS.textPrimary, fontSize: 14, lineHeight: 22, padding: 16 },

  // Code
  codeCard: {
    backgroundColor: "#0d1117", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(48,54,61,0.8)", overflow: "hidden",
  },
  codeHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#161b22",
    borderBottomWidth: 1, borderBottomColor: "rgba(48,54,61,0.8)",
  },
  codeDots: { flexDirection: "row", gap: 6 },
  codeDot:  { width: 12, height: 12, borderRadius: 6 },
  codeLang: { color: "#8b949e", fontSize: 12, fontWeight: "600" },
  codeText: {
    color: "#e6edf3", fontSize: 13, fontFamily: "monospace",
    lineHeight: 22, padding: 16, minWidth: width - 48,
  },

  // Binary Breach
  breachCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, overflow: "hidden",
  },
  breachHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  breachHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  breachAlertIcon:  { fontSize: 28 },
  breachSeverity:   { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  breachSystem:     { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  breachPulseDot:   { width: 10, height: 10, borderRadius: 5 },
  breachBody:       { padding: 16, gap: 12 },
  breachAlertTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "800", lineHeight: 24 },
  breachDetailBox: {
    backgroundColor: COLORS.bgCardLight, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  breachDetailLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "700", marginBottom: 6 },
  breachDetailText:  { color: COLORS.textPrimary, fontSize: 13, lineHeight: 20 },
  breachChoices:     { gap: 10 },
  breachChoiceBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
  },
  breachChoiceIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  breachChoiceLetter: { color: COLORS.danger, fontSize: 13, fontWeight: "800" },
  breachChoiceText:   { color: COLORS.textPrimary, fontSize: 13, flex: 1, lineHeight: 19 },
  breachChoiceArrow:  { color: COLORS.textMuted, fontSize: 16 },

  // Feedback
  feedbackBox:      { borderTopWidth: 1, padding: 16, gap: 12 },
  feedbackHeader:   { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  feedbackIcon:     { fontSize: 32 },
  feedbackTitle:    { fontSize: 18, fontWeight: "800", marginBottom: 4 },
  feedbackAnswer:   { color: COLORS.textSecondary, fontSize: 13 },
  explanationBox: {
    backgroundColor: COLORS.bgCardLight, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  explanationTitle: { color: COLORS.textPrimary, fontSize: 13, fontWeight: "700", marginBottom: 6 },
  explanationText:  { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  tipBox: {
    backgroundColor: "rgba(59,130,246,0.08)", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.borderBlue,
  },
  tipText: { color: COLORS.primary, fontSize: 12, lineHeight: 18, fontStyle: "italic" },

  // Phishing buttons
  answerRow: { flexDirection: "row", gap: 12 },
  realBtn: {
    flex: 1, backgroundColor: "rgba(16,185,129,0.1)",
    borderWidth: 2, borderColor: "rgba(16,185,129,0.35)",
    borderRadius: 18, padding: 18, alignItems: "center",
  },
  phishBtn: {
    flex: 1, backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 2, borderColor: "rgba(239,68,68,0.35)",
    borderRadius: 18, padding: 18, alignItems: "center",
  },
  answerBtnIcon: { fontSize: 28, marginBottom: 6 },
  realBtnText:   { color: COLORS.success, fontSize: 16, fontWeight: "800", marginBottom: 4 },
  phishBtnText:  { color: COLORS.danger,  fontSize: 16, fontWeight: "800", marginBottom: 4 },
  answerBtnSub:  { color: COLORS.textMuted, fontSize: 11 },

  // Code choices
  choicesGrid: { gap: 10 },
  choiceBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  choiceLabel: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primaryGlow, borderWidth: 1, borderColor: COLORS.borderBlue,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  choiceLetter: { color: COLORS.primary, fontSize: 13, fontWeight: "800" },
  choiceText:   { color: COLORS.textPrimary, fontSize: 14, flex: 1 },

  // Next button
  nextBtn: {
    backgroundColor: COLORS.primary, borderRadius: 16, padding: 18, alignItems: "center",
    shadowColor: COLORS.primary, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});

// ── Tour Styles ────────────────────────────────────────────
const tourStyles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 999,
  },
  dimFull: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.78)", zIndex: 1000,
  },
  highlight: {
    position: "absolute", left: 12, right: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16, borderWidth: 2,
    borderColor: "rgba(59,130,246,0.7)", zIndex: 1001,
  },
  arrowPointer: {
    position: "absolute", fontSize: 26, color: "#fff", zIndex: 1003,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  skipBtn: {
    position: "absolute", top: 56, right: 16, zIndex: 1004,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  skipText:  { color: "#fff", fontSize: 12, fontWeight: "600" },
  dotsRow: {
    position: "absolute", bottom: 250, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", gap: 6, zIndex: 1004,
  },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.3)" },
  dotActive: { backgroundColor: "#fff", width: 18 },
  dotDone:   { backgroundColor: "rgba(255,255,255,0.6)" },
  tooltip: {
    position: "absolute", left: 16, right: 16,
    backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: COLORS.borderBlue,
    zIndex: 1004, shadowColor: "#000",
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 20,
  },
  tooltipBottom: { bottom: 50 },
  tooltipTop:    { top: 270  },
  tooltipCenter: { top: SCREEN_HEIGHT * 0.28 },
  tooltipArrowUp: {
    position: "absolute", top: -9, left: "50%", marginLeft: -9,
    width: 0, height: 0,
    borderLeftWidth: 9, borderLeftColor: "transparent",
    borderRightWidth: 9, borderRightColor: "transparent",
    borderBottomWidth: 9, borderBottomColor: COLORS.borderBlue,
  },
  tooltipArrowDown: {
    position: "absolute", bottom: -9, left: "50%", marginLeft: -9,
    width: 0, height: 0,
    borderLeftWidth: 9, borderLeftColor: "transparent",
    borderRightWidth: 9, borderRightColor: "transparent",
    borderTopWidth: 9, borderTopColor: COLORS.borderBlue,
  },
  tooltipTitle:  { color: COLORS.textPrimary, fontSize: 17, fontWeight: "800", marginBottom: 8 },
  tooltipDesc:   { color: COLORS.textSecondary, fontSize: 14, lineHeight: 21, marginBottom: 16 },
  tooltipFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stepCount:     { color: COLORS.textMuted, fontSize: 13 },
  nextBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  nextBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});