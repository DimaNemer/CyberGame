import {
  QUANTUM_GRID_SIZE,
} from "./quantumLogicLevels";

// =========================================================
// QUANTUM LOGIC — PURE GAME ENGINE
// =========================================================
//
// IMPORTANT:
//
// This code protects game state from accidental or malformed
// actions, but it is still CLIENT-SIDE.
//
// A modified APK can bypass client rules.
//
// Any competitive score / leaderboard result must still be
// validated server-side.
// =========================================================

export const QUANTUM_MODE = Object.freeze({
  CLASSICAL: "classical",
  SUPERPOSED: "superposed",
  ENTANGLE_SELECT: "entangle_select",
});

export const DIRECTIONS = Object.freeze({
  UP: Object.freeze([-1, 0]),
  DOWN: Object.freeze([1, 0]),
  LEFT: Object.freeze([0, -1]),
  RIGHT: Object.freeze([0, 1]),
});

const MAX_ENTANGLEMENT_PAIRS = 2;
const MAX_SUPERPOSITION_STATES = 5;

function finiteInteger(value) {
  return Number.isInteger(value) && Number.isFinite(value);
}

export function isValidCoordinate(row, col) {
  return (
    finiteInteger(row) &&
    finiteInteger(col) &&
    row >= 0 &&
    row < QUANTUM_GRID_SIZE &&
    col >= 0 &&
    col < QUANTUM_GRID_SIZE
  );
}

export function coordinateKey(row, col) {
  if (!isValidCoordinate(row, col)) {
    return null;
  }

  return `${row},${col}`;
}

export function parseCoordinateKey(key) {
  if (typeof key !== "string") {
    return null;
  }

  const parts = key.split(",");

  if (parts.length !== 2) {
    return null;
  }

  const row = Number(parts[0]);
  const col = Number(parts[1]);

  if (!isValidCoordinate(row, col)) {
    return null;
  }

  return { row, col };
}

function coordinateListToSet(cells) {
  const result = new Set();

  if (!Array.isArray(cells)) {
    return result;
  }

  for (const cell of cells) {
    if (
      !Array.isArray(cell) ||
      cell.length !== 2
    ) {
      continue;
    }

    const [row, col] = cell;

    const key = coordinateKey(row, col);

    if (key) {
      result.add(key);
    }
  }

  return result;
}

export function isWall(level, row, col) {
  if (!level || !isValidCoordinate(row, col)) {
    return true;
  }

  const key = coordinateKey(row, col);

  return coordinateListToSet(level.walls).has(key);
}

export function isQuantumBarrier(level, row, col) {
  if (!level || !isValidCoordinate(row, col)) {
    return false;
  }

  const key = coordinateKey(row, col);

  return coordinateListToSet(
    level.quantumBarriers
  ).has(key);
}

export function isGoal(level, row, col) {
  if (
    !level ||
    !Array.isArray(level.goal) ||
    level.goal.length !== 2
  ) {
    return false;
  }

  return (
    row === level.goal[0] &&
    col === level.goal[1]
  );
}

function canOccupyCell(
  level,
  row,
  col,
  mode
) {
  if (!isValidCoordinate(row, col)) {
    return false;
  }

  // Real wall:
  // always forbidden.
  if (isWall(level, row, col)) {
    return false;
  }

  // Quantum barrier:
  // only superposition can occupy/cross.
  if (
    isQuantumBarrier(level, row, col) &&
    mode !== QUANTUM_MODE.SUPERPOSED
  ) {
    return false;
  }

  return true;
}

export function createInitialQuantumState(level) {
  if (
    !level ||
    !Array.isArray(level.start) ||
    level.start.length !== 2
  ) {
    return null;
  }

  const [row, col] = level.start;

  if (
    !isValidCoordinate(row, col) ||
    isWall(level, row, col)
  ) {
    return null;
  }

  return Object.freeze({
    mode: QUANTUM_MODE.CLASSICAL,

    player: Object.freeze({
      row,
      col,
    }),

    superposition: Object.freeze([]),

    // {
    //   "row,col": "otherRow,otherCol"
    // }
    entanglements: Object.freeze({}),

    entangleSelection: null,

    moves: 0,
    superpositionsUsed: 0,
    measurementsUsed: 0,
    entanglementsCreated: 0,

    completed: false,
  });
}

