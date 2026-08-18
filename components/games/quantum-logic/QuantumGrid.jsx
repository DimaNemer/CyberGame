import {
  View,
  Text,
  StyleSheet,
} from "react-native";

import { COLORS } from "../../../constants/colors";

import {
  QUANTUM_GRID_SIZE,
} from "../../../lib/quantumLogicLevels";

import QuantumCell from "./QuantumCell";

export default function QuantumGrid({
  level,
  gameState,
  onCellPress,
  disabled = false,
}) {
  if (!level || !gameState) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>
          Unable to load quantum grid.
        </Text>
      </View>
    );
  }

  const rows = Array.from(
    { length: QUANTUM_GRID_SIZE },
    (_, row) => row
  );

  const columns = Array.from(
    { length: QUANTUM_GRID_SIZE },
    (_, col) => col
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.levelLabel}>
            LEVEL {level.id}
          </Text>

          <Text style={styles.levelName}>
            {level.name}
          </Text>
        </View>

        <View style={styles.gridBadge}>
          <Text style={styles.gridBadgeText}>
            5 × 5
          </Text>
        </View>
      </View>

      <Text style={styles.description}>
        {level.description}
      </Text>

      <View style={styles.objectiveBox}>
        <Text style={styles.objectiveLabel}>
          🎯 OBJECTIVE
        </Text>

        <Text style={styles.objectiveText}>
          {level.objective}
        </Text>
      </View>

      <View style={styles.grid}>
        {rows.map((row) => (
          <View
            key={`row-${row}`}
            style={styles.row}
          >
            {columns.map((col) => (
              <QuantumCell
                key={`${row}-${col}`}
                row={row}
                col={col}
                level={level}
                gameState={gameState}
                onPress={onCellPress}
                disabled={disabled}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              styles.playerLegend,
            ]}
          />
          <Text style={styles.legendText}>
            Player
          </Text>
        </View>

        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>
            ▓
          </Text>
          <Text style={styles.legendText}>
            Wall
          </Text>
        </View>

        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>
            ⚛
          </Text>
          <Text style={styles.legendText}>
            Quantum
          </Text>
        </View>

        <View style={styles.legendItem}>
          <Text style={styles.legendIcon}>
            🏁
          </Text>
          <Text style={styles.legendText}>
            Goal
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgCard,

    borderRadius: 20,

    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.28)",

    padding: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 7,
  },

  levelLabel: {
    color: "#a855f7",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.9,
  },

  levelName: {
    color: COLORS.textPrimary,

    fontSize: 17,
    fontWeight: "900",

    marginTop: 2,
  },

  gridBadge: {
    backgroundColor: "rgba(168,85,247,0.1)",

    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.3)",

    borderRadius: 9,

    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  gridBadgeText: {
    color: "#c084fc",

    fontSize: 9,
    fontWeight: "900",
  },

  description: {
    color: COLORS.textSecondary,

    fontSize: 11,
    lineHeight: 17,

    marginBottom: 10,
  },

  objectiveBox: {
    backgroundColor: "rgba(59,130,246,0.07)",

    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.2)",

    borderRadius: 11,

    padding: 10,

    marginBottom: 12,
  },

  objectiveLabel: {
    color: "#60a5fa",

    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,

    marginBottom: 4,
  },

  objectiveText: {
    color: COLORS.textSecondary,

    fontSize: 11,
    lineHeight: 16,
  },

  grid: {
    width: "100%",

    padding: 3,

    borderRadius: 14,

    backgroundColor: "rgba(0,0,0,0.17)",

    borderWidth: 1,
    borderColor: COLORS.border,
  },

  row: {
    flexDirection: "row",
  },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",

    justifyContent: "center",

    gap: 12,

    marginTop: 12,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",

    gap: 4,
  },

  legendDot: {
    width: 10,
    height: 10,

    borderRadius: 5,
  },

  playerLegend: {
    backgroundColor: "#3b82f6",
  },

  legendIcon: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },

  legendText: {
    color: COLORS.textMuted,

    fontSize: 8,
    fontWeight: "700",
  },

  errorBox: {
    backgroundColor: COLORS.bgCard,

    borderRadius: 16,

    padding: 20,

    borderWidth: 1,
    borderColor: COLORS.danger,
  },

  errorText: {
    color: COLORS.danger,

    textAlign: "center",

    fontSize: 12,
    fontWeight: "700",
  },
});