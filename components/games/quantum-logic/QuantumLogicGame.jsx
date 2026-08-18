import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import QuantumCodeWalkthrough from "./QuantumCodeWalkthrough";
import QuantumConcepts from "./QuantumConcepts";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import QuantumDPad from "./QuantumDPad";

import { COLORS } from "../../../constants/colors";

import {
  QUANTUM_LEVELS,
  getQuantumLevel,
  getQuantumLevelCount,
} from "../../../lib/quantumLogicLevels";

import {
  QUANTUM_MODE,
  DIRECTIONS,
  createInitialQuantumState,
  moveQuantumPlayer,
  applySuperposition,
  measureQuantumState,
  beginEntanglementSelection,
  selectEntanglementCell,
  cancelEntanglementSelection,
  isValidCoordinate,
} from "../../../lib/quantumLogicEngine";

import {
  TOUR_STEPS,
  GLOSSARY,
  HELP_TIPS,
} from "../../../lib/gameContent";

import QuantumGrid from "./QuantumGrid";
import QuantumControls from "./QuantumControls";
import QuantumStatePanel from "./QuantumStatePanel";

import TourOverlay from "../TourOverlay";
import GameGuideModal from "../GameGuideModal";

// =========================================================
// QUANTUM LOGIC
// =========================================================
//
// IMPORTANT SECURITY MODEL
//
// This component is an interactive CLIENT.
//
// It protects against:
// - malformed actions
// - illegal coordinates
// - rapid duplicate input
// - invalid game state transitions
// - unavailable powers
// - invalid entanglement selections
//
// It DOES NOT make client-side scores authoritative.
//
// A modified APK can always alter JavaScript.
// Competitive scores must eventually be calculated or
// validated by a protected backend/RPC.
//
// =========================================================

const TAB = Object.freeze({
  PLAY: "play",
  CODE: "code",
  CONCEPTS: "concepts",
});

const MAX_LEVEL = 10;

/*
 * Prevent absurd client state growth if some future code
 * accidentally increments these values indefinitely.
 */
const MAX_SAFE_STAT = 100000;

function boundedStat(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(
      MAX_SAFE_STAT,
      Math.floor(number)
    )
  );
}

function safeLevelId(value) {
  const id = Number(value);

  if (
    !Number.isInteger(id) ||
    id < 1 ||
    id > Math.min(
      MAX_LEVEL,
      getQuantumLevelCount()
    )
  ) {
    return null;
  }

  return id;
}

function getDirectionFromAdjacentCell(
  state,
  row,
  col
) {
  if (
    !state ||
    state.mode !==
      QUANTUM_MODE.CLASSICAL ||
    !state.player
  ) {
    return null;
  }

  const dr =
    row - state.player.row;

  const dc =
    col - state.player.col;

  if (dr === -1 && dc === 0) {
    return DIRECTIONS.UP;
  }

  if (dr === 1 && dc === 0) {
    return DIRECTIONS.DOWN;
  }

  if (dr === 0 && dc === -1) {
    return DIRECTIONS.LEFT;
  }

  if (dr === 0 && dc === 1) {
    return DIRECTIONS.RIGHT;
  }

  return null;
}

