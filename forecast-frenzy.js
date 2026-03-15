const KEY_LABELS = ["1", "2", "3", "4"];
const QUESTION_COUNT = 10;
const FEEDBACK_TIME = 0.95;
const INTRO_FADE_OUT = 1.8;
const INTRO_HOLD = 0.5;
const INTRO_FADE_IN = 1.8;

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

function formatScore(value) {
  return String(Math.max(0, Math.round(value)));
}

function mapRange(value, inputMin, inputMax, outputMin, outputMax) {
  const progress = clamp((value - inputMin) / (inputMax - inputMin || 1), 0, 1);
  return lerp(outputMin, outputMax, progress);
}

function buildRoundDeck(roundPool) {
  const easyRounds = shuffle(roundPool.filter((round) => round.difficulty === 1)).slice(0, 4);
  const mediumRounds = shuffle(roundPool.filter((round) => round.difficulty === 2)).slice(0, 4);
  const hardRounds = shuffle(roundPool.filter((round) => round.difficulty === 3)).slice(0, 2);

  return [...easyRounds, ...mediumRounds, ...hardRounds].slice(0, QUESTION_COUNT).map((round, index) => {
    const choicePairs = shuffle(
      round.choices.map((copy, choiceIndex) => ({
        copy,
        choiceIndex,
      })),
    );

    return {
      ...round,
      deckId: `${round.id}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      choices: choicePairs.map(({ copy }) => copy),
      correctIndex: choicePairs.findIndex(({ choiceIndex }) => choiceIndex === round.correctIndex),
    };
  });
}

function buildResult(engine) {
  const accuracy = engine.totalRounds > 0 ? engine.correctAnswers / engine.totalRounds : 0;
  let rank = "Amateur Forecaster";

  if (engine.score >= 650 && accuracy >= 0.45) {
    rank = "Local Meteorologist";
  }
  if (engine.score >= 950 && accuracy >= 0.6) {
    rank = "Storm Chaser";
  }
  if (engine.score >= 1225 && accuracy >= 0.75) {
    rank = "Chief Weather Officer";
  }
  if (engine.score >= 1500 && accuracy >= 0.88) {
    rank = "Climate Wizard";
  }

  return {
    rank,
    accuracy,
    score: engine.score,
    correctAnswers: engine.correctAnswers,
    wrongAnswers: engine.wrongAnswers,
    bestStreak: engine.bestStreak,
    questionsAnswered: engine.correctAnswers + engine.wrongAnswers,
    totalRounds: engine.totalRounds,
  };
}

const RETRO_MAP_CITIES = [
  { name: "Seattle", x: 0.12, y: 0.18, temp: 82 },
  { name: "Portland", x: 0.11, y: 0.26, temp: 83 },
  { name: "San Francisco", x: 0.08, y: 0.54, temp: 84 },
  { name: "Los Angeles", x: 0.12, y: 0.67, temp: 84 },
  { name: "Phoenix", x: 0.24, y: 0.74, temp: 101 },
  { name: "Salt Lake", x: 0.26, y: 0.4, temp: 56 },
  { name: "Denver", x: 0.4, y: 0.48, temp: 39 },
  { name: "Rapid City", x: 0.46, y: 0.34, temp: 48 },
  { name: "Minneapolis", x: 0.64, y: 0.22, temp: 52 },
  { name: "Chicago", x: 0.72, y: 0.38, temp: 67 },
  { name: "St. Louis", x: 0.7, y: 0.5, temp: 90 },
  { name: "Dallas", x: 0.56, y: 0.73, temp: 87 },
  { name: "Houston", x: 0.61, y: 0.88, temp: 89 },
  { name: "Atlanta", x: 0.79, y: 0.72, temp: 87 },
  { name: "Washington", x: 0.86, y: 0.5, temp: 87 },
  { name: "Boston", x: 0.92, y: 0.22, temp: 81 },
  { name: "Miami", x: 0.9, y: 0.95, temp: 88 },
];

function createForecastFrenzyRounds() {
  return [
    {
      id: "radar-thunderstorm",
      difficulty: 1,
      term: "Thunderstorm",
      banner: "Metro Storm Sweep",
      promptLabel: "Radar Read",
      prompt: "Thunderstorm",
      choices: [
        "A storm with lightning, thunder, rain, and gusty wind",
        "A long stretch of cloudless, calm weather",
        "A period of unusually high temperatures",
        "A low cloud layer sitting at ground level",
      ],
      correctIndex: 0,
      severity: "high",
      quip: "Storms are building. Stay sharp.",
      scene: {
        mode: "map",
        accent: "#35d39a",
        cityLabel: "Metro",
        alert: "SEVERE CELL",
        stormCells: [
          { x: 0.24, y: 0.28, radius: 0.15, color: "#5ff18d", dx: 0.06, dy: 0.03 },
          { x: 0.29, y: 0.43, radius: 0.13, color: "#ffd54d", dx: 0.08, dy: 0.04 },
          { x: 0.36, y: 0.51, radius: 0.1, color: "#ff625b", dx: 0.1, dy: 0.05 },
        ],
        lightning: [{ x: 0.41, y: 0.45, scale: 1 }],
        arrows: [
          { x: 0.2, y: 0.19, angle: 0.64, length: 0.1 },
          { x: 0.3, y: 0.16, angle: 0.82, length: 0.11 },
          { x: 0.22, y: 0.55, angle: 0.23, length: 0.12 },
        ],
        pressure: [{ label: "L", x: 0.18, y: 0.18, color: "#ff7c72" }],
        icons: [
          { type: "rain", x: 0.82, y: 0.63, scale: 1.1 },
          { type: "bolt", x: 0.85, y: 0.48, scale: 0.92 },
        ],
      },
    },
    {
      id: "low-pressure",
      difficulty: 1,
      term: "Low Pressure",
      banner: "Pressure Drop",
      promptLabel: "Pressure Read",
      prompt: "Low Pressure",
      choices: [
        "An area where rising air often leads to clouds and unsettled weather",
        "An area of sinking air linked with clear, stable weather",
        "A geologic fault movement deep underground",
        "A burst of heat caused only by strong sunshine",
      ],
      correctIndex: 0,
      severity: "medium",
      quip: "Low pressure likes drama.",
      scene: {
        mode: "map",
        accent: "#72c6ff",
        cityLabel: "Coastline",
        alert: "LOW PRESSURE",
        pressure: [
          { label: "L", x: 0.36, y: 0.31, color: "#ff8d77" },
          { label: "H", x: 0.72, y: 0.64, color: "#74b9ff" },
        ],
        arrows: [
          { x: 0.22, y: 0.23, angle: 0.62, length: 0.1 },
          { x: 0.44, y: 0.22, angle: 2.2, length: 0.09 },
          { x: 0.25, y: 0.44, angle: -0.26, length: 0.1 },
          { x: 0.5, y: 0.51, angle: 2.74, length: 0.08 },
          { x: 0.59, y: 0.73, angle: -2.4, length: 0.08 },
        ],
        stormCells: [
          { x: 0.38, y: 0.42, radius: 0.11, color: "#91f2aa", dx: 0.05, dy: 0.03 },
          { x: 0.46, y: 0.48, radius: 0.08, color: "#ffd95b", dx: 0.05, dy: 0.02 },
        ],
        icons: [{ type: "cloud", x: 0.78, y: 0.22, scale: 1.05 }],
      },
    },
    {
      id: "high-pressure",
      difficulty: 1,
      term: "High Pressure",
      banner: "Clear Skies",
      promptLabel: "Sky Read",
      prompt: "High Pressure",
      choices: [
        "An area of sinking air that usually brings calm, clear weather",
        "A rotating column of air extending from a storm",
        "Water rising rapidly over dry ground",
        "A trapped cold fog bank that lasts for days",
      ],
      correctIndex: 0,
      severity: "low",
      quip: "High pressure usually means calmer skies.",
      scene: {
        mode: "map",
        accent: "#7dd6ff",
        cityLabel: "Sunset Bay",
        alert: "HIGH PRESSURE",
        pressure: [{ label: "H", x: 0.5, y: 0.42, color: "#88b8ff" }],
        arrows: [
          { x: 0.3, y: 0.19, angle: 0.24, length: 0.09 },
          { x: 0.7, y: 0.24, angle: 2.95, length: 0.09 },
          { x: 0.32, y: 0.64, angle: -0.4, length: 0.09 },
          { x: 0.68, y: 0.68, angle: -2.82, length: 0.09 },
        ],
        icons: [
          { type: "sun", x: 0.78, y: 0.22, scale: 1.08 },
          { type: "wind", x: 0.78, y: 0.62, scale: 0.9 },
        ],
      },
    },
    {
      id: "temperature-inversion",
      difficulty: 2,
      term: "Temperature Inversion",
      banner: "Inversion Watch",
      promptLabel: "Atmosphere Layer",
      prompt: "Temperature Inversion",
      choices: [
        "A warm layer sits above cooler air near the ground",
        "Cold upper air forces warm surface air upward all day",
        "A tropical cyclone rapidly strengthening over warm ocean water",
        "A burst of charged solar particles disrupting Earth",
      ],
      correctIndex: 0,
      severity: "medium",
      quip: "Read the layers, not the hype.",
      scene: {
        mode: "crossSection",
        accent: "#9de6ff",
        alert: "LAYER LOCK",
        layers: [
          { y: 0.72, color: "#ffa14d", label: "Warm cap" },
          { y: 0.53, color: "#5ac8fa", label: "Cold pool" },
        ],
        smog: true,
        arrows: [
          { x: 0.28, y: 0.68, angle: 0, length: 0.1 },
          { x: 0.72, y: 0.68, angle: Math.PI, length: 0.1 },
        ],
        icons: [{ type: "fog", x: 0.78, y: 0.35, scale: 1.02 }],
      },
    },
    {
      id: "lightning-alert",
      difficulty: 1,
      term: "Lightning Alert",
      banner: "Lightning Alarm",
      promptLabel: "Hazard Check",
      prompt: "Lightning Alert",
      choices: [
        "A warning that cloud-to-ground lightning is likely or active nearby",
        "A notice that rainfall totals are far below normal for months",
        "A winter storm with strong wind and blowing snow",
        "A large zone of trapped heat under strong high pressure",
      ],
      correctIndex: 0,
      severity: "high",
      quip: "When the bolts show up, do not overthink it.",
      scene: {
        mode: "stormSky",
        accent: "#6fb3ff",
        alert: "LIGHTNING",
        lightning: [
          { x: 0.42, y: 0.22, scale: 1.15 },
          { x: 0.61, y: 0.26, scale: 0.84 },
        ],
        stormCells: [
          { x: 0.5, y: 0.24, radius: 0.22, color: "#485675", dx: 0.01, dy: 0.02 },
        ],
        icons: [
          { type: "bolt", x: 0.82, y: 0.21, scale: 1.1 },
          { type: "rain", x: 0.8, y: 0.51, scale: 1.1 },
        ],
        arrows: [
          { x: 0.26, y: 0.62, angle: -0.36, length: 0.16 },
          { x: 0.74, y: 0.58, angle: -2.74, length: 0.16 },
        ],
      },
    },
    {
      id: "cloud-id",
      difficulty: 2,
      term: "Cumulonimbus",
      banner: "Cloud Lab",
      promptLabel: "Cloud ID",
      prompt: "Cumulonimbus",
      choices: [
        "A tall thunderstorm cloud with strong vertical growth",
        "A thin, wispy high cloud made of ice crystals",
        "A flat, gray cloud layer spread low across the sky",
        "A curved wall of fog moving inland from cold water",
      ],
      correctIndex: 0,
      severity: "medium",
      quip: "That anvil top is a loud clue.",
      scene: {
        mode: "cloudLab",
        accent: "#b4ecff",
        alert: "CLOUD ID",
        cloudType: "cumulonimbus",
        lightning: [{ x: 0.58, y: 0.46, scale: 0.72 }],
        icons: [{ type: "rain", x: 0.8, y: 0.54, scale: 1 }],
      },
    },
    {
      id: "forecast-fix",
      difficulty: 2,
      term: "Thunderstorms",
      banner: "Forecast Fix",
      promptLabel: "Studio Override",
      prompt: "Thunderstorms",
      choices: [
        "Storms that produce thunder, lightning, rain, and gusty wind",
        "Conditions with sun, low humidity, and no rain expected",
        "Light snow falling in brief scattered bursts",
        "A safety warning for dangerous prolonged heat",
      ],
      correctIndex: 0,
      severity: "high",
      quip: "Never trust a sunny board with a red radar.",
      scene: {
        mode: "board",
        accent: "#ffd166",
        alert: "OVERRIDE",
        board: {
          headline: "Sunny?!",
          subhead: "24 C and calm",
        },
        stormCells: [
          { x: 0.2, y: 0.26, radius: 0.12, color: "#59f48d", dx: 0.08, dy: 0.03 },
          { x: 0.28, y: 0.44, radius: 0.12, color: "#ffd553", dx: 0.08, dy: 0.04 },
          { x: 0.38, y: 0.55, radius: 0.09, color: "#ff645c", dx: 0.09, dy: 0.05 },
        ],
        lightning: [{ x: 0.4, y: 0.52, scale: 0.9 }],
        pressure: [{ label: "L", x: 0.16, y: 0.18, color: "#ff7f72" }],
      },
    },
    {
      id: "cold-front",
      difficulty: 2,
      term: "Cold Front",
      banner: "Front Tracker",
      promptLabel: "Front Read",
      prompt: "Cold Front",
      choices: [
        "The leading edge of colder air pushing under warmer air",
        "A sudden permanent drop in yearly rainfall",
        "A sky pattern with only sun and no temperature change",
        "Small rocks from space burning through the atmosphere",
      ],
      correctIndex: 0,
      severity: "medium",
      quip: "Blue triangles usually mean the breeze is about to bite.",
      scene: {
        mode: "map",
        accent: "#73ccff",
        cityLabel: "North Point",
        alert: "COLD FRONT",
        frontLine: {
          type: "cold",
          points: [
            [0.27, 0.22],
            [0.38, 0.35],
            [0.49, 0.46],
            [0.58, 0.6],
          ],
        },
        stormCells: [
          { x: 0.52, y: 0.5, radius: 0.08, color: "#7cf0a6", dx: 0.03, dy: 0.02 },
          { x: 0.58, y: 0.56, radius: 0.06, color: "#ffe06a", dx: 0.03, dy: 0.02 },
        ],
        arrows: [
          { x: 0.22, y: 0.62, angle: 0.08, length: 0.12 },
          { x: 0.77, y: 0.34, angle: Math.PI, length: 0.12 },
        ],
        icons: [{ type: "rain", x: 0.8, y: 0.58, scale: 0.92 }],
      },
    },
    {
      id: "rapid-pressure-drop",
      difficulty: 3,
      term: "Rapid Pressure Drop",
      banner: "Barometer Dive",
      promptLabel: "Pressure Trend",
      prompt: "Rapid Pressure Drop",
      choices: [
        "A quick fall in air pressure that often signals an approaching storm",
        "A long-lived zone of stable air and clear skies",
        "Damage caused by radiation from the Sun",
        "A local sea breeze with no major weather change",
      ],
      correctIndex: 0,
      severity: "high",
      quip: "Falling pressure is a warning siren in slow motion.",
      scene: {
        mode: "barometer",
        accent: "#ffcb5c",
        alert: "PRESSURE DROP",
        barometer: {
          value: 0.24,
          trend: "falling fast",
        },
        stormCells: [
          { x: 0.73, y: 0.41, radius: 0.13, color: "#66ed93", dx: 0.07, dy: 0.04 },
          { x: 0.8, y: 0.51, radius: 0.11, color: "#ffd253", dx: 0.08, dy: 0.05 },
          { x: 0.87, y: 0.62, radius: 0.08, color: "#ff615c", dx: 0.09, dy: 0.05 },
        ],
        lightning: [{ x: 0.88, y: 0.56, scale: 0.82 }],
      },
    },
    {
      id: "hook-echo",
      difficulty: 3,
      term: "Hook Echo",
      banner: "Rotation Scan",
      promptLabel: "Radar Signature",
      prompt: "Hook Echo",
      choices: [
        "A curved radar signature that can indicate a rotating severe storm",
        "A weak onshore wind caused by daytime coastal heating",
        "A brief patch of light rain early in the day",
        "A layer of warm air sitting above cooler surface air",
      ],
      correctIndex: 0,
      severity: "high",
      quip: "That curve is a bad actor on radar.",
      scene: {
        mode: "map",
        accent: "#50da9d",
        cityLabel: "River City",
        alert: "ROTATION",
        stormCells: [
          { x: 0.36, y: 0.28, radius: 0.14, color: "#68ef98", dx: 0.05, dy: 0.03 },
          { x: 0.42, y: 0.41, radius: 0.1, color: "#ffd453", dx: 0.06, dy: 0.04 },
          { x: 0.47, y: 0.48, radius: 0.09, color: "#ff6357", dx: 0.07, dy: 0.04 },
          { x: 0.4, y: 0.56, radius: 0.08, color: "#ff6357", dx: -0.03, dy: 0.01 },
        ],
        hook: true,
        arrows: [
          { x: 0.26, y: 0.34, angle: 0.82, length: 0.1 },
          { x: 0.54, y: 0.29, angle: 2.24, length: 0.1 },
          { x: 0.31, y: 0.61, angle: -0.48, length: 0.1 },
          { x: 0.56, y: 0.58, angle: -2.56, length: 0.1 },
        ],
        lightning: [{ x: 0.48, y: 0.52, scale: 0.75 }],
        icons: [{ type: "wind", x: 0.8, y: 0.3, scale: 1.06 }],
      },
    },
  ];
}

class ForecastFrenzyAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.lastWarningTime = 0;
  }

  ensureContext() {
    if (!window.AudioContext && !window.webkitAudioContext) {
      return null;
    }

    if (!this.context) {
      const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
      this.context = new AudioContextCtor();
      this.master = this.context.createGain();
      this.master.gain.value = 0.14;
      this.master.connect(this.context.destination);
    }

    if (this.context.state === "suspended") {
      this.context.resume();
    }

    return this.context;
  }

  tone(frequency, duration, {
    type = "square",
    volume = 0.16,
    delay = 0,
    slideTo = null,
  } = {}) {
    const context = this.ensureContext();
    if (!context || !this.master) {
      return;
    }

    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  playStart() {
    this.tone(280, 0.08, { type: "square", volume: 0.1 });
    this.tone(420, 0.09, { type: "square", volume: 0.12, delay: 0.08 });
    this.tone(560, 0.14, { type: "triangle", volume: 0.12, delay: 0.16 });
  }

  playCorrect() {
    this.tone(660, 0.12, { type: "triangle", volume: 0.16 });
    this.tone(880, 0.16, { type: "triangle", volume: 0.12, delay: 0.08 });
  }

  playWrong() {
    this.tone(180, 0.18, { type: "sawtooth", volume: 0.14, slideTo: 120 });
  }

  playWarning() {
    const now = performance.now();
    if (now - this.lastWarningTime < 450) {
      return;
    }
    this.lastWarningTime = now;
    this.tone(940, 0.06, { type: "square", volume: 0.08 });
  }

  playEnd() {
    this.tone(520, 0.1, { type: "triangle", volume: 0.1 });
    this.tone(620, 0.12, { type: "triangle", volume: 0.12, delay: 0.08 });
    this.tone(780, 0.22, { type: "triangle", volume: 0.14, delay: 0.18 });
  }
}

class ForecastFrenzyEngine {
  constructor(roundPool) {
    this.roundPool = roundPool;
    this.reset();
  }

  reset() {
    this.active = false;
    this.phase = "hidden";
    this.phaseTime = 0;
    this.fadeAlpha = 0;
    this.cabinetVisible = false;
    this.score = 0;
    this.streak = 0;
    this.bestStreak = 0;
    this.correctAnswers = 0;
    this.wrongAnswers = 0;
    this.roundIndex = 0;
    this.totalRounds = 0;
    this.deck = [];
    this.currentRound = null;
    this.feedback = null;
    this.selectedIndex = null;
    this.introLine = "Match the term.";
    this.footer = "Press 1-4 to answer";
    this.bannerText = "Weather console booting";
    this.flashOpacity = 0;
    this.flashColor = "255,255,255";
    this.shakeStrength = 0;
    this.alarmActive = false;
    this.warningIssued = false;
    this.result = null;
    this.introOverlayAlpha = 0;
  }

  start({ introLine = "Match the term." } = {}) {
    this.reset();
    this.active = true;
    this.phase = "intro";
    this.phaseTime = 0;
    this.introLine = introLine;
    this.deck = buildRoundDeck(this.roundPool);
    this.totalRounds = this.deck.length;
    this.cabinetVisible = false;
    this.fadeAlpha = 0;
    this.introOverlayAlpha = 0;
    this.currentRound = this.deck[0] ?? null;
  }

  beginRound() {
    this.currentRound = this.deck[this.roundIndex];
    this.phase = "question";
    this.phaseTime = 0;
    this.feedback = null;
    this.selectedIndex = null;
    this.warningIssued = false;
    this.bannerText = this.currentRound.banner;
    this.footer = "Click or press 1-4 to answer";
    this.alarmActive = this.currentRound.severity === "high";
  }

  resolveAnswer(selectedIndex, timedOut = false) {
    if (!this.currentRound || this.phase === "feedback" || this.phase === "results" || this.phase === "intro") {
      return false;
    }

    if (!timedOut && this.phase !== "question") {
      return false;
    }

    if (timedOut && this.phase !== "question") {
      return false;
    }

    this.selectedIndex = selectedIndex;
    const correct = selectedIndex === this.currentRound.correctIndex;
    let gained = 0;
    let multiplier = 1;
    let title = "Forecast Locked";
    let subtitle = "Good read.";

    if (correct) {
      this.streak += 1;
      this.correctAnswers += 1;
      this.bestStreak = Math.max(this.bestStreak, this.streak);
      multiplier = this.streak >= 6 ? 1.5 : this.streak >= 3 ? 1.25 : 1;
      gained = Math.round(100 * multiplier);
      this.score += gained;
      title = this.streak >= 4 ? "Hot Streak" : "Forecast Locked";
      subtitle = `${gained} pts${this.streak >= 3 ? ` | STREAK x${this.streak}` : ""}`;
      this.flashColor = "115,255,177";
      this.flashOpacity = 0.26;
    } else {
      this.streak = 0;
      this.wrongAnswers += 1;
      gained = -50;
      this.score = Math.max(0, this.score + gained);
      title = timedOut ? "Signal Missed" : "Wrong Call";
      subtitle = timedOut ? "-50 pts | Time ran out." : "-50 pts | That read does not match the map.";
      this.flashColor = "255,98,98";
      this.flashOpacity = 0.18;
      this.shakeStrength = 1;
    }

    this.feedback = {
      correct,
      title,
      subtitle,
      gained,
      multiplier,
      timedOut,
      correctIndex: this.currentRound.correctIndex,
      selectedIndex,
    };
    this.phase = "feedback";
    this.phaseTime = 0;
    this.footer = "Keep reading the map";
    this.alarmActive = !correct && this.currentRound.severity === "high";
    return true;
  }

  update(delta) {
    if (!this.active) {
      return;
    }

    this.phaseTime += delta;
    this.flashOpacity = Math.max(0, this.flashOpacity - delta * 0.9);
    this.shakeStrength = Math.max(0, this.shakeStrength - delta * 3.4);

    if (this.phase === "intro") {
      const totalIntro = INTRO_FADE_OUT + INTRO_HOLD + INTRO_FADE_IN;
      if (this.phaseTime >= totalIntro) {
        this.cabinetVisible = true;
        this.introOverlayAlpha = 0;
        this.beginRound();
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
      }
      return;
    }

    if (this.phase === "question") {
      return;
    }

    if (this.phase === "feedback" && this.phaseTime >= FEEDBACK_TIME) {
      if (this.roundIndex >= this.totalRounds - 1) {
        this.phase = "results";
        this.phaseTime = 0;
        this.alarmActive = false;
        this.result = buildResult(this);
        this.footer = "Choose Replay or Exit";
      } else {
        this.roundIndex = (this.roundIndex + 1) % this.totalRounds;
        this.beginRound();
      }
      return;
    }

    if (this.phase === "transitionOut") {
      const exitProgress = clamp(this.phaseTime / 0.34, 0, 1);
      this.fadeAlpha = lerp(0.18, 1, easeOutCubic(exitProgress));
      this.cabinetVisible = exitProgress < 0.92;
      if (exitProgress >= 1) {
        this.active = false;
        this.phase = "hidden";
        this.cabinetVisible = false;
      }
    }
  }

  shouldPlayWarning() {
    return false;
  }

  markWarningPlayed() {
    this.warningIssued = true;
  }

  continueNow() {
    return false;
  }

  requestExit() {
    if (this.phase === "hidden" || this.phase === "transitionOut") {
      return;
    }
    this.phase = "transitionOut";
    this.phaseTime = 0;
    this.alarmActive = false;
  }

  snapshot() {
    return {
      active: this.active,
      phase: this.phase,
      cabinetVisible: this.cabinetVisible,
      introOverlayAlpha: this.introOverlayAlpha,
      fadeAlpha: this.fadeAlpha,
      flashOpacity: this.flashOpacity,
      flashColor: this.flashColor,
      shakeActive: this.shakeStrength > 0.1,
      score: this.score,
      scoreText: formatScore(this.score),
      streak: this.streak,
      streakText: `x${this.streak}`,
      lives: 0,
      livesMax: 0,
      roundNumber: Math.min(this.totalRounds, this.roundIndex + 1),
      totalRounds: this.totalRounds,
      timerText: "No timer",
      timeRatio: 1,
      currentRound: this.currentRound,
      questionVisible: (this.phase === "question" || this.phase === "feedback" || this.phase === "results") && this.cabinetVisible,
      answersEnabled: this.phase === "question",
      feedback: this.feedback,
      selectedIndex: this.selectedIndex,
      introLine:
        this.phase === "results"
          ? "Forecast complete."
          : this.currentRound?.quip ?? this.introLine,
      bannerText: this.phase === "results" ? "Final Forecast" : this.bannerText,
      footer: this.footer,
      alarmActive: this.alarmActive,
      result: this.result,
      lowTime: false,
      misses: this.wrongAnswers,
    };
  }
}

class ForecastFrenzyRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
  }

  resize() {
    const drawWidth = Math.max(320, Math.round(this.canvas.clientWidth));
    const drawHeight = Math.max(180, Math.round(this.canvas.clientHeight));
    const pixelScale = drawWidth > 960 ? 0.42 : 0.5;
    const width = Math.max(320, Math.round(drawWidth * pixelScale));
    const height = Math.max(180, Math.round(drawHeight * pixelScale));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    return {
      width,
      height,
      drawWidth,
      drawHeight,
      scaleX: width / drawWidth,
      scaleY: height / drawHeight,
    };
  }

  render(snapshot, elapsedTime) {
    if (!snapshot.active && snapshot.phase !== "transitionOut") {
      return;
    }

    const {
      width,
      height,
      drawWidth,
      drawHeight,
      scaleX,
      scaleY,
    } = this.resize();
    const context = this.context;
    context.save();
    context.imageSmoothingEnabled = false;
    context.scale(scaleX, scaleY);

    context.clearRect(0, 0, drawWidth, drawHeight);

    const scene = snapshot.currentRound?.scene ?? {
      accent: "#6fd6ff",
      stormCells: [],
      pressure: [],
      arrows: [],
      icons: [],
    };
    this.drawBackdrop(context, drawWidth, drawHeight, scene, snapshot, elapsedTime);
    this.drawRetroWeatherMap(context, drawWidth, drawHeight, scene, snapshot, elapsedTime);
    context.fillStyle = "rgba(8, 20, 34, 0.5)";
    context.fillRect(0, 0, drawWidth, drawHeight);

    this.drawVignette(context, drawWidth, drawHeight);
    context.restore();
  }

  traceUsMap(context, x, y, width, height) {
    const points = [
      [0.06, 0.19],
      [0.11, 0.11],
      [0.2, 0.08],
      [0.31, 0.1],
      [0.46, 0.1],
      [0.61, 0.12],
      [0.74, 0.13],
      [0.86, 0.18],
      [0.93, 0.24],
      [0.96, 0.35],
      [0.93, 0.54],
      [0.89, 0.73],
      [0.86, 0.89],
      [0.78, 0.95],
      [0.7, 0.88],
      [0.64, 0.8],
      [0.58, 0.83],
      [0.52, 0.78],
      [0.44, 0.84],
      [0.37, 0.92],
      [0.32, 0.86],
      [0.26, 0.71],
      [0.18, 0.69],
      [0.11, 0.76],
      [0.07, 0.68],
      [0.05, 0.57],
      [0.04, 0.43],
    ];

    context.beginPath();
    points.forEach(([px, py], index) => {
      const drawX = x + px * width;
      const drawY = y + py * height;
      if (index === 0) {
        context.moveTo(drawX, drawY);
      } else {
        context.lineTo(drawX, drawY);
      }
    });
    context.closePath();
  }

  colorForHeat(value) {
    if (value < 0.18) return "#59c7ff";
    if (value < 0.34) return "#4ce48a";
    if (value < 0.5) return "#95e43f";
    if (value < 0.66) return "#ffd648";
    if (value < 0.82) return "#ff972d";
    return "#df3e27";
  }

  drawRetroWeatherMap(context, width, height, scene, snapshot, elapsedTime) {
    const mapX = width * 0.04;
    const mapY = height * 0.06;
    const mapWidth = width * 0.92;
    const mapHeight = height * 0.84;

    context.fillStyle = "#0a425f";
    context.fillRect(0, 0, width, height);

    for (let star = 0; star < 28; star += 1) {
      const x = ((star * 59) % width) + (star % 3);
      const y = ((star * 37) % (height * 0.28)) + 2;
      context.fillStyle = star % 4 === 0 ? "#f4f6ff" : "#9ad8ff";
      context.fillRect(x, y, 2, 2);
    }

    this.traceUsMap(context, mapX, mapY, mapWidth, mapHeight);
    context.fillStyle = "#565545";
    context.fill();

    context.save();
    this.traceUsMap(context, mapX, mapY, mapWidth, mapHeight);
    context.clip();

    const cellWidth = mapWidth / 42;
    const cellHeight = mapHeight / 24;
    for (let xIndex = 0; xIndex < 42; xIndex += 1) {
      for (let yIndex = 0; yIndex < 24; yIndex += 1) {
        const nx = xIndex / 41;
        const ny = yIndex / 23;
        const heat =
          0.3 +
          (1 - ny) * -0.22 +
          ny * 0.62 +
          Math.sin(nx * 8 - elapsedTime * 0.55) * 0.06 +
          Math.cos((nx + ny) * 9 + elapsedTime * 0.45) * 0.05 +
          Math.exp(-Math.pow((nx - 0.42) * 5.4, 2) - Math.pow((ny - 0.36) * 5.4, 2)) * -0.3 +
          (scene.severity === "high" ? 0.05 : 0);
        context.fillStyle = this.colorForHeat(clamp(heat, 0, 1));
        context.fillRect(
          mapX + xIndex * cellWidth,
          mapY + yIndex * cellHeight,
          Math.ceil(cellWidth) + 1,
          Math.ceil(cellHeight) + 1,
        );
      }
    }

    context.strokeStyle = "rgba(18, 25, 22, 0.45)";
    context.lineWidth = 2;
    [0.18, 0.28, 0.38, 0.49, 0.61, 0.73, 0.84].forEach((lineX) => {
      context.beginPath();
      context.moveTo(mapX + mapWidth * lineX, mapY + mapHeight * 0.14);
      context.lineTo(mapX + mapWidth * lineX, mapY + mapHeight * 0.86);
      context.stroke();
    });
    [0.24, 0.36, 0.49, 0.62, 0.75].forEach((lineY) => {
      context.beginPath();
      context.moveTo(mapX + mapWidth * 0.08, mapY + mapHeight * lineY);
      context.lineTo(mapX + mapWidth * 0.93, mapY + mapHeight * lineY);
      context.stroke();
    });

    context.save();
    context.translate(mapX, mapY);
    this.drawFrontLine(context, mapWidth, mapHeight, scene.frontLine);
    this.drawStormCells(context, mapWidth, mapHeight, scene.stormCells, elapsedTime);
    this.drawPressureSystems(context, mapWidth, mapHeight, scene.pressure);
    this.drawWindArrows(context, mapWidth, mapHeight, scene.arrows, elapsedTime);
    this.drawLightning(context, mapWidth, mapHeight, scene.lightning, elapsedTime);
    this.drawSceneIcons(context, mapWidth, mapHeight, scene.icons, elapsedTime);
    context.restore();

    context.restore();

    this.traceUsMap(context, mapX, mapY, mapWidth, mapHeight);
    context.lineWidth = 4;
    context.strokeStyle = "#dfe7ce";
    context.stroke();

    this.drawRetroMapHeader(context, width, snapshot);
    this.drawRetroMapCities(context, mapX, mapY, mapWidth, mapHeight, snapshot, elapsedTime);
  }

  drawRetroMapHeader(context, width, snapshot) {
    context.fillStyle = "#f3f1e7";
    context.fillRect(14, 12, width - 28, 42);
    context.fillStyle = "#b71412";
    context.fillRect(22, 19, 34, 28);
    context.fillStyle = "#ffffff";
    context.font = '700 12px "Courier New", monospace';
    context.fillText("FF", 31, 37);
    context.fillStyle = "#111111";
    context.font = '700 17px "Courier New", monospace';
    context.fillText(
      `${snapshot.currentRound?.promptLabel?.toUpperCase() ?? "FORECAST"} MAP`,
      70,
      38,
    );
  }

  drawRetroMapCities(context, mapX, mapY, mapWidth, mapHeight, snapshot, elapsedTime) {
    RETRO_MAP_CITIES.forEach((city, index) => {
      const tempOffset = Math.round(
        Math.sin(elapsedTime * 0.8 + index * 0.6) * 1.2 +
        (snapshot.currentRound?.severity === "high" ? 1 : 0),
      );
      const temp = city.temp + tempOffset;
      const tone = this.colorForHeat(clamp((temp - 35) / 70, 0, 1));
      const x = mapX + mapWidth * city.x;
      const y = mapY + mapHeight * city.y;

      context.fillStyle = tone;
      context.fillRect(x - 18, y - 18, 42, 22);
      context.strokeStyle = "#111111";
      context.lineWidth = 2;
      context.strokeRect(x - 18, y - 18, 42, 22);
      context.fillStyle = "#ffffff";
      context.font = '700 13px "Courier New", monospace';
      context.fillText(`${temp}`, x - 10, y - 3);
      context.font = '700 8px "Courier New", monospace';
      context.fillStyle = "#f4f6ff";
      context.fillText(city.name.toUpperCase(), x - 20, y + 16);
    });
  }

  drawBackdrop(context, width, height, scene, snapshot, elapsedTime) {
    const accent = scene?.accent ?? "#56d1ff";
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#041724");
    gradient.addColorStop(1, "#07314a");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    const glow = context.createRadialGradient(width * 0.5, height * 0.48, 40, width * 0.5, height * 0.48, width * 0.65);
    glow.addColorStop(0, `${accent}22`);
    glow.addColorStop(1, "rgba(4, 16, 30, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);

    if (snapshot.alarmActive) {
      context.fillStyle = `rgba(255, 72, 72, ${0.05 + Math.sin(elapsedTime * 9) * 0.03})`;
      context.fillRect(0, 0, width, height);
    }
  }

  drawRadarScene(context, width, height, scene, snapshot, elapsedTime) {
    const centerX = width * 0.38;
    const centerY = height * 0.5;
    const radius = Math.min(width, height) * 0.32;

    this.drawRadarGrid(context, centerX, centerY, radius, elapsedTime);
    this.drawFrontLine(context, width, height, scene.frontLine);
    this.drawStormCells(context, width, height, scene.stormCells, elapsedTime);
    if (scene.hook) {
      this.drawHookEcho(context, width, height, elapsedTime);
    }
    this.drawPressureSystems(context, width, height, scene.pressure);
    this.drawWindArrows(context, width, height, scene.arrows, elapsedTime);
    this.drawLightning(context, width, height, scene.lightning, elapsedTime);
    this.drawSceneIcons(context, width, height, scene.icons, elapsedTime);
    this.drawCityMarker(context, width, height, scene.cityLabel);
    this.drawMapOverlay(context, width, height, snapshot);
  }

  drawCrossSectionScene(context, width, height, scene, snapshot, elapsedTime) {
    const sky = context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#082039");
    sky.addColorStop(0.5, "#173d6a");
    sky.addColorStop(1, "#74879a");
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);

    context.fillStyle = "#263646";
    context.fillRect(0, height * 0.78, width, height * 0.22);
    context.fillStyle = "rgba(130, 170, 210, 0.15)";
    context.fillRect(width * 0.12, height * 0.52, width * 0.76, height * 0.18);

    scene.layers.forEach((layer) => {
      context.fillStyle = `${layer.color}44`;
      context.fillRect(width * 0.12, height * layer.y, width * 0.76, height * 0.08);
      context.fillStyle = layer.color;
      context.font = '700 14px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
      context.fillText(layer.label, width * 0.14, height * layer.y - 10);
    });

    if (scene.smog) {
      for (let index = 0; index < 12; index += 1) {
        const puffX = width * (0.16 + index * 0.06 + Math.sin(elapsedTime * 1.4 + index) * 0.01);
        const puffY = height * (0.75 - (index % 2) * 0.02);
        context.fillStyle = `rgba(190, 204, 211, ${0.12 + (index % 3) * 0.04})`;
        context.beginPath();
        context.arc(puffX, puffY, 28 + (index % 4) * 6, 0, Math.PI * 2);
        context.fill();
      }
    }

    this.drawWindArrows(context, width, height, scene.arrows, elapsedTime);
    this.drawSceneIcons(context, width, height, scene.icons, elapsedTime);
    this.drawSkyline(context, width, height);
    this.drawMapOverlay(context, width, height, snapshot);
  }

  drawStormSkyScene(context, width, height, scene, snapshot, elapsedTime) {
    const sky = context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#040911");
    sky.addColorStop(0.5, "#121e37");
    sky.addColorStop(1, "#1c263a");
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);

    this.drawStormCloudBank(context, width, height, scene.stormCells, elapsedTime);
    this.drawWindArrows(context, width, height, scene.arrows, elapsedTime);
    this.drawLightning(context, width, height, scene.lightning, elapsedTime);
    this.drawRainCurtain(context, width, height, 1.1, elapsedTime);
    this.drawSceneIcons(context, width, height, scene.icons, elapsedTime);
    this.drawSkyline(context, width, height);
    this.drawMapOverlay(context, width, height, snapshot);
  }

  drawCloudScene(context, width, height, scene, snapshot, elapsedTime) {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#5db1ff");
    gradient.addColorStop(0.7, "#86d7ff");
    gradient.addColorStop(1, "#d9f6ff");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    this.drawCloudTower(context, width * 0.5, height * 0.54, Math.min(width, height) * 0.26, elapsedTime);
    this.drawLightning(context, width, height, scene.lightning, elapsedTime);
    this.drawRainCurtain(context, width, height, 0.55, elapsedTime);
    this.drawSceneIcons(context, width, height, scene.icons, elapsedTime);

    context.fillStyle = "rgba(6, 25, 51, 0.72)";
    context.fillRect(width * 0.62, height * 0.1, width * 0.24, height * 0.18);
    context.fillStyle = "#effbff";
    context.font = '700 15px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
    context.fillText("Towering anvil top", width * 0.65, height * 0.18);
    context.font = '500 13px "Courier New", monospace';
    context.fillText("Deep convection", width * 0.65, height * 0.23);
    this.drawMapOverlay(context, width, height, snapshot);
  }

  drawBoardScene(context, width, height, scene, snapshot, elapsedTime) {
    context.fillStyle = "rgba(2, 10, 18, 0.9)";
    context.fillRect(0, 0, width, height);

    context.fillStyle = "rgba(7, 18, 33, 0.9)";
    context.fillRect(width * 0.04, height * 0.08, width * 0.46, height * 0.78);
    context.fillStyle = "rgba(9, 19, 38, 0.92)";
    context.fillRect(width * 0.54, height * 0.08, width * 0.42, height * 0.78);

    context.save();
    context.translate(width * 0.04, height * 0.08);
    this.drawRadarGrid(context, width * 0.23, height * 0.39, Math.min(width, height) * 0.22, elapsedTime);
    this.drawStormCells(context, width * 0.46, height * 0.78, scene.stormCells, elapsedTime);
    this.drawPressureSystems(context, width * 0.46, height * 0.78, scene.pressure);
    this.drawLightning(context, width * 0.46, height * 0.78, scene.lightning, elapsedTime);
    context.restore();

    context.fillStyle = "#f7fbff";
    context.font = '700 24px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
    context.fillText(scene.board.headline, width * 0.62, height * 0.25);
    context.font = '600 18px "Courier New", monospace';
    context.fillStyle = "#ffd166";
    context.fillText(scene.board.subhead, width * 0.62, height * 0.31);
    this.drawIcon(context, "sun", width * 0.83, height * 0.22, 42, elapsedTime);

    context.fillStyle = "rgba(255, 77, 77, 0.14)";
    context.fillRect(width * 0.6, height * 0.44, width * 0.28, height * 0.18);
    context.fillStyle = "#ffd6d3";
    context.font = '700 18px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
    context.fillText("Board mismatch", width * 0.64, height * 0.54);
    context.font = '500 14px "Courier New", monospace';
    context.fillText("Radar override requested", width * 0.64, height * 0.6);
    this.drawMapOverlay(context, width, height, snapshot);
  }

  drawBarometerScene(context, width, height, scene, snapshot, elapsedTime) {
    context.fillStyle = "#06111f";
    context.fillRect(0, 0, width, height);

    const cx = width * 0.28;
    const cy = height * 0.53;
    const radius = Math.min(width, height) * 0.22;
    context.strokeStyle = "rgba(223, 241, 255, 0.26)";
    context.lineWidth = 16;
    context.beginPath();
    context.arc(cx, cy, radius, Math.PI * 0.84, Math.PI * 2.16);
    context.stroke();

    const needleAngle = lerp(Math.PI * 0.86, Math.PI * 2.1, scene.barometer.value);
    context.strokeStyle = "#ffcb5c";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(cx, cy);
    context.lineTo(cx + Math.cos(needleAngle) * (radius - 18), cy + Math.sin(needleAngle) * (radius - 18));
    context.stroke();
    context.fillStyle = "#fff6d0";
    context.beginPath();
    context.arc(cx, cy, 12, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#eff8ff";
    context.font = '700 16px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
    context.fillText("BAROMETER", cx - 54, cy - radius - 22);
    context.font = '600 14px "Courier New", monospace';
    context.fillStyle = "#ffcf69";
    context.fillText(scene.barometer.trend, cx - 48, cy + radius + 28);

    this.drawRadarGrid(context, width * 0.74, height * 0.48, Math.min(width, height) * 0.21, elapsedTime);
    this.drawStormCells(context, width, height, scene.stormCells, elapsedTime);
    this.drawLightning(context, width, height, scene.lightning, elapsedTime);
    this.drawMapOverlay(context, width, height, snapshot);
  }

  drawBootScreen(context, width, height, elapsedTime) {
    context.fillStyle = "#09111d";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "rgba(111, 212, 255, 0.1)";
    context.fillRect(width * 0.12, height * 0.2, width * 0.76, height * 0.58);
    context.fillStyle = "#f3fbff";
    context.font = '700 34px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
    context.fillText("WEATHER MATCH", width * 0.27, height * 0.42);
    context.font = '600 16px "Courier New", monospace';
    context.fillStyle = "#9ee3ff";
    context.fillText(`Initializing station ${".".repeat(1 + (Math.floor(elapsedTime * 2.8) % 3))}`, width * 0.28, height * 0.5);
  }

  drawRadarGrid(context, centerX, centerY, radius, elapsedTime) {
    context.save();
    context.translate(centerX, centerY);

    context.fillStyle = "rgba(8, 17, 28, 0.9)";
    context.beginPath();
    context.arc(0, 0, radius + 20, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = "rgba(117, 255, 193, 0.08)";
    context.lineWidth = 1;
    for (let ring = 0.25; ring <= 1; ring += 0.25) {
      context.beginPath();
      context.arc(0, 0, radius * ring, 0, Math.PI * 2);
      context.stroke();
    }

    context.beginPath();
    context.moveTo(-radius, 0);
    context.lineTo(radius, 0);
    context.moveTo(0, -radius);
    context.lineTo(0, radius);
    context.stroke();

    const sweepAngle = elapsedTime * 1.55;
    const sweepGradient = context.createRadialGradient(0, 0, 12, 0, 0, radius);
    sweepGradient.addColorStop(0, "rgba(126, 255, 201, 0.18)");
    sweepGradient.addColorStop(1, "rgba(126, 255, 201, 0)");
    context.fillStyle = sweepGradient;
    context.beginPath();
    context.moveTo(0, 0);
    context.arc(0, 0, radius, sweepAngle - 0.22, sweepAngle + 0.04);
    context.closePath();
    context.fill();

    context.strokeStyle = "rgba(162, 255, 211, 0.72)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(Math.cos(sweepAngle) * radius, Math.sin(sweepAngle) * radius);
    context.stroke();
    context.restore();
  }

  drawStormCells(context, width, height, stormCells = [], elapsedTime) {
    stormCells.forEach((cell, index) => {
      const x = width * (cell.x + Math.sin(elapsedTime * 0.9 + index) * (cell.dx ?? 0));
      const y = height * (cell.y + Math.cos(elapsedTime * 0.85 + index * 1.4) * (cell.dy ?? 0));
      const radius = Math.min(width, height) * cell.radius;
      const gradient = context.createRadialGradient(x, y, radius * 0.12, x, y, radius);
      gradient.addColorStop(0, `${cell.color}ee`);
      gradient.addColorStop(0.45, `${cell.color}aa`);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    });
  }

  drawPressureSystems(context, width, height, systems = []) {
    systems?.forEach((system) => {
      const x = width * system.x;
      const y = height * system.y;
      context.strokeStyle = `${system.color}66`;
      context.lineWidth = 4;
      context.beginPath();
      context.arc(x, y, 28, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = system.color;
      context.font = '700 42px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
      context.fillText(system.label, x - 16, y + 15);
    });
  }

  drawWindArrows(context, width, height, arrows = [], elapsedTime) {
    arrows?.forEach((arrow, index) => {
      const x = width * arrow.x;
      const y = height * arrow.y;
      const length = width * arrow.length;
      const drift = Math.sin(elapsedTime * 3 + index) * 5;
      const endX = x + Math.cos(arrow.angle) * (length + drift);
      const endY = y + Math.sin(arrow.angle) * (length + drift);
      context.strokeStyle = "rgba(203, 240, 255, 0.74)";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(endX, endY);
      context.stroke();

      const headAngle = arrow.angle + Math.PI;
      context.beginPath();
      context.moveTo(endX, endY);
      context.lineTo(
        endX + Math.cos(headAngle + 0.36) * 14,
        endY + Math.sin(headAngle + 0.36) * 14,
      );
      context.lineTo(
        endX + Math.cos(headAngle - 0.36) * 14,
        endY + Math.sin(headAngle - 0.36) * 14,
      );
      context.closePath();
      context.fillStyle = "rgba(203, 240, 255, 0.74)";
      context.fill();
    });
  }

  drawLightning(context, width, height, strikes = [], elapsedTime) {
    const flashWindow = Math.sin(elapsedTime * 17) > 0.72;
    strikes?.forEach((strike, index) => {
      if (!flashWindow && index % 2 === 1) {
        return;
      }

      const startX = width * strike.x;
      const startY = height * strike.y;
      const segments = 7;
      const points = [{ x: startX, y: startY }];
      for (let step = 1; step <= segments; step += 1) {
        const progress = step / segments;
        points.push({
          x: startX + Math.sin(elapsedTime * 8 + step * 0.7 + index) * 16 * strike.scale,
          y: startY + progress * 150 * strike.scale,
        });
      }

      context.strokeStyle = "rgba(255, 247, 171, 0.92)";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
      context.stroke();
      context.strokeStyle = "rgba(255, 255, 255, 0.68)";
      context.lineWidth = 1.25;
      context.stroke();
    });
  }

  drawSceneIcons(context, width, height, icons = [], elapsedTime) {
    icons?.forEach((icon) => {
      this.drawIcon(
        context,
        icon.type,
        width * icon.x,
        height * icon.y + Math.sin(elapsedTime * 2.2 + icon.x * 10) * 4,
        34 * icon.scale,
        elapsedTime,
      );
    });
  }

  drawCityMarker(context, width, height, cityLabel = "City") {
    const skylineX = width * 0.7;
    const skylineY = height * 0.72;
    context.fillStyle = "rgba(200, 222, 238, 0.18)";
    const buildingHeights = [70, 96, 58, 84, 64, 92];
    buildingHeights.forEach((buildingHeight, index) => {
      context.fillRect(
        skylineX + index * 28,
        skylineY - buildingHeight,
        22,
        buildingHeight,
      );
    });
    context.fillStyle = "#f6fbff";
    context.font = '700 14px "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';
    context.fillText(cityLabel, skylineX + 28, skylineY + 24);
  }

  drawMapOverlay(context, width, height, snapshot) {
    context.strokeStyle = "rgba(255, 255, 255, 0.05)";
    context.lineWidth = 1;
    for (let column = 0; column < 8; column += 1) {
      context.beginPath();
      context.moveTo((width / 8) * column, 0);
      context.lineTo((width / 8) * column, height);
      context.stroke();
    }
    for (let row = 0; row < 5; row += 1) {
      context.beginPath();
      context.moveTo(0, (height / 5) * row);
      context.lineTo(width, (height / 5) * row);
      context.stroke();
    }

    if (snapshot.lowTime) {
      context.fillStyle = `rgba(255, 84, 84, ${0.08 + Math.sin(performance.now() * 0.02) * 0.03})`;
      context.fillRect(0, 0, width, height);
    }
  }

  drawFrontLine(context, width, height, frontLine) {
    if (!frontLine) {
      return;
    }

    context.strokeStyle = "rgba(117, 201, 255, 0.92)";
    context.lineWidth = 4;
    context.beginPath();
    frontLine.points.forEach(([x, y], index) => {
      const drawX = width * x;
      const drawY = height * y;
      if (index === 0) {
        context.moveTo(drawX, drawY);
      } else {
        context.lineTo(drawX, drawY);
      }
    });
    context.stroke();

    for (let index = 1; index < frontLine.points.length; index += 1) {
      const [x, y] = frontLine.points[index];
      const prev = frontLine.points[index - 1];
      const angle = Math.atan2(y - prev[1], x - prev[0]);
      const drawX = width * x;
      const drawY = height * y;
      context.save();
      context.translate(drawX, drawY);
      context.rotate(angle);
      context.fillStyle = "rgba(117, 201, 255, 0.92)";
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(-14, 8);
      context.lineTo(-14, -8);
      context.closePath();
      context.fill();
      context.restore();
    }
  }

  drawHookEcho(context, width, height, elapsedTime) {
    const centerX = width * 0.4;
    const centerY = height * 0.55;
    context.strokeStyle = "rgba(255, 135, 135, 0.66)";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(centerX, centerY, 52, Math.PI * 1.1, Math.PI * 0.1, true);
    context.stroke();
    context.strokeStyle = `rgba(255,255,255,${0.22 + Math.sin(elapsedTime * 8) * 0.1})`;
    context.beginPath();
    context.arc(centerX, centerY, 16, 0, Math.PI * 2);
    context.stroke();
  }

  drawStormCloudBank(context, width, height, stormCells, elapsedTime) {
    context.fillStyle = "rgba(17, 23, 38, 0.92)";
    [0.2, 0.34, 0.48, 0.62, 0.76].forEach((x, index) => {
      context.beginPath();
      context.arc(width * x, height * 0.28 + Math.sin(elapsedTime * 1.2 + index) * 8, 90, 0, Math.PI * 2);
      context.fill();
    });
    this.drawStormCells(context, width, height, stormCells, elapsedTime);
  }

  drawRainCurtain(context, width, height, density, elapsedTime) {
    context.strokeStyle = "rgba(151, 214, 255, 0.48)";
    context.lineWidth = 2;
    const dropCount = Math.round(28 * density);
    for (let index = 0; index < dropCount; index += 1) {
      const x = (width / dropCount) * index + (Math.sin(elapsedTime * 4 + index) * 12);
      const y = mapRange((elapsedTime * 140 + index * 36) % (height + 120), 0, height + 120, -60, height);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x - 8, y + 18);
      context.stroke();
    }
  }

  drawCloudTower(context, centerX, centerY, size, elapsedTime) {
    const puffs = [
      [-0.42, 0.08, 0.26],
      [-0.18, -0.1, 0.28],
      [0.08, -0.18, 0.34],
      [0.26, -0.03, 0.26],
      [0.2, -0.36, 0.24],
      [-0.04, -0.48, 0.22],
      [0.0, 0.25, 0.4],
    ];
    puffs.forEach(([offsetX, offsetY, scale], index) => {
      context.beginPath();
      context.fillStyle = `rgba(255, 255, 255, ${0.92 - index * 0.04})`;
      context.arc(
        centerX + offsetX * size,
        centerY + offsetY * size + Math.sin(elapsedTime * 1.2 + index) * 5,
        size * scale,
        0,
        Math.PI * 2,
      );
      context.fill();
    });

    context.fillStyle = "rgba(240, 248, 255, 0.9)";
    context.beginPath();
    context.ellipse(centerX + size * 0.12, centerY - size * 0.52, size * 0.34, size * 0.12, -0.18, 0, Math.PI * 2);
    context.fill();
  }

  drawSkyline(context, width, height) {
    context.fillStyle = "rgba(9, 17, 26, 0.48)";
    for (let index = 0; index < 18; index += 1) {
      const x = index * (width / 18);
      const buildingHeight = 40 + (index % 5) * 18;
      context.fillRect(x, height * 0.8 - buildingHeight, 22, buildingHeight);
    }
  }

  drawIcon(context, type, x, y, size, elapsedTime) {
    context.save();
    context.translate(x, y);
    switch (type) {
      case "sun":
        context.fillStyle = "#ffd54f";
        context.beginPath();
        context.arc(0, 0, size * 0.34, 0, Math.PI * 2);
        context.fill();
        context.strokeStyle = "rgba(255, 221, 117, 0.84)";
        context.lineWidth = 3;
        for (let ray = 0; ray < 8; ray += 1) {
          const angle = (Math.PI * 2 * ray) / 8 + elapsedTime * 0.3;
          context.beginPath();
          context.moveTo(Math.cos(angle) * size * 0.44, Math.sin(angle) * size * 0.44);
          context.lineTo(Math.cos(angle) * size * 0.68, Math.sin(angle) * size * 0.68);
          context.stroke();
        }
        break;
      case "cloud":
      case "fog":
        context.fillStyle = "rgba(232, 241, 255, 0.95)";
        [-0.22, 0.05, 0.22].forEach((offset, index) => {
          context.beginPath();
          context.arc(offset * size, (index === 1 ? -0.1 : 0) * size, size * 0.22, 0, Math.PI * 2);
          context.fill();
        });
        if (type === "fog") {
          context.strokeStyle = "rgba(230, 240, 255, 0.82)";
          context.lineWidth = 3;
          for (let line = 0; line < 3; line += 1) {
            context.beginPath();
            context.moveTo(-size * 0.4, size * (0.22 + line * 0.14));
            context.lineTo(size * 0.42, size * (0.22 + line * 0.14));
            context.stroke();
          }
        }
        break;
      case "rain":
        this.drawIcon(context, "cloud", 0, 0, size, elapsedTime);
        context.strokeStyle = "rgba(109, 207, 255, 0.88)";
        context.lineWidth = 2;
        [-0.2, 0, 0.2].forEach((offset) => {
          context.beginPath();
          context.moveTo(offset * size, size * 0.26);
          context.lineTo(offset * size - size * 0.08, size * 0.5);
          context.stroke();
        });
        break;
      case "bolt":
        context.fillStyle = "#ffe36a";
        context.beginPath();
        context.moveTo(size * -0.1, size * -0.45);
        context.lineTo(size * 0.08, size * -0.02);
        context.lineTo(size * -0.02, size * -0.02);
        context.lineTo(size * 0.16, size * 0.45);
        context.lineTo(size * -0.2, size * 0.06);
        context.lineTo(size * -0.08, size * 0.06);
        context.closePath();
        context.fill();
        break;
      case "wind":
        context.strokeStyle = "rgba(209, 238, 255, 0.88)";
        context.lineWidth = 3;
        [0, 1, 2].forEach((line) => {
          context.beginPath();
          context.moveTo(-size * 0.42, size * (-0.18 + line * 0.18));
          context.quadraticCurveTo(
            size * 0.02,
            size * (-0.32 + line * 0.18),
            size * 0.38,
            size * (-0.18 + line * 0.18),
          );
          context.stroke();
        });
        break;
      default:
        break;
    }
    context.restore();
  }

  drawVignette(context, width, height) {
    const vignette = context.createRadialGradient(width * 0.5, height * 0.5, width * 0.2, width * 0.5, height * 0.5, width * 0.75);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.38)");
    context.fillStyle = vignette;
    context.fillRect(0, 0, width, height);
  }
}

function createChipElement(label) {
  const chip = document.createElement("div");
  chip.className = "forecast-frenzy__chip";
  chip.textContent = label;
  return chip;
}

export class ForecastFrenzyGame {
  constructor({ root, onExit }) {
    this.root = root;
    this.onExit = onExit;
    this.canvas = root.querySelector("#forecastFrenzyCanvas");
    this.banner = root.querySelector("#forecastBanner");
    this.introLine = root.querySelector("#forecastIntroLine");
    this.score = root.querySelector("#forecastScore");
    this.round = root.querySelector("#forecastRound");
    this.streak = root.querySelector("#forecastStreak");
    this.timerLabel = root.querySelector("#forecastTimerLabel");
    this.timerBar = root.querySelector("#forecastTimerBar");
    this.lives = root.querySelector("#forecastLives");
    this.questionCount = root.querySelector("#forecastQuestionCount");
    this.questionScore = root.querySelector("#forecastQuestionScore");
    this.alert = root.querySelector("#forecastAlert");
    this.feedback = root.querySelector("#forecastFeedback");
    this.startOverlay = root.querySelector("#forecastStart");
    this.questionPrompt = root.querySelector("#forecastQuestionPrompt");
    this.question = root.querySelector("#forecastQuestion");
    this.answers = root.querySelector("#forecastAnswers");
    this.footer = root.querySelector("#forecastFooter");
    this.result = root.querySelector("#forecastResult");
    this.resultRank = root.querySelector("#forecastResultRank");
    this.resultScore = root.querySelector("#forecastResultScore");
    this.resultSummary = root.querySelector("#forecastResultSummary");
    this.resultStats = root.querySelector("#forecastResultStats");
    this.replayButton = root.querySelector("#forecastReplayButton");
    this.exitButton = root.querySelector("#forecastExitButton");

    this.renderer = new ForecastFrenzyRenderer(this.canvas);
    this.audio = new ForecastFrenzyAudio();
    this.engine = new ForecastFrenzyEngine(createForecastFrenzyRounds());
    this.answerButtons = [];
    this.lastRoundDeckId = "";
    this.active = false;
    this.exitReason = "exit";
    this.introSoundPlayed = false;

    this.replayButton?.addEventListener("click", () => {
      this.start({ introLine: "Match the term." });
    });
    this.exitButton?.addEventListener("click", () => {
      this.exit("exit");
    });
  }

  submitAnswer(answerIndex) {
    const accepted = this.engine.resolveAnswer(answerIndex, false);
    if (!accepted) {
      return false;
    }

    if (this.engine.feedback?.correct) {
      this.audio.playCorrect();
    } else {
      this.audio.playWrong();
    }

    this.sync();
    this.renderer.render(this.engine.snapshot(), performance.now() * 0.001);
    return true;
  }

  start({ introLine = "Match the term." } = {}) {
    this.audio.ensureContext();
    this.engine.start({ introLine });
    this.active = true;
    this.root.classList.remove("forecast-frenzy--hidden");
    this.root.setAttribute("aria-hidden", "false");
    this.startOverlay.hidden = true;
    this.startOverlay.style.display = "none";
    this.result.hidden = true;
    this.result.style.display = "none";
    this.introSoundPlayed = false;
    this.sync();
  }

  exit(reason = "exit") {
    if (!this.active) {
      return;
    }
    this.exitReason = reason;
    this.engine.requestExit();
  }

  handleKeyDown(event) {
    if (!this.active) {
      return false;
    }

    this.audio.ensureContext();

    switch (event.code) {
      case "Escape":
        event.preventDefault();
        this.exit("escape");
        return true;
      case "KeyE":
        if (!event.repeat && this.engine.continueNow()) {
          event.preventDefault();
          return true;
        }
        return false;
      case "Digit1":
      case "Digit2":
      case "Digit3":
      case "Digit4": {
        if (event.repeat) {
          return true;
        }
        event.preventDefault();
        const answerIndex = Number(event.code.slice(-1)) - 1;
        return this.submitAnswer(answerIndex);
      }
      default:
        return false;
    }
  }

  update(delta, elapsedTime) {
    if (!this.active) {
      return;
    }

    if (this.engine.shouldPlayWarning()) {
      this.engine.markWarningPlayed();
      this.audio.playWarning();
    }

    const previousPhase = this.engine.phase;
    const previousPhaseTime = this.engine.phaseTime - delta;
    this.engine.update(delta);

    if (previousPhase === "intro" && this.engine.phase === "intro") {
      const fadeInStart = INTRO_FADE_OUT + INTRO_HOLD;
      if (!this.introSoundPlayed && this.engine.phaseTime >= fadeInStart && previousPhaseTime < fadeInStart) {
        this.introSoundPlayed = true;
        this.audio.playStart();
      }
    }

    if (previousPhase !== "results" && this.engine.phase === "results") {
      this.audio.playEnd();
    }

    this.sync();
    this.renderer.render(this.engine.snapshot(), elapsedTime);

    if (this.engine.phase === "hidden") {
      this.active = false;
      this.root.classList.add("forecast-frenzy--hidden");
      this.root.setAttribute("aria-hidden", "true");
      this.root.dataset.visible = "false";
      if (typeof this.onExit === "function") {
        this.onExit({ reason: this.exitReason });
      }
    }
  }

  sync() {
    const snapshot = this.engine.snapshot();
    this.root.dataset.visible = snapshot.cabinetVisible ? "true" : "false";
    this.root.dataset.alarm = snapshot.alarmActive ? "true" : "false";
    this.root.dataset.shake = snapshot.shakeActive ? "true" : "false";
    this.root.style.setProperty("--forecast-fade", snapshot.fadeAlpha.toFixed(3));
    this.root.style.setProperty("--forecast-intro-overlay", String(snapshot.introOverlayAlpha ?? 0));
    this.root.style.setProperty("--forecast-flash-opacity", snapshot.flashOpacity.toFixed(3));
    this.root.style.setProperty("--forecast-flash-color", snapshot.flashColor);
    this.startOverlay.hidden = true;
    this.startOverlay.style.display = "none";

    if (this.banner) {
      this.banner.textContent = snapshot.bannerText;
    }
    if (this.introLine) {
      this.introLine.textContent = snapshot.introLine;
    }
    if (this.score) {
      this.score.textContent = snapshot.scoreText;
    }
    if (this.round) {
      this.round.textContent = `Question ${snapshot.roundNumber} / ${snapshot.totalRounds}`;
    }
    if (this.streak) {
      this.streak.textContent = snapshot.streakText;
    }
    if (this.timerLabel) {
      this.timerLabel.textContent = snapshot.timerText;
    }
    if (this.timerBar) {
      this.timerBar.style.transform = `scaleX(${snapshot.timeRatio.toFixed(3)})`;
    }
    this.alert.textContent = snapshot.currentRound?.scene?.alert ?? "RADAR LOCK";
    if (this.questionCount) {
      this.questionCount.textContent = `Question ${snapshot.roundNumber} / ${snapshot.totalRounds}`;
    }
    if (this.questionScore) {
      this.questionScore.textContent = `Score ${snapshot.scoreText}`;
    }
    this.questionPrompt.textContent = "MATCH TERM TO DEFINITION";
    this.question.textContent = snapshot.questionVisible
      ? `${snapshot.currentRound?.term ?? ""}`
      : "";
    if (this.footer) {
      this.footer.textContent = snapshot.footer;
    }

    this.syncLives(snapshot);
    this.syncAnswers(snapshot);
    this.syncFeedback(snapshot);
    this.syncResults(snapshot);
  }

  syncLives(snapshot) {
    if (!this.lives) {
      return;
    }
    this.lives.replaceChildren();
    const chip = document.createElement("div");
    chip.className = "forecast-frenzy__chip";
    chip.textContent = `${snapshot.misses} wrong`;
    this.lives.append(chip);
  }

  syncAnswers(snapshot) {
    if (snapshot.currentRound?.deckId !== this.lastRoundDeckId) {
      this.lastRoundDeckId = snapshot.currentRound?.deckId ?? "";
      this.answers.replaceChildren();
      this.answerButtons = [];

      (snapshot.currentRound?.choices ?? []).forEach((choice, index) => {
        const answer = document.createElement("div");
        answer.className = "forecast-frenzy__answer";
        answer.dataset.state = "idle";
        answer.tabIndex = 0;
        answer.setAttribute("role", "button");

        answer.addEventListener("click", () => {
          this.submitAnswer(index);
        });

        const key = document.createElement("div");
        key.className = "forecast-frenzy__answer-key";
        key.textContent = KEY_LABELS[index];

        const copy = document.createElement("div");
        copy.className = "forecast-frenzy__answer-copy";
        copy.textContent = choice;

        answer.append(key, copy);
        this.answers.append(answer);
        this.answerButtons.push(answer);
      });
    }

    this.answerButtons.forEach((answer, index) => {
      let state = "idle";
      if (snapshot.feedback) {
        if (index === snapshot.feedback.correctIndex) {
          state = "correct";
        } else if (!snapshot.feedback.correct && index === snapshot.feedback.selectedIndex) {
          state = "wrong";
        }
      } else if (snapshot.selectedIndex === index) {
        state = "selected";
      }

      answer.dataset.state = state;
      answer.style.opacity = snapshot.answersEnabled || snapshot.feedback ? "1" : "0.78";
    });
  }

  syncFeedback(snapshot) {
    if (!snapshot.feedback) {
      this.feedback.dataset.visible = "false";
      this.feedback.innerHTML = "";
      return;
    }

    this.feedback.dataset.visible = "true";
    this.feedback.innerHTML = `
      <strong>${snapshot.feedback.title}</strong>
      <span>${snapshot.feedback.subtitle}</span>
    `;
  }

  syncResults(snapshot) {
    if (!snapshot.result) {
      this.result.hidden = true;
      this.result.style.display = "none";
      return;
    }

    this.result.hidden = false;
    this.result.style.display = "grid";
    this.resultRank.textContent = snapshot.result.rank;
    this.resultScore.textContent = `Score ${formatScore(snapshot.result.score)}`;
    this.resultSummary.textContent = `Accuracy ${(snapshot.result.accuracy * 100).toFixed(0)}%`;
    this.resultStats.replaceChildren(
      createChipElement(`${snapshot.result.correctAnswers} correct calls`),
      createChipElement(`${snapshot.result.wrongAnswers} missed reads`),
      createChipElement(`Best streak x${snapshot.result.bestStreak}`),
      createChipElement(`${snapshot.result.questionsAnswered}/${snapshot.result.totalRounds} answered`),
    );
  }
}
