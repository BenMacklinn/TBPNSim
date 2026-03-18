const GRID_SIZE = 6;
const TARGET_TILE_ID = "T";
const EXIT_CELL = { x: 5, y: 2 };
const INTRO_FADE_OUT = 1.8;
const INTRO_HOLD = 0.5;
const INTRO_FADE_IN = 1.8;
const EXIT_DURATION = 0.34;
const MOVE_ANIMATION_TIME = 0.2;

const DIRECTION_OFFSETS = {
  L: { x: -1, y: 0 },
  R: { x: 1, y: 0 },
  U: { x: 0, y: -1 },
  D: { x: 0, y: 1 },
};

const TILE_META = {
  T: {
    accent: "target",
    author: "Tyler",
    handle: "@escapingtweet",
    body: "This red target tweet needs a clear line to EXIT.",
    tag: "target",
  },
  A: { accent: "green", author: "Theo", handle: "@theo", body: "Tall thread block.", tag: "1x3" },
  B: { accent: "blue", author: "Mina", handle: "@minacodes", body: "Short vertical post stack.", tag: "1x2" },
  C: { accent: "yellow", author: "Ari", handle: "@ariwrites", body: "Another vertical lane blocker.", tag: "1x3" },
  D: { accent: "red", author: "Claude", handle: "@claudeai", body: "Wide reply card.", tag: "2x1" },
  E: { accent: "green", author: "Max", handle: "@max", body: "Short tweet block.", tag: "2x1" },
  F: { accent: "blue", author: "Riley", handle: "@rileyloop", body: "Feature-size wide card.", tag: "3x1" },
  G: { accent: "yellow", author: "Bea", handle: "@beawave", body: "Narrow lane blocker.", tag: "1x2" },
  H: { accent: "green", author: "Lena", handle: "@lenaops", body: "Bottom row card.", tag: "2x1" },
  I: { accent: "red", author: "Owen", handle: "@owenproto", body: "Small blocker.", tag: "1x1" },
  J: { accent: "blue", author: "Jules", handle: "@juleswire", body: "Tiny utility post.", tag: "1x1" },
};

function blocksToPieces(blocks) {
  return blocks.map(([id, x, y, w, h]) => ({ id, x, y, w, h }));
}

export const SLIDING_PUZZLE_LEVELS = [
  {
    id: "easy-setup-1",
    name: "Easy Setup 1",
    targetId: TARGET_TILE_ID,
    exit: EXIT_CELL,
    pieces: blocksToPieces([
      ["T", 0, 2, 2, 1],
      ["A", 2, 0, 1, 3],
      ["B", 4, 0, 1, 2],
      ["C", 5, 1, 1, 3],
      ["D", 1, 3, 2, 1],
      ["E", 3, 3, 1, 2],
      ["F", 0, 4, 3, 1],
      ["G", 4, 4, 2, 1],
      ["H", 2, 5, 1, 1],
    ]),
  },
  {
    id: "easy-setup-2",
    name: "Easy Setup 2",
    targetId: TARGET_TILE_ID,
    exit: EXIT_CELL,
    pieces: blocksToPieces([
      ["T", 1, 2, 2, 1],
      ["A", 0, 0, 1, 3],
      ["B", 2, 0, 1, 2],
      ["C", 4, 0, 1, 3],
      ["D", 5, 1, 1, 2],
      ["E", 0, 3, 2, 1],
      ["F", 2, 3, 2, 1],
      ["G", 4, 3, 1, 2],
      ["H", 1, 4, 2, 1],
      ["I", 3, 4, 1, 1],
      ["J", 0, 5, 1, 1],
    ]),
  },
  {
    id: "easy-setup-3",
    name: "Easy Setup 3",
    targetId: TARGET_TILE_ID,
    exit: EXIT_CELL,
    pieces: blocksToPieces([
      ["T", 0, 2, 2, 1],
      ["A", 2, 0, 1, 2],
      ["B", 3, 0, 1, 3],
      ["C", 5, 0, 1, 2],
      ["D", 0, 0, 2, 1],
      ["E", 0, 3, 1, 2],
      ["F", 2, 3, 2, 1],
      ["G", 4, 2, 1, 3],
      ["H", 1, 4, 2, 1],
      ["I", 5, 3, 1, 2],
      ["J", 0, 5, 1, 1],
    ]),
  },
  {
    id: "easy-setup-4",
    name: "Easy Setup 4",
    targetId: TARGET_TILE_ID,
    exit: EXIT_CELL,
    pieces: blocksToPieces([
      ["T", 1, 2, 2, 1],
      ["A", 0, 0, 1, 3],
      ["B", 2, 0, 1, 2],
      ["C", 4, 0, 1, 2],
      ["D", 5, 1, 1, 3],
      ["E", 0, 3, 2, 1],
      ["F", 2, 3, 3, 1],
      ["G", 1, 4, 1, 2],
      ["H", 3, 4, 2, 1],
      ["I", 0, 5, 1, 1],
    ]),
  },
  {
    id: "easy-setup-5",
    name: "Easy Setup 5",
    targetId: TARGET_TILE_ID,
    exit: EXIT_CELL,
    pieces: blocksToPieces([
      ["T", 0, 2, 2, 1],
      ["A", 2, 0, 1, 3],
      ["B", 4, 0, 1, 2],
      ["C", 5, 0, 1, 3],
      ["D", 0, 0, 2, 1],
      ["E", 1, 3, 2, 1],
      ["F", 3, 3, 1, 2],
      ["G", 4, 3, 2, 1],
      ["H", 0, 4, 3, 1],
      ["I", 2, 5, 1, 1],
    ]),
  },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function formatTime(seconds) {
  const whole = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${padNumber(mins)}:${padNumber(secs)}`;
}

function calculateScore(elapsedSeconds) {
  return Math.max(100, Math.round(1000 - elapsedSeconds * 22));
}

function getScoreRank(score) {
  if (score >= 850) return "Lightning Clear";
  if (score >= 650) return "Fast Escape";
  if (score >= 450) return "Clean Getaway";
  return "Made It Out";
}

function getSubscriberPerformance(score) {
  return clamp((score - 100) / 900, 0, 1);
}

function clonePieces(pieces) {
  return pieces.map((piece) => ({ ...piece }));
}

function buildOccupancyGrid(pieces) {
  const grid = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
  for (const piece of pieces) {
    for (let dy = 0; dy < piece.h; dy += 1) {
      for (let dx = 0; dx < piece.w; dx += 1) {
        const x = piece.x + dx;
        const y = piece.y + dy;
        if (x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE || grid[y][x] !== null) {
          throw new Error(`Invalid piece layout for "${piece.id}" at (${piece.x}, ${piece.y}).`);
        }
        grid[y][x] = piece.id;
      }
    }
  }
  return grid;
}

function getMaxSlideDistance(piece, direction, occupancy) {
  const offset = DIRECTION_OFFSETS[direction];
  if (!offset) {
    return 0;
  }

  let distance = 0;

  while (true) {
    const nextDistance = distance + 1;

    if (offset.x < 0) {
      const nextX = piece.x - nextDistance;
      if (nextX < 0) break;
      let clear = true;
      for (let row = piece.y; row < piece.y + piece.h; row += 1) {
        if (occupancy[row][nextX] !== null) {
          clear = false;
          break;
        }
      }
      if (!clear) break;
    } else if (offset.x > 0) {
      const nextX = piece.x + piece.w - 1 + nextDistance;
      if (nextX >= GRID_SIZE) break;
      let clear = true;
      for (let row = piece.y; row < piece.y + piece.h; row += 1) {
        if (occupancy[row][nextX] !== null) {
          clear = false;
          break;
        }
      }
      if (!clear) break;
    } else if (offset.y < 0) {
      const nextY = piece.y - nextDistance;
      if (nextY < 0) break;
      let clear = true;
      for (let col = piece.x; col < piece.x + piece.w; col += 1) {
        if (occupancy[nextY][col] !== null) {
          clear = false;
          break;
        }
      }
      if (!clear) break;
    } else if (offset.y > 0) {
      const nextY = piece.y + piece.h - 1 + nextDistance;
      if (nextY >= GRID_SIZE) break;
      let clear = true;
      for (let col = piece.x; col < piece.x + piece.w; col += 1) {
        if (occupancy[nextY][col] !== null) {
          clear = false;
          break;
        }
      }
      if (!clear) break;
    }

    distance = nextDistance;
  }

  return distance;
}

function movePieceByDistance(pieces, pieceId, direction, distance) {
  const offset = DIRECTION_OFFSETS[direction];
  return pieces.map((piece) =>
    piece.id === pieceId
      ? { ...piece, x: piece.x + offset.x * distance, y: piece.y + offset.y * distance }
      : { ...piece },
  );
}

function createTileSnapshot(piece, occupancy) {
  const meta = TILE_META[piece.id];
  const legalMoves = {};
  for (const direction of Object.keys(DIRECTION_OFFSETS)) {
    const distance = getMaxSlideDistance(piece, direction, occupancy);
    if (distance > 0) {
      legalMoves[direction] = distance;
    }
  }

  return {
    id: piece.id,
    x: piece.x,
    y: piece.y,
    w: piece.w,
    h: piece.h,
    label: piece.id,
    type: piece.id === TARGET_TILE_ID ? "target" : "normal",
    accent: meta.accent,
    author: meta.author,
    handle: meta.handle,
    body: meta.body,
    tag: meta.tag,
    legalMoves,
    movable: Object.keys(legalMoves).length > 0,
  };
}

function validateLevel(level) {
  buildOccupancyGrid(level.pieces);
}

SLIDING_PUZZLE_LEVELS.forEach(validateLevel);

class SlidingPuzzleAudio {
  constructor() {
    this.context = null;
  }

  ensureContext() {
    if (!this.context) {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextCtor) {
        return null;
      }
      this.context = new AudioContextCtor();
    }
    if (this.context.state === "suspended") {
      this.context.resume().catch(() => {});
    }
    return this.context;
  }

  playTone({ frequency, duration, type = "square", gain = 0.04, when = 0 }) {
    const context = this.ensureContext();
    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const startAt = context.currentTime + when;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    envelope.gain.setValueAtTime(0.0001, startAt);
    envelope.gain.exponentialRampToValueAtTime(gain, startAt + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  }

  playSlide() {
    this.playTone({ frequency: 420, duration: 0.09, type: "triangle", gain: 0.025 });
  }

  playWin() {
    this.playTone({ frequency: 523.25, duration: 0.12, type: "triangle", gain: 0.03, when: 0 });
    this.playTone({ frequency: 659.25, duration: 0.14, type: "triangle", gain: 0.03, when: 0.08 });
    this.playTone({ frequency: 783.99, duration: 0.18, type: "triangle", gain: 0.032, when: 0.16 });
  }
}

class SlidingPuzzleState {
  constructor(levels) {
    this.levels = levels;
    this.level = levels[0];
    this.pieces = [];
    this.moves = 0;
    this.elapsed = 0;
    this.complete = false;
    this.randomizeLevel();
  }

  randomizeLevel() {
    const currentId = this.level?.id ?? null;
    const candidates = this.levels.length > 1
      ? this.levels.filter((level) => level.id !== currentId)
      : this.levels;
    this.level = candidates[Math.floor(Math.random() * candidates.length)] ?? this.levels[0];
    this.initialPieces = clonePieces(this.level.pieces);
    this.reset(false);
  }

  reset(preserveLevel = true) {
    if (!preserveLevel) {
      this.initialPieces = clonePieces(this.level.pieces);
    }
    this.pieces = clonePieces(this.initialPieces);
    this.moves = 0;
    this.elapsed = 0;
    this.complete = false;
  }

  tick(delta) {
    if (!this.complete) {
      this.elapsed += delta;
    }
  }

  getPiece(pieceId) {
    return this.pieces.find((piece) => piece.id === pieceId) ?? null;
  }

  getOccupancy() {
    return buildOccupancyGrid(this.pieces);
  }

  movePiece(pieceId, direction, requestedDistance = null) {
    const piece = this.getPiece(pieceId);
    if (!piece || this.complete) {
      return { moved: false, won: false };
    }

    const occupancy = this.getOccupancy();
    const maxDistance = getMaxSlideDistance(piece, direction, occupancy);
    if (maxDistance <= 0) {
      return { moved: false, won: false };
    }

    const distance = requestedDistance === null
      ? maxDistance
      : Math.max(1, Math.min(maxDistance, requestedDistance));

    this.pieces = movePieceByDistance(this.pieces, pieceId, direction, distance);
    this.moves += 1;
    const movedPiece = this.getPiece(pieceId);

    const won =
      pieceId === this.level.targetId &&
      this.level.exit.x >= movedPiece.x &&
      this.level.exit.x < movedPiece.x + movedPiece.w &&
      this.level.exit.y >= movedPiece.y &&
      this.level.exit.y < movedPiece.y + movedPiece.h;

    if (won) {
      this.complete = true;
    }

    return {
      moved: true,
      won,
      pieceId,
      direction,
      distance,
    };
  }

  createSnapshot({ animating = false, introLine = "" } = {}) {
    const occupancy = this.getOccupancy();
    const score = calculateScore(this.elapsed);
    const target = this.getPiece(this.level.targetId);
    const targetAtExit =
      target !== null &&
      this.level.exit.x >= target.x &&
      this.level.exit.x < target.x + target.w &&
      this.level.exit.y >= target.y &&
      this.level.exit.y < target.y + target.h;

    return {
      gridSize: GRID_SIZE,
      levelName: this.level.name,
      introLine,
      exit: { ...this.level.exit },
      moves: this.moves,
      elapsed: this.elapsed,
      elapsedText: formatTime(this.elapsed),
      score,
      scoreRank: getScoreRank(score),
      complete: this.complete,
      animating,
      targetAtExit,
      message: this.complete
        ? `Exit reached in ${this.moves} moves.`
        : "Drag a block in any open direction, or use a border rail to push it all the way.",
      resultTitle: this.complete ? `${getScoreRank(score)} • ${this.level.name}` : "",
      resultMeta: this.complete ? `${formatTime(this.elapsed)} • score ${score} • ${this.moves} moves` : "",
      tiles: this.pieces.map((piece) => createTileSnapshot(piece, occupancy)),
    };
  }
}

class SlidingPuzzleRenderer {
  constructor({ root, onTileSelect, onRestart, onExit }) {
    this.root = root;
    this.onTileSelect = onTileSelect;
    this.tileElements = new Map();
    this.lastSnapshot = null;
    this.boardElement = root.querySelector("#tylerBoardBoard");
    this.introLineElement = root.querySelector("#tylerBoardIntroLine");
    this.levelNameElement = root.querySelector("#tylerBoardLevelName");
    this.movesElement = root.querySelector("#tylerBoardMoves");
    this.timerElement = root.querySelector("#tylerBoardTimer");
    this.scoreElement = root.querySelector("#tylerBoardScore");
    this.messageElement = root.querySelector("#tylerBoardMessage");
    this.resultElement = root.querySelector("#tylerBoardResult");
    this.resultTitleElement = root.querySelector("#tylerBoardResultTitle");
    this.resultMetaElement = root.querySelector("#tylerBoardResultMeta");
    this.exitButton = root.querySelector("#tylerBoardExitButton");
    this.replayButton = root.querySelector("#tylerBoardReplayButton");
    this.resultExitButton = root.querySelector("#tylerBoardResultExitButton");

    this.cellsLayer = document.createElement("div");
    this.cellsLayer.className = "tyler-board__cells";
    this.tilesLayer = document.createElement("div");
    this.tilesLayer.className = "tyler-board__tiles";
    this.boardElement.append(this.cellsLayer, this.tilesLayer);
    this.cellElements = [];
    this.pointerSession = null;
    this.cellStep = 0;

    this.replayButton?.addEventListener("click", () => onRestart());
    this.resultExitButton?.addEventListener("click", () => onExit());
    this.exitButton?.addEventListener("click", () => onExit());

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.layoutTiles());
      this.resizeObserver.observe(this.boardElement);
    } else {
      window.addEventListener("resize", () => this.layoutTiles());
    }
  }

  ensureCells(gridSize, exit) {
    const requiredCount = gridSize * gridSize;
    if (this.cellElements.length !== requiredCount) {
      this.cellsLayer.replaceChildren();
      this.cellElements = [];
      for (let index = 0; index < requiredCount; index += 1) {
        const cell = document.createElement("div");
        cell.className = "tyler-board__cell";
        this.cellsLayer.append(cell);
        this.cellElements.push(cell);
      }
    }

    this.cellElements.forEach((cell, index) => {
      const x = index % gridSize;
      const y = Math.floor(index / gridSize);
      cell.dataset.exit = x === exit.x && y === exit.y ? "true" : "false";
      cell.textContent = x === exit.x && y === exit.y ? "EXIT" : "";
    });
  }

  pickDirectionFromPoint(event, legalMoves) {
    const entries = Object.entries(legalMoves);
    if (entries.length === 0) {
      return null;
    }
    if (entries.length === 1) {
      return entries[0][0];
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;

    if (relativeX < 0.35 && legalMoves.L) return "L";
    if (relativeX > 0.65 && legalMoves.R) return "R";
    if (relativeY < 0.35 && legalMoves.U) return "U";
    if (relativeY > 0.65 && legalMoves.D) return "D";

    const [bestDirection] = entries.sort((a, b) => b[1] - a[1])[0];
    return bestDirection;
  }

  handlePointerDown(event, tileElement, tileId) {
    if (event.button !== 0 || tileElement.dataset.movable !== "true") {
      return;
    }

    this.pointerSession = {
      pointerId: event.pointerId,
      tileId,
      startX: event.clientX,
      startY: event.clientY,
    };
    tileElement.setPointerCapture?.(event.pointerId);
  }

  handlePointerUp(event, tileElement, tileId) {
    const legalMoves = tileElement.dataset.legalMoves ? JSON.parse(tileElement.dataset.legalMoves) : {};
    if (!this.pointerSession || this.pointerSession.pointerId !== event.pointerId || !Object.keys(legalMoves).length) {
      this.pointerSession = null;
      return;
    }

    const deltaX = event.clientX - this.pointerSession.startX;
    const deltaY = event.clientY - this.pointerSession.startY;
    const dragThreshold = 18;
    let direction = null;
    let distance = null;

    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= dragThreshold) {
      if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        direction = deltaX >= 0 ? "R" : "L";
        if (!legalMoves[direction]) {
          direction = deltaY >= 0 ? "D" : "U";
        }
        if (direction && legalMoves[direction]) {
          distance = Math.max(1, Math.round(Math.abs(deltaX) / (this.cellStep || 1)));
        }
      } else {
        direction = deltaY >= 0 ? "D" : "U";
        if (!legalMoves[direction]) {
          direction = deltaX >= 0 ? "R" : "L";
        }
        if (direction && legalMoves[direction]) {
          distance = Math.max(1, Math.round(Math.abs(deltaY) / (this.cellStep || 1)));
        }
      }
    } else {
      direction = this.pickDirectionFromPoint(event, legalMoves);
      distance = null;
    }

    if (direction && legalMoves[direction]) {
      this.onTileSelect(tileId, direction, distance);
    }

    this.pointerSession = null;
    tileElement.releasePointerCapture?.(event.pointerId);
  }

  handleDirectionButtonClick(event, tileId, direction) {
    event.preventDefault();
    event.stopPropagation();
    this.pointerSession = null;
    this.onTileSelect(tileId, direction, null);
  }

  createTileElement(tile) {
    const tileElement = document.createElement("div");
    tileElement.className = "tyler-board__tile";
    tileElement.innerHTML = `
      <button type="button" class="tyler-board__direction tyler-board__direction--up" data-direction="U" aria-label="Push up"><span class="tyler-board__direction-line"></span></button>
      <button type="button" class="tyler-board__direction tyler-board__direction--right" data-direction="R" aria-label="Push right"><span class="tyler-board__direction-line"></span></button>
      <button type="button" class="tyler-board__direction tyler-board__direction--down" data-direction="D" aria-label="Push down"><span class="tyler-board__direction-line"></span></button>
      <button type="button" class="tyler-board__direction tyler-board__direction--left" data-direction="L" aria-label="Push left"><span class="tyler-board__direction-line"></span></button>
      <div class="tyler-board__tile-dragzone">
        ${tile.type === "target" ? '<div class="tyler-board__tile-callout">Target Tweet</div>' : ""}
        <div class="tyler-board__tile-card">
          <div class="tyler-board__tile-topbar">
            <div class="tyler-board__tile-meta">
              <span class="tyler-board__tile-badge">${tile.label}</span>
              <span class="tyler-board__tile-type">${tile.type === "target" ? "TARGET" : "TWEET"}</span>
            </div>
            <span class="tyler-board__tile-time">${tile.type === "target" ? "LIVE" : tile.w === 3 || tile.h === 3 ? "FEATURE" : "5:31"}</span>
          </div>
          <div class="tyler-board__tile-body">
            <div class="tyler-board__tile-author-row">
              <div class="tyler-board__tile-avatar">${tile.author.slice(0, 1).toUpperCase()}</div>
              <div class="tyler-board__tile-author-copy">
                <div class="tyler-board__tile-author-name">${tile.author}</div>
                <div class="tyler-board__tile-author-handle">${tile.handle}</div>
              </div>
            </div>
            <p class="tyler-board__tile-copy">${tile.body}</p>
          </div>
          <div class="tyler-board__tile-footer">
            <span class="tyler-board__tile-tag">${tile.tag}</span>
          </div>
        </div>
      </div>
    `;

    const dragZone = tileElement.querySelector(".tyler-board__tile-dragzone");
    dragZone?.addEventListener("pointerdown", (event) => this.handlePointerDown(event, tileElement, tile.id));
    dragZone?.addEventListener("pointerup", (event) => this.handlePointerUp(event, tileElement, tile.id));
    dragZone?.addEventListener("pointercancel", () => {
      this.pointerSession = null;
    });

    tileElement.querySelectorAll(".tyler-board__direction").forEach((control) => {
      control.addEventListener("click", (event) =>
        this.handleDirectionButtonClick(event, tile.id, control.dataset.direction),
      );
    });

    return tileElement;
  }

  sync(snapshot) {
    this.lastSnapshot = snapshot;
    this.ensureCells(snapshot.gridSize, snapshot.exit);

    if (this.introLineElement) {
      this.introLineElement.textContent = snapshot.introLine;
    }
    if (this.levelNameElement) {
      this.levelNameElement.textContent = snapshot.levelName;
    }
    if (this.movesElement) {
      this.movesElement.textContent = String(snapshot.moves);
    }
    if (this.timerElement) {
      this.timerElement.textContent = snapshot.elapsedText;
    }
    if (this.scoreElement) {
      this.scoreElement.textContent = String(snapshot.score);
    }
    if (this.messageElement) {
      this.messageElement.textContent = snapshot.message;
    }

    const liveIds = new Set(snapshot.tiles.map((tile) => tile.id));

    snapshot.tiles.forEach((tile) => {
      let element = this.tileElements.get(tile.id);
      if (!element) {
        element = this.createTileElement(tile);
        this.tileElements.set(tile.id, element);
        this.tilesLayer.append(element);
      }

      element.dataset.tileType = tile.type;
      element.dataset.accent = tile.accent;
      element.dataset.movable = tile.movable && !snapshot.animating && !snapshot.complete ? "true" : "false";
      element.dataset.legalMoves = JSON.stringify(tile.legalMoves);
      element.dataset.width = String(tile.w);
      element.dataset.height = String(tile.h);
      const tileEnabled = tile.movable && !snapshot.animating && !snapshot.complete;
      element.dataset.interactive = tileEnabled ? "true" : "false";

      const badge = element.querySelector(".tyler-board__tile-badge");
      const type = element.querySelector(".tyler-board__tile-type");
      const time = element.querySelector(".tyler-board__tile-time");
      const authorName = element.querySelector(".tyler-board__tile-author-name");
      const authorHandle = element.querySelector(".tyler-board__tile-author-handle");
      const copy = element.querySelector(".tyler-board__tile-copy");
      const tag = element.querySelector(".tyler-board__tile-tag");
      const avatar = element.querySelector(".tyler-board__tile-avatar");

      if (badge) badge.textContent = tile.label;
      if (type) type.textContent = tile.type === "target" ? "TARGET" : "TWEET";
      if (time) time.textContent = tile.type === "target" ? "LIVE" : tile.w === 3 || tile.h === 3 ? "FEATURE" : "5:31";
      if (authorName) authorName.textContent = tile.author;
      if (authorHandle) authorHandle.textContent = tile.handle;
      if (copy) copy.textContent = tile.body;
      if (tag) tag.textContent = tile.tag;
      if (avatar) avatar.textContent = tile.author.slice(0, 1).toUpperCase();

      element.querySelectorAll(".tyler-board__direction").forEach((control) => {
        const direction = control.dataset.direction;
        const allowed = tileEnabled && Boolean(tile.legalMoves[direction]);
        control.hidden = !allowed;
        control.disabled = !allowed;
      });

      element.style.setProperty("--tile-grid-x", String(tile.x));
      element.style.setProperty("--tile-grid-y", String(tile.y));
      element.style.setProperty("--tile-grid-w", String(tile.w));
      element.style.setProperty("--tile-grid-h", String(tile.h));
    });

    Array.from(this.tileElements.keys()).forEach((tileId) => {
      if (!liveIds.has(tileId)) {
        this.tileElements.get(tileId)?.remove();
        this.tileElements.delete(tileId);
      }
    });

    if (this.resultElement) {
      this.resultElement.hidden = !snapshot.complete;
    }
    if (this.resultTitleElement) {
      this.resultTitleElement.textContent = snapshot.resultTitle;
    }
    if (this.resultMetaElement) {
      this.resultMetaElement.textContent = snapshot.resultMeta;
    }

    this.layoutTiles();
  }

  layoutTiles() {
    if (!this.lastSnapshot) {
      return;
    }

    const gridSize = this.lastSnapshot.gridSize;
    const boardRect = this.boardElement.getBoundingClientRect();
    const gap = boardRect.width <= 520 ? 8 : 10;
    const cellSize = (boardRect.width - gap * (gridSize - 1)) / gridSize;

    this.boardElement.style.setProperty("--board-gap", `${gap}px`);
    this.boardElement.style.setProperty("--board-cell-size", `${cellSize}px`);
    this.cellStep = cellSize + gap;

    this.tileElements.forEach((element) => {
      const x = Number(element.style.getPropertyValue("--tile-grid-x"));
      const y = Number(element.style.getPropertyValue("--tile-grid-y"));
      const w = Number(element.style.getPropertyValue("--tile-grid-w")) || 1;
      const h = Number(element.style.getPropertyValue("--tile-grid-h")) || 1;
      const translateX = x * (cellSize + gap);
      const translateY = y * (cellSize + gap);
      const width = cellSize * w + gap * (w - 1);
      const height = cellSize * h + gap * (h - 1);
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
      element.style.transform = `translate(${translateX}px, ${translateY}px)`;
    });
  }
}

export class TylerBoardOverlay {
  constructor({ root, onExit, onRunComplete }) {
    this.root = root;
    this.onExit = onExit;
    this.onRunComplete = onRunComplete;
    this.audio = new SlidingPuzzleAudio();
    this.state = new SlidingPuzzleState(SLIDING_PUZZLE_LEVELS);
    this.renderer = new SlidingPuzzleRenderer({
      root,
      onTileSelect: (tileId, direction, distance) => this.handleTileSelect(tileId, direction, distance),
      onRestart: () => this.restartLevel(),
      onExit: () => this.exit("exit"),
    });
    this.active = false;
    this.phase = "hidden";
    this.phaseTime = 0;
    this.fadeAlpha = 0;
    this.introOverlayAlpha = 0;
    this.cabinetVisible = false;
    this.exitReason = "exit";
    this.introLine = "Drag blocks freely, or use the border rails to shove them.";
    this.animationTimeRemaining = 0;
    this.subscriberResult = null;

    this.sync();
  }

  createSnapshot() {
    const snapshot = this.state.createSnapshot({
      animating: this.animationTimeRemaining > 0,
      introLine: this.introLine,
    });
    if (snapshot.complete && this.subscriberResult) {
      snapshot.resultMeta = `${this.subscriberResult.totalText} • ${this.subscriberResult.shortDeltaText} • ${
        snapshot.elapsedText
      } • ${snapshot.moves} moves`;
    }
    return snapshot;
  }

  sync() {
    this.root.dataset.visible = this.cabinetVisible ? "true" : "false";
    this.root.dataset.alarm = "false";
    this.root.dataset.shake = "false";
    this.root.style.setProperty("--forecast-fade", this.fadeAlpha.toFixed(3));
    this.root.style.setProperty("--forecast-intro-overlay", this.introOverlayAlpha.toFixed(3));
    this.root.style.setProperty("--forecast-flash-opacity", "0");
    this.root.style.setProperty("--forecast-flash-color", "255,255,255");
    this.renderer.sync(this.createSnapshot());
  }

  start({ introLine = "Drag blocks freely, or use the border rails to shove them." } = {}) {
    this.audio.ensureContext();
    this.state.randomizeLevel();
    this.active = true;
    this.phase = "intro";
    this.phaseTime = 0;
    this.fadeAlpha = 0;
    this.introOverlayAlpha = 0;
    this.cabinetVisible = false;
    this.exitReason = "exit";
    this.introLine = introLine;
    this.subscriberResult = null;
    this.root.classList.remove("forecast-frenzy--hidden");
    this.root.setAttribute("aria-hidden", "false");
    this.sync();
  }

  exit(reason = "exit") {
    if (!this.active || this.phase === "transitionOut" || this.phase === "hidden") {
      return;
    }
    this.exitReason = reason;
    this.phase = "transitionOut";
    this.phaseTime = 0;
  }

  restartLevel() {
    this.audio.ensureContext();
    this.state.randomizeLevel();
    this.animationTimeRemaining = 0;
    this.subscriberResult = null;
    this.sync();
  }

  handleTileSelect(tileId, direction, distance = null) {
    if (!this.active || this.phase !== "visible" || this.animationTimeRemaining > 0) {
      return false;
    }

    this.audio.ensureContext();
    const result = this.state.movePiece(tileId, direction, distance);
    if (!result.moved) {
      return false;
    }

    this.animationTimeRemaining = MOVE_ANIMATION_TIME;
    this.audio.playSlide();
    if (result.won) {
      const snapshot = this.state.createSnapshot();
      this.subscriberResult =
        typeof this.onRunComplete === "function"
          ? this.onRunComplete({
              gameId: "tylerBoard",
              performance: getSubscriberPerformance(snapshot.score),
            })
          : null;
      this.audio.playWin();
    }
    this.sync();
    return true;
  }

  handleKeyDown(event) {
    if (!this.active) {
      return false;
    }
    if (event.code === "Escape") {
      event.preventDefault();
      this.exit("escape");
      return true;
    }
    return false;
  }

  update(delta) {
    if (!this.active) {
      return;
    }

    this.phaseTime += delta;
    this.animationTimeRemaining = Math.max(0, this.animationTimeRemaining - delta);

    if (this.phase === "intro") {
      const totalIntro = INTRO_FADE_OUT + INTRO_HOLD + INTRO_FADE_IN;
      if (this.phaseTime >= totalIntro) {
        this.phase = "visible";
        this.phaseTime = 0;
        this.cabinetVisible = true;
        this.introOverlayAlpha = 0;
        this.sync();
        return;
      }

      if (this.phaseTime < INTRO_FADE_OUT) {
        this.introOverlayAlpha = easeOutCubic(clamp(this.phaseTime / INTRO_FADE_OUT, 0, 1));
      } else if (this.phaseTime < INTRO_FADE_OUT + INTRO_HOLD) {
        this.introOverlayAlpha = 1;
        this.cabinetVisible = true;
      } else {
        const fadeInProgress = (this.phaseTime - INTRO_FADE_OUT - INTRO_HOLD) / INTRO_FADE_IN;
        this.introOverlayAlpha = 1 - easeOutCubic(clamp(fadeInProgress, 0, 1));
        this.cabinetVisible = true;
      }

      this.sync();
      return;
    }

    if (this.phase === "visible") {
      this.state.tick(delta);
      this.sync();
      return;
    }

    if (this.phase === "transitionOut") {
      const progress = clamp(this.phaseTime / EXIT_DURATION, 0, 1);
      this.fadeAlpha = lerp(0.18, 1, easeOutCubic(progress));
      this.cabinetVisible = progress < 0.92;
      this.sync();

      if (progress >= 1) {
        this.active = false;
        this.phase = "hidden";
        this.cabinetVisible = false;
        this.root.classList.add("forecast-frenzy--hidden");
        this.root.setAttribute("aria-hidden", "true");
        if (typeof this.onExit === "function") {
          this.onExit({ reason: this.exitReason });
        }
      }
    }
  }
}