export default function QuantumLogicGame({
  gameInfo,
  user,
  pauseMusic,
  toggleMute,
  isMuted,
  soundEnabled = true,
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // =======================================================
  // Navigation / UI
  // =======================================================

  const [activeTab, setActiveTab] =
    useState(TAB.PLAY);

  const [showTour, setShowTour] =
    useState(false);

  const [tourStep, setTourStep] =
    useState(0);

  const [showGuide, setShowGuide] =
    useState(false);

  const [guideMode, setGuideMode] =
    useState("glossary");

  const [introReady, setIntroReady] =
    useState(false);

  // =======================================================
  // Game progress
  // =======================================================

  const [levelId, setLevelId] =
    useState(1);

  const level = useMemo(
    () => getQuantumLevel(levelId),
    [levelId]
  );

  const [gameState, setGameState] =
    useState(() => {
      const firstLevel =
        getQuantumLevel(1);

      return firstLevel
        ? createInitialQuantumState(
            firstLevel
          )
        : null;
    });

  const [completedLevels, setCompletedLevels] =
    useState([]);

  const [levelCompleteVisible, setLevelCompleteVisible] =
    useState(false);

  const [gameFinished, setGameFinished] =
    useState(false);

  // =======================================================
  // Aggregated educational statistics
  //
  // These are NOT trusted leaderboard values.
  // =======================================================

  const [totalStats, setTotalStats] =
    useState({
      moves: 0,
      superpositions: 0,
      measurements: 0,
      entanglements: 0,
    });

  // =======================================================
  // Input protection
  // =======================================================

  const actionLockRef =
    useRef(false);

  const finishStartedRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // =======================================================
  // Reset / initialize level
  // =======================================================

  const initializeLevel =
    useCallback((requestedLevelId) => {
      const validId =
        safeLevelId(
          requestedLevelId
        );

      if (!validId) {
        return false;
      }

      const nextLevel =
        getQuantumLevel(validId);

      if (!nextLevel) {
        return false;
      }

      const initialState =
        createInitialQuantumState(
          nextLevel
        );

      if (!initialState) {
        console.error(
          "[QuantumLogic] Invalid level configuration:",
          validId
        );

        return false;
      }

      actionLockRef.current = false;

      setLevelId(validId);
      setGameState(initialState);
      setLevelCompleteVisible(false);

      return true;
    }, []);

  // =======================================================
  // First-time experience
  // =======================================================

  const startGame =
    useCallback(() => {
      setShowGuide(false);
      setShowTour(false);
      setIntroReady(true);
      setActiveTab(TAB.PLAY);
    }, []);

  useEffect(() => {
    let mounted = true;

    async function prepareIntro() {
      /*
       * If authentication/game metadata is unavailable,
       * do not permanently persist onboarding state.
       */
      if (!user?.id || !gameInfo?.id) {
        if (mounted) {
          startGame();
        }

        return;
      }

      try {
        const key =
          `howto_seen_${user.id}_${gameInfo.id}`;

        const seen =
          await AsyncStorage.getItem(
            key
          );

        if (!mounted) {
          return;
        }

        if (seen === "true") {
          startGame();
          return;
        }

        setIntroReady(false);
        setTourStep(0);
        setShowTour(true);
      } catch (error) {
        console.error(
          "[QuantumLogic intro]",
          error?.message
        );

        /*
         * Onboarding storage failure should not prevent
         * the user from playing.
         */
        if (mounted) {
          startGame();
        }
      }
    }

    prepareIntro();

    return () => {
      mounted = false;
    };
  }, [
    gameInfo?.id,
    startGame,
    user?.id,
  ]);

  const handleTourNext =
    useCallback(async () => {
      const steps =
        TOUR_STEPS[
          "Quantum Logic"
        ] ?? [];

      const nextStep =
        tourStep + 1;

      if (nextStep < steps.length) {
        setTourStep(nextStep);
        return;
      }

      try {
        if (
          user?.id &&
          gameInfo?.id
        ) {
          const key =
            `howto_seen_${user.id}_${gameInfo.id}`;

          await AsyncStorage.setItem(
            key,
            "true"
          );
        }
      } catch (error) {
        console.error(
          "[QuantumLogic tour]",
          error?.message
        );
      }

      setShowTour(false);

      /*
       * First visit:
       * Tour -> Guide -> Game
       */
      setGuideMode("glossary");
      setShowGuide(true);
    }, [
      gameInfo?.id,
      tourStep,
      user?.id,
    ]);

  const handleTourSkip =
    useCallback(async () => {
      try {
        if (
          user?.id &&
          gameInfo?.id
        ) {
          const key =
            `howto_seen_${user.id}_${gameInfo.id}`;

          await AsyncStorage.setItem(
            key,
            "true"
          );
        }
      } catch (error) {
        console.error(
          "[QuantumLogic skip]",
          error?.message
        );
      }

      startGame();
    }, [
      gameInfo?.id,
      startGame,
      user?.id,
    ]);

  // =======================================================
  // Central state-update wrapper
  //
  // All game actions pass through this function.
  // UI components never directly invent game state.
  // =======================================================

  const safelyApplyAction =
    useCallback(
      (action) => {
        if (
          actionLockRef.current ||
          gameFinished ||
          levelCompleteVisible ||
          !introReady ||
          !level ||
          typeof action !==
            "function"
        ) {
          return;
        }

        actionLockRef.current = true;

        setGameState(
          (previousState) => {
            if (!previousState) {
              return previousState;
            }

            try {
              const nextState =
                action(
                  previousState,
                  level
                );

              if (
                !nextState ||
                typeof nextState !==
                  "object"
              ) {
                return previousState;
              }

              return nextState;
            } catch (error) {
              console.error(
                "[QuantumLogic action]",
                error?.message
              );

              return previousState;
            } finally {
              /*
               * Release after this event-loop turn.
               * Prevents accidental double taps without
               * making controls feel sluggish.
               */
              setTimeout(() => {
                actionLockRef.current =
                  false;
              }, 80);
            }
          }
        );
      },
      [
        gameFinished,
        introReady,
        level,
        levelCompleteVisible,
      ]
    );

  // =======================================================
  // Movement
  // =======================================================

  const handleMove =
    useCallback(
      (direction) => {
        safelyApplyAction(
          (state, currentLevel) =>
            moveQuantumPlayer(
              state,
              currentLevel,
              direction
            )
        );
      },
      [safelyApplyAction]
    );

  // =======================================================
  // Superposition
  // =======================================================

  const handleSuperpose =
    useCallback(() => {
      safelyApplyAction(
        (state, currentLevel) =>
          applySuperposition(
            state,
            currentLevel
          )
      );
    }, [safelyApplyAction]);

  // =======================================================
  // Measurement
  // =======================================================

  const handleMeasure =
    useCallback(() => {
      safelyApplyAction(
        (state, currentLevel) =>
          measureQuantumState(
            state,
            currentLevel
          )
      );
    }, [safelyApplyAction]);

  // =======================================================
  // Entanglement
  // =======================================================

  const handleBeginEntangle =
    useCallback(() => {
      safelyApplyAction(
        (state, currentLevel) =>
          beginEntanglementSelection(
            state,
            currentLevel
          )
      );
    }, [safelyApplyAction]);

  const handleCancelEntangle =
    useCallback(() => {
      safelyApplyAction(
        (state) =>
          cancelEntanglementSelection(
            state
          )
      );
    }, [safelyApplyAction]);

  // =======================================================
  // Grid tapping
  // =======================================================

  const handleCellPress =
    useCallback(
      (row, col) => {
        /*
         * Never trust coordinates coming from UI.
         */
        if (
          !isValidCoordinate(
            row,
            col
          )
        ) {
          return;
        }

        /*
         * Entanglement mode:
         * grid taps select pair cells.
         */
        if (
          gameState?.mode ===
          QUANTUM_MODE.ENTANGLE_SELECT
        ) {
          safelyApplyAction(
            (state, currentLevel) =>
              selectEntanglementCell(
                state,
                currentLevel,
                row,
                col
              )
          );

          return;
        }

        /*
         * Classical convenience:
         * tapping one adjacent cell performs the
         * equivalent movement action.
         *
         * Arbitrary teleport-by-tap is forbidden.
         */
        const direction =
          getDirectionFromAdjacentCell(
            gameState,
            row,
            col
          );

        if (direction) {
          handleMove(direction);
        }
      },
      [
        gameState,
        handleMove,
        safelyApplyAction,
      ]
    );

  // =======================================================
  // Reset
  // =======================================================

  const handleReset =
    useCallback(() => {
      if (!level) {
        return;
      }

      const fresh =
        createInitialQuantumState(
          level
        );

      if (!fresh) {
        return;
      }

      actionLockRef.current = false;
      setGameState(fresh);
    }, [level]);

  // =======================================================
  // Web keyboard support
  //
  // Expo mobile still uses D-pad controls.
  // Expo Web additionally supports arrow keys.
  // =======================================================

  useEffect(() => {
    if (
      Platform.OS !== "web" ||
      typeof window ===
        "undefined"
    ) {
      return;
    }

    const handleKeyDown =
      (event) => {
        if (
          activeTab !== TAB.PLAY ||
          !introReady ||
          showGuide ||
          showTour ||
          gameFinished ||
          levelCompleteVisible
        ) {
          return;
        }

        const directionMap = {
          ArrowUp:
            DIRECTIONS.UP,

          ArrowDown:
            DIRECTIONS.DOWN,

          ArrowLeft:
            DIRECTIONS.LEFT,

          ArrowRight:
            DIRECTIONS.RIGHT,
        };

        const direction =
          directionMap[
            event.key
          ];

        if (!direction) {
          return;
        }

        event.preventDefault();

        handleMove(direction);
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    activeTab,
    gameFinished,
    handleMove,
    introReady,
    levelCompleteVisible,
    showGuide,
    showTour,
  ]);

  // =======================================================
  // Detect level completion
  // =======================================================

  useEffect(() => {
    if (
      !gameState?.completed ||
      levelCompleteVisible ||
      gameFinished
    ) {
      return;
    }

    setCompletedLevels(
      (previous) => {
        if (
          previous.includes(
            levelId
          )
        ) {
          return previous;
        }

        return [
          ...previous,
          levelId,
        ];
      }
    );

    setTotalStats(
      (previous) => ({
        moves:
          boundedStat(
            previous.moves +
              boundedStat(
                gameState.moves
              )
          ),

        superpositions:
          boundedStat(
            previous.superpositions +
              boundedStat(
                gameState
                  .superpositionsUsed
              )
          ),

        measurements:
          boundedStat(
            previous.measurements +
              boundedStat(
                gameState
                  .measurementsUsed
              )
          ),

        entanglements:
          boundedStat(
            previous.entanglements +
              boundedStat(
                gameState
                  .entanglementsCreated
              )
          ),
      })
    );

    setLevelCompleteVisible(true);
  }, [
    gameFinished,
    gameState,
    levelCompleteVisible,
    levelId,
  ]);

  // =======================================================
  // Finish full game
  // =======================================================

  const finishGame =
    useCallback(() => {
      if (
        finishStartedRef.current
      ) {
        return;
      }

      finishStartedRef.current = true;

      try {
        pauseMusic?.();
      } catch {}

      setGameFinished(true);

      /*
       * IMPORTANT:
       *
       * We intentionally DO NOT submit a competitive score
       * here yet.
       *
       * Your supervisor has not provided the official
       * Quantum Logic scoring formula.
       *
       * Inventing a client-side scoring formula now would
       * create both product and security problems.
       *
       * Once scoring is defined, we should use a protected
       * Supabase RPC that validates the session and computes
       * the final score server-side.
       */
    }, [pauseMusic]);

  const handleNextLevel =
    useCallback(() => {
      if (
        !levelCompleteVisible
      ) {
        return;
      }

      if (
        levelId >=
        getQuantumLevelCount()
      ) {
        setLevelCompleteVisible(
          false
        );

        finishGame();
        return;
      }

      initializeLevel(
        levelId + 1
      );
    }, [
      finishGame,
      initializeLevel,
      levelCompleteVisible,
      levelId,
    ]);

  // =======================================================
  // Quit
  // =======================================================

  const handleQuit =
    useCallback(() => {
      try {
        pauseMusic?.();
      } catch {}

      router.back();
    }, [
      pauseMusic,
      router,
    ]);

  // =======================================================
  // Validate configuration
  // =======================================================

  if (
    QUANTUM_LEVELS.length === 0 ||
    !level ||
    !gameState
  ) {
    return (
      <View
        style={[
          styles.screen,
          styles.center,
        ]}
      >
        <Text style={styles.errorIcon}>
          ⚠️
        </Text>

        <Text style={styles.errorTitle}>
          Quantum Logic configuration error
        </Text>

        <Text style={styles.errorText}>
          The game could not safely initialize its level data.
        </Text>

        <TouchableOpacity
          style={styles.errorButton}
          onPress={handleQuit}
        >
          <Text
            style={
              styles.errorButtonText
            }
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // =======================================================
  // Render
  // =======================================================

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop:
              insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.quitButton}
          onPress={handleQuit}
          activeOpacity={0.8}
        >
          <Text style={styles.quitText}>
            ✕
          </Text>
        </TouchableOpacity>

        <View style={styles.titleArea}>
          <Text style={styles.gameTitle}>
            {gameInfo?.icon ?? "⚛️"} Quantum Logic
          </Text>

          <Text style={styles.levelText}>
            Level {levelId} /{" "}
            {getQuantumLevelCount()}
          </Text>
        </View>

      <View style={styles.topActions}>
  <TouchableOpacity
    style={styles.topIconButton}
    onPress={toggleMute}
    activeOpacity={0.8}
    accessibilityRole="button"
    accessibilityLabel={
      isMuted ? "Unmute music" : "Mute music"
    }
  >
    <Text style={styles.topIconText}>
      {!soundEnabled || isMuted ? "🔇" : "🔊"}
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.topIconButton}
    onPress={() => {
      setGuideMode("glossary");
      setShowGuide(true);
    }}
  >
    <Text style={styles.topIconText}>📖</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.topIconButton}
    onPress={() => {
      setGuideMode("help");
      setShowGuide(true);
    }}
  >
    <Text style={styles.topIconText}>?</Text>
  </TouchableOpacity>
</View>
      </View>

      {/* Main tabs */}
      <View style={styles.tabs}>
        <TabButton
          label="▶ PLAY"
          active={
            activeTab ===
            TAB.PLAY
          }
          onPress={() =>
            setActiveTab(
              TAB.PLAY
            )
          }
        />

        <TabButton
          label="{ } CODE"
          active={
            activeTab ===
            TAB.CODE
          }
          onPress={() =>
            setActiveTab(
              TAB.CODE
            )
          }
        />

        <TabButton
          label="⚛ CONCEPTS"
          active={
            activeTab ===
            TAB.CONCEPTS
          }
          onPress={() =>
            setActiveTab(
              TAB.CONCEPTS
            )
          }
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              insets.bottom + 32,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
       {activeTab === TAB.PLAY && (
  <>
    <View style={styles.playStatusBar}>
      <View style={styles.playStatusItem}>
        <Text style={styles.playStatusLabel}>STATE</Text>
        <Text style={styles.playStatusValue}>
          {gameState.mode === QUANTUM_MODE.SUPERPOSED
            ? "⚛ SUPERPOSED"
            : gameState.mode === QUANTUM_MODE.ENTANGLE_SELECT
              ? "🔗 SELECTING"
              : "● CLASSICAL"}
        </Text>
      </View>

      <View style={styles.playStatusDivider} />

      <View style={styles.playStatusItem}>
        <Text style={styles.playStatusLabel}>MOVES</Text>
        <Text style={styles.playStatusValue}>
          {gameState.moves ?? 0}
        </Text>
      </View>

      <View style={styles.playStatusDivider} />

      <View style={styles.playStatusItem}>
        <Text style={styles.playStatusLabel}>LEVEL</Text>
        <Text style={styles.playStatusValue}>
          {levelId}/{getQuantumLevelCount()}
        </Text>
      </View>
    </View>

    <QuantumGrid
      level={level}
      gameState={gameState}
      onCellPress={handleCellPress}
      disabled={
        gameFinished ||
        levelCompleteVisible
      }
    />

    <QuantumControls
      gameState={gameState}
      level={level}
      onSuperpose={handleSuperpose}
      onMeasure={handleMeasure}
      onBeginEntangle={handleBeginEntangle}
      onCancelEntangle={handleCancelEntangle}
      onReset={handleReset}
      disabled={
        gameFinished ||
        levelCompleteVisible
      }
    />
  </>
)}

      {activeTab === TAB.CODE && (
  <QuantumCodeWalkthrough />
)}

{activeTab === TAB.CONCEPTS && (
  <QuantumConcepts />
)}
      </ScrollView>

      {/* Fixed movement D-pad — intentionally outside ScrollView */}
{activeTab === TAB.PLAY &&
  introReady &&
  !showTour &&
  !showGuide &&
  !gameFinished &&
  !levelCompleteVisible && (
    <QuantumDPad
      gameState={gameState}
      onMove={handleMove}
      disabled={false}
    />
  )}

      {/* Level completed overlay */}
      {levelCompleteVisible && (
        <View
          style={
            styles.completionOverlay
          }
        >
          <View
            style={
              styles.completionCard
            }
          >
            <Text
              style={
                styles.completionIcon
              }
            >
              ⚛️
            </Text>

            <Text
              style={
                styles.completionEyebrow
              }
            >
              QUANTUM STATE RESOLVED
            </Text>

            <Text
              style={
                styles.completionTitle
              }
            >
              Level {levelId} Complete!
            </Text>

            <Text
              style={
                styles.completionDescription
              }
            >
              {levelId >=
              getQuantumLevelCount()
                ? "You reached the Quantum Core and completed all ten levels."
                : "You reached the goal. The next quantum challenge is ready."}
            </Text>

            <View
              style={
                styles.completionStats
              }
            >
              <Stat
                label="Moves"
                value={
                  gameState.moves
                }
              />

              <Stat
                label="Superpose"
                value={
                  gameState
                    .superpositionsUsed
                }
              />

              <Stat
                label="Measure"
                value={
                  gameState
                    .measurementsUsed
                }
              />
            </View>

            <TouchableOpacity
              style={
                styles.nextLevelButton
              }
              onPress={
                handleNextLevel
              }
              activeOpacity={0.85}
            >
              <Text
                style={
                  styles.nextLevelText
                }
              >
                {levelId >=
                getQuantumLevelCount()
                  ? "Complete Quantum Logic 🏆"
                  : `Continue to Level ${
                      levelId + 1
                    } →`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Full game completion */}
      {gameFinished && (
        <View
          style={
            styles.completionOverlay
          }
        >
          <View
            style={
              styles.completionCard
            }
          >
            <Text
              style={
                styles.finalIcon
              }
            >
              🏆
            </Text>

            <Text
              style={
                styles.completionEyebrow
              }
            >
              QUANTUM LOGIC COMPLETE
            </Text>

            <Text
              style={
                styles.completionTitle
              }
            >
              Quantum Core Reached
            </Text>

            <Text
              style={
                styles.completionDescription
              }
            >
              You completed all ten quantum puzzles.
            </Text>

            <View
              style={
                styles.finalStats
              }
            >
              <Stat
                label="Levels"
                value={
                  completedLevels.length
                }
              />

              <Stat
                label="Moves"
                value={
                  totalStats.moves
                }
              />

              <Stat
                label="Quantum Actions"
                value={
                  totalStats.superpositions +
                  totalStats.measurements +
                  totalStats.entanglements
                }
              />
            </View>

            <TouchableOpacity
              style={
                styles.nextLevelButton
              }
              onPress={() =>
                router.back()
              }
              activeOpacity={0.85}
            >
              <Text
                style={
                  styles.nextLevelText
                }
              >
                Return to Games
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Guide */}
      <GameGuideModal
        visible={showGuide}
        title="Quantum Logic Guide"
        glossary={
          GLOSSARY[
            "Quantum Logic"
          ] ?? []
        }
        tips={
          HELP_TIPS
            .quantumLogic ??
          []
        }
        mode={guideMode}
        onClose={() => {
          if (!introReady) {
            startGame();
          } else {
            setShowGuide(false);
          }
        }}
      />

      {/* First-time tour */}
      {showTour && (
        <TourOverlay
          steps={
            TOUR_STEPS[
              "Quantum Logic"
            ] ?? []
          }
          currentStep={
            tourStep
          }
          onNext={
            handleTourNext
          }
          onSkip={
            handleTourSkip
          }
        />
      )}
    </View>
  );
}

// =========================================================
// SMALL LOCAL PRESENTATION COMPONENTS
// =========================================================

function TabButton({
  label,
  active,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.tab,
        active &&
          styles.tabActive,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.tabText,
          active &&
            styles.tabTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Stat({
  label,
  value,
}) {
  return (
    <View style={styles.stat}>
      <Text
        style={styles.statValue}
      >
        {boundedStat(value)}
      </Text>

      <Text
        style={styles.statLabel}
      >
        {label}
      </Text>
    </View>
  );
}


// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  playStatusBar: {
  flexDirection: "row",
  alignItems: "center",

  backgroundColor: COLORS.bgCard,

  borderRadius: 14,

  borderWidth: 1,
  borderColor: COLORS.border,

  paddingVertical: 9,
  paddingHorizontal: 10,
},

playStatusItem: {
  flex: 1,
  alignItems: "center",
},

playStatusDivider: {
  width: 1,
  height: 26,
  backgroundColor: COLORS.border,
},

playStatusLabel: {
  color: COLORS.textMuted,

  fontSize: 7,
  fontWeight: "900",
  letterSpacing: 0.7,
},

playStatusValue: {
  color: COLORS.textPrimary,

  fontSize: 10,
  fontWeight: "900",

  marginTop: 3,
},
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
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  quitButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },

  quitText: {
    color: "#fca5a5",
    fontSize: 15,
    fontWeight: "900",
  },

  titleArea: {
    flex: 1,
    alignItems: "center",
  },

  gameTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  levelText: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },

  topActions: {
    flexDirection: "row",
    gap: 6,
  },

  topIconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  topIconText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },

  tabs: {
    flexDirection: "row",
    padding: 8,
    gap: 6,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },

  tabActive: {
    backgroundColor: "rgba(168,85,247,0.14)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.35)",
  },

  tabText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "900",
  },

  tabTextActive: {
    color: "#d8b4fe",
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 14,
    gap: 14,
  },

  completionOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    zIndex: 800,

    alignItems: "center",
    justifyContent: "center",

    padding: 20,

    backgroundColor: "rgba(0,0,0,0.88)",
  },

  completionCard: {
    width: "100%",
    maxWidth: 420,

    backgroundColor: COLORS.bgCard,

    borderRadius: 24,

    padding: 22,

    alignItems: "center",

    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.35)",
  },

  completionIcon: {
    fontSize: 42,
    marginBottom: 10,
  },

  finalIcon: {
    fontSize: 48,
    marginBottom: 10,
  },

  completionEyebrow: {
    color: "#c084fc",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  completionTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 5,
    textAlign: "center",
  },

  completionDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    textAlign: "center",
  },

  completionStats: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },

  finalStats: {
    width: "100%",
    flexDirection: "row",
    gap: 8,
    marginTop: 18,
  },

  stat: {
    flex: 1,
    alignItems: "center",

    padding: 10,

    borderRadius: 12,

    backgroundColor: COLORS.bgCardLight,

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },

  statLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    marginTop: 3,
    fontWeight: "700",
  },

  nextLevelButton: {
    width: "100%",
    marginTop: 18,

    backgroundColor: "#7c3aed",

    borderRadius: 14,

    paddingVertical: 15,

    alignItems: "center",
  },

  nextLevelText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },

  

  errorIcon: {
    fontSize: 45,
    marginBottom: 12,
  },

  errorTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  errorText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 17,
  },

  errorButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  errorButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
});