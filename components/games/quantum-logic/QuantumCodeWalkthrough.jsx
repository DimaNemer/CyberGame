import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";

import { COLORS } from "../../../constants/colors";

const SECTIONS = [
  {
    number: "01",
    icon: "▦",
    title: "Grid Setup",
    subtitle: "A 5×5 board stored with predictable coordinate math.",
    code: `const GRID_SIZE = 5;

const cells = Array(
  GRID_SIZE * GRID_SIZE
).fill(null);

function toIndex(row, col) {
  return row * GRID_SIZE + col;
}

function isInsideGrid(row, col) {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < GRID_SIZE &&
    col >= 0 &&
    col < GRID_SIZE
  );
}`,
    explanation:
      "The maze is visually two-dimensional, but a flat array is easy to store and update. The formula row × grid size + column converts a coordinate into one array index.",
    security:
      "Never trust coordinates just because they came from a grid button. Every row and column is validated again before the engine uses it.",
    concept:
      "Classical computing represents the board using definite positions. Quantum mechanics will later allow the game state to represent several possible positions at once.",
  },

  {
    number: "02",
    icon: "➜",
    title: "Movement",
    subtitle: "Boundary checks, walls and quantum barriers.",
    code: `function movePlayer(state, direction) {
  const [dr, dc] = direction;

  const nextRow =
    state.player.row + dr;

  const nextCol =
    state.player.col + dc;

  if (!isInsideGrid(nextRow, nextCol)) {
    return state;
  }

  if (isWall(nextRow, nextCol)) {
    return state;
  }

  if (
    isQuantumBarrier(nextRow, nextCol) &&
    state.mode !== "superposed"
  ) {
    return state;
  }

  return {
    ...state,
    player: {
      row: nextRow,
      col: nextCol,
    },
  };
}`,
    explanation:
      "Movement is calculated from a direction vector. Before changing the player position, the engine checks the grid boundary, hard walls and quantum barriers.",
    security:
      "The UI never directly sets the player's coordinate. It requests a movement, and the rules engine decides whether that movement is valid.",
    concept:
      "A classical state has one definite location. In this game, quantum barriers introduce locations that only the superposed state can cross.",
  },

  {
    number: "03",
    icon: "⚛",
    title: "Qubit Model",
    subtitle: "Amplitudes become measurement probabilities.",
    code: `const qubit = {
  alpha: 1,
  beta: 0,
};

function probability(amplitude) {
  return amplitude * amplitude;
}

// Hadamard on |0>
const amplitude =
  1 / Math.sqrt(2);

const state = {
  zero: amplitude,
  one: amplitude,
};

// |alpha|² + |beta|² = 1`,
    explanation:
      "A real qubit is described using amplitudes. Measurement probabilities are obtained from the squared magnitude of those amplitudes.",
    security:
      "Quantum amplitudes here are educational values only. They are never used for authentication, encryption or security decisions.",
    concept:
      "The important mathematical relationship is probability = |amplitude|². Equal amplitudes of 1/√2 produce 50% and 50% measurement probabilities.",
  },

  {
    number: "04",
    icon: "⚡",
    title: "Superposition Logic",
    subtitle: "One player state becomes several possible locations.",
    code: `function superpose(player, cells) {
  const validCells =
    cells.filter(isValidQuantumCell);

  const probability =
    1 / validCells.length;

  return validCells.map(cell => ({
    row: cell.row,
    col: cell.col,
    probability,
  }));
}

// Example:
// [
//   { row: 1, col: 2, probability: .25 },
//   { row: 2, col: 1, probability: .25 },
//   { row: 2, col: 3, probability: .25 },
//   { row: 3, col: 2, probability: .25 },
// ]`,
    explanation:
      "The game does not clone the player. It stores several possible positions. Their probabilities are normalized so the total always equals 1.",
    security:
      "The engine limits the maximum number of branches and validates every branch before accepting it. Invalid coordinates are discarded.",
    concept:
      "This is an educational analogy: superposition means the state represents several possible outcomes before measurement.",
  },

  {
    number: "05",
    icon: "🔗",
    title: "Entanglement",
    subtitle: "Linked cells implemented as a validated lookup table.",
    code: `const pairs = {
  "1,1": "4,3",
  "4,3": "1,1",
};

function resolveLinkedCell(row, col) {
  const key = \`\${row},\${col}\`;

  const target = pairs[key];

  if (!target) {
    return { row, col };
  }

  return parseAndValidate(target);
}`,
    explanation:
      "The game stores both directions of an entangled pair. Entering either cell looks up the matching destination.",
    security:
      "The destination from the lookup table is validated again before teleportation. The engine never trusts arbitrary coordinate strings.",
    concept:
      "This is a gameplay metaphor for correlation between entangled systems. Real quantum entanglement does not literally teleport a person between grid cells.",
  },
];

