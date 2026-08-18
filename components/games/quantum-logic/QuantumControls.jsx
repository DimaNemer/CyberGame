import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { COLORS } from "../../../constants/colors";
import {
  QUANTUM_MODE,
  DIRECTIONS,
} from "../../../lib/quantumLogicEngine";

export default function QuantumControls({
  gameState,
  level,
  onMove,
  onSuperpose,
  onMeasure,
  onBeginEntangle,
  onCancelEntangle,
  onReset,
  disabled = false,
}) {
  if (!gameState || !level) {
    return null;
  }

  const isClassical =
    gameState.mode === QUANTUM_MODE.CLASSICAL;

  const isSuperposed =
    gameState.mode === QUANTUM_MODE.SUPERPOSED;

  const isSelectingEntanglement =
    gameState.mode === QUANTUM_MODE.ENTANGLE_SELECT;

  const canMove =
    !disabled &&
    !isSelectingEntanglement &&
    !gameState.completed;

  const canSuperpose =
    !disabled &&
    isClassical &&
    Boolean(level.availablePowers?.superpose);

  const canMeasure =
    !disabled &&
    isSuperposed &&
    Boolean(level.availablePowers?.measure);

  const canEntangle =
    !disabled &&
    isClassical &&
    Boolean(level.availablePowers?.entangle);

  const safeMove = (direction) => {
    if (!canMove || typeof onMove !== "function") {
      return;
    }

    onMove(direction);
  };

  return (
    <>
      {/* Compact power bar */}
      <View style={styles.powerSection}>
        <Text style={styles.sectionLabel}>
          QUANTUM POWERS
        </Text>

        <View style={styles.powerRow}>
          <TouchableOpacity
            style={[
              styles.powerButton,
              styles.superposeButton,
              !canSuperpose && styles.disabled,
            ]}
            disabled={!canSuperpose}
            onPress={() => {
              if (canSuperpose) {
                onSuperpose?.();
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.powerIcon}>⚡</Text>
            <Text style={styles.powerText}>Superpose</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.powerButton,
              styles.entangleButton,
              !canEntangle &&
                !isSelectingEntanglement &&
                styles.disabled,
            ]}
            disabled={
              !canEntangle &&
              !isSelectingEntanglement
            }
            onPress={() => {
              if (isSelectingEntanglement) {
                onCancelEntangle?.();
              } else if (canEntangle) {
                onBeginEntangle?.();
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.powerIcon}>🔗</Text>
            <Text style={styles.powerText}>
              {isSelectingEntanglement
                ? "Cancel"
                : "Entangle"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.powerButton,
              styles.measureButton,
              !canMeasure && styles.disabled,
            ]}
            disabled={!canMeasure}
            onPress={() => {
              if (canMeasure) {
                onMeasure?.();
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.powerIcon}>📡</Text>
            <Text style={styles.powerText}>Measure</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.resetButton,
              disabled && styles.disabled,
            ]}
            disabled={disabled}
            onPress={() => {
              if (!disabled) {
                onReset?.();
              }
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.resetText}>↻</Text>
          </TouchableOpacity>
        </View>

        {isSelectingEntanglement && (
          <View style={styles.entangleHint}>
            <Text style={styles.entangleHintText}>
              🔗{" "}
              {gameState.entangleSelection
                ? "Now select the second cell."
                : "Select the first cell to link."}
            </Text>
          </View>
        )}
      </View>

     
    </>
  );
}

const styles = StyleSheet.create({
  powerSection: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
  },

  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  powerRow: {
    flexDirection: "row",
    gap: 6,
  },

  powerButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingHorizontal: 4,
  },

  superposeButton: {
    backgroundColor: "rgba(168,85,247,0.10)",
    borderColor: "rgba(168,85,247,0.35)",
  },

  entangleButton: {
    backgroundColor: "rgba(34,211,238,0.09)",
    borderColor: "rgba(34,211,238,0.3)",
  },

  measureButton: {
    backgroundColor: "rgba(245,158,11,0.09)",
    borderColor: "rgba(245,158,11,0.3)",
  },

  powerIcon: {
    fontSize: 17,
    marginBottom: 3,
  },

  powerText: {
    color: COLORS.textPrimary,
    fontSize: 8,
    fontWeight: "800",
  },

  resetButton: {
    width: 48,
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  resetText: {
    color: COLORS.textSecondary,
    fontSize: 22,
    fontWeight: "900",
  },

  entangleHint: {
    marginTop: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: "rgba(34,211,238,0.07)",
  },

  entangleHintText: {
    color: "#67e8f9",
    fontSize: 9,
    textAlign: "center",
    fontWeight: "700",
  },

 


  disabled: {
    opacity: 0.3,
  },
});