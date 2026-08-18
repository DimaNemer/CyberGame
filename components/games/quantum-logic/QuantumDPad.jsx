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

export default function QuantumDPad({
  gameState,
  onMove,
  disabled = false,
}) {
  if (!gameState) {
    return null;
  }

  const isSelectingEntanglement =
    gameState.mode === QUANTUM_MODE.ENTANGLE_SELECT;

  const isSuperposed =
    gameState.mode === QUANTUM_MODE.SUPERPOSED;

  const canMove =
    !disabled &&
    !gameState.completed &&
    !isSelectingEntanglement;

  const handleMove = (direction) => {
    if (
      !canMove ||
      typeof onMove !== "function"
    ) {
      return;
    }

    onMove(direction);
  };

  return (
    <View
      style={styles.container}
      pointerEvents="box-none"
    >
      <View style={styles.dpad}>
        {/* UP */}
        <TouchableOpacity
          style={[
            styles.arrowButton,
            styles.upButton,
            !canMove && styles.disabled,
          ]}
          disabled={!canMove}
          onPress={() =>
            handleMove(DIRECTIONS.UP)
          }
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Move up"
        >
          <Text style={styles.arrowText}>
            ↑
          </Text>
        </TouchableOpacity>

        {/* LEFT */}
        <TouchableOpacity
          style={[
            styles.arrowButton,
            styles.leftButton,
            !canMove && styles.disabled,
          ]}
          disabled={!canMove}
          onPress={() =>
            handleMove(DIRECTIONS.LEFT)
          }
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Move left"
        >
          <Text style={styles.arrowText}>
            ←
          </Text>
        </TouchableOpacity>

        {/* CENTER */}
        <View style={styles.centerButton}>
          <Text style={styles.centerIcon}>
            {isSuperposed ? "⚛" : "●"}
          </Text>
        </View>

        {/* RIGHT */}
        <TouchableOpacity
          style={[
            styles.arrowButton,
            styles.rightButton,
            !canMove && styles.disabled,
          ]}
          disabled={!canMove}
          onPress={() =>
            handleMove(DIRECTIONS.RIGHT)
          }
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Move right"
        >
          <Text style={styles.arrowText}>
            →
          </Text>
        </TouchableOpacity>

        {/* DOWN */}
        <TouchableOpacity
          style={[
            styles.arrowButton,
            styles.downButton,
            !canMove && styles.disabled,
          ]}
          disabled={!canMove}
          onPress={() =>
            handleMove(DIRECTIONS.DOWN)
          }
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Move down"
        >
          <Text style={styles.arrowText}>
            ↓
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",

    right: 14,
    bottom: 18,

    zIndex: 200,
    elevation: 20,
  },

  dpad: {
    width: 128,
    height: 128,

    borderRadius: 28,

    backgroundColor: "rgba(8,12,24,0.96)",

    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.3)",

    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,

    shadowOffset: {
      width: 0,
      height: 5,
    },
  },

  arrowButton: {
    position: "absolute",

    width: 40,
    height: 40,

    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      "rgba(59,130,246,0.16)",

    borderWidth: 1,
    borderColor:
      "rgba(96,165,250,0.4)",
  },

  upButton: {
    top: 4,
    left: 44,
  },

  downButton: {
    bottom: 4,
    left: 44,
  },

  leftButton: {
    left: 4,
    top: 44,
  },

  rightButton: {
    right: 4,
    top: 44,
  },

  centerButton: {
    position: "absolute",

    left: 44,
    top: 44,

    width: 40,
    height: 40,

    borderRadius: 20,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor:
      "rgba(168,85,247,0.18)",

    borderWidth: 1,
    borderColor:
      "rgba(168,85,247,0.4)",
  },

  centerIcon: {
    color: "#d8b4fe",
    fontSize: 16,
    fontWeight: "900",
  },

  arrowText: {
    color: "#bfdbfe",
    fontSize: 21,
    fontWeight: "900",
  },

  disabled: {
    opacity: 0.3,
  },
});