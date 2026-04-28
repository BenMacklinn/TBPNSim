const ROUND_SIZE = 4;
const READ_WRAP_DELAY = 0.95;
const MIN_READ_TIME = 4.5;
const MAX_READ_TIME = 6.2;
const READ_START_BUFFER = 2.1;
const READ_SECONDS_PER_CHARACTER = 1 / 8.5;
const INTRO_FADE_OUT = 1.8;
const INTRO_HOLD = 0.5;
const INTRO_FADE_IN = 1.8;
const DEFAULT_INTRO_LINE =
  "Four TBPN phrases. Accuracy times speed. Keep the copy clean before the clock burns out.";
const DEFAULT_ACCENT = "#69d6ff";

const SPONSOR_POOL = [
  {
    id: "ultradome",
    brand: "TBPN Ultradome",
    label: "TBPN Ultradome",
    note: "Open the show with the arena call.",
    script: "Live from the TBPN Ultradome",
    accent: "#4f7cff",
  },
  {
    id: "temple",
    brand: "Technology",
    label: "The Temple of Technology",
    note: "Say the technology line exactly.",
    script: "The Temple of Technology",
    accent: "#58c072",
  },
  {
    id: "fortress",
    brand: "Finance",
    label: "The Fortress of Finance",
    note: "Keep the finance line clean.",
    script: "The Fortress of Finance",
    accent: "#ff8d5c",
  },
  {
    id: "capital",
    brand: "Capital",
    label: "The Capital of Capital",
    note: "Close with the capital line.",
    script: "The Capital of Capital",
    accent: "#a06bff",
  },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function shuffle(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function hexToRgba(hex, alpha) {
  const sanitized = hex.replace("#", "");
  const r = parseInt(sanitized.slice(0, 2), 16);
  const g = parseInt(sanitized.slice(2, 4), 16);
  const b = parseInt(sanitized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatPercent(value) {
  return `${Math.round(clamp(value, 0, 1) * 100)}%`;
}

function formatScore(value) {
  return String(Math.max(0, Math.round(value)));
}

function formatCountdown(seconds) {
  return `${Math.max(0, seconds).toFixed(1)}s`;
}

function buildReadDeck() {
  return shuffle(SPONSOR_POOL)
    .slice(0, ROUND_SIZE)
    .map((entry, index) => ({
      ...entry,
      order: index + 1,
      timeLimit: clamp(
        READ_START_BUFFER + entry.script.length * READ_SECONDS_PER_CHARACTER,
        MIN_READ_TIME,
        MAX_READ_TIME,
      ),
    }));
}

function countCorrectCharacters(target, typed) {
  let correctCount = 0;
  for (let index = 0; index < typed.length; index += 1) {
    if (typed[index] === target[index]) {
      correctCount += 1;
    }
  }
  return correctCount;
}

function getDeliveryRating(score) {
  if (score >= 95) {
    return "Perfect Delivery";
  }
  if (score >= 85) {
    return "Smooth Read";
  }
  if (score >= 70) {
    return "Acceptable";
  }
  if (score >= 50) {
    return "Rough";
  }
  return "Phrase Missed";
}

function getOverallRating(score) {
  if (score >= 95) {
    return "Perfect Delivery";
  }
  if (score >= 85) {
    return "Clean Delivery";
  }
  if (score >= 70) {
    return "Acceptable";
  }
  if (score >= 50) {
    return "Rough Session";
  }
  return "Phrase Missed";
}

function getFeedbackTone(score) {
  if (score >= 85) {
    return "good";
  }
  if (score >= 70) {
    return "warn";
  }
  return "bad";
}

function scoreRead(read, typed) {
  const targetLength = read.script.length;
  const typedLength = typed.length;
  const correctCount = countCorrectCharacters(read.script, typed);
  const accuracy = typedLength > 0 ? correctCount / typedLength : 0;
  const speed = clamp(typedLength / targetLength, 0, 1);
  const score = Math.round(accuracy * speed * 100);

  return {
    id: read.id,
    brand: read.brand,
    label: read.label,
    note: read.note,
    script: read.script,
    score,
    rating: getDeliveryRating(score),
    accuracy,
    speed,
    correctCount,
    typedLength,
  };
}

function buildFinalResult(completedReads) {
  const totalScore = completedReads.reduce((sum, read) => sum + read.score, 0);
  const totalCorrect = completedReads.reduce((sum, read) => sum + read.correctCount, 0);
  const totalTyped = completedReads.reduce((sum, read) => sum + read.typedLength, 0);
  const averageScore = completedReads.length > 0 ? totalScore / completedReads.length : 0;
  const averageAccuracy = totalTyped > 0 ? totalCorrect / totalTyped : 0;
  const bestScore = completedReads.reduce((best, read) => Math.max(best, read.score), 0);
  const smoothReads = completedReads.filter((read) => read.score >= 85).length;
  const perfectReads = completedReads.filter((read) => read.score >= 95).length;

  return {
    rank: getOverallRating(averageScore),
    summary: `${formatPercent(averageAccuracy)} accuracy across ${completedReads.length} reads. Average score ${formatScore(averageScore)}.`,
    chips: [
      `Average ${formatScore(averageScore)}`,
      `Accuracy ${formatPercent(averageAccuracy)}`,
      `Best ${formatScore(bestScore)}`,
      `Smooth ${smoothReads}`,
      `Perfect ${perfectReads}`,
    ],
    averageScore,
    averageAccuracy,
  };
}

function getSubscriberPerformance(result) {
  return clamp((result?.averageScore ?? 0) / 100 * 0.8 + (result?.averageAccuracy ?? 0) * 0.2, 0, 1);
}

export class JohnSponsorReadOverlay {
  constructor({ root, onExit, onRunComplete }) {
    this.root = root;
    this.onExit = onExit;
    this.onRunComplete = onRunComplete;

    this.introLineElement = root.querySelector("#johnSponsorReadIntroLine");
    this.roundElement = root.querySelector("#johnSponsorReadRound");
    this.averageScoreElement = root.querySelector("#johnSponsorReadAverageScore");
    this.averageAccuracyElement = root.querySelector("#johnSponsorReadAverageAccuracy");
    this.timerElement = root.querySelector("#johnSponsorReadTimer");
    this.queueElement = root.querySelector("#johnSponsorReadQueue");
    this.brandElement = root.querySelector("#johnSponsorReadBrand");
    this.indexElement = root.querySelector("#johnSponsorReadIndex");
    this.noteElement = root.querySelector("#johnSponsorReadNote");
    this.promptElement = root.querySelector("#johnSponsorReadPrompt");
    this.progressBarElement = root.querySelector("#johnSponsorReadProgressBar");
    this.completionElement = root.querySelector("#johnSponsorReadCompletion");
    this.liveAccuracyElement = root.querySelector("#johnSponsorReadLiveAccuracy");
    this.projectedScoreElement = root.querySelector("#johnSponsorReadProjectedScore");
    this.feedbackElement = root.querySelector("#johnSponsorReadFeedback");
    this.footerElement = root.querySelector("#johnSponsorReadFooter");
    this.timelineBarElement = root.querySelector("#johnSponsorReadTimelineBar");
    this.statusPillElement = root.querySelector("#johnSponsorReadStatusPill");
    this.resultElement = root.querySelector("#johnSponsorReadResult");
    this.resultRankElement = root.querySelector("#johnSponsorReadResultRank");
    this.resultSummaryElement = root.querySelector("#johnSponsorReadResultSummary");
    this.resultRowsElement = root.querySelector("#johnSponsorReadResultRows");
    this.resultStatsElement = root.querySelector("#johnSponsorReadResultStats");
    this.startOverlayElement = root.querySelector("#johnSponsorReadStart");
    this.startButton = root.querySelector("#johnSponsorReadStartButton");
    this.exitButton = root.querySelector("#johnSponsorReadExitButton");
    this.replayButton = root.querySelector("#johnSponsorReadReplayButton");
    this.resultExitButton = root.querySelector("#johnSponsorReadResultExitButton");

    this.active = false;
    this.phase = "hidden";
    this.phaseTime = 0;
    this.betweenTimer = 0;
    this.currentRemaining = 0;
    this.currentTyped = "";
    this.currentRead = null;
    this.currentReadIndex = -1;
    this.readDeck = [];
    this.completedReads = [];
    this.resultData = null;
    this.introLine = DEFAULT_INTRO_LINE;
    this.feedback = { text: "", tone: "good", remaining: 0 };
    this.fadeAlpha = 0;
    this.introOverlayAlpha = 0;
    this.cabinetVisible = false;
    this.promptSignature = "";
    this.queueSignature = "";
    this.resultSignature = "";
    this.subscriberResult = null;

    this.startButton?.addEventListener("click", () => this.beginRun());
    this.exitButton?.addEventListener("click", () => this.exit("exit"));
    this.replayButton?.addEventListener("click", () => this.start({ introLine: this.introLine }));
    this.resultExitButton?.addEventListener("click", () => this.exit("exit"));

    this.sync();
  }

  prepareReadyState() {
    this.readDeck = buildReadDeck();
    this.completedReads = [];
    this.currentRead = null;
    this.currentReadIndex = -1;
    this.currentTyped = "";
    this.currentRemaining = 0;
    this.resultData = null;
    this.feedback = { text: "", tone: "good", remaining: 0 };
    this.phase = "ready";
    this.phaseTime = 0;
    this.betweenTimer = 0;
    this.introOverlayAlpha = 0;
    this.cabinetVisible = true;
    this.promptSignature = "";
    this.queueSignature = "";
    this.resultSignature = "";
    this.subscriberResult = null;
  }

  start({ introLine = DEFAULT_INTRO_LINE } = {}) {
    this.introLine = introLine;
    this.active = true;
    this.phase = "intro";
    this.phaseTime = 0;
    this.introOverlayAlpha = 0;
    this.fadeAlpha = 0;
    this.cabinetVisible = false;
    this.readDeck = [];
    this.completedReads = [];
    this.currentRead = null;
    this.currentReadIndex = -1;
    this.currentTyped = "";
    this.currentRemaining = 0;
    this.feedback = { text: "", tone: "good", remaining: 0 };
    this.resultData = null;
    this.promptSignature = "";
    this.queueSignature = "";
    this.resultSignature = "";
    this.subscriberResult = null;

    this.root.classList.remove("forecast-frenzy--hidden");
    this.root.setAttribute("aria-hidden", "false");
    if (this.resultElement) {
      this.resultElement.hidden = true;
    }
    this.sync();
  }

  beginRun() {
    if (!this.active || this.phase !== "ready") {
      return;
    }

    if (!this.readDeck.length) {
      this.readDeck = buildReadDeck();
    }

    this.completedReads = [];
    this.currentReadIndex = 0;
    this.subscriberResult = null;
    this.loadCurrentRead();
    this.phase = "playing";
    this.cabinetVisible = true;
    this.sync();
  }

  loadCurrentRead() {
    this.currentRead = this.readDeck[this.currentReadIndex] ?? null;
    this.currentTyped = "";
    this.currentRemaining = this.currentRead?.timeLimit ?? 0;
    this.promptSignature = "";
    this.applyAccent(this.currentRead?.accent ?? DEFAULT_ACCENT);
  }

  applyAccent(accent) {
    this.root.style.setProperty("--john-accent", accent);
    this.root.style.setProperty("--john-accent-soft", hexToRgba(accent, 0.16));
    this.root.style.setProperty("--john-accent-strong", hexToRgba(accent, 0.34));
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
    if (this.resultElement) {
      this.resultElement.hidden = true;
    }

    if (typeof this.onExit === "function") {
      this.onExit({ reason });
    }
  }

  getCurrentMetrics() {
    if (!this.currentRead) {
      return {
        typedLength: 0,
        accuracy: 0,
        speed: 0,
        projectedScore: 0,
      };
    }

    const typedLength = this.currentTyped.length;
    const correctCount = countCorrectCharacters(this.currentRead.script, this.currentTyped);
    const accuracy = typedLength > 0 ? correctCount / typedLength : 0;
    const speed = clamp(typedLength / this.currentRead.script.length, 0, 1);

    return {
      typedLength,
      accuracy,
      speed,
      projectedScore: Math.round(accuracy * speed * 100),
    };
  }

  getAverageScore() {
    if (!this.completedReads.length) {
      return 0;
    }
    return this.completedReads.reduce((sum, read) => sum + read.score, 0) / this.completedReads.length;
  }

  getAverageAccuracy() {
    if (!this.completedReads.length) {
      return 0;
    }

    const totalCorrect = this.completedReads.reduce((sum, read) => sum + read.correctCount, 0);
    const totalTyped = this.completedReads.reduce((sum, read) => sum + read.typedLength, 0);
    return totalTyped > 0 ? totalCorrect / totalTyped : 0;
  }

  resolveCurrentRead(reason = "time") {
    if (this.phase !== "playing" || !this.currentRead) {
      return;
    }

    const readResult = {
      ...scoreRead(this.currentRead, this.currentTyped),
      reason,
      timeLeft: this.currentRemaining,
    };
    this.completedReads.push(readResult);
    this.feedback = {
      text: `${readResult.rating}  ${formatScore(readResult.score)}`,
      tone: getFeedbackTone(readResult.score),
      remaining: READ_WRAP_DELAY,
    };
    this.currentRead = null;
    this.currentTyped = "";
    this.currentRemaining = 0;
    this.phase = "between";
    this.betweenTimer = READ_WRAP_DELAY;
    this.promptSignature = "";
    this.queueSignature = "";
    this.sync();
  }

  finishRun() {
    if (this.phase === "result") {
      return;
    }

    this.currentRead = null;
    this.currentTyped = "";
    this.currentRemaining = 0;
    this.phase = "result";
    this.resultData = buildFinalResult(this.completedReads);
    this.subscriberResult =
      typeof this.onRunComplete === "function"
        ? this.onRunComplete({
            gameId: "johnSponsorRead",
            performance: getSubscriberPerformance(this.resultData),
          })
        : null;
    this.resultSignature = "";
    this.sync();
  }

  handleCharacter(character) {
    if (!this.currentRead) {
      return;
    }

    this.currentTyped += character;
    this.promptSignature = "";

    if (this.currentTyped === this.currentRead.script) {
      this.resolveCurrentRead("complete");
      return;
    }

    this.sync();
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
        this.start({ introLine: this.introLine });
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

    if (this.phase !== "playing") {
      return false;
    }

    if (event.code === "Backspace") {
      event.preventDefault();
      this.currentTyped = this.currentTyped.slice(0, -1);
      this.promptSignature = "";
      this.sync();
      return true;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) {
      return false;
    }

    if (event.key.length === 1) {
      event.preventDefault();
      this.handleCharacter(event.key);
      return true;
    }

    return false;
  }

  update(delta) {
    if (!this.active) {
      return;
    }

    if (this.phase === "intro") {
      this.phaseTime += delta;
      const totalIntro = INTRO_FADE_OUT + INTRO_HOLD + INTRO_FADE_IN;

      if (this.phaseTime >= totalIntro) {
        this.prepareReadyState();
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

    if (this.phase === "between") {
      this.betweenTimer = Math.max(0, this.betweenTimer - delta);
      this.feedback.remaining = Math.max(0, this.feedback.remaining - delta);

      if (this.betweenTimer <= 0) {
        if (this.completedReads.length >= ROUND_SIZE) {
          this.finishRun();
        } else {
          this.currentReadIndex = this.completedReads.length;
          this.loadCurrentRead();
          this.phase = "playing";
          this.sync();
        }
        return;
      }

      this.sync();
      return;
    }

    if (this.phase !== "playing") {
      return;
    }

    this.currentRemaining = Math.max(0, this.currentRemaining - delta);
    this.feedback.remaining = Math.max(0, this.feedback.remaining - delta);

    if (this.currentRemaining <= 0) {
      this.resolveCurrentRead("time");
      return;
    }

    this.sync();
  }

  syncPrompt() {
    if (!this.promptElement) {
      return;
    }

    if (!this.currentRead) {
      if (this.promptSignature === "__empty") {
        return;
      }
      this.promptSignature = "__empty";
      this.promptElement.textContent = "TBPN phrase loads here when the read goes live.";
      this.promptElement.dataset.empty = "true";
      return;
    }

    const signature = `${this.currentRead.id}__${this.currentTyped}__${this.phase}`;
    if (signature === this.promptSignature) {
      return;
    }

    this.promptSignature = signature;
    this.promptElement.dataset.empty = "false";

    const fragment = document.createDocumentFragment();
    for (let index = 0; index < this.currentRead.script.length; index += 1) {
      const character = this.currentRead.script[index];
      const span = document.createElement("span");
      span.className = "john-sponsor-read__char";

      if (index < this.currentTyped.length) {
        span.classList.add(
          this.currentTyped[index] === character
            ? "john-sponsor-read__char--correct"
            : "john-sponsor-read__char--wrong",
        );
      } else {
        span.classList.add("john-sponsor-read__char--pending");
        if (index === this.currentTyped.length && this.phase === "playing") {
          span.dataset.caret = "true";
        }
      }

      span.textContent = character;
      fragment.append(span);
    }

    if (this.currentTyped.length > this.currentRead.script.length) {
      const overflow = document.createElement("span");
      overflow.className = "john-sponsor-read__char john-sponsor-read__char--wrong john-sponsor-read__char--extra";
      overflow.textContent = this.currentTyped.slice(this.currentRead.script.length);
      fragment.append(overflow);
    }

    this.promptElement.replaceChildren(fragment);
  }

  syncQueue() {
    if (!this.queueElement) {
      return;
    }

    const activeIndex = this.currentRead ? this.currentReadIndex : this.phase === "between" ? this.completedReads.length : -1;
    const signature = `${this.phase}__${activeIndex}__${this.currentRemaining.toFixed(1)}__${this.completedReads
      .map((read) => read.id + read.score)
      .join("|")}__${this.readDeck.map((read) => read.id).join("|")}`;

    if (signature === this.queueSignature) {
      return;
    }

    this.queueSignature = signature;
    this.queueElement.replaceChildren();

    if (!this.readDeck.length) {
      const placeholder = document.createElement("div");
      placeholder.className = "john-sponsor-read__queue-empty";
      placeholder.textContent = "Four TBPN phrases load here once the desk boots.";
      this.queueElement.append(placeholder);
      return;
    }

    this.readDeck.forEach((read, index) => {
      const row = document.createElement("div");
      row.className = "john-sponsor-read__queue-item";
      row.style.setProperty("--queue-accent", read.accent);

      const brand = document.createElement("div");
      brand.className = "john-sponsor-read__queue-brand";
      brand.textContent = read.brand;

      const detail = document.createElement("div");
      detail.className = "john-sponsor-read__queue-detail";

      const status = document.createElement("strong");
      status.className = "john-sponsor-read__queue-status";

      const result = this.completedReads[index];
      if (result) {
        row.dataset.state = "done";
        detail.textContent = result.rating;
        status.textContent = formatScore(result.score);
      } else if (index === activeIndex) {
        row.dataset.state = "current";
        detail.textContent = this.phase === "between" ? "Next up" : "Live";
        status.textContent = this.phase === "between" ? "Hold" : formatCountdown(this.currentRemaining);
      } else {
        row.dataset.state = "upcoming";
        detail.textContent = "Queued";
        status.textContent = `#${index + 1}`;
      }

      row.append(brand, detail, status);
      this.queueElement.append(row);
    });
  }

  syncResult() {
    const visible = this.phase === "result";
    if (this.resultElement) {
      this.resultElement.hidden = !visible;
    }
    if (!visible || !this.resultData || !this.resultRankElement || !this.resultSummaryElement || !this.resultRowsElement) {
      return;
    }

    const signature = `${this.resultData.rank}__${this.resultData.summary}__${this.subscriberResult?.totalText ?? "none"}__${
      this.subscriberResult?.deltaChipText ?? "none"
    }__${this.completedReads.map((read) => `${read.id}:${read.score}`).join("|")}`;
    if (signature === this.resultSignature) {
      return;
    }
    this.resultSignature = signature;

    this.resultRankElement.textContent = this.resultData.rank;
    this.resultSummaryElement.textContent = this.subscriberResult
      ? `${this.subscriberResult.totalText} • ${this.subscriberResult.deltaText}`
      : this.resultData.summary;
    this.resultRowsElement.replaceChildren();
    this.completedReads.forEach((read) => {
      const row = document.createElement("div");
      row.className = "john-sponsor-read__report-row";

      const brand = document.createElement("div");
      brand.className = "john-sponsor-read__report-brand";
      brand.textContent = read.brand;

      const rating = document.createElement("div");
      rating.className = "john-sponsor-read__report-rating";
      rating.textContent = read.rating;

      const score = document.createElement("strong");
      score.className = "john-sponsor-read__report-score";
      score.textContent = this.subscriberResult ? formatPercent(read.accuracy) : formatScore(read.score);

      row.append(brand, rating, score);
      this.resultRowsElement.append(row);
    });

    if (this.resultStatsElement) {
      this.resultStatsElement.replaceChildren();
      const baseChips = this.subscriberResult
        ? this.resultData.chips.filter(
            (chip) => !chip.startsWith("Average ") && !chip.startsWith("Best "),
          )
        : this.resultData.chips;
      const resultChips = [
        ...(this.subscriberResult ? [this.subscriberResult.totalText, this.subscriberResult.deltaChipText] : []),
        ...baseChips,
      ];
      resultChips.forEach((chip) => {
        const chipElement = document.createElement("div");
        chipElement.className = "forecast-frenzy__chip";
        chipElement.textContent = chip;
        this.resultStatsElement.append(chipElement);
      });
    }
  }

  sync() {
    const currentMetrics = this.getCurrentMetrics();
    const readProgress =
      this.phase === "ready"
        ? `0 / ${ROUND_SIZE}`
        : `${Math.min(ROUND_SIZE, this.completedReads.length + (this.currentRead ? 1 : 0))} / ${ROUND_SIZE}`;

    this.root.dataset.visible = this.cabinetVisible ? "true" : "false";
    this.root.style.setProperty("--forecast-fade", this.fadeAlpha.toFixed(3));
    this.root.style.setProperty("--forecast-intro-overlay", this.introOverlayAlpha.toFixed(3));

    if (this.introLineElement) {
      this.introLineElement.textContent = this.introLine;
    }
    if (this.roundElement) {
      this.roundElement.textContent = readProgress;
    }
    if (this.averageScoreElement) {
      const averageScore = this.completedReads.length > 0 ? this.getAverageScore() : currentMetrics.projectedScore;
      this.averageScoreElement.textContent = formatScore(averageScore);
    }
    if (this.averageAccuracyElement) {
      const averageAccuracy = this.completedReads.length > 0 ? this.getAverageAccuracy() : currentMetrics.accuracy;
      this.averageAccuracyElement.textContent =
        this.phase === "ready" && this.completedReads.length === 0 ? "--" : formatPercent(averageAccuracy);
    }
    if (this.timerElement) {
      this.timerElement.textContent =
        this.phase === "playing" ? formatCountdown(this.currentRemaining) : this.phase === "between" ? "Hold" : "--";
    }
    if (this.brandElement) {
      this.brandElement.textContent = this.currentRead?.label ?? "Phrase Deck";
    }
    if (this.indexElement) {
      this.indexElement.textContent = this.currentRead
        ? `Sponsor ${this.currentReadIndex + 1} of ${ROUND_SIZE}`
        : this.phase === "result"
          ? "AD READ REPORT"
          : "Stand by for the next live read";
    }
    if (this.noteElement) {
      this.noteElement.textContent =
        this.currentRead?.note ??
        "Type the TBPN phrase exactly as shown. Case, punctuation, and spaces all count.";
    }
    if (this.progressBarElement) {
      this.progressBarElement.style.width = `${currentMetrics.speed * 100}%`;
    }
    if (this.completionElement) {
      this.completionElement.textContent = this.phase === "playing" ? formatPercent(currentMetrics.speed) : "--";
    }
    if (this.liveAccuracyElement) {
      this.liveAccuracyElement.textContent = this.phase === "playing" ? formatPercent(currentMetrics.accuracy) : "--";
    }
    if (this.projectedScoreElement) {
      this.projectedScoreElement.textContent =
        this.phase === "playing" ? formatScore(currentMetrics.projectedScore) : "--";
    }
    if (this.footerElement) {
      this.footerElement.textContent =
        this.phase === "playing"
          ? formatCountdown(this.currentRemaining)
          : this.phase === "between"
            ? "Hold"
            : this.phase === "result"
              ? "Report"
              : "--";
    }
    if (this.timelineBarElement) {
      const timeRatio = this.currentRead ? clamp(this.currentRemaining / this.currentRead.timeLimit, 0, 1) : 0;
      this.timelineBarElement.style.width =
        this.phase === "playing"
          ? `${timeRatio * 100}%`
          : this.phase === "ready"
            ? "100%"
            : "0%";
    }
    if (this.feedbackElement) {
      const visible = this.feedback.remaining > 0;
      this.feedbackElement.textContent = visible ? this.feedback.text : "";
      this.feedbackElement.dataset.visible = visible ? "true" : "false";
      this.feedbackElement.dataset.tone = this.feedback.tone;
    }
    if (this.statusPillElement) {
      this.statusPillElement.textContent =
        this.phase === "intro"
          ? "Loading"
          : this.phase === "ready"
            ? "Stand By"
            : this.phase === "between"
              ? "Reset"
              : this.phase === "result"
                ? "Report"
                : "Live Read";
      this.statusPillElement.dataset.tone =
        this.phase === "playing" ? "live" : this.phase === "result" ? "result" : "standby";
    }
    if (this.startOverlayElement) {
      const visible = this.phase === "ready";
      this.startOverlayElement.hidden = !visible;
      this.startOverlayElement.style.display = visible ? "" : "none";
    }

    this.applyAccent(this.currentRead?.accent ?? DEFAULT_ACCENT);
    this.syncPrompt();
    this.syncQueue();
    this.syncResult();
  }
}
