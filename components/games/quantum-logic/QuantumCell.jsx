import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from "react-native";

import { COLORS } from "../../../constants/colors";
import {
  coordinateKey,
  getStateProbabilityPercent,
} from "../../../lib/quantumLogicEngine";

export default function QuantumCell({
  row,
  col,
  level,
  gameState,
  onPress,
  disabled = false,
}) {
  const key = coordinateKey(row, col);

  if (!key || !level || !gameState) {
    return <View style={styles.cell} />;
  }

  const isStart =
    level.start?.[0] === row &&
    level.start?.[1] === col;

  const isGoal =
    level.goal?.[0] === row &&
    level.goal?.[1] === col;

  const isWall = Array.isArray(level.walls)
    && level.walls.some(
      ([r, c]) => r === row && c === col
    );

  const isQuantumBarrier =
    Array.isArray(level.quantumBarriers)
    && level.quantumBarriers.some(
      ([r, c]) => r === row && c === col
    );

  const isPlayer =
    gameState.mode === "classical" &&
    gameState.player?.row === row &&
    gameState.player?.col === col;

  const superpositionBranch =
    Array.isArray(gameState.superposition)
      ? gameState.superposition.find(
          (branch) =>
            branch?.row === row &&
            branch?.col === col
        )
      : null;

  const isSuperposed =
    Boolean(superpositionBranch);

  const entangledTarget =
    gameState.entanglements?.[key];

  const isEntangled =
    typeof entangledTarget === "string";

  const isSelectedForEntanglement =
    gameState.entangleSelection === key;

  const probability =
    isSuperposed
      ? getStateProbabilityPercent(
          superpositionBranch.probability
        )
      : 0;

  const handlePress = () => {
    if (
      disabled ||
      isWall ||
      typeof onPress !== "function"
    ) {
      return;
    }

    onPress(row, col);
  };

  return (
    <TouchableOpacity
      style={[
        styles.cell,

        isWall && styles.wall,

        isQuantumBarrier &&
          styles.quantumBarrier,

        isGoal && styles.goal,

        isEntangled &&
          styles.entangled,

        isSelectedForEntanglement &&
          styles.entangleSelected,

        isSuperposed &&
          styles.superposed,

        isPlayer &&
          styles.playerCell,
      ]}
      onPress={handlePress}
      disabled={disabled || isWall}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Grid cell ${
        row + 1
      }, ${col + 1}`}
    >
      {isWall ? (
        <Text style={styles.wallText}>
          ▓
        </Text>
      ) : isPlayer ? (
        <View style={styles.player}>
          <Text style={styles.playerIcon}>
            ●
          </Text>
        </View>
      ) : isSuperposed ? (
        <View style={styles.superposition}>
          <Text style={styles.superpositionIcon}>
            ◉
          </Text>

          <Text style={styles.probability}>
            {probability}%
          </Text>
        </View>
      ) : isGoal ? (
        <Text style={styles.goalIcon}>
          🏁
        </Text>
      ) : isQuantumBarrier ? (
        <View style={styles.barrierContent}>
          <Text style={styles.barrierIcon}>
            ⚛
          </Text>

          <Text style={styles.barrierLabel}>
            Q
          </Text>
        </View>
      ) : isEntangled ? (
        <Text style={styles.entangledIcon}>
          🔗
        </Text>
      ) : isStart ? (
        <View style={styles.startDot} />
      ) : null}

      {isSelectedForEntanglement && (
        <View style={styles.selectionBadge}>
          <Text style={styles.selectionText}>
            1
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    aspectRatio: 1,
    minWidth: 0,

    margin: 2,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.bgCardLight,

    borderWidth: 1,
    borderColor: COLORS.border,

    overflow: "hidden",
  },

  wall: {
    backgroundColor: "rgba(255,255,255,0.035)",
    borderColor: "rgba(255,255,255,0.08)",
  },

  wallText: {
    color: COLORS.textMuted,
    fontSize: 24,
    opacity: 0.45,
  },

  quantumBarrier: {
    backgroundColor: "rgba(168,85,247,0.09)",
    borderColor: "rgba(168,85,247,0.4)",
    borderStyle: "dashed",
  },

  barrierContent: {
    alignItems: "center",
  },

  barrierIcon: {
    fontSize: 18,
  },

  barrierLabel: {
    color: "#c084fc",
    fontSize: 7,
    fontWeight: "900",
    marginTop: 1,
  },

  goal: {
    backgroundColor: "rgba(34,197,94,0.11)",
    borderColor: "rgba(34,197,94,0.5)",
  },

  goalIcon: {
    fontSize: 20,
  },

  playerCell: {
    backgroundColor: "rgba(59,130,246,0.18)",
    borderColor: "#3b82f6",
    borderWidth: 2,
  },

  player: {
    width: "52%",
    aspectRatio: 1,

    borderRadius: 999,

    backgroundColor: "#3b82f6",

    alignItems: "center",
    justifyContent: "center",
  },

  playerIcon: {
    color: "#fff",
    fontSize: 12,
  },

  superposed: {
    backgroundColor: "rgba(168,85,247,0.17)",
    borderColor: "#a855f7",
    borderWidth: 2,
  },

  superposition: {
    alignItems: "center",
    justifyContent: "center",
  },

  superpositionIcon: {
    color: "#c084fc",
    fontSize: 20,
  },

  probability: {
    color: "#e9d5ff",
    fontSize: 8,
    fontWeight: "900",
    marginTop: 1,
  },

  entangled: {
    borderColor: "rgba(34,211,238,0.65)",
    backgroundColor: "rgba(34,211,238,0.08)",
  },

  entangledIcon: {
    fontSize: 17,
  },

  entangleSelected: {
    borderColor: "#f59e0b",
    borderWidth: 2,
    backgroundColor: "rgba(245,158,11,0.12)",
  },

  selectionBadge: {
    position: "absolute",
    top: 4,
    right: 4,

    width: 16,
    height: 16,

    borderRadius: 8,

    backgroundColor: "#f59e0b",

    alignItems: "center",
    justifyContent: "center",
  },

  selectionText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "900",
  },

  startDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: COLORS.textMuted,
  },
});