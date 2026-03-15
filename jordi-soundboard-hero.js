const AVAILABLE_TRACKS = [
  {
    id: "cod4",
    title: "COD4",
    filename: "Cod4.mp3",
    laneLabel: "COD4",
    keyLabel: "1 / A",
    keyCodes: ["Digit1", "Numpad1", "KeyA"],
    color: "#ff6f61",
  },
  {
    id: "horse",
    title: "Horse",
    filename: "Eneas Mentzel - The Steed - Horse Bellowing up Close.mp3",
    laneLabel: "HORSE",
    keyLabel: "2 / S",
    keyCodes: ["Digit2", "Numpad2", "KeyS"],
    color: "#ffb347",
  },
  {
    id: "ashton",
    title: "Ashton",
    filename: "AshtonHall_NEW.mp3",
    laneLabel: "ASHTON",
    keyLabel: "3 / D",
    keyCodes: ["Digit3", "Numpad3", "KeyD"],
    color: "#ffd166",
  },
  {
    id: "gong",
    title: "Size Gong",
    filename: "SizeGong_NEW.mp3",
    laneLabel: "GONG",
    keyLabel: "4 / F",
    keyCodes: ["Digit4", "Numpad4", "KeyF"],
    color: "#64d58b",
  },
  {
    id: "success",
    title: "Success",
    filename: "Overnight Success_NEW1.mp3",
    laneLabel: "SUCCESS",
    color: "#49c6e5",
  },
  {
    id: "cheer",
    title: "Cheering",
    filename: "Cheering.mp3",
    laneLabel: "CHEER",
    color: "#6c8bff",
  },
  {
    id: "vibe",
    title: "Vibe Coded",
    filename: "Vibe Coded 2.mp3",
    laneLabel: "VIBE",
    color: "#f16fff",
  },
];

const LANE_BINDINGS = [
  { keyLabel: "1 / A", keyCodes: ["Digit1", "Numpad1", "KeyA"] },
  { keyLabel: "2 / S", keyCodes: ["Digit2", "Numpad2", "KeyS"] },
  { keyLabel: "3 / D", keyCodes: ["Digit3", "Numpad3", "KeyD"] },
  { keyLabel: "4 / F", keyCodes: ["Digit4", "Numpad4", "KeyF"] },
];

const INTRO_FADE_OUT = 1.5;
const INTRO_HOLD = 0.45;
const INTRO_FADE_IN = 1.3;
const EXIT_DURATION = 0.34;
const COUNTDOWN_SECONDS = 3;
const NOTE_TRAVEL_TIME = 4.6;
const HIT_WINDOW = 0.15;
const PERFECT_WINDOW = 0.05;
const MISS_WINDOW = 0.18;
const FEEDBACK_DURATION = 0.65;
const NOTE_FADE_TIME = 0.28;
const PRE_START_DELAY = 1.8;
const POST_RUN_BUFFER = 1.3;

const KEY_TO_LANE = Object.fromEntries(
  LANE_BINDINGS.flatMap((binding, laneIndex) => binding.keyCodes.map((code) => [code, laneIndex])),
);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function shuffle(array) {
  const copy = [...array];
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

function formatPercent(value) {
  return `${Math.round(clamp(value, 0, 1) * 100)}%`;
}

function pickActiveTracks() {
  return shuffle(AVAILABLE_TRACKS).slice(0, LANE_BINDINGS.length);
}

function buildChart(trackCount) {
  const notes = [];
  let time = PRE_START_DELAY;
  let beatIndex = 0;

  while (time < 28) {
    const laneOrder = shuffle(Array.from({ length: trackCount }, (_, laneIndex) => laneIndex));
    const chordChance = time > 20 ? 0.07 : time > 12 ? 0.03 : 0.01;
    const laneCount = Math.random() < chordChance ? 2 : 1;
    for (let index = 0; index < laneCount; index += 1) {
      notes.push({
        id: `note-${beatIndex}-${index}`,
        lane: laneOrder[index],
        hitTime: Number(time.toFixed(3)),
        resolved: false,
        hit: false,
        missed: false,
        judgement: "",
        resolvedAt: 0,
        element: null,
      });
    }

    const baseSpacing = time < 12 ? 1.4 : time < 22 ? 1.18 : 1.02;
    const jitter = (Math.random() - 0.5) * 0.02;
    time += baseSpacing + jitter;

    if (beatIndex > 0 && beatIndex % 12 === 0) {
      time += 0.22;
    }
    beatIndex += 1;
  }

  return {
    notes,
    duration: time + POST_RUN_BUFFER,
  };
}

function buildResult(stats, noteCount) {
  const accuracy = noteCount > 0 ? stats.hits / noteCount : 0;
  let rank = "Clip Warmup Act";

  if (stats.score >= 700 && accuracy >= 0.45) {
    rank = "Meme Roadie";
  }
  if (stats.score >= 1100 && accuracy >= 0.62) {
    rank = "Soundboard Sniper";
  }
  if (stats.score >= 1500 && accuracy >= 0.78) {
    rank = "Arcade Headliner";
  }
  if (stats.score >= 1950 && accuracy >= 0.9) {
    rank = "Jordi's Clip God";
  }

  return {
    rank,
    summary: `${stats.hits}/${noteCount} notes hit • ${formatPercent(accuracy)} accuracy • best combo ${stats.bestCombo}`,
    chips: [
      `Score ${stats.score}`,
      `Perfect ${stats.perfect}`,
      `Good ${stats.good}`,
      `Misses ${stats.misses + stats.falseStarts}`,
    ],
  };
}

class SoundboardHeroAudio {
  constructor(tracks) {
    this.trackPools = tracks.map((track) => ({
      index: 0,
      pool: Array.from({ length: 3 }, () => {
        const audio = new Audio(new URL(`./Soundboard/${track.filename}`, import.meta.url).href);
        audio.preload = "auto";
        audio.volume = 0.22;
        return audio;
      }),
    }));
    this.context = null;
    this.activeClip = null;
  }

  prime() {
    this.trackPools.forEach(({ pool }) => {
      pool.forEach((audio) => {
        audio.load();
      });
    });
    this.ensureContext();
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

  playLane(laneIndex) {
    const entry = this.trackPools[laneIndex];
    if (!entry) {
      return;
    }

    if (this.activeClip && this.activeClip !== entry) {
      this.activeClip.pool.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    }

    const audio = entry.pool[entry.index % entry.pool.length];
    entry.index += 1;
    audio.pause();
    audio.currentTime = 0;
    this.activeClip = entry;
    audio.onended = () => {
      if (this.activeClip === entry) {
        entry.pool.forEach((clip) => {
          if (clip !== audio) {
            clip.pause();
            clip.currentTime = 0;
          }
        });
      }
    };
    audio.play().catch(() => {});
  }

  playTone({ frequency, duration, type = "square", gain = 0.018, startOffset = 0, slideTo = null }) {
    const context = this.ensureContext();
    if (!context) {
      return;
    }

    const start = context.currentTime + startOffset;
    const end = start + duration;
    const oscillator = context.createOscillator();
    const amp = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo != null) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), end);
    }
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(amp);
    amp.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }

  playCountdown() {
    this.playTone({ frequency: 660, duration: 0.08, gain: 0.025 });
  }

  playGo() {
    this.playTone({ frequency: 780, duration: 0.08, gain: 0.03 });
    this.playTone({ frequency: 1040, duration: 0.16, gain: 0.028, startOffset: 0.06 });
  }

  playPerfect() {
    this.playTone({ frequency: 1180, duration: 0.09, gain: 0.024, type: "triangle" });
  }

  playGood() {
    this.playTone({ frequency: 880, duration: 0.08, gain: 0.02, type: "triangle" });
  }

  playMiss() {
    this.playTone({ frequency: 210, duration: 0.14, gain: 0.028, type: "sawtooth", slideTo: 130 });
  }

  playFinish() {
    this.playTone({ frequency: 660, duration: 0.14, gain: 0.022, type: "triangle" });
    this.playTone({ frequency: 880, duration: 0.16, gain: 0.022, type: "triangle", startOffset: 0.08 });
    this.playTone({ frequency: 1180, duration: 0.2, gain: 0.022, type: "triangle", startOffset: 0.16 });
  }
}

export class JordiSoundboardHeroOverlay {
  constructor({ root, onExit }) {
    this.root = root;
    this.onExit = onExit;
    this.introLineElement = root.querySelector("#jordiHeroIntroLine");
    this.scoreElement = root.querySelector("#jordiHeroScore");
    this.comboElement = root.querySelector("#jordiHeroCombo");
    this.accuracyElement = root.querySelector("#jordiHeroAccuracy");
    this.timerElement = root.querySelector("#jordiHeroTimer");
    this.feedbackElement = root.querySelector("#jordiHeroFeedback");
    this.countdownElement = root.querySelector("#jordiHeroCountdown");
    this.footerElement = root.querySelector("#jordiHeroFooter");
    this.highwayElement = root.querySelector("#jordiHeroHighway");
    this.playlistElement = root.querySelector("#jordiHeroPlaylist");
    this.resultElement = root.querySelector("#jordiHeroResult");
    this.resultRankElement = root.querySelector("#jordiHeroResultRank");
    this.resultSummaryElement = root.querySelector("#jordiHeroResultSummary");
    this.resultStatsElement = root.querySelector("#jordiHeroResultStats");
    this.replayButton = root.querySelector("#jordiHeroReplayButton");
    this.exitButton = root.querySelector("#jordiHeroExitButton");
    this.panelLabelElement = root.querySelector("#jordiHeroPanelLabel");

    this.tracks = pickActiveTracks();
    this.audio = new SoundboardHeroAudio(this.tracks);
    this.lanes = [];
    this.chart = { notes: [], duration: 0 };
    this.stats = this.createEmptyStats();
    this.active = false;
    this.phase = "hidden";
    this.phaseTime = 0;
    this.fadeAlpha = 0;
    this.introOverlayAlpha = 0;
    this.cabinetVisible = false;
    this.exitReason = "exit";
    this.feedbackUntil = 0;
    this.countdownDisplay = "";
    this.countdownSecond = null;
    this.introLine = "Four lanes. Four MP3s. Hit the line clean.";
    this.resultData = null;
    this.noteTrackHeight = 0;
    this.lanePulseUntil = Array(LANE_BINDINGS.length).fill(0);

    this.buildLanes();
    this.replayButton?.addEventListener("click", () => {
      this.start({ introLine: this.introLine });
    });
    this.exitButton?.addEventListener("click", () => {
      this.exit("exit");
    });
    this.sync();
  }

  createEmptyStats() {
    return {
      score: 0,
      combo: 0,
      bestCombo: 0,
      hits: 0,
      misses: 0,
      falseStarts: 0,
      perfect: 0,
      good: 0,
      elapsed: 0,
    };
  }

  buildLanes() {
    this.highwayElement?.replaceChildren();
    this.highwayElement?.style.setProperty(
      "grid-template-columns",
      `repeat(${this.tracks.length}, minmax(0, 1fr))`,
    );
    this.playlistElement?.replaceChildren();
    this.lanes = this.tracks.map((track, laneIndex) => {
      const binding = LANE_BINDINGS[laneIndex];
      const lane = document.createElement("div");
      lane.className = "jordi-hero__lane";
      lane.style.setProperty("--lane-color", track.color);
      lane.innerHTML = `
        <div class="jordi-hero__lane-head">
          <span class="jordi-hero__lane-key">${binding.keyLabel}</span>
          <strong class="jordi-hero__lane-title">${track.laneLabel}</strong>
        </div>
        <div class="jordi-hero__track">
          <div class="jordi-hero__note-track"></div>
          <div class="jordi-hero__strike-zone">
            <span>${track.laneLabel}</span>
          </div>
        </div>
      `;
      this.highwayElement?.append(lane);

      const playlistItem = document.createElement("div");
      playlistItem.className = "jordi-hero__playlist-item";
      playlistItem.style.setProperty("--lane-color", track.color);
      playlistItem.innerHTML = `
        <span class="jordi-hero__playlist-key">${binding.keyLabel}</span>
        <div class="jordi-hero__playlist-copy">
          <strong>${track.title}</strong>
          <span>${track.filename}</span>
        </div>
      `;
      this.playlistElement?.append(playlistItem);

      return {
        root: lane,
        noteTrack: lane.querySelector(".jordi-hero__note-track"),
        strikeZone: lane.querySelector(".jordi-hero__strike-zone"),
        playlistItem,
        laneIndex,
      };
    });
  }

  resetRun() {
    this.tracks = pickActiveTracks();
    this.audio = new SoundboardHeroAudio(this.tracks);
    this.chart = buildChart(this.tracks.length);
    this.stats = this.createEmptyStats();
    this.resultData = null;
    this.feedbackUntil = 0;
    this.countdownDisplay = "";
    this.countdownSecond = null;
    this.lanePulseUntil.fill(0);
    this.noteTrackHeight = 0;

    this.buildLanes();

    this.lanes.forEach((lane) => {
      lane.noteTrack?.replaceChildren();
      lane.root.dataset.active = "false";
      lane.playlistItem.dataset.active = "false";
    });

    this.chart.notes.forEach((note) => {
      const element = document.createElement("div");
      element.className = "jordi-hero__note";
      element.style.setProperty("--lane-color", this.tracks[note.lane].color);
      element.innerHTML = `<span>${this.tracks[note.lane].laneLabel}</span>`;
      this.lanes[note.lane].noteTrack?.append(element);
      note.element = element;
    });
  }

  start({ introLine = "Four lanes. Four MP3s. Hit the line clean." } = {}) {
    this.audio.prime();
    this.introLine = introLine;
    this.resetRun();
    this.active = true;
    this.phase = "intro";
    this.phaseTime = 0;
    this.fadeAlpha = 0;
    this.introOverlayAlpha = 0;
    this.cabinetVisible = false;
    this.exitReason = "exit";
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

  showFeedback(text, tone = "neutral") {
    this.feedbackElement.textContent = text;
    this.feedbackElement.dataset.visible = "true";
    this.feedbackElement.dataset.tone = tone;
    this.feedbackUntil = performance.now() * 0.001 + FEEDBACK_DURATION;
  }

  resolveHit(note, timeDelta) {
    note.resolved = true;
    note.hit = true;
    note.resolvedAt = this.stats.elapsed;
    this.stats.hits += 1;
    this.stats.combo += 1;
    this.stats.bestCombo = Math.max(this.stats.bestCombo, this.stats.combo);

    const perfect = Math.abs(timeDelta) <= PERFECT_WINDOW;
    note.judgement = perfect ? "perfect" : "good";
    if (perfect) {
      this.stats.perfect += 1;
      this.stats.score += 110;
      this.audio.playPerfect();
    } else {
      this.stats.good += 1;
      this.stats.score += 70;
      this.audio.playGood();
    }
    this.stats.score += Math.min(90, Math.max(0, this.stats.combo - 1) * 4);

    this.audio.playLane(note.lane);
    this.showFeedback(
      `${perfect ? "PERFECT" : "GOOD"} • ${this.tracks[note.lane].title}`,
      perfect ? "perfect" : "good",
    );
  }

  resolveMiss(note, falseStart = false) {
    if (falseStart) {
      this.stats.falseStarts += 1;
      this.stats.combo = 0;
      this.showFeedback("MISS • Empty lane", "miss");
      this.audio.playMiss();
      return;
    }

    note.resolved = true;
    note.missed = true;
    note.resolvedAt = this.stats.elapsed;
    note.judgement = "miss";
    this.stats.misses += 1;
    this.stats.combo = 0;
    this.showFeedback(`MISS • ${this.tracks[note.lane].title}`, "miss");
    this.audio.playMiss();
  }

  attemptHit(laneIndex) {
    const now = this.stats.elapsed;
    const match = this.chart.notes
      .filter((note) => !note.resolved && note.lane === laneIndex)
      .map((note) => ({
        note,
        delta: note.hitTime - now,
      }))
      .filter(({ delta }) => Math.abs(delta) <= HIT_WINDOW)
      .sort((a, b) => Math.abs(a.delta) - Math.abs(b.delta))[0];

    if (!match) {
      this.resolveMiss(null, true);
      return false;
    }

    this.resolveHit(match.note, match.delta);
    return true;
  }

  finishRun() {
    if (this.phase === "result") {
      return;
    }
    this.phase = "result";
    this.phaseTime = 0;
    this.resultData = buildResult(this.stats, this.chart.notes.length);
    this.audio.playFinish();
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
      if (event.code === "Enter" || event.code === "Space" || event.code === "KeyR") {
        event.preventDefault();
        this.start({ introLine: this.introLine });
        return true;
      }
      return false;
    }

    const laneIndex = KEY_TO_LANE[event.code];
    if (laneIndex == null) {
      return false;
    }

    event.preventDefault();
    this.lanePulseUntil[laneIndex] = performance.now() * 0.001 + 0.12;
    if (this.phase === "playing") {
      this.attemptHit(laneIndex);
    }
    this.syncLanes();
    return true;
  }

  processMisses() {
    this.chart.notes.forEach((note) => {
      if (!note.resolved && this.stats.elapsed - note.hitTime > MISS_WINDOW) {
        this.resolveMiss(note);
      }
    });
  }

  syncHud() {
    const totalAttempts = this.stats.hits + this.stats.misses + this.stats.falseStarts;
    const accuracy = totalAttempts > 0 ? this.stats.hits / totalAttempts : 1;
    if (this.introLineElement) {
      this.introLineElement.textContent = this.introLine;
    }
    if (this.panelLabelElement) {
      this.panelLabelElement.textContent =
        this.phase === "playing" ? "Jordi Soundboard Hero" : "Set warming up";
    }
    if (this.scoreElement) {
      this.scoreElement.textContent = String(this.stats.score);
    }
    if (this.comboElement) {
      this.comboElement.textContent = `${this.stats.combo}x`;
    }
    if (this.accuracyElement) {
      this.accuracyElement.textContent = formatPercent(accuracy);
    }
    if (this.timerElement) {
      const remaining = Math.max(0, this.chart.duration - this.stats.elapsed - POST_RUN_BUFFER);
      this.timerElement.textContent = formatTime(remaining);
    }
    if (this.footerElement) {
      if (this.phase === "playing") {
        this.footerElement.textContent = "Use 1-7 or A / S / D / F / J / K / L. Escape exits.";
      } else if (this.phase === "result") {
        this.footerElement.textContent = "Press Enter or R to replay. Escape exits.";
      } else {
        this.footerElement.textContent = "Watch the strike line. Each lane triggers one MP3 from Soundboard.";
      }
    }
  }

  syncLanes() {
    const wallTime = performance.now() * 0.001;
    this.lanes.forEach((lane, laneIndex) => {
      const active = wallTime < this.lanePulseUntil[laneIndex];
      lane.root.dataset.active = active ? "true" : "false";
      lane.playlistItem.dataset.active = active ? "true" : "false";
    });
  }

  syncFeedback() {
    if (!this.feedbackElement) {
      return;
    }
    const visible = performance.now() * 0.001 < this.feedbackUntil;
    this.feedbackElement.dataset.visible = visible ? "true" : "false";
  }

  syncCountdown() {
    if (!this.countdownElement) {
      return;
    }
    const visible = this.phase === "countdown";
    this.countdownElement.dataset.visible = visible ? "true" : "false";
    this.countdownElement.textContent = visible ? this.countdownDisplay : "";
  }

  syncResult() {
    if (!this.resultElement) {
      return;
    }
    const visible = this.phase === "result";
    this.resultElement.hidden = !visible;
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

  renderNotes() {
    if (!this.lanes.length) {
      return;
    }

    this.noteTrackHeight = this.lanes[0].noteTrack?.clientHeight ?? this.noteTrackHeight;
    const trackHeight = Math.max(1, this.noteTrackHeight || 1);
    const spawnY = -58;
    const strikeZone = this.lanes[0].strikeZone;
    const strikeY = strikeZone
      ? strikeZone.offsetTop + Math.max(0, (strikeZone.offsetHeight - 48) / 2)
      : trackHeight - 88;

    this.chart.notes.forEach((note) => {
      if (!note.element) {
        return;
      }

      const timeUntil = note.hitTime - this.stats.elapsed;
      const tooEarly = timeUntil > NOTE_TRAVEL_TIME + 0.2;
      const fullyExpired = note.resolved && this.stats.elapsed - note.resolvedAt > NOTE_FADE_TIME;

      if (tooEarly || fullyExpired) {
        note.element.hidden = true;
        return;
      }

      note.element.hidden = false;
      if (note.hit) {
        note.element.dataset.state = "hit";
        note.element.style.top = `${strikeY}px`;
        return;
      }
      if (note.missed) {
        note.element.dataset.state = "miss";
        note.element.style.top = `${strikeY}px`;
        return;
      }

      note.element.dataset.state = "live";
      const progress = 1 - clamp(timeUntil / NOTE_TRAVEL_TIME, 0, 1);
      const y = lerp(spawnY, strikeY, progress);
      note.element.style.top = `${y}px`;
    });
  }

  sync() {
    this.root.dataset.visible = this.cabinetVisible ? "true" : "false";
    this.root.style.setProperty("--forecast-fade", this.fadeAlpha.toFixed(3));
    this.root.style.setProperty("--forecast-intro-overlay", this.introOverlayAlpha.toFixed(3));
    this.root.style.setProperty("--forecast-flash-opacity", "0");
    this.root.style.setProperty("--forecast-flash-color", "255,255,255");
    this.syncHud();
    this.syncLanes();
    this.syncFeedback();
    this.syncCountdown();
    this.syncResult();
    this.renderNotes();
  }

  update(delta) {
    if (!this.active) {
      return;
    }

    this.phaseTime += delta;

    if (this.phase === "intro") {
      const totalIntro = INTRO_FADE_OUT + INTRO_HOLD + INTRO_FADE_IN;
      if (this.phaseTime >= totalIntro) {
        this.phase = "countdown";
        this.phaseTime = 0;
        this.cabinetVisible = true;
        this.introOverlayAlpha = 0;
        this.countdownDisplay = String(COUNTDOWN_SECONDS);
        this.countdownSecond = COUNTDOWN_SECONDS;
        this.audio.playCountdown();
        this.showFeedback("Hands up. Jordi is cueing the board.", "neutral");
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

    if (this.phase === "countdown") {
      const wholeSeconds = Math.floor(this.phaseTime);
      if (wholeSeconds < COUNTDOWN_SECONDS) {
        const display = String(COUNTDOWN_SECONDS - wholeSeconds);
        if (display !== this.countdownDisplay) {
          this.countdownDisplay = display;
        }
        const secondValue = COUNTDOWN_SECONDS - wholeSeconds;
        if (secondValue !== this.countdownSecond) {
          this.countdownSecond = secondValue;
          this.audio.playCountdown();
        }
      } else if (this.countdownDisplay !== "GO") {
        this.countdownDisplay = "GO";
        this.audio.playGo();
        this.showFeedback("GO • fire every clip on time", "perfect");
      }

      if (this.phaseTime >= COUNTDOWN_SECONDS + 0.6) {
        this.phase = "playing";
        this.phaseTime = 0;
        this.countdownDisplay = "";
        this.countdownSecond = null;
      }

      this.sync();
      return;
    }

    if (this.phase === "playing") {
      this.stats.elapsed += delta;
      this.processMisses();
      if (this.stats.elapsed >= this.chart.duration && this.chart.notes.every((note) => note.resolved)) {
        this.finishRun();
        return;
      }
      this.sync();
      return;
    }

    if (this.phase === "result") {
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
