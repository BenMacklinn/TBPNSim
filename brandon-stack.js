const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 1400;
const ARTICLE_WIDTH = 620;
const ARTICLE_LEFT = (CANVAS_WIDTH - ARTICLE_WIDTH) / 2;
const ARTICLE_RIGHT = ARTICLE_LEFT + ARTICLE_WIDTH;
const TOPBAR_TOP = 78;
const TOPBAR_HEIGHT = 58;
const PAPER_BOTTOM = 1328;
const IMAGE_SLICE_COUNT = 10;
const STACK_TARGET = IMAGE_SLICE_COUNT;
const RESULT_DELAY = 2;
const MOVING_SLICE_GAP = 4;
const DROP_SPEED = 1800;
const BASE_MOVE_SPEED = 280;
const MOVE_SPEED_STEP = 26;
const TRAVEL_MARGIN = 250;
const PERFECT_ALIGNMENT = 0.972;
const GREAT_ALIGNMENT = 0.9;
const GOOD_ALIGNMENT = 0.75;
const INTRO_LINE =
  "Stack real Brandon screenshot slices into one clean Substack draft. Space drops. Miss once and the draft dies.";

const SCREENSHOT_PATHS = [
  "./Substack1.png",
  "./Substack2.png",
  "./Substack3.png",
  "./Substack4.png",
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function drawRoundedRectPath(context, x, y, width, height, radius) {
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
  drawRoundedRectPath(context, x, y, width, height, radius);
  context.fill();
  context.restore();
}

function strokeRoundedRect(context, x, y, width, height, radius, strokeStyle, lineWidth = 1) {
  context.save();
  context.strokeStyle = strokeStyle;
  context.lineWidth = lineWidth;
  drawRoundedRectPath(context, x, y, width, height, radius);
  context.stroke();
  context.restore();
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function getQualityLabel(score) {
  if (score >= 0.93) {
    return "Publish-ready";
  }
  if (score >= 0.84) {
    return "Clean draft";
  }
  if (score >= 0.72) {
    return "Needs edits";
  }
  return "Off the rails";
}

function buildResult({ cleared, score, stackedSlices, perfectDrops, averageAlignment, widthRatio }) {
  const polishScore = clamp(averageAlignment * 0.56 + widthRatio * 0.44, 0, 1);
  const depthScore = clamp(stackedSlices / STACK_TARGET, 0, 1);
  const openRate = Math.round(clamp(24 + polishScore * 44 + depthScore * 10 + perfectDrops * 2.4, 16, 82));
  const subscriberGain = Math.max(
    4,
    Math.round(10 + polishScore * 48 + depthScore * 34 + perfectDrops * 5 - (1 - widthRatio) * 32),
  );
  const draftQuality = getQualityLabel(polishScore);

  let title = "Draft Survived";
  if (cleared && polishScore >= 0.92) {
    title = "Inbox Rocket";
  } else if (cleared && polishScore >= 0.84) {
    title = "Clean Publish";
  } else if (!cleared) {
    title = "Draft Missed";
  }

  const summary = cleared
    ? `Brandon shipped ${stackedSlices} slices and kept ${formatPercent(widthRatio * 100)} of the column intact.`
    : `The stack snapped after ${stackedSlices} clean drops. ${formatPercent(widthRatio * 100)} of the page width survived.`;

  return {
    title,
    summary,
    chips: [
      `Score ${score}`,
      `Perfect drops ${perfectDrops}`,
      `Avg align ${formatPercent(averageAlignment * 100)}`,
      `Width left ${formatPercent(widthRatio * 100)}`,
    ],
    metrics: [
      {
        label: "Open rate",
        value: `${openRate}%`,
        note: openRate >= 60 ? "Strong headline energy" : "Respectable, but not scorching",
      },
      {
        label: "Subscriber gain",
        value: `+${subscriberGain}`,
        note: subscriberGain >= 70 ? "Net new readers showed up" : "A few fresh signups, mostly loyalists",
      },
      {
        label: "Draft quality",
        value: draftQuality,
        note: `${formatPercent(polishScore * 100)} clean-score on the final page`,
      },
    ],
  };
}

function getSubscriberPerformance({ averageAlignment, widthRatio, stackedSlices }) {
  return clamp(
    averageAlignment * 0.35 + widthRatio * 0.35 + clamp(stackedSlices / STACK_TARGET, 0, 1) * 0.3,
    0,
    1,
  );
}

class BrandonStackAudio {
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
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.03);
  }

  playStart() {
    this.playTone({ frequency: 392, duration: 0.08, when: 0 });
    this.playTone({ frequency: 523, duration: 0.1, when: 0.05 });
    this.playTone({ frequency: 659, duration: 0.14, when: 0.11 });
  }

  playPerfect() {
    this.playTone({ frequency: 780, duration: 0.06, gain: 0.02, type: "triangle" });
    this.playTone({ frequency: 1046, duration: 0.08, gain: 0.02, type: "triangle", when: 0.05 });
    this.playTone({ frequency: 1396, duration: 0.11, gain: 0.018, type: "sine", when: 0.1 });
  }

  playTrim() {
    this.playTone({ frequency: 540, duration: 0.05, gain: 0.014, type: "triangle" });
    this.playTone({ frequency: 680, duration: 0.08, gain: 0.013, type: "triangle", when: 0.045 });
  }

  playMessy() {
    this.playTone({ frequency: 360, duration: 0.08, gain: 0.018, type: "square", slideTo: 250 });
    this.playTone({ frequency: 300, duration: 0.11, gain: 0.014, type: "square", when: 0.05, slideTo: 210 });
  }

  playMiss() {
    this.playTone({ frequency: 230, duration: 0.16, gain: 0.022, type: "sawtooth", slideTo: 140 });
    this.playTone({ frequency: 180, duration: 0.22, gain: 0.018, type: "square", when: 0.06, slideTo: 110 });
  }

  playPublish() {
    this.playTone({ frequency: 523, duration: 0.08, gain: 0.016, type: "triangle" });
    this.playTone({ frequency: 659, duration: 0.1, gain: 0.016, type: "triangle", when: 0.07 });
    this.playTone({ frequency: 784, duration: 0.14, gain: 0.016, type: "triangle", when: 0.14 });
    this.playTone({ frequency: 1046, duration: 0.18, gain: 0.015, type: "triangle", when: 0.22 });
  }
}

export class BrandonStackOverlay {
  constructor({ root, onExit, onRunComplete }) {
    this.root = root;
    this.onExit = onExit;
    this.onRunComplete = onRunComplete;
    this.audio = new BrandonStackAudio();
    this.canvas = root.querySelector("#brandonStackCanvas");
    if (this.canvas) {
      this.canvas.width = CANVAS_WIDTH;
      this.canvas.height = CANVAS_HEIGHT;
    }
    this.context = this.canvas?.getContext("2d");
    this.introLineElement = root.querySelector("#brandonStackIntroLine");
    this.roundElement = root.querySelector("#brandonStackRound");
    this.widthElement = root.querySelector("#brandonStackWidth");
    this.qualityElement = root.querySelector("#brandonStackQuality");
    this.feedbackElement = root.querySelector("#brandonStackFeedback");
    this.footerElement = root.querySelector("#brandonStackFooter");
    this.startOverlayElement = root.querySelector("#brandonStackStart");
    this.startButton = root.querySelector("#brandonStackStartButton");
    this.exitButton = root.querySelector("#brandonStackExitButton");
    this.resultElement = root.querySelector("#brandonStackResult");
    this.resultTitleElement = root.querySelector("#brandonStackResultTitle");
    this.resultSummaryElement = root.querySelector("#brandonStackResultSummary");
    this.resultMetricsElement = root.querySelector("#brandonStackResultMetrics");
    this.resultChipsElement = root.querySelector("#brandonStackResultChips");
    this.replayButton = root.querySelector("#brandonStackReplayButton");
    this.resultExitButton = root.querySelector("#brandonStackResultExitButton");

    this.active = false;
    this.phase = "hidden";
    this.images = [];
    this.imageStrips = [];
    this.nextImageIndex = 0;
    this.activeImageIndex = 0;
    this.deck = [];
    this.deckIndex = 0;
    this.paperTop = TOPBAR_TOP + TOPBAR_HEIGHT + 28;
    this.sliceDisplayHeight = 180;
    this.assetsReady = false;
    this.loadError = false;
    this.introLine = INTRO_LINE;
    this.score = 0;
    this.stackedSlices = 0;
    this.perfectDrops = 0;
    this.alignmentHistory = [];
    this.flash = 0;
    this.flashColor = "#54d5a2";
    this.feedback = { text: "", tone: "neutral", remaining: 0 };
    this.currentSlice = null;
    this.stack = [];
    this.fragments = [];
    this.resultData = null;
    this.pendingResult = null;
    this.subscriberResult = null;

    this.startButton?.addEventListener("click", () => this.beginRun());
    this.exitButton?.addEventListener("click", () => this.exit("exit"));
    this.replayButton?.addEventListener("click", () => this.start({ introLine: this.introLine }));
    this.resultExitButton?.addEventListener("click", () => this.exit("exit"));

    if (this.canvas) {
      this.canvas.addEventListener("click", () => {
        if (this.phase === "ready") {
          this.beginRun();
        } else if (this.phase === "playing") {
          this.dropCurrentSlice();
        }
      });
    }

    this.loadImages();
    this.sync();
    this.draw();
  }

  async loadImages() {
    if (this.imagePromise) {
      return this.imagePromise;
    }

    this.imagePromise = Promise.all(
      SCREENSHOT_PATHS.map((path) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load ${path}`));
        image.src = new URL(path, import.meta.url).href;
      })),
    )
      .then((images) => {
        this.images = images;
        this.imageStrips = this.buildStripPool(images);
        this.assetsReady = true;
        this.loadError = false;
        if (this.active && this.phase === "ready" && (!this.stack.length || !this.currentSlice?.image)) {
          this.prepareSession();
        }
        this.sync();
        this.draw();
        return images;
      })
      .catch((error) => {
        console.error(error);
        this.assetsReady = false;
        this.loadError = true;
        this.sync();
        this.draw();
        return [];
      });

    return this.imagePromise;
  }

  buildStripPool(images) {
    return images.map((image, imageIndex) => {
      const strips = [];
      for (let sliceIndex = IMAGE_SLICE_COUNT - 1; sliceIndex >= 0; sliceIndex -= 1) {
        const sourceY = Math.round((image.height * sliceIndex) / IMAGE_SLICE_COUNT);
        const sourceBottom = Math.round((image.height * (sliceIndex + 1)) / IMAGE_SLICE_COUNT);
        strips.push({
          imageIndex,
          sourceX: 0,
          sourceY,
          sourceWidth: image.width,
          sourceHeight: sourceBottom - sourceY,
        });
      }
      return strips;
    });
  }

  prepareDeck() {
    if (!this.imageStrips.length || !this.images.length) {
      this.activeImageIndex = 0;
      this.deck = [];
      this.deckIndex = 0;
      this.sliceDisplayHeight = 180;
      this.paperTop = TOPBAR_TOP + TOPBAR_HEIGHT + 28;
      return;
    }

    this.activeImageIndex = this.nextImageIndex % this.images.length;
    this.nextImageIndex = (this.nextImageIndex + 1) % this.images.length;
    this.deck = (this.imageStrips[this.activeImageIndex] ?? []).map((strip) => ({ ...strip }));
    this.deckIndex = 0;

    const activeImage = this.images[this.activeImageIndex];
    const sourceSliceHeight = this.deck[0]?.sourceHeight ?? activeImage.height / IMAGE_SLICE_COUNT;
    this.sliceDisplayHeight = Math.round((sourceSliceHeight / activeImage.width) * ARTICLE_WIDTH);
    this.paperTop = PAPER_BOTTOM - this.sliceDisplayHeight * IMAGE_SLICE_COUNT;
  }

  nextStrip() {
    if (!this.deck.length) {
      return {
        imageIndex: 0,
        sourceX: 0,
        sourceY: 0,
        sourceWidth: 1,
        sourceHeight: 1,
      };
    }

    const strip = this.deck[this.deckIndex] ?? this.deck[this.deck.length - 1];
    this.deckIndex = Math.min(this.deck.length, this.deckIndex + 1);
    return { ...strip };
  }

  getCurrentWidthRatio() {
    const activeWidth = this.currentSlice?.width ?? this.stack.at(-1)?.width ?? ARTICLE_WIDTH;
    return clamp(activeWidth / ARTICLE_WIDTH, 0, 1);
  }

  getAverageAlignment() {
    if (!this.alignmentHistory.length) {
      return 1;
    }
    return this.alignmentHistory.reduce((sum, value) => sum + value, 0) / this.alignmentHistory.length;
  }

  getLiveQualityScore() {
    return clamp(this.getAverageAlignment() * 0.58 + this.getCurrentWidthRatio() * 0.42, 0, 1);
  }

  getStackY(level) {
    return PAPER_BOTTOM - (level + 1) * this.sliceDisplayHeight;
  }

  getMovingSliceY(level) {
    return this.getStackY(level) - MOVING_SLICE_GAP;
  }

  getTravelRange(width) {
    return {
      min: ARTICLE_LEFT - TRAVEL_MARGIN,
      max: ARTICLE_RIGHT + TRAVEL_MARGIN - width,
    };
  }

  createPiece({ width, x, y, strip, level, direction = 1, speed = BASE_MOVE_SPEED, moving = false }) {
    const image = this.images[strip.imageIndex] ?? this.images[0] ?? null;
    return {
      x,
      y,
      width,
      height: this.sliceDisplayHeight,
      image,
      sourceX: strip.sourceX,
      sourceY: strip.sourceY,
      sourceWidth: strip.sourceWidth,
      sourceHeight: strip.sourceHeight,
      level,
      direction,
      speed,
      moving,
      dropping: false,
      targetY: y,
      pulse: 0,
      tilt: 0,
    };
  }

  prepareSession() {
    this.score = 0;
    this.stackedSlices = 0;
    this.perfectDrops = 0;
    this.alignmentHistory = [];
    this.flash = 0;
    this.flashColor = "#54d5a2";
    this.feedback = { text: "", tone: "neutral", remaining: 0 };
    this.resultData = null;
    this.pendingResult = null;
    this.subscriberResult = null;
    this.fragments = [];
    this.prepareDeck();
    this.stack = [];
    this.spawnNextSlice();
  }

  spawnNextSlice() {
    const level = this.stack.length;
    const previousPiece = this.stack[this.stack.length - 1] ?? { width: ARTICLE_WIDTH };
    const strip = this.nextStrip();
    const travel = this.getTravelRange(previousPiece.width);
    const direction = level % 2 === 0 ? -1 : 1;
    const startX = direction > 0 ? travel.min : travel.max;

    this.currentSlice = this.createPiece({
      width: previousPiece.width,
      x: startX,
      y: this.getMovingSliceY(level),
      strip,
      level,
      direction,
      speed: BASE_MOVE_SPEED + this.stackedSlices * MOVE_SPEED_STEP,
      moving: true,
    });
  }

  start({ introLine = INTRO_LINE } = {}) {
    this.audio.ensureContext();
    this.introLine = introLine;
    this.active = true;
    this.phase = "ready";
    this.root.classList.remove("forecast-frenzy--hidden");
    this.root.setAttribute("aria-hidden", "false");
    this.root.dataset.visible = "true";
    if (this.assetsReady) {
      this.prepareSession();
    } else {
      this.score = 0;
      this.stackedSlices = 0;
      this.perfectDrops = 0;
      this.alignmentHistory = [];
      this.flash = 0;
      this.flashColor = "#54d5a2";
      this.feedback = { text: "", tone: "neutral", remaining: 0 };
      this.currentSlice = null;
      this.stack = [];
      this.fragments = [];
      this.resultData = null;
      this.pendingResult = null;
      this.subscriberResult = null;
    }
    this.sync();
    this.draw();
    this.loadImages();
  }

  beginRun() {
    if (!this.active || this.phase !== "ready" || this.loadError) {
      return;
    }
    if (!this.assetsReady) {
      this.setFeedback("Loading screenshots", "neutral", 0.9);
      this.sync();
      return;
    }
    this.audio.playStart();
    this.phase = "playing";
    this.feedback = { text: "", tone: "neutral", remaining: 0 };
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
    this.root.dataset.visible = "false";

    if (typeof this.onExit === "function") {
      this.onExit({ reason });
    }
  }

  setFeedback(text, tone = "neutral", duration = 0.8) {
    this.feedback = { text, tone, remaining: duration };
  }

  createFragment(piece, pieceX, width, direction) {
    if (width <= 0 || !piece.image) {
      return;
    }

    const sourceScale = piece.sourceWidth / Math.max(1, piece.width);
    const sourceOffset = (pieceX - piece.x) * sourceScale;
    this.fragments.push({
      x: pieceX,
      y: piece.y,
      width,
      height: piece.height,
      image: piece.image,
      sourceX: piece.sourceX + sourceOffset,
      sourceY: piece.sourceY,
      sourceWidth: width * sourceScale,
      sourceHeight: piece.sourceHeight,
      velocityX: direction > 0 ? 420 : -420,
      velocityY: -80,
      gravity: 980,
      rotation: 0,
      angularVelocity: direction > 0 ? 2.2 : -2.2,
      opacity: 1,
    });
  }

  showResult(cleared) {
    const widthRatio = this.getCurrentWidthRatio();
    const averageAlignment = this.alignmentHistory.length ? this.getAverageAlignment() : cleared ? 1 : 0.42;

    this.phase = "result";
    this.resultData = buildResult({
      cleared,
      score: this.score,
      stackedSlices: this.stackedSlices,
      perfectDrops: this.perfectDrops,
      averageAlignment,
      widthRatio,
    });
    this.subscriberResult =
      typeof this.onRunComplete === "function"
        ? this.onRunComplete({
            gameId: "brandonStack",
            performance: getSubscriberPerformance({
              averageAlignment,
              widthRatio,
              stackedSlices: this.stackedSlices,
            }),
          })
        : null;

    this.sync();
  }

  finishRun(cleared) {
    this.pendingResult = {
      cleared,
      remaining: RESULT_DELAY,
    };
    this.phase = "postrun";

    if (cleared) {
      this.audio.playPublish();
      this.setFeedback("Published clean", "good", 1.1);
    } else {
      this.audio.playMiss();
      this.setFeedback("Draft lost", "bad", 1.1);
    }

    this.sync();
  }

  resolveDrop() {
    const previousPiece = this.stack[this.stack.length - 1] ?? {
      x: ARTICLE_LEFT,
      width: ARTICLE_WIDTH,
    };
    const currentPiece = this.currentSlice;
    if (!previousPiece || !currentPiece) {
      return;
    }

    const overlapStart = Math.max(currentPiece.x, previousPiece.x);
    const overlapEnd = Math.min(currentPiece.x + currentPiece.width, previousPiece.x + previousPiece.width);
    const overlapWidth = overlapEnd - overlapStart;

    if (overlapWidth <= 4) {
      this.createFragment(currentPiece, currentPiece.x, currentPiece.width, currentPiece.direction || 1);
      this.currentSlice = null;
      this.finishRun(false);
      return;
    }

    const leftTrim = overlapStart - currentPiece.x;
    const rightTrim = currentPiece.x + currentPiece.width - overlapEnd;
    if (leftTrim > 2) {
      this.createFragment(currentPiece, currentPiece.x, leftTrim, -1);
    }
    if (rightTrim > 2) {
      this.createFragment(currentPiece, overlapEnd, rightTrim, 1);
    }

    const sourceScale = currentPiece.sourceWidth / Math.max(1, currentPiece.width);
    const alignment = clamp(overlapWidth / Math.max(1, previousPiece.width), 0, 1);
    const trimmedPiece = {
      ...currentPiece,
      x: overlapStart,
      y: currentPiece.targetY,
      width: overlapWidth,
      sourceX: currentPiece.sourceX + leftTrim * sourceScale,
      sourceWidth: overlapWidth * sourceScale,
      dropping: false,
      moving: false,
      pulse: 0,
      tilt: 0,
      alignment,
    };

    this.stack.push(trimmedPiece);
    this.stackedSlices += 1;
    this.alignmentHistory.push(alignment);

    if (alignment >= PERFECT_ALIGNMENT) {
      this.perfectDrops += 1;
      this.score += 170;
      this.flash = 0.9;
      this.flashColor = "#54d5a2";
      this.audio.playPerfect();
      this.setFeedback("Perfect alignment", "good", 0.8);
    } else if (alignment >= GREAT_ALIGNMENT) {
      this.score += 125;
      this.flash = 0.32;
      this.flashColor = "#cf3434";
      this.audio.playMessy();
      this.setFeedback("Bad cut", "bad", 0.7);
    } else if (alignment >= GOOD_ALIGNMENT) {
      this.score += 90;
      this.flash = 0.4;
      this.flashColor = "#cf3434";
      this.audio.playMessy();
      this.setFeedback("Bad cut", "bad", 0.7);
    } else {
      this.score += 55;
      this.flash = 0.5;
      this.flashColor = "#cf3434";
      this.audio.playMessy();
      this.setFeedback("Bad cut", "bad", 0.7);
    }

    this.currentSlice = null;

    if (this.stackedSlices >= STACK_TARGET) {
      this.finishRun(true);
      return;
    }

    this.spawnNextSlice();
    this.phase = "playing";
    this.sync();
  }

  dropCurrentSlice() {
    if (!this.active || this.phase !== "playing" || !this.currentSlice || this.currentSlice.dropping) {
      return;
    }

    this.currentSlice.dropping = true;
    this.currentSlice.moving = false;
    this.currentSlice.targetY = this.getStackY(this.stack.length);
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

    if (!["Space", "Enter", "KeyE", "ArrowDown"].includes(event.code)) {
      return false;
    }

    event.preventDefault();

    if (this.phase === "ready") {
      this.beginRun();
      return true;
    }

    if (this.phase === "playing") {
      this.dropCurrentSlice();
      return true;
    }

    if (this.phase === "result") {
      this.start({ introLine: this.introLine });
      return true;
    }

    return false;
  }

  updateFragments(delta) {
    this.fragments = this.fragments.filter((fragment) => {
      fragment.velocityY += fragment.gravity * delta;
      fragment.x += fragment.velocityX * delta;
      fragment.y += fragment.velocityY * delta;
      fragment.rotation += fragment.angularVelocity * delta;
      fragment.opacity -= delta * 1.35;
      return fragment.opacity > 0.02 && fragment.y < CANVAS_HEIGHT + 240;
    });
  }

  update(delta) {
    if (!this.active) {
      return;
    }

    this.flash = Math.max(0, this.flash - delta * 1.9);
    this.feedback.remaining = Math.max(0, this.feedback.remaining - delta);
    this.stack.forEach((piece) => {
      piece.pulse = Math.max(0, (piece.pulse ?? 0) - delta * 3.4);
    });
    this.updateFragments(delta);

    if (this.phase === "postrun" && this.pendingResult) {
      this.pendingResult.remaining = Math.max(0, this.pendingResult.remaining - delta);
      if (this.pendingResult.remaining === 0) {
        const { cleared } = this.pendingResult;
        this.pendingResult = null;
        this.showResult(cleared);
        return;
      }
    }

    if (this.phase === "playing" && this.currentSlice) {
      if (this.currentSlice.dropping) {
        this.currentSlice.y += DROP_SPEED * delta;
        if (this.currentSlice.y >= this.currentSlice.targetY) {
          this.currentSlice.y = this.currentSlice.targetY;
          this.resolveDrop();
        }
      } else {
        const travel = this.getTravelRange(this.currentSlice.width);
        this.currentSlice.x += this.currentSlice.direction * this.currentSlice.speed * delta;
        if (this.currentSlice.x <= travel.min) {
          this.currentSlice.x = travel.min;
          this.currentSlice.direction = 1;
        } else if (this.currentSlice.x >= travel.max) {
          this.currentSlice.x = travel.max;
          this.currentSlice.direction = -1;
        }
      }
    }

    this.sync();
    this.draw();
  }

  syncResult() {
    const visible = this.phase === "result" && !!this.resultData;
    if (this.resultElement) {
      this.resultElement.hidden = !visible;
    }
    if (!visible || !this.resultData) {
      return;
    }

    this.resultTitleElement.textContent = this.resultData.title;
    this.resultSummaryElement.textContent = this.resultData.summary;

    this.resultMetricsElement.replaceChildren();
    const resultMetrics = this.resultData.metrics.map((metric) =>
      metric.label === "Subscriber gain" && this.subscriberResult
        ? {
            label: "Subscribers",
            value: this.subscriberResult.totalCountText,
            note: this.subscriberResult.deltaText,
          }
        : metric,
    );
    resultMetrics.forEach((metric) => {
      const card = document.createElement("div");
      card.className = "brandon-stack__result-metric";

      const label = document.createElement("div");
      label.className = "brandon-stack__result-label";
      label.textContent = metric.label;

      const value = document.createElement("strong");
      value.className = "brandon-stack__result-value";
      value.textContent = metric.value;

      const note = document.createElement("div");
      note.className = "brandon-stack__result-note";
      note.textContent = metric.note;

      card.append(label, value, note);
      this.resultMetricsElement.append(card);
    });

    this.resultChipsElement.replaceChildren();
    const baseChips = this.subscriberResult
      ? this.resultData.chips.filter((chipText) => !chipText.startsWith("Score "))
      : this.resultData.chips;
    const resultChips = [
      ...(this.subscriberResult ? [this.subscriberResult.deltaChipText] : []),
      ...baseChips,
    ];
    resultChips.forEach((chipText) => {
      const chip = document.createElement("div");
      chip.className = "brandon-stack__result-chip";
      chip.textContent = chipText;
      this.resultChipsElement.append(chip);
    });
  }

  sync() {
    if (this.introLineElement) {
      this.introLineElement.textContent = this.introLine;
    }

    if (this.roundElement) {
      this.roundElement.textContent = `${this.stackedSlices} / ${STACK_TARGET}`;
    }

    if (this.widthElement) {
      this.widthElement.textContent = formatPercent(this.getCurrentWidthRatio() * 100);
    }

    if (this.qualityElement) {
      this.qualityElement.textContent = getQualityLabel(this.getLiveQualityScore());
    }

    if (this.feedbackElement) {
      this.feedbackElement.textContent = this.feedback.text;
      this.feedbackElement.dataset.visible = this.feedback.remaining > 0 && this.feedback.text ? "true" : "false";
      this.feedbackElement.dataset.tone = this.feedback.tone;
    }

    if (this.startOverlayElement) {
      this.startOverlayElement.hidden = this.phase !== "ready";
    }

    if (this.footerElement) {
      let footerText = `Substack${this.activeImageIndex + 1} • slice ${Math.min(this.stackedSlices + 1, STACK_TARGET)} of ${STACK_TARGET}`;
      if (this.phase === "ready") {
        footerText = this.loadError
          ? "Screenshot assets failed to load."
          : this.assetsReady
            ? `Press Space, Enter, or click to start Substack${this.activeImageIndex + 1}.`
            : "Loading Brandon's screenshots...";
      } else if (this.phase === "postrun") {
        footerText = "Holding the draft for a beat...";
      } else if (this.phase === "result") {
        footerText = "Press Space or Enter to write another draft.";
      }
      this.footerElement.textContent = footerText;
    }

    this.syncResult();
  }

  drawBackground(context) {
    const backgroundGradient = context.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    backgroundGradient.addColorStop(0, "#eee9dd");
    backgroundGradient.addColorStop(1, "#dfd6c7");
    context.fillStyle = backgroundGradient;
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.save();
    context.fillStyle = "rgba(72, 60, 34, 0.05)";
    for (let x = 0; x < CANVAS_WIDTH; x += 48) {
      context.fillRect(x, 0, 1, CANVAS_HEIGHT);
    }
    context.restore();
  }

  drawEditorChrome(context) {
    context.save();

    context.shadowColor = "rgba(86, 65, 30, 0.16)";
    context.shadowBlur = 36;
    context.shadowOffsetY = 24;
    fillRoundedRect(
      context,
      ARTICLE_LEFT - 22,
      TOPBAR_TOP,
      ARTICLE_WIDTH + 44,
      PAPER_BOTTOM - TOPBAR_TOP,
      24,
      "#f8f4eb",
    );
    context.shadowColor = "transparent";
    strokeRoundedRect(
      context,
      ARTICLE_LEFT - 22,
      TOPBAR_TOP,
      ARTICLE_WIDTH + 44,
      PAPER_BOTTOM - TOPBAR_TOP,
      24,
      "rgba(123, 102, 63, 0.16)",
      1.4,
    );

    fillRoundedRect(context, ARTICLE_LEFT, TOPBAR_TOP + 18, ARTICLE_WIDTH, TOPBAR_HEIGHT, 18, "#fffdf8");
    strokeRoundedRect(
      context,
      ARTICLE_LEFT,
      TOPBAR_TOP + 18,
      ARTICLE_WIDTH,
      TOPBAR_HEIGHT,
      18,
      "rgba(80, 70, 48, 0.08)",
      1,
    );

    fillRoundedRect(
      context,
      ARTICLE_LEFT,
      this.paperTop,
      ARTICLE_WIDTH,
      PAPER_BOTTOM - this.paperTop,
      0,
      "#fffdf8",
    );

    const pills = [
      { label: "Draft", x: ARTICLE_LEFT + 18, width: 92, fill: "#21201b", color: "#fffaf1" },
      { label: "Saved", x: ARTICLE_LEFT + 120, width: 92, fill: "#f1ece0", color: "#6d5d46" },
      { label: "Publish", x: ARTICLE_RIGHT - 126, width: 108, fill: "#11845c", color: "#f4fff8" },
    ];
    pills.forEach((pill) => {
      fillRoundedRect(context, pill.x, TOPBAR_TOP + 30, pill.width, 34, 17, pill.fill);
      context.fillStyle = pill.color;
      context.font = '600 14px "Avenir Next", "Segoe UI", sans-serif';
      context.textAlign = "center";
      context.fillText(pill.label, pill.x + pill.width / 2, TOPBAR_TOP + 52);
    });

    context.fillStyle = "#9d8c72";
    context.font = '600 12px "Avenir Next", "Segoe UI", sans-serif';
    context.textAlign = "left";
    context.fillText(`Substack${this.activeImageIndex + 1}`, ARTICLE_LEFT + 8, this.paperTop - 12);

    context.restore();
  }

  drawSlice(context, piece, { translucent = false } = {}) {
    if (!piece || !piece.image || piece.width <= 0) {
      return;
    }

    const scale = piece.moving ? 1.002 : 1;

    context.save();
    context.translate(piece.x + piece.width / 2, piece.y + piece.height / 2);
    context.rotate(piece.tilt ?? 0);
    context.scale(scale, scale);
    context.translate(-piece.width / 2, -piece.height / 2);

    if (piece.moving) {
      context.shadowColor = "rgba(82, 61, 28, 0.18)";
      context.shadowBlur = 14;
      context.shadowOffsetY = 6;
    }

    const opacity = translucent ? 0.72 : 1;
    context.globalAlpha = opacity;
    context.save();
    context.drawImage(
      piece.image,
      piece.sourceX,
      piece.sourceY,
      piece.sourceWidth,
      piece.sourceHeight,
      0,
      0,
      piece.width,
      piece.height,
    );
    context.restore();

    context.shadowColor = "transparent";
    strokeRoundedRect(context, 0, 0, piece.width, piece.height, 0, "#000000", piece.moving ? 1.5 : 1);
    context.restore();
  }

  drawFragments(context) {
    this.fragments.forEach((fragment) => {
      context.save();
      context.globalAlpha = fragment.opacity;
      context.translate(fragment.x + fragment.width / 2, fragment.y + fragment.height / 2);
      context.rotate(fragment.rotation);
      context.translate(-fragment.width / 2, -fragment.height / 2);
      fillRoundedRect(context, 0, 0, fragment.width, fragment.height, 10, "#ffffff");
      context.save();
      drawRoundedRectPath(context, 0, 0, fragment.width, fragment.height, 10);
      context.clip();
      context.drawImage(
        fragment.image,
        fragment.sourceX,
        fragment.sourceY,
        fragment.sourceWidth,
        fragment.sourceHeight,
        0,
        0,
        fragment.width,
        fragment.height,
      );
      context.restore();
      context.restore();
    });
  }

  drawHud(context) {
    void context;
  }

  drawLoadingState(context) {
    context.save();
    fillRoundedRect(context, ARTICLE_LEFT + 52, 520, ARTICLE_WIDTH - 104, 130, 20, "rgba(255, 250, 241, 0.92)");
    strokeRoundedRect(context, ARTICLE_LEFT + 52, 520, ARTICLE_WIDTH - 104, 130, 20, "rgba(86, 73, 46, 0.1)", 1);
    context.fillStyle = "#2d2923";
    context.font = '700 28px Georgia, "Times New Roman", serif';
    context.textAlign = "center";
    context.fillText(this.loadError ? "Screenshot Load Failed" : "Loading Brandon's Draft", CANVAS_WIDTH / 2, 572);
    context.fillStyle = "#7f735f";
    context.font = '500 18px "Avenir Next", "Segoe UI", sans-serif';
    context.fillText(
      this.loadError ? "Substack1-4.png could not be read." : "Pulling in Substack1-4.png for the stack.",
      CANVAS_WIDTH / 2,
      610,
    );
    context.restore();
  }

  draw() {
    if (!this.context || !this.canvas) {
      return;
    }

    const context = this.context;
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawBackground(context);
    this.drawEditorChrome(context);

    if (!this.assetsReady) {
      this.drawLoadingState(context);
    } else {
      this.stack.forEach((piece) => this.drawSlice(context, piece));
      if (this.currentSlice) {
        this.drawSlice(context, this.currentSlice, { translucent: this.phase === "ready" });
      }
      this.drawFragments(context);
    }

    if (this.flash > 0) {
      context.save();
      context.globalAlpha = this.flash * 0.18;
      context.fillStyle = this.flashColor;
      context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      context.restore();
    }
  }
}