function sanitizeDirection(direction) {
  if (
    !Array.isArray(direction) ||
    direction.length !== 2
  ) {
    return null;
  }

  const [dr, dc] = direction;

  const valid =
    (dr === -1 && dc === 0) ||
    (dr === 1 && dc === 0) ||
    (dr === 0 && dc === -1) ||
    (dr === 0 && dc === 1);

  return valid ? [dr, dc] : null;
}

function applyTeleport(
  row,
  col,
  entanglements
) {
  const key = coordinateKey(row, col);

  if (!key) {
    return { row, col };
  }

  const targetKey =
    entanglements?.[key];

  if (typeof targetKey !== "string") {
    return { row, col };
  }

  const parsed =
    parseCoordinateKey(targetKey);

  return parsed ?? { row, col };
}

export function moveClassicalPlayer(
  state,
  level,
  direction
) {
  if (
    !state ||
    state.completed ||
    state.mode !== QUANTUM_MODE.CLASSICAL
  ) {
    return state;
  }

  const safeDirection =
    sanitizeDirection(direction);

  if (!safeDirection) {
    return state;
  }

  const [dr, dc] = safeDirection;

  const nextRow = state.player.row + dr;
  const nextCol = state.player.col + dc;

  if (
    !canOccupyCell(
      level,
      nextRow,
      nextCol,
      QUANTUM_MODE.CLASSICAL
    )
  ) {
    return state;
  }

  const teleported =
    applyTeleport(
      nextRow,
      nextCol,
      state.entanglements
    );

  // Never trust an entanglement destination blindly.
  if (
    !canOccupyCell(
      level,
      teleported.row,
      teleported.col,
      QUANTUM_MODE.CLASSICAL
    )
  ) {
    return state;
  }

  const completed =
    isGoal(
      level,
      teleported.row,
      teleported.col
    );

  return Object.freeze({
    ...state,

    player: Object.freeze({
      row: teleported.row,
      col: teleported.col,
    }),

    moves: state.moves + 1,
    completed,
  });
}

function getCandidateSuperpositionCells(
  state,
  level
) {
  const base = state.player;

  if (!base) {
    return [];
  }

  const candidates = [
    [base.row, base.col],
    [base.row - 1, base.col],
    [base.row + 1, base.col],
    [base.row, base.col - 1],
    [base.row, base.col + 1],
  ];

  const unique = new Map();

  for (const [row, col] of candidates) {
    if (
      !canOccupyCell(
        level,
        row,
        col,
        QUANTUM_MODE.SUPERPOSED
      )
    ) {
      continue;
    }

    const key = coordinateKey(row, col);

    if (!key) continue;

    unique.set(key, { row, col });
  }

  return Array
    .from(unique.values())
    .slice(0, MAX_SUPERPOSITION_STATES);
}

export function applySuperposition(
  state,
  level
) {
  if (
    !state ||
    state.completed ||
    state.mode !== QUANTUM_MODE.CLASSICAL
  ) {
    return state;
  }

  if (!level?.availablePowers?.superpose) {
    return state;
  }

  const candidates =
    getCandidateSuperpositionCells(
      state,
      level
    );

  if (candidates.length < 2) {
    return state;
  }

  const probability =
    1 / candidates.length;

  const superposition =
    candidates.map((cell) =>
      Object.freeze({
        row: cell.row,
        col: cell.col,
        probability,
      })
    );

  return Object.freeze({
    ...state,

    mode: QUANTUM_MODE.SUPERPOSED,

    superposition:
      Object.freeze(superposition),

    superpositionsUsed:
      state.superpositionsUsed + 1,
  });
}

export function moveSuperposition(
  state,
  level,
  direction
) {
  if (
    !state ||
    state.completed ||
    state.mode !== QUANTUM_MODE.SUPERPOSED
  ) {
    return state;
  }

  const safeDirection =
    sanitizeDirection(direction);

  if (!safeDirection) {
    return state;
  }

  const [dr, dc] = safeDirection;

  const movedStates = [];

  for (const branch of state.superposition) {
    if (
      !branch ||
      !isValidCoordinate(
        branch.row,
        branch.col
      )
    ) {
      continue;
    }

    const nextRow = branch.row + dr;
    const nextCol = branch.col + dc;

    // Superposition may cross quantum barriers,
    // but never hard walls.
    if (
      canOccupyCell(
        level,
        nextRow,
        nextCol,
        QUANTUM_MODE.SUPERPOSED
      )
    ) {
      movedStates.push({
        row: nextRow,
        col: nextCol,
        probability:
          Number(branch.probability) || 0,
      });
    } else {
      // Blocked branch remains where it is.
      movedStates.push({
        row: branch.row,
        col: branch.col,
        probability:
          Number(branch.probability) || 0,
      });
    }
  }

  const normalized =
    normalizeProbabilities(movedStates);

  if (normalized.length === 0) {
    return state;
  }

  return Object.freeze({
    ...state,

    superposition:
      Object.freeze(
        normalized.map(Object.freeze)
      ),

    moves: state.moves + 1,
  });
}

export function moveQuantumPlayer(
  state,
  level,
  direction
) {
  if (!state || !level) {
    return state;
  }

  if (
    state.mode ===
    QUANTUM_MODE.SUPERPOSED
  ) {
    return moveSuperposition(
      state,
      level,
      direction
    );
  }

  if (
    state.mode ===
    QUANTUM_MODE.CLASSICAL
  ) {
    return moveClassicalPlayer(
      state,
      level,
      direction
    );
  }

  return state;
}

export function normalizeProbabilities(
  states
) {
  if (!Array.isArray(states)) {
    return [];
  }

  const valid = states
    .filter(
      (state) =>
        state &&
        isValidCoordinate(
          state.row,
          state.col
        ) &&
        Number.isFinite(
          Number(state.probability)
        ) &&
        Number(state.probability) >= 0
    )
    .slice(
      0,
      MAX_SUPERPOSITION_STATES
    );

  if (valid.length === 0) {
    return [];
  }

  const total =
    valid.reduce(
      (sum, state) =>
        sum +
        Number(state.probability),
      0
    );

  if (
    !Number.isFinite(total) ||
    total <= 0
  ) {
    const equal =
      1 / valid.length;

    return valid.map((state) => ({
      row: state.row,
      col: state.col,
      probability: equal,
    }));
  }

  return valid.map((state) => ({
    row: state.row,
    col: state.col,

    probability:
      Number(state.probability) / total,
  }));
}

function secureGameRandom() {
  // This randomness is for educational gameplay,
  // NOT cryptographic key generation.
  //
  // Math.random() is acceptable for game probability.
  //
  // Never use Math.random() for:
  // - tokens
  // - passwords
  // - session IDs
  // - encryption keys
  return Math.random();
}

function weightedRandomIndex(states) {
  const normalized =
    normalizeProbabilities(states);

  if (normalized.length === 0) {
    return -1;
  }

  const random =
    secureGameRandom();

  let cumulative = 0;

  for (
    let index = 0;
    index < normalized.length;
    index += 1
  ) {
    cumulative +=
      normalized[index].probability;

    if (
      random <= cumulative ||
      index === normalized.length - 1
    ) {
      return index;
    }
  }

  return normalized.length - 1;
}

export function measureQuantumState(
  state,
  level
) {
  if (
    !state ||
    state.completed ||
    state.mode !== QUANTUM_MODE.SUPERPOSED
  ) {
    return state;
  }

  if (!level?.availablePowers?.measure) {
    return state;
  }

  /*
   * Measurement must only collapse into a position
   * that is legal for a CLASSICAL player.
   *
   * A superposed branch may temporarily occupy a
   * quantum barrier. A classical player may not.
   *
   * Therefore:
   * 1. Remove branches that cannot support collapse.
   * 2. Renormalize the remaining probabilities.
   * 3. Perform weighted measurement.
   */
  const collapsibleStates =
    normalizeProbabilities(
      (state.superposition ?? []).filter(
        (branch) =>
          branch &&
          canOccupyCell(
            level,
            branch.row,
            branch.col,
            QUANTUM_MODE.CLASSICAL
          )
      )
    );

  if (collapsibleStates.length === 0) {
    /*
     * No legal classical collapse location.
     * Leave the quantum state unchanged.
     */
    return state;
  }

  const selectedIndex =
    weightedRandomIndex(
      collapsibleStates
    );

  if (
    selectedIndex < 0 ||
    selectedIndex >=
      collapsibleStates.length
  ) {
    return state;
  }

  const selected =
    collapsibleStates[selectedIndex];

  /*
   * Measurement may land on an entangled cell.
   * Resolve the teleport, but validate the destination
   * before trusting the lookup table.
   */
  const teleported =
    applyTeleport(
      selected.row,
      selected.col,
      state.entanglements
    );

  const finalPosition =
    canOccupyCell(
      level,
      teleported.row,
      teleported.col,
      QUANTUM_MODE.CLASSICAL
    )
      ? teleported
      : {
          row: selected.row,
          col: selected.col,
        };

  const completed =
    isGoal(
      level,
      finalPosition.row,
      finalPosition.col
    );

  return Object.freeze({
    ...state,

    mode:
      QUANTUM_MODE.CLASSICAL,

    player: Object.freeze({
      row: finalPosition.row,
      col: finalPosition.col,
    }),

    superposition:
      Object.freeze([]),

    measurementsUsed:
      state.measurementsUsed + 1,

    completed,
  });
}
export function beginEntanglementSelection(
  state,
  level
) {
  if (
    !state ||
    state.completed ||
    !level?.availablePowers?.entangle
  ) {
    return state;
  }

  if (
    state.mode ===
    QUANTUM_MODE.SUPERPOSED
  ) {
    // Player must measure first.
    return state;
  }

  return Object.freeze({
    ...state,

    mode:
      QUANTUM_MODE.ENTANGLE_SELECT,

    entangleSelection: null,
  });
}

function countEntanglementPairs(
  entanglements
) {
  if (
    !entanglements ||
    typeof entanglements !== "object"
  ) {
    return 0;
  }

  return (
    Object.keys(entanglements).length / 2
  );
}

export function selectEntanglementCell(
  state,
  level,
  row,
  col
) {
  if (
    !state ||
    state.completed ||
    state.mode !==
      QUANTUM_MODE.ENTANGLE_SELECT
  ) {
    return state;
  }

  if (
    !isValidCoordinate(row, col) ||
    !canOccupyCell(
      level,
      row,
      col,
      QUANTUM_MODE.CLASSICAL
    )
  ) {
    return state;
  }

  const selectedKey =
    coordinateKey(row, col);

  if (!selectedKey) {
    return state;
  }

  // First selection.
  if (!state.entangleSelection) {
    return Object.freeze({
      ...state,
      entangleSelection: selectedKey,
    });
  }

  const firstKey =
    state.entangleSelection;

  // Cannot entangle a cell with itself.
  if (firstKey === selectedKey) {
    return state;
  }

  const currentPairs =
    countEntanglementPairs(
      state.entanglements
    );

  if (
    currentPairs >=
    MAX_ENTANGLEMENT_PAIRS
  ) {
    return Object.freeze({
      ...state,

      mode:
        QUANTUM_MODE.CLASSICAL,

      entangleSelection: null,
    });
  }

  const firstCell =
    parseCoordinateKey(firstKey);

  if (!firstCell) {
    return Object.freeze({
      ...state,

      mode:
        QUANTUM_MODE.CLASSICAL,

      entangleSelection: null,
    });
  }

  if (
    !canOccupyCell(
      level,
      firstCell.row,
      firstCell.col,
      QUANTUM_MODE.CLASSICAL
    )
  ) {
    return state;
  }

  const safePairs = {
    ...(state.entanglements ?? {}),
  };

  // Remove any previous pair involving either cell.
  for (
    const [key, value]
    of Object.entries(safePairs)
  ) {
    if (
      key === firstKey ||
      key === selectedKey ||
      value === firstKey ||
      value === selectedKey
    ) {
      delete safePairs[key];
    }
  }

  safePairs[firstKey] =
    selectedKey;

  safePairs[selectedKey] =
    firstKey;

  return Object.freeze({
    ...state,

    mode:
      QUANTUM_MODE.CLASSICAL,

    entanglements:
      Object.freeze(safePairs),

    entangleSelection: null,

    entanglementsCreated:
      state.entanglementsCreated + 1,
  });
}

export function cancelEntanglementSelection(
  state
) {
  if (
    !state ||
    state.mode !==
      QUANTUM_MODE.ENTANGLE_SELECT
  ) {
    return state;
  }

  return Object.freeze({
    ...state,

    mode:
      QUANTUM_MODE.CLASSICAL,

    entangleSelection: null,
  });
}

export function getStateProbabilityPercent(
  probability
) {
  const safe =
    Number(probability);

  if (
    !Number.isFinite(safe) ||
    safe < 0
  ) {
    return 0;
  }

  return Math.round(
    Math.min(1, safe) * 100
  );
}