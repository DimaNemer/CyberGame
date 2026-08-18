// lib/quantumLogicLevels.js

// =========================================================
// QUANTUM LOGIC — LEVEL DEFINITIONS
// =========================================================
//
// Security / integrity rules:
// - Level configuration is static local data.
// - No level accepts executable code.
// - Coordinates are validated by the game engine.
// - Objects are frozen to reduce accidental mutation.
// - The client must NOT be trusted for leaderboard scoring.
//
// Grid:
// 5 × 5
//
// Cell types:
// - start
// - goal
// - normal
// - wall
// - quantum barrier
//
// Mechanics:
// - Classical players cannot cross walls or quantum barriers.
// - Superposed players can cross quantum barriers.
// - Normal walls remain blocked.
// =========================================================

export const QUANTUM_GRID_SIZE = 5;

function freezeLevel(level) {
  return Object.freeze({
    ...level,

    start: Object.freeze([...level.start]),
    goal: Object.freeze([...level.goal]),

    walls: Object.freeze(
      (level.walls ?? []).map((cell) =>
        Object.freeze([...cell])
      )
    ),

    quantumBarriers: Object.freeze(
      (level.quantumBarriers ?? []).map((cell) =>
        Object.freeze([...cell])
      )
    ),

    availablePowers: Object.freeze({
      superpose: Boolean(level.availablePowers?.superpose),
      entangle: Boolean(level.availablePowers?.entangle),
      measure: Boolean(level.availablePowers?.measure),
    }),
  });
}

const LEVELS = [
  {
    id: 1,
    name: "The Gateway",

    description:
      "Learn classical movement and reach the quantum goal.",

    start: [0, 0],
    goal: [4, 4],

    walls: [
      [1, 1],
      [1, 2],
      [2, 2],
      [3, 2],
    ],

    quantumBarriers: [],

    availablePowers: {
      superpose: false,
      entangle: false,
      measure: false,
    },

    objective:
      "Navigate around the walls and reach the goal.",
  },

  {
    id: 2,
    name: "Classical Barrier",

    description:
      "Learn how fixed walls restrict classical movement.",

    start: [0, 0],
    goal: [4, 4],

    walls: [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
    ],

    quantumBarriers: [],

    availablePowers: {
      superpose: false,
      entangle: false,
      measure: false,
    },

    objective:
      "Find the classical route around the barrier.",
  },

  {
    id: 3,
    name: "Split Path",

    description:
      "Create your first superposition across nearby cells.",

    start: [0, 0],
    goal: [4, 4],

    walls: [
      [1, 2],
      [2, 2],
      [3, 2],
    ],

    quantumBarriers: [
      [2, 1],
    ],

    availablePowers: {
      superpose: true,
      entangle: false,
      measure: true,
    },

    objective:
      "Use Superpose, then Measure to continue.",
  },

  {
    id: 4,
    name: "Quantum Barrier",

    description:
      "A quantum barrier blocks classical movement.",

    start: [0, 0],
    goal: [4, 4],

    walls: [
      [1, 1],
      [3, 3],
    ],

    quantumBarriers: [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
    ],

    availablePowers: {
      superpose: true,
      entangle: false,
      measure: true,
    },

    objective:
      "Enter superposition to cross the quantum barrier.",
  },

  {
    id: 5,
    name: "Collapse",

    description:
      "Use measurement to collapse a superposition.",

    start: [2, 0],
    goal: [2, 4],

    walls: [
      [0, 2],
      [4, 2],
    ],

    quantumBarriers: [
      [1, 2],
      [2, 2],
      [3, 2],
    ],

    availablePowers: {
      superpose: true,
      entangle: false,
      measure: true,
    },

    objective:
      "Cross the barrier and collapse into a classical position.",
  },

  {
    id: 6,
    name: "Probability Chamber",

    description:
      "Multiple quantum paths can exist before measurement.",

    start: [0, 2],
    goal: [4, 2],

    walls: [
      [2, 0],
      [2, 4],
    ],

    quantumBarriers: [
      [2, 1],
      [2, 2],
      [2, 3],
    ],

    availablePowers: {
      superpose: true,
      entangle: false,
      measure: true,
    },

    objective:
      "Use probability branches to cross the chamber.",
  },

  {
    id: 7,
    name: "Linked States",

    description:
      "Create your first entangled cell pair.",

    start: [0, 0],
    goal: [4, 4],

    walls: [
      [1, 1],
      [1, 2],
      [1, 3],
      [2, 3],
      [3, 3],
    ],

    quantumBarriers: [],

    availablePowers: {
      superpose: false,
      entangle: true,
      measure: false,
    },

    objective:
      "Entangle two reachable cells to create a shortcut.",
  },

  {
    id: 8,
    name: "Quantum Tunnel",

    description:
      "Combine linked positions with maze navigation.",

    start: [0, 0],
    goal: [4, 4],

    walls: [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
    ],

    quantumBarriers: [],

    availablePowers: {
      superpose: false,
      entangle: true,
      measure: false,
    },

    objective:
      "Use an entangled pair to bypass the divided maze.",
  },

  {
    id: 9,
    name: "Interference Maze",

    description:
      "Combine superposition, measurement and entanglement.",

    start: [0, 0],
    goal: [4, 4],

    walls: [
      [1, 1],
      [3, 1],
      [1, 3],
      [3, 3],
    ],

    quantumBarriers: [
      [2, 1],
      [2, 2],
      [2, 3],
    ],

    availablePowers: {
      superpose: true,
      entangle: true,
      measure: true,
    },

    objective:
      "Combine all learned mechanics to reach the goal.",
  },

  {
    id: 10,
    name: "Quantum Core",

    description:
      "The final puzzle combines every quantum mechanic.",

    start: [0, 0],
    goal: [4, 4],

    walls: [
      [0, 2],
      [1, 0],
      [1, 2],
      [1, 4],
      [3, 0],
      [3, 2],
      [3, 4],
      [4, 2],
    ],

    quantumBarriers: [
      [2, 1],
      [2, 2],
      [2, 3],
    ],

    availablePowers: {
      superpose: true,
      entangle: true,
      measure: true,
    },

    objective:
      "Reach the Quantum Core using all three powers.",
  },
];

export const QUANTUM_LEVELS = Object.freeze(
  LEVELS.map(freezeLevel)
);

export function getQuantumLevel(levelId) {
  const numericId = Number(levelId);

  if (
    !Number.isInteger(numericId) ||
    numericId < 1 ||
    numericId > QUANTUM_LEVELS.length
  ) {
    return null;
  }

  return QUANTUM_LEVELS[numericId - 1] ?? null;
}

export function getQuantumLevelCount() {
  return QUANTUM_LEVELS.length;
}