const CUE_SPEED_MULTIPLIER = 0.58;
const PROMPT_LEAD = 0.82;
const GOOD_EARLY_WINDOW = 0.56;
const PERFECT_WINDOW = 0.18;
const LATE_WINDOW = 0.84;
const PERFECT_SCORE = 150;
const GOOD_SCORE = 110;
const LATE_SCORE = 70;
const MISS_PENALTY = 25;

const SHOTS = [
  {
    id: "host",
    key: "1",
    label: "Tyler Cam",
    shortLabel: "Tyler",
    description: "Wider front camera on Tyler from the tripod in front of his desk.",
  },
  {
    id: "guest",
    key: "2",
    label: "Host Cam",
    shortLabel: "Host",
    description: "Two-shot on the two people at the circle table.",
  },
  {
    id: "wide",
    key: "3",
    label: "Door Wide",
    shortLabel: "Wide",
    description: "High roof angle above the hangar entrance looking down toward the circle table.",
  },
  {
    id: "reaction",
    key: "4",
    label: "Prod Corner",
    shortLabel: "Reaction",
    description: "High corner shot angled down at the three producers.",
  },
];

const BASE_EVENT_SCRIPT = [
  { cue: 2.5, type: "HOST TALKING", shotId: "host" },
  { cue: 4.0, type: "REACTION", shotId: "reaction" },
  { cue: 5.5, type: "GUEST ANSWERING", shotId: "guest" },
  { cue: 6.9, type: "HOST NOD", shotId: "host" },
  { cue: 8.4, type: "REACTION", shotId: "reaction" },
  { cue: 9.9, type: "GUEST PUSHBACK", shotId: "guest" },
  { cue: 11.5, type: "BIG MOMENT", shotId: "wide" },
  { cue: 13.0, type: "HOST TALKING", shotId: "host" },
  { cue: 14.6, type: "HOST TALKING", shotId: "host" },
  { cue: 16.0, type: "REACTION", shotId: "reaction" },
  { cue: 17.4, type: "INTERRUPTION", shotId: "wide" },
  { cue: 18.8, type: "GUEST ANSWERING", shotId: "guest" },
  { cue: 20.2, type: "GUEST ANSWERING", shotId: "guest" },
  { cue: 23.1, type: "LAUGH", shotId: "reaction" },
  { cue: 24.6, type: "HOST CLARIFIES", shotId: "host" },
  { cue: 26.0, type: "HOST TALKING", shotId: "host" },
  { cue: 27.5, type: "REACTION", shotId: "reaction" },
  { cue: 29.1, type: "BIG MOMENT", shotId: "wide" },
  { cue: 30.5, type: "GUEST COUNTER", shotId: "guest" },
  { cue: 32.0, type: "REACTION", shotId: "reaction" },
  { cue: 33.5, type: "HOST FOLLOW-UP", shotId: "host" },
  { cue: 35.0, type: "GUEST ANSWERING", shotId: "guest" },
  { cue: 36.6, type: "REACTION", shotId: "reaction" },
  { cue: 38.2, type: "HOST TALKING", shotId: "host" },
  { cue: 41.4, type: "BIG MOMENT", shotId: "wide" },
  { cue: 43.0, type: "REACTION", shotId: "reaction" },
  { cue: 44.7, type: "HOST WRAP", shotId: "host" },
  { cue: 46.2, type: "WIDE RESET", shotId: "wide" },
];

const EVENT_SCRIPT = BASE_EVENT_SCRIPT.map((event) => ({
  ...event,
  cue: Number((event.cue * CUE_SPEED_MULTIPLIER).toFixed(2)),
}));

const SESSION_LENGTH = Number((EVENT_SCRIPT[EVENT_SCRIPT.length - 1].cue + 2.8).toFixed(2));

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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

function formatCameraLabel(shot) {
  return shot ? `CAM ${shot.key} • ${shot.label}` : "No Camera";
}

function formatCameraCall(shot) {
  return shot ? `CUT TO CAM ${shot.key}` : "Stand By";
}

function getAccuracy({ perfectCuts, goodCuts, lateCuts, totalCues }) {
  if (!totalCues) {
    return 0;
  }
  return clamp(
    (perfectCuts + goodCuts * 0.78 + lateCuts * 0.52) / totalCues,
    0,
    1,
  );
}

function buildResult({ score, perfectCuts, goodCuts, lateCuts, missedCuts, cleanStreak, totalCues }) {
  const accuracy = getAccuracy({ perfectCuts, goodCuts, lateCuts, totalCues });
  let rank = "Control Room Trainee";

  if (score >= 980 && missedCuts <= 3) {
    rank = "Segment Producer";
  }
  if (score >= 1280 && missedCuts <= 2 && perfectCuts >= 4) {
    rank = "Switcher Ace";
  }
  if (score >= 1560 && missedCuts <= 1 && perfectCuts >= 6) {
    rank = "Broadcast Closer";
  }
  if (score >= 1820 && missedCuts === 0 && perfectCuts >= 8) {
    rank = "Master Switcher";
  }

  return {
    rank,
    summary: `${perfectCuts} perfect, ${goodCuts} good, ${lateCuts} late, ${missedCuts} bad cuts across ${totalCues} cues. Accuracy ${Math.round(accuracy * 100)}%.`,
    chips: [
      `Score ${score}`,
      `Accuracy ${Math.round(accuracy * 100)}%`,
      `Best streak ${cleanStreak}`,
      `Bad cuts ${missedCuts}`,
    ],
  };
}

function getSubscriberPerformance({ perfectCuts, goodCuts, lateCuts, totalCues }) {
  return getAccuracy({ perfectCuts, goodCuts, lateCuts, totalCues });
}

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
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(envelope);
    envelope.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.03);
  }

  playCut() {
    this.playTone({ frequency: 500, duration: 0.045, gain: 0.012, type: "triangle" });
  }

  playStart() {
    this.playTone({ frequency: 392, duration: 0.08, when: 0 });
    this.playTone({ frequency: 523, duration: 0.09, when: 0.05 });
    this.playTone({ frequency: 659, duration: 0.12, when: 0.11 });
  }

  playPerfect() {
    this.playTone({ frequency: 740, duration: 0.06, gain: 0.02 });
    this.playTone({ frequency: 988, duration: 0.09, gain: 0.018, when: 0.05 });
    this.playTone({ frequency: 1318, duration: 0.12, gain: 0.016, when: 0.1 });
  }

  playGood() {
    this.playTone({ frequency: 620, duration: 0.05, gain: 0.016, type: "triangle" });
    this.playTone({ frequency: 830, duration: 0.07, gain: 0.014, type: "triangle", when: 0.04 });
  }

  playLate() {
    this.playTone({ frequency: 430, duration: 0.08, gain: 0.015, type: "sine" });
    this.playTone({ frequency: 540, duration: 0.07, gain: 0.012, type: "triangle", when: 0.05 });
  }

  playMiss() {
    this.playTone({ frequency: 240, duration: 0.16, gain: 0.022, type: "sawtooth", slideTo: 160 });
    this.playTone({ frequency: 180, duration: 0.22, gain: 0.018, type: "square", when: 0.05, slideTo: 120 });
  }

  playWrap() {
    this.playTone({ frequency: 523, duration: 0.08, gain: 0.016, type: "triangle" });
    this.playTone({ frequency: 659, duration: 0.1, gain: 0.016, type: "triangle", when: 0.07 });
    this.playTone({ frequency: 784, duration: 0.14, gain: 0.016, type: "triangle", when: 0.14 });
  }
}

export class ProducerManOverlay {
  constructor({ root, onExit, onRunComplete, shotCatalog = SHOTS } = {}) {
    this.root = root;
    this.onExit = onExit;
    this.onRunComplete = onRunComplete;
    this.audio = new ProducerManAudio();
    this.shots = shotCatalog.map((shot) => ({ ...shot }));
    this.defaultShotId = this.shots.find((shot) => shot.id === "wide")?.id ?? this.shots[0]?.id ?? null;

    this.hostElement = root.querySelector("#producerManHost");
    this.startHostElement = root.querySelector("#producerManStartHost");
    this.introLineElement = root.querySelector("#producerManIntroLine");
    this.scoreElement = root.querySelector("#producerManScore");
    this.perfectElement = root.querySelector("#producerManPerfect");
    this.goodElement = root.querySelector("#producerManGood");
    this.lateElement = root.querySelector("#producerManLate");
    this.missedElement = root.querySelector("#producerManMissed");
    this.timerElement = root.querySelector("#producerManTimer");
    this.cueStateElement = root.querySelector("#producerManCueState");
    this.cuePromptElement = root.querySelector("#producerManCuePrompt");
    this.cueDetailElement = root.querySelector("#producerManCueDetail");
    this.cueMeterFillElement = root.querySelector("#producerManCueMeterFill");
    this.shotGuideElement = root.querySelector("#producerManShotGuide");
    this.selectedShotElement = root.querySelector("#producerManSelectedShot");
    this.promptMetaElement = root.querySelector("#producerManPromptMeta");
    this.promptElement = root.querySelector("#producerManPrompt");
    this.feedbackElement = root.querySelector("#producerManFeedback");
    this.statusPillElement = root.querySelector("#producerManStatusPill");
    this.timelineLabelElement = root.querySelector("#producerManTimelineLabel");
    this.timelineProgressElement = root.querySelector("#producerManTimelineProgress");
    this.timelineEventsElement = root.querySelector("#producerManTimelineEvents");
    this.shotButtonsElement = root.querySelector("#producerManShotButtons");
    this.shotTitleElement = root.querySelector("#producerManShotTitle");
    this.shotDescriptionElement = root.querySelector("#producerManShotDescription");
    this.footerElement = root.querySelector("#producerManFooter");
    this.startOverlayElement = root.querySelector("#producerManStart");
    this.startButton = root.querySelector("#producerManStartButton");
    this.exitButton = root.querySelector("#producerManExitButton");
    this.resultElement = root.querySelector("#producerManResult");
    this.resultRankElement = root.querySelector("#producerManResultRank");
    this.resultSummaryElement = root.querySelector("#producerManResultSummary");
    this.resultStatsElement = root.querySelector("#producerManResultStats");
    this.replayButton = root.querySelector("#producerManReplayButton");
    this.resultExitButton = root.querySelector("#producerManResultExitButton");

    this.active = false;
    this.phase = "hidden";
    this.hostName = "Production";
    this.introLine = "Switch the live hangar cameras on cue and keep the episode looking clean.";
    this.feedback = { text: "", tone: "neutral", remaining: 0 };
    this.resultData = null;
    this.subscriberResult = null;
    this.shotButtonMap = new Map();
    this.timelineEventElements = [];

    this.startButton?.addEventListener("click", () => this.beginRun());
    this.exitButton?.addEventListener("click", () => this.exit("exit"));
    this.replayButton?.addEventListener("click", () => this.start({
      hostName: this.hostName,
      introLine: this.introLine,
    }));
    this.resultExitButton?.addEventListener("click", () => this.exit("exit"));

    this.buildShotGuide();
    this.buildShotButtons();
    this.resetSession();
    this.sync();
  }

  getShotById(shotId) {
    return this.shots.find((shot) => shot.id === shotId) ?? this.shots[0] ?? null;
  }

  cloneScript() {
    return EVENT_SCRIPT.map((event, index) => ({
      ...event,
      index,
      status: "pending",
    }));
  }

  resetSession() {
    this.events = this.cloneScript();
    this.currentEventIndex = 0;
    this.elapsed = 0;
    this.score = 0;
    this.perfectCuts = 0;
    this.goodCuts = 0;
    this.lateCuts = 0;
    this.missedCuts = 0;
    this.cleanStreak = 0;
    this.bestStreak = 0;
    this.feedback = { text: "", tone: "neutral", remaining: 0 };
    this.resultData = null;
    this.subscriberResult = null;
    this.setSelectedShot(this.defaultShotId, { silent: true });
    this.buildTimeline();
  }

  buildShotGuide() {
    if (!this.shotGuideElement) {
      return;
    }

    this.shotGuideElement.replaceChildren();
    this.shots.forEach((shot) => {
      const item = document.createElement("div");
      item.className = "producer-man__shot-guide-item";
      item.innerHTML = `
        <div class="producer-man__shot-guide-head">
          <span class="producer-man__shot-guide-key">${shot.key}</span>
          <strong>${shot.label}</strong>
        </div>
        <div class="producer-man__shot-guide-copy">${shot.description}</div>
      `;
      this.shotGuideElement.append(item);
    });
  }

  buildShotButtons() {
    if (!this.shotButtonsElement) {
      return;
    }

    this.shotButtonsElement.replaceChildren();
    this.shotButtonMap.clear();

    this.shots.forEach((shot) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "producer-man__shot-button";
      button.dataset.shotId = shot.id;
      button.dataset.active = "false";
      button.dataset.recommended = "false";
      button.innerHTML = `
        <span class="producer-man__shot-button-top">
          <span class="producer-man__shot-button-key">${shot.key}</span>
          <span class="producer-man__shot-button-label">${shot.label}</span>
        </span>
        <span class="producer-man__shot-button-copy">${shot.shortLabel}</span>
      `;
      button.addEventListener("click", () => this.handleShotSelection(shot.id, { fromInput: true }));
      this.shotButtonsElement.append(button);
      this.shotButtonMap.set(shot.id, button);
    });
  }

  buildTimeline() {
    if (!this.timelineEventsElement) {
      return;
    }

    this.timelineEventsElement.replaceChildren();
    this.timelineEventElements = this.events.map((event) => {
      const marker = document.createElement("div");
      marker.className = "producer-man__timeline-event";
      marker.style.left = `${(event.cue / SESSION_LENGTH) * 100}%`;
      marker.dataset.state = "pending";
      marker.title = `${event.type} -> ${this.getShotById(event.shotId)?.label ?? event.shotId}`;
      this.timelineEventsElement.append(marker);
      return marker;
    });
  }

  start({
    hostName = "Production",
    introLine = "Switch the live hangar cameras on cue and keep the episode looking clean.",
  } = {}) {
    this.audio.ensureContext();
    this.hostName = hostName;
    this.introLine = introLine;
    this.active = true;
    this.phase = "ready";
    this.root.classList.remove("forecast-frenzy--hidden");
    this.root.setAttribute("aria-hidden", "false");
    this.root.dataset.visible = "true";
    this.resetSession();
    this.sync();
  }

  beginRun() {
    if (!this.active || this.phase !== "ready") {
      return;
    }

    this.audio.playStart();
    this.resetSession();
    this.phase = "playing";
    this.setFeedback("Stand by. Cut on the cue.", "neutral", 0.9);
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
    if (this.resultElement) {
      this.resultElement.hidden = true;
    }

    if (typeof this.onExit === "function") {
      this.onExit({ reason });
    }
  }

  getCameraOverride() {
    if (!this.active || !this.selectedShotId) {
      return null;
    }
    return { shotId: this.selectedShotId };
  }

  setFeedback(text, tone = "neutral", duration = 0.8) {
    this.feedback = {
      text,
      tone,
      remaining: duration,
    };
  }

  setSelectedShot(shotId, { silent = false } = {}) {
    if (!shotId || !this.getShotById(shotId)) {
      return;
    }

    this.selectedShotId = shotId;
    if (!silent) {
      this.audio.playCut();
    }
  }

  handleShotSelection(shotId, { fromInput = false } = {}) {
    const shot = this.getShotById(shotId);
    if (!shot) {
      return;
    }

    this.setSelectedShot(shot.id);

    if (this.phase === "ready") {
      if (fromInput) {
        this.setFeedback(`${shot.label} preview`, "neutral", 0.4);
      }
      this.sync();
      return;
    }

    if (this.phase !== "playing") {
      this.sync();
      return;
    }

    this.resolveShotInput(shot);
    this.sync();
  }

  getActiveEvent() {
    return this.events[this.currentEventIndex] ?? null;
  }

  resolveEvent(event, outcome) {
    const targetShot = this.getShotById(event.shotId);
    event.status = outcome;
    this.currentEventIndex += 1;

    if (outcome === "perfect") {
      this.score += PERFECT_SCORE;
      this.perfectCuts += 1;
      this.cleanStreak += 1;
      this.bestStreak = Math.max(this.bestStreak, this.cleanStreak);
      this.setFeedback(`Perfect cut • ${targetShot?.label ?? "Camera"}`, "perfect", 0.9);
      this.audio.playPerfect();
      return;
    }

    if (outcome === "good") {
      this.score += GOOD_SCORE;
      this.goodCuts += 1;
      this.cleanStreak += 1;
      this.bestStreak = Math.max(this.bestStreak, this.cleanStreak);
      this.setFeedback(`Good cut • ${targetShot?.label ?? "Camera"}`, "good", 0.85);
      this.audio.playGood();
      return;
    }

    if (outcome === "late") {
      this.score += LATE_SCORE;
      this.lateCuts += 1;
      this.cleanStreak += 1;
      this.bestStreak = Math.max(this.bestStreak, this.cleanStreak);
      this.setFeedback(`Late cut • ${targetShot?.label ?? "Camera"}`, "late", 0.9);
      this.audio.playLate();
      return;
    }

    this.score = Math.max(0, this.score - MISS_PENALTY);
    this.missedCuts += 1;
    this.cleanStreak = 0;
    this.setFeedback(
      outcome === "wrong"
        ? `Wrong camera • wanted ${targetShot?.label ?? "the call"}`
        : `Missed cue • ${event.type}`,
      "bad",
      1,
    );
    this.audio.playMiss();
  }

  resolveShotInput(shot) {
    const event = this.getActiveEvent();
    if (!event) {
      this.setFeedback("Hold the shot. No live cue yet.", "neutral", 0.45);
      return;
    }

    const windowOpen = event.cue - GOOD_EARLY_WINDOW;
    if (this.elapsed < windowOpen) {
      this.setFeedback("Too early. Hold for the cue.", "neutral", 0.45);
      return;
    }

    if (shot.id !== event.shotId) {
      this.resolveEvent(event, "wrong");
      return;
    }

    const offset = this.elapsed - event.cue;
    if (Math.abs(offset) <= PERFECT_WINDOW) {
      this.resolveEvent(event, "perfect");
      return;
    }
    if (offset < -PERFECT_WINDOW) {
      this.resolveEvent(event, "good");
      return;
    }
    if (offset <= LATE_WINDOW) {
      this.resolveEvent(event, "late");
      return;
    }

    this.resolveEvent(event, "missed");
  }

  finishRun() {
    if (this.phase === "result") {
      return;
    }

    this.phase = "result";
    this.resultData = buildResult({
      score: this.score,
      perfectCuts: this.perfectCuts,
      goodCuts: this.goodCuts,
      lateCuts: this.lateCuts,
      missedCuts: this.missedCuts,
      cleanStreak: this.bestStreak,
      totalCues: this.events.length,
    });
    this.subscriberResult =
      typeof this.onRunComplete === "function"
        ? this.onRunComplete({
            gameId: "producerMan",
            performance: getSubscriberPerformance({
              perfectCuts: this.perfectCuts,
              goodCuts: this.goodCuts,
              lateCuts: this.lateCuts,
              totalCues: this.events.length,
            }),
          })
        : null;
    this.audio.playWrap();
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
    const baseChips = this.subscriberResult
      ? this.resultData.chips.filter((chip) => !chip.startsWith("Score "))
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

  syncTimeline(activeEvent) {
    if (this.timelineProgressElement) {
      this.timelineProgressElement.style.width = `${clamp(this.elapsed / SESSION_LENGTH, 0, 1) * 100}%`;
    }

    if (this.timelineLabelElement) {
      const landedCuts = this.perfectCuts + this.goodCuts + this.lateCuts;
      this.timelineLabelElement.textContent = `${landedCuts} / ${this.events.length} landed`;
    }

    this.timelineEventElements.forEach((marker, index) => {
      const event = this.events[index];
      let state = event.status;
      if (event.status === "pending") {
        state = activeEvent?.index === index ? "active" : "pending";
      }
      marker.dataset.state = state;
    });
  }

  syncShotButtons(activeEvent) {
    this.shotButtonMap.forEach((button, shotId) => {
      button.dataset.active = shotId === this.selectedShotId ? "true" : "false";
      button.dataset.recommended = activeEvent?.shotId === shotId ? "true" : "false";
    });
  }

  sync() {
    if (!this.root) {
      return;
    }

    this.root.style.setProperty(
      "--forecast-fade",
      this.phase === "result" ? "0.28" : this.phase === "playing" ? "0.14" : "0.18",
    );
    this.root.style.setProperty("--forecast-intro-overlay", "0");

    const activeEvent = this.phase === "playing" ? this.getActiveEvent() : null;
    const selectedShot = this.getShotById(this.selectedShotId);
    const targetShot = activeEvent ? this.getShotById(activeEvent.shotId) : null;
    const promptStart = activeEvent ? activeEvent.cue - PROMPT_LEAD : 0;
    const deadline = activeEvent ? activeEvent.cue + LATE_WINDOW : 0;
    const countdown = activeEvent ? activeEvent.cue - this.elapsed : 0;
    const cueProgress = activeEvent
      ? clamp((this.elapsed - promptStart) / Math.max(0.001, deadline - promptStart), 0, 1)
      : 0;

    if (this.hostElement) {
      this.hostElement.textContent = `${this.hostName}'s Control Room`;
    }
    if (this.startHostElement) {
      this.startHostElement.textContent = `${this.hostName}'s Switch Desk`;
    }
    if (this.introLineElement) {
      this.introLineElement.textContent = this.introLine;
    }
    if (this.scoreElement) {
      this.scoreElement.textContent = String(this.score);
    }
    if (this.perfectElement) {
      this.perfectElement.textContent = String(this.perfectCuts);
    }
    if (this.goodElement) {
      this.goodElement.textContent = String(this.goodCuts);
    }
    if (this.lateElement) {
      this.lateElement.textContent = String(this.lateCuts);
    }
    if (this.missedElement) {
      this.missedElement.textContent = String(this.missedCuts);
    }
    if (this.timerElement) {
      this.timerElement.textContent = formatTime(SESSION_LENGTH - this.elapsed);
    }
    if (this.selectedShotElement) {
      this.selectedShotElement.textContent = formatCameraLabel(selectedShot);
    }
    if (this.shotTitleElement) {
      this.shotTitleElement.textContent = selectedShot?.label ?? "Stand By";
    }
    if (this.shotDescriptionElement) {
      this.shotDescriptionElement.textContent = selectedShot?.description ?? "Preview the camera bank.";
    }

    if (this.cueStateElement) {
      if (this.phase === "ready") {
        this.cueStateElement.textContent = "Stand By";
      } else if (this.phase === "result") {
        this.cueStateElement.textContent = "Broadcast Wrapped";
      } else if (!activeEvent) {
        this.cueStateElement.textContent = "Final Cue";
      } else if (countdown > GOOD_EARLY_WINDOW) {
        this.cueStateElement.textContent = `Cue in ${countdown.toFixed(1)}s`;
      } else if (countdown >= -PERFECT_WINDOW) {
        this.cueStateElement.textContent = "Cut now";
      } else {
        this.cueStateElement.textContent = `Late window ${Math.max(0, deadline - this.elapsed).toFixed(1)}s`;
      }
    }

    if (this.cuePromptElement) {
      this.cuePromptElement.textContent =
        this.phase === "playing"
          ? formatCameraCall(targetShot)
          : this.phase === "result"
            ? "Show wrapped"
            : "Preview the camera bank";
    }

    if (this.cueDetailElement) {
      if (this.phase === "playing" && activeEvent) {
        this.cueDetailElement.textContent = `Press ${targetShot?.key ?? "?"} for ${targetShot?.label ?? "the correct camera"}.`;
      } else if (this.phase === "result") {
        this.cueDetailElement.textContent = "Replay to run the cut list again.";
      } else {
        this.cueDetailElement.textContent = "The live cue will tell you exactly which camera number to hit.";
      }
    }

    if (this.cueMeterFillElement) {
      this.cueMeterFillElement.style.width = `${cueProgress * 100}%`;
    }

    if (this.promptMetaElement) {
      if (this.phase === "playing" && activeEvent) {
        this.promptMetaElement.textContent = `Cue ${activeEvent.index + 1} • ${activeEvent.type}`;
      } else if (this.phase === "result") {
        this.promptMetaElement.textContent = "Broadcast Wrap";
      } else {
        this.promptMetaElement.textContent = "Live Preview";
      }
    }

    if (this.promptElement) {
      this.promptElement.textContent =
        this.phase === "playing"
          ? formatCameraLabel(targetShot)
          : this.phase === "result"
            ? "Score locked."
            : "The cue will name the camera to cut to.";
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
          ? "Live"
          : this.phase === "result"
            ? "Wrap"
            : "Ready";
      this.statusPillElement.dataset.tone =
        this.phase === "playing" ? "live" : this.phase === "result" ? "result" : "standby";
    }

    if (this.footerElement) {
      if (this.phase === "playing") {
        this.footerElement.textContent = "Hit 1-4 in the cut window. Wrong camera or no cut counts as a bad switch.";
      } else if (this.phase === "result") {
        this.footerElement.textContent = "Enter, Space, or R replays. Escape exits.";
      } else {
        this.footerElement.textContent = "Preview with 1-4. Enter or Space starts the show. Escape exits.";
      }
    }

    if (this.startOverlayElement) {
      this.startOverlayElement.hidden = this.phase !== "ready";
    }

    this.syncShotButtons(activeEvent);
    this.syncTimeline(activeEvent);
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
      if ((event.code === "Enter" || event.code === "Space" || event.code === "KeyR") && !event.repeat) {
        event.preventDefault();
        this.start({
          hostName: this.hostName,
          introLine: this.introLine,
        });
        return true;
      }
      return false;
    }

    const shot = this.shots.find(
      (candidate) =>
        event.code === `Digit${candidate.key}` || event.code === `Numpad${candidate.key}`,
    );

    if (shot && !event.repeat) {
      event.preventDefault();
      this.handleShotSelection(shot.id, { fromInput: true });
      return true;
    }

    if (this.phase === "ready") {
      if ((event.code === "Enter" || event.code === "Space") && !event.repeat) {
        event.preventDefault();
        this.beginRun();
        return true;
      }
      return false;
    }

    return false;
  }

  update(delta) {
    if (!this.active) {
      return;
    }

    if (this.feedback.remaining > 0) {
      this.feedback.remaining = Math.max(0, this.feedback.remaining - delta);
    }

    if (this.phase !== "playing") {
      this.sync();
      return;
    }

    this.elapsed = Math.min(SESSION_LENGTH, this.elapsed + delta);

    while (this.phase === "playing") {
      const event = this.getActiveEvent();
      if (!event) {
        this.finishRun();
        break;
      }

      if (this.elapsed > event.cue + LATE_WINDOW) {
        this.resolveEvent(event, "missed");
        continue;
      }

      break;
    }

    if (this.phase === "playing" && this.elapsed >= SESSION_LENGTH && !this.getActiveEvent()) {
      this.finishRun();
    }

    this.sync();
  }
}