function CodeBlock({ code }) {
  return (
    <View style={styles.codeBlock}>
      <View style={styles.codeHeader}>
        <View style={styles.codeDots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.codeLanguage}>
          JAVASCRIPT
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <Text style={styles.codeText}>
          {code}
        </Text>
      </ScrollView>
    </View>
  );
}

export default function QuantumCodeWalkthrough() {
  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>
          {"{ }"} CODE WALKTHROUGH
        </Text>

        <Text style={styles.title}>
          How the Quantum Maze Works
        </Text>

        <Text style={styles.description}>
          These five sections show the same core ideas used
          by the playable game, written for a junior
          developer audience.
        </Text>

        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>
            🛡️
          </Text>

          <Text style={styles.warningText}>
            The game rules are centralized in the engine.
            UI components request actions but never directly
            change trusted game coordinates.
          </Text>
        </View>
      </View>

      {SECTIONS.map((section) => (
        <View
          key={section.number}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.numberBox}>
              <Text style={styles.number}>
                {section.number}
              </Text>
            </View>

            <View style={styles.headerText}>
              <Text style={styles.sectionIcon}>
                {section.icon}
              </Text>

              <Text style={styles.sectionTitle}>
                {section.title}
              </Text>

              <Text style={styles.sectionSubtitle}>
                {section.subtitle}
              </Text>
            </View>
          </View>

          <CodeBlock code={section.code} />

          <View style={styles.explanationBox}>
            <Text style={styles.boxLabel}>
              SIMPLE EXPLANATION
            </Text>

            <Text style={styles.boxText}>
              {section.explanation}
            </Text>
          </View>

          <View style={styles.securityBox}>
            <Text style={styles.securityTitle}>
              🛡️ SECURITY NOTE
            </Text>

            <Text style={styles.securityText}>
              {section.security}
            </Text>
          </View>

          <View style={styles.conceptBox}>
            <Text style={styles.conceptTitle}>
              ⚛ QUANTUM CONNECTION
            </Text>

            <Text style={styles.conceptText}>
              {section.concept}
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.footerNote}>
        <Text style={styles.footerTitle}>
          Important
        </Text>

        <Text style={styles.footerText}>
          Quantum Logic is an educational simulation. Its
          grid mechanics simplify real quantum phenomena so
          players can interact with the core ideas.
        </Text>
      </View>
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

  warningBox: {
    flexDirection: "row",
    gap: 9,
    marginTop: 14,
    padding: 11,
    borderRadius: 12,
    backgroundColor: "rgba(16,185,129,0.07)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
  },

  warningIcon: {
    fontSize: 17,
  },

  warningText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 16,
  },

  section: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sectionHeader: {
    flexDirection: "row",
    gap: 11,
    alignItems: "flex-start",
    marginBottom: 13,
  },

  numberBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(168,85,247,0.12)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.3)",
  },

  number: {
    color: "#c084fc",
    fontSize: 11,
    fontWeight: "900",
  },

  headerText: {
    flex: 1,
  },

  sectionIcon: {
    fontSize: 16,
  },

  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },

  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  codeBlock: {
    backgroundColor: "#070b14",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.16)",
    marginBottom: 12,
  },

  codeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.1)",
  },

  codeDots: {
    flexDirection: "row",
    gap: 4,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
  },

  codeLanguage: {
    color: COLORS.textMuted,
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  codeText: {
    color: "#cbd5e1",
    fontSize: 11,
    lineHeight: 18,
    fontFamily: "monospace",
    padding: 13,
  },

  explanationBox: {
    padding: 11,
    borderRadius: 11,
    backgroundColor: COLORS.bgCardLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  boxLabel: {
    color: "#60a5fa",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  boxText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  securityBox: {
    marginTop: 9,
    padding: 11,
    borderRadius: 11,
    backgroundColor: "rgba(16,185,129,0.06)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.18)",
  },

  securityTitle: {
    color: COLORS.success,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  securityText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  conceptBox: {
    marginTop: 9,
    padding: 11,
    borderRadius: 11,
    backgroundColor: "rgba(168,85,247,0.06)",
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.17)",
  },

  conceptTitle: {
    color: "#c084fc",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.6,
  },

  conceptText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  footerNote: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "rgba(245,158,11,0.06)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.18)",
  },

  footerTitle: {
    color: COLORS.warning,
    fontSize: 10,
    fontWeight: "900",
  },

  footerText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },
});