import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import {
  useCallback,
  useMemo,
  useState,
} from "react";

import { COLORS } from "../../../constants/colors";

const SQRT_HALF = 1 / Math.sqrt(2);

function clampProbability(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(1, number)
  );
}

function percent(value) {
  return Math.round(
    clampProbability(value) * 100
  );
}

function ProbabilityBar({
  label,
  probability,
}) {
  const safe =
    clampProbability(probability);

  return (
    <View style={styles.probabilityRow}>
      <Text style={styles.probabilityLabel}>
        {label}
      </Text>

      <View style={styles.probabilityTrack}>
        <View
          style={[
            styles.probabilityFill,
            {
              width: `${safe * 100}%`,
            },
          ]}
        />
      </View>

      <Text style={styles.probabilityPercent}>
        {percent(safe)}%
      </Text>
    </View>
  );
}

export default function QuantumConcepts() {
  // =======================================================
  // QUBIT EXPLORER
  //
  // We adjust probability directly for teaching.
  // Corresponding amplitudes are square roots.
  // =======================================================

  const [zeroProbability, setZeroProbability] =
    useState(0.5);

  const oneProbability =
    1 - zeroProbability;

  const amplitudes = useMemo(
    () => ({
      alpha:
        Math.sqrt(
          clampProbability(
            zeroProbability
          )
        ),

      beta:
        Math.sqrt(
          clampProbability(
            oneProbability
          )
        ),
    }),
    [
      oneProbability,
      zeroProbability,
    ]
  );

  const shiftQubit = useCallback(
    (amount) => {
      setZeroProbability(
        (previous) => {
          const next =
            previous + amount;

          return Math.round(
            Math.max(
              0,
              Math.min(1, next)
            ) * 10
          ) / 10;
        }
      );
    },
    []
  );

  // =======================================================
  // HADAMARD EXPLORER
  //
  // Represent amplitudes explicitly so applying H twice
  // correctly returns |0>.
  //
  // H[a,b] =
  // [
  //   (a+b)/sqrt(2),
  //   (a-b)/sqrt(2)
  // ]
  // =======================================================

  const [hadamardState, setHadamardState] =
    useState({
      alpha: 1,
      beta: 0,
      applications: 0,
    });

  const applyHadamard = useCallback(() => {
    setHadamardState(
      (previous) => {
        const nextAlpha =
          (
            previous.alpha +
            previous.beta
          ) * SQRT_HALF;

        const nextBeta =
          (
            previous.alpha -
            previous.beta
          ) * SQRT_HALF;

        return {
          alpha:
            Math.abs(nextAlpha) < 1e-12
              ? 0
              : nextAlpha,

          beta:
            Math.abs(nextBeta) < 1e-12
              ? 0
              : nextBeta,

          applications:
            previous.applications + 1,
        };
      }
    );
  }, []);

  const resetHadamard = useCallback(() => {
    setHadamardState({
      alpha: 1,
      beta: 0,
      applications: 0,
    });
  }, []);

  const hadamardP0 =
    hadamardState.alpha *
    hadamardState.alpha;

  const hadamardP1 =
    hadamardState.beta *
    hadamardState.beta;

  // =======================================================
  // MEASUREMENT DEMO
  // =======================================================

  const [measurement, setMeasurement] =
    useState({
      p0: 0.65,
      result: null,
      count0: 0,
      count1: 0,
    });

  const performMeasurement =
    useCallback(() => {
      const p0 =
        clampProbability(
          measurement.p0
        );

      /*
       * This is gameplay randomness only.
       *
       * It is NOT cryptographic randomness and must never
       * be used for tokens, passwords, keys or auth.
       */
      const result =
        Math.random() < p0
          ? 0
          : 1;

      setMeasurement(
        (previous) => ({
          ...previous,

          result,

          count0:
            previous.count0 +
            (result === 0 ? 1 : 0),

          count1:
            previous.count1 +
            (result === 1 ? 1 : 0),
        })
      );
    }, [measurement.p0]);

  const resetMeasurement =
    useCallback(() => {
      setMeasurement(
        (previous) => ({
          ...previous,
          result: null,
          count0: 0,
          count1: 0,
        })
      );
    }, []);

  // =======================================================
  // BELL STATE DEMO
  //
  // Educational Bell state:
  //
  // (|00> + |11>) / sqrt(2)
  //
  // Measurement should produce either:
  // 00
  // or
  // 11
  //
  // never 01 or 10.
  // =======================================================

  const [bellState, setBellState] =
    useState({
      resultA: null,
      resultB: null,
      measurements: 0,
    });

  const measureBellState =
    useCallback(() => {
      const result =
        Math.random() < 0.5
          ? 0
          : 1;

      setBellState(
        (previous) => ({
          resultA: result,
          resultB: result,
          measurements:
            previous.measurements + 1,
        })
      );
    }, []);

  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>
          ⚛ QUANTUM CONCEPTS
        </Text>

        <Text style={styles.title}>
          Learn by Experimenting
        </Text>

        <Text style={styles.description}>
          Change states, apply quantum gates and perform
          measurements to see the ideas used by the game.
        </Text>
      </View>

      {/* QUBIT */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardNumber}>
            <Text style={styles.cardNumberText}>
              01
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              Qubit State
            </Text>

            <Text style={styles.cardSubtitle}>
              A quantum bit can be described as a
              combination of |0⟩ and |1⟩.
            </Text>
          </View>
        </View>

        <View style={styles.equationBox}>
          <Text style={styles.equation}>
            α|0⟩ + β|1⟩
          </Text>

          <Text style={styles.equationCaption}>
            |α|² + |β|² = 1
          </Text>
        </View>

        <ProbabilityBar
          label="|0⟩"
          probability={
            zeroProbability
          }
        />

        <ProbabilityBar
          label="|1⟩"
          probability={
            oneProbability
          }
        />

        <View style={styles.adjustControls}>
          <TouchableOpacity
            style={styles.smallButton}
            onPress={() =>
              shiftQubit(-0.1)
            }
          >
            <Text style={styles.smallButtonText}>
              - |0⟩
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={() =>
              setZeroProbability(0.5)
            }
          >
            <Text style={styles.smallButtonText}>
              50 / 50
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallButton}
            onPress={() =>
              shiftQubit(0.1)
            }
          >
            <Text style={styles.smallButtonText}>
              + |0⟩
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.readout}>
          <Text style={styles.readoutLabel}>
            AMPLITUDES
          </Text>

          <Text style={styles.readoutText}>
            α ≈ {amplitudes.alpha.toFixed(3)}
            {"   "}
            β ≈ {amplitudes.beta.toFixed(3)}
          </Text>
        </View>

        <ConceptNote>
          Probabilities are obtained by squaring the
          magnitude of each amplitude.
        </ConceptNote>
      </View>

      {/* HADAMARD */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardNumber}>
            <Text style={styles.cardNumberText}>
              02
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              Hadamard Gate
            </Text>

            <Text style={styles.cardSubtitle}>
              Try pressing H several times and observe how
              interference changes the state.
            </Text>
          </View>
        </View>

        <View style={styles.equationBox}>
          <Text style={styles.equation}>
            H|0⟩ = (|0⟩ + |1⟩) / √2
          </Text>
        </View>

        <ProbabilityBar
          label="|0⟩"
          probability={
            hadamardP0
          }
        />

        <ProbabilityBar
          label="|1⟩"
          probability={
            hadamardP1
          }
        />

        <View style={styles.hadamardReadout}>
          <Text style={styles.readoutLabel}>
            CURRENT AMPLITUDES
          </Text>

          <Text style={styles.readoutText}>
            α = {hadamardState.alpha.toFixed(3)}
            {"   "}
            β = {hadamardState.beta.toFixed(3)}
          </Text>

          <Text style={styles.applicationText}>
            H applied:{" "}
            {hadamardState.applications} times
          </Text>
        </View>

        <View style={styles.twoButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={
              applyHadamard
            }
          >
            <Text style={styles.primaryButtonText}>
              ⚡ Apply H
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={
              resetHadamard
            }
          >
            <Text style={styles.secondaryButtonText}>
              ↻ Reset
            </Text>
          </TouchableOpacity>
        </View>

        <ConceptNote>
          Applying H once to |0⟩ creates equal measurement
          probabilities. Applying H again returns the state
          to |0⟩ because amplitudes interfere.
        </ConceptNote>
      </View>

      {/* MEASUREMENT */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardNumber}>
            <Text style={styles.cardNumberText}>
              03
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              Measurement Collapse
            </Text>

            <Text style={styles.cardSubtitle}>
              Measurement converts a probability
              distribution into one observed result.
            </Text>
          </View>
        </View>

        <ProbabilityBar
          label="|0⟩"
          probability={
            measurement.p0
          }
        />

        <ProbabilityBar
          label="|1⟩"
          probability={
            1 -
            measurement.p0
          }
        />

        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>
            LAST MEASUREMENT
          </Text>

          <Text style={styles.resultValue}>
            {measurement.result === null
              ? "Not measured"
              : `|${measurement.result}⟩`}
          </Text>
        </View>

        <View style={styles.measurementStats}>
          <View style={styles.measurementStat}>
            <Text style={styles.measurementStatValue}>
              {measurement.count0}
            </Text>

            <Text style={styles.measurementStatLabel}>
              |0⟩ results
            </Text>
          </View>

          <View style={styles.measurementStat}>
            <Text style={styles.measurementStatValue}>
              {measurement.count1}
            </Text>

            <Text style={styles.measurementStatLabel}>
              |1⟩ results
            </Text>
          </View>
        </View>

        <View style={styles.twoButtons}>
          <TouchableOpacity
            style={styles.measureButton}
            onPress={
              performMeasurement
            }
          >
            <Text style={styles.primaryButtonText}>
              📡 Measure
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={
              resetMeasurement
            }
          >
            <Text style={styles.secondaryButtonText}>
              ↻ Clear
            </Text>
          </TouchableOpacity>
        </View>

        <ConceptNote>
          Repeating the experiment many times should
          approach the configured probabilities, although
          individual measurements remain unpredictable.
        </ConceptNote>
      </View>

      {/* BELL STATE */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardNumber}>
            <Text style={styles.cardNumberText}>
              04
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              Bell State & Entanglement
            </Text>

            <Text style={styles.cardSubtitle}>
              Two qubits can have correlated measurement
              outcomes.
            </Text>
          </View>
        </View>

        <View style={styles.equationBox}>
          <Text style={styles.equation}>
            (|00⟩ + |11⟩) / √2
          </Text>

          <Text style={styles.equationCaption}>
            50% → |00⟩
            {"    "}
            50% → |11⟩
          </Text>
        </View>

        <View style={styles.bellQubits}>
          <View style={styles.qubitBubble}>
            <Text style={styles.qubitLabel}>
              QUBIT A
            </Text>

            <Text style={styles.qubitResult}>
              {bellState.resultA === null
                ? "?"
                : bellState.resultA}
            </Text>
          </View>

          <Text style={styles.linkIcon}>
            🔗
          </Text>

          <View style={styles.qubitBubble}>
            <Text style={styles.qubitLabel}>
              QUBIT B
            </Text>

            <Text style={styles.qubitResult}>
              {bellState.resultB === null
                ? "?"
                : bellState.resultB}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.entangleMeasureButton}
          onPress={
            measureBellState
          }
        >
          <Text style={styles.primaryButtonText}>
            🔗 Measure Bell Pair
          </Text>
        </TouchableOpacity>

        <Text style={styles.measureCount}>
          Experiments: {bellState.measurements}
        </Text>

        <ConceptNote>
          In this simplified Bell-state demonstration, the
          results are always correlated: either 00 or 11.
          The game's teleport-cell mechanic is only a
          teaching metaphor and is not literal quantum
          teleportation.
        </ConceptNote>
      </View>

      <View style={styles.finalNote}>
        <Text style={styles.finalNoteTitle}>
          🧠 From Concept to Gameplay
        </Text>

        <Text style={styles.finalNoteText}>
          Superposition becomes multiple possible grid
          positions, measurement becomes weighted collapse,
          and entanglement becomes a pair of linked cells.
          These mechanics simplify the physics into an
          interactive puzzle without claiming to be a full
          quantum simulator.
        </Text>
      </View>
    </View>
  );
}

function ConceptNote({ children }) {
  return (
    <View style={styles.note}>
      <Text style={styles.noteLabel}>
        WHY THIS MATTERS
      </Text>

      <Text style={styles.noteText}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },

  intro: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.25)",
  },

  eyebrow: {
    color: "#c084fc",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  title: {
    color: COLORS.textPrimary,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 5,
  },

  description: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 8,
  },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cardHeader: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginBottom: 13,
  },

  cardNumber: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168,85,247,0.12)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.3)",
  },

  cardNumberText: {
    color: "#c084fc",
    fontSize: 10,
    fontWeight: "900",
  },

  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },

  cardSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  equationBox: {
    padding: 14,
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: "rgba(168,85,247,0.07)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.2)",
    marginBottom: 13,
  },

  equation: {
    color: "#e9d5ff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
    fontFamily: "monospace",
  },

  equationCaption: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 6,
    textAlign: "center",
  },

  probabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 9,
  },

  probabilityLabel: {
    width: 32,
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: "900",
    fontFamily: "monospace",
  },

  probabilityTrack: {
    flex: 1,
    height: 8,
    borderRadius: 99,
    backgroundColor: COLORS.bgCardLight,
    overflow: "hidden",
  },

  probabilityFill: {
    height: "100%",
    borderRadius: 99,
    backgroundColor: "#a855f7",
  },

  probabilityPercent: {
    width: 37,
    textAlign: "right",
    color: "#d8b4fe",
    fontSize: 9,
    fontWeight: "900",
  },

  adjustControls: {
    flexDirection: "row",
    gap: 7,
    marginTop: 6,
  },

  smallButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  smallButtonText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: "800",
  },

  readout: {
    marginTop: 11,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  readoutLabel: {
    color: COLORS.textMuted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  readoutText: {
    color: COLORS.textPrimary,
    fontSize: 10,
    marginTop: 4,
    fontFamily: "monospace",
  },

  hadamardReadout: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.16)",
    marginTop: 5,
  },

  applicationText: {
    color: "#c084fc",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 5,
  },

  twoButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 11,
  },

  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 11,
    backgroundColor: "#7c3aed",
  },

  measureButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 11,
    backgroundColor: "#d97706",
  },

  entangleMeasureButton: {
    paddingVertical: 13,
    alignItems: "center",
    borderRadius: 11,
    backgroundColor: "#0891b2",
    marginTop: 12,
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },

  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 11,
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "900",
  },

  resultBox: {
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(245,158,11,0.07)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    marginTop: 7,
  },

  resultLabel: {
    color: COLORS.warning,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  resultValue: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 5,
    fontFamily: "monospace",
  },

  measurementStats: {
    flexDirection: "row",
    gap: 8,
    marginTop: 9,
  },

  measurementStat: {
    flex: 1,
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    backgroundColor: COLORS.bgCardLight,
  },

  measurementStatValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },

  measurementStatLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    marginTop: 2,
  },

  bellQubits: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 15,
  },

  qubitBubble: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,211,238,0.09)",
    borderWidth: 2,
    borderColor: "rgba(34,211,238,0.35)",
  },

  qubitLabel: {
    color: "#67e8f9",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  qubitResult: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
  },

  linkIcon: {
    fontSize: 24,
  },

  measureCount: {
    color: COLORS.textMuted,
    fontSize: 9,
    textAlign: "center",
    marginTop: 7,
  },

  note: {
    marginTop: 12,
    padding: 11,
    borderRadius: 11,
    backgroundColor: "rgba(59,130,246,0.06)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.17)",
  },

  noteLabel: {
    color: "#60a5fa",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  noteText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  finalNote: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(168,85,247,0.07)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.2)",
  },

  finalNoteTitle: {
    color: "#d8b4fe",
    fontSize: 11,
    fontWeight: "900",
  },

  finalNoteText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 17,
    marginTop: 5,
  },
});