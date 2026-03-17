const SESSION_LENGTH = 95;
const INTRO_FADE_OUT = 1.8;
const INTRO_HOLD = 0.5;
const INTRO_FADE_IN = 1.8;
const PLAYER_SPEED = 8.6;
const GHOST_SPEED = 5.6;
const GHOST_FRIGHT_SPEED = 4.1;
const GHOST_DEAD_SPEED = 8.6;
const FRIGHT_DURATION = 6.8;
const RESET_DELAY = 1.15;
const TASK_SCORE = 10;
const FIX_SCORE = 50;
const HANGAR_EXTERIOR_METAL = "#959a94";
const STUDIO_FLOOR_BASE = "#d7d1c5";
const STUDIO_FLOOR_ALT = "#cbc4b9";
const STUDIO_FLOOR_GROUT = "#b8b0a5";
const STUDIO_WALL_STROKE = "#6f7570";

// # = wall, . = task, o = emergency fix, P = player spawn, A-D = problem spawns
const MAZE_ROWS = [
  "###################",
  "#o........#......o#",
  "#.###.###.#.###.#.#",
  "#...#.....#...#...#",
  "###.#.###.#.#.###.#",
  "#...#.#.....#.....#",
  "#.###.#.###.###.#.#",
  "#.....#.ABCD....#.#",
  "#.###.#.###.###.#.#",
  "#.#...#..P..#...#.#",
  "#.#.###.#.###.###.#",
  "#...#...#.....#...#",
  "#.###.#.#####.#.#.#",
  "#.....#...#...#.#.#",
  "#.#####.#.#.###.#.#",
  "#o......#........o#",
  "###################",
];

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE_DIRECTION = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const KEY_TO_DIRECTION = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

const STUDIO_ZONES = [
  { label: "WEST PROD DESK", x: 1, y: 1, w: 5, h: 5, kind: "deskPod" },
  { label: "CENTER BULLPEN", x: 6, y: 1, w: 6, h: 6, kind: "bullpen" },
  { label: "TYLER / CONTROL", x: 12, y: 1, w: 5, h: 6, kind: "control" },
  { label: "PODCAST STAGE", x: 6, y: 6, w: 8, h: 5, kind: "stage" },
  { label: "BEN / MICHAEL", x: 1, y: 11, w: 6, h: 5, kind: "deskPod" },
  { label: "MAX / STREAM", x: 10, y: 11, w: 7, h: 5, kind: "stream" },
];

const GHOST_TEMPLATES = [
  {
    id: "audio",
    label: "AF",
    title: "Audio Feedback",
    color: "#ff6a76",
    eye: "#fff4f6",
    behavior: "chase",
    scatter: { x: 16, y: 1 },
  },
  {
    id: "wifi",
    label: "WF",
    title: "WiFi Drop",
    color: "#54c6ff",
    eye: "#eff8ff",
    behavior: "ambush",
    scatter: { x: 1, y: 1 },
  },
  {
    id: "camera",
    label: "CD",
    title: "Camera Disconnect",
    color: "#ffbf57",
    eye: "#fff8ed",
    behavior: "guard",
    scatter: { x: 16, y: 13 },
  },
  {
    id: "lag",
    label: "SL",
    title: "Stream Lag",
    color: "#d98cff",
    eye: "#f8edff",
    behavior: "wander",
    scatter: { x: 1, y: 13 },
  },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${padNumber(minutes)}:${padNumber(secs)}`;
}

function toCellKey(x, y) {
  return `${x},${y}`;
}

function cellsEqual(a, b) {
  return a.x === b.x && a.y === b.y;
}

function manhattanDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function drawRoundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function fillRoundedRect(context, x, y, width, height, radius, fillStyle) {
  context.save();
  context.fillStyle = fillStyle;
  drawRoundedRect(context, x, y, width, height, radius);
  context.fill();
  context.restore();
}

function strokeRoundedRect(context, x, y, width, height, radius, strokeStyle, lineWidth = 1) {
  context.save();
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  drawRoundedRect(context, x, y, width, height, radius);
  context.stroke();
  context.restore();
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function parseMaze() {
  const walls = new Set();
  const tasks = new Set();
  const fixes = new Set();
  const ghostSpawns = [];
  let playerSpawn = { x: 9, y: 9 };

  MAZE_ROWS.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell === "#") {
        walls.add(toCellKey(x, y));
        return;
      }
      if (cell === ".") {
        tasks.add(toCellKey(x, y));
        return;
      }
      if (cell === "o") {
        fixes.add(toCellKey(x, y));
        return;
      }
      if (cell === "P") {
        playerSpawn = { x, y };
        return;
      }
      if ("ABCD".includes(cell)) {
        ghostSpawns.push({ x, y });
      }
    });
  });

  return {
    width: MAZE_ROWS[0].length,
    height: MAZE_ROWS.length,
    walls,
    tasks,
    fixes,
    playerSpawn,
    ghostSpawns,
  };
}

const MAZE = parseMaze();

class ProducerManAudio {
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

  playTone({ frequency, duration, gain = 0.02, type = "triangle", when = 0, slideTo = null }) {
    const context = this.ensureContext();
    if (!context) {
      return;
    }

    const start = context.currentTime + when;
    const end = start + duration;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo != null) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), end);
    }

    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }

  playStart() {
    this.playTone({ frequency: 420, duration: 0.08, gain: 0.018 });
    this.playTone({ frequency: 620, duration: 0.1, gain: 0.018, when: 0.05 });
    this.playTone({ frequency: 840, duration: 0.12, gain: 0.018, when: 0.11 });
  }

  playTask() {
    this.playTone({ frequency: 760, duration: 0.05, gain: 0.014, type: "sine" });
  }

  playFix() {
    this.playTone({ frequency: 510, duration: 0.08, gain: 0.018, type: "triangle" });
    this.playTone({ frequency: 710, duration: 0.09, gain: 0.018, type: "triangle", when: 0.06 });
    this.playTone({ frequency: 980, duration: 0.11, gain: 0.018, type: "triangle", when: 0.12 });
  }

  playGhostFix() {
    this.playTone({ frequency: 300, duration: 0.07, gain: 0.018, type: "square" });
    this.playTone({ frequency: 500, duration: 0.07, gain: 0.018, type: "square", when: 0.06 });
    this.playTone({ frequency: 780, duration: 0.09, gain: 0.02, type: "triangle", when: 0.12 });
  }

  playCrash() {
    this.playTone({ frequency: 240, duration: 0.18, gain: 0.024, type: "sawtooth", slideTo: 150 });
    this.playTone({ frequency: 180, duration: 0.24, gain: 0.02, type: "square", when: 0.05, slideTo: 120 });
  }

  playClear() {
    this.playTone({ frequency: 520, duration: 0.11, gain: 0.02 });
    this.playTone({ frequency: 780, duration: 0.14, gain: 0.02, when: 0.08 });
    this.playTone({ frequency: 1120, duration: 0.18, gain: 0.02, when: 0.16 });
  }
}

function buildResult({ reason, score, lives, tasksCleared, ghostFixes, bestChain, timeLeft, timeBonus }) {
  let rank = "Associate Producer";
  if (score >= 1800 && ghostFixes >= 2) {
    rank = "Control Room Closer";
  }
  if (reason === "clear" && score >= 2600 && lives >= 2) {
    rank = "Segment Saver";
  }
  if (reason === "clear" && score >= 3400 && bestChain >= 2 && timeLeft >= 20) {
    rank = "Producer-Man";
  }

  return {
    rank,
    summary:
      reason === "clear"
        ? `Studio stabilized with ${lives} lives left and ${timeLeft}s still on the clock.`
        : reason === "timeout"
          ? "The fixes ran long and the stream hit the wall."
          : "Too many disasters stacked up. The stream crashed.",
    chips: [
      `Score ${score}`,
      `Tasks ${tasksCleared}`,
      `Problem fixes ${ghostFixes}`,
      `Best chain ${bestChain}`,
      `Time bonus ${timeBonus}`,
    ],
  };
}

export class ProducerManOverlay {
  constructor({ root, onExit }) {
    this.root = root;
    this.onExit = onExit;
    this.audio = new ProducerManAudio();
    this.canvas = root.querySelector("#producerManCanvas");
    this.context = this.canvas?.getContext("2d");
    this.hostElement = root.querySelector("#producerManHost");
    this.startHostElement = root.querySelector("#producerManStartHost");
    this.introLineElement = root.querySelector("#producerManIntroLine");
    this.scoreElement = root.querySelector("#producerManScore");
    this.livesElement = root.querySelector("#producerManLives");
    this.tasksElement = root.querySelector("#producerManTasks");
    this.timerElement = root.querySelector("#producerManTimer");
    this.statusElement = root.querySelector("#producerManStatus");
    this.feedbackElement = root.querySelector("#producerManFeedback");
    this.statusPillElement = root.querySelector("#producerManStatusPill");
    this.footerElement = root.querySelector("#producerManFooter");
    this.legendElement = root.querySelector("#producerManLegend");
    this.startOverlayElement = root.querySelector("#producerManStart");
    this.startButton = root.querySelector("#producerManStartButton");
    this.exitButton = root.querySelector("#producerManExitButton");
    this.replayButton = root.querySelector("#producerManReplayButton");
    this.resultElement = root.querySelector("#producerManResult");
    this.resultRankElement = root.querySelector("#producerManResultRank");
    this.resultSummaryElement = root.querySelector("#producerManResultSummary");
    this.resultStatsElement = root.querySelector("#producerManResultStats");
    this.resultExitButton = root.querySelector("#producerManResultExitButton");

    this.active = false;
    this.phase = "hidden";
    this.phaseTime = 0;
    this.elapsed = 0;
    this.introLine = "Run the floor, grab the fixes, and stop the disasters from eating the broadcast.";
    this.hostName = "Production";
    this.fadeAlpha = 0;
    this.introOverlayAlpha = 0;
    this.cabinetVisible = false;
    this.feedback = { text: "", tone: "neutral", remaining: 0 };
    this.resultData = null;
    this.distanceCache = new Map();

    this.startButton?.addEventListener("click", () => this.beginRun());
    this.exitButton?.addEventListener("click", () => this.exit("exit"));
    this.replayButton?.addEventListener("click", () => this.start({
      hostName: this.hostName,
      introLine: this.introLine,
    }));
    this.resultExitButton?.addEventListener("click", () => this.exit("exit"));

    this.resetSession();
    this.populateLegend();
    this.sync();
  }

  populateLegend() {
    if (!this.legendElement) {
      return;
    }
    this.legendElement.innerHTML = `
      <div class="producer-man__legend-item"><span class="producer-man__legend-swatch producer-man__legend-swatch--task"></span> Mic check, framing, lighting, audio, guest mics, title cards</div>
      <div class="producer-man__legend-item"><span class="producer-man__legend-swatch producer-man__legend-swatch--fix"></span> Emergency fixes trigger a studio-wide reset window</div>
      <div class="producer-man__legend-item"><span class="producer-man__legend-swatch producer-man__legend-swatch--ghost"></span> AF / WF / CD / SL are the disasters hunting the floor</div>
    `;
  }

  resetSession() {
    this.score = 0;
    this.lives = 3;
    this.tasks = new Set(MAZE.tasks);
    this.fixes = new Set(MAZE.fixes);
    this.tasksCleared = 0;
    this.ghostFixes = 0;
    this.bestGhostChain = 0;
    this.timeBonus = 0;
    this.elapsed = 0;
    this.frightTimer = 0;
    this.ghostChain = 0;
    this.queuedDirection = "left";
    this.feedback = { text: "", tone: "neutral", remaining: 0 };
    this.resultData = null;
    this.distanceCache.clear();
    this.player = this.createPlayer();
    this.ghosts = this.createGhosts();
    this.phase = "playing";
  }

  createPlayer() {
    return {
      cell: { ...MAZE.playerSpawn },
      nextCell: null,
      progress: 0,
      direction: "left",
      spawn: { ...MAZE.playerSpawn },
    };
  }

  createGhosts() {
    return GHOST_TEMPLATES.map((template, index) => {
      const spawn = MAZE.ghostSpawns[index] ?? MAZE.ghostSpawns[0];
      return {
        ...template,
        cell: { ...spawn },
        nextCell: null,
        progress: 0,
        direction: "left",
        spawn: { ...spawn },
        wanderTarget: { ...template.scatter },
        state: "normal",
      };
    });
  }

  start({
    hostName = "Production",
    introLine = "Run the floor, grab the fixes, and stop the disasters from eating the broadcast.",
  } = {}) {
    this.audio.ensureContext();
    this.hostName = hostName;
    this.introLine = introLine;
    this.active = true;
    this.root.classList.remove("forecast-frenzy--hidden");
    this.root.setAttribute("aria-hidden", "false");
    this.resetSession();
    this.phase = "intro";
    this.phaseTime = 0;
    this.introOverlayAlpha = 0;
    this.cabinetVisible = false;
    this.sync();
  }

  beginRun() {
    if (!this.active || this.phase !== "ready") {
      return;
    }
    this.audio.playStart();
    this.resetSession();
    this.phase = "playing";
    this.cabinetVisible = true;
    this.sync();
  }

  exit(reason = "exit") {
    if (!this.active) {
      return;
    }

    this.active = false;
    this.phase = "hidden";
    this.cabinetVisible = false;
    this.root.classList.add("forecast-frenzy--hidden");
    this.root.setAttribute("aria-hidden", "true");
    this.resultElement.hidden = true;

    if (typeof this.onExit === "function") {
      this.onExit({ reason });
    }
  }

  isOpenCell(cell) {
    return (
      cell.x >= 0 &&
      cell.x < MAZE.width &&
      cell.y >= 0 &&
      cell.y < MAZE.height &&
      !MAZE.walls.has(toCellKey(cell.x, cell.y))
    );
  }

  getNeighbor(cell, direction) {
    const vector = DIRECTIONS[direction];
    return {
      x: cell.x + vector.x,
      y: cell.y + vector.y,
    };
  }

  getOpenDirections(cell) {
    return Object.keys(DIRECTIONS).filter((direction) => this.isOpenCell(this.getNeighbor(cell, direction)));
  }

  getDistanceMap(targetCell) {
    const cacheKey = toCellKey(targetCell.x, targetCell.y);
    if (this.distanceCache.has(cacheKey)) {
      return this.distanceCache.get(cacheKey);
    }

    const distances = Array.from({ length: MAZE.height }, () => Array(MAZE.width).fill(Infinity));
    const queue = [{ ...targetCell }];
    distances[targetCell.y][targetCell.x] = 0;
    let index = 0;

    while (index < queue.length) {
      const cell = queue[index];
      index += 1;
      const currentDistance = distances[cell.y][cell.x];
      for (const direction of Object.keys(DIRECTIONS)) {
        const neighbor = this.getNeighbor(cell, direction);
        if (!this.isOpenCell(neighbor)) {
          continue;
        }
        if (distances[neighbor.y][neighbor.x] <= currentDistance + 1) {
          continue;
        }
        distances[neighbor.y][neighbor.x] = currentDistance + 1;
        queue.push(neighbor);
      }
    }

    this.distanceCache.set(cacheKey, distances);
    return distances;
  }

  setFeedback(text, tone = "neutral", duration = 0.88) {
    this.feedback = { text, tone, remaining: duration };
  }

  getPlayerDirection() {
    return this.queuedDirection ?? this.player.direction ?? "left";
  }

  getPlayerTarget(direction, distance = 2) {
    const vector = DIRECTIONS[direction] ?? DIRECTIONS.left;
    return {
      x: clamp(this.player.cell.x + vector.x * distance, 1, MAZE.width - 2),
      y: clamp(this.player.cell.y + vector.y * distance, 1, MAZE.height - 2),
    };
  }

  chooseGhostDirection(ghost) {
    const legal = this.getOpenDirections(ghost.cell);
    if (!legal.length) {
      return null;
    }

    let options = legal;
    const reverse = OPPOSITE_DIRECTION[ghost.direction];
    if (legal.length > 1 && reverse) {
      options = legal.filter((direction) => direction !== reverse);
    }
    if (!options.length) {
      options = legal;
    }

    if (ghost.state === "dead") {
      const distances = this.getDistanceMap(ghost.spawn);
      return this.pickShortestDirection(options, ghost.cell, distances);
    }

    if (this.frightTimer > 0) {
      return pickRandom(options);
    }

    let targetCell = ghost.scatter;
    if (ghost.behavior === "chase") {
      targetCell = this.player.cell;
    } else if (ghost.behavior === "ambush") {
      targetCell = this.getPlayerTarget(this.getPlayerDirection(), 3);
    } else if (ghost.behavior === "guard") {
      targetCell =
        manhattanDistance(ghost.cell, this.player.cell) < 6
          ? this.player.cell
          : ghost.scatter;
    } else if (ghost.behavior === "wander") {
      if (cellsEqual(ghost.cell, ghost.wanderTarget) || Math.random() < 0.08) {
        ghost.wanderTarget = this.getRandomOpenTaskCell() ?? ghost.scatter;
      }
      targetCell = ghost.wanderTarget;
    }

    const distances = this.getDistanceMap(targetCell);
    return this.pickShortestDirection(options, ghost.cell, distances);
  }

  pickShortestDirection(options, originCell, distances) {
    let bestDirection = options[0];
    let bestDistance = Infinity;
    options.forEach((direction) => {
      const neighbor = this.getNeighbor(originCell, direction);
      const distance = distances[neighbor.y]?.[neighbor.x] ?? Infinity;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestDirection = direction;
      }
    });
    return bestDirection;
  }

  getRandomOpenTaskCell() {
    const taskKeys = [...this.tasks];
    if (!taskKeys.length) {
      return null;
    }
    const [x, y] = pickRandom(taskKeys).split(",").map(Number);
    return { x, y };
  }

  choosePlayerDirection() {
    const legal = this.getOpenDirections(this.player.cell);
    if (!legal.length) {
      return null;
    }
    if (this.queuedDirection && legal.includes(this.queuedDirection)) {
      return this.queuedDirection;
    }
    if (this.player.direction && legal.includes(this.player.direction)) {
      return this.player.direction;
    }
    return null;
  }

  advanceActor(actor, speed, delta, chooser, onStepEnd) {
    let remaining = delta;
    while (remaining > 0) {
      if (!actor.nextCell) {
        const direction = chooser(actor);
        if (!direction) {
          actor.direction = null;
          actor.progress = 0;
          break;
        }
        actor.direction = direction;
        actor.nextCell = this.getNeighbor(actor.cell, direction);
        actor.progress = 0;
      }

      const timeToNextCell = (1 - actor.progress) / speed;
      if (remaining < timeToNextCell) {
        actor.progress += remaining * speed;
        remaining = 0;
        continue;
      }

      remaining -= timeToNextCell;
      actor.cell = actor.nextCell;
      actor.nextCell = null;
      actor.progress = 0;
      onStepEnd?.(actor);
    }
  }

  handlePlayerStep() {
    const cellKey = toCellKey(this.player.cell.x, this.player.cell.y);
    if (this.tasks.delete(cellKey)) {
      this.score += TASK_SCORE;
      this.tasksCleared += 1;
      this.audio.playTask();
    }

    if (this.fixes.delete(cellKey)) {
      this.score += FIX_SCORE;
      this.tasksCleared += 1;
      this.frightTimer = FRIGHT_DURATION;
      this.ghostChain = 0;
      this.setFeedback("STREAM STABLE", "fix");
      this.audio.playFix();
    }

    if (this.tasks.size === 0 && this.fixes.size === 0) {
      this.timeBonus = Math.max(0, Math.floor((SESSION_LENGTH - this.elapsed) * 8));
      this.score += this.timeBonus;
      this.finishRun("clear");
    }
  }

  handleGhostStep(ghost) {
    if (ghost.state === "dead" && cellsEqual(ghost.cell, ghost.spawn)) {
      ghost.state = "normal";
      ghost.direction = OPPOSITE_DIRECTION[ghost.direction] ?? "left";
    }
  }

  getActorRenderPosition(actor) {
    if (!actor.nextCell) {
      return { x: actor.cell.x, y: actor.cell.y };
    }
    return {
      x: lerp(actor.cell.x, actor.nextCell.x, actor.progress),
      y: lerp(actor.cell.y, actor.nextCell.y, actor.progress),
    };
  }

  resolveCollisions() {
    const playerPosition = this.getActorRenderPosition(this.player);
    for (const ghost of this.ghosts) {
      if (ghost.state === "dead") {
        continue;
      }
      const ghostPosition = this.getActorRenderPosition(ghost);
      const distance = Math.hypot(playerPosition.x - ghostPosition.x, playerPosition.y - ghostPosition.y);
      if (distance > 0.55) {
        continue;
      }

      if (this.frightTimer > 0) {
        ghost.state = "dead";
        ghost.nextCell = null;
        ghost.progress = 0;
        ghost.direction = OPPOSITE_DIRECTION[ghost.direction] ?? "left";
        this.ghostChain += 1;
        this.bestGhostChain = Math.max(this.bestGhostChain, this.ghostChain);
        const bonus = 200 * 2 ** (this.ghostChain - 1);
        this.score += bonus;
        this.ghostFixes += 1;
        this.setFeedback(`PROBLEM FIXED +${bonus}`, "fix");
        this.audio.playGhostFix();
        continue;
      }

      this.lives -= 1;
      this.audio.playCrash();
      if (this.lives <= 0) {
        this.finishRun("crash");
        return;
      }
      this.frightTimer = 0;
      this.ghostChain = 0;
      this.player = this.createPlayer();
      this.ghosts = this.createGhosts();
      this.phase = "resetting";
      this.phaseTime = RESET_DELAY;
      this.setFeedback("SIGNAL LOSS", "bad", RESET_DELAY);
      return;
    }
  }

  finishRun(reason) {
    if (this.phase === "result") {
      return;
    }
    this.phase = "result";
    this.resultData = buildResult({
      reason,
      score: this.score,
      lives: this.lives,
      tasksCleared: this.tasksCleared,
      ghostFixes: this.ghostFixes,
      bestChain: this.bestGhostChain,
      timeLeft: Math.max(0, Math.ceil(SESSION_LENGTH - this.elapsed)),
      timeBonus: this.timeBonus,
    });
    if (reason === "clear") {
      this.setFeedback("EPISODE STABILIZED", "good", 1.6);
      this.audio.playClear();
    } else {
      this.setFeedback(reason === "timeout" ? "STREAM MISSED SLOT" : "STREAM CRASHED", "bad", 1.6);
    }
    this.sync();
  }

  updatePlaying(delta) {
    this.elapsed += delta;
    this.feedback.remaining = Math.max(0, this.feedback.remaining - delta);
    this.frightTimer = Math.max(0, this.frightTimer - delta);
    this.distanceCache.clear();

    this.advanceActor(
      this.player,
      PLAYER_SPEED,
      delta,
      () => this.choosePlayerDirection(),
      () => this.handlePlayerStep(),
    );

    if (this.phase !== "playing") {
      this.sync();
      return;
    }

    this.ghosts.forEach((ghost) => {
      const speed = ghost.state === "dead"
        ? GHOST_DEAD_SPEED
        : this.frightTimer > 0
          ? GHOST_FRIGHT_SPEED
          : GHOST_SPEED;

      this.advanceActor(
        ghost,
        speed,
        delta,
        (currentGhost) => this.chooseGhostDirection(currentGhost),
        (currentGhost) => this.handleGhostStep(currentGhost),
      );
    });

    this.resolveCollisions();

    if (this.phase !== "playing") {
      return;
    }

    if (this.elapsed >= SESSION_LENGTH) {
      this.finishRun("timeout");
      return;
    }

    this.sync();
  }

  syncResult() {
    const visible = this.phase === "result";
    if (this.resultElement) {
      this.resultElement.hidden = !visible;
    }
    if (!visible || !this.resultData) {
      return;
    }

    this.resultRankElement.textContent = this.resultData.rank;
    this.resultSummaryElement.textContent = this.resultData.summary;
    this.resultStatsElement.replaceChildren();
    this.resultData.chips.forEach((chip) => {
      const chipElement = document.createElement("div");
      chipElement.className = "forecast-frenzy__chip";
      chipElement.textContent = chip;
      this.resultStatsElement.append(chipElement);
    });
  }

  cellToPixel(originX, originY, tileSize, x, y) {
    return {
      x: originX + x * tileSize,
      y: originY + y * tileSize,
    };
  }

  drawDeskBlock(context, x, y, width, height, accent = "rgba(104, 164, 255, 0.55)") {
    fillRoundedRect(context, x, y, width, height, height * 0.18, "rgba(58, 57, 54, 0.82)");
    strokeRoundedRect(context, x, y, width, height, height * 0.18, "rgba(230, 226, 216, 0.24)", 1.2);
    fillRoundedRect(
      context,
      x + width * 0.16,
      y + height * 0.14,
      width * 0.68,
      height * 0.28,
      height * 0.08,
      "rgba(220, 226, 232, 0.16)",
    );
    fillRoundedRect(
      context,
      x + width * 0.28,
      y + height * 0.52,
      width * 0.44,
      height * 0.2,
      height * 0.08,
      "rgba(27, 30, 34, 0.86)",
    );
  }

  drawTripod(context, x, y, size, color = "#9aa6ba") {
    context.save();
    context.strokeStyle = color;
    context.lineWidth = Math.max(1, size * 0.08);
    context.beginPath();
    context.moveTo(x, y - size * 0.22);
    context.lineTo(x - size * 0.26, y + size * 0.28);
    context.moveTo(x, y - size * 0.22);
    context.lineTo(x, y + size * 0.34);
    context.moveTo(x, y - size * 0.22);
    context.lineTo(x + size * 0.26, y + size * 0.28);
    context.stroke();
    fillRoundedRect(
      context,
      x - size * 0.16,
      y - size * 0.32,
      size * 0.32,
      size * 0.16,
      size * 0.05,
      "rgba(22, 28, 41, 0.96)",
    );
    context.restore();
  }

  drawZoneDecor(context, zone, originX, originY, tileSize) {
    const zoneX = originX + zone.x * tileSize;
    const zoneY = originY + zone.y * tileSize;
    const zoneWidth = zone.w * tileSize;
    const zoneHeight = zone.h * tileSize;

    if (zone.kind === "deskPod") {
      this.drawDeskBlock(context, zoneX + zoneWidth * 0.12, zoneY + zoneHeight * 0.18, zoneWidth * 0.3, zoneHeight * 0.18);
      this.drawDeskBlock(context, zoneX + zoneWidth * 0.55, zoneY + zoneHeight * 0.18, zoneWidth * 0.26, zoneHeight * 0.18);
      this.drawDeskBlock(context, zoneX + zoneWidth * 0.24, zoneY + zoneHeight * 0.56, zoneWidth * 0.46, zoneHeight * 0.2);
      fillRoundedRect(context, zoneX + zoneWidth * 0.18, zoneY + zoneHeight * 0.44, zoneWidth * 0.1, zoneHeight * 0.1, zoneHeight * 0.05, "rgba(237, 242, 249, 0.38)");
      fillRoundedRect(context, zoneX + zoneWidth * 0.74, zoneY + zoneHeight * 0.44, zoneWidth * 0.1, zoneHeight * 0.1, zoneHeight * 0.05, "rgba(237, 242, 249, 0.38)");
      return;
    }

    if (zone.kind === "bullpen") {
      this.drawDeskBlock(context, zoneX + zoneWidth * 0.12, zoneY + zoneHeight * 0.18, zoneWidth * 0.28, zoneHeight * 0.16);
      this.drawDeskBlock(context, zoneX + zoneWidth * 0.6, zoneY + zoneHeight * 0.18, zoneWidth * 0.2, zoneHeight * 0.16);
      this.drawDeskBlock(context, zoneX + zoneWidth * 0.18, zoneY + zoneHeight * 0.58, zoneWidth * 0.22, zoneHeight * 0.14);
      this.drawDeskBlock(context, zoneX + zoneWidth * 0.56, zoneY + zoneHeight * 0.58, zoneWidth * 0.24, zoneHeight * 0.14);
      fillRoundedRect(context, zoneX + zoneWidth * 0.33, zoneY + zoneHeight * 0.38, zoneWidth * 0.34, zoneHeight * 0.12, zoneHeight * 0.05, "rgba(44, 46, 49, 0.76)");
      return;
    }

    if (zone.kind === "control") {
      fillRoundedRect(context, zoneX + zoneWidth * 0.12, zoneY + zoneHeight * 0.18, zoneWidth * 0.72, zoneHeight * 0.2, zoneHeight * 0.08, "rgba(59, 60, 57, 0.86)");
      for (let index = 0; index < 3; index += 1) {
        fillRoundedRect(
          context,
          zoneX + zoneWidth * (0.18 + index * 0.22),
          zoneY + zoneHeight * 0.22,
          zoneWidth * 0.16,
          zoneHeight * 0.1,
          zoneHeight * 0.04,
          "rgba(220, 226, 232, 0.16)",
        );
      }
      this.drawDeskBlock(context, zoneX + zoneWidth * 0.24, zoneY + zoneHeight * 0.54, zoneWidth * 0.42, zoneHeight * 0.18);
      this.drawTripod(context, zoneX + zoneWidth * 0.82, zoneY + zoneHeight * 0.72, zoneHeight * 0.28);
      return;
    }

    if (zone.kind === "stage") {
      const cx = zoneX + zoneWidth * 0.5;
      const cy = zoneY + zoneHeight * 0.53;
      const radius = Math.min(zoneWidth, zoneHeight) * 0.26;
      context.save();
      context.strokeStyle = "rgba(106, 107, 104, 0.55)";
      context.lineWidth = Math.max(2, radius * 0.08);
      context.beginPath();
      context.arc(cx, cy, radius * 1.22, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = "rgba(68, 62, 58, 0.42)";
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
      fillRoundedRect(context, cx - radius * 0.72, cy - radius * 0.12, radius * 1.44, radius * 0.24, radius * 0.08, "rgba(60, 58, 55, 0.88)");
      this.drawTripod(context, zoneX + zoneWidth * 0.18, zoneY + zoneHeight * 0.3, zoneHeight * 0.22, "#8d918e");
      this.drawTripod(context, zoneX + zoneWidth * 0.82, zoneY + zoneHeight * 0.3, zoneHeight * 0.22, "#8d918e");
      this.drawTripod(context, zoneX + zoneWidth * 0.18, zoneY + zoneHeight * 0.78, zoneHeight * 0.2, "#8d918e");
      fillRoundedRect(context, cx - radius * 0.7, cy - radius * 0.74, radius * 1.4, radius * 0.22, radius * 0.08, "rgba(255, 255, 255, 0.04)");
      return;
    }

    if (zone.kind === "stream") {
      this.drawDeskBlock(context, zoneX + zoneWidth * 0.1, zoneY + zoneHeight * 0.18, zoneWidth * 0.34, zoneHeight * 0.18);
      this.drawDeskBlock(context, zoneX + zoneWidth * 0.54, zoneY + zoneHeight * 0.18, zoneWidth * 0.26, zoneHeight * 0.18);
      fillRoundedRect(context, zoneX + zoneWidth * 0.18, zoneY + zoneHeight * 0.54, zoneWidth * 0.56, zoneHeight * 0.18, zoneHeight * 0.06, "rgba(44, 46, 49, 0.82)");
      fillRoundedRect(context, zoneX + zoneWidth * 0.24, zoneY + zoneHeight * 0.58, zoneWidth * 0.18, zoneHeight * 0.08, zoneHeight * 0.03, "rgba(220, 226, 232, 0.16)");
      fillRoundedRect(context, zoneX + zoneWidth * 0.46, zoneY + zoneHeight * 0.58, zoneWidth * 0.18, zoneHeight * 0.08, zoneHeight * 0.03, "rgba(220, 226, 232, 0.16)");
    }
  }

  draw() {
    if (!this.context || !this.canvas) {
      return;
    }

    const context = this.context;
    const width = this.canvas.width;
    const height = this.canvas.height;
    context.clearRect(0, 0, width, height);

    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#111315");
    gradient.addColorStop(1, "#0b0d0f");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    const tileSize = Math.min((width - 120) / MAZE.width, (height - 72) / MAZE.height);
    const boardWidth = tileSize * MAZE.width;
    const boardHeight = tileSize * MAZE.height;
    const originX = (width - boardWidth) / 2;
    const originY = (height - boardHeight) / 2;

    context.save();
    context.fillStyle = "rgba(239, 237, 230, 0.78)";
    context.font = `700 ${Math.max(13, tileSize * 0.46)}px "Avenir Next", sans-serif`;
    context.textAlign = "left";
    context.fillText("REAR HANGAR OPS MAP", originX, originY - 18);
    context.fillStyle = "rgba(220, 216, 208, 0.56)";
    context.font = `600 ${Math.max(9, tileSize * 0.26)}px "Avenir Next", sans-serif`;
    context.fillText("Production floor routing for live studio emergencies", originX, originY - 3);
    context.restore();

    MAZE_ROWS.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        const px = originX + x * tileSize;
        const py = originY + y * tileSize;
        if (cell === "#") {
          fillRoundedRect(
            context,
            px + tileSize * 0.08,
            py + tileSize * 0.08,
            tileSize * 0.84,
            tileSize * 0.84,
            tileSize * 0.18,
            HANGAR_EXTERIOR_METAL,
          );
          fillRoundedRect(
            context,
            px + tileSize * 0.16,
            py + tileSize * 0.16,
            tileSize * 0.68,
            tileSize * 0.2,
            tileSize * 0.08,
            "rgba(255, 255, 255, 0.12)",
          );
          strokeRoundedRect(
            context,
            px + tileSize * 0.08,
            py + tileSize * 0.08,
            tileSize * 0.84,
            tileSize * 0.84,
            tileSize * 0.18,
            STUDIO_WALL_STROKE,
            Math.max(1, tileSize * 0.03),
          );
          return;
        }

        fillRoundedRect(
          context,
          px + tileSize * 0.04,
          py + tileSize * 0.04,
          tileSize * 0.92,
          tileSize * 0.92,
          tileSize * 0.12,
          (x + y) % 2 === 0 ? STUDIO_FLOOR_BASE : STUDIO_FLOOR_ALT,
        );
        strokeRoundedRect(
          context,
          px + tileSize * 0.04,
          py + tileSize * 0.04,
          tileSize * 0.92,
          tileSize * 0.92,
          tileSize * 0.12,
          STUDIO_FLOOR_GROUT,
          Math.max(0.5, tileSize * 0.018),
        );
      });
    });

    STUDIO_ZONES.forEach((zone) => {
      const zoneX = originX + zone.x * tileSize;
      const zoneY = originY + zone.y * tileSize;
      const zoneWidth = zone.w * tileSize;
      const zoneHeight = zone.h * tileSize;
      strokeRoundedRect(context, zoneX, zoneY, zoneWidth, zoneHeight, tileSize * 0.2, "rgba(72, 72, 69, 0.32)", 1);
      this.drawZoneDecor(context, zone, originX, originY, tileSize);
      context.save();
      context.fillStyle = "rgba(86, 84, 78, 0.88)";
      context.font = `700 ${Math.max(8, tileSize * 0.18)}px "Avenir Next", sans-serif`;
      context.textAlign = "left";
      context.fillText(zone.label, zoneX + tileSize * 0.22, zoneY + tileSize * 0.42);
      context.restore();
    });

    this.tasks.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      const cx = originX + (x + 0.5) * tileSize;
      const cy = originY + (y + 0.5) * tileSize;
      context.save();
      fillRoundedRect(
        context,
        cx - tileSize * 0.11,
        cy - tileSize * 0.08,
        tileSize * 0.22,
        tileSize * 0.16,
        tileSize * 0.04,
        "rgba(86, 84, 78, 0.78)",
      );
      context.restore();
    });

    const pulse = 0.5 + Math.sin(this.elapsed * 7.4) * 0.18;
    this.fixes.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      const cx = originX + (x + 0.5) * tileSize;
      const cy = originY + (y + 0.5) * tileSize;
      context.save();
      context.fillStyle = "rgba(94, 249, 196, 0.22)";
      context.beginPath();
      context.arc(cx, cy, tileSize * (0.34 + pulse * 0.08), 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#5ef9c4";
      context.beginPath();
      context.arc(cx, cy, tileSize * 0.2, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "#0d3f3a";
      context.lineWidth = Math.max(1, tileSize * 0.06);
      context.beginPath();
      context.moveTo(cx - tileSize * 0.08, cy);
      context.lineTo(cx + tileSize * 0.08, cy);
      context.moveTo(cx, cy - tileSize * 0.08);
      context.lineTo(cx, cy + tileSize * 0.08);
      context.stroke();
      context.restore();
    });

    const player = this.getActorRenderPosition(this.player);
    const playerX = originX + (player.x + 0.5) * tileSize;
    const playerY = originY + (player.y + 0.5) * tileSize;
    const playerRadius = tileSize * 0.28;
    context.save();
    context.fillStyle = "#ffd05a";
    context.beginPath();
    context.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#1d232f";
    context.lineWidth = Math.max(1, tileSize * 0.08);
    context.beginPath();
    context.arc(playerX, playerY - tileSize * 0.02, playerRadius * 0.86, Math.PI * 1.08, Math.PI * 1.92);
    context.stroke();
    fillRoundedRect(
      context,
      playerX + playerRadius * 0.2,
      playerY - playerRadius * 0.2,
      tileSize * 0.2,
      tileSize * 0.15,
      tileSize * 0.03,
      "#7bc7ff",
    );
    fillRoundedRect(
      context,
      playerX - playerRadius * 0.88,
      playerY + playerRadius * 0.08,
      tileSize * 0.16,
      tileSize * 0.12,
      tileSize * 0.03,
      "#f4f6fb",
    );
    context.fillStyle = "#7f2633";
    context.fillRect(playerX - tileSize * 0.03, playerY + playerRadius * 0.05, tileSize * 0.06, tileSize * 0.14);
    context.restore();

    this.ghosts.forEach((ghost) => {
      const position = this.getActorRenderPosition(ghost);
      const cx = originX + (position.x + 0.5) * tileSize;
      const cy = originY + (position.y + 0.54) * tileSize;
      const widthScale = tileSize * 0.52;
      const heightScale = tileSize * 0.52;
      const frightened = this.frightTimer > 0 && ghost.state !== "dead";
      const fill = ghost.state === "dead"
        ? "#2b3140"
        : frightened
          ? "#4d7cf5"
          : ghost.color;

      context.save();
      context.fillStyle = fill;
      context.beginPath();
      context.moveTo(cx - widthScale * 0.5, cy + heightScale * 0.46);
      context.lineTo(cx - widthScale * 0.5, cy - heightScale * 0.02);
      context.quadraticCurveTo(cx - widthScale * 0.5, cy - heightScale * 0.58, cx, cy - heightScale * 0.58);
      context.quadraticCurveTo(cx + widthScale * 0.5, cy - heightScale * 0.58, cx + widthScale * 0.5, cy - heightScale * 0.02);
      context.lineTo(cx + widthScale * 0.5, cy + heightScale * 0.46);
      context.lineTo(cx + widthScale * 0.28, cy + heightScale * 0.28);
      context.lineTo(cx + widthScale * 0.08, cy + heightScale * 0.46);
      context.lineTo(cx - widthScale * 0.12, cy + heightScale * 0.28);
      context.lineTo(cx - widthScale * 0.34, cy + heightScale * 0.46);
      context.closePath();
      context.fill();

      context.fillStyle = ghost.state === "dead" ? "#f6f8ff" : ghost.eye;
      context.beginPath();
      context.arc(cx - widthScale * 0.16, cy - heightScale * 0.1, widthScale * 0.12, 0, Math.PI * 2);
      context.arc(cx + widthScale * 0.16, cy - heightScale * 0.1, widthScale * 0.12, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = ghost.state === "dead" ? "#ff5f71" : "#1a2231";
      context.beginPath();
      context.arc(cx - widthScale * 0.13, cy - heightScale * 0.08, widthScale * 0.05, 0, Math.PI * 2);
      context.arc(cx + widthScale * 0.19, cy - heightScale * 0.08, widthScale * 0.05, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "rgba(255, 255, 255, 0.92)";
      context.font = `700 ${Math.max(8, tileSize * 0.18)}px "Avenir Next", sans-serif`;
      context.textAlign = "center";
      context.fillText(frightened ? "!" : ghost.label, cx, cy + heightScale * 0.12);
      context.restore();
    });

    context.save();
    context.strokeStyle = this.frightTimer > 0 ? "rgba(94, 249, 196, 0.65)" : "rgba(255, 206, 110, 0.24)";
    context.lineWidth = 3;
    strokeRoundedRect(
      context,
      originX - 10,
      originY - 10,
      boardWidth + 20,
      boardHeight + 20,
      18,
      this.frightTimer > 0 ? "rgba(94, 249, 196, 0.55)" : "rgba(255, 206, 110, 0.24)",
      3,
    );
    context.restore();
  }

  sync() {
    this.root.dataset.visible = this.cabinetVisible ? "true" : "false";
    this.root.style.setProperty("--forecast-fade", this.fadeAlpha.toFixed(3));
    this.root.style.setProperty("--forecast-intro-overlay", this.introOverlayAlpha.toFixed(3));

    if (this.hostElement) {
      this.hostElement.textContent = `${this.hostName}'s Minigame`;
    }
    if (this.startHostElement) {
      this.startHostElement.textContent = `${this.hostName}'s Minigame`;
    }
    if (this.introLineElement) {
      this.introLineElement.textContent = this.introLine;
    }
    if (this.scoreElement) {
      this.scoreElement.textContent = String(this.score);
    }
    if (this.livesElement) {
      this.livesElement.textContent = String(this.lives);
    }
    if (this.tasksElement) {
      this.tasksElement.textContent = String(this.tasks.size + this.fixes.size);
    }
    if (this.timerElement) {
      this.timerElement.textContent = formatTime(SESSION_LENGTH - this.elapsed);
    }
    if (this.statusElement) {
      this.statusElement.textContent =
        this.phase === "playing"
          ? this.frightTimer > 0
            ? "Emergency Fix Live"
            : "On Air"
          : this.phase === "resetting"
            ? "Resetting Floor"
            : this.phase === "result"
              ? "Broadcast Closed"
              : this.phase === "ready"
                ? "Stand By"
                : "Loading";
    }
    if (this.feedbackElement) {
      const visible = this.feedback.remaining > 0;
      this.feedbackElement.textContent = visible ? this.feedback.text : "";
      this.feedbackElement.dataset.visible = visible ? "true" : "false";
      this.feedbackElement.dataset.tone = this.feedback.tone;
    }
    if (this.statusPillElement) {
      this.statusPillElement.textContent =
        this.phase === "playing"
          ? "Studio Live"
          : this.phase === "resetting"
            ? "Hold"
            : this.phase === "result"
              ? "Wrap"
              : this.phase === "ready"
                ? "Ready"
                : "Boot";
      this.statusPillElement.dataset.tone =
        this.phase === "playing" ? "live" : this.phase === "result" ? "result" : "standby";
    }
    if (this.footerElement) {
      if (this.phase === "intro") {
        this.footerElement.textContent = "Cueing the floor.";
      } else if (this.phase === "ready") {
        this.footerElement.textContent = "Click Start or press Enter / Space to run the studio.";
      } else if (this.phase === "resetting") {
        this.footerElement.textContent = "Signal reset in progress.";
      } else if (this.phase === "result") {
        this.footerElement.textContent = "Press Enter, Space, or R to run it back. Escape exits.";
      } else {
        this.footerElement.textContent = "Arrow keys or WASD move. Grab emergency fixes before the disasters box you in.";
      }
    }
    if (this.startOverlayElement) {
      const visible = this.phase === "ready";
      this.startOverlayElement.hidden = !visible;
      this.startOverlayElement.style.display = visible ? "" : "none";
    }

    this.syncResult();
    this.draw();
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

    if (this.phase === "result") {
      if ((event.code === "Enter" || event.code === "Space" || event.code === "KeyR") && !event.repeat) {
        event.preventDefault();
        this.start({ hostName: this.hostName, introLine: this.introLine });
        return true;
      }
      return false;
    }

    if (this.phase === "ready") {
      if ((event.code === "Enter" || event.code === "Space") && !event.repeat) {
        event.preventDefault();
        this.beginRun();
        return true;
      }
      return false;
    }

    if (this.phase === "intro") {
      return false;
    }

    const direction = KEY_TO_DIRECTION[event.code];
    if (!direction) {
      return false;
    }
    event.preventDefault();
    this.queuedDirection = direction;
    return true;
  }

  update(delta) {
    if (!this.active) {
      return;
    }

    if (this.phase === "intro") {
      this.phaseTime += delta;
      const totalIntro = INTRO_FADE_OUT + INTRO_HOLD + INTRO_FADE_IN;

      if (this.phaseTime >= totalIntro) {
        this.phase = "ready";
        this.phaseTime = 0;
        this.introOverlayAlpha = 0;
        this.cabinetVisible = true;
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

    if (this.phase === "ready" || this.phase === "result") {
      this.feedback.remaining = Math.max(0, this.feedback.remaining - delta);
      this.sync();
      return;
    }

    if (this.phase === "resetting") {
      this.phaseTime = Math.max(0, this.phaseTime - delta);
      this.feedback.remaining = Math.max(0, this.feedback.remaining - delta);
      if (this.phaseTime <= 0) {
        this.phase = "playing";
      }
      this.sync();
      return;
    }

    if (this.phase === "playing") {
      this.updatePlaying(delta);
    }
  }
}
