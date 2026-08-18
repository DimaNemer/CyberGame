import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import { COLORS } from "../../../constants/colors";

import {
  QUANTUM_MODE,
} from "../../../lib/quantumLogicEngine";

function getModeInfo(mode) {
  switch (mode) {
    case QUANTUM_MODE.SUPERPOSED:
      return {
        icon: "⚛",
        label: "SUPERPOSED",
        color: "#c084fc",
        bg: "rgba(168,85,247,0.1)",
      };

    case QUANTUM_MODE.ENTANGLE_SELECT:
      return {
        icon: "🔗",
        label: "SELECTING PAIR",
        color: "#22d3ee",
        bg: "rgba(34,211,238,0.1)",
      };

    default:
      return {
        icon: "●",
        label: "CLASSICAL",
        color: "#60a5fa",
        bg: "rgba(59,130,246,0.1)",
      };
  }
}

export default function QuantumStatePanel({
  gameState,
  level,
  levelNumber,
  totalLevels,
}) {
  if (!gameState || !level) {
    return null;
  }

  const modeInfo =
    getModeInfo(gameState.mode);

  const pairCount =
    Math.floor(
      Object.keys(
        gameState.entanglements ?? {}
      ).length / 2
    );

  const positionText =
    gameState.mode === QUANTUM_MODE.SUPERPOSED
      ? `${gameState.superposition?.length ?? 0} possible cells`
      : `${gameState.player?.row ?? 0},${gameState.player?.col ?? 0}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            QUANTUM STATE
          </Text>

          <Text style={styles.title}>
            Live System State
          </Text>
        </View>

        <View
          style={[
            styles.modeBadge,
            { backgroundColor: modeInfo.bg },
          ]}
        >
          <Text style={styles.modeIcon}>
            {modeInfo.icon}
          </Text>

          <Text
            style={[
              styles.modeText,
              { color: modeInfo.color },
            ]}
          >
            {modeInfo.label}
          </Text>
        </View>
      </View>

      <View style={styles.levelProgress}>
        <View>
          <Text style={styles.metricLabel}>
            LEVEL
          </Text>

          <Text style={styles.metricStrong}>
            {levelNumber}/{totalLevels}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${
                  Math.max(
                    0,
                    Math.min(
                      100,
                      (levelNumber / totalLevels) *
                        100
                    )
                  )
                }%`,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>
            📍
          </Text>

          <Text style={styles.metricLabel}>
            POSITION
          </Text>

          <Text style={styles.metricValue}>
            {positionText}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>
            👣
          </Text>

          <Text style={styles.metricLabel}>
            MOVES
          </Text>

          <Text style={styles.metricValue}>
            {gameState.moves ?? 0}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>
            ⚡
          </Text>

          <Text style={styles.metricLabel}>
            SUPERPOSE
          </Text>

          <Text style={styles.metricValue}>
            {gameState.superpositionsUsed ?? 0}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>
            📡
          </Text>

          <Text style={styles.metricLabel}>
            MEASURE
          </Text>

          <Text style={styles.metricValue}>
            {gameState.measurementsUsed ?? 0}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>
            🔗
          </Text>

          <Text style={styles.metricLabel}>
            PAIRS
          </Text>

          <Text style={styles.metricValue}>
            {pairCount}
          </Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricIcon}>
            🧬
          </Text>

          <Text style={styles.metricLabel}>
            CREATED
          </Text>

          <Text style={styles.metricValue}>
            {gameState.entanglementsCreated ?? 0}
          </Text>
        </View>
      </View>

      {gameState.mode ===
        QUANTUM_MODE.SUPERPOSED && (
        <View style={styles.superpositionInfo}>
          <Text style={styles.superpositionTitle}>
            ⚛ Current Superposition
          </Text>

          {(gameState.superposition ?? []).map(
            (branch, index) => {
              const probability =
                Number(branch?.probability);

              const percent =
                Number.isFinite(probability)
                  ? Math.round(
                      Math.max(
                        0,
                        Math.min(
                          1,
                          probability
                        )
                      ) * 100
                    )
                  : 0;

              return (
                <View
                  key={`${branch?.row}-${branch?.col}-${index}`}
                  style={styles.branchRow}
                >
                  <Text style={styles.branchPosition}>
                    |{branch?.row ?? 0},
                    {branch?.col ?? 0}⟩
                  </Text>

                  <View style={styles.branchTrack}>
                    <View
                      style={[
                        styles.branchFill,
                        {
                          width: `${percent}%`,
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.branchPercent}>
                    {percent}%
                  </Text>
                </View>
              );
            }
          )}
        </View>
      )}

      <View style={styles.conceptBox}>
        <Text style={styles.conceptLabel}>
          CORE IDEA
        </Text>

        <Text style={styles.conceptText}>
          {gameState.mode ===
          QUANTUM_MODE.SUPERPOSED
            ? "The player exists across multiple possible positions until measurement collapses the state."
            : gameState.mode ===
                QUANTUM_MODE.ENTANGLE_SELECT
              ? "Two selected cells will become linked. Entering either one moves the player to its pair."
              : "The player currently has one definite classical position."}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.22)",
    padding: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  eyebrow: {
    color: "#c084fc",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },

  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 99,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  modeIcon: {
    fontSize: 11,
  },

  modeText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  levelProgress: {
    marginBottom: 12,
  },

  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  metricStrong: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 2,
  },

  progressTrack: {
    height: 5,
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 7,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#a855f7",
    borderRadius: 99,
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  metricCard: {
    width: "31%",
    minWidth: 90,
    flexGrow: 1,
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
  },

  metricIcon: {
    fontSize: 15,
    marginBottom: 5,
  },

  metricValue: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 3,
  },

  superpositionInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(168,85,247,0.07)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.2)",
    gap: 8,
  },

  superpositionTitle: {
    color: "#d8b4fe",
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 2,
  },

  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  branchPosition: {
    width: 48,
    color: COLORS.textSecondary,
    fontSize: 9,
    fontFamily: "monospace",
  },

  branchTrack: {
    flex: 1,
    height: 5,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: COLORS.bgCardLight,
  },

  branchFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: "#a855f7",
  },

  branchPercent: {
    width: 34,
    textAlign: "right",
    color: "#d8b4fe",
    fontSize: 9,
    fontWeight: "800",
  },

  conceptBox: {
    marginTop: 12,
    padding: 11,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.06)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.16)",
  },

  conceptLabel: {
    color: "#60a5fa",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
    marginBottom: 4,
  },

  conceptText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },
});