const BOARD_COLUMNS = 7;
const BOARD_ROWS = 20;
const PREVIEW_COUNT = 3;
const START_HOUR = 8;
const SCORE_BY_CLEAR = [0, 100, 300, 500, 800];

const PIECE_LIBRARY = {
  I: {
    color: "#4285f4",
    rotations: [
      [[0, 1], [1, 1], [2, 1], [3, 1]],
      [[2, 0], [2, 1], [2, 2], [2, 3]],
      [[0, 2], [1, 2], [2, 2], [3, 2]],
      [[1, 0], [1, 1], [1, 2], [1, 3]],
    ],
  },
  O: {
    color: "#34a853",
    rotations: [
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [2, 1]],
    ],
  },
  T: {
    color: "#a142f4",
    rotations: [
      [[1, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [2, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [1, 2]],
      [[1, 0], [0, 1], [1, 1], [1, 2]],
    ],
  },
  S: {
    color: "#12b5cb",
    rotations: [
      [[1, 0], [2, 0], [0, 1], [1, 1]],
      [[1, 0], [1, 1], [2, 1], [2, 2]],
      [[1, 1], [2, 1], [0, 2], [1, 2]],
      [[0, 0], [0, 1], [1, 1], [1, 2]],
    ],
  },
  Z: {
    color: "#ea4335",
    rotations: [
      [[0, 0], [1, 0], [1, 1], [2, 1]],
      [[2, 0], [1, 1], [2, 1], [1, 2]],
      [[0, 1], [1, 1], [1, 2], [2, 2]],
      [[1, 0], [0, 1], [1, 1], [0, 2]],
    ],
  },
  J: {
    color: "#fbbc04",
    rotations: [
      [[0, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [2, 0], [1, 1], [1, 2]],
      [[0, 1], [1, 1], [2, 1], [2, 2]],
      [[1, 0], [1, 1], [0, 2], [1, 2]],
    ],
  },
  L: {
    color: "#ff8c00",
    rotations: [
      [[2, 0], [0, 1], [1, 1], [2, 1]],
      [[1, 0], [1, 1], [1, 2], [2, 2]],
      [[0, 1], [1, 1], [2, 1], [0, 2]],
      [[0, 0], [1, 0], [1, 1], [1, 2]],
    ],
  },
};

const PERSON_CYCLE = [
  { label: "Sam Altman", detail: "CEO, OpenAI", shortLabel: "Altman" },
  { label: "Marc Benioff", detail: "Founder & CEO, Salesforce", shortLabel: "Benioff" },
  { label: "Brian Chesky", detail: "Co-founder & CEO, Airbnb", shortLabel: "Chesky" },
  { label: "Patrick Collison", detail: "Co-founder & CEO, Stripe", shortLabel: "Patrick" },
  { label: "John Collison", detail: "Co-founder & President, Stripe", shortLabel: "John" },
  { label: "Alex Karp", detail: "Co-founder & CEO, Palantir", shortLabel: "Karp" },
  { label: "Travis Kalanick", detail: "Founder, Uber; CEO, CloudKitchens", shortLabel: "Travis" },
  { label: "Evan Spiegel", detail: "Co-founder & CEO, Snap", shortLabel: "Spiegel" },
  { label: "Dara Khosrowshahi", detail: "CEO, Uber", shortLabel: "Dara" },
  { label: "Nikesh Arora", detail: "CEO, Palo Alto Networks", shortLabel: "Arora" },
  { label: "Aaron Levie", detail: "Co-founder & CEO, Box", shortLabel: "Levie" },
  { label: "Max Levchin", detail: "Co-founder, PayPal; CEO, Affirm", shortLabel: "Levchin" },
  { label: "Bill Gurley", detail: "Benchmark partner, legendary VC", shortLabel: "Gurley" },
  { label: "Ben Horowitz", detail: "Co-founder, Andreessen Horowitz", shortLabel: "Horowitz" },
  { label: "Joe Lonsdale", detail: "Co-founder, Palantir; Founder, 8VC", shortLabel: "Lonsdale" },
  { label: "Palmer Luckey", detail: "Founder, Oculus; Founder, Anduril", shortLabel: "Luckey" },
  { label: "Cathie Wood", detail: "Founder & CEO, ARK Invest", shortLabel: "Cathie" },
  { label: "Howard Marks", detail: "Co-founder, Oaktree Capital", shortLabel: "Marks" },
  { label: "Vlad Tenev", detail: "Co-founder & CEO, Robinhood", shortLabel: "Tenev" },
  { label: "Dylan Field", detail: "Co-founder & CEO, Figma", shortLabel: "Field" },
  { label: "Bryan Johnson", detail: "Founder, Braintree; Kernel / Blueprint", shortLabel: "Bryan" },
  { label: "Andrew Huberman", detail: "Stanford neuroscientist & major podcast host", shortLabel: "Huberman" },
  { label: "Ken Burns", detail: "Documentary filmmaker", shortLabel: "Burns" },
  { label: "Ben Thompson", detail: "Founder, Stratechery", shortLabel: "Thompson" },
  { label: "Matthew Prince", detail: "Co-founder & CEO, Cloudflare", shortLabel: "Prince" },
];

const PIECE_IDS = Object.keys(PIECE_LIBRARY);
const ROTATION_KICKS = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function shuffle(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${padNumber(mins)}:${padNumber(secs)}`;
}

function hexToRgba(hex, alpha) {
  const sanitized = hex.replace("#", "");
  const r = parseInt(sanitized.slice(0, 2), 16);
  const g = parseInt(sanitized.slice(2, 4), 16);
  const b = parseInt(sanitized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getContrastTextColor(hex) {
  const sanitized = hex.replace("#", "");
  const r = parseInt(sanitized.slice(0, 2), 16);
  const g = parseInt(sanitized.slice(2, 4), 16);
  const b = parseInt(sanitized.slice(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 160 ? "#1f2d49" : "#ffffff";
}

function createEmptyBoard() {
  return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLUMNS).fill(null));
}

function isSameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildWeekMeta(referenceDate = new Date()) {
  const base = new Date(referenceDate);
  base.setHours(12, 0, 0, 0);

  const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });
  const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "short" });
  const dayOfWeek = base.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(base);
  monday.setDate(base.getDate() + mondayOffset);

  const days = Array.from({ length: BOARD_COLUMNS }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      weekday: weekdayFormatter.format(date),
      month: monthFormatter.format(date),
      dateNumber: date.getDate(),
      today: isSameCalendarDay(date, base),
    };
  });

  const start = days[0];
  const end = days[days.length - 1];
  const weekLabel =
    start.month === end.month
      ? `${start.month} ${start.dateNumber} - ${end.dateNumber}`
      : `${start.month} ${start.dateNumber} - ${end.month} ${end.dateNumber}`;

  return {
    days,
    weekLabel,
    todayColumn: days.findIndex((day) => day.today),
  };
}

function buildTimeLabels() {
  return Array.from({ length: BOARD_ROWS }, (_, rowIndex) => {
    if (rowIndex % 2 !== 0) {
      return "";
    }
    const hour = START_HOUR + rowIndex / 2;
    const suffix = hour >= 12 ? "PM" : "AM";
    const normalizedHour = ((hour + 11) % 12) + 1;
    return `${normalizedHour}:00 ${suffix}`;
  });
}

function getCellsForPiece(piece) {
  const shape = PIECE_LIBRARY[piece.id]?.rotations[piece.rotation] ?? [];
  return shape.map(([x, y]) => ({
    x: piece.x + x,
    y: piece.y + y,
  }));
}

function buildResultData({ score, lines, level, elapsed }) {
  let rank = "Calendar Intern";
  if (lines >= 6 || score >= 1500) {
    rank = "Deputy Scheduler";
  }
  if (lines >= 10 || score >= 3000) {
    rank = "Calendar Enforcer";
  }
  if (lines >= 14 || score >= 4800) {
    rank = "War Room Coordinator";
  }
  if (lines >= 18 || score >= 6500) {
    rank = "TBPN Chief of Staff";
  }

  return {
    rank,
    summary: `${lines} time slots cleared in ${formatTime(elapsed)}.`,
    chips: [
      `Score ${score.toLocaleString()}`,
      `Level ${level}`,
      `Rows ${lines}`,
      `Time ${formatTime(elapsed)}`,
    ],
  };
}

class CalendarArcadeAudio {
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

  playTone({ frequency, duration, gain = 0.018, type = "triangle", when = 0, slideTo = null }) {
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

  playMove() {
    this.playTone({ frequency: 520, duration: 0.05, gain: 0.012, type: "sine" });
  }

  playRotate() {
    this.playTone({ frequency: 660, duration: 0.07, gain: 0.016, type: "triangle" });
  }

  playDrop() {
    this.playTone({ frequency: 210, duration: 0.08, gain: 0.017, type: "square", slideTo: 140 });
  }

  playClear(lineCount) {
    const frequencies = [523.25, 659.25, 783.99, 987.77];
    for (let index = 0; index < lineCount; index += 1) {
      this.playTone({
        frequency: frequencies[index],
        duration: 0.09 + index * 0.02,
        gain: 0.02,
        type: "triangle",
        when: index * 0.06,
      });
    }
  }

  playGameOver() {
    this.playTone({ frequency: 320, duration: 0.18, gain: 0.02, type: "sawtooth", slideTo: 180 });
    this.playTone({ frequency: 240, duration: 0.24, gain: 0.018, type: "sawtooth", when: 0.12, slideTo: 120 });
  }
}

export class NikChiefOfStaffOverlay {
  constructor({ root, onExit }) {
    this.root = root;
    this.onExit = onExit;
    this.audio = new CalendarArcadeAudio();

    this.introLineElement = root.querySelector("#nikChiefOfStaffIntroLine");
    this.weekLabelElement = root.querySelector("#nikChiefOfStaffWeekLabel");
    this.scoreElement = root.querySelector("#nikChiefOfStaffScore");
    this.levelElement = root.querySelector("#nikChiefOfStaffLevel");
    this.linesElement = root.querySelector("#nikChiefOfStaffLines");
    this.timerElement = root.querySelector("#nikChiefOfStaffTimer");
    this.statusElement = root.querySelector("#nikChiefOfStaffStatus");
    this.currentPieceElement = root.querySelector("#nikChiefOfStaffCurrentPiece");
    this.currentPieceTagElement = root.querySelector("#nikChiefOfStaffCurrentTag");
    this.statusPillElement = root.querySelector("#nikChiefOfStaffStatusPill");
    this.footerElement = root.querySelector("#nikChiefOfStaffFooter");
    this.dayHeaderElement = root.querySelector("#nikChiefOfStaffDayHeader");
    this.timeColumnElement = root.querySelector("#nikChiefOfStaffTimeColumn");
    this.boardElement = root.querySelector("#nikChiefOfStaffBoard");
    this.nextListElement = root.querySelector("#nikChiefOfStaffNext");
    this.resultElement = root.querySelector("#nikChiefOfStaffResult");
    this.resultRankElement = root.querySelector("#nikChiefOfStaffResultRank");
    this.resultSummaryElement = root.querySelector("#nikChiefOfStaffResultSummary");
    this.resultStatsElement = root.querySelector("#nikChiefOfStaffResultStats");
    this.exitButton = root.querySelector("#nikChiefOfStaffExitButton");
    this.replayButton = root.querySelector("#nikChiefOfStaffReplayButton");
    this.resultExitButton = root.querySelector("#nikChiefOfStaffResultExitButton");

    this.weekMeta = buildWeekMeta();
    this.timeLabels = buildTimeLabels();
    this.boardCells = [];
    this.lastQueueSignature = "";
    this.active = false;
    this.phase = "hidden";
    this.introLine = "Keep Nik's calendar clear.";

    this.exitButton?.addEventListener("click", () => this.exit("exit"));
    this.replayButton?.addEventListener("click", () => this.start({ introLine: this.introLine }));
    this.resultExitButton?.addEventListener("click", () => this.exit("exit"));

    this.buildChrome();
    this.resetState();
    this.sync();
  }

  buildChrome() {
    if (this.weekLabelElement) {
      this.weekLabelElement.textContent = this.weekMeta.weekLabel;
    }

    this.dayHeaderElement?.replaceChildren();
    this.weekMeta.days.forEach((day) => {
      const dayElement = document.createElement("div");
      dayElement.className = "nik-chief-of-staff__day";
      dayElement.dataset.today = day.today ? "true" : "false";
      dayElement.innerHTML = `
        <span class="nik-chief-of-staff__day-name">${day.weekday}</span>
        <span class="nik-chief-of-staff__day-date">${day.dateNumber}</span>
      `;
      this.dayHeaderElement?.append(dayElement);
    });

    this.timeColumnElement?.replaceChildren();
    this.timeLabels.forEach((label, rowIndex) => {
      const labelElement = document.createElement("div");
      labelElement.className = "nik-chief-of-staff__time-slot";
      labelElement.dataset.major = rowIndex % 2 === 0 ? "true" : "false";
      labelElement.textContent = label;
      this.timeColumnElement?.append(labelElement);
    });

    this.boardElement?.replaceChildren();
    this.boardCells = [];
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      for (let column = 0; column < BOARD_COLUMNS; column += 1) {
        const cell = document.createElement("div");
        cell.className = "nik-chief-of-staff__slot";
        cell.dataset.state = "empty";
        cell.dataset.major = row % 2 === 0 ? "true" : "false";
        cell.dataset.weekend = column >= 5 ? "true" : "false";
        cell.dataset.today = column === this.weekMeta.todayColumn ? "true" : "false";
        this.boardElement?.append(cell);
        this.boardCells.push({ row, column, element: cell });
      }
    }
  }

  resetState() {
    this.board = createEmptyBoard();
    this.queue = [];
    this.activePiece = null;
    this.personCursor = 0;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.elapsed = 0;
    this.dropAccumulator = 0;
    this.message = "Keep Nik's calendar clear.";
    this.resultData = null;
    this.lastQueueSignature = "";
  }

  start({ introLine = "Keep Nik's calendar clear." } = {}) {
    this.audio.ensureContext();
    this.introLine = introLine;
    this.resetState();
    this.message = introLine;
    this.active = true;
    this.phase = "playing";
    this.root.classList.remove("forecast-frenzy--hidden");
    this.root.setAttribute("aria-hidden", "false");
    this.resultElement.hidden = true;
    this.fillQueue();
    this.spawnPiece();
    this.sync();
  }

  exit(reason = "exit") {
    if (!this.active) {
      return;
    }

    this.active = false;
    this.phase = "hidden";
    this.root.classList.add("forecast-frenzy--hidden");
    this.root.setAttribute("aria-hidden", "true");
    this.resultElement.hidden = true;

    if (typeof this.onExit === "function") {
      this.onExit({ reason });
    }
  }

  fillQueue() {
    while (this.queue.length < PREVIEW_COUNT + 4) {
      const bag = shuffle(PIECE_IDS).map((id) => {
        const person = PERSON_CYCLE[this.personCursor % PERSON_CYCLE.length];
        this.personCursor += 1;
        return { id, person };
      });
      this.queue.push(...bag);
    }
  }

  spawnPiece() {
    this.fillQueue();
    const nextEntry = this.queue.shift();
    this.activePiece = {
      id: nextEntry.id,
      person: nextEntry.person,
      rotation: 0,
      x: Math.floor((BOARD_COLUMNS - 4) / 2),
      y: -1,
    };

    if (this.collides(this.activePiece)) {
      this.finishRun();
      return false;
    }

    return true;
  }

  collides(piece) {
    return getCellsForPiece(piece).some((cell) => {
      if (cell.x < 0 || cell.x >= BOARD_COLUMNS || cell.y >= BOARD_ROWS) {
        return true;
      }
      return cell.y >= 0 && Boolean(this.board[cell.y][cell.x]);
    });
  }

  moveActive(dx, dy) {
    if (!this.activePiece) {
      return false;
    }

    const candidate = {
      ...this.activePiece,
      x: this.activePiece.x + dx,
      y: this.activePiece.y + dy,
    };

    if (this.collides(candidate)) {
      return false;
    }

    this.activePiece = candidate;
    return true;
  }

  rotateActive(delta) {
    if (!this.activePiece) {
      return false;
    }

    const nextRotation = (this.activePiece.rotation + delta + 4) % 4;
    for (const [kickX, kickY] of ROTATION_KICKS) {
      const candidate = {
        ...this.activePiece,
        rotation: nextRotation,
        x: this.activePiece.x + kickX,
        y: this.activePiece.y + kickY,
      };
      if (!this.collides(candidate)) {
        this.activePiece = candidate;
        return true;
      }
    }

    return false;
  }

  getGhostPiece() {
    if (!this.activePiece) {
      return null;
    }

    const ghost = { ...this.activePiece };
    while (!this.collides({ ...ghost, y: ghost.y + 1 })) {
      ghost.y += 1;
    }
    return ghost;
  }

  getDropInterval() {
    return clamp(0.86 * Math.pow(0.87, this.level - 1), 0.08, 0.86);
  }

  hardDrop() {
    if (!this.activePiece || this.phase !== "playing") {
      return;
    }

    let distance = 0;
    while (this.moveActive(0, 1)) {
      distance += 1;
    }

    if (distance > 0) {
      this.score += distance * 2;
    }
    this.audio.playDrop();
    this.lockPiece();
  }

  lockPiece() {
    if (!this.activePiece) {
      return;
    }

    const lockedPiece = this.activePiece;
    const cells = getCellsForPiece(lockedPiece);

    if (cells.some((cell) => cell.y < 0)) {
      this.finishRun();
      return;
    }

    cells.forEach((cell) => {
      this.board[cell.y][cell.x] = { id: lockedPiece.id, person: lockedPiece.person };
    });
    this.activePiece = null;

    const clearedRows = [];
    for (let row = 0; row < BOARD_ROWS; row += 1) {
      if (this.board[row].every(Boolean)) {
        clearedRows.push(row);
      }
    }

    if (clearedRows.length > 0) {
      this.board = this.board.filter((_, rowIndex) => !clearedRows.includes(rowIndex));
      while (this.board.length < BOARD_ROWS) {
        this.board.unshift(Array(BOARD_COLUMNS).fill(null));
      }

      this.lines += clearedRows.length;
      this.score += SCORE_BY_CLEAR[clearedRows.length] * this.level;
      this.audio.playClear(clearedRows.length);

      if (clearedRows.length === 4) {
        this.message = "Calendar sweep. Four rows cleared.";
      } else {
        this.message = `${clearedRows.length} meeting row${clearedRows.length > 1 ? "s" : ""} cleared.`;
      }
    } else {
      this.message = `${lockedPiece.person.label} scheduled.`;
    }

    this.level = 1 + Math.floor(this.lines / 10);
    this.dropAccumulator = 0;
    this.spawnPiece();
  }

  finishRun() {
    if (!this.active) {
      return;
    }

    this.phase = "result";
    this.activePiece = null;
    this.message = "Calendar overflow. Nik is double-booked.";
    this.resultData = buildResultData({
      score: this.score,
      lines: this.lines,
      level: this.level,
      elapsed: this.elapsed,
    });
    this.audio.playGameOver();
    this.sync();
  }

  togglePause() {
    if (this.phase === "playing") {
      this.phase = "paused";
      this.message = "Calendar paused.";
      this.sync();
      return;
    }

    if (this.phase === "paused") {
      this.phase = "playing";
      this.dropAccumulator = 0;
      this.message = "Back on the grid.";
      this.sync();
    }
  }

  createBoardSnapshot() {
    const snapshot = new Map();

    this.board.forEach((row, rowIndex) => {
      row.forEach((cell, columnIndex) => {
        if (cell) {
          snapshot.set(`${rowIndex}:${columnIndex}`, {
            state: "locked",
            id: cell.id,
            person: cell.person,
          });
        }
      });
    });

    const ghostPiece = this.phase === "playing" ? this.getGhostPiece() : null;
    if (ghostPiece) {
      getCellsForPiece(ghostPiece).forEach((cell) => {
        if (cell.y < 0) {
          return;
        }
        const key = `${cell.y}:${cell.x}`;
        if (!snapshot.has(key)) {
          snapshot.set(key, {
            state: "ghost",
            id: ghostPiece.id,
            person: ghostPiece.person,
          });
        }
      });
    }

    if (this.activePiece) {
      getCellsForPiece(this.activePiece).forEach((cell) => {
        if (cell.y < 0) {
          return;
        }
        snapshot.set(`${cell.y}:${cell.x}`, {
          state: "active",
          id: this.activePiece.id,
          person: this.activePiece.person,
        });
      });
    }

    return snapshot;
  }

  syncBoard() {
    const snapshot = this.createBoardSnapshot();

    this.boardCells.forEach(({ row, column, element }) => {
      const cell = snapshot.get(`${row}:${column}`);
      if (!cell) {
        element.dataset.state = "empty";
        element.dataset.label = "";
        element.style.removeProperty("--slot-color");
        element.style.removeProperty("--slot-fill");
        element.style.removeProperty("--slot-border");
        element.style.removeProperty("--slot-shadow");
        element.style.removeProperty("--slot-text");
        return;
      }

      const pieceMeta = PIECE_LIBRARY[cell.id];
      const personMeta = cell.person;
      element.dataset.state = cell.state;
      element.dataset.label = personMeta?.label ?? "";
      element.style.setProperty("--slot-color", pieceMeta.color);
      element.style.setProperty(
        "--slot-fill",
        cell.state === "ghost" ? hexToRgba(pieceMeta.color, 0.14) : pieceMeta.color,
      );
      element.style.setProperty(
        "--slot-border",
        cell.state === "ghost" ? hexToRgba(pieceMeta.color, 0.54) : pieceMeta.color,
      );
      element.style.setProperty("--slot-shadow", hexToRgba(pieceMeta.color, 0.22));
      element.style.setProperty("--slot-text", getContrastTextColor(pieceMeta.color));
    });
  }

  syncQueue() {
    const signature = `${this.activePiece?.id ?? "none"}:${this.activePiece?.person?.label ?? "none"}|${this.queue
      .slice(0, PREVIEW_COUNT)
      .map((entry) => `${entry.id}:${entry.person.label}`)
      .join(",")}`;
    if (signature === this.lastQueueSignature) {
      return;
    }

    this.lastQueueSignature = signature;
    this.nextListElement?.replaceChildren();
    this.queue.slice(0, PREVIEW_COUNT).forEach((entry, index) => {
      const pieceMeta = PIECE_LIBRARY[entry.id];
      const personMeta = entry.person;
      const nextCard = document.createElement("div");
      nextCard.className = "nik-chief-of-staff__next-card";
      nextCard.style.setProperty("--event-color", pieceMeta.color);
      nextCard.style.setProperty("--event-fill", pieceMeta.color);
      nextCard.style.setProperty("--event-border", pieceMeta.color);

      nextCard.innerHTML = `
        <div class="nik-chief-of-staff__next-copy">
          <span class="nik-chief-of-staff__next-order">${index === 0 ? "Next up" : `Queue ${index + 1}`}</span>
          <strong>${personMeta.label}</strong>
          <span>${personMeta.detail}</span>
        </div>
        <div class="nik-chief-of-staff__mini-grid"></div>
      `;

      const miniGrid = nextCard.querySelector(".nik-chief-of-staff__mini-grid");
      const occupied = new Set(PIECE_LIBRARY[entry.id].rotations[0].map(([x, y]) => `${y}:${x}`));
      for (let row = 0; row < 4; row += 1) {
        for (let column = 0; column < 4; column += 1) {
          const miniCell = document.createElement("div");
          miniCell.className = "nik-chief-of-staff__mini-cell";
          miniCell.dataset.filled = occupied.has(`${row}:${column}`) ? "true" : "false";
          miniGrid?.append(miniCell);
        }
      }

      this.nextListElement?.append(nextCard);
    });
  }

  syncResult() {
    const visible = this.phase === "result";
    if (this.resultElement) {
      this.resultElement.hidden = !visible;
    }

    if (!visible || !this.resultData) {
      return;
    }

    if (this.resultRankElement) {
      this.resultRankElement.textContent = this.resultData.rank;
    }
    if (this.resultSummaryElement) {
      this.resultSummaryElement.textContent = this.resultData.summary;
    }
    if (this.resultStatsElement) {
      this.resultStatsElement.replaceChildren();
      this.resultData.chips.forEach((chip) => {
        const chipElement = document.createElement("div");
        chipElement.className = "forecast-frenzy__chip";
        chipElement.textContent = chip;
        this.resultStatsElement.append(chipElement);
      });
    }
  }

  sync() {
    this.root.dataset.visible = this.active ? "true" : "false";

    if (this.introLineElement) {
      this.introLineElement.textContent = this.introLine;
    }
    if (this.scoreElement) {
      this.scoreElement.textContent = this.score.toLocaleString();
    }
    if (this.levelElement) {
      this.levelElement.textContent = String(this.level);
    }
    if (this.linesElement) {
      this.linesElement.textContent = String(this.lines);
    }
    if (this.timerElement) {
      this.timerElement.textContent = formatTime(this.elapsed);
    }
    if (this.statusElement) {
      this.statusElement.textContent = this.message;
    }
    if (this.currentPieceElement) {
      this.currentPieceElement.textContent = this.activePiece ? this.activePiece.person.label : "Overflow";
    }
    if (this.currentPieceTagElement) {
      this.currentPieceTagElement.textContent = this.activePiece ? this.activePiece.person.shortLabel : "--";
    }
    if (this.statusPillElement) {
      if (this.phase === "paused") {
        this.statusPillElement.textContent = "Paused";
        this.statusPillElement.dataset.tone = "paused";
      } else if (this.phase === "result") {
        this.statusPillElement.textContent = "Overflow";
        this.statusPillElement.dataset.tone = "overflow";
      } else {
        this.statusPillElement.textContent = "Live";
        this.statusPillElement.dataset.tone = "live";
      }
    }
    if (this.footerElement) {
      if (this.phase === "result") {
        this.footerElement.textContent = "Press Enter or Space to restart. Escape exits.";
      } else if (this.phase === "paused") {
        this.footerElement.textContent = "Press P, Enter, or Space to resume. Escape exits.";
      } else {
        this.footerElement.textContent = "Arrows move. Up, R, or X rotates. Z rotates back. Space hard drops. P pauses.";
      }
    }

    this.syncBoard();
    this.syncQueue();
    this.syncResult();
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
      if ((event.code === "Enter" || event.code === "Space") && !event.repeat) {
        event.preventDefault();
        this.start({ introLine: this.introLine });
        return true;
      }
      if (event.code.startsWith("Arrow") || event.code === "Space") {
        event.preventDefault();
        return true;
      }
      return false;
    }

    if (event.code === "KeyP" && !event.repeat) {
      event.preventDefault();
      this.togglePause();
      return true;
    }

    if (this.phase === "paused") {
      if ((event.code === "Enter" || event.code === "Space") && !event.repeat) {
        event.preventDefault();
        this.togglePause();
        return true;
      }
      if (event.code.startsWith("Arrow") || event.code === "Space") {
        event.preventDefault();
        return true;
      }
      return false;
    }

    let handled = true;

    switch (event.code) {
      case "ArrowLeft":
      case "KeyA":
        if (this.moveActive(-1, 0)) {
          this.audio.playMove();
        }
        break;
      case "ArrowRight":
      case "KeyD":
        if (this.moveActive(1, 0)) {
          this.audio.playMove();
        }
        break;
      case "ArrowDown":
      case "KeyS":
        if (this.moveActive(0, 1)) {
          this.score += 1;
        } else {
          this.lockPiece();
        }
        break;
      case "ArrowUp":
      case "KeyW":
      case "KeyR":
      case "KeyX":
        if (this.rotateActive(1)) {
          this.audio.playRotate();
        }
        break;
      case "KeyZ":
      case "KeyQ":
        if (this.rotateActive(-1)) {
          this.audio.playRotate();
        }
        break;
      case "Space":
        this.hardDrop();
        break;
      default:
        handled = false;
        break;
    }

    if (!handled) {
      return false;
    }

    event.preventDefault();
    this.sync();
    return true;
  }

  update(delta) {
    if (!this.active) {
      return;
    }

    if (this.phase === "playing") {
      this.elapsed += delta;
      this.dropAccumulator += delta;
      const dropInterval = this.getDropInterval();
      while (this.dropAccumulator >= dropInterval && this.phase === "playing") {
        this.dropAccumulator -= dropInterval;
        if (!this.moveActive(0, 1)) {
          this.lockPiece();
          break;
        }
      }
      this.sync();
    }
  }
}
