const SESSION_LENGTH = 40;
const PRE_START_SPAWNS = 2;
const PREVIEW_ACTIVE_LIMIT = 3;
const MAX_ENGAGEMENT = 100;
const RESOLVE_DURATION = 0.42;
const FEEDBACK_DURATION = 0.9;
const INTRO_FADE_OUT = 1.8;
const INTRO_HOLD = 0.5;
const INTRO_FADE_IN = 1.8;

const SLOT_BINDINGS = Array.from({ length: 9 }, (_, index) => ({
  index,
  label: String(index + 1),
  keyCodes: [`Digit${index + 1}`, `Numpad${index + 1}`],
}));

const KEY_TO_SLOT = Object.fromEntries(
  SLOT_BINDINGS.flatMap((binding) => binding.keyCodes.map((code) => [code, binding.index])),
);

const GOOD_MOMENTS = [
  {
    kicker: "HOT TAKE",
    title: "Hot take",
    subtitle: "Opinion clean enough for the timeline",
    feedback: "BANGER",
    points: 120,
  },
  {
    kicker: "QUOTE",
    title: "Insane quote",
    subtitle: "Instant screenshot energy",
    feedback: "POST IT",
    points: 130,
  },
  {
    kicker: "FLEX",
    title: "Founder flex",
    subtitle: "Big confidence, big repost odds",
    feedback: "SEND IT",
    points: 115,
  },
  {
    kicker: "REACTION",
    title: "Funny reaction",
    subtitle: "Perfect clip-loop material",
    feedback: "CLIP THAT",
    points: 105,
  },
  {
    kicker: "NEWS",
    title: "Breaking news mention",
    subtitle: "The episode just moved markets",
    feedback: "THREAD THIS",
    points: 145,
  },
  {
    kicker: "GOSSIP",
    title: "VC gossip",
    subtitle: "Timeline poison in the best way",
    feedback: "GO LIVE",
    points: 125,
  },
  {
    kicker: "STAT",
    title: "Clean stat",
    subtitle: "Data point with screenshot legs",
    feedback: "LOCK IT",
    points: 110,
  },
];

const BAD_MOMENTS = [
  {
    kicker: "DEAD AIR",
    title: "Dead air",
    subtitle: "Nothing to post here",
    feedback: "DEAD AIR",
    points: -75,
  },
  {
    kicker: "RAMBLE",
    title: "Rambling setup",
    subtitle: "Too long, no payoff",
    feedback: "MID CLIP",
    points: -65,
  },
  {
    kicker: "FILLER",
    title: "Off-topic filler",
    subtitle: "This dies in the replies",
    feedback: "SKIP IT",
    points: -55,
  },
];

const TRAP_MOMENTS = [
  {
    kicker: "TRAP",
    title: "Contextless dunk",
    subtitle: "Looks viral, collapses on replay",
    feedback: "BAITED",
    points: -95,
  },
  {
    kicker: "FAKE HEAT",
    title: "Forced controversy",
    subtitle: "Tempting clip, weak timeline shelf life",
    feedback: "LOW SIGNAL",
    points: -90,
  },
  {
    kicker: "CLIP BAIT",
    title: "Out-of-context tease",
    subtitle: "Big bait, no durable post",
    feedback: "DON'T POST",
    points: -100,
  },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${padNumber(mins)}:${padNumber(secs)}`;
}

function pickOne(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function buildResult(stats, reason) {
  let rank = "Clip Warmup";
  if (stats.score >= 1200 && stats.goodHits >= 8) {
    rank = "Feed Scraper";
  }
  if (stats.score >= 1900 && stats.goodHits >= 13 && stats.engagement >= 45) {
    rank = "Timeline Sniper";
  }
  if (stats.score >= 2600 && stats.goodHits >= 17 && stats.engagement >= 60) {
    rank = "Viral Cutter";
  }
  if (stats.score >= 3300 && stats.goodHits >= 21 && stats.engagement >= 70) {
    rank = "Max's Clip God";
  }

  return {
    rank,
    summary:
      reason === "burnout"
        ? `The clipping burrow washed out at ${stats.goodHits} good clips.`
        : `${stats.goodHits} bangers clipped • best combo ${stats.bestCombo} • engagement ${stats.engagement}%`,
    chips: [
      `Score ${stats.score}`,
      `Good ${stats.goodHits}`,
      `Missed ${stats.missedGood}`,
      `Bad hits ${stats.badHits + stats.trapHits}`,
    ],
  };
}

class ClipperAudio {
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

  playGood() {
    this.playTone({ frequency: 820, duration: 0.07, gain: 0.024, type: "triangle" });
    this.playTone({ frequency: 1080, duration: 0.09, gain: 0.022, type: "triangle", when: 0.04 });
    this.playTone({ frequency: 1360, duration: 0.11, gain: 0.018, type: "sine", when: 0.08 });
  }

  playBad() {
    this.playTone({ frequency: 320, duration: 0.08, gain: 0.022, type: "square", slideTo: 250 });
    this.playTone({ frequency: 210, duration: 0.14, gain: 0.02, type: "sawtooth", when: 0.04, slideTo: 150 });
  }

  playMiss() {
    this.playTone({ frequency: 220, duration: 0.16, gain: 0.018, type: "square", slideTo: 150 });
  }

  playStart() {
    this.playTone({ frequency: 460, duration: 0.07, gain: 0.016, type: "triangle" });
    this.playTone({ frequency: 620, duration: 0.08, gain: 0.017, type: "triangle", when: 0.04 });
    this.playTone({ frequency: 840, duration: 0.1, gain: 0.018, type: "triangle", when: 0.08 });
  }

  playFinish() {
    this.playTone({ frequency: 540, duration: 0.12, gain: 0.02, type: "triangle" });
    this.playTone({ frequency: 720, duration: 0.14, gain: 0.02, type: "triangle", when: 0.08 });
    this.playTone({ frequency: 960, duration: 0.18, gain: 0.02, type: "triangle", when: 0.16 });
  }
}

export class MaxClipperOverlay {
  constructor({ root, onExit }) {
    this.root = root;
    this.onExit = onExit;
    this.audio = new ClipperAudio();

    this.introLineElement = root.querySelector("#maxClipperIntroLine");
    this.scoreElement = root.querySelector("#maxClipperScore");
    this.comboElement = root.querySelector("#maxClipperCombo");
    this.clippedElement = root.querySelector("#maxClipperClipped");
    this.timerElement = root.querySelector("#maxClipperTimer");
    this.engagementValueElement = root.querySelector("#maxClipperEngagementValue");
    this.engagementFillElement = root.querySelector("#maxClipperEngagementFill");
    this.feedbackElement = root.querySelector("#maxClipperFeedback");
    this.footerElement = root.querySelector("#maxClipperFooter");
    this.gridElement = root.querySelector("#maxClipperGrid");
    this.timelineProgressElement = root.querySelector("#maxClipperTimelineProgress");
    this.timelineEventsElement = root.querySelector("#maxClipperTimelineEvents");
    this.timelineClockElement = root.querySelector("#maxClipperTimelineClock");
    this.statusPillElement = root.querySelector("#maxClipperStatusPill");
    this.resultElement = root.querySelector("#maxClipperResult");
    this.resultRankElement = root.querySelector("#maxClipperResultRank");
    this.resultSummaryElement = root.querySelector("#maxClipperResultSummary");
    this.resultStatsElement = root.querySelector("#maxClipperResultStats");
    this.startOverlayElement = root.querySelector("#maxClipperStart");
    this.startButton = root.querySelector("#maxClipperStartButton");
    this.exitButton = root.querySelector("#maxClipperExitButton");
    this.replayButton = root.querySelector("#maxClipperReplayButton");
    this.resultExitButton = root.querySelector("#maxClipperResultExitButton");

    this.slotViews = [];
    this.active = false;
    this.phase = "hidden";
    this.phaseTime = 0;
    this.elapsed = 0;
    this.feedback = { text: "", tone: "neutral", remaining: 0 };
    this.introLine = "Whack the postable moments before they duck back under.";
    this.resultData = null;
    this.stats = this.createEmptyStats();
    this.fadeAlpha = 0;
    this.introOverlayAlpha = 0;
    this.cabinetVisible = false;

    this.startButton?.addEventListener("click", () => this.beginRun());
    this.exitButton?.addEventListener("click", () => this.exit("exit"));
    this.replayButton?.addEventListener("click", () => this.start({ introLine: this.introLine }));
    this.resultExitButton?.addEventListener("click", () => this.exit("exit"));

    this.buildSlots();
    this.resetRun();
    this.sync();
  }

  createEmptyStats() {
    return {
      score: 0,
      combo: 0,
      bestCombo: 0,
      goodHits: 0,
      badHits: 0,
      trapHits: 0,
      missedGood: 0,
      engagement: MAX_ENGAGEMENT,
    };
  }

  buildSlots() {
    this.gridElement?.replaceChildren();
    this.slotViews = SLOT_BINDINGS.map((binding) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "max-clipper__slot";
      button.dataset.state = "empty";
      button.dataset.tone = "neutral";
      button.innerHTML = `
        <span class="max-clipper__slot-key">${binding.label}</span>
        <div class="max-clipper__burrow">
          <div class="max-clipper__mole">
            <span class="max-clipper__slot-kicker">Monitoring</span>
            <strong class="max-clipper__slot-title">Clip window idle</strong>
            <span class="max-clipper__slot-subtitle">Wait for the next moment.</span>
            <span class="max-clipper__slot-timer"><span></span></span>
          </div>
          <span class="max-clipper__hole" aria-hidden="true"></span>
        </div>
      `;
      button.addEventListener("click", () => this.handleClip(binding.index));
      this.gridElement?.append(button);
      return {
        binding,
        root: button,
        kicker: button.querySelector(".max-clipper__slot-kicker"),
        title: button.querySelector(".max-clipper__slot-title"),
        subtitle: button.querySelector(".max-clipper__slot-subtitle"),
        timerFill: button.querySelector(".max-clipper__slot-timer span"),
        opportunity: null,
        pulse: 0,
      };
    });
  }

  resetRun() {
    this.elapsed = 0;
    this.feedback = { text: "", tone: "neutral", remaining: 0 };
    this.resultData = null;
    this.stats = this.createEmptyStats();
    this.spawnTimer = 0.56;
    this.phase = "playing";
    this.opportunityCounter = 0;

    this.slotViews.forEach((slot) => {
      slot.opportunity = null;
      slot.pulse = 0;
    });

    for (let index = 0; index < PRE_START_SPAWNS; index += 1) {
      this.spawnOpportunity();
    }
  }

  prepareReadyState() {
    this.elapsed = 0;
    this.feedback = { text: "", tone: "neutral", remaining: 0 };
    this.resultData = null;
    this.stats = this.createEmptyStats();
    this.phaseTime = 0;
    this.introOverlayAlpha = 0;
    this.phase = "ready";
    this.cabinetVisible = true;

    this.slotViews.forEach((slot) => {
      slot.opportunity = null;
      slot.pulse = 0;
    });
  }

  start({ introLine = "Whack the postable moments before they duck back under." } = {}) {
    this.audio.ensureContext();
    this.introLine = introLine;
    this.active = true;
    this.root.classList.remove("forecast-frenzy--hidden");
    this.root.setAttribute("aria-hidden", "false");
    this.resultElement.hidden = true;
    this.prepareReadyState();
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
    this.resetRun();
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

  getProgress() {
    return clamp(this.elapsed / SESSION_LENGTH, 0, 1);
  }

  getSpawnInterval() {
    return lerp(0.76, 0.4, this.getProgress()) + Math.random() * 0.07;
  }

  getLiveLimit() {
    const progress = this.getProgress();
    return progress < 0.35 ? 2 : progress < 0.72 ? 3 : PREVIEW_ACTIVE_LIMIT;
  }

  getLiveCount() {
    return this.slotViews.filter((slot) => slot.opportunity?.state === "live").length;
  }

  createOpportunity() {
    const progress = this.getProgress();
    const roll = Math.random();
    let pool = GOOD_MOMENTS;
    let tone = "good";

    if (roll > 0.56 - progress * 0.05 && roll < 0.79) {
      pool = BAD_MOMENTS;
      tone = "bad";
    } else if (roll >= 0.79) {
      pool = TRAP_MOMENTS;
      tone = "trap";
    }

    const template = pickOne(pool);
    const ttl =
      tone === "good"
        ? lerp(1.95, 1.28, progress) + Math.random() * 0.16
        : tone === "trap"
          ? lerp(1.72, 1.18, progress) + Math.random() * 0.14
          : lerp(2.15, 1.48, progress) + Math.random() * 0.18;

    return {
      id: `clip-${this.opportunityCounter += 1}`,
      tone,
      kicker: template.kicker,
      title: template.title,
      subtitle: template.subtitle,
      feedback: template.feedback,
      points: template.points,
      ttl,
      remaining: ttl,
      spawnedAt: this.elapsed,
      state: "live",
      resolveTimer: 0,
    };
  }

  spawnOpportunity() {
    const emptySlots = this.slotViews.filter((slot) => slot.opportunity === null);
    if (!emptySlots.length) {
      return false;
    }

    const slot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
    slot.opportunity = this.createOpportunity();
    return true;
  }

  showFeedback(text, tone) {
    this.feedback.text = text;
    this.feedback.tone = tone;
    this.feedback.remaining = FEEDBACK_DURATION;
  }

  bumpEngagement(delta) {
    this.stats.engagement = clamp(this.stats.engagement + delta, 0, MAX_ENGAGEMENT);
    if (this.stats.engagement <= 0) {
      this.finishRun("burnout");
    }
  }

  resolveHit(slot, opportunity) {
    slot.pulse = 0.2;

    if (opportunity.tone === "good") {
      const comboBonus = Math.min(160, this.stats.combo * 18);
      const points = opportunity.points + comboBonus;
      this.stats.score += points;
      this.stats.combo += 1;
      this.stats.bestCombo = Math.max(this.stats.bestCombo, this.stats.combo);
      this.stats.goodHits += 1;
      this.bumpEngagement(4);
      this.showFeedback(opportunity.feedback, "good");
      this.audio.playGood();
      slot.opportunity = {
        ...opportunity,
        state: "captured",
        kicker: "CLIPPED",
        title: opportunity.feedback,
        subtitle: `+${points} score`,
        resolveTimer: RESOLVE_DURATION,
      };
      return;
    }

    this.stats.score += opportunity.points;
    this.stats.combo = 0;
    if (opportunity.tone === "trap") {
      this.stats.trapHits += 1;
      this.bumpEngagement(-10);
      this.showFeedback(opportunity.feedback, "trap");
    } else {
      this.stats.badHits += 1;
      this.bumpEngagement(-6);
      this.showFeedback(opportunity.feedback, "bad");
    }
    this.audio.playBad();
    slot.opportunity = {
      ...opportunity,
      state: "wrong",
      kicker: opportunity.tone === "trap" ? "TRAP" : "MISS",
      title: opportunity.feedback,
      subtitle: "Combo broken",
      resolveTimer: RESOLVE_DURATION,
    };
  }

  handleClip(slotIndex) {
    if (!this.active || this.phase !== "playing") {
      return false;
    }

    const slot = this.slotViews[slotIndex];
    if (!slot) {
      return false;
    }

    const opportunity = slot.opportunity;
    if (!opportunity || opportunity.state !== "live") {
      this.stats.score -= 30;
      this.stats.combo = 0;
      this.bumpEngagement(-2);
      this.showFeedback("NO CLIP", "bad");
      this.audio.playBad();
      slot.pulse = 0.16;
      this.sync();
      return true;
    }

    this.resolveHit(slot, opportunity);
    this.sync();
    return true;
  }

  advanceSlots(delta) {
    this.slotViews.forEach((slot) => {
      slot.pulse = Math.max(0, slot.pulse - delta);

      if (!slot.opportunity) {
        return;
      }

      if (slot.opportunity.state === "live") {
        slot.opportunity.remaining -= delta;
        if (slot.opportunity.remaining > 0) {
          return;
        }

        if (slot.opportunity.tone === "good") {
          this.stats.combo = 0;
          this.stats.missedGood += 1;
          this.bumpEngagement(-8);
          this.showFeedback("TOO SLOW", "miss");
          this.audio.playMiss();
          slot.opportunity = {
            ...slot.opportunity,
            state: "missed",
            kicker: "MISSED",
            title: "Too slow",
            subtitle: "The clip window closed",
            resolveTimer: 0.34,
          };
          return;
        }

        slot.opportunity = {
          ...slot.opportunity,
          state: "gone",
          resolveTimer: 0.12,
        };
        return;
      }

      slot.opportunity.resolveTimer -= delta;
      if (slot.opportunity.resolveTimer <= 0) {
        slot.opportunity = null;
      }
    });
  }

  finishRun(reason = "time") {
    if (this.phase === "result") {
      return;
    }

    this.phase = "result";
    this.resultData = buildResult(this.stats, reason);
    this.audio.playFinish();
    this.sync();
  }

  syncGrid() {
    this.slotViews.forEach((slot) => {
      const card = slot.opportunity;
      const tone = card?.tone ?? "neutral";
      const state = card?.state ?? "empty";
      slot.root.dataset.state = state;
      slot.root.dataset.tone = tone;
      slot.root.dataset.pulse = slot.pulse > 0 ? "true" : "false";

      if (!card) {
        slot.kicker.textContent = "Monitoring";
        slot.title.textContent = "Clip hole idle";
        slot.subtitle.textContent = "Wait for the next moment to pop up.";
        slot.timerFill.style.width = "0%";
        return;
      }

      slot.kicker.textContent = card.kicker;
      slot.title.textContent = card.title;
      slot.subtitle.textContent = card.subtitle;
      const remainingRatio = card.state === "live" ? clamp(card.remaining / card.ttl, 0, 1) : 0;
      slot.timerFill.style.width = `${remainingRatio * 100}%`;
    });
  }

  syncTimeline() {
    if (this.timelineProgressElement) {
      this.timelineProgressElement.style.width = `${this.getProgress() * 100}%`;
    }
    if (this.timelineClockElement) {
      this.timelineClockElement.textContent = formatTime(SESSION_LENGTH - this.elapsed);
    }
    if (!this.timelineEventsElement) {
      return;
    }

    this.timelineEventsElement.replaceChildren();
    this.slotViews.forEach((slot) => {
      if (!slot.opportunity) {
        return;
      }
      const marker = document.createElement("div");
      marker.className = "max-clipper__timeline-event";
      marker.dataset.tone = slot.opportunity.tone;
      marker.dataset.state = slot.opportunity.state;
      const left = clamp((slot.opportunity.spawnedAt / SESSION_LENGTH) * 100, 0, 98);
      const width = clamp((slot.opportunity.ttl / SESSION_LENGTH) * 100, 4, 14);
      marker.style.left = `${left}%`;
      marker.style.width = `${width}%`;
      this.timelineEventsElement.append(marker);
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

  syncFeedback() {
    if (!this.feedbackElement) {
      return;
    }

    const visible = this.feedback.remaining > 0;
    this.feedbackElement.textContent = visible ? this.feedback.text : "";
    this.feedbackElement.dataset.visible = visible ? "true" : "false";
    this.feedbackElement.dataset.tone = this.feedback.tone;
  }

  sync() {
    this.root.dataset.visible = this.cabinetVisible ? "true" : "false";

    if (this.introLineElement) {
      this.introLineElement.textContent = this.introLine;
    }
    if (this.scoreElement) {
      this.scoreElement.textContent = String(this.stats.score);
    }
    if (this.comboElement) {
      this.comboElement.textContent = `${this.stats.combo}x`;
    }
    if (this.clippedElement) {
      this.clippedElement.textContent = String(this.stats.goodHits);
    }
    if (this.timerElement) {
      this.timerElement.textContent = formatTime(SESSION_LENGTH - this.elapsed);
    }
    if (this.engagementValueElement) {
      this.engagementValueElement.textContent = `${this.stats.engagement}%`;
    }
    if (this.engagementFillElement) {
      this.engagementFillElement.style.width = `${this.stats.engagement}%`;
    }
    if (this.footerElement) {
      if (this.phase === "intro") {
        this.footerElement.textContent = "Stand by.";
      } else if (this.phase === "ready") {
        this.footerElement.textContent = "Let the fade land, then click Start when you're ready.";
      } else if (this.phase === "result") {
        this.footerElement.textContent = "Press Enter, Space, or R to run it back. Escape exits.";
      } else {
        this.footerElement.textContent = "Whack a pop-up or use 1-9 before it ducks back under.";
      }
    }
    if (this.statusPillElement) {
      this.statusPillElement.textContent =
        this.phase === "intro"
          ? "Loading"
          : this.phase === "ready"
            ? "Stand By"
            : this.phase === "result"
              ? "Session Over"
              : "Live Feed";
      this.statusPillElement.dataset.tone =
        this.phase === "intro" || this.phase === "ready" || this.phase === "result" ? "result" : "live";
    }
    this.root.style.setProperty("--forecast-fade", this.fadeAlpha.toFixed(3));
    this.root.style.setProperty("--forecast-intro-overlay", this.introOverlayAlpha.toFixed(3));
    if (this.startOverlayElement) {
      const visible = this.phase === "ready";
      this.startOverlayElement.hidden = !visible;
      this.startOverlayElement.style.display = visible ? "" : "none";
    }

    this.syncGrid();
    this.syncFeedback();
    this.syncTimeline();
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

    if (this.phase === "intro") {
      return false;
    }

    const slotIndex = KEY_TO_SLOT[event.code];
    if (slotIndex == null) {
      return false;
    }

    event.preventDefault();
    this.handleClip(slotIndex);
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

    if (this.phase !== "playing") {
      return;
    }

    this.elapsed += delta;
    this.feedback.remaining = Math.max(0, this.feedback.remaining - delta);

    this.advanceSlots(delta);
    if (this.phase !== "playing") {
      return;
    }

    if (this.elapsed >= SESSION_LENGTH) {
      this.finishRun("time");
      return;
    }

    this.spawnTimer -= delta;
    while (this.spawnTimer <= 0) {
      if (this.getLiveCount() < this.getLiveLimit()) {
        this.spawnOpportunity();
      }
      this.spawnTimer += this.getSpawnInterval();
    }

    this.sync();
  }
}
