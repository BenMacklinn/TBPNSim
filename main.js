import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { ForecastFrenzyGame } from "./forecast-frenzy.js";

const FLOOR_THICKNESS = 0.08;
const WALL_HEIGHT = 6.2;
const OUTER_WALL_THICKNESS = 0.18;
const INNER_WALL_THICKNESS = 0.14;
const DOOR_COLOR = "#111111";
const DOOR_INSET_COLOR = "#050505";
const DOOR_FRAME_OPEN_ANGLE = Math.PI * 0.48;
const HANGAR_REAR_WALL_FORWARD_OFFSET = 0.002;
const HANGAR_REAR_WALL_NAME = "P3A";
const HANGAR_GREENSCREEN_COLOR = "#52cf69";
const HANGAR_INTERIOR_WALL_COLOR = "#5f645f";
const HANGAR_GREENSCREEN_OFFSET = 0.035;
const HANGAR_RIB_INTERVAL = 2.05;
const HANGAR_RIB_WIDTH = 0.135;
const HANGAR_RIB_DEPTH = 0.09;
const HANGAR_GREENSCREEN_RIB_CLEARANCE = HANGAR_RIB_WIDTH * 0.9;
const HANGAR_DUCT_RADIUS = 0.28;
const DEFAULT_LIGHTING_LAYER = 0;
const HANGAR_LIGHTING_LAYER = 1;
const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.24;
const POINTER_LOOK_SENSITIVITY = 0.0022;
const PLAYER_MAX_PITCH = Math.PI * 0.35;
const THIRD_PERSON_CAMERA_DISTANCE = 4.1;
const THIRD_PERSON_CAMERA_HEIGHT = 1.15;
const THIRD_PERSON_TARGET_DROP = 0.18;
const THIRD_PERSON_SEATED_AVATAR_DROP = 0.17;
const CAMERA_COLLISION_PADDING = 0.22;
const THIRD_PERSON_CAMERA_MIN_DISTANCE = 0;
const WALK_SPEED = 2.35;
const SPRINT_MULTIPLIER = 1.55;
const JUMP_VELOCITY = 5.2;
const GRAVITY = 18;
const SOUTH_PUSH = 0.7;
const PLAN_WIDTH = 11.87;
const PLAN_DEPTH = 10.68 + SOUTH_PUSH;
const FRONT_BAND_SHIFT = 2.5;
const FRONT_EDGE_Z = -FRONT_BAND_SHIFT;
const LEFT_EXTENSION_X = 4.12;
const LEFT_ROOM_DEPTH = 9.28; // P1 aligned with I6 (OTHER3_BOTTOM)
const RIGHT_STACK_X = 7.77;
const OTHER5_LEFT = LEFT_EXTENSION_X; // P9, west recess (adjacent to P2a), and P2a aligned with P8
const OTHER5_RIGHT = RIGHT_STACK_X; // P7 aligned with I2/I4
const OTHER5_DEPTH = FRONT_EDGE_Z + 0.5;
const I1_Z = 1.0;
const OTHER2_PARTITION_X = 13.5;
const OTHER2_BOTTOM = 3.1;
const OTHER3_BOTTOM = 9.28;
const WASHROOM_DIVIDER_Z = (I1_Z + OTHER3_BOTTOM) / 2;
const OTHER4_BOTTOM = WASHROOM_DIVIDER_Z;
const OTHER3_TOP = WASHROOM_DIVIDER_Z; // Shared divider I3 centered between I1 and I6.
const OTHER4_DOOR_TOP = OTHER4_BOTTOM - 0.75;
const DOOR_HEIGHT = 2.25;
const INTERIOR_DOOR_OPENING = 0.9;
const INTERIOR_DOOR_EDGE_OFFSET = 0.55;
const I2_DOOR_Z = I1_Z + INTERIOR_DOOR_EDGE_OFFSET + INTERIOR_DOOR_OPENING / 2;
const I4_DOOR_Z = OTHER3_BOTTOM - INTERIOR_DOOR_EDGE_OFFSET - INTERIOR_DOOR_OPENING / 2;
const OTHER34_ROOF_BASE_HEIGHT = 3.0;
const NEW_ROOM_ROOF_BASE_HEIGHT = 3.0;
const HANGAR_FRONT_OVERHANG = 0.5;
const HANGAR_NORTH_SHIFT = 0.5;
const HANGAR_SHELL_THICKNESS = 0.12;
const HANGAR_GROUND = (PLAN_WIDTH / 2) * 1.7;
const HANGAR_INNER_SCALE = 1 - HANGAR_SHELL_THICKNESS / HANGAR_GROUND;
const HANGAR_INNER_GROUND = HANGAR_GROUND * HANGAR_INNER_SCALE;
const HANGAR_BUILDING_EDGE_X = PLAN_WIDTH / 2;
const HANGAR_ARCH_HEIGHT =
  (WALL_HEIGHT + 0.05) /
  (HANGAR_INNER_SCALE * (1 - Math.pow(HANGAR_BUILDING_EDGE_X / HANGAR_INNER_GROUND, 2)));
const HANGAR_INNER_APEX_HEIGHT = HANGAR_ARCH_HEIGHT * HANGAR_INNER_SCALE;
const HANGAR_INNER_EAST_X = PLAN_WIDTH / 2 + HANGAR_INNER_GROUND;
const HANGAR_INTERIOR_WALL_X = HANGAR_INNER_EAST_X - INNER_WALL_THICKNESS / 2;
const OTHER2_AREA = `${((HANGAR_INNER_EAST_X - RIGHT_STACK_X) * (I1_Z - FRONT_EDGE_Z)).toFixed(1)} m²`;
const OTHER4_AREA = `${((HANGAR_INNER_EAST_X - RIGHT_STACK_X) * (OTHER4_BOTTOM - I1_Z)).toFixed(1)} m²`;
const OTHER3_AREA = `${((HANGAR_INNER_EAST_X - RIGHT_STACK_X) * (OTHER3_BOTTOM - OTHER3_TOP)).toFixed(1)} m²`;
const SITTING_POSE = {
  verticalOffset: 0.08,
  headRotationY: -0.08,
  headRotationX: 0.04,
  leftArmRotationX: 1.02,
  leftArmRotationZ: -0.06,
  rightArmRotationX: 0.98,
  rightArmRotationZ: 0.08,
  legRotationX: 1.25,
  kneeRotationX: -1.15,
  torsoRotationX: 0.06,
  shadowOpacity: 0.1,
};
const HANGAR_REAR_PLAN_Z = PLAN_DEPTH + HANGAR_NORTH_SHIFT;
const HANGAR_STRUCTURE_BACK_Z = 39;
const HANGAR_EXTRA_DEPTH =
  HANGAR_STRUCTURE_BACK_Z - (HANGAR_REAR_PLAN_Z + HANGAR_FRONT_OVERHANG - OUTER_WALL_THICKNESS / 2);
const HANGAR_GREENSCREEN_PLAN_Z = PLAN_DEPTH + OUTER_WALL_THICKNESS / 2 + HANGAR_REAR_WALL_FORWARD_OFFSET;
const HANGAR_GREENSCREEN_PROP_BASE_Z = PLAN_DEPTH;
const HANGAR_FRONT_APRON_START_Z = HANGAR_REAR_PLAN_Z - HANGAR_FRONT_OVERHANG;
const HANGAR_BAY_BACK_Z =
  HANGAR_REAR_PLAN_Z + HANGAR_FRONT_OVERHANG + HANGAR_EXTRA_DEPTH - OUTER_WALL_THICKNESS / 2;
const HANGAR_FRONT_APRON_DEPTH = 8;
const HANGAR_REAR_SHELF_WIDTH = 4.84;
const HANGAR_REAR_SHELF_CENTER = [6.55, 35.75];
const HANGAR_REAR_GARAGE_DOOR_HEIGHT = 4;
const LOW_ROOM_ROOF_SETBACK = INNER_WALL_THICKNESS / 2 + 0.02;
const NEW_ROOM_ROOF_SOUTH_SETBACK = OUTER_WALL_THICKNESS / 2 + 0.02;
const NEW_ROOM_ROOF_NORTH_SETBACK = INNER_WALL_THICKNESS / 2 + 0.02;
const NEW_ROOM_AREA = `${((HANGAR_INNER_EAST_X - RIGHT_STACK_X) * (PLAN_DEPTH - OTHER3_BOTTOM)).toFixed(1)} m²`;
const HORSE_STATUE_MODEL_URL = new URL("./scene.gltf", import.meta.url).href;
const HORSE_STATUE_GROUND_OFFSET = 0.12;

const gltfLoader = new GLTFLoader();
const horseStatueMaterial = new THREE.MeshStandardMaterial({
  color: "#7a796f",
  roughness: 0.95,
  metalness: 0.02,
});

// Exterior dimensions are taken from the floorplan. Interior offsets that are not
// explicitly dimensioned are inferred from the visible drawing and room-area labels.
const shellPlan = [
  [0.0, FRONT_EDGE_Z],
  [OTHER5_LEFT, FRONT_EDGE_Z],
  [OTHER5_LEFT, OTHER5_DEPTH],
  [OTHER5_RIGHT, OTHER5_DEPTH],
  [OTHER5_RIGHT, FRONT_EDGE_Z],
  [PLAN_WIDTH, FRONT_EDGE_Z],
  [PLAN_WIDTH, PLAN_DEPTH],
  [LEFT_EXTENSION_X, PLAN_DEPTH],
  [LEFT_EXTENSION_X, LEFT_ROOM_DEPTH],
  [0.0, LEFT_ROOM_DEPTH],
];

const roomDefinitions = [
  {
    id: "other1",
    name: "Other 1",
    area: "68.5 m²",
    floorColor: "#54504b",
    points: [
      [0.0, FRONT_EDGE_Z],
      [OTHER5_LEFT, FRONT_EDGE_Z],
      [OTHER5_LEFT, OTHER5_DEPTH],
      [RIGHT_STACK_X, OTHER5_DEPTH],
      [RIGHT_STACK_X, LEFT_ROOM_DEPTH],
      [LEFT_EXTENSION_X, LEFT_ROOM_DEPTH],
      [0.0, LEFT_ROOM_DEPTH],
    ],
    label: [3.55, 4.7],
  },
  {
    id: "other5",
    name: "Other 5",
    area: "1.7 m²",
    floorColor: "#d8d1c8",
    points: [
      [OTHER5_LEFT, FRONT_EDGE_Z],
      [OTHER5_RIGHT, FRONT_EDGE_Z],
      [OTHER5_RIGHT, OTHER5_DEPTH],
      [OTHER5_LEFT, OTHER5_DEPTH],
    ],
    label: [(OTHER5_LEFT + OTHER5_RIGHT) / 2, FRONT_EDGE_Z + (OTHER5_DEPTH - FRONT_EDGE_Z) / 2],
  },
  {
    id: "other2",
    name: "Other 2",
    area: OTHER2_AREA,
    floorColor: "#2a2728",
    points: [
      [OTHER5_RIGHT, FRONT_EDGE_Z],
      [HANGAR_INNER_EAST_X, FRONT_EDGE_Z],
      [HANGAR_INNER_EAST_X, I1_Z],
      [RIGHT_STACK_X, I1_Z],
      [RIGHT_STACK_X, OTHER5_DEPTH],
      [OTHER5_RIGHT, OTHER5_DEPTH],
    ],
    label: [(RIGHT_STACK_X + HANGAR_INNER_EAST_X) / 2, (FRONT_EDGE_Z + I1_Z) / 2],
  },
  {
    id: "other4",
    name: "Other 4",
    area: OTHER4_AREA,
    floorColor: "#b7c0b2",
    points: [
      [RIGHT_STACK_X, I1_Z],
      [HANGAR_INNER_EAST_X, I1_Z],
      [HANGAR_INNER_EAST_X, OTHER4_BOTTOM],
      [RIGHT_STACK_X, OTHER4_BOTTOM],
    ],
    label: [(RIGHT_STACK_X + HANGAR_INNER_EAST_X) / 2, (I1_Z + OTHER4_BOTTOM) / 2],
  },
  {
    id: "other3",
    name: "Other 3",
    area: OTHER3_AREA,
    floorColor: "#d1cdc6",
    points: [
      [RIGHT_STACK_X, OTHER3_TOP],
      [HANGAR_INNER_EAST_X, OTHER3_TOP],
      [HANGAR_INNER_EAST_X, OTHER3_BOTTOM],
      [RIGHT_STACK_X, OTHER3_BOTTOM],
    ],
    label: [(RIGHT_STACK_X + HANGAR_INNER_EAST_X) / 2, (OTHER3_TOP + OTHER3_BOTTOM) / 2],
  },
  {
    id: "newRoom",
    name: "New room (1)",
    area: NEW_ROOM_AREA,
    floorColor: "#a3afc4",
    points: [
      [RIGHT_STACK_X, OTHER3_BOTTOM],
      [HANGAR_INNER_EAST_X, OTHER3_BOTTOM],
      [HANGAR_INNER_EAST_X, PLAN_DEPTH],
      [RIGHT_STACK_X, PLAN_DEPTH],
    ],
    label: [(RIGHT_STACK_X + HANGAR_INNER_EAST_X) / 2, (OTHER3_BOTTOM + PLAN_DEPTH) / 2],
  },
  {
    id: "hangarBay",
    name: "Hangar Bay",
    area: "",
    floorColor: "#b8c4cf",
    points: [
      [PLAN_WIDTH / 2 - HANGAR_INNER_GROUND, HANGAR_FRONT_APRON_START_Z],
      [PLAN_WIDTH / 2 + HANGAR_INNER_GROUND, HANGAR_FRONT_APRON_START_Z],
      [PLAN_WIDTH / 2 + HANGAR_INNER_GROUND, HANGAR_BAY_BACK_Z],
      [PLAN_WIDTH / 2 - HANGAR_INNER_GROUND, HANGAR_BAY_BACK_Z],
    ],
    label: [PLAN_WIDTH / 2, HANGAR_FRONT_APRON_START_Z + (HANGAR_BAY_BACK_Z - HANGAR_FRONT_APRON_START_Z) * 0.48],
  },
  {
    id: "hangarFrontApron",
    name: "Front Apron",
    area: "",
    floorColor: "#b8c4cf",
    points: [
      [PLAN_WIDTH / 2 - HANGAR_INNER_GROUND, HANGAR_FRONT_APRON_START_Z - HANGAR_FRONT_APRON_DEPTH],
      [PLAN_WIDTH / 2 + HANGAR_INNER_GROUND, HANGAR_FRONT_APRON_START_Z - HANGAR_FRONT_APRON_DEPTH],
      [PLAN_WIDTH / 2 + HANGAR_INNER_GROUND, HANGAR_FRONT_APRON_START_Z],
      [PLAN_WIDTH / 2 - HANGAR_INNER_GROUND, HANGAR_FRONT_APRON_START_Z],
    ],
    label: [PLAN_WIDTH / 2, HANGAR_FRONT_APRON_START_Z - HANGAR_FRONT_APRON_DEPTH * 0.45],
  },
  {
    id: "hangarApron",
    name: "Hangar Apron",
    area: "",
    floorColor: "#b8c4cf",
    points: [
      [PLAN_WIDTH / 2 - HANGAR_INNER_GROUND, HANGAR_BAY_BACK_Z],
      [PLAN_WIDTH / 2 + HANGAR_INNER_GROUND, HANGAR_BAY_BACK_Z],
      [PLAN_WIDTH / 2 + HANGAR_INNER_GROUND, HANGAR_BAY_BACK_Z + HANGAR_FRONT_APRON_DEPTH],
      [PLAN_WIDTH / 2 - HANGAR_INNER_GROUND, HANGAR_BAY_BACK_Z + HANGAR_FRONT_APRON_DEPTH],
    ],
    label: [PLAN_WIDTH / 2, HANGAR_BAY_BACK_Z + HANGAR_FRONT_APRON_DEPTH * 0.45],
  },
  {
    id: "upperCorridor",
    name: "Upper corridor",
    area: "",
    floorColor: "#b7b6b2",
    points: [
      [LEFT_EXTENSION_X, OTHER3_BOTTOM],
      [RIGHT_STACK_X, OTHER3_BOTTOM],
      [RIGHT_STACK_X, PLAN_DEPTH],
      [LEFT_EXTENSION_X, PLAN_DEPTH],
    ],
    label: [5.95, (OTHER3_BOTTOM + PLAN_DEPTH) / 2],
  },
  {
    id: "hall",
    name: "Hall",
    area: "",
    floorColor: "#b7b6b2",
    points: [
      [LEFT_EXTENSION_X, LEFT_ROOM_DEPTH],
      [RIGHT_STACK_X, LEFT_ROOM_DEPTH],
      [RIGHT_STACK_X, PLAN_DEPTH],
      [LEFT_EXTENSION_X, PLAN_DEPTH],
    ],
    label: [5.95, (LEFT_ROOM_DEPTH + PLAN_DEPTH) / 2],
  },
];

const innerWallDefinitions = [
  { name: "I1", start: [RIGHT_STACK_X, I1_Z], end: [HANGAR_INTERIOR_WALL_X, I1_Z] },
  {
    name: "I5",
    start: [OTHER2_PARTITION_X, FRONT_EDGE_Z],
    end: [OTHER2_PARTITION_X, I1_Z],
    clippedToHangar: true,
  },
  {
    name: "I2",
    start: [RIGHT_STACK_X, I1_Z],
    end: [RIGHT_STACK_X, OTHER3_TOP],
    doorway: { center: [RIGHT_STACK_X, I2_DOOR_Z], openingWidth: INTERIOR_DOOR_OPENING, orientation: "vertical" },
  },
  { name: "I3", start: [RIGHT_STACK_X, OTHER3_TOP], end: [HANGAR_INTERIOR_WALL_X, OTHER3_TOP] },
  {
    name: "I4",
    start: [RIGHT_STACK_X, OTHER3_TOP],
    end: [RIGHT_STACK_X, OTHER3_BOTTOM],
    doorway: { center: [RIGHT_STACK_X, I4_DOOR_Z], openingWidth: INTERIOR_DOOR_OPENING, orientation: "vertical" },
  },
  {
    name: "I8",
    start: [12, I1_Z],
    end: [12, OTHER3_TOP],
    doorway: { center: [12, I2_DOOR_Z], openingWidth: INTERIOR_DOOR_OPENING, orientation: "vertical" },
  },
  { name: "I7", start: [10.5, OTHER3_TOP], end: [10.5, 3.5] },
  { name: "I6", start: [RIGHT_STACK_X, OTHER3_BOTTOM], end: [HANGAR_INTERIOR_WALL_X, OTHER3_BOTTOM] },
  { name: "I9", start: [10.5, OTHER3_TOP], end: [10.5, 6.78] },
  {
    name: "I10",
    start: [12, OTHER3_TOP],
    end: [12, OTHER3_BOTTOM],
    doorway: { center: [12, I4_DOOR_Z], openingWidth: INTERIOR_DOOR_OPENING, orientation: "vertical" },
  },
];

const shellBounds = getBounds(shellPlan);
const planCenter = {
  x: (shellBounds.minX + shellBounds.maxX) / 2,
  z: (shellBounds.minZ + shellBounds.maxZ) / 2,
};

const other5Doorway = {
  centerX: (LEFT_EXTENSION_X + RIGHT_STACK_X) / 2,
  wallZ: OTHER5_DEPTH,
  openingWidth: 1.72,
  doorHeight: 2.25,
};
other5Doorway.start = [other5Doorway.centerX - other5Doorway.openingWidth / 2, other5Doorway.wallZ];
other5Doorway.end = [other5Doorway.centerX + other5Doorway.openingWidth / 2, other5Doorway.wallZ];
other5Doorway.fullSpanStart = [OTHER5_LEFT, OTHER5_DEPTH];
other5Doorway.fullSpanEnd = [OTHER5_RIGHT, OTHER5_DEPTH];

const hallwaySouthDoorway = {
  name: "Hangar Door",
  centerX:
    planCenter.x +
    Math.min(
      hangarInnerXForHeight(DOOR_HEIGHT + 0.3) - 0.12 - 0.9 / 2,
      HANGAR_INNER_EAST_X - planCenter.x - 1.05,
    ),
  wallZ: PLAN_DEPTH,
  openingWidth: 0.9,
  doorHeight: 2.25,
};
hallwaySouthDoorway.start = [hallwaySouthDoorway.centerX - hallwaySouthDoorway.openingWidth / 2, hallwaySouthDoorway.wallZ];
hallwaySouthDoorway.end = [hallwaySouthDoorway.centerX + hallwaySouthDoorway.openingWidth / 2, hallwaySouthDoorway.wallZ];

const worldShell = shellPlan.map(toWorldPoint);
const worldRooms = roomDefinitions.map((room) => ({
  ...room,
  worldPoints: room.points.map(toWorldPoint),
  worldLabel: toWorldPoint(room.label),
}));
const worldWalkablePoints = worldRooms.flatMap((room) => room.worldPoints);
const outerWallSegmentNames = [
  "P9a", "P9b", null, "P7a", "P7b", null, "P3", "P8", "P1", "P10",
];
let outerWallSegments = segmentsFromPolygon(shellPlan)
  .map((segment, i) => ({ segment, name: outerWallSegmentNames[i] }))
  .filter(
    ({ segment }) =>
      !matchesSegment(segment[0], segment[1], other5Doorway.fullSpanStart, other5Doorway.fullSpanEnd),
  );
outerWallSegments = outerWallSegments.flatMap(({ segment, name }) => {
  if (
    name === "P7b" &&
    Math.abs(segment[0][1] - FRONT_EDGE_Z) < 0.001 &&
    Math.abs(segment[1][1] - FRONT_EDGE_Z) < 0.001
  ) {
    return [{
      segment: [
        [OTHER5_RIGHT, FRONT_EDGE_Z],
        [HANGAR_INNER_EAST_X, FRONT_EDGE_Z],
      ],
      name,
    }];
  }
  return [{ segment, name }];
});
const outerWallDefinitions = outerWallSegments
  .filter(({ name }) => name != null)
  .map(({ segment, name }) => ({
    name,
    start: segment[0],
    end: segment[1],
    outer: true,
  }))
  .concat([
    { name: "P2a", start: other5Doorway.fullSpanStart, end: other5Doorway.start, outer: true },
    { name: "P2b", start: other5Doorway.end, end: other5Doorway.fullSpanEnd, outer: true },
  ]);

const hallwayExtensionWallDefinitions = [
  {
    name: "P3a",
    start: [PLAN_WIDTH, PLAN_DEPTH],
    end: hallwaySouthDoorway.start,
    outer: true,
    clipped: true,
  },
  {
    name: "P3b",
    start: hallwaySouthDoorway.end,
    end: [HANGAR_INNER_EAST_X, PLAN_DEPTH],
    outer: true,
    clipped: true,
  },
];

const worldWalls = [...outerWallDefinitions, ...innerWallDefinitions].map((wall) => ({
  ...wall,
  thickness: wall.outer ? OUTER_WALL_THICKNESS : INNER_WALL_THICKNESS,
  worldStart: toWorldPoint(wall.start),
  worldEnd: toWorldPoint(wall.end),
}));
const worldHallwayExtensionWalls = hallwayExtensionWallDefinitions.map((wall) => ({
  ...wall,
  thickness: wall.outer ? OUTER_WALL_THICKNESS : INNER_WALL_THICKNESS,
  worldStart: toWorldPoint(wall.start),
  worldEnd: toWorldPoint(wall.end),
}));
const clippedHangarWallNames = new Set(["I1", "I3", "I6", "P7b"]);

const canvas = document.querySelector("#scene");
const interactionPrompt = document.querySelector("#interactionPrompt");
const interactionPromptEyebrow = document.querySelector("#interactionPromptEyebrow");
const interactionPromptTitle = document.querySelector("#interactionPromptTitle");
const interactionPromptLine = document.querySelector("#interactionPromptLine");
const forecastFrenzyRoot = document.querySelector("#forecastFrenzy");
const coordX = document.querySelector("#coordX");
const coordY = document.querySelector("#coordY");
const coordZ = document.querySelector("#coordZ");

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#959a94");
scene.fog = null;

const camera = new THREE.PerspectiveCamera(
  68,
  window.innerWidth / window.innerHeight,
  0.1,
  120,
);
camera.rotation.order = "YXZ";
scene.add(camera);

const overviewCameraPosition = new THREE.Vector3(9.5, 12.4, 12.8);
const overviewTarget = new THREE.Vector3(0, 1.2, 0);
const walkStartPlan = [12.45, HANGAR_REAR_PLAN_Z + 3.3];
const walkLookTargetPlan = [12.24, HANGAR_REAR_PLAN_Z + 0.7];
const walkStart = new THREE.Vector3(
  walkStartPlan[0] - planCenter.x,
  PLAYER_HEIGHT,
  walkStartPlan[1] - planCenter.z,
);
const walkLookTarget = new THREE.Vector3(
  walkLookTargetPlan[0] - planCenter.x,
  1.45,
  walkLookTargetPlan[1] - planCenter.z,
);
const cameraCollisionRaycaster = new THREE.Raycaster();
cameraCollisionRaycaster.layers.enable(HANGAR_LIGHTING_LAYER);
const cameraLookTarget = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();
const cameraOffsetVector = new THREE.Vector3();
const cameraForwardVector = new THREE.Vector3();
const cameraDirectionVector = new THREE.Vector3();
const lookEuler = new THREE.Euler(0, 0, 0, "YXZ");
let isPointerLocked = false;

const playerState = {
  position: walkStart.clone(),
  yaw: 0,
  pitch: 0,
  facingYaw: 0,
  motion: 0,
};
setLookAnglesFromTarget(playerState, walkStart, walkLookTarget);
playerState.facingYaw = playerState.yaw;

camera.layers.enable(HANGAR_LIGHTING_LAYER);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.target.copy(overviewTarget);
orbitControls.maxPolarAngle = Math.PI * 0.49;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 28;
orbitControls.enabled = false;

const state = {
  mode: "walk",
  walkView: "firstPerson",
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  sprint: false,
  velocityY: 0,
  seatedSeat: null,
};

const clock = new THREE.Clock();
const collisionRects = [];
const furnitureRects = [];
const interactiveDoors = [];
const interactiveSeats = [];
const interactiveNpcs = [];
const mirrorDistanceLods = [];
const slidingShelfCameras = [];
const npcPromptWorldPosition = new THREE.Vector3();
const forecastFrenzy = new ForecastFrenzyGame({
  root: forecastFrenzyRoot,
  onExit: handleForecastFrenzyExit,
});

const architectureGroup = new THREE.Group();
const labelGroup = new THREE.Group();
const furnishingGroup = new THREE.Group();
const playerAvatar = createPlayerAvatar();

scene.add(architectureGroup);
scene.add(furnishingGroup);
scene.add(labelGroup);
scene.add(playerAvatar.group);

buildEnvironment();
buildArchitecture();
buildFurnishings();
removeFrontRoomCeilingIntrusions();
buildLighting();
syncPlayerPresentation(0, 0);

canvas.addEventListener("click", maybeLockWalkthrough);
document.addEventListener("pointerlockchange", onPointerLockChange);
document.addEventListener("mousemove", onPointerMove);
window.addEventListener("resize", onResize);
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.addEventListener("blur", clearMovementState);

syncUi();
renderer.setAnimationLoop(animate);

function buildEnvironment() {
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(60, 40, 24),
    new THREE.MeshBasicMaterial({
      color: "#d2d7d3",
      side: THREE.BackSide,
    }),
  );
  scene.add(sky);

  const plaza = new THREE.Mesh(
    new THREE.CircleGeometry(34, 100),
    new THREE.MeshStandardMaterial({
      color: "#adb6b3",
      roughness: 0.98,
      metalness: 0.01,
    }),
  );
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.y = -FLOOR_THICKNESS - 0.03;
  plaza.receiveShadow = true;
  scene.add(plaza);

  const grid = new THREE.GridHelper(34, 34, "#6f7e7b", "#97a29e");
  grid.position.y = -FLOOR_THICKNESS - 0.02;
  grid.material.opacity = 0.18;
  grid.material.transparent = true;
  scene.add(grid);
}

function removeFrontRoomCeilingIntrusions() {
  const frontOther1 = worldRooms.find((room) => room.id === "other1");
  if (!frontOther1) {
    return;
  }

  const removals = [];
  const worldPosition = new THREE.Vector3();

  architectureGroup.traverse((child) => {
    if (!child.isMesh || child.geometry?.type !== "CylinderGeometry") {
      return;
    }

    const { height = 0 } = child.geometry.parameters ?? {};
    if (height < 2) {
      return;
    }

    child.getWorldPosition(worldPosition);
    const planZ = worldPosition.z + planCenter.z;
    if (
      worldPosition.y > 4.2 &&
      planZ < 4.5 &&
      pointInPolygon({ x: worldPosition.x, z: worldPosition.z }, frontOther1.worldPoints)
    ) {
      removals.push(child);
    }
  });

  removals.forEach((mesh) => {
    mesh.parent?.remove(mesh);
  });
}

function buildArchitecture() {
  const shellFloor = createExtrudedPolygon(worldShell, {
    color: "#494540",
    y: 0,
    depth: FLOOR_THICKNESS,
  });
  architectureGroup.add(shellFloor);

  worldRooms.forEach((room) => {
    const roomFloor = createExtrudedPolygon(room.worldPoints, {
      color: room.floorColor,
      y: 0.012,
      depth: FLOOR_THICKNESS * 0.82,
    });
    if (
      room.id === "hangarBay" ||
      room.id === "hangarFrontApron" ||
      room.id === "hangarApron"
    ) {
      setLayerRecursive(roomFloor, HANGAR_LIGHTING_LAYER);
    }
    architectureGroup.add(roomFloor);

    if (room.name !== "Hall") {
      const label = createLabel(room.name, room.area);
      label.position.set(room.worldLabel.x, 0.05, room.worldLabel.z);
      labelGroup.add(label);
    }
  });

  const hallwayDoorLabel = createLabel(hallwaySouthDoorway.name, "P3");
  const hallwayDoorLabelPoint = toWorldPoint([hallwaySouthDoorway.centerX, HANGAR_GREENSCREEN_PROP_BASE_Z + 1.05]);
  hallwayDoorLabel.position.set(hallwayDoorLabelPoint.x, 0.05, hallwayDoorLabelPoint.z);
  labelGroup.add(hallwayDoorLabel);

  const rearWallLabel = createLabel(HANGAR_REAR_WALL_NAME, "Inset wall");
  const rearWallLabelPoint = toWorldPoint([hallwaySouthDoorway.centerX, HANGAR_GREENSCREEN_PROP_BASE_Z + 0.42]);
  rearWallLabel.position.set(rearWallLabelPoint.x, 0.05, rearWallLabelPoint.z);
  labelGroup.add(rearWallLabel);

  worldWalls.forEach((wall) => {
    if (
      wall.name === "P9a" &&
      Math.abs(wall.worldStart.z - wall.worldEnd.z) < 0.001
    ) {
      const mesh = createHorizontalWallWithOpening(wall.worldStart, wall.worldEnd, {
        color: "#f7f7f3",
        thickness: wall.thickness,
        height: WALL_HEIGHT,
        opening: {
          centerX: toWorldPoint([OTHER5_LEFT / 2, FRONT_EDGE_Z]).x,
          width: 2.0,
          bottomY: 1.9,
          height: 3.0,
        },
      });
      architectureGroup.add(mesh);
      collisionRects.push(
        rectFromSegment(wall.worldStart, wall.worldEnd, wall.thickness, PLAYER_RADIUS * 0.9),
      );
      return;
    }

    if (
      wall.name === "P7b" &&
      Math.abs(wall.worldStart.z - wall.worldEnd.z) < 0.001
    ) {
      const other2WindowCenterX = (OTHER5_RIGHT + HANGAR_INNER_EAST_X) / 2 - 1.9;
      const mesh = createHorizontalWallWithOpening(wall.worldStart, wall.worldEnd, {
        color: "#f7f7f3",
        thickness: wall.thickness,
        height: WALL_HEIGHT,
        opening: {
          centerX: toWorldPoint([other2WindowCenterX, FRONT_EDGE_Z]).x,
          width: 2.0,
          bottomY: 1.9,
          height: 3.0,
        },
      });
      architectureGroup.add(mesh);
      collisionRects.push(
        rectFromSegment(wall.worldStart, wall.worldEnd, wall.thickness, PLAYER_RADIUS * 0.9),
      );
      return;
    }

    expandWallForDoorway(wall).forEach((segment) => {
      const shouldClipToHangar =
        clippedHangarWallNames.has(segment.name) &&
        Math.abs(segment.worldStart.z - segment.worldEnd.z) < 0.001;
      const segmentHeight = segment.clippedToHangar
        ? Math.min(WALL_HEIGHT, hangarInnerHeightAtWorldX(segment.worldStart.x))
        : WALL_HEIGHT;
      const mesh = shouldClipToHangar
        ? createClippedHorizontalWall(segment.worldStart, segment.worldEnd, {
            color: "#f7f7f3",
            thickness: segment.thickness,
            capY: segmentHeight,
          })
        : createWall(segment.worldStart, segment.worldEnd, {
            color: "#f7f7f3",
            height: segmentHeight,
            thickness: segment.thickness,
          });
      architectureGroup.add(mesh);
      collisionRects.push(
        rectFromSegment(segment.worldStart, segment.worldEnd, segment.thickness, PLAYER_RADIUS * 0.9),
      );
    });

    if (wall.doorway) {
      addTransomAt(
        wall.doorway.center[0],
        wall.doorway.center[1],
        wall.doorway.openingWidth,
        wall.doorway.orientation,
      );
    }
  });

  worldHallwayExtensionWalls.forEach((wall) => {
    collisionRects.push(rectFromSegment(wall.worldStart, wall.worldEnd, wall.thickness, PLAYER_RADIUS * 0.9));
    if (wall.name?.startsWith("P3")) {
      return;
    }
    const mesh = createClippedHorizontalWall(wall.worldStart, wall.worldEnd, {
      color: "#f7f7f3",
      thickness: wall.thickness,
      capY: WALL_HEIGHT,
    });
    if (mesh) {
      architectureGroup.add(mesh);
    }
  });

  const hallwaySouthWall = createSouthWallWithDoor({
    start: toWorldPoint([PLAN_WIDTH, PLAN_DEPTH]),
    end: toWorldPoint([HANGAR_INNER_EAST_X, PLAN_DEPTH]),
    doorway: hallwaySouthDoorway,
    color: "#f7f7f3",
    thickness: OUTER_WALL_THICKNESS,
    capY: WALL_HEIGHT,
  });
  if (hallwaySouthWall) {
    architectureGroup.add(hallwaySouthWall);
  }

  const roof = createExtrudedPolygon(worldShell, {
    color: "#f7f7f3",
    y: WALL_HEIGHT,
    depth: 0.2,
  });
  roof.castShadow = true;
  architectureGroup.add(roof);

  const other4Roof = createOther4RoofVolume();
  if (other4Roof) {
    architectureGroup.add(other4Roof);
  }

  const other3Roof = createOther3RoofVolume();
  if (other3Roof) {
    architectureGroup.add(other3Roof);
  }

  const newRoomRoof = createNewRoomRoofVolume();
  if (newRoomRoof) {
    architectureGroup.add(newRoomRoof);
  }

  addTransomAt(9.82, OTHER3_BOTTOM, 0.9, "horizontal");
  addDoorTransom(other5Doorway);
  addOther5DoubleDoorFrame();
  addOther3Other4Doors();
  addNewRoomDoor();
  addP9aGrilledWindows();
  addP7bGrilledWindows();

  const hangarArchitectureStartIndex = architectureGroup.children.length;
  addHangarStructure();
  promoteNewChildrenToLayer(architectureGroup, hangarArchitectureStartIndex, HANGAR_LIGHTING_LAYER);
}

function addP9aGrilledWindows() {
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: "#4f5458",
    roughness: 0.78,
    metalness: 0.22,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: "#bdd4e7",
    emissive: "#7da4c3",
    emissiveIntensity: 0.12,
    roughness: 0.2,
    metalness: 0.04,
    transparent: true,
    opacity: 0.34,
  });
  const slatMaterial = new THREE.MeshStandardMaterial({
    color: "#2f3438",
    roughness: 0.82,
    metalness: 0.16,
  });

  const windowGroup = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.94, 3.02, 0.08),
    frameMaterial,
  );
  frame.position.y = 3.4;
  windowGroup.add(frame);

  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 2.74, 0.03),
    glassMaterial,
  );
  glass.position.set(0, 3.4, 0.03);
  windowGroup.add(glass);

  for (let i = 0; i < 8; i += 1) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(1.74, 0.05, 0.04),
      slatMaterial,
    );
    slat.position.set(0, 2.2 + i * 0.33, 0.06);
    windowGroup.add(slat);
  }

  enableShadows(windowGroup);
  placePlanObject(windowGroup, [OTHER5_LEFT / 2, FRONT_EDGE_Z + 0.05], 0, 0, architectureGroup);
}

function addP7bGrilledWindows() {
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: "#4f5458",
    roughness: 0.78,
    metalness: 0.22,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: "#bdd4e7",
    emissive: "#7da4c3",
    emissiveIntensity: 0.12,
    roughness: 0.2,
    metalness: 0.04,
    transparent: true,
    opacity: 0.34,
  });
  const slatMaterial = new THREE.MeshStandardMaterial({
    color: "#2f3438",
    roughness: 0.82,
    metalness: 0.16,
  });

  const windowGroup = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(1.94, 3.02, 0.08),
    frameMaterial,
  );
  frame.position.y = 3.4;
  windowGroup.add(frame);

  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 2.74, 0.03),
    glassMaterial,
  );
  glass.position.set(0, 3.4, -0.03);
  windowGroup.add(glass);

  for (let i = 0; i < 8; i += 1) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(1.74, 0.05, 0.04),
      slatMaterial,
    );
    slat.position.set(0, 2.2 + i * 0.33, -0.06);
    windowGroup.add(slat);
  }

  enableShadows(windowGroup);
  placePlanObject(windowGroup, [(OTHER5_RIGHT + HANGAR_INNER_EAST_X) / 2 - 1.9, FRONT_EDGE_Z + 0.05], 0, Math.PI, architectureGroup);
}

function addHangarStructure() {
  const mapBounds = getBounds(worldShell);
  const buildingWidth = mapBounds.width;
  const depth = mapBounds.depth + HANGAR_FRONT_OVERHANG + HANGAR_EXTRA_DEPTH;
  const centerX = (mapBounds.minX + mapBounds.maxX) / 2;
  const frontZ = mapBounds.minZ - OUTER_WALL_THICKNESS / 2 + HANGAR_NORTH_SHIFT - 0.4;

  const ground = HANGAR_GROUND;
  const innerScale = HANGAR_INNER_SCALE;
  const archHeight = HANGAR_ARCH_HEIGHT;

  const outerShape = new THREE.Shape();
  outerShape.moveTo(-ground, 0);
  outerShape.lineTo(ground, 0);
  outerShape.quadraticCurveTo(ground * 0.5, archHeight, 0, archHeight);
  outerShape.quadraticCurveTo(-ground * 0.5, archHeight, -ground, 0);

  const innerShape = new THREE.Path();
  innerShape.moveTo(-ground * innerScale, 0);
  innerShape.quadraticCurveTo(-ground * 0.5 * innerScale, archHeight * innerScale, 0, archHeight * innerScale);
  innerShape.quadraticCurveTo(ground * 0.5 * innerScale, archHeight * innerScale, ground * innerScale, 0);
  innerShape.lineTo(-ground * innerScale, 0);
  outerShape.holes.push(innerShape);

  const geometry = new THREE.ExtrudeGeometry(outerShape, {
    depth,
    bevelEnabled: false,
  });
  // Keep the hangar front flush with the front wall axis instead of
  // extending past the plan equally in both directions.
  geometry.translate(centerX, 0, frontZ);

  const hangar = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: HANGAR_INTERIOR_WALL_COLOR,
      roughness: 0.88,
      metalness: 0.05,
      side: THREE.DoubleSide,
    }),
  );
  hangar.castShadow = true;
  hangar.receiveShadow = true;
  architectureGroup.add(hangar);

  const frontWallCap = createClippedHorizontalWall(
    { x: centerX - ground * innerScale, z: frontZ + 0.02 },
    { x: centerX + ground * innerScale, z: frontZ + 0.02 },
    {
      color: HANGAR_INTERIOR_WALL_COLOR,
      thickness: OUTER_WALL_THICKNESS,
      baseY: WALL_HEIGHT,
      capY: archHeight * innerScale,
    },
  );
  architectureGroup.add(frontWallCap);

  const rearWallZ = toWorldPoint([0, HANGAR_GREENSCREEN_PLAN_Z]).z;
  const rearDoorStartX = toWorldPoint(hallwaySouthDoorway.start).x;
  const rearDoorEndX = toWorldPoint(hallwaySouthDoorway.end).x;
  const rearInsideWallWest = createPartialHangarInsetWall({
    centerX,
    wallZ: rearWallZ,
    ground,
    innerScale,
    archHeight,
    minWorldX: centerX - ground * innerScale,
    maxWorldX: rearDoorStartX,
    color: HANGAR_GREENSCREEN_COLOR,
  });
  architectureGroup.add(rearInsideWallWest);
  collisionRects.push(
    rectFromSegment(
      { x: centerX - ground * innerScale, z: rearWallZ },
      { x: rearDoorStartX, z: rearWallZ },
      OUTER_WALL_THICKNESS,
      PLAYER_RADIUS * 0.9,
    ),
  );

  const rearInsideWallEast = createPartialHangarInsetWall({
    centerX,
    wallZ: rearWallZ,
    ground,
    innerScale,
    archHeight,
    minWorldX: rearDoorEndX,
    maxWorldX: centerX + ground * innerScale,
  });
  architectureGroup.add(rearInsideWallEast);
  collisionRects.push(
    rectFromSegment(
      { x: rearDoorEndX, z: rearWallZ },
      { x: centerX + ground * innerScale, z: rearWallZ },
      OUTER_WALL_THICKNESS,
      PLAYER_RADIUS * 0.9,
    ),
  );
  const shellBackZ = frontZ + depth;
  const backWallZ = shellBackZ - OUTER_WALL_THICKNESS * 0.6;
  const rearGarageDoorCenterX = toWorldPoint(HANGAR_REAR_SHELF_CENTER).x;
  const backWallMinX = centerX - ground * innerScale;
  const backWallMaxX = centerX + ground * innerScale;
  const garageDoorMinX = Math.max(backWallMinX, rearGarageDoorCenterX - HANGAR_REAR_SHELF_WIDTH / 2);
  const garageDoorMaxX = Math.min(backWallMaxX, rearGarageDoorCenterX + HANGAR_REAR_SHELF_WIDTH / 2);
  const backWallSections = [
    [backWallMinX, garageDoorMinX, 0],
    [garageDoorMinX, garageDoorMaxX, HANGAR_REAR_GARAGE_DOOR_HEIGHT],
    [garageDoorMaxX, backWallMaxX, 0],
  ];
  backWallSections.forEach(([startX, endX, baseY]) => {
    if (endX - startX <= 0.01) {
      return;
    }
    architectureGroup.add(
      createClippedHorizontalWall(
        { x: startX, z: backWallZ },
        { x: endX, z: backWallZ },
        {
          color: HANGAR_INTERIOR_WALL_COLOR,
          thickness: OUTER_WALL_THICKNESS,
          baseY,
          capY: archHeight * innerScale,
        },
      ),
    );
  });
  const garageDoorWidth = garageDoorMaxX - garageDoorMinX;
  if (garageDoorWidth > 0.01) {
    const garageDoor = new THREE.Group();
    const garageDoorCurtain = new THREE.Group();
    const doorDepth = 0.055;
    const frameThickness = 0.09;
    const frameDepth = 0.08;
    const panelGap = 0.035;
    const panelRows = 5;
    const garageDoorLiftHeight = HANGAR_REAR_GARAGE_DOOR_HEIGHT + 0.22;
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: "#2c3137",
      roughness: 0.72,
      metalness: 0.26,
    });
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: "#a7afb8",
      roughness: 0.56,
      metalness: 0.18,
    });
    const backingMaterial = new THREE.MeshStandardMaterial({
      color: "#3c434b",
      roughness: 0.82,
      metalness: 0.08,
    });
    const trimMaterial = new THREE.MeshStandardMaterial({
      color: "#d9dde1",
      roughness: 0.38,
      metalness: 0.42,
    });

    const backing = new THREE.Mesh(
      new THREE.BoxGeometry(
        garageDoorWidth - frameThickness * 2 + 0.02,
        HANGAR_REAR_GARAGE_DOOR_HEIGHT - frameThickness * 0.4,
        0.01,
      ),
      backingMaterial,
    );
    backing.position.set(0, HANGAR_REAR_GARAGE_DOOR_HEIGHT / 2 - frameThickness * 0.2, 0.02);
    garageDoorCurtain.add(backing);

    [
      [-garageDoorWidth / 2 + frameThickness / 2, HANGAR_REAR_GARAGE_DOOR_HEIGHT / 2, 0, frameThickness, HANGAR_REAR_GARAGE_DOOR_HEIGHT, frameDepth],
      [garageDoorWidth / 2 - frameThickness / 2, HANGAR_REAR_GARAGE_DOOR_HEIGHT / 2, 0, frameThickness, HANGAR_REAR_GARAGE_DOOR_HEIGHT, frameDepth],
      [0, HANGAR_REAR_GARAGE_DOOR_HEIGHT - frameThickness / 2, 0, garageDoorWidth, frameThickness, frameDepth],
    ].forEach(([x, y, z, width, height, depth]) => {
      const piece = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        frameMaterial,
      );
      piece.position.set(x, y, z);
      garageDoor.add(piece);
    });

    const doorPanelWidth = garageDoorWidth - frameThickness * 2 - 0.08;
    const doorPanelHeight = HANGAR_REAR_GARAGE_DOOR_HEIGHT - frameThickness - 0.08;
    const rowHeight = (doorPanelHeight - panelGap * (panelRows - 1)) / panelRows;
    for (let row = 0; row < panelRows; row += 1) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(doorPanelWidth, rowHeight, doorDepth),
        panelMaterial,
      );
      panel.position.set(
        0,
        frameThickness + rowHeight / 2 + row * (rowHeight + panelGap),
        0,
      );
      garageDoorCurtain.add(panel);

      const inset = new THREE.Mesh(
        new THREE.BoxGeometry(doorPanelWidth - 0.28, rowHeight - 0.12, 0.018),
        trimMaterial,
      );
      inset.position.set(0, panel.position.y, doorDepth / 2 + 0.016);
      garageDoorCurtain.add(inset);
    }

    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.012, 10, 18),
      trimMaterial,
    );
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0, HANGAR_REAR_GARAGE_DOOR_HEIGHT * 0.46, doorDepth / 2 + 0.03);
    garageDoorCurtain.add(handle);

    garageDoor.add(garageDoorCurtain);

    enableShadows(garageDoor);
    garageDoor.position.set(
      (garageDoorMinX + garageDoorMaxX) / 2,
      0,
      backWallZ - OUTER_WALL_THICKNESS / 2 + doorDepth / 2 + 0.004,
    );
    architectureGroup.add(garageDoor);
    interactiveDoors.push({
      name: "Rear garage door",
      pivot: garageDoorCurtain,
      slab: garageDoorCurtain,
      currentAngle: 0,
      targetAngle: 0,
      openAngle: garageDoorLiftHeight,
      animationSpeed: 0.32,
      interactionPoint: new THREE.Vector3(
        (garageDoorMinX + garageDoorMaxX) / 2,
        PLAYER_HEIGHT,
        backWallZ - 0.7,
      ),
      applyRotation: (height) => {
        garageDoorCurtain.position.y = height;
      },
      getCollisionRects: () =>
        garageDoorCurtain.position.y > PLAYER_HEIGHT + 0.28
          ? []
          : [
              rectFromSegment(
                { x: garageDoorMinX, z: backWallZ },
                { x: garageDoorMaxX, z: backWallZ },
                doorDepth,
                PLAYER_RADIUS * 0.9,
              ),
            ],
    });
  }
  if (garageDoorMinX > backWallMinX + 0.01) {
    collisionRects.push(
      rectFromSegment(
        { x: backWallMinX, z: backWallZ },
        { x: garageDoorMinX, z: backWallZ },
        OUTER_WALL_THICKNESS,
        PLAYER_RADIUS * 0.9,
      ),
    );
  }
  if (garageDoorMaxX < backWallMaxX - 0.01) {
    collisionRects.push(
      rectFromSegment(
        { x: garageDoorMaxX, z: backWallZ },
        { x: backWallMaxX, z: backWallZ },
        OUTER_WALL_THICKNESS,
        PLAYER_RADIUS * 0.9,
      ),
    );
  }
  const westGreenscreenStartZ = rearWallZ + 0.06;
  const westGreenscreenEndZ = rearWallZ + (frontZ + depth - rearWallZ) * 0.52;
  const westGreenscreenMaxWorldX = centerX - ground * innerScale * 0.56;
  const westGreenscreenPanel = createHangarSideWallPanel({
    centerX,
    startZ: westGreenscreenStartZ,
    endZ: westGreenscreenEndZ,
    minWorldX: centerX - ground * innerScale,
    maxWorldX: westGreenscreenMaxWorldX,
    ground,
    innerScale,
    archHeight,
    color: HANGAR_GREENSCREEN_COLOR,
    offset: HANGAR_GREENSCREEN_OFFSET,
  });
  if (westGreenscreenPanel) {
    architectureGroup.add(westGreenscreenPanel);
  }

  addHangarInteriorDetails({
    centerX,
    frontZ,
    depth,
    ground,
    innerScale,
    archHeight,
    westRibCutoutStartZ: westGreenscreenStartZ,
    westRibCutoutEndZ: westGreenscreenEndZ,
    westRibCutoffLocalX:
      westGreenscreenMaxWorldX - centerX + HANGAR_GREENSCREEN_RIB_CLEARANCE,
  });

}

function addHangarInteriorDetails({
  centerX,
  frontZ,
  depth,
  ground,
  innerScale,
  archHeight,
  westRibCutoutStartZ = null,
  westRibCutoutEndZ = null,
  westRibCutoffLocalX = null,
}) {
  const innerGround = ground * innerScale;
  const apexHeight = archHeight * innerScale;
  const ribCount = Math.max(5, Math.floor(depth / HANGAR_RIB_INTERVAL));
  const ribStartZ = frontZ + 1.7;
  const ribEndZ = frontZ + depth - 1.9;
  const ribStep = ribCount > 1 ? (ribEndZ - ribStartZ) / (ribCount - 1) : 0;

  for (let i = 0; i < ribCount; i += 1) {
    const z = ribStartZ + ribStep * i;
    const minLocalX =
      westRibCutoutStartZ != null &&
      westRibCutoutEndZ != null &&
      westRibCutoffLocalX != null &&
      z >= westRibCutoutStartZ &&
      z <= westRibCutoutEndZ
        ? westRibCutoffLocalX
        : -innerGround;
    const rib = createHangarRib({
      centerX,
      z,
      innerGround,
      apexHeight,
      minLocalX,
    });
    architectureGroup.add(rib);
  }

  const ductLength = Math.max(6, depth - 4.6);
  const ductCenterZ = frontZ + depth * 0.5;
  const ductY = apexHeight * 0.61;
  const hangerCount = 5;

  [-1, 1].forEach((side) => {
    const ductX = centerX + innerGround * 0.44 * side;
    const ductRadius = HANGAR_DUCT_RADIUS * 1.34;
    const duct = new THREE.Mesh(
      new THREE.CylinderGeometry(ductRadius, ductRadius, ductLength, 28, 1, false),
      new THREE.MeshStandardMaterial({
        color: "#d7dddf",
        roughness: 0.28,
        metalness: 0.58,
      }),
    );
    duct.rotation.x = Math.PI / 2;
    duct.position.set(ductX, ductY, ductCenterZ);
    duct.castShadow = true;
    duct.receiveShadow = true;
    architectureGroup.add(duct);

    for (let i = 0; i < 28; i += 1) {
      const z = ductCenterZ - ductLength / 2 + (ductLength * (i + 0.5)) / 28;
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(ductRadius + 0.018, 0.032, 14, 28),
        new THREE.MeshStandardMaterial({
          color: "#b5bcc0",
          roughness: 0.26,
          metalness: 0.62,
        }),
      );
      rib.position.set(ductX, ductY, z);
      rib.castShadow = true;
      rib.receiveShadow = true;
      architectureGroup.add(rib);
    }

    for (let i = 0; i < hangerCount; i += 1) {
      const z = ductCenterZ - ductLength / 2 + (ductLength * (i + 0.5)) / hangerCount;
      const roofY = apexHeight * (1 - Math.pow((ductX - centerX) / innerGround, 2));
      const hangerHeight = Math.max(0.35, roofY - ductY);
      const hanger = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.032, hangerHeight, 12),
        new THREE.MeshStandardMaterial({
          color: "#d4d9dc",
          roughness: 0.3,
          metalness: 0.5,
        }),
      );
      hanger.position.set(ductX, ductY + hangerHeight / 2, z);
      hanger.castShadow = true;
      hanger.receiveShadow = true;
      architectureGroup.add(hanger);
    }
  });
}

function createHangarRib({
  centerX,
  z,
  innerGround,
  apexHeight,
  minLocalX = -innerGround,
  maxLocalX = innerGround,
}) {
  const ribMinLocalX = Math.max(-innerGround, Math.min(minLocalX, innerGround - 0.05));
  const ribMaxLocalX = Math.min(innerGround, Math.max(maxLocalX, ribMinLocalX + 0.05));
  const samples = Math.max(
    12,
    Math.ceil((28 * (ribMaxLocalX - ribMinLocalX)) / (innerGround * 2)),
  );
  const points = [];
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const x = ribMinLocalX + t * (ribMaxLocalX - ribMinLocalX);
    const y = Math.max(0, apexHeight * (1 - Math.pow(x / innerGround, 2)));
    points.push(new THREE.Vector3(centerX + x, y, z));
  }

  const profile = new THREE.Shape();
  profile.moveTo(-HANGAR_RIB_WIDTH / 2, -HANGAR_RIB_DEPTH / 2);
  profile.lineTo(HANGAR_RIB_WIDTH / 2, -HANGAR_RIB_DEPTH / 2);
  profile.lineTo(HANGAR_RIB_WIDTH / 2, HANGAR_RIB_DEPTH / 2);
  profile.lineTo(-HANGAR_RIB_WIDTH / 2, HANGAR_RIB_DEPTH / 2);
  profile.lineTo(-HANGAR_RIB_WIDTH / 2, -HANGAR_RIB_DEPTH / 2);

  const geometry = new THREE.ExtrudeGeometry(profile, {
    steps: samples * 2,
    bevelEnabled: false,
    extrudePath: new THREE.CatmullRomCurve3(points),
  });
  const rib = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: "#737975",
      roughness: 0.58,
      metalness: 0.16,
      emissive: "#1b1d1c",
      emissiveIntensity: 0.08,
    }),
  );
  rib.castShadow = true;
  rib.receiveShadow = true;
  return rib;
}

function createHangarInsetWall({
  centerX,
  wallZ,
  ground,
  innerScale,
  archHeight,
  openingMinX = null,
  openingMaxX = null,
  openingHeight = WALL_HEIGHT,
  color = HANGAR_INTERIOR_WALL_COLOR,
}) {
  const wallShape = new THREE.Shape();
  const innerGround = ground * innerScale;
  const apexHeight = archHeight * innerScale;

  wallShape.moveTo(-innerGround, 0);
  wallShape.quadraticCurveTo(-ground * 0.5 * innerScale, apexHeight, 0, apexHeight);
  wallShape.quadraticCurveTo(ground * 0.5 * innerScale, apexHeight, innerGround, 0);
  wallShape.lineTo(-innerGround, 0);

  if (
    openingMinX != null &&
    openingMaxX != null &&
    openingMaxX - openingMinX > 0.001 &&
    openingHeight > 0.001
  ) {
    const opening = new THREE.Path();
    const localMinX = openingMinX - centerX;
    const localMaxX = openingMaxX - centerX;
    opening.moveTo(localMinX, 0);
    opening.lineTo(localMaxX, 0);
    opening.lineTo(localMaxX, openingHeight);
    opening.lineTo(localMinX, openingHeight);
    opening.lineTo(localMinX, 0);
    wallShape.holes.push(opening);
  }

  const geometry = new THREE.ShapeGeometry(wallShape, 48);
  geometry.translate(centerX, 0, wallZ);

  const wall = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  );
  wall.castShadow = true;
  wall.receiveShadow = true;
  return wall;
}

function createPartialHangarInsetWall({
  centerX,
  wallZ,
  ground,
  innerScale,
  archHeight,
  minWorldX,
  maxWorldX,
  color = HANGAR_INTERIOR_WALL_COLOR,
}) {
  if (maxWorldX <= minWorldX + 0.001) {
    return null;
  }

  const localMinX = minWorldX - centerX;
  const localMaxX = maxWorldX - centerX;
  const samples = Math.max(10, Math.ceil((maxWorldX - minWorldX) * 8));
  const apexHeight = archHeight * innerScale;
  const innerGround = ground * innerScale;
  const shape = new THREE.Shape();

  shape.moveTo(localMinX, 0);
  for (let i = 0; i <= samples; i += 1) {
    const localX = localMinX + ((localMaxX - localMinX) * i) / samples;
    const y = Math.max(0, apexHeight * (1 - Math.pow(localX / innerGround, 2)));
    shape.lineTo(localX, y);
  }
  shape.lineTo(localMaxX, 0);
  shape.lineTo(localMinX, 0);

  const geometry = new THREE.ShapeGeometry(shape, 32);
  geometry.translate(centerX, 0, wallZ);

  const wall = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.9,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  );
  wall.castShadow = true;
  wall.receiveShadow = true;
  return wall;
}

function createHangarSideWallPanel({
  centerX,
  startZ,
  endZ,
  minWorldX,
  maxWorldX,
  ground,
  innerScale,
  archHeight,
  color = HANGAR_INTERIOR_WALL_COLOR,
  offset = 0,
}) {
  if (endZ <= startZ + 0.001 || maxWorldX <= minWorldX + 0.001) {
    return null;
  }

  const innerGround = ground * innerScale;
  const apexHeight = archHeight * innerScale;
  const xSegments = Math.max(8, Math.ceil((maxWorldX - minWorldX) * 10));
  const zSegments = Math.max(6, Math.ceil((endZ - startZ) * 0.6));
  const positions = [];
  const indices = [];

  for (let zi = 0; zi <= zSegments; zi += 1) {
    const z = startZ + ((endZ - startZ) * zi) / zSegments;
    for (let xi = 0; xi <= xSegments; xi += 1) {
      const x = minWorldX + ((maxWorldX - minWorldX) * xi) / xSegments;
      const localX = x - centerX;
      const y = Math.max(0, apexHeight * (1 - Math.pow(localX / innerGround, 2)));
      positions.push(x + offset, y, z);
    }
  }

  for (let zi = 0; zi < zSegments; zi += 1) {
    for (let xi = 0; xi < xSegments; xi += 1) {
      const a = zi * (xSegments + 1) + xi;
      const b = a + 1;
      const c = a + (xSegments + 1);
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const panel = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.88,
      metalness: 0.02,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
  );
  panel.castShadow = true;
  panel.receiveShadow = true;
  return panel;
}

function createHangarFrontWall({
  mapBounds,
  centerX,
  frontZ,
  ground,
  innerScale,
  archHeight,
}) {
  const innerGround = ground * innerScale;
  return createHangarInsetWall({
    centerX,
    wallZ: frontZ + 0.02,
    ground,
    innerScale,
    archHeight,
    openingMinX: centerX - innerGround,
    openingMaxX: centerX + innerGround,
    openingHeight: WALL_HEIGHT,
  });
}

function buildLighting() {
  const exteriorAmbient = new THREE.HemisphereLight("#fff4d6", "#73827f", 1.1);
  exteriorAmbient.layers.set(DEFAULT_LIGHTING_LAYER);
  scene.add(exteriorAmbient);

  const sun = new THREE.DirectionalLight("#fff0cf", 1.0);
  sun.position.set(8, 14, 6);
  sun.layers.set(DEFAULT_LIGHTING_LAYER);
  scene.add(sun);
}

function buildFurnishings() {
  addOther2Breakroom();
  addOther4Sink();
  addOther4Urinal();
  addOther4Toilet();
  addOther3Sink();
  addOther3Urinal();
  addOther3Toilet();
  addLivingArea();
  const hangarRearDecorArchitectureStartIndex = architectureGroup.children.length;
  const hangarRearDecorFurnishingStartIndex = furnishingGroup.children.length;
  addP3FlagAndGong();
  promoteNewChildrenToLayer(
    architectureGroup,
    hangarRearDecorArchitectureStartIndex,
    HANGAR_LIGHTING_LAYER,
  );
  promoteNewChildrenToLayer(
    furnishingGroup,
    hangarRearDecorFurnishingStartIndex,
    HANGAR_LIGHTING_LAYER,
  );
  const hangarArchitectureStartIndex = architectureGroup.children.length;
  const hangarFurnishingStartIndex = furnishingGroup.children.length;
  addP3aStorageShelf();
  addHangarEmptyPropShelf();
  addHangarBasketballHoop();
  addFootballGoalpost([13.1, 30.0], THREE.MathUtils.degToRad(54));
  addHangarRearHorseStatue();
  promoteNewChildrenToLayer(
    architectureGroup,
    hangarArchitectureStartIndex,
    HANGAR_LIGHTING_LAYER,
  );
  promoteNewChildrenToLayer(furnishingGroup, hangarFurnishingStartIndex, HANGAR_LIGHTING_LAYER);
  addI2I4MediaShelf();
  const weatherman = addStandingCharacter({
    planPosition: [-2.16, 20.0],
    rotation: -Math.PI / 2,
    hairColor: "#d3bc6d",
    tieColor: HANGAR_GREENSCREEN_COLOR,
    suitColor: "#434d56",
    shirtColor: "#f3efe6",
  });
  if (weatherman) {
    weatherman.head.rotation.y = Math.PI / 6;
    weatherman.leftArmPivot.rotation.x = -0.22;
    weatherman.leftArmPivot.rotation.y = -0.18;
    weatherman.leftArmPivot.rotation.z = -1.24;
  }
  registerForecastNpc(weatherman, {
    promptEyebrow: "Ben",
    promptTitle: "Press E to Forecast",
    lines: [
      "Let's see if you can read the sky.",
      "Storms are building. Stay sharp.",
      "Match the term.",
    ],
  });
}

function addStandingCharacter({
  position = null,
  planPosition = null,
  rotation = 0,
  hairColor = "#30231d",
  tieColor = "#9f6745",
  suitColor = "#46515b",
  shirtColor = "#f2efe7",
}) {
  const resolvedPosition = planPosition
    ? toWorldPoint(planPosition)
    : position;
  if (!resolvedPosition) {
    return;
  }

  const character = createPlayerAvatar({
    hairColor,
    tieColor,
    suitColor,
    pantColor: suitColor,
    shirtColor,
  });

  character.group.position.set(resolvedPosition.x, 0, resolvedPosition.z);
  character.root.rotation.y = rotation;
  character.head.rotation.y = -0.12;
  character.leftArmPivot.rotation.x = -0.14;
  character.rightArmPivot.rotation.x = -0.08;
  character.leftLegPivot.rotation.x = 0.04;
  character.rightLegPivot.rotation.x = -0.03;
  character.torso.rotation.z = -0.02;
  character.shadow.material.opacity = 0.14;

  setLayerRecursive(character.group, HANGAR_LIGHTING_LAYER);
  furnishingGroup.add(character.group);
  furnitureRects.push(axisAlignedRect(resolvedPosition, 0.64, 0.64, PLAYER_RADIUS * 0.05));

  return {
    ...character,
    interactionPoint: new THREE.Vector3(
      resolvedPosition.x,
      PLAYER_HEIGHT * 0.7,
      resolvedPosition.z,
    ),
  };
}

function addSeatedCharacter({
  planPosition,
  rotation = 0,
  seatHeight = 0.48,
  hairColor = "#30231d",
  tieColor = "#9f6745",
  suitColor = "#46515b",
  shirtColor = "#f2efe7",
  pose = SITTING_POSE,
  slickBackHair = false,
}) {
  const resolvedPosition = toWorldPoint(planPosition);
  if (!resolvedPosition) {
    return;
  }

  const character = createPlayerAvatar({
    hairColor,
    tieColor,
    suitColor,
    pantColor: suitColor,
    shirtColor,
    slickBackHair,
  });

  character.group.position.set(
    resolvedPosition.x,
    seatHeight - 0.89 + (pose.verticalOffset ?? 0),
    resolvedPosition.z,
  );
  character.root.rotation.y = rotation;
  character.head.rotation.y = pose.headRotationY ?? -0.08;
  character.head.rotation.x = pose.headRotationX ?? 0.04;
  character.leftArmPivot.rotation.x = pose.leftArmRotationX ?? 1.02;
  character.leftArmPivot.rotation.z = pose.leftArmRotationZ ?? -0.06;
  character.rightArmPivot.rotation.x = pose.rightArmRotationX ?? 0.98;
  character.rightArmPivot.rotation.z = pose.rightArmRotationZ ?? 0.08;
  character.leftLegPivot.rotation.x = pose.legRotationX ?? 1.25;
  character.rightLegPivot.rotation.x = pose.legRotationX ?? 1.25;
  if (character.leftKneePivot) {
    character.leftKneePivot.rotation.x = pose.kneeRotationX ?? -1.15;
    character.rightKneePivot.rotation.x = pose.kneeRotationX ?? -1.15;
  }
  character.torso.rotation.x = pose.torsoRotationX ?? 0.06;
  character.shadow.material.opacity = pose.shadowOpacity ?? 0.1;

  setLayerRecursive(character.group, HANGAR_LIGHTING_LAYER);
  furnishingGroup.add(character.group);
  return {
    ...character,
    interactionPoint: new THREE.Vector3(
      resolvedPosition.x,
      seatHeight + 0.5,
      resolvedPosition.z,
    ),
  };
}

function registerChatNpc(character, {
  promptEyebrow = "NPC",
  promptTitle = "Press E to talk",
  lines = ["..."],
  promptRadius = 1.8,
} = {}) {
  if (!character) {
    return;
  }
  interactiveNpcs.push({
    type: "chat",
    promptEyebrow,
    promptTitle,
    lines,
    promptRadius,
    avatar: character,
    interactionPoint: character.interactionPoint,
    promptAnchor: character.head,
    promptOffsetY: 0.42,
    baseRootY: character.root.position.y,
    baseHeadRotationX: character.head.rotation.x,
    baseHeadRotationY: character.head.rotation.y,
    baseLeftArmX: character.leftArmPivot.rotation.x,
    baseRightArmX: character.rightArmPivot.rotation.x,
    phaseOffset: Math.random() * Math.PI * 2,
  });
}

function registerForecastNpc(character, {
  promptEyebrow = "Weather Desk",
  promptTitle = "Press E to Forecast",
  lines = ["Match the term."],
  promptRadius = 2.25,
} = {}) {
  if (!character) {
    return;
  }

  interactiveNpcs.push({
    type: "forecast",
    promptEyebrow,
    promptTitle,
    lines,
    promptRadius,
    avatar: character,
    interactionPoint: character.interactionPoint,
    promptAnchor: character.head,
    promptOffsetY: 0.42,
    baseRootY: character.root.position.y,
    baseHeadRotationX: character.head.rotation.x,
    baseHeadRotationY: character.head.rotation.y,
    baseLeftArmX: character.leftArmPivot.rotation.x,
    baseRightArmX: character.rightArmPivot.rotation.x,
    phaseOffset: Math.random() * Math.PI * 2,
  });
}

function addOther2Breakroom() {
  addOther2Kitchenette();
  addOther2MediaShelf();
  addOther2Seating();
}

function addOther2CeilingDetails() {
  const beamMaterial = new THREE.MeshStandardMaterial({
    color: "#161719",
    roughness: 0.88,
    metalness: 0.18,
  });
  const pipeMaterial = new THREE.MeshStandardMaterial({
    color: "#4e5457",
    roughness: 0.48,
    metalness: 0.62,
  });

  [
    [10.25, -0.18, 3.92],
    [12.25, -0.08, 4.08],
    [14.18, 0.04, 4.24],
  ].forEach(([x, z, centerY]) => {
    addPlanBlock({
      center: [x, z],
      size: [0.12, 1.88, 0.14],
      centerY,
      material: beamMaterial,
      group: architectureGroup,
    });
  });

  addPlanBlock({
    center: [12.3, -0.06],
    size: [6.1, 0.08, 0.08],
    centerY: 5.02,
    material: beamMaterial,
    group: architectureGroup,
  });
  addPlanBlock({
    center: [12.1, 0.34],
    size: [5.4, 0.08, 0.08],
    centerY: 4.52,
    material: beamMaterial,
    group: architectureGroup,
  });

  const conduit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 2.5, 20),
    pipeMaterial,
  );
  conduit.rotation.x = Math.PI / 2;
  const conduitWorld = toWorldPoint([14.96, -0.22]);
  conduit.position.set(conduitWorld.x, 5.26, conduitWorld.z);
  conduit.castShadow = true;
  conduit.receiveShadow = true;
  architectureGroup.add(conduit);

  const drop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 1.05, 18),
    pipeMaterial,
  );
  const dropWorld = toWorldPoint([15.1, 0.26]);
  drop.position.set(dropWorld.x, 4.76, dropWorld.z);
  drop.castShadow = true;
  drop.receiveShadow = true;
  architectureGroup.add(drop);

  const junction = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.18, 0.18),
    pipeMaterial,
  );
  junction.position.set(dropWorld.x, 5.18, dropWorld.z);
  junction.castShadow = true;
  junction.receiveShadow = true;
  architectureGroup.add(junction);
}

function addOther2Kitchenette() {
  const kitchenetteWallX = OTHER2_PARTITION_X - INNER_WALL_THICKNESS / 2;
  const p7bWallZ = FRONT_EDGE_Z + INNER_WALL_THICKNESS / 2;
  const i1FaceZ = I1_Z - INNER_WALL_THICKNESS / 2;
  const fridgeCenterZ = p7bWallZ + 0.44;
  const fridgeDepth = 0.92;
  const fridgeEndZ = fridgeCenterZ + fridgeDepth / 2;
  const counterStartZ = fridgeEndZ + 0.06;
  const counterEndZ = i1FaceZ - 0.1;
  const counterLength = counterEndZ - counterStartZ;
  const counterCenterZ = counterStartZ + counterLength / 2;
  const wallPanelCenter = [kitchenetteWallX - 0.08, counterCenterZ];
  const counterRunCenter = [kitchenetteWallX - 0.38, counterCenterZ];
  const counterRunSize = [counterLength, 0.72, 0.9];
  const counterRotation = Math.PI / 2;
  const whitePaint = new THREE.MeshStandardMaterial({
    color: "#f0efea",
    roughness: 0.96,
    metalness: 0.02,
  });
  const charcoalCabinet = new THREE.MeshStandardMaterial({
    color: "#575d62",
    roughness: 0.52,
    metalness: 0.48,
  });
  const upperCabinet = new THREE.MeshStandardMaterial({
    color: "#676d72",
    roughness: 0.46,
    metalness: 0.38,
  });

  addPlanBlock({
    center: wallPanelCenter,
    size: [counterLength + 0.35, 1.55, 0.08],
    centerY: 1.96,
    rotation: Math.PI / 2,
    material: whitePaint,
    group: architectureGroup,
  });

  addPlanBlock({
    center: counterRunCenter,
    size: counterRunSize,
    centerY: counterRunSize[2] / 2,
    rotation: counterRotation,
    material: charcoalCabinet,
    group: furnishingGroup,
  });
  addPlanBlock({
    center: counterRunCenter,
    size: [counterRunSize[0] + 0.04, 0.05, counterRunSize[1] + 0.04],
    centerY: counterRunSize[2] + 0.025,
    rotation: counterRotation,
    material: new THREE.MeshStandardMaterial({
      color: "#141518",
      roughness: 0.42,
      metalness: 0.08,
    }),
    group: furnishingGroup,
  });
  pushPlanRectCollider(counterRunCenter, counterRunSize[0], counterRunSize[1], counterRotation, PLAYER_RADIUS * 0.16);

  addBoxFurniture({
    center: [kitchenetteWallX - 0.42, fridgeCenterZ],
    size: [0.9, fridgeDepth, 1.92],
    color: "#0d0e10",
    collider: true,
  });

  const upperCabinetLength = 0.58;
  const upperCabinetGroupCenterZ = counterStartZ + counterLength / 2;
  [
    upperCabinetGroupCenterZ - upperCabinetLength,
    upperCabinetGroupCenterZ,
    upperCabinetGroupCenterZ + upperCabinetLength,
  ].forEach((z, index) => {
    addPlanBlock({
      center: [kitchenetteWallX - 0.2, z],
      size: [upperCabinetLength, 0.76, 0.34],
      centerY: 2.2,
      rotation: Math.PI / 2,
      material: index === 1
        ? new THREE.MeshStandardMaterial({
            color: "#2d3136",
            roughness: 0.68,
            metalness: 0.22,
          })
        : upperCabinet,
      group: furnishingGroup,
    });
  });

  const microwave = new THREE.Group();
  const microwaveBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.36, 0.46),
    new THREE.MeshStandardMaterial({
      color: "#121315",
      roughness: 0.4,
      metalness: 0.3,
    }),
  );
  microwaveBody.position.y = 0.18;
  microwave.add(microwaveBody);
  const microwaveDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.24, 0.03),
    new THREE.MeshStandardMaterial({
      color: "#0a0b0d",
      emissive: "#111722",
      emissiveIntensity: 0.16,
      roughness: 0.28,
      metalness: 0.08,
    }),
  );
  microwaveDoor.position.set(0, 0.18, 0.225);
  microwave.add(microwaveDoor);
  enableShadows(microwave);
  placePlanObject(microwave, [kitchenetteWallX - 0.58, counterStartZ + 0.36], 0.92, -Math.PI / 2, furnishingGroup);

  const coffeeStation = new THREE.Group();
  const machine = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.42, 0.28),
    new THREE.MeshStandardMaterial({
      color: "#64676b",
      roughness: 0.42,
      metalness: 0.58,
    }),
  );
  machine.position.y = 0.21;
  coffeeStation.add(machine);
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.038, 0.09, 18),
    new THREE.MeshStandardMaterial({ color: "#f3f0ea", roughness: 0.92 }),
  );
  cup.position.set(0.18, 0.05, 0.02);
  coffeeStation.add(cup);
  const bottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.035, 0.18, 18),
    new THREE.MeshStandardMaterial({ color: "#2a2f34", roughness: 0.48 }),
  );
  bottle.position.set(-0.18, 0.09, -0.02);
  coffeeStation.add(bottle);
  enableShadows(coffeeStation);
  placePlanObject(coffeeStation, [kitchenetteWallX - 0.56, counterEndZ - 0.34], 0.92, -Math.PI / 2, furnishingGroup);

  const faucet = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.012, 10, 20, Math.PI),
    new THREE.MeshStandardMaterial({
      color: "#c8cdd2",
      roughness: 0.28,
      metalness: 0.86,
    }),
  );
  const faucetWorld = toWorldPoint([kitchenetteWallX - 0.58, counterCenterZ + 0.16]);
  faucet.rotation.z = Math.PI / 2;
  faucet.rotation.y = Math.PI / 2;
  faucet.position.set(faucetWorld.x, 1.02, faucetWorld.z);
  faucet.castShadow = true;
  faucet.receiveShadow = true;
  furnishingGroup.add(faucet);

  const sink = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.04, 0.36),
    new THREE.MeshStandardMaterial({
      color: "#9ba2a7",
      roughness: 0.38,
      metalness: 0.74,
    }),
  );
  sink.position.set(faucetWorld.x, 0.95, faucetWorld.z);
  sink.castShadow = true;
  sink.receiveShadow = true;
  furnishingGroup.add(sink);

  addPlanBlock({
    center: [9.9, I1_Z - 0.2],
    size: [2.8, 0.96, 0.34],
    centerY: 1.93,
    material: new THREE.MeshStandardMaterial({
      color: "#676d72",
      roughness: 0.46,
      metalness: 0.38,
    }),
    group: furnishingGroup,
  });
}

function addOther2LouverPanels() {
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: "#1b1b1c",
    roughness: 0.82,
    metalness: 0.18,
  });
  const glassGlow = new THREE.MeshStandardMaterial({
    color: "#b8d8f7",
    emissive: "#9cd1ff",
    emissiveIntensity: 0.22,
    roughness: 0.18,
    metalness: 0.02,
    transparent: true,
    opacity: 0.32,
  });
  const slatMaterial = new THREE.MeshStandardMaterial({
    color: "#393c41",
    roughness: 0.62,
    metalness: 0.08,
  });

  [
    [8.16, -0.96],
    [8.16, -0.04],
  ].forEach(([x, z]) => {
    const panel = new THREE.Group();
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 1.78, 0.82),
      frameMaterial,
    );
    frame.position.y = 2.36;
    panel.add(frame);

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 1.54, 0.62),
      glassGlow,
    );
    glass.position.set(0.03, 2.34, 0);
    panel.add(glass);

    for (let i = 0; i < 7; i += 1) {
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.12, 0.66),
        slatMaterial,
      );
      slat.position.set(0.05, 1.75 + i * 0.19, 0);
      slat.rotation.z = -0.22;
      panel.add(slat);
    }

    enableShadows(panel);
    placePlanObject(panel, [x, z], 0, 0, architectureGroup);
  });
}

function addOther2Seating() {
  addOther2PubTable([8.95, -1.8], 0.48, 1.04);
  addOther2BarStool([8.18, -1.74], -0.24);
  addOther2BarStool([9.6, -1.28], Math.PI);
}

function addOther4Sink() {
  const sinkCenterX = (8.6 + 10.0) / 2;
  const sinkWidth = 1.4;
  const sinkDepth = 0.54;
  const sinkHeight = 0.9;
  const sinkCenterZ = OTHER3_TOP - sinkDepth / 2 - INNER_WALL_THICKNESS / 2;

  addPlanBlock({
    center: [sinkCenterX, sinkCenterZ],
    size: [sinkWidth, sinkDepth, sinkHeight],
    centerY: sinkHeight / 2,
    material: new THREE.MeshStandardMaterial({
      color: "#d3d5d8",
      roughness: 0.74,
      metalness: 0.12,
    }),
    group: furnishingGroup,
  });
  addPlanBlock({
    center: [sinkCenterX, sinkCenterZ],
    size: [sinkWidth + 0.02, sinkDepth + 0.02, 0.05],
    centerY: sinkHeight + 0.025,
    material: new THREE.MeshStandardMaterial({
      color: "#eff1f2",
      roughness: 0.34,
      metalness: 0.08,
    }),
    group: furnishingGroup,
  });
  pushPlanRectCollider([sinkCenterX, sinkCenterZ], sinkWidth, sinkDepth, 0, PLAYER_RADIUS * 0.12);

  const basin = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.04, 0.28),
    new THREE.MeshStandardMaterial({
      color: "#9ea4aa",
      roughness: 0.28,
      metalness: 0.72,
    }),
  );
  const basinWorld = toWorldPoint([sinkCenterX, sinkCenterZ]);
  basin.position.set(basinWorld.x, sinkHeight + 0.035, basinWorld.z);
  basin.castShadow = true;
  basin.receiveShadow = true;
  furnishingGroup.add(basin);

  const faucet = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.012, 10, 20, Math.PI),
    new THREE.MeshStandardMaterial({
      color: "#c8cdd2",
      roughness: 0.24,
      metalness: 0.86,
    }),
  );
  faucet.rotation.z = Math.PI / 2;
  faucet.position.set(basinWorld.x, sinkHeight + 0.12, basinWorld.z + 0.08);
  faucet.castShadow = true;
  faucet.receiveShadow = true;
  furnishingGroup.add(faucet);

  const mirror = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.82, 0.03),
    new THREE.MeshStandardMaterial({
      color: "#d7dde3",
      emissive: "#1b2128",
      emissiveIntensity: 0.08,
      roughness: 0.14,
      metalness: 0.22,
    }),
  );
  mirror.position.set(
    basinWorld.x,
    1.72,
    toWorldPoint([sinkCenterX, OTHER3_TOP - INNER_WALL_THICKNESS / 2 - 0.03]).z,
  );
  mirror.castShadow = true;
  mirror.receiveShadow = true;
  furnishingGroup.add(mirror);
}

function addOther4Urinal() {
  const urinalDepth = 0.42;
  const urinalCenterX = (10.5 + 12) / 2;
  const urinalCenter = [urinalCenterX, OTHER3_TOP - urinalDepth / 2 - INNER_WALL_THICKNESS / 2];
  const urinal = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.72, urinalDepth),
    new THREE.MeshStandardMaterial({
      color: "#edf1f3",
      roughness: 0.28,
      metalness: 0.06,
    }),
  );
  body.position.set(0, 0.54, 0);
  urinal.add(body);

  const basin = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.2, 0.24),
    new THREE.MeshStandardMaterial({
      color: "#d8dde1",
      roughness: 0.18,
      metalness: 0.04,
    }),
  );
  basin.position.set(-0.08, 0.5, 0);
  urinal.add(basin);

  const flushValve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.32, 18),
    new THREE.MeshStandardMaterial({
      color: "#c7ccd1",
      roughness: 0.24,
      metalness: 0.84,
    }),
  );
  flushValve.rotation.z = Math.PI / 2;
  flushValve.position.set(0.16, 0.9, 0);
  urinal.add(flushValve);

  const drain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.16, 16),
    new THREE.MeshStandardMaterial({
      color: "#c7ccd1",
      roughness: 0.24,
      metalness: 0.84,
    }),
  );
  drain.position.set(0.1, 0.18, 0);
  urinal.add(drain);

  const dividerPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 1.2, 0.72),
    new THREE.MeshStandardMaterial({
      color: "#c9ced3",
      roughness: 0.62,
      metalness: 0.08,
    }),
  );
  dividerPanel.position.set(-0.28, 0.74, -0.22);
  urinal.add(dividerPanel);

  enableShadows(urinal);
  placePlanObject(urinal, urinalCenter, 0, Math.PI / 2, furnishingGroup);
  pushPlanRectCollider(urinalCenter, 0.44, urinalDepth + 0.14, 0, PLAYER_RADIUS * 0.08);
}

function addOther4Toilet() {
  const toiletDepth = 0.72;
  const toiletCenter = [13.5, OTHER3_TOP - toiletDepth / 2 - INNER_WALL_THICKNESS / 2];
  const toilet = new THREE.Group();

  const tank = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.7, 0.2),
    new THREE.MeshStandardMaterial({
      color: "#eef2f4",
      roughness: 0.24,
      metalness: 0.04,
    }),
  );
  tank.position.set(0, 0.8, -0.2);
  toilet.add(tank);

  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.24, 0.42, 24),
    new THREE.MeshStandardMaterial({
      color: "#f4f6f7",
      roughness: 0.22,
      metalness: 0.02,
    }),
  );
  bowl.scale.z = 1.28;
  bowl.position.set(0, 0.33, 0.08);
  toilet.add(bowl);

  const seat = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.032, 14, 26),
    new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.3,
      metalness: 0.02,
    }),
  );
  seat.rotation.x = Math.PI / 2;
  seat.position.set(0, 0.48, 0.1);
  toilet.add(seat);

  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.03, 0.5),
    new THREE.MeshStandardMaterial({
      color: "#fbfcfc",
      roughness: 0.26,
      metalness: 0.02,
    }),
  );
  lid.position.set(0, 0.56, 0.02);
  lid.rotation.x = -0.2;
  toilet.add(lid);

  const flushButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.06, 16),
    new THREE.MeshStandardMaterial({
      color: "#c5cacf",
      roughness: 0.24,
      metalness: 0.86,
    }),
  );
  flushButton.rotation.x = Math.PI / 2;
  flushButton.position.set(0, 1.14, -0.19);
  toilet.add(flushButton);

  enableShadows(toilet);
  placePlanObject(toilet, toiletCenter, 0, Math.PI, furnishingGroup);
  pushPlanRectCollider(toiletCenter, 0.7, toiletDepth, 0, PLAYER_RADIUS * 0.1);
}

function addOther3Sink() {
  const sinkCenterX = (8.6 + 10.0) / 2;
  const sinkWidth = 1.4;
  const sinkDepth = 0.54;
  const sinkHeight = 0.9;
  const sinkCenterZ = OTHER3_TOP + sinkDepth / 2 + INNER_WALL_THICKNESS / 2;

  addPlanBlock({
    center: [sinkCenterX, sinkCenterZ],
    size: [sinkWidth, sinkDepth, sinkHeight],
    centerY: sinkHeight / 2,
    material: new THREE.MeshStandardMaterial({
      color: "#d3d5d8",
      roughness: 0.74,
      metalness: 0.12,
    }),
    group: furnishingGroup,
  });
  addPlanBlock({
    center: [sinkCenterX, sinkCenterZ],
    size: [sinkWidth + 0.02, sinkDepth + 0.02, 0.05],
    centerY: sinkHeight + 0.025,
    material: new THREE.MeshStandardMaterial({
      color: "#eff1f2",
      roughness: 0.34,
      metalness: 0.08,
    }),
    group: furnishingGroup,
  });
  pushPlanRectCollider([sinkCenterX, sinkCenterZ], sinkWidth, sinkDepth, 0, PLAYER_RADIUS * 0.12);

  const basin = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.04, 0.28),
    new THREE.MeshStandardMaterial({
      color: "#9ea4aa",
      roughness: 0.28,
      metalness: 0.72,
    }),
  );
  const basinWorld = toWorldPoint([sinkCenterX, sinkCenterZ]);
  basin.position.set(basinWorld.x, sinkHeight + 0.035, basinWorld.z);
  basin.castShadow = true;
  basin.receiveShadow = true;
  furnishingGroup.add(basin);

  const faucet = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.012, 10, 20, Math.PI),
    new THREE.MeshStandardMaterial({
      color: "#c8cdd2",
      roughness: 0.24,
      metalness: 0.86,
    }),
  );
  faucet.rotation.z = Math.PI / 2;
  faucet.position.set(basinWorld.x, sinkHeight + 0.12, basinWorld.z - 0.08);
  faucet.castShadow = true;
  faucet.receiveShadow = true;
  furnishingGroup.add(faucet);

  const mirror = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.82, 0.03),
    new THREE.MeshStandardMaterial({
      color: "#d7dde3",
      emissive: "#1b2128",
      emissiveIntensity: 0.08,
      roughness: 0.14,
      metalness: 0.22,
    }),
  );
  mirror.position.set(
    basinWorld.x,
    1.72,
    toWorldPoint([sinkCenterX, OTHER3_TOP + INNER_WALL_THICKNESS / 2 + 0.03]).z,
  );
  mirror.castShadow = true;
  mirror.receiveShadow = true;
  furnishingGroup.add(mirror);
}

function addOther3Urinal() {
  const urinalDepth = 0.42;
  const urinalCenterX = (10.5 + 12) / 2;
  const urinalCenter = [urinalCenterX, OTHER3_TOP + urinalDepth / 2 + INNER_WALL_THICKNESS / 2];
  const urinal = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.72, urinalDepth),
    new THREE.MeshStandardMaterial({
      color: "#edf1f3",
      roughness: 0.28,
      metalness: 0.06,
    }),
  );
  body.position.set(0, 0.54, 0);
  urinal.add(body);

  const basin = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.2, 0.24),
    new THREE.MeshStandardMaterial({
      color: "#d8dde1",
      roughness: 0.18,
      metalness: 0.04,
    }),
  );
  basin.position.set(-0.08, 0.5, 0);
  urinal.add(basin);

  const flushValve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.32, 18),
    new THREE.MeshStandardMaterial({
      color: "#c7ccd1",
      roughness: 0.24,
      metalness: 0.84,
    }),
  );
  flushValve.rotation.z = Math.PI / 2;
  flushValve.position.set(0.16, 0.9, 0);
  urinal.add(flushValve);

  const drain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.16, 16),
    new THREE.MeshStandardMaterial({
      color: "#c7ccd1",
      roughness: 0.24,
      metalness: 0.84,
    }),
  );
  drain.position.set(0.1, 0.18, 0);
  urinal.add(drain);

  const dividerPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 1.2, 0.72),
    new THREE.MeshStandardMaterial({
      color: "#c9ced3",
      roughness: 0.62,
      metalness: 0.08,
    }),
  );
  dividerPanel.position.set(-0.28, 0.74, -0.22);
  urinal.add(dividerPanel);

  enableShadows(urinal);
  placePlanObject(urinal, urinalCenter, 0, -Math.PI / 2, furnishingGroup);
  pushPlanRectCollider(urinalCenter, 0.44, urinalDepth + 0.14, 0, PLAYER_RADIUS * 0.08);
}

function addOther3Toilet() {
  const toiletDepth = 0.72;
  const toiletCenter = [13.5, OTHER3_TOP + toiletDepth / 2 + INNER_WALL_THICKNESS / 2];
  const toilet = new THREE.Group();

  const tank = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.7, 0.2),
    new THREE.MeshStandardMaterial({
      color: "#eef2f4",
      roughness: 0.24,
      metalness: 0.04,
    }),
  );
  tank.position.set(0, 0.8, -0.2);
  toilet.add(tank);

  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.24, 0.42, 24),
    new THREE.MeshStandardMaterial({
      color: "#f4f6f7",
      roughness: 0.22,
      metalness: 0.02,
    }),
  );
  bowl.scale.z = 1.28;
  bowl.position.set(0, 0.33, 0.08);
  toilet.add(bowl);

  const seat = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.032, 14, 26),
    new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.3,
      metalness: 0.02,
    }),
  );
  seat.rotation.x = Math.PI / 2;
  seat.position.set(0, 0.48, 0.1);
  toilet.add(seat);

  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.03, 0.5),
    new THREE.MeshStandardMaterial({
      color: "#fbfcfc",
      roughness: 0.26,
      metalness: 0.02,
    }),
  );
  lid.position.set(0, 0.56, 0.02);
  lid.rotation.x = -0.2;
  toilet.add(lid);

  const flushButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.06, 16),
    new THREE.MeshStandardMaterial({
      color: "#c5cacf",
      roughness: 0.24,
      metalness: 0.86,
    }),
  );
  flushButton.rotation.x = Math.PI / 2;
  flushButton.position.set(0, 1.14, -0.19);
  toilet.add(flushButton);

  enableShadows(toilet);
  placePlanObject(toilet, toiletCenter, 0, 0, furnishingGroup);
  pushPlanRectCollider(toiletCenter, 0.7, toiletDepth, 0, PLAYER_RADIUS * 0.1);
}

function addOther2Decor() {
  addPictureFrame({
    center: [13.98, FRONT_EDGE_Z + 0.08],
    y: 1.72,
    size: [0.88, 1.1],
    rotation: Math.PI,
    accent: "#9fa8b5",
  });

  const wrappedPanel = new THREE.Group();
  const panelBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.28, 1.92, 0.08),
    new THREE.MeshStandardMaterial({
      color: "#2d3136",
      roughness: 0.82,
      metalness: 0.12,
    }),
  );
  panelBody.position.y = 0.96;
  wrappedPanel.add(panelBody);
  const wrap = new THREE.Mesh(
    new THREE.BoxGeometry(1.34, 1.98, 0.1),
    new THREE.MeshStandardMaterial({
      color: "#d5dbe1",
      roughness: 0.18,
      metalness: 0.02,
      transparent: true,
      opacity: 0.14,
    }),
  );
  wrap.position.y = 0.98;
  wrappedPanel.add(wrap);
  enableShadows(wrappedPanel);
  const wrappedWorld = toWorldPoint([15.02, FRONT_EDGE_Z + 0.28]);
  wrappedPanel.position.set(wrappedWorld.x, 0, wrappedWorld.z);
  wrappedPanel.rotation.y = Math.PI - 0.16;
  wrappedPanel.rotation.z = -0.08;
  furnishingGroup.add(wrappedPanel);

  const tissueBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.12, 0.18),
    new THREE.MeshStandardMaterial({ color: "#101113", roughness: 0.72 }),
  );
  const tissueWorld = toWorldPoint([8.92, -0.72]);
  tissueBox.position.set(tissueWorld.x, 1.1, tissueWorld.z);
  tissueBox.castShadow = true;
  tissueBox.receiveShadow = true;
  furnishingGroup.add(tissueBox);
}

function addOther2PubTable(center, radius, height) {
  const table = new THREE.Group();
  const topMaterial = new THREE.MeshStandardMaterial({
    color: "#0f1012",
    roughness: 0.58,
    metalness: 0.18,
  });
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: "#2a2d31",
    roughness: 0.44,
    metalness: 0.52,
  });

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.05, 30),
    topMaterial,
  );
  top.position.y = height;
  table.add(top);

  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.08, height, 24),
    baseMaterial,
  );
  column.position.y = height / 2;
  table.add(column);

  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, 0.04, 28),
    baseMaterial,
  );
  foot.position.y = 0.02;
  table.add(foot);

  enableShadows(table);
  placePlanObject(table, center, 0, 0, furnishingGroup);
  pushPlanRectCollider(center, radius * 2, radius * 2, 0, PLAYER_RADIUS * 0.1);
}

function addOther2BarStool(center, rotation = 0) {
  const stool = new THREE.Group();
  const seatMaterial = new THREE.MeshStandardMaterial({
    color: "#1c1d20",
    roughness: 0.56,
    metalness: 0.22,
  });
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: "#8f674b",
    roughness: 0.72,
    metalness: 0.06,
  });
  const legMaterial = new THREE.MeshStandardMaterial({
    color: "#202326",
    roughness: 0.42,
    metalness: 0.42,
  });

  const seat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.05, 24),
    seatMaterial,
  );
  seat.position.y = 0.78;
  stool.add(seat);

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.26, 0.05),
    woodMaterial,
  );
  back.position.set(0, 1.0, -0.16);
  stool.add(back);

  [
    [-0.12, -0.12],
    [0.12, -0.12],
    [-0.12, 0.12],
    [0.12, 0.12],
  ].forEach(([x, z]) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.02, 0.76, 10),
      legMaterial,
    );
    leg.position.set(x, 0.38, z);
    stool.add(leg);
  });

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.17, 0.012, 10, 20),
    legMaterial,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.3;
  stool.add(ring);

  enableShadows(stool);
  placePlanObject(stool, center, 0, rotation, furnishingGroup);
}

function addKitchen() {
  const countertop = "#d5d0c9";
  const cabinetry = "#8b7a67";

  addBoxFurniture({
    center: [0.72, 2.15],
    size: [0.65, 4.0, 0.94],
    color: cabinetry,
    topColor: countertop,
    collider: true,
  });
  addBoxFurniture({
    center: [2.55, 0.72],
    size: [4.05, 0.65, 0.94],
    color: cabinetry,
    topColor: countertop,
    collider: true,
  });
  addBoxFurniture({
    center: [4.55, 2.15],
    size: [1.15, 2.05, 0.94],
    color: "#9b8a77",
    topColor: "#ddd5cb",
    collider: true,
  });
}

function addDiningArea() {
  const table = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.08, 1.04),
    new THREE.MeshStandardMaterial({ color: "#7a5f4d", roughness: 0.72 }),
  );
  const tableWorld = toWorldPoint([3.15, 4.3]);
  table.position.set(tableWorld.x, 0.78, tableWorld.z);
  table.castShadow = true;
  table.receiveShadow = true;
  furnishingGroup.add(table);

  addTableLegs(tableWorld, 0.92, 0.44);
  [
    [2.15, 4.3],
    [4.15, 4.3],
    [3.15, 3.2],
    [3.15, 5.4],
  ].forEach((center) => {
    addChair(center);
  });
}

function addMediaShelf(center, rotation = 0) {
  const shelfWidth = 1.58;
  const shelfDepth = 0.38;
  const shelfHeight = 0.68;
  const shelf = new THREE.Group();
  const cabinetMaterial = new THREE.MeshStandardMaterial({
    color: "#131313",
    roughness: 0.72,
    metalness: 0.18,
  });
  const insetMaterial = new THREE.MeshStandardMaterial({
    color: "#0c0c0d",
    roughness: 0.86,
    metalness: 0.06,
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(shelfWidth, shelfHeight, shelfDepth),
    cabinetMaterial,
  );
  body.position.y = shelfHeight / 2;
  shelf.add(body);

  const topSlab = new THREE.Mesh(
    new THREE.BoxGeometry(shelfWidth + 0.04, 0.04, shelfDepth + 0.02),
    cabinetMaterial,
  );
  topSlab.position.y = shelfHeight + 0.02;
  shelf.add(topSlab);

  const toeKick = new THREE.Mesh(
    new THREE.BoxGeometry(shelfWidth - 0.14, 0.06, shelfDepth - 0.12),
    insetMaterial,
  );
  toeKick.position.set(0, 0.03, 0);
  shelf.add(toeKick);

  const doorGap = 0.018;
  const doorWidth = (shelfWidth - 0.14 - doorGap * 2) / 3;
  [-1, 0, 1].forEach((index) => {
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, shelfHeight - 0.12, 0.025),
      insetMaterial,
    );
    door.position.set(index * (doorWidth + doorGap), shelfHeight / 2 + 0.01, -shelfDepth / 2 + 0.19);
    shelf.add(door);

    const pull = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.12, 0.03),
      new THREE.MeshStandardMaterial({
        color: "#2d2f33",
        roughness: 0.42,
        metalness: 0.52,
      }),
    );
    pull.position.set(
      index * (doorWidth + doorGap) + (index === 0 ? doorWidth * 0.32 : index === 1 ? 0 : -doorWidth * 0.32),
      shelfHeight / 2 + 0.01,
      -shelfDepth / 2 + 0.205,
    );
    shelf.add(pull);
  });

  const centerShelf = new THREE.Mesh(
    new THREE.BoxGeometry(shelfWidth - 0.18, 0.018, 0.16),
    insetMaterial,
  );
  centerShelf.position.set(0, shelfHeight * 0.56, 0.03);
  shelf.add(centerShelf);

  enableShadows(shelf);
  placePlanObject(shelf, center, 0, rotation, furnishingGroup);
  pushPlanRectCollider(center, shelfWidth, shelfDepth, rotation, PLAYER_RADIUS * 0.08);
}

function addLivingArea() {
  addP1P10CornerFurnishings();
}

function addI2I4MediaShelf() {
  const mediaCenter = [RIGHT_STACK_X - 0.34, OTHER3_TOP];
  const wallRotation = Math.PI / 2;
  addMediaShelf(mediaCenter, wallRotation);

  const tv = new THREE.Group();
  const bracketMaterial = new THREE.MeshStandardMaterial({
    color: "#2b2d30",
    roughness: 0.5,
    metalness: 0.42,
  });
  const bezelMaterial = new THREE.MeshStandardMaterial({
    color: "#101113",
    roughness: 0.34,
    metalness: 0.14,
  });
  const screenMaterial = new THREE.MeshStandardMaterial({
    color: "#090a0c",
    map: createDisplaySceneTexture("forest"),
    emissive: "#0d1116",
    emissiveIntensity: 0.24,
    roughness: 0.22,
    metalness: 0.04,
  });

  const wallPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.18, 0.03),
    bracketMaterial,
  );
  wallPlate.position.z = 0.015;
  tv.add(wallPlate);

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.1, 0.1),
    bracketMaterial,
  );
  arm.position.z = -0.045;
  tv.add(arm);

  const bezel = new THREE.Mesh(
    new THREE.BoxGeometry(1.92, 1.12, 0.07),
    bezelMaterial,
  );
  bezel.position.z = -0.12;
  tv.add(bezel);

  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(1.76, 0.98, 0.02),
    screenMaterial,
  );
  screen.position.z = -0.15;
  tv.add(screen);

  enableShadows(tv);
  placePlanObject(
    tv,
    [RIGHT_STACK_X - INNER_WALL_THICKNESS / 2 - 0.03, OTHER3_TOP],
    1.58,
    wallRotation,
    architectureGroup,
  );
}

function addOther2MediaShelf() {
  addMediaShelf([9, 0.7], 0);
}

function addP3FlagAndGong() {
  const centerX = other5Doorway.centerX;
  const p3WallZ = PLAN_DEPTH - OUTER_WALL_THICKNESS / 2 - 0.02;

  const flagTexture = new THREE.TextureLoader().load(
    new URL("./americanflag.png", import.meta.url).href,
  );
  flagTexture.colorSpace = THREE.SRGBColorSpace;

  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.8),
    new THREE.MeshStandardMaterial({
      map: flagTexture,
      roughness: 0.86,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  );
  flag.position.set(toWorldPoint([centerX, p3WallZ]).x, 4.35, toWorldPoint([centerX, p3WallZ]).z);
  flag.rotation.y = Math.PI;
  flag.castShadow = true;
  flag.receiveShadow = true;
  architectureGroup.add(flag);

  const gong = new THREE.Group();
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: "#4a4d50",
    roughness: 0.6,
    metalness: 0.46,
  });
  const discMaterial = new THREE.MeshStandardMaterial({
    color: "#b8862f",
    roughness: 0.34,
    metalness: 0.82,
  });

  const frameWidth = 1.85;
  const frameHeight = 2.15;
  [-frameWidth / 2, frameWidth / 2].forEach((x) => {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, frameHeight, 0.08),
      frameMaterial,
    );
    post.position.set(x, frameHeight / 2, 0);
    gong.add(post);
  });

  const topBar = new THREE.Mesh(
    new THREE.BoxGeometry(frameWidth + 0.08, 0.08, 0.08),
    frameMaterial,
  );
  topBar.position.set(0, frameHeight, 0);
  gong.add(topBar);

  const gongDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.58, 0.08, 36),
    discMaterial,
  );
  gongDisc.rotation.x = Math.PI / 2;
  gongDisc.position.set(0, 1.18, 0);
  gong.add(gongDisc);

  const gongCenter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.09, 20),
    new THREE.MeshStandardMaterial({
      color: "#25272a",
      roughness: 0.5,
      metalness: 0.2,
    }),
  );
  gongCenter.rotation.x = Math.PI / 2;
  gongCenter.position.set(0, 1.18, 0.01);
  gong.add(gongCenter);

  const wheelGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 14);
  [-0.78, 0.78].forEach((x) => {
    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.05, 0.16),
      frameMaterial,
    );
    foot.position.set(x, 0.03, 0);
    gong.add(foot);

    [-0.08, 0.08].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeometry, frameMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.09, z);
      gong.add(wheel);
    });
  });

  enableShadows(gong);
  placePlanObject(gong, [centerX, PLAN_DEPTH - 0.34], 0, Math.PI, furnishingGroup);
  pushPlanRectCollider([centerX, PLAN_DEPTH - 0.34], 2.0, 0.32, 0, PLAYER_RADIUS * 0.04);

  const board = new THREE.Mesh(
    new THREE.BoxGeometry(2.35, 1.35, 0.04),
    new THREE.MeshStandardMaterial({
      color: "#111214",
      roughness: 0.9,
      metalness: 0.04,
    }),
  );
  const boardWorld = toWorldPoint([centerX + 2.75, p3WallZ]);
  board.position.set(boardWorld.x, 1.5, boardWorld.z);
  board.rotation.y = Math.PI;
  board.castShadow = true;
  board.receiveShadow = true;
  architectureGroup.add(board);

  const photoCols = 3;
  const photoRows = 9;
  const boardWidth = 2.35;
  const boardHeight = 1.35;
  const photoWidth = 0.11;
  const photoHeight = 0.11;
  const photoSpacingX = 0.135;
  const photoSpacingY = 0.11;
  const boardRightX = centerX + 2.75 + boardWidth / 2;
  const boardTopY = 1.5 + boardHeight / 2;
  const photoStartX = boardRightX - 0.18 - (photoWidth * photoCols + photoSpacingX * (photoCols - 1)) + photoWidth / 2;
  const photoTopY = boardTopY - 0.12 - photoHeight / 2;
  for (let col = 0; col < photoCols; col += 1) {
    for (let row = 0; row < photoRows; row += 1) {
      const photo = new THREE.Mesh(
        new THREE.BoxGeometry(photoWidth, photoHeight, 0.018),
        new THREE.MeshStandardMaterial({
          color: "#f3efe8",
          roughness: 0.9,
          metalness: 0.02,
        }),
      );
      const photoWorld = toWorldPoint([photoStartX + col * (photoWidth + photoSpacingX), p3WallZ]);
      photo.position.set(photoWorld.x, photoTopY - row * photoSpacingY, photoWorld.z - 0.028);
      photo.rotation.y = Math.PI;
      photo.castShadow = true;
      photo.receiveShadow = true;
      architectureGroup.add(photo);

      const imageInset = new THREE.Mesh(
        new THREE.PlaneGeometry(0.078, 0.06),
        new THREE.MeshStandardMaterial({
          color: row % 3 === 0 ? "#b9c2cc" : row % 3 === 1 ? "#8d7665" : "#6f8572",
          roughness: 0.94,
          metalness: 0.02,
        }),
      );
      imageInset.position.set(photoWorld.x, photoTopY - row * photoSpacingY + 0.01, photoWorld.z - 0.038);
      imageInset.rotation.y = Math.PI;
      architectureGroup.add(imageInset);
    }
  }

  const partialColX = photoStartX - (photoWidth + photoSpacingX);
  for (let row = 0; row < 4; row += 1) {
    const photo = new THREE.Mesh(
      new THREE.BoxGeometry(photoWidth, photoHeight, 0.018),
      new THREE.MeshStandardMaterial({
        color: "#f3efe8",
        roughness: 0.9,
        metalness: 0.02,
      }),
    );
    const photoWorld = toWorldPoint([partialColX, p3WallZ]);
    photo.position.set(photoWorld.x, photoTopY - row * photoSpacingY, photoWorld.z - 0.028);
    photo.rotation.y = Math.PI;
    photo.castShadow = true;
    photo.receiveShadow = true;
    architectureGroup.add(photo);

    const imageInset = new THREE.Mesh(
      new THREE.PlaneGeometry(0.078, 0.06),
      new THREE.MeshStandardMaterial({
        color: row % 2 === 0 ? "#9daab5" : "#7d695d",
        roughness: 0.94,
        metalness: 0.02,
      }),
    );
    imageInset.position.set(photoWorld.x, photoTopY - row * photoSpacingY + 0.01, photoWorld.z - 0.038);
    imageInset.rotation.y = Math.PI;
    architectureGroup.add(imageInset);
  }
}

function addP3aStorageShelf() {
  const westShift = 0.6;
  const shelfWidth = 2.28;
  const shelfDepth = 0.68;
  const shelfHeight = 2.34;
  const shelfCenter = [11.15 - westShift, HANGAR_GREENSCREEN_PROP_BASE_Z + 0.46];
  const shelfLevels = [0.06, 0.84, 1.58, 2.24];
  const postInset = 0.03;
  const shelfSideClearance = 0.04;
  const usableShelfWidth = shelfWidth - shelfSideClearance * 2;

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: "#fafcfd",
    roughness: 0.08,
    metalness: 1,
    emissive: "#98a1a9",
    emissiveIntensity: 0.14,
  });
  const wireMaterial = new THREE.MeshStandardMaterial({
    color: "#f6f8fa",
    roughness: 0.1,
    metalness: 1,
    emissive: "#8a9299",
    emissiveIntensity: 0.1,
  });
  const blackPlasticMaterial = new THREE.MeshStandardMaterial({
    color: "#171a1d",
    roughness: 0.9,
    metalness: 0.05,
  });
  const darkCaseMaterial = new THREE.MeshStandardMaterial({
    color: "#272b30",
    roughness: 0.78,
    metalness: 0.18,
  });
  const clearPlasticMaterial = new THREE.MeshStandardMaterial({
    color: "#dbe7ea",
    roughness: 0.16,
    metalness: 0.02,
    transparent: true,
    opacity: 0.34,
    transmission: 0.68,
    thickness: 0.02,
  });
  const whiteBinMaterial = new THREE.MeshStandardMaterial({
    color: "#d7d8d1",
    roughness: 0.86,
    metalness: 0.02,
  });
  const cardboardMaterial = new THREE.MeshStandardMaterial({
    color: "#b99469",
    roughness: 0.96,
    metalness: 0.02,
  });
  const labelMaterial = new THREE.MeshStandardMaterial({
    color: "#0e1012",
    roughness: 0.72,
    metalness: 0.08,
  });

  const addBox = (parent, size, position, material, rotation = 0) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.rotation.y = rotation;
    parent.add(mesh);
    return mesh;
  };

  const addCylinder = (parent, radius, height, position, material, axis = "y") => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 20), material);
    mesh.position.set(position[0], position[1], position[2]);
    if (axis === "x") {
      mesh.rotation.z = Math.PI / 2;
    } else if (axis === "z") {
      mesh.rotation.x = Math.PI / 2;
    }
    parent.add(mesh);
    return mesh;
  };

  const addShelfDeck = (targetShelf, y) => {
    addBox(targetShelf, [shelfWidth, 0.025, 0.022], [0, y, -shelfDepth / 2], chromeMaterial);
    addBox(targetShelf, [shelfWidth, 0.025, 0.022], [0, y, shelfDepth / 2], chromeMaterial);
    addBox(targetShelf, [0.022, 0.025, shelfDepth], [-shelfWidth / 2, y, 0], chromeMaterial);
    addBox(targetShelf, [0.022, 0.025, shelfDepth], [shelfWidth / 2, y, 0], chromeMaterial);
    for (let i = 0; i < 8; i += 1) {
      const z = -shelfDepth / 2 + 0.05 + i * ((shelfDepth - 0.1) / 7);
      addBox(targetShelf, [shelfWidth - 0.03, 0.008, 0.008], [0, y + 0.006, z], wireMaterial);
    }
  };

  const addMilkCrate = (parent, position, size, fillCount = 0) => {
    const crate = new THREE.Group();
    addBox(crate, [size[0], 0.03, size[2]], [0, size[1] - 0.015, 0], blackPlasticMaterial);
    addBox(crate, [size[0], 0.03, size[2]], [0, 0.015, 0], blackPlasticMaterial);
    addBox(crate, [0.03, size[1], size[2]], [-size[0] / 2 + 0.015, size[1] / 2, 0], blackPlasticMaterial);
    addBox(crate, [0.03, size[1], size[2]], [size[0] / 2 - 0.015, size[1] / 2, 0], blackPlasticMaterial);
    addBox(crate, [size[0], size[1], 0.03], [0, size[1] / 2, -size[2] / 2 + 0.015], blackPlasticMaterial);
    addBox(crate, [size[0], size[1], 0.03], [0, size[1] / 2, size[2] / 2 - 0.015], blackPlasticMaterial);

    for (let i = 0; i < fillCount; i += 1) {
      const cable = new THREE.Mesh(
        new THREE.TorusGeometry(0.045 + (i % 2) * 0.015, 0.008, 10, 16),
        new THREE.MeshStandardMaterial({
          color: i % 3 === 0 ? "#111315" : i % 3 === 1 ? "#202429" : "#3f454b",
          roughness: 0.76,
          metalness: 0.14,
        }),
      );
      cable.rotation.x = Math.PI / 2;
      cable.position.set(
        -size[0] * 0.22 + i * 0.07,
        0.08 + (i % 2) * 0.025,
        -size[2] * 0.14 + (i % 3) * 0.06,
      );
      crate.add(cable);
    }

    crate.position.set(position[0], position[1], position[2]);
    parent.add(crate);
  };

  const addSpeaker = (parent, position, scale = 1) => {
    const speaker = new THREE.Group();
    addBox(speaker, [0.18 * scale, 0.28 * scale, 0.18 * scale], [0, 0.14 * scale, 0], darkCaseMaterial);
    addCylinder(
      speaker,
      0.028 * scale,
      0.024 * scale,
      [0, 0.23 * scale, -0.092 * scale],
      new THREE.MeshStandardMaterial({
        color: "#0f1012",
        roughness: 0.42,
        metalness: 0.26,
      }),
      "z",
    );
    addCylinder(
      speaker,
      0.05 * scale,
      0.03 * scale,
      [0, 0.1 * scale, -0.09 * scale],
      new THREE.MeshStandardMaterial({
        color: "#101113",
        roughness: 0.38,
        metalness: 0.3,
      }),
      "z",
    );
    speaker.position.set(position[0], position[1], position[2]);
    parent.add(speaker);
  };

  const addUtilityBin = (parent, position, size, material, lid = false) => {
    const bin = new THREE.Group();
    addBox(bin, size, [0, size[1] / 2, 0], material);
    if (lid) {
      addBox(
        bin,
        [size[0] + 0.03, 0.03, size[2] + 0.03],
        [0, size[1] + 0.015, 0],
        new THREE.MeshStandardMaterial({
          color: material.color?.clone ? material.color : "#d2d4cf",
          roughness: 0.78,
          metalness: 0.02,
        }),
      );
    }
    addBox(bin, [size[0] * 0.34, 0.05, 0.02], [0, size[1] * 0.56, -size[2] / 2 - 0.011], labelMaterial);
    bin.position.set(position[0], position[1], position[2]);
    parent.add(bin);
  };

  const addSoftCase = (parent, position, size, accent = null) => {
    const softCase = new THREE.Group();
    addBox(softCase, size, [0, size[1] / 2, 0], darkCaseMaterial);
    addBox(softCase, [size[0] * 0.4, 0.02, size[2] * 0.12], [0, size[1] + 0.03, 0], darkCaseMaterial);
    if (accent) {
      addBox(
        softCase,
        [size[0] - 0.03, 0.03, 0.02],
        [0, size[1] * 0.64, -size[2] / 2 - 0.011],
        new THREE.MeshStandardMaterial({
          color: accent,
          roughness: 0.62,
          metalness: 0.08,
        }),
      );
    }
    softCase.position.set(position[0], position[1], position[2]);
    parent.add(softCase);
  };

  const addDrawerUnit = (parent, position, size, drawers = 3) => {
    const unit = new THREE.Group();
    addBox(unit, size, [0, size[1] / 2, 0], clearPlasticMaterial);
    for (let i = 1; i < drawers; i += 1) {
      addBox(
        unit,
        [size[0] - 0.02, 0.012, size[2] - 0.02],
        [0, (size[1] * i) / drawers, 0],
        new THREE.MeshStandardMaterial({
          color: "#c8d3d6",
          roughness: 0.18,
          metalness: 0.02,
          transparent: true,
          opacity: 0.42,
        }),
      );
    }
    for (let i = 0; i < drawers; i += 1) {
      addBox(unit, [size[0] * 0.34, 0.045, 0.018], [0, size[1] * (i + 0.5) / drawers, -size[2] / 2 - 0.01], labelMaterial);
    }
    unit.position.set(position[0], position[1], position[2]);
    parent.add(unit);
  };

  const addBookStack = (parent, position, count, axis = "x") => {
    const books = new THREE.Group();
    let offset = -((count - 1) * 0.032) / 2;
    for (let i = 0; i < count; i += 1) {
      const thickness = 0.024 + (i % 3) * 0.006;
      const height = 0.24 + (i % 4) * 0.035;
      const depth = 0.12;
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(axis === "x" ? thickness : depth, height, axis === "x" ? depth : thickness),
        new THREE.MeshStandardMaterial({
          color: ["#e0e2e6", "#d0d4d8", "#6a7a92", "#4c5664"][i % 4],
          roughness: 0.8,
          metalness: 0.04,
        }),
      );
      if (axis === "x") {
        book.position.set(offset, height / 2, 0);
      } else {
        book.position.set(0, height / 2, offset);
      }
      books.add(book);
      offset += thickness + 0.012;
    }
    books.position.set(position[0], position[1], position[2]);
    parent.add(books);
  };

  const layoutShelfRow = (widths, gap = 0.02) => {
    const totalWidth = widths.reduce((sum, width) => sum + width, 0) + gap * Math.max(0, widths.length - 1);
    if (totalWidth > usableShelfWidth + 0.0001) {
      throw new Error(`Shelf row width ${totalWidth.toFixed(3)} exceeds usable width ${usableShelfWidth.toFixed(3)}`);
    }
    let cursor = -totalWidth / 2;
    return widths.map((width) => {
      const center = cursor + width / 2;
      cursor += width + gap;
      return center;
    });
  };

  const buildShelfUnit = (center, variant = "primary") => {
    const shelf = new THREE.Group();

    [
      [-shelfWidth / 2 + postInset, -shelfDepth / 2 + postInset],
      [shelfWidth / 2 - postInset, -shelfDepth / 2 + postInset],
      [-shelfWidth / 2 + postInset, shelfDepth / 2 - postInset],
      [shelfWidth / 2 - postInset, shelfDepth / 2 - postInset],
    ].forEach(([x, z]) => {
      addBox(shelf, [0.03, shelfHeight, 0.03], [x, shelfHeight / 2, z], chromeMaterial);
    });

    shelfLevels.forEach((y) => addShelfDeck(shelf, y));

    if (variant === "primary") {
      const topShelfXs = layoutShelfRow([0.12, 0.16, 0.18, 0.18, 0.1, 0.06, 0.12, 0.12, 0.22, 0.26, 0.14], 0.02);
      addBookStack(shelf, [topShelfXs[0], shelfLevels[3] + 0.02, -0.02], 7, "z");
      addBox(shelf, [0.16, 0.42, 0.11], [topShelfXs[1], shelfLevels[3] + 0.21, -0.02], cardboardMaterial);
      addSpeaker(shelf, [topShelfXs[2], shelfLevels[3] + 0.01, -0.02], 1);
      addSpeaker(shelf, [topShelfXs[3], shelfLevels[3] + 0.01, -0.02], 1);
      addBox(shelf, [0.1, 0.09, 0.1], [topShelfXs[4], shelfLevels[3] + 0.045, 0.02], darkCaseMaterial);
      addCylinder(
        shelf,
        0.03,
        0.16,
        [topShelfXs[5], shelfLevels[3] + 0.08, 0],
        new THREE.MeshStandardMaterial({
          color: "#e8eaec",
          roughness: 0.46,
          metalness: 0.04,
        }),
      );
      addBox(
        shelf,
        [0.03, 0.03, 0.03],
        [topShelfXs[5], shelfLevels[3] + 0.15, -0.015],
        new THREE.MeshStandardMaterial({
          color: "#d44842",
          roughness: 0.48,
          metalness: 0.06,
        }),
      );
      addBox(shelf, [0.12, 0.05, 0.11], [topShelfXs[6], shelfLevels[3] + 0.025, 0.02], darkCaseMaterial);
      addBox(shelf, [0.12, 0.06, 0.1], [topShelfXs[7], shelfLevels[3] + 0.03, 0.02], darkCaseMaterial);
      addSoftCase(shelf, [topShelfXs[8], shelfLevels[3] + 0.01, 0.01], [0.22, 0.14, 0.16]);
      addSoftCase(shelf, [topShelfXs[9], shelfLevels[3] + 0.01, 0.02], [0.26, 0.11, 0.2]);
      addBox(shelf, [0.14, 0.08, 0.12], [topShelfXs[10], shelfLevels[3] + 0.04, 0.02], darkCaseMaterial);

      const middleFrontXs = layoutShelfRow([0.26, 0.24, 0.2, 0.22, 0.16, 0.16, 0.14], 0.03);
      addMilkCrate(shelf, [middleFrontXs[0], shelfLevels[2] + 0.02, -0.11], [0.26, 0.2, 0.24], 4);
      addMilkCrate(shelf, [middleFrontXs[1], shelfLevels[2] + 0.03, -0.1], [0.24, 0.18, 0.22], 3);
      addSoftCase(shelf, [middleFrontXs[2], shelfLevels[2] + 0.015, -0.1], [0.2, 0.15, 0.18]);
      addSoftCase(shelf, [middleFrontXs[3], shelfLevels[2] + 0.015, -0.1], [0.22, 0.15, 0.18], "#cf7340");
      addBox(shelf, [0.16, 0.12, 0.14], [middleFrontXs[4], shelfLevels[2] + 0.06, -0.1], darkCaseMaterial);
      addBox(shelf, [0.16, 0.1, 0.14], [middleFrontXs[5], shelfLevels[2] + 0.05, -0.1], darkCaseMaterial);
      addBox(shelf, [0.14, 0.1, 0.12], [middleFrontXs[6], shelfLevels[2] + 0.05, -0.1], darkCaseMaterial);

      const middleBackXs = layoutShelfRow([0.3, 0.22, 0.16, 0.18], 0.04);
      addDrawerUnit(shelf, [middleBackXs[0], shelfLevels[2] + 0.01, 0.13], [0.3, 0.2, 0.22], 3);
      addDrawerUnit(shelf, [middleBackXs[1], shelfLevels[2] + 0.01, 0.13], [0.22, 0.18, 0.18], 2);
      addBox(shelf, [0.16, 0.1, 0.14], [middleBackXs[2], shelfLevels[2] + 0.05, 0.13], darkCaseMaterial);
      addUtilityBin(shelf, [middleBackXs[3], shelfLevels[2] + 0.01, 0.13], [0.18, 0.16, 0.22], clearPlasticMaterial, true);

      const upperBackXs = layoutShelfRow([0.2, 0.2, 0.2, 0.2, 0.2, 0.18], 0.03);
      upperBackXs.forEach((x, index) => {
        addUtilityBin(shelf, [x, shelfLevels[1] + 0.01, 0.12], [0.2, 0.16, 0.24], whiteBinMaterial, index % 2 === 0);
      });

      const upperFrontWidths = [0.3, 0.26, 0.24, 0.18, 0.18, 0.14, 0.14, 0.16];
      const upperFrontXs = layoutShelfRow(upperFrontWidths, 0.02);
      upperFrontWidths.forEach((width, index) => {
        addUtilityBin(shelf, [upperFrontXs[index], shelfLevels[1] + 0.01, -0.1], [width, 0.22, 0.24], clearPlasticMaterial, true);
        if (index < 4) {
          addBox(shelf, [0.12, 0.06, 0.12], [upperFrontXs[index], shelfLevels[1] + 0.27, -0.1 + index * 0.03], darkCaseMaterial);
        }
      });

      const bottomBackXs = layoutShelfRow([0.34, 0.34, 0.34, 0.34, 0.22], 0.03);
      bottomBackXs.forEach((x) => {
        addUtilityBin(
          shelf,
          [x, shelfLevels[0] + 0.01, 0.11],
          [Math.abs(x) > 0.7 ? 0.22 : 0.34, 0.22, 0.27],
          clearPlasticMaterial,
          true,
        );
      });

      const bottomFrontXs = layoutShelfRow([0.34, 0.38, 0.32, 0.18, 0.18, 0.16], 0.03);
      addMilkCrate(shelf, [bottomFrontXs[0], shelfLevels[0] + 0.02, -0.12], [0.34, 0.18, 0.22], 2);
      addMilkCrate(shelf, [bottomFrontXs[1], shelfLevels[0] + 0.02, -0.12], [0.38, 0.18, 0.22], 3);
      addMilkCrate(shelf, [bottomFrontXs[2], shelfLevels[0] + 0.02, -0.12], [0.32, 0.18, 0.22], 2);
      addBox(shelf, [0.18, 0.12, 0.16], [bottomFrontXs[3], shelfLevels[0] + 0.06, -0.12], darkCaseMaterial);
      addBox(shelf, [0.18, 0.12, 0.16], [bottomFrontXs[4], shelfLevels[0] + 0.06, -0.12], darkCaseMaterial);
      addBox(shelf, [0.16, 0.1, 0.14], [bottomFrontXs[5], shelfLevels[0] + 0.05, -0.12], darkCaseMaterial);
    } else {
      const topShelfXs = layoutShelfRow([0.16, 0.12, 0.24, 0.18, 0.12, 0.12, 0.2, 0.16, 0.14, 0.16], 0.02);
      addBox(shelf, [0.16, 0.38, 0.1], [topShelfXs[0], shelfLevels[3] + 0.19, -0.02], cardboardMaterial);
      addBookStack(shelf, [topShelfXs[1], shelfLevels[3] + 0.02, -0.01], 5, "z");
      addSoftCase(shelf, [topShelfXs[2], shelfLevels[3] + 0.01, 0.01], [0.24, 0.14, 0.18], "#6b7a8e");
      addSpeaker(shelf, [topShelfXs[3], shelfLevels[3] + 0.01, -0.02], 0.9);
      addBox(shelf, [0.12, 0.08, 0.12], [topShelfXs[4], shelfLevels[3] + 0.04, 0.01], darkCaseMaterial);
      addBox(shelf, [0.12, 0.06, 0.1], [topShelfXs[5], shelfLevels[3] + 0.03, 0.01], darkCaseMaterial);
      addSoftCase(shelf, [topShelfXs[6], shelfLevels[3] + 0.01, 0.02], [0.2, 0.12, 0.16]);
      addBox(shelf, [0.16, 0.1, 0.14], [topShelfXs[7], shelfLevels[3] + 0.05, 0.01], darkCaseMaterial);
      addBox(shelf, [0.14, 0.08, 0.12], [topShelfXs[8], shelfLevels[3] + 0.04, 0.01], darkCaseMaterial);
      addBox(shelf, [0.16, 0.08, 0.12], [topShelfXs[9], shelfLevels[3] + 0.04, 0.01], darkCaseMaterial);

      const middleFrontXs = layoutShelfRow([0.22, 0.18, 0.24, 0.2, 0.2, 0.16, 0.14, 0.16], 0.02);
      addSoftCase(shelf, [middleFrontXs[0], shelfLevels[2] + 0.015, -0.1], [0.22, 0.14, 0.18], "#9f6a4a");
      addBox(shelf, [0.18, 0.1, 0.16], [middleFrontXs[1], shelfLevels[2] + 0.05, -0.1], darkCaseMaterial);
      addMilkCrate(shelf, [middleFrontXs[2], shelfLevels[2] + 0.02, -0.1], [0.24, 0.2, 0.22], 2);
      addSoftCase(shelf, [middleFrontXs[3], shelfLevels[2] + 0.015, -0.1], [0.2, 0.15, 0.18]);
      addBox(shelf, [0.2, 0.12, 0.16], [middleFrontXs[4], shelfLevels[2] + 0.06, -0.1], darkCaseMaterial);
      addBox(shelf, [0.16, 0.12, 0.14], [middleFrontXs[5], shelfLevels[2] + 0.06, -0.1], darkCaseMaterial);
      addBox(shelf, [0.14, 0.1, 0.12], [middleFrontXs[6], shelfLevels[2] + 0.05, -0.1], darkCaseMaterial);
      addBox(shelf, [0.16, 0.1, 0.14], [middleFrontXs[7], shelfLevels[2] + 0.05, -0.1], darkCaseMaterial);

      const middleBackXs = layoutShelfRow([0.26, 0.26, 0.22, 0.18, 0.16], 0.03);
      addDrawerUnit(shelf, [middleBackXs[0], shelfLevels[2] + 0.01, 0.13], [0.26, 0.18, 0.2], 2);
      addDrawerUnit(shelf, [middleBackXs[1], shelfLevels[2] + 0.01, 0.13], [0.26, 0.18, 0.2], 2);
      addUtilityBin(shelf, [middleBackXs[2], shelfLevels[2] + 0.01, 0.13], [0.22, 0.16, 0.22], clearPlasticMaterial, true);
      addUtilityBin(shelf, [middleBackXs[3], shelfLevels[2] + 0.01, 0.13], [0.18, 0.16, 0.22], whiteBinMaterial, true);
      addBox(shelf, [0.16, 0.1, 0.12], [middleBackXs[4], shelfLevels[2] + 0.05, 0.13], darkCaseMaterial);

      const upperBackXs = layoutShelfRow([0.22, 0.22, 0.22, 0.22, 0.18], 0.04);
      upperBackXs.forEach((x, index) => {
        addUtilityBin(shelf, [x, shelfLevels[1] + 0.01, 0.12], [0.22, 0.18, 0.24], index < 2 ? clearPlasticMaterial : whiteBinMaterial, true);
      });

      const upperFrontWidths = [0.22, 0.22, 0.2, 0.2, 0.18, 0.16, 0.14, 0.16];
      const upperFrontXs = layoutShelfRow(upperFrontWidths, 0.03);
      upperFrontWidths.forEach((width, index) => {
        addUtilityBin(shelf, [upperFrontXs[index], shelfLevels[1] + 0.01, -0.1], [width, 0.2, 0.24], clearPlasticMaterial, true);
      });

      const bottomBackWidths = [0.3, 0.3, 0.3, 0.3, 0.22, 0.18];
      const bottomBackXs = layoutShelfRow(bottomBackWidths, 0.02);
      bottomBackWidths.forEach((width, index) => {
        addUtilityBin(shelf, [bottomBackXs[index], shelfLevels[0] + 0.01, 0.11], [width, 0.2, 0.26], clearPlasticMaterial, true);
      });

      const bottomFrontXs = layoutShelfRow([0.28, 0.3, 0.28, 0.24, 0.18, 0.16, 0.14], 0.02);
      addMilkCrate(shelf, [bottomFrontXs[0], shelfLevels[0] + 0.02, -0.12], [0.28, 0.18, 0.22], 2);
      addMilkCrate(shelf, [bottomFrontXs[1], shelfLevels[0] + 0.02, -0.12], [0.3, 0.18, 0.22], 1);
      addMilkCrate(shelf, [bottomFrontXs[2], shelfLevels[0] + 0.02, -0.12], [0.28, 0.18, 0.22], 2);
      addSoftCase(shelf, [bottomFrontXs[3], shelfLevels[0] + 0.015, -0.12], [0.24, 0.14, 0.18]);
      addBox(shelf, [0.18, 0.12, 0.16], [bottomFrontXs[4], shelfLevels[0] + 0.06, -0.12], darkCaseMaterial);
      addBox(shelf, [0.16, 0.1, 0.14], [bottomFrontXs[5], shelfLevels[0] + 0.05, -0.12], darkCaseMaterial);
      addBox(shelf, [0.14, 0.1, 0.12], [bottomFrontXs[6], shelfLevels[0] + 0.05, -0.12], darkCaseMaterial);
    }

    enableShadows(shelf);
    placePlanObject(shelf, center, 0, 0, furnishingGroup);
    pushPlanRectCollider(center, shelfWidth, shelfDepth, 0, PLAYER_RADIUS * 0.08);
  };

  buildShelfUnit(shelfCenter, "primary");
  buildShelfUnit([shelfCenter[0] - 2.46, shelfCenter[1]], "secondary");

  addPlushSofa({
    center: [shelfCenter[0] - 6.5, HANGAR_GREENSCREEN_PROP_BASE_Z + 0.64],
    size: [3.4, 1.0],
    rotation: 0,
    seatCount: 5,
    color: "#b48863",
    seamColor: "#9c734f",
    footHeight: 0.18,
  });

  const westShelfCenterX = shelfCenter[0] - 2.46;
  const couchCenterX = shelfCenter[0] - 6.5;
  const speakerCenterX =
    ((couchCenterX + 3.4 / 2) + (westShelfCenterX - shelfWidth / 2)) / 2;
  const speaker = new THREE.Group();
  const speakerBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 1.22, 0.42),
    new THREE.MeshStandardMaterial({
      color: "#121315",
      roughness: 0.76,
      metalness: 0.14,
    }),
  );
  speakerBody.position.y = 0.61;
  speaker.add(speakerBody);

  const speakerGrille = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 1.08, 0.03),
    new THREE.MeshStandardMaterial({
      color: "#060708",
      roughness: 0.94,
      metalness: 0.04,
    }),
  );
  speakerGrille.position.set(0, 0.61, -0.205);
  speaker.add(speakerGrille);

  const horn = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.14, 0.02),
    new THREE.MeshStandardMaterial({
      color: "#0d0e10",
      roughness: 0.68,
      metalness: 0.12,
    }),
  );
  horn.position.set(0, 0.98, -0.225);
  speaker.add(horn);

  const woofer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.024, 24),
    new THREE.MeshStandardMaterial({
      color: "#0b0c0d",
      roughness: 0.58,
      metalness: 0.18,
    }),
  );
  woofer.rotation.x = Math.PI / 2;
  woofer.position.set(0, 0.48, -0.22);
  speaker.add(woofer);

  const badge = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.12, 0.01),
    new THREE.MeshStandardMaterial({
      color: "#f26a21",
      roughness: 0.42,
      metalness: 0.08,
    }),
  );
  badge.position.set(0.26, 0.14, -0.225);
  speaker.add(badge);

  [-0.24, 0.24].forEach((x) => {
    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.03, 0.14),
      new THREE.MeshStandardMaterial({
        color: "#161719",
        roughness: 0.64,
        metalness: 0.18,
      }),
    );
    foot.position.set(x, 0.015, 0);
    speaker.add(foot);
  });

  enableShadows(speaker);
  placePlanObject(speaker, [speakerCenterX, HANGAR_GREENSCREEN_PROP_BASE_Z + 0.28], 0, Math.PI, furnishingGroup);
  pushPlanRectCollider([speakerCenterX, HANGAR_GREENSCREEN_PROP_BASE_Z + 0.28], 0.72, 0.42, 0, PLAYER_RADIUS * 0.06);

  const studioLightFaceMaterial = new THREE.MeshStandardMaterial({
    color: "#f5f1dc",
    emissive: "#fff5c8",
    emissiveIntensity: 0.06,
    roughness: 0.22,
    metalness: 0.04,
  });
  const studioLightHousingMaterial = new THREE.MeshStandardMaterial({
    color: "#1c2024",
    roughness: 0.56,
    metalness: 0.16,
  });
  const cableMaterial = new THREE.MeshStandardMaterial({
    color: "#111214",
    roughness: 0.88,
    metalness: 0.04,
  });

  function addStudioLight(
    center,
    rotation,
    height = 1.9,
    headTilt = -0.45,
    aimTarget = null,
    aimY = 1.1,
    beamOptions = {},
  ) {
    const {
      intensity = 9,
      distance = 12,
      angle = 0.32,
      penumbra = 0.35,
      decay = 1.1,
    } = beamOptions;
    const stand = new THREE.Group();
    const baseRadius = 0.36;

    [0.15, Math.PI * 0.9, Math.PI * 1.72].forEach((angle) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.015, baseRadius, 10),
        chromeMaterial,
      );
      leg.rotation.z = Math.PI / 2;
      leg.rotation.y = angle;
      leg.position.set(Math.cos(angle) * 0.15, 0.045, Math.sin(angle) * 0.15);
      stand.add(leg);

      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.025, 0.035),
        new THREE.MeshStandardMaterial({
          color: "#151719",
          roughness: 0.7,
          metalness: 0.1,
        }),
      );
      foot.position.set(Math.cos(angle) * 0.31, 0.012, Math.sin(angle) * 0.31);
      foot.rotation.y = angle;
      stand.add(foot);
    });

    const baseHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.034, 0.08, 12),
      chromeMaterial,
    );
    baseHub.position.y = 0.04;
    stand.add(baseHub);

    const lowerPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.017, 0.017, 1.18, 12),
      chromeMaterial,
    );
    lowerPole.position.y = 0.63;
    stand.add(lowerPole);

    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.24, 12),
      blackPlasticMaterial,
    );
    grip.position.y = 0.62;
    stand.add(grip);

    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.14, 12),
      chromeMaterial,
    );
    sleeve.position.y = 1.23;
    stand.add(sleeve);

    const upperPoleHeight = Math.max(0.56, height - 1.22);
    const upperPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, upperPoleHeight, 12),
      chromeMaterial,
    );
    upperPole.position.y = 1.23 + upperPoleHeight / 2;
    stand.add(upperPole);

    const yoke = new THREE.Group();
    yoke.position.y = 1.23 + upperPoleHeight;
    yoke.rotation.x = headTilt;
    stand.add(yoke);

    const mount = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.13, 0.04),
      studioLightHousingMaterial,
    );
    mount.position.set(0, -0.04, 0.01);
    yoke.add(mount);

    const panel = new THREE.Group();
    const panelBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.22, 0.11),
      studioLightHousingMaterial,
    );
    panel.add(panelBody);

    const diffuser = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.15, 0.012),
      studioLightFaceMaterial,
    );
    diffuser.position.z = -0.058;
    panel.add(diffuser);

    const rearBattery = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.09, 0.05),
      blackPlasticMaterial,
    );
    rearBattery.position.set(0.02, -0.01, 0.07);
    panel.add(rearBattery);

    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.02, 0.02),
      chromeMaterial,
    );
    handle.position.set(0, 0.14, 0);
    panel.add(handle);

    const leftYokeArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.12, 0.02),
      chromeMaterial,
    );
    leftYokeArm.position.set(-0.12, 0, 0.01);
    panel.add(leftYokeArm);
    const rightYokeArm = leftYokeArm.clone();
    rightYokeArm.position.x = 0.12;
    panel.add(rightYokeArm);

    panel.position.set(0, 0.04, -0.02);
    yoke.add(panel);

    const beam = new THREE.SpotLight("#fff1c2", intensity, distance, angle, penumbra, decay);
    beam.position.set(0, 0.04, -0.08);
    beam.castShadow = false;
    panel.add(beam);

    const beamTarget = new THREE.Object3D();
    if (aimTarget) {
      furnishingGroup.add(beamTarget);
    } else {
      beamTarget.position.set(0, -0.9, -4.4);
      panel.add(beamTarget);
    }
    beam.target = beamTarget;

    const powerCable = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.12, 0.02, 0.06),
          new THREE.Vector3(0.18, -0.08, 0.14),
          new THREE.Vector3(0.08, -0.48, 0.05),
          new THREE.Vector3(0.12, -1.05, 0.18),
        ]),
        20,
        0.006,
        8,
        false,
      ),
      cableMaterial,
    );
    powerCable.position.y = 1.23 + upperPoleHeight;
    stand.add(powerCable);

    enableShadows(stand);
    placePlanObject(stand, center, 0, rotation, furnishingGroup);
    if (aimTarget) {
      const targetWorldPlan = toWorldPoint(aimTarget);
      const targetWorld = new THREE.Vector3(targetWorldPlan.x, aimY, targetWorldPlan.z);
      beamTarget.position.copy(targetWorld);

      const beamWorld = new THREE.Vector3();
      beam.getWorldPosition(beamWorld);
      beam.distance = beamWorld.distanceTo(targetWorld) + 1.2;
    }
    pushPlanRectCollider(center, 0.86, 0.86, 0, PLAYER_RADIUS * 0.02);
  }

  const hangarTrussConfig = {
    legHeight: 4.0,
    topHeight: 5.2,
    armReach: 2.2,
    trussWidth: 0.34,
    trussDepth: 0.28,
    tubeRadius: 0.045,
  };

  const hangarTrussMaterial = new THREE.MeshStandardMaterial({
    color: "#d9dde0",
    roughness: 0.18,
    metalness: 0.94,
    emissive: "#5f676d",
    emissiveIntensity: 0.08,
  });

  function addHangarTubeSegment(
    parent,
    start,
    end,
    radius = hangarTrussConfig.tubeRadius,
    material = hangarTrussMaterial,
  ) {
    const vector = new THREE.Vector3().subVectors(end, start);
    const length = vector.length();
    const segment = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, length, 10),
      material,
    );
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    segment.position.copy(midpoint);
    segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.normalize());
    parent.add(segment);
  }

  function addBoxTrussSpan(
    parent,
    startCenter,
    endCenter,
    startHalfWidth = 0.16,
    startHalfDepth = 0.11,
    endHalfWidth = 0.12,
    endHalfDepth = 0.085,
    radius = 0.018,
  ) {
    const forward = new THREE.Vector3().subVectors(endCenter, startCenter).normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();
    if (right.lengthSq() < 1e-5) {
      right.set(1, 0, 0);
    }
    const depth = new THREE.Vector3().crossVectors(forward, right).normalize();
    const makeCorners = (center, halfWidth, halfDepth) => [
      center.clone().addScaledVector(right, -halfWidth).addScaledVector(depth, -halfDepth),
      center.clone().addScaledVector(right, halfWidth).addScaledVector(depth, -halfDepth),
      center.clone().addScaledVector(right, halfWidth).addScaledVector(depth, halfDepth),
      center.clone().addScaledVector(right, -halfWidth).addScaledVector(depth, halfDepth),
    ];

    const startCorners = makeCorners(startCenter, startHalfWidth, startHalfDepth);
    const endCorners = makeCorners(endCenter, endHalfWidth, endHalfDepth);

    startCorners.forEach((corner, index) => {
      addHangarTubeSegment(parent, corner, startCorners[(index + 1) % startCorners.length], radius);
      addHangarTubeSegment(parent, corner, endCorners[index], radius);
      addHangarTubeSegment(parent, corner, endCorners[(index + 1) % endCorners.length], radius * 0.8);
    });

    endCorners.forEach((corner, index) => {
      addHangarTubeSegment(parent, corner, endCorners[(index + 1) % endCorners.length], radius * 0.95);
    });

    addHangarTubeSegment(parent, startCorners[0], startCorners[2], radius * 0.75);
    addHangarTubeSegment(parent, startCorners[1], startCorners[3], radius * 0.75);
    addHangarTubeSegment(parent, endCorners[0], endCorners[2], radius * 0.75);
    addHangarTubeSegment(parent, endCorners[1], endCorners[3], radius * 0.75);
  }

  function addHangarCenterStructure(center, trussPlacements) {
    const structure = new THREE.Group();
    const centerWorld = toWorldPoint(center);
    const hubY = 5.0;
    const hubDepth = 0.34;
    const hubRadius = 3.55;
    const upperRingY = hubY + hubDepth / 2;
    const lowerRingY = hubY - hubDepth / 2;
    const centerRingMaterial = new THREE.MeshStandardMaterial({
      color: "#efe7cf",
      emissive: "#fff4cf",
      emissiveIntensity: 0.78,
      roughness: 0.24,
      metalness: 0.18,
    });
    const centerShellMaterial = new THREE.MeshStandardMaterial({
      color: "#22262a",
      emissive: "#4d4a3d",
      emissiveIntensity: 0.22,
      roughness: 0.78,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const centerDiffuserMaterial = new THREE.MeshStandardMaterial({
      color: "#f6f0de",
      emissive: "#fff6d8",
      emissiveIntensity: 1.15,
      roughness: 0.16,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });

    [upperRingY, lowerRingY].forEach((y) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(hubRadius, 0.05, 10, 64),
        centerRingMaterial,
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      structure.add(ring);
    });

    const sideShell = new THREE.Mesh(
      new THREE.CylinderGeometry(hubRadius + 0.2, hubRadius + 0.26, hubDepth, 48, 1, true),
      centerShellMaterial,
    );
    sideShell.position.y = hubY;
    structure.add(sideShell);

    const diffuser = new THREE.Mesh(
      new THREE.CircleGeometry(hubRadius - 0.18, 48),
      centerDiffuserMaterial,
    );
    diffuser.rotation.x = -Math.PI / 2;
    diffuser.position.y = lowerRingY + 0.012;
    structure.add(diffuser);

    const ringBraceCount = 24;
    for (let i = 0; i < ringBraceCount; i += 1) {
      const angle0 = (Math.PI * 2 * i) / ringBraceCount;
      const angle1 = (Math.PI * 2 * (i + 1)) / ringBraceCount;
      const x0 = Math.cos(angle0) * hubRadius;
      const z0 = Math.sin(angle0) * hubRadius;
      const x1 = Math.cos(angle1) * hubRadius;
      const z1 = Math.sin(angle1) * hubRadius;
      addHangarTubeSegment(
        structure,
        new THREE.Vector3(x0, upperRingY, z0),
        new THREE.Vector3(x0, lowerRingY, z0),
        0.018,
      );
      addHangarTubeSegment(
        structure,
        new THREE.Vector3(x0, upperRingY, z0),
        new THREE.Vector3(x1, lowerRingY, z1),
        0.014,
      );
    }

    const motorPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.09, 0.28),
      new THREE.MeshStandardMaterial({
        color: "#d3d7db",
        roughness: 0.28,
        metalness: 0.7,
      }),
    );
    const cableTopY = Math.max(upperRingY + 0.82, hangarInnerHeightAtWorldX(centerWorld.x) - 0.22);
    motorPlate.position.set(0, cableTopY - 0.12, 0);
    structure.add(motorPlate);

    [
      [-0.24, -0.08],
      [0.24, -0.08],
      [-0.24, 0.08],
      [0.24, 0.08],
    ].forEach(([x, z]) => {
      addHangarTubeSegment(
        structure,
        new THREE.Vector3(x, cableTopY, z),
        new THREE.Vector3(x, upperRingY + 0.03, z),
        0.01,
        chromeMaterial,
      );
    });

    trussPlacements.forEach(({ center: archCenter, rotation }) => {
      const archWorld = toWorldPoint(archCenter);
      const tipCenter = new THREE.Vector3(0, hangarTrussConfig.topHeight - 0.08, -hangarTrussConfig.armReach);
      tipCenter.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
      tipCenter.x += archWorld.x - centerWorld.x;
      tipCenter.z += archWorld.z - centerWorld.z;

      const radial = new THREE.Vector3(tipCenter.x, 0, tipCenter.z).normalize();
      const ringAnchor = new THREE.Vector3(radial.x * (hubRadius + 0.04), hubY + 0.02, radial.z * (hubRadius + 0.04));
      const lowerAnchor = new THREE.Vector3(radial.x * (hubRadius - 0.36), lowerRingY + 0.02, radial.z * (hubRadius - 0.36));

      addBoxTrussSpan(structure, tipCenter, ringAnchor);
      addHangarTubeSegment(structure, ringAnchor, lowerAnchor, 0.016);
    });

    const tableSpotlight = new THREE.SpotLight("#fff2cf", 56, 13.5, 0.86, 0.52, 1.4);
    tableSpotlight.position.set(0, lowerRingY + 0.14, 0);
    tableSpotlight.castShadow = false;
    structure.add(tableSpotlight);

    const tableLightTarget = new THREE.Object3D();
    tableLightTarget.position.set(0, 0.96, 0);
    structure.add(tableLightTarget);
    tableSpotlight.target = tableLightTarget;

    enableShadows(structure);
    placePlanObject(structure, center, 0, 0, furnishingGroup);
  }

  function addTrussArch(center, rotation = 0) {
    const arch = new THREE.Group();
    const {
      legHeight,
      topHeight,
      armReach,
      trussWidth,
      trussDepth,
      tubeRadius,
    } = hangarTrussConfig;

    const xOffsets = [-trussWidth / 2, trussWidth / 2];
    const zOffsets = [-trussDepth / 2, trussDepth / 2];

    xOffsets.forEach((xOffset) => {
      zOffsets.forEach((zOffset) => {
        addHangarTubeSegment(
          arch,
          new THREE.Vector3(xOffset, 0, zOffset),
          new THREE.Vector3(xOffset, legHeight, zOffset),
        );
      });
    });

    zOffsets.forEach((zOffset) => {
      for (let i = 0; i < 6; i += 1) {
        const y0 = i * (legHeight / 6);
        const y1 = (i + 1) * (legHeight / 6);
        addHangarTubeSegment(
          arch,
          new THREE.Vector3(-trussWidth / 2, y0, zOffset),
          new THREE.Vector3(trussWidth / 2, y1, zOffset),
          0.026,
        );
        addHangarTubeSegment(
          arch,
          new THREE.Vector3(trussWidth / 2, y0, zOffset),
          new THREE.Vector3(-trussWidth / 2, y1, zOffset),
          0.026,
        );
      }
    });

    xOffsets.forEach((xOffset) => {
      for (let i = 0; i <= 6; i += 1) {
        const y = i * (legHeight / 6);
        addHangarTubeSegment(
          arch,
          new THREE.Vector3(xOffset, y, -trussDepth / 2),
          new THREE.Vector3(xOffset, y, trussDepth / 2),
          0.024,
        );
      }
    });

    zOffsets.forEach((zOffset) => {
      xOffsets.forEach((xOffset) => {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(xOffset, legHeight, zOffset),
          new THREE.Vector3(xOffset, topHeight - 0.5, -armReach * 0.22 + zOffset * 0.8),
          new THREE.Vector3(xOffset, topHeight, -armReach * 0.62 + zOffset * 0.45),
          new THREE.Vector3(xOffset, topHeight - 0.1, -armReach + zOffset * 0.25),
        ]);
        const rail = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 28, tubeRadius, 10, false),
          hangarTrussMaterial,
        );
        arch.add(rail);
      });
    });

    for (let i = 0; i <= 7; i += 1) {
      const t = i / 7;
      const leftFront = new THREE.Vector3(
        -trussWidth / 2,
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, legHeight, -trussDepth / 2),
          new THREE.Vector3(0, topHeight - 0.5, -armReach * 0.22 - trussDepth / 2 * 0.8),
          new THREE.Vector3(0, topHeight, -armReach * 0.62 - trussDepth / 2 * 0.45),
          new THREE.Vector3(0, topHeight - 0.1, -armReach - trussDepth / 2 * 0.25),
        ]).getPoint(t).y,
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, legHeight, -trussDepth / 2),
          new THREE.Vector3(0, topHeight - 0.5, -armReach * 0.22 - trussDepth / 2 * 0.8),
          new THREE.Vector3(0, topHeight, -armReach * 0.62 - trussDepth / 2 * 0.45),
          new THREE.Vector3(0, topHeight - 0.1, -armReach - trussDepth / 2 * 0.25),
        ]).getPoint(t).z,
      );
      const leftBack = new THREE.Vector3(
        -trussWidth / 2,
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, legHeight, trussDepth / 2),
          new THREE.Vector3(0, topHeight - 0.5, -armReach * 0.22 + trussDepth / 2 * 0.8),
          new THREE.Vector3(0, topHeight, -armReach * 0.62 + trussDepth / 2 * 0.45),
          new THREE.Vector3(0, topHeight - 0.1, -armReach + trussDepth / 2 * 0.25),
        ]).getPoint(t).y,
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, legHeight, trussDepth / 2),
          new THREE.Vector3(0, topHeight - 0.5, -armReach * 0.22 + trussDepth / 2 * 0.8),
          new THREE.Vector3(0, topHeight, -armReach * 0.62 + trussDepth / 2 * 0.45),
          new THREE.Vector3(0, topHeight - 0.1, -armReach + trussDepth / 2 * 0.25),
        ]).getPoint(t).z,
      );
      const rightFront = leftFront.clone();
      rightFront.x = trussWidth / 2;
      const rightBack = leftBack.clone();
      rightBack.x = trussWidth / 2;

      addHangarTubeSegment(arch, leftFront, rightFront, 0.024);
      addHangarTubeSegment(arch, leftBack, rightBack, 0.024);
      addHangarTubeSegment(arch, leftFront, leftBack, 0.022);
      addHangarTubeSegment(arch, rightFront, rightBack, 0.022);
      if (i < 7) {
        addHangarTubeSegment(arch, leftFront, rightBack, 0.02);
        addHangarTubeSegment(arch, leftBack, rightFront, 0.02);
      }
    }

    const basePlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16),
      hangarTrussMaterial,
    );
    basePlate.position.set(0, 0.015, 0);
    arch.add(basePlate);

    enableShadows(arch);
    placePlanObject(arch, center, 0, rotation, furnishingGroup);
    pushPlanRectCollider(center, 0.9, 0.9, rotation, PLAYER_RADIUS * 0.02);
  }

  function addTrussBarLight(planCenter, targetPlanCenter, height = 4.2) {
    const bar = new THREE.Group();
    const barLength = 1.0;
    const barHousingMaterial = new THREE.MeshStandardMaterial({
      color: "#15181b",
      roughness: 0.72,
      metalness: 0.18,
    });
    const barDiffuserMaterial = new THREE.MeshStandardMaterial({
      color: "#f7f7f2",
      emissive: "#ffffff",
      emissiveIntensity: 1.2,
      roughness: 0.18,
      metalness: 0.08,
    });
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(barLength, 0.12, 0.12),
      barHousingMaterial,
    );
    bar.add(housing);
    const diffuser = new THREE.Mesh(
      new THREE.BoxGeometry(barLength - 0.16, 0.04, 0.06),
      barDiffuserMaterial,
    );
    diffuser.position.y = -0.03;
    bar.add(diffuser);
    const spot = new THREE.SpotLight("#fff8e8", 12, 8, 0.62, 0.55, 1.5);
    spot.position.set(0, -0.05, 0);
    spot.castShadow = false;
    bar.add(spot);
    const targetObj = new THREE.Object3D();
    targetObj.position.set(0, 0.96 - height, 4);
    bar.add(targetObj);
    spot.target = targetObj;
    const rotation = Math.atan2(
      targetPlanCenter[0] - planCenter[0],
      targetPlanCenter[1] - planCenter[1],
    );
    enableShadows(bar);
    placePlanObject(bar, planCenter, height, rotation, furnishingGroup);
    setLayerRecursive(bar, HANGAR_LIGHTING_LAYER);
  }

  function addTrussHangingLightRod(planCenter, rodLength = 1.2, rodHeight = 4.0, dropHeight = 0.4, rotation = 0, rightShorten = 0, targetPlanCenter = null) {
    const rod = new THREE.Group();
    const rodRadius = 0.04;
    const effectiveLength = rodLength - rightShorten;
    const rodOffsetZ = rightShorten / 2;
    const rodMaterial = new THREE.MeshStandardMaterial({
      color: "#f7f7f2",
      emissive: "#ffffff",
      emissiveIntensity: 1.0,
      roughness: 0.2,
      metalness: 0.05,
    });
    const rodMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(rodRadius, rodRadius, effectiveLength, 12),
      rodMaterial,
    );
    rodMesh.rotation.x = Math.PI / 2;
    rodMesh.position.z = -rodOffsetZ;
    rod.add(rodMesh);
    const cableMaterial = new THREE.MeshStandardMaterial({
      color: "#1a1d21",
      roughness: 0.9,
      metalness: 0.1,
    });
    const leftEnd = -effectiveLength / 2 + 0.15 - rodOffsetZ;
    const rightEnd = effectiveLength / 2 - 0.15 - rodOffsetZ;
    [leftEnd, (leftEnd + rightEnd) / 2, rightEnd].forEach((z) => {
      const cable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, dropHeight, 6),
        cableMaterial,
      );
      cable.position.set(0, dropHeight / 2, z);
      rod.add(cable);
    });
    const rodY = rodHeight - dropHeight;
    const spot = new THREE.SpotLight("#fff8e8", 14, 6, 0.5, 0.4, 1.2);
    spot.position.set(0, 0, 0);
    rod.add(spot);
    if (targetPlanCenter) {
      const targetObj = new THREE.Object3D();
      const targetWorld = toWorldPoint(targetPlanCenter);
      targetObj.position.set(targetWorld.x, 1.0, targetWorld.z);
      furnishingGroup.add(targetObj);
      spot.target = targetObj;
    } else {
      const targetObj = new THREE.Object3D();
      targetObj.position.set(0, -0.8, 2);
      rod.add(targetObj);
      spot.target = targetObj;
    }
    enableShadows(rod);
    placePlanObject(rod, planCenter, rodY, rotation, furnishingGroup);
    setLayerRecursive(rod, HANGAR_LIGHTING_LAYER);
  }

  const rigDiffuserMaterial = new THREE.MeshStandardMaterial({
    color: "#f3efe0",
    emissive: "#fff7db",
    emissiveIntensity: 0.08,
    roughness: 0.2,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const softboxShellMaterial = new THREE.MeshStandardMaterial({
    color: "#111315",
    roughness: 0.88,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });
  const tripodLegMaterial = new THREE.MeshStandardMaterial({
    color: "#171a1d",
    roughness: 0.8,
    metalness: 0.1,
  });
  const cameraBodyMaterial = new THREE.MeshStandardMaterial({
    color: "#151719",
    roughness: 0.62,
    metalness: 0.12,
  });
  const cameraAccentMaterial = new THREE.MeshStandardMaterial({
    color: "#2d3137",
    roughness: 0.48,
    metalness: 0.18,
  });

  function addCameraTripodRig(center, rotation, heightScale = 1, cleanMode = false, options = {}) {
    const {
      proRig = false,
      headYOffset = 0,
    } = options;
    const rig = new THREE.Group();
    const tripodBulkScale = proRig ? 1.32 : 1;
    const cameraBulkScale = proRig ? 1.36 : 1;
    const centerColumnHeight = 1.42 * heightScale;
    const upperColumnHeight = 0.38 * heightScale;
    const headY = 1.68 * heightScale + headYOffset;
    const clampY = 0.82 * heightScale;
    const legPivotY = 1.06 * heightScale;
    const upperLegLength = 0.92 * heightScale;
    const lowerLegLength = 0.82 * heightScale;

    const centerColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.022 * tripodBulkScale,
        0.022 * tripodBulkScale,
        centerColumnHeight,
        12,
      ),
      tripodLegMaterial,
    );
    centerColumn.position.y = centerColumnHeight / 2;
    rig.add(centerColumn);

    const upperColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.015 * tripodBulkScale,
        0.015 * tripodBulkScale,
        upperColumnHeight,
        12,
      ),
      cameraAccentMaterial,
    );
    upperColumn.position.y = centerColumnHeight + upperColumnHeight / 2 - 0.13 * heightScale;
    rig.add(upperColumn);

    const columnClamp = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.08 * tripodBulkScale,
        0.06 * tripodBulkScale,
        0.05 * tripodBulkScale,
      ),
      cameraAccentMaterial,
    );
    columnClamp.position.set(0, clampY, 0);
    rig.add(columnClamp);

    [0.12, Math.PI * 0.82, Math.PI * 1.6].forEach((angle, index) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(0, legPivotY, 0);
      legPivot.rotation.y = angle;
      legPivot.rotation.z = cleanMode
        ? index === 0 ? 0.18 : index === 1 ? 0.2 : -0.19
        : index === 0 ? 0.23 : index === 1 ? 0.28 : -0.26;
      rig.add(legPivot);

      const upperLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.015 * tripodBulkScale,
          0.013 * tripodBulkScale,
          upperLegLength,
          10,
        ),
        tripodLegMaterial,
      );
      upperLeg.position.y = -upperLegLength / 2;
      legPivot.add(upperLeg);

      const lowerLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.011 * tripodBulkScale,
          0.009 * tripodBulkScale,
          lowerLegLength,
          10,
        ),
        tripodLegMaterial,
      );
      lowerLeg.position.y = -upperLegLength - lowerLegLength / 2;
      legPivot.add(lowerLeg);

      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.02 * tripodBulkScale,
          0.03 * tripodBulkScale,
          0.08 * tripodBulkScale,
        ),
        blackPlasticMaterial,
      );
      foot.position.y = -upperLegLength - lowerLegLength - 0.01;
      legPivot.add(foot);
    });

    if (!cleanMode || proRig) {
      [Math.PI / 6, Math.PI * 0.84, Math.PI * 1.52].forEach((angle) => {
        const spreader = new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.007 * tripodBulkScale,
            0.007 * tripodBulkScale,
            0.56 * (proRig ? 1.02 : 1),
            8,
          ),
          tripodLegMaterial,
        );
        spreader.rotation.z = Math.PI / 2;
        spreader.rotation.y = angle;
        spreader.position.set(
          Math.cos(angle) * 0.16 * (proRig ? 1.04 : 1),
          0.78 * heightScale,
          Math.sin(angle) * 0.16 * (proRig ? 1.04 : 1),
        );
        rig.add(spreader);
      });
    }

    const head = new THREE.Group();
    head.position.y = headY;
    rig.add(head);

    const panHead = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.12 * tripodBulkScale * (proRig ? 1.18 : 1),
        0.08 * tripodBulkScale * (proRig ? 1.08 : 1),
        0.1 * tripodBulkScale * (proRig ? 1.16 : 1),
      ),
      cameraAccentMaterial,
    );
    head.add(panHead);

    if (!cleanMode || proRig) {
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.008 * tripodBulkScale,
          0.008 * tripodBulkScale,
          0.34 * (proRig ? 0.9 : 1),
          8,
        ),
        tripodLegMaterial,
      );
      handle.rotation.z = Math.PI / 2;
      handle.position.set(
        0.18 * (proRig ? 0.92 : 1),
        -0.04,
        0.012,
      );
      head.add(handle);
    }

    const camera = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.22 * cameraBulkScale,
        0.16 * cameraBulkScale,
        0.14 * cameraBulkScale,
      ),
      cameraBodyMaterial,
    );
    camera.add(body);

    const topHousing = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.14 * cameraBulkScale,
        0.05 * cameraBulkScale,
        0.08 * cameraBulkScale,
      ),
      cameraAccentMaterial,
    );
    topHousing.position.set(0.01, 0.1 * cameraBulkScale, -0.01);
    camera.add(topHousing);

    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.052 * cameraBulkScale,
        0.042 * cameraBulkScale,
        0.16 * cameraBulkScale * (proRig ? 1.2 : 1),
        18,
      ),
      new THREE.MeshStandardMaterial({
        color: "#0d0f11",
        roughness: 0.42,
        metalness: 0.22,
      }),
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 0, -0.14 * cameraBulkScale * (proRig ? 1.12 : 1));
    camera.add(lens);

    const lensRing = new THREE.Mesh(
      new THREE.TorusGeometry(
        0.054 * cameraBulkScale,
        0.008 * cameraBulkScale,
        8,
        18,
      ),
      cameraAccentMaterial,
    );
    lensRing.position.set(0, 0, -0.22 * cameraBulkScale * (proRig ? 1.12 : 1));
    camera.add(lensRing);

    if (proRig) {
      const matteBox = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.16 * cameraBulkScale,
          0.14 * cameraBulkScale,
          0.05 * cameraBulkScale,
        ),
        cameraAccentMaterial,
      );
      matteBox.position.set(0, 0, -0.31 * cameraBulkScale);
      camera.add(matteBox);

      const rearBattery = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.08 * cameraBulkScale,
          0.13 * cameraBulkScale,
          0.09 * cameraBulkScale,
        ),
        cameraAccentMaterial,
      );
      rearBattery.position.set(0, 0.01, 0.12 * cameraBulkScale);
      camera.add(rearBattery);

      const topHandle = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.16 * cameraBulkScale,
          0.03 * cameraBulkScale,
          0.08 * cameraBulkScale,
        ),
        cameraAccentMaterial,
      );
      topHandle.position.set(0.02, 0.16 * cameraBulkScale, -0.01);
      camera.add(topHandle);
    }

    const monitor = new THREE.Mesh(
      new THREE.BoxGeometry(
        0.11 * cameraBulkScale * (proRig ? 1.18 : 1),
        0.07 * cameraBulkScale * (proRig ? 1.12 : 1),
        0.012 * cameraBulkScale,
      ),
      new THREE.MeshStandardMaterial({
        color: "#a8d4ff",
        emissive: "#6ea1d8",
        emissiveIntensity: 0.18,
        roughness: 0.22,
        metalness: 0.04,
      }),
    );
    monitor.position.set(
      proRig ? 0.16 : 0.05,
      0.14 * cameraBulkScale,
      proRig ? 0.03 : 0.02,
    );
    monitor.rotation.x = -0.18;
    monitor.rotation.z = proRig ? -0.14 : 0;
    camera.add(monitor);

    camera.position.set(0, 0.08 * (proRig ? 0.8 : 1), -0.02);
    head.add(camera);

    if (!cleanMode && !proRig) {
      const cameraCable = new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.08, headY + 0.04, -0.04),
            new THREE.Vector3(0.12, 1.44 * heightScale, 0.02),
            new THREE.Vector3(0.02, 1.08 * heightScale, -0.02),
            new THREE.Vector3(0.0, 0.06, 0.18),
          ]),
          22,
          0.005 * (proRig ? 1.2 : 1),
          8,
          false,
        ),
        cableMaterial,
      );
      rig.add(cameraCable);
    }

    enableShadows(rig);
    placePlanObject(rig, center, 0, rotation, furnishingGroup);
    pushPlanRectCollider(center, 1.1, 1.1, 0, PLAYER_RADIUS * 0.02);
  }

  function addSoftboxRig(center, rotation, aimTarget = null, aimY = 1.2, beamOptions = {}) {
    const {
      intensity = 0,
      distance = 11,
      angle = 0.68,
      penumbra = 0.45,
      decay = 1.1,
      effectIntensity = 0,
      effectDistance = 13.5,
      effectAngle = 0.86,
      effectPenumbra = 0.52,
      effectDecay = 1.4,
    } = beamOptions;
    const rig = new THREE.Group();
    const baseRadius = 0.46;
    const diffuserMaterial = intensity > 0
      ? rigDiffuserMaterial.clone()
      : rigDiffuserMaterial;
    if (intensity > 0 || effectIntensity > 0) {
      diffuserMaterial.emissiveIntensity = effectIntensity > 0 ? 0.92 : 0.72;
    }

    [0.2, Math.PI * 0.94, Math.PI * 1.7].forEach((angle) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.019, baseRadius, 10),
        chromeMaterial,
      );
      leg.rotation.z = Math.PI / 2;
      leg.rotation.y = angle;
      leg.position.set(Math.cos(angle) * 0.18, 0.055, Math.sin(angle) * 0.18);
      rig.add(leg);
    });

    const baseHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.04, 0.1, 12),
      chromeMaterial,
    );
    baseHub.position.y = 0.05;
    rig.add(baseHub);

    const lowerPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.021, 0.021, 1.52, 12),
      chromeMaterial,
    );
    lowerPole.position.y = 0.81;
    rig.add(lowerPole);

    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.038, 0.28, 12),
      blackPlasticMaterial,
    );
    grip.position.y = 0.82;
    rig.add(grip);

    const upperPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.92, 12),
      chromeMaterial,
    );
    upperPole.position.y = 1.86;
    rig.add(upperPole);

    const head = new THREE.Group();
    head.position.set(0, 2.32, 0);
    head.rotation.x = -0.36;
    rig.add(head);

    const lampBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.09, 0.24, 16),
      studioLightHousingMaterial,
    );
    lampBody.rotation.x = Math.PI / 2;
    lampBody.position.set(0, 0.02, 0.08);
    head.add(lampBody);

    const yokeArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.24, 0.04),
      chromeMaterial,
    );
    yokeArm.position.set(0, -0.04, 0.08);
    head.add(yokeArm);

    const softboxShell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.46, 0.42, 12, 1, true),
      softboxShellMaterial,
    );
    softboxShell.rotation.x = Math.PI / 2;
    softboxShell.position.set(0, 0.02, -0.16);
    head.add(softboxShell);

    const diffuser = new THREE.Mesh(
      new THREE.CircleGeometry(0.47, 20),
      diffuserMaterial,
    );
    diffuser.position.set(0, 0.02, -0.37);
    head.add(diffuser);

    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      const rib = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.42, 6),
        chromeMaterial,
      );
      rib.rotation.z = Math.PI / 2;
      rib.rotation.y = angle;
      rib.position.set(Math.cos(angle) * 0.13, Math.sin(angle) * 0.13 * 0.16, -0.16);
      head.add(rib);
    }

    const beam = new THREE.SpotLight("#fff1d4", intensity, distance, angle, penumbra, decay);
    beam.position.set(0, 0.02, -0.37);
    beam.castShadow = false;
    head.add(beam);

    let effectBeam = null;
    if (effectIntensity > 0) {
      effectBeam = new THREE.SpotLight(
        "#fff2cf",
        effectIntensity,
        effectDistance,
        effectAngle,
        effectPenumbra,
        effectDecay,
      );
      effectBeam.position.set(0, 0.02, -0.37);
      effectBeam.castShadow = false;
      head.add(effectBeam);
    }

    const beamTarget = new THREE.Object3D();
    if (aimTarget) {
      furnishingGroup.add(beamTarget);
    } else {
      beamTarget.position.set(0, -0.4, -4.6);
      head.add(beamTarget);
    }
    beam.target = beamTarget;
    if (effectBeam) {
      effectBeam.target = beamTarget;
    }

    const powerCable = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.1, 2.26, 0.04),
          new THREE.Vector3(0.16, 1.76, 0.08),
          new THREE.Vector3(0.06, 0.82, 0.02),
          new THREE.Vector3(0.18, 0.04, 0.22),
        ]),
        22,
        0.006,
        8,
        false,
      ),
      cableMaterial,
    );
    rig.add(powerCable);

    enableShadows(rig);
    placePlanObject(rig, center, 0, rotation, furnishingGroup);
    if (aimTarget) {
      const targetWorldPlan = toWorldPoint(aimTarget);
      const targetWorld = new THREE.Vector3(targetWorldPlan.x, aimY, targetWorldPlan.z);
      beamTarget.position.copy(targetWorld);
      const beamWorld = new THREE.Vector3();
      beam.getWorldPosition(beamWorld);
      beam.distance = beamWorld.distanceTo(targetWorld) + 1.2;
      if (effectBeam) {
        effectBeam.distance = beamWorld.distanceTo(targetWorld) + 1.8;
      }
    }
    pushPlanRectCollider(center, 1.18, 1.18, 0, PLAYER_RADIUS * 0.02);
  }

  function addStandingTable(center, rotation = 0, width = 3.35) {
    const table = new THREE.Group();
    const tableWidth = width;
    const tableDepth = 1.0;
    const tableHeight = 1.0;
    const topThickness = 0.06;
    const legWidth = 0.09;
    const legDepth = 0.2;
    const legHeight = tableHeight - topThickness;
    const slabMaterial = new THREE.MeshStandardMaterial({
      color: "#f4f4f1",
      roughness: 0.82,
      metalness: 0.02,
    });
    const topSurfaceMaterial = new THREE.MeshStandardMaterial({
      color: "#141618",
      roughness: 0.74,
      metalness: 0.06,
    });
    const legMaterial = new THREE.MeshStandardMaterial({
      color: "#222629",
      roughness: 0.82,
      metalness: 0.08,
    });

    const topSurface = new THREE.Mesh(
      new THREE.BoxGeometry(tableWidth, topThickness, tableDepth),
      topSurfaceMaterial,
    );
    topSurface.position.y = tableHeight - topThickness / 2 - 0.01;
    table.add(topSurface);

    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(tableWidth - 0.04, 0.008, tableDepth - 0.04),
      slabMaterial,
    );
    slab.position.y = tableHeight + 0.004;
    table.add(slab);

    [-tableWidth / 2 + legWidth / 2 + 0.08, tableWidth / 2 - legWidth / 2 - 0.08].forEach((x) => {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(legWidth, legHeight, legDepth),
        legMaterial,
      );
      leg.position.set(x, legHeight / 2, 0);
      table.add(leg);

      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(legWidth + 0.08, 0.03, legDepth + 0.08),
        legMaterial,
      );
      foot.position.set(x, 0.015, 0);
      table.add(foot);
    });

    enableShadows(table);
    placePlanObject(table, center, 0, rotation, furnishingGroup);
    pushPlanRectCollider(center, tableWidth, tableDepth, rotation, PLAYER_RADIUS * 0.04);
  }

  function addCenterStageRoundTable(center, diameter = 4.2) {
    const table = new THREE.Group();
    const radius = diameter / 2;
    const tableHeight = 0.96;
    const topThickness = 0.3;
    const baseHeight = tableHeight - topThickness;
    const baseRadius = 0.86;

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: "#32363b",
      roughness: 0.76,
      metalness: 0.18,
    });
    const topMaterial = new THREE.MeshStandardMaterial({
      color: "#3b4046",
      roughness: 0.74,
      metalness: 0.14,
    });

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(baseRadius, baseRadius, baseHeight, 28),
      baseMaterial,
    );
    base.position.y = baseHeight / 2;
    table.add(base);

    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, topThickness, 48),
      topMaterial,
    );
    top.position.y = baseHeight + topThickness / 2;
    table.add(top);

    const tableSurfaceY = tableHeight;
    const propBlackMaterial = new THREE.MeshStandardMaterial({
      color: "#14171a",
      roughness: 0.72,
      metalness: 0.1,
    });
    const propMetalMaterial = new THREE.MeshStandardMaterial({
      color: "#bfc5cb",
      roughness: 0.34,
      metalness: 0.74,
    });
    const paperMaterial = new THREE.MeshStandardMaterial({
      color: "#f0ede5",
      roughness: 0.94,
      metalness: 0.02,
    });
    const trayMaterial = new THREE.MeshStandardMaterial({
      color: "#1b1e22",
      roughness: 0.78,
      metalness: 0.08,
    });

    const ringPosition = (angleDeg, radiusScale = 0.62) => {
      const angle = THREE.MathUtils.degToRad(angleDeg);
      const ringRadius = radius * radiusScale;
      return [Math.cos(angle) * ringRadius, Math.sin(angle) * ringRadius];
    };
    const faceCenterRotation = (position, extra = 0) =>
      Math.atan2(-position[0], -position[1]) + extra;
    const restOnTableSurface = (object) => {
      object.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(object);
      object.position.y += tableSurfaceY - bounds.min.y;
    };
    const placeTableProp = (object, position, rotationY = 0) => {
      object.position.set(position[0], 0, position[1]);
      object.rotation.y = rotationY;
      restOnTableSurface(object);
      table.add(object);
    };

    const addPaperSheet = (position, size, rotationY = 0, tint = "#f0ede5") => {
      const sheet = new THREE.Mesh(
        new THREE.BoxGeometry(size[0], 0.008, size[1]),
        new THREE.MeshStandardMaterial({
          color: tint,
          roughness: 0.94,
          metalness: 0.02,
        }),
      );
      placeTableProp(sheet, position, rotationY);
    };

    const addCan = (position, bodyColor, accentColor = "#d5d8dc", rotationY = 0) => {
      const can = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.22, 18),
        new THREE.MeshStandardMaterial({
          color: bodyColor,
          roughness: 0.4,
          metalness: 0.18,
        }),
      );
      can.add(body);
      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.012, 18),
        propMetalMaterial,
      );
      lid.position.y = 0.116;
      can.add(lid);
      const stripe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.071, 0.071, 0.038, 18, 1, true),
        new THREE.MeshStandardMaterial({
          color: accentColor,
          roughness: 0.52,
          metalness: 0.08,
        }),
      );
      stripe.position.y = -0.02;
      can.add(stripe);
      placeTableProp(can, position, rotationY);
    };

    const centerTray = new THREE.Mesh(
      new THREE.BoxGeometry(0.74, 0.04, 0.34),
      trayMaterial,
    );
    const trayPos = ringPosition(300, 0.34);
    placeTableProp(centerTray, trayPos);

    const mascot = new THREE.Group();
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.34, 0.46),
      new THREE.MeshStandardMaterial({
        color: "#d6c088",
        roughness: 0.86,
        metalness: 0.02,
      }),
    );
    mascot.add(head);
    const leftEye = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.04),
      new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.82 }),
    );
    leftEye.position.set(-0.1, 0.02, -0.24);
    mascot.add(leftEye);
    const rightEye = leftEye.clone();
    rightEye.position.x = 0.1;
    mascot.add(rightEye);
    const leftPupil = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, 0.05),
      propBlackMaterial,
    );
    leftPupil.position.set(-0.1, 0.01, -0.265);
    mascot.add(leftPupil);
    const rightPupil = leftPupil.clone();
    rightPupil.position.x = 0.1;
    mascot.add(rightPupil);
    const beak = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.05, 0.06),
      new THREE.MeshStandardMaterial({
        color: "#d47f3d",
        roughness: 0.76,
        metalness: 0.04,
      }),
    );
    beak.position.set(0, -0.08, -0.25);
    mascot.add(beak);
    const sideDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.03, 18),
      new THREE.MeshStandardMaterial({
        color: "#f0d548",
        roughness: 0.64,
        metalness: 0.04,
      }),
    );
    sideDisc.rotation.z = Math.PI / 2;
    sideDisc.position.set(0.24, 0.02, 0);
    mascot.add(sideDisc);
    placeTableProp(mascot, [0, 0], 0);

    const controlDeck = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.05, 0.22),
      trayMaterial,
    );
    const controlDeckPos = ringPosition(340, 0.56);
    placeTableProp(controlDeck, controlDeckPos, faceCenterRotation(controlDeckPos, -0.12));

    const tablet = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.018, 0.28),
      new THREE.MeshStandardMaterial({
        color: "#15181c",
        roughness: 0.36,
        metalness: 0.08,
      }),
    );
    const tabletPos = ringPosition(18, 0.6);
    placeTableProp(tablet, tabletPos, faceCenterRotation(tabletPos, 0.08));

    const phone = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.012, 0.16),
      propBlackMaterial,
    );
    const phonePos = ringPosition(64, 0.54);
    placeTableProp(phone, phonePos, faceCenterRotation(phonePos, 0.18));

    [
      { angle: 108, color: "#7b1d2e", accent: "#f0f0ef", rotation: 0.08 },
      { angle: 138, color: "#8db33f", accent: "#ece9d9", rotation: -0.12 },
      { angle: 168, color: "#a72b39", accent: "#efe6e6", rotation: 0.04 },
      { angle: 198, color: "#a72b39", accent: "#efe6e6", rotation: -0.02 },
      { angle: 28, color: "#b4b7bc", accent: "#d94949", rotation: 0.1 },
    ].forEach(({ angle, color, accent, rotation }) => {
      addCan(ringPosition(angle, 0.76), color, accent, rotation);
    });

    addPaperSheet(ringPosition(352, 0.72), [0.7, 0.42], faceCenterRotation(ringPosition(352, 0.72), 0.12));
    addPaperSheet(ringPosition(36, 0.7), [0.56, 0.34], faceCenterRotation(ringPosition(36, 0.7), -0.08));
    addPaperSheet(ringPosition(252, 0.7), [0.46, 0.28], faceCenterRotation(ringPosition(252, 0.7), -0.02));
    addPaperSheet(ringPosition(286, 0.5), [0.34, 0.24], faceCenterRotation(ringPosition(286, 0.5), 0.14));
    addPaperSheet(ringPosition(78, 0.68), [0.3, 0.22], faceCenterRotation(ringPosition(78, 0.68), -0.16), "#e7d1ab");

    const woodenMallet = new THREE.Group();
    const malletHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 18, 14),
      new THREE.MeshStandardMaterial({
        color: "#d9d5cf",
        roughness: 0.9,
        metalness: 0.02,
      }),
    );
    malletHead.scale.set(1, 1, 0.9);
    woodenMallet.add(malletHead);
    const malletHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.68, 12),
      new THREE.MeshStandardMaterial({
        color: "#b2865b",
        roughness: 0.72,
        metalness: 0.02,
      }),
    );
    malletHandle.rotation.z = Math.PI / 2 - 0.16;
    malletHandle.position.set(0.34, -0.02, 0.06);
    woodenMallet.add(malletHandle);
    const malletPos = ringPosition(154, 0.64);
    placeTableProp(woodenMallet, malletPos, faceCenterRotation(malletPos, -0.42));

    enableShadows(table);
    placePlanObject(table, center, 0, 0, furnishingGroup);
    pushPlanCircularCollider(center, radius, PLAYER_RADIUS * 0.03, 9);
  }

  function addStudioTableMicrophone(tableCenter, chairCenter, tableRadius = 2.1, tableHeight = 0.96) {
    const deltaX = chairCenter[0] - tableCenter[0];
    const deltaZ = chairCenter[1] - tableCenter[1];
    const chairDistance = Math.hypot(deltaX, deltaZ);

    if (chairDistance < 0.001) {
      return;
    }

    const directionX = deltaX / chairDistance;
    const directionZ = deltaZ / chairDistance;
    const micDistanceFromCenter = Math.max(0.46, tableRadius - 0.52);
    const micCenter = [
      tableCenter[0] + directionX * micDistanceFromCenter,
      tableCenter[1] + directionZ * micDistanceFromCenter,
    ];
    const micRotation = Math.atan2(directionX, directionZ);

    const microphone = new THREE.Group();
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: "#171a1d",
      roughness: 0.74,
      metalness: 0.3,
    });
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: "#b8c0c6",
      roughness: 0.34,
      metalness: 0.86,
    });
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: "#252a2f",
      roughness: 0.46,
      metalness: 0.56,
    });
    const grilleMaterial = new THREE.MeshStandardMaterial({
      color: "#d7dde2",
      roughness: 0.24,
      metalness: 0.9,
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: "#c24b4b",
      roughness: 0.44,
      metalness: 0.22,
    });

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.18, 0.035, 24),
      baseMaterial,
    );
    base.position.y = 0.0175;
    microphone.add(base);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.02, 0.26, 18),
      metalMaterial,
    );
    stem.position.y = 0.165;
    microphone.add(stem);

    const pivot = new THREE.Mesh(
      new THREE.SphereGeometry(0.034, 18, 12),
      metalMaterial,
    );
    pivot.position.y = 0.3;
    microphone.add(pivot);

    const boom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.2, 16),
      metalMaterial,
    );
    boom.rotation.x = Math.PI / 2 - 0.22;
    boom.position.set(0, 0.33, 0.095);
    microphone.add(boom);

    const shockMount = new THREE.Mesh(
      new THREE.TorusGeometry(0.052, 0.008, 10, 22),
      metalMaterial,
    );
    shockMount.rotation.x = Math.PI / 2 - 0.22;
    shockMount.position.set(0, 0.35, 0.19);
    microphone.add(shockMount);

    const microphoneBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.045, 0.18, 6, 12),
      bodyMaterial,
    );
    microphoneBody.rotation.x = Math.PI / 2 - 0.22;
    microphoneBody.position.set(0, 0.35, 0.2);
    microphone.add(microphoneBody);

    const grille = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 18, 14),
      grilleMaterial,
    );
    grille.scale.set(0.92, 1, 1.08);
    grille.position.set(0, 0.374, 0.3);
    microphone.add(grille);

    const accentBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.038, 0.006, 10, 20),
      accentMaterial,
    );
    accentBand.rotation.x = Math.PI / 2;
    accentBand.position.set(0, 0.35, 0.17);
    microphone.add(accentBand);

    enableShadows(microphone);
    placePlanObject(microphone, micCenter, tableHeight + 0.002, micRotation, furnishingGroup);
  }

  function addDoubleLayerDesk(center, rotation = 0, width = 3.55) {
    const desk = new THREE.Group();
    const deskWidth = width;
    const deskDepth = 1.34;
    const deskHeight = 0.8;
    const topThickness = 0.055;
    const shelfWidth = deskWidth - 0.16;
    const shelfDepth = 0.3;
    const shelfHeight = 1.16;
    const shelfThickness = 0.05;
    const columnWidth = 0.15;
    const columnDepth = 0.2;
    const columnInset = 0.24;
    const shelfCenterZ = -deskDepth / 2 + shelfDepth / 2 + 0.04;
    const riserFrontZ = shelfCenterZ + shelfDepth / 2 - 0.06;
    const riserBackZ = shelfCenterZ - shelfDepth / 2 + 0.06;

    const topMaterial = new THREE.MeshStandardMaterial({
      color: "#111214",
      roughness: 0.66,
      metalness: 0.08,
    });
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: "#23272b",
      roughness: 0.76,
      metalness: 0.14,
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: "#090a0c",
      roughness: 0.56,
      metalness: 0.1,
    });

    const mainTop = new THREE.Mesh(
      new THREE.BoxGeometry(deskWidth, topThickness, deskDepth),
      topMaterial,
    );
    mainTop.position.y = deskHeight - topThickness / 2;
    desk.add(mainTop);

    const lowerApron = new THREE.Mesh(
      new THREE.BoxGeometry(deskWidth - 0.22, 0.06, 0.16),
      accentMaterial,
    );
    lowerApron.position.set(0, deskHeight - 0.16, -deskDepth / 2 + 0.14);
    desk.add(lowerApron);

    [-1, 1].forEach((side) => {
      const column = new THREE.Mesh(
        new THREE.BoxGeometry(columnWidth, deskHeight - topThickness, columnDepth),
        frameMaterial,
      );
      column.position.set(
        side * (deskWidth / 2 - columnInset),
        (deskHeight - topThickness) / 2,
        0,
      );
      desk.add(column);

      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(columnWidth + 0.06, 0.032, deskDepth - 0.18),
        frameMaterial,
      );
      foot.position.set(side * (deskWidth / 2 - columnInset), 0.016, 0);
      desk.add(foot);
    });

    [
      [-shelfWidth / 2 + 0.14, riserBackZ],
      [shelfWidth / 2 - 0.14, riserBackZ],
      [-shelfWidth / 2 + 0.14, riserFrontZ],
      [shelfWidth / 2 - 0.14, riserFrontZ],
    ].forEach(([x, z]) => {
      const riser = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, shelfHeight - deskHeight - shelfThickness / 2, 0.08),
        frameMaterial,
      );
      riser.position.set(x, deskHeight + (shelfHeight - deskHeight - shelfThickness / 2) / 2, z);
      desk.add(riser);
    });

    const topShelf = new THREE.Mesh(
      new THREE.BoxGeometry(shelfWidth, shelfThickness, shelfDepth),
      topMaterial,
    );
    topShelf.position.set(0, shelfHeight, shelfCenterZ);
    desk.add(topShelf);

    const shelfBrace = new THREE.Mesh(
      new THREE.BoxGeometry(shelfWidth - 0.26, 0.05, 0.08),
      accentMaterial,
    );
    shelfBrace.position.set(0, shelfHeight - 0.11, shelfCenterZ + 0.02);
    desk.add(shelfBrace);

    const cableTray = new THREE.Mesh(
      new THREE.BoxGeometry(deskWidth * 0.44, 0.045, 0.18),
      accentMaterial,
    );
    cableTray.position.set(0, deskHeight - 0.08, 0.29);
    desk.add(cableTray);

    enableShadows(desk);
    placePlanObject(desk, center, 0, rotation, furnishingGroup);
    pushPlanRectCollider(center, deskWidth, deskDepth, rotation, PLAYER_RADIUS * 0.08);
  }

  function addSingleLayerDesk(center, rotation = 0, width = 3.55, height = 0.64) {
    const desk = new THREE.Group();
    const deskWidth = width;
    const deskDepth = 1.18;
    const deskHeight = height;
    const topThickness = 0.055;
    const columnWidth = 0.15;
    const columnDepth = 0.2;
    const columnInset = 0.24;

    const topMaterial = new THREE.MeshStandardMaterial({
      color: "#111214",
      roughness: 0.66,
      metalness: 0.08,
    });
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: "#23272b",
      roughness: 0.76,
      metalness: 0.14,
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: "#090a0c",
      roughness: 0.56,
      metalness: 0.1,
    });

    const mainTop = new THREE.Mesh(
      new THREE.BoxGeometry(deskWidth, topThickness, deskDepth),
      topMaterial,
    );
    mainTop.position.y = deskHeight - topThickness / 2;
    desk.add(mainTop);

    const lowerApron = new THREE.Mesh(
      new THREE.BoxGeometry(deskWidth - 0.22, 0.06, 0.16),
      accentMaterial,
    );
    lowerApron.position.set(0, deskHeight - 0.15, -deskDepth / 2 + 0.14);
    desk.add(lowerApron);

    const cableTray = new THREE.Mesh(
      new THREE.BoxGeometry(deskWidth * 0.44, 0.045, 0.18),
      accentMaterial,
    );
    cableTray.position.set(0, deskHeight - 0.08, 0.29);
    desk.add(cableTray);

    [-1, 1].forEach((side) => {
      const column = new THREE.Mesh(
        new THREE.BoxGeometry(columnWidth, deskHeight - topThickness, columnDepth),
        frameMaterial,
      );
      column.position.set(
        side * (deskWidth / 2 - columnInset),
        (deskHeight - topThickness) / 2,
        0,
      );
      desk.add(column);

      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(columnWidth + 0.06, 0.032, deskDepth - 0.18),
        frameMaterial,
      );
      foot.position.set(side * (deskWidth / 2 - columnInset), 0.016, 0);
      desk.add(foot);
    });

    enableShadows(desk);
    placePlanObject(desk, center, 0, rotation, furnishingGroup);
    pushPlanRectCollider(center, deskWidth, deskDepth, rotation, PLAYER_RADIUS * 0.08);
  }

  function addHangarSlimShelf(center, rotation = 0, {
    width = 2.4,
    depth = 0.34,
    height = 0.76,
    cameraAimTarget = null,
  } = {}) {
    const shelf = new THREE.Group();
    const footRadius = 0.058;
    const legVisibleHeight = 0.1;
    const bodyHeight = height - legVisibleHeight - footRadius * 2;
    const legRadius = 0.045;
    const legInsetX = 0.15;
    const legInsetZ = 0.09;
    const legHeight = legVisibleHeight;
    const shelfMaterial = new THREE.MeshStandardMaterial({
      color: "#050607",
      roughness: 0.4,
      metalness: 0.18,
    });
    const legMaterial = new THREE.MeshStandardMaterial({
      color: "#070809",
      roughness: 0.48,
      metalness: 0.32,
    });

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(width, bodyHeight, depth),
      shelfMaterial,
    );
    body.position.y = footRadius * 2 + legHeight + bodyHeight / 2;
    shelf.add(body);

    const shelfTopY = footRadius * 2 + legHeight + bodyHeight;

    [
      [-width / 2 + legInsetX, -depth / 2 + legInsetZ],
      [width / 2 - legInsetX, -depth / 2 + legInsetZ],
      [-width / 2 + legInsetX, depth / 2 - legInsetZ],
      [width / 2 - legInsetX, depth / 2 - legInsetZ],
    ].forEach(([x, z]) => {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(legRadius, legRadius * 0.9, legHeight, 18),
        legMaterial,
      );
      leg.position.set(x, legHeight / 2 + 0.055, z);
      shelf.add(leg);

      const foot = new THREE.Mesh(
        new THREE.SphereGeometry(footRadius, 16, 12),
        legMaterial,
      );
      foot.position.set(x, footRadius, z);
      shelf.add(foot);
    });

    const cameraMount = new THREE.Group();
    const mountBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.095, 0.04, 16),
      cameraAccentMaterial,
    );
    mountBase.position.y = shelfTopY + 0.02;
    cameraMount.add(mountBase);

    const mountStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.11, 12),
      tripodLegMaterial,
    );
    mountStem.position.y = shelfTopY + 0.095;
    cameraMount.add(mountStem);

    const cameraHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.06, 0.12),
      cameraAccentMaterial,
    );
    cameraHead.position.y = shelfTopY + 0.17;
    cameraMount.add(cameraHead);

    const cameraProp = new THREE.Group();
    const cameraBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.24, 0.26),
      cameraBodyMaterial,
    );
    cameraProp.add(cameraBody);

    const topHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.09, 0.16),
      cameraAccentMaterial,
    );
    topHousing.position.set(0.05, 0.15, -0.02);
    cameraProp.add(topHousing);

    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.068, 0.3, 18),
      new THREE.MeshStandardMaterial({
        color: "#0d0f11",
        roughness: 0.42,
        metalness: 0.24,
      }),
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 0, -0.26);
    cameraProp.add(lens);

    const matteBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.18, 0.05),
      cameraAccentMaterial,
    );
    matteBox.position.set(0, 0, -0.43);
    cameraProp.add(matteBox);

    const rearBattery = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.16, 0.11),
      cameraAccentMaterial,
    );
    rearBattery.position.set(0, 0.015, 0.19);
    cameraProp.add(rearBattery);

    const sideMonitor = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.11, 0.016),
      new THREE.MeshStandardMaterial({
        color: "#98cfff",
        emissive: "#6ea1d8",
        emissiveIntensity: 0.18,
        roughness: 0.2,
        metalness: 0.04,
      }),
    );
    sideMonitor.position.set(0.2, 0.14, 0.03);
    sideMonitor.rotation.z = -0.16;
    cameraProp.add(sideMonitor);

    const topHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.04, 0.12),
      cameraAccentMaterial,
    );
    topHandle.position.set(0.03, 0.2, -0.01);
    cameraProp.add(topHandle);

    cameraProp.position.y = shelfTopY + 0.31;
    cameraMount.add(cameraProp);

    if (cameraAimTarget) {
      const dx = cameraAimTarget[0] - center[0];
      const dz = cameraAimTarget[1] - center[1];
      const targetLocalX = dx * Math.cos(rotation) + dz * Math.sin(rotation);
      const targetLocalZ = -dx * Math.sin(rotation) + dz * Math.cos(rotation);
      const slideAmplitude = Math.min(0.58, width / 2 - 0.42);
      cameraMount.rotation.y = Math.atan2(-targetLocalX, -targetLocalZ);
      slidingShelfCameras.push({
        object: cameraMount,
        targetLocalX,
        targetLocalZ,
        slideAmplitude,
        speed: 0.55,
        phase: 0,
      });
    }

    shelf.add(cameraMount);

    enableShadows(shelf);
    placePlanObject(shelf, center, 0, rotation, furnishingGroup);
    pushPlanRectCollider(center, width, depth, rotation, PLAYER_RADIUS * 0.04);
  }

  function addCableProtectorTrack(center, rotation = 0, {
    length = 1.82,
    width = 0.19,
    height = 0.058,
    yOffset = 0.022,
  } = {}) {
    const track = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: "#111315",
      roughness: 0.84,
      metalness: 0.1,
    });
    const lidMaterial = new THREE.MeshStandardMaterial({
      color: "#1a1d20",
      roughness: 0.76,
      metalness: 0.1,
    });
    const rampWidth = width * 0.3;
    const shoulderWidth = width * 0.14;
    const lidWidth = width - rampWidth * 2 - shoulderWidth * 2;
    const shoulderHeight = height * 0.72;
    const lidHeight = height * 0.96;

    [
      { x: -width / 2 + rampWidth / 2, y: height * 0.28, segmentWidth: rampWidth, segmentHeight: height * 0.56 },
      { x: -width / 2 + rampWidth + shoulderWidth / 2, y: shoulderHeight / 2, segmentWidth: shoulderWidth, segmentHeight: shoulderHeight },
      { x: 0, y: lidHeight / 2, segmentWidth: lidWidth, segmentHeight: lidHeight },
      { x: width / 2 - rampWidth - shoulderWidth / 2, y: shoulderHeight / 2, segmentWidth: shoulderWidth, segmentHeight: shoulderHeight },
      { x: width / 2 - rampWidth / 2, y: height * 0.28, segmentWidth: rampWidth, segmentHeight: height * 0.56 },
    ].forEach(({ x, y, segmentWidth, segmentHeight }) => {
      const segment = new THREE.Mesh(
        new THREE.BoxGeometry(segmentWidth, segmentHeight, length),
        Math.abs(x) < 0.001 ? lidMaterial : bodyMaterial,
      );
      segment.position.set(x, y, 0);
      track.add(segment);
    });

    enableShadows(track);
    placePlanObject(track, center, yOffset, rotation, furnishingGroup);
  }

  function createMessyCableRunMaterials() {
    return [
      cableMaterial,
      new THREE.MeshStandardMaterial({
        color: "#6b2c1d",
        roughness: 0.74,
        metalness: 0.06,
      }),
      new THREE.MeshStandardMaterial({
        color: "#3d4f64",
        roughness: 0.78,
        metalness: 0.05,
      }),
      new THREE.MeshStandardMaterial({
        color: "#596137",
        roughness: 0.8,
        metalness: 0.04,
      }),
    ];
  }

  function getMessyCableRunVariants(width) {
    return [
      { x: -width * 0.28, radius: 0.012, phase: 0.1, lift: 0.0015 },
      { x: -width * 0.08, radius: 0.01, phase: 1.2, lift: 0.003 },
      { x: width * 0.1, radius: 0.011, phase: 2.1, lift: 0.002 },
      { x: width * 0.3, radius: 0.009, phase: 2.9, lift: 0.004 },
    ];
  }

  function rotatePlanOffset(center, localX, localZ, rotation) {
    return [
      center[0] + localX * Math.cos(rotation) - localZ * Math.sin(rotation),
      center[1] + localX * Math.sin(rotation) + localZ * Math.cos(rotation),
    ];
  }

  function getMessyCableEndpoint(center, rotation, {
    length,
    width,
  }, cableIndex, endpoint = "end") {
    const variants = getMessyCableRunVariants(width);
    const { x, phase } = variants[cableIndex];
    const t = endpoint === "start" ? 0 : 1;
    const localZ = -length / 2 + t * length;
    const wave = Math.sin(t * Math.PI * 4 + phase) * 0.018;
    const drift = Math.cos(t * Math.PI * 2.6 + cableIndex * 0.7) * 0.014;
    return rotatePlanOffset(center, x + wave + drift, localZ, rotation);
  }

  function addMessyFloorCableRun(center, rotation = 0, {
    length = 8.8,
    width = 0.22,
    yOffset = 0.022,
  } = {}) {
    const cableRun = new THREE.Group();
    const cableRunMaterials = createMessyCableRunMaterials();

    getMessyCableRunVariants(width).forEach(({ x, radius, phase }, cableIndex) => {
      const points = [];
      const segmentCount = 11;
      for (let i = 0; i <= segmentCount; i += 1) {
        const t = i / segmentCount;
        const localZ = -length / 2 + t * length;
        const wave = Math.sin(t * Math.PI * 4 + phase) * 0.018;
        const drift = Math.cos(t * Math.PI * 2.6 + cableIndex * 0.7) * 0.014;
        points.push(
          new THREE.Vector3(
            x + wave + drift,
            0.004 + (cableIndex % 2) * 0.002 + Math.sin(t * Math.PI * 6 + phase) * 0.0015,
            localZ,
          ),
        );
      }

      const cable = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 28, radius, 8, false),
        cableRunMaterials[cableIndex % cableRunMaterials.length],
      );
      cableRun.add(cable);
    });

    enableShadows(cableRun);
    placePlanObject(cableRun, center, yOffset, rotation, furnishingGroup);
  }

  function addCurvedFloorCableConnection(points, {
    yOffset = 0.018,
    lateralSpread = 0.08,
    startAnchors = null,
    endAnchors = null,
  } = {}) {
    const cableRun = new THREE.Group();
    const cableRunMaterials = createMessyCableRunMaterials();

    getMessyCableRunVariants(lateralSpread).forEach(({ x, radius, lift }, cableIndex) => {
      const shiftedPoints = points.map(([pointX, pointZ], pointIndex) => {
        const wobble = Math.sin(pointIndex * 1.4 + cableIndex) * 0.014;
        return new THREE.Vector3(
          pointX + x + wobble,
          0.0035 + lift + (pointIndex % 2 === 0 ? 0.001 : -0.0004),
          pointZ + Math.cos(pointIndex * 1.1 + cableIndex * 0.8) * 0.01,
        );
      });
      if (startAnchors) {
        shiftedPoints[0].x = startAnchors[cableIndex][0];
        shiftedPoints[0].z = startAnchors[cableIndex][1];
      }
      if (endAnchors) {
        shiftedPoints[shiftedPoints.length - 1].x = endAnchors[cableIndex][0];
        shiftedPoints[shiftedPoints.length - 1].z = endAnchors[cableIndex][1];
      }

      const cable = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(shiftedPoints), 36, radius, 8, false),
        cableRunMaterials[cableIndex % cableRunMaterials.length],
      );
      cableRun.add(cable);
    });

    enableShadows(cableRun);
    placePlanObject(cableRun, [0, 0], yOffset, 0, furnishingGroup);
  }

  function addDeskLaptopAt(point, rotation = 0, {
    deskHeight = 0.64,
  } = {}) {
    const laptop = new THREE.Group();
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: "#8c9299",
      roughness: 0.44,
      metalness: 0.58,
    });
    const screenMaterial = new THREE.MeshStandardMaterial({
      color: "#111317",
      emissive: "#0a0d11",
      emissiveIntensity: 0.2,
      roughness: 0.28,
      metalness: 0.1,
    });

    const laptopBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.018, 0.3),
      bodyMaterial,
    );
    laptopBase.position.y = deskHeight + 0.012;
    laptop.add(laptopBase);

    const laptopScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.26, 0.016),
      screenMaterial,
    );
    laptopScreen.position.set(0, deskHeight + 0.14, -0.1);
    laptopScreen.rotation.x = -1.95;
    laptop.add(laptopScreen);

    enableShadows(laptop);
    placePlanObject(laptop, point, 0, rotation, furnishingGroup);
  }

  function createDeskCornerMonitor(frameColor = "#111317") {
    const monitorTexture = new THREE.TextureLoader().load(
      new URL("./sqquoiasunrise.jpg", import.meta.url).href,
    );
    monitorTexture.colorSpace = THREE.SRGBColorSpace;

    const monitor = new THREE.Group();
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: frameColor,
      roughness: 0.68,
      metalness: 0.08,
    });
    const panelMaterial = new THREE.MeshBasicMaterial({
      map: monitorTexture,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const monitorWidth = 1.2;
    const monitorHeight = 0.7;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(monitorWidth, monitorHeight, 0.04),
      frameMaterial,
    );
    monitor.add(frame);

    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(monitorWidth - 0.12, monitorHeight - 0.12),
      panelMaterial,
    );
    panel.position.z = 0.031;
    panel.renderOrder = 2;
    monitor.add(panel);

    const standStem = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.09, 0.05),
      frameMaterial,
    );
    standStem.position.set(0, -monitorHeight / 2 - 0.045, 0);
    monitor.add(standStem);

    const standFoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.025, 0.2),
      frameMaterial,
    );
    standFoot.position.set(0, -monitorHeight / 2 - 0.1, 0.04);
    monitor.add(standFoot);

    enableShadows(monitor);
    return monitor;
  }

  function addDeskCornerMonitor(center, rotation = 0, {
    deskWidth = 2.6,
    deskDepth = 1.18,
    deskHeight = 0.64,
  } = {}) {
    const monitor = createDeskCornerMonitor();

    monitor.position.set(
      -deskWidth / 2 + 0.52,
      deskHeight + 0.44,
      -deskDepth / 2 + 0.22,
    );
    monitor.rotation.y = 0;

    const setup = new THREE.Group();
    setup.add(monitor);
    placePlanObject(setup, center, 0, rotation, furnishingGroup);
  }

  function addDeskCornerMonitorAt(point, rotation = 0, y = 1.08, frameColor = "#111317") {
    const monitor = createDeskCornerMonitor(frameColor);
    const worldPoint = toWorldPoint(point);
    monitor.position.set(worldPoint.x, y, worldPoint.z);
    monitor.rotation.y = rotation;
    furnishingGroup.add(monitor);
  }

  function addDeskPaperAndMarkers(center, rotation = 0, {
    deskWidth = 2.2,
    deskDepth = 1.18,
    deskHeight = 0.64,
    localOffset = [0, 0],
    variant = "a",
  } = {}) {
    const props = new THREE.Group();
    const paperMaterial = new THREE.MeshStandardMaterial({
      color: "#f1ede2",
      roughness: 0.94,
      metalness: 0.02,
    });
    const messySets = {
      a: {
        papers: [
          { size: [0.35, 0.006, 0.24], pos: [-0.34, 0, 0.18], rot: 18 },
          { size: [0.3, 0.006, 0.22], pos: [0.28, 0.008, -0.12], rot: -11 },
          { size: [0.26, 0.006, 0.18], pos: [0.05, 0.014, -0.28], rot: 31 },
        ],
        markers: [
          { color: "#b63d3d", pos: [-0.08, 0.024, 0.01], rot: 22 },
          { color: "#2e5db3", pos: [0.18, 0.02, 0.24], rot: -16 },
          { color: "#3b8c4a", pos: [-0.26, 0.028, -0.19], rot: 9 },
        ],
      },
      b: {
        papers: [
          { size: [0.33, 0.006, 0.23], pos: [-0.42, 0, -0.08], rot: -24 },
          { size: [0.29, 0.006, 0.21], pos: [0.36, 0.01, 0.16], rot: 7 },
          { size: [0.24, 0.006, 0.17], pos: [0.02, 0.013, -0.24], rot: -38 },
        ],
        markers: [
          { color: "#3b8c4a", pos: [-0.19, 0.022, 0.19], rot: -4 },
          { color: "#d09a1c", pos: [0.22, 0.026, -0.02], rot: 27 },
          { color: "#2e5db3", pos: [-0.02, 0.02, -0.18], rot: -29 },
        ],
      },
      c: {
        papers: [
          { size: [0.34, 0.006, 0.24], pos: [-0.31, 0, 0.2], rot: 12 },
          { size: [0.31, 0.006, 0.2], pos: [0.25, 0.009, 0.02], rot: 41 },
          { size: [0.22, 0.006, 0.16], pos: [0.02, 0.016, -0.26], rot: -19 },
          { size: [0.18, 0.006, 0.14], pos: [0.34, 0.02, -0.14], rot: 5 },
        ],
        markers: [
          { color: "#b63d3d", pos: [-0.12, 0.023, -0.05], rot: 34 },
          { color: "#5c3db6", pos: [0.14, 0.027, 0.16], rot: -8 },
          { color: "#3b8c4a", pos: [-0.28, 0.024, -0.21], rot: -35 },
        ],
      },
      d: {
        papers: [
          { size: [0.32, 0.006, 0.22], pos: [-0.26, 0, 0.21], rot: -7 },
          { size: [0.28, 0.006, 0.2], pos: [0.24, 0.011, -0.03], rot: 26 },
          { size: [0.25, 0.006, 0.17], pos: [-0.03, 0.017, -0.24], rot: -21 },
        ],
        markers: [
          { color: "#d09a1c", pos: [-0.16, 0.021, 0.02], rot: 15 },
          { color: "#2e5db3", pos: [0.05, 0.024, 0.19], rot: 42 },
          { color: "#b63d3d", pos: [0.19, 0.027, -0.14], rot: -18 },
          { color: "#3b8c4a", pos: [-0.24, 0.03, -0.2], rot: -41 },
        ],
      },
    };
    const arrangement = messySets[variant] ?? messySets.a;

    arrangement.papers.forEach(({ size, pos, rot }) => {
      const sheet = new THREE.Mesh(
        new THREE.BoxGeometry(size[0], size[1], size[2]),
        paperMaterial,
      );
      sheet.position.set(pos[0], pos[1], pos[2]);
      sheet.rotation.y = THREE.MathUtils.degToRad(rot);
      props.add(sheet);
    });

    arrangement.markers.forEach(({ color, pos, rot }, index) => {
      const marker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.18, 14),
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.42,
          metalness: 0.08,
        }),
      );
      marker.rotation.z = Math.PI / 2;
      marker.position.set(pos[0], pos[1] + index * 0.001, pos[2]);
      marker.rotation.y = THREE.MathUtils.degToRad(rot);
      props.add(marker);
    });

    enableShadows(props);
    placePlanObject(
      props,
      offsetPlanPoint(center, localOffset, rotation),
      deskHeight + 0.02,
      rotation,
      furnishingGroup,
    );
  }

  function addProductionDeskSetup(center, rotation) {
    const setup = new THREE.Group();
    const deskMonitorTexture = new THREE.TextureLoader().load(
      new URL("./sqquoiasunrise.jpg", import.meta.url).href,
    );
    deskMonitorTexture.colorSpace = THREE.SRGBColorSpace;
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: "#0f1113",
      roughness: 0.74,
      metalness: 0.08,
    });
    const consoleMaterial = new THREE.MeshStandardMaterial({
      color: "#131518",
      roughness: 0.58,
      metalness: 0.16,
    });
    const trayMaterial = new THREE.MeshStandardMaterial({
      color: "#1a1c1f",
      roughness: 0.72,
      metalness: 0.08,
    });

    const addMonitor = (size, position, texture, rotationY = 0, stemHeight = 0.18) => {
      const monitor = new THREE.Group();
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(size[0], size[1], 0.045),
        frameMaterial,
      );
      monitor.add(frame);

      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(size[0] - 0.05, size[1] - 0.05),
        new THREE.MeshBasicMaterial({
          map: texture,
          toneMapped: false,
        }),
      );
      panel.position.z = 0.024;
      monitor.add(panel);

      const standStem = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, stemHeight, 0.03),
        frameMaterial,
      );
      standStem.position.set(0, -size[1] / 2 - stemHeight / 2, 0);
      monitor.add(standStem);

      const standFoot = new THREE.Mesh(
        new THREE.BoxGeometry(size[0] * 0.42, 0.02, 0.18),
        frameMaterial,
      );
      standFoot.position.set(0, -size[1] / 2 - stemHeight - 0.01, 0.04);
      monitor.add(standFoot);

      monitor.position.set(position[0], position[1], position[2]);
      monitor.rotation.y = rotationY;
      setup.add(monitor);
    };

    addMonitor([0.78, 0.46], [0.08, 2.04, -0.42], deskMonitorTexture, 0, 1.08);
    addMonitor([0.78, 0.46], [-0.42, 1.52, -0.26], deskMonitorTexture, 0.14, 0.62);
    addMonitor([0.78, 0.46], [0.42, 1.52, -0.26], deskMonitorTexture, -0.14, 0.62);

    const switcher = new THREE.Group();
    const consoleBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.94, 0.08, 0.38),
      consoleMaterial,
    );
    consoleBody.position.y = 1.07;
    switcher.add(consoleBody);

    const consoleSlope = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.04, 0.26),
      new THREE.MeshStandardMaterial({
        color: "#191c20",
        roughness: 0.46,
        metalness: 0.14,
      }),
    );
    consoleSlope.position.set(0, 1.13, 0.02);
    consoleSlope.rotation.x = -0.18;
    switcher.add(consoleSlope);

    const touchscreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.1),
      new THREE.MeshStandardMaterial({
        color: "#87b7ff",
        emissive: "#5a9ef6",
        emissiveIntensity: 0.45,
        roughness: 0.18,
        metalness: 0.02,
      }),
    );
    touchscreen.position.set(0.1, 1.16, -0.03);
    touchscreen.rotation.x = -0.4;
    switcher.add(touchscreen);

    [-0.33, -0.22, -0.11, 0.0, 0.11, 0.22, 0.33].forEach((x, index) => {
      const fader = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.05, 0.06),
        new THREE.MeshStandardMaterial({
          color: index % 2 === 0 ? "#0f1113" : "#1b1e22",
          roughness: 0.5,
          metalness: 0.16,
        }),
      );
      fader.position.set(x, 1.115, 0.06);
      switcher.add(fader);
    });

    [-0.32, -0.18, -0.04, 0.1, 0.24].forEach((x) => {
      const knob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.018, 12),
        chromeMaterial,
      );
      knob.rotation.x = Math.PI / 2;
      knob.position.set(x, 1.135, -0.06);
      switcher.add(knob);
    });
    setup.add(switcher);

    [-0.78, 0.79].forEach((x) => {
      const streamDeck = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.09, 0.12),
        consoleMaterial,
      );
      streamDeck.add(body);

      const deckScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12, 0.06),
        new THREE.MeshStandardMaterial({
          color: "#8ec7ff",
          emissive: "#64aef5",
          emissiveIntensity: 0.52,
          roughness: 0.2,
          metalness: 0.02,
        }),
      );
      deckScreen.position.z = -0.061;
      streamDeck.add(deckScreen);
      streamDeck.position.set(x, 1.08, 0.12);
      setup.add(streamDeck);
    });

    const deskPhone = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.012, 0.14),
      new THREE.MeshStandardMaterial({
        color: "#16181b",
        roughness: 0.38,
        metalness: 0.08,
      }),
    );
    deskPhone.position.set(-0.66, 1.05, 0.14);
    deskPhone.rotation.z = -0.22;
    setup.add(deskPhone);

    const keyboardTray = new THREE.Mesh(
      new THREE.BoxGeometry(1.12, 0.035, 0.28),
      trayMaterial,
    );
    keyboardTray.position.set(0, 0.8, 0.48);
    setup.add(keyboardTray);

    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.025, 0.13),
      new THREE.MeshStandardMaterial({
        color: "#25282c",
        roughness: 0.62,
        metalness: 0.08,
      }),
    );
    keyboard.position.set(-0.08, 0.835, 0.47);
    setup.add(keyboard);

    const mouse = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.028, 0.09),
      frameMaterial,
    );
    mouse.position.set(0.44, 0.836, 0.47);
    setup.add(mouse);

    [-0.42, 0.42].forEach((x) => {
      const trayArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.08, 0.18),
        frameMaterial,
      );
      trayArm.position.set(x, 0.89, 0.4);
      setup.add(trayArm);
    });

    const cableDrop = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.48, 1.02, 0.02),
          new THREE.Vector3(0.58, 0.86, 0.18),
          new THREE.Vector3(0.62, 0.52, 0.28),
          new THREE.Vector3(0.54, 0.06, 0.46),
        ]),
        22,
        0.005,
        8,
        false,
      ),
      cableMaterial,
    );
    setup.add(cableDrop);

    enableShadows(setup);
    placePlanObject(setup, center, 0, rotation, furnishingGroup);
  }

  function addMiddleTableMonitorRow(center, rotation = 0) {
    const setup = new THREE.Group();
    const middleTableMonitorTexture = new THREE.TextureLoader().load(
      new URL("./sqquoiasunrise.jpg", import.meta.url).href,
    );
    middleTableMonitorTexture.colorSpace = THREE.SRGBColorSpace;
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: "#101215",
      roughness: 0.72,
      metalness: 0.08,
    });
    const panelMaterial = new THREE.MeshBasicMaterial({
      map: middleTableMonitorTexture,
      toneMapped: false,
    });

    const addMonitor = ({
      x,
      y = 1.54,
      z,
      angle = 0,
      size = [1.06, 0.62],
      stemHeight = 0.36,
      standBehind = false,
    }) => {
      const monitor = new THREE.Group();
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(size[0], size[1], 0.045),
        frameMaterial,
      );
      monitor.add(frame);

      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(size[0] - 0.05, size[1] - 0.05),
        panelMaterial,
      );
      panel.position.z = 0.024;
      monitor.add(panel);

      const standStem = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, stemHeight, 0.03),
        frameMaterial,
      );
      standStem.position.set(0, -size[1] / 2 - stemHeight / 2, standBehind ? -0.03 : 0);
      monitor.add(standStem);

      const standFoot = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.02, 0.18),
        frameMaterial,
      );
      standFoot.position.set(0, -size[1] / 2 - stemHeight - 0.01, standBehind ? -0.08 : 0.04);
      monitor.add(standFoot);

      monitor.position.set(x, 1.54, z);
      monitor.position.y = y;
      monitor.rotation.y = Math.PI + angle;
      setup.add(monitor);
    };

    addMonitor({ x: -1.22, y: 2.18, z: 0.24, angle: -THREE.MathUtils.degToRad(20), size: [0.94, 0.55], stemHeight: 1.06, standBehind: true });
    addMonitor({ x: -1.08, z: 0.28, angle: -THREE.MathUtils.degToRad(20) });
    addMonitor({ x: 0, z: 0.36 });
    addMonitor({ x: 1.08, z: 0.28, angle: THREE.MathUtils.degToRad(20) });
    addMonitor({ x: 1.22, y: 2.18, z: 0.24, angle: THREE.MathUtils.degToRad(20), size: [0.94, 0.55], stemHeight: 1.06, standBehind: true });

    enableShadows(setup);
    placePlanObject(setup, center, 0, rotation, furnishingGroup);
  }

  function addMiddleTableDeskProps(center, rotation = 0) {
    const setup = new THREE.Group();
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: "#111417",
      roughness: 0.72,
      metalness: 0.1,
    });
    const trayMaterial = new THREE.MeshStandardMaterial({
      color: "#1b1f23",
      roughness: 0.76,
      metalness: 0.08,
    });
    const consoleMaterial = new THREE.MeshStandardMaterial({
      color: "#171a1e",
      roughness: 0.56,
      metalness: 0.14,
    });

    const mainSwitcher = new THREE.Group();
    const switcherBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.12, 0.08, 0.44),
      consoleMaterial,
    );
    switcherBody.position.set(-0.28, 1.07, -0.18);
    mainSwitcher.add(switcherBody);

    const switcherPad = new THREE.Mesh(
      new THREE.BoxGeometry(1.04, 0.03, 0.28),
      trayMaterial,
    );
    switcherPad.position.set(-0.28, 1.12, -0.2);
    switcherPad.rotation.x = -0.2;
    mainSwitcher.add(switcherPad);

    [-0.72, -0.58, -0.44, -0.3, -0.16, -0.02, 0.12].forEach((x, index) => {
      const button = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.02, 0.035),
        new THREE.MeshStandardMaterial({
          color: index < 4 ? "#5db8ff" : index === 4 ? "#40e685" : "#ff835a",
          emissive: index < 4 ? "#3d8fe0" : index === 4 ? "#28b868" : "#d45f3e",
          emissiveIntensity: 0.65,
          roughness: 0.26,
          metalness: 0.08,
        }),
      );
      button.position.set(x, 1.115, -0.06);
      mainSwitcher.add(button);
    });

    [-0.66, -0.54, -0.42, -0.3, -0.18, -0.06, 0.06].forEach((x) => {
      const key = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.018, 0.028),
        frameMaterial,
      );
      key.position.set(x, 1.108, -0.16);
      mainSwitcher.add(key);
    });
    setup.add(mainSwitcher);

    [
      { x: -1.32, z: -0.24, rotationY: Math.PI - 0.34 },
      { x: 1.34, z: -0.22, rotationY: -0.42 },
    ].forEach(({ x, z, rotationY }) => {
      const sideDeck = new THREE.Group();
      const tray = new THREE.Mesh(
        new THREE.BoxGeometry(0.54, 0.04, 0.32),
        trayMaterial,
      );
      sideDeck.add(tray);

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.08, 0.24),
        consoleMaterial,
      );
      body.position.y = 0.04;
      sideDeck.add(body);

      [-0.14, -0.05, 0.04, 0.13].forEach((buttonX, index) => {
        const litKey = new THREE.Mesh(
          new THREE.BoxGeometry(0.065, 0.02, 0.03),
          new THREE.MeshStandardMaterial({
            color: index % 2 === 0 ? "#ff7e56" : "#6ab5ff",
            emissive: index % 2 === 0 ? "#d35a3a" : "#4c86db",
            emissiveIntensity: 0.52,
            roughness: 0.28,
            metalness: 0.08,
          }),
        );
        litKey.position.set(buttonX, 0.07, 0.02);
        sideDeck.add(litKey);
      });

      const miniScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.18, 0.08),
        new THREE.MeshStandardMaterial({
          color: "#9fd1ff",
          emissive: "#6da8eb",
          emissiveIntensity: 0.4,
          roughness: 0.18,
          metalness: 0.02,
        }),
      );
      miniScreen.position.set(0, 0.085, -0.065);
      miniScreen.rotation.x = -0.3;
      sideDeck.add(miniScreen);

      sideDeck.position.set(x, 1.05, z);
      sideDeck.rotation.y = rotationY;
      setup.add(sideDeck);
    });

    const keyboardTray = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.03, 0.24),
      trayMaterial,
    );
    keyboardTray.position.set(0.72, 1.03, -0.36);
    setup.add(keyboardTray);

    const keyboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.022, 0.11),
      frameMaterial,
    );
    keyboard.position.set(0.62, 1.05, -0.34);
    setup.add(keyboard);

    const mouse = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.028, 0.09),
      frameMaterial,
    );
    mouse.position.set(1.02, 1.055, -0.33);
    setup.add(mouse);

    const controlPuck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.028, 18),
      consoleMaterial,
    );
    controlPuck.position.set(0.28, 1.035, -0.26);
    setup.add(controlPuck);

    const dockBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.13, 0.18),
      new THREE.MeshStandardMaterial({
        color: "#c7c8cc",
        roughness: 0.64,
        metalness: 0.08,
      }),
    );
    dockBox.position.set(0.2, 1.08, -0.1);
    setup.add(dockBox);

    const keypad = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.07, 0.16),
      consoleMaterial,
    );
    keypad.position.set(0.56, 1.05, -0.14);
    setup.add(keypad);

    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const key = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.012, 0.03),
          new THREE.MeshStandardMaterial({
            color: row === 0 ? "#80c7ff" : "#f2f3f5",
            emissive: row === 0 ? "#5e9fe2" : "#000000",
            emissiveIntensity: row === 0 ? 0.35 : 0,
            roughness: 0.24,
            metalness: 0.04,
          }),
        );
        key.position.set(0.5 + col * 0.06, 1.093, -0.11 + row * 0.05);
        setup.add(key);
      }
    }

    const phone = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.012, 0.16),
      frameMaterial,
    );
    phone.position.set(-1.52, 1.03, -0.08);
    phone.rotation.z = -0.28;
    setup.add(phone);

    [
      [
        new THREE.Vector3(0.3, 1.0, -0.08),
        new THREE.Vector3(0.48, 0.94, -0.12),
        new THREE.Vector3(0.74, 0.88, -0.28),
        new THREE.Vector3(0.98, 0.86, -0.34),
      ],
      [
        new THREE.Vector3(-0.12, 1.1, -0.18),
        new THREE.Vector3(0.04, 0.96, -0.22),
        new THREE.Vector3(0.22, 0.88, -0.26),
        new THREE.Vector3(0.36, 0.84, -0.36),
      ],
    ].forEach((points) => {
      const cable = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 18, 0.005, 8, false),
        cableMaterial,
      );
      setup.add(cable);
    });

    enableShadows(setup);
    placePlanObject(setup, center, 0, rotation, furnishingGroup);
  }

  function addWestSideDeskProps(center, rotation = 0) {
    const setup = new THREE.Group();
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: "#13161a",
      roughness: 0.72,
      metalness: 0.08,
    });
    const trayMaterial = new THREE.MeshStandardMaterial({
      color: "#1a1d21",
      roughness: 0.76,
      metalness: 0.08,
    });
    const paperMaterial = new THREE.MeshStandardMaterial({
      color: "#f1f1ec",
      roughness: 0.9,
      metalness: 0.01,
    });
    const cardboardMaterial = new THREE.MeshStandardMaterial({
      color: "#8c6743",
      roughness: 0.88,
      metalness: 0.02,
    });

    const mixer = new THREE.Group();
    const mixerBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.13, 0.46),
      new THREE.MeshStandardMaterial({
        color: "#2f3034",
        roughness: 0.52,
        metalness: 0.12,
      }),
    );
    mixer.add(mixerBody);

    const mixerTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.78, 0.04, 0.32),
      trayMaterial,
    );
    mixerTop.position.set(0, 0.085, -0.03);
    mixerTop.rotation.x = -0.18;
    mixer.add(mixerTop);

    [-0.3, -0.2, -0.1, 0.0, 0.1, 0.2, 0.3].forEach((x, index) => {
      const fader = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.04, 0.07),
        frameMaterial,
      );
      fader.position.set(x, 0.095, 0.1);
      mixer.add(fader);

      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.014, 0.03),
        new THREE.MeshStandardMaterial({
          color: index % 2 === 0 ? "#f44d53" : "#7ec2ff",
          emissive: index % 2 === 0 ? "#c73f44" : "#5b96d8",
          emissiveIntensity: 0.48,
          roughness: 0.24,
          metalness: 0.04,
        }),
      );
      cap.position.set(x, 0.125, -0.01);
      mixer.add(cap);
    });

    [-0.26, -0.14, -0.02, 0.1, 0.22].forEach((x) => {
      const knob = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12),
        chromeMaterial,
      );
      knob.rotation.x = Math.PI / 2;
      knob.position.set(x, 0.125, -0.12);
      mixer.add(knob);
    });

    const mixerScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 0.09),
      new THREE.MeshStandardMaterial({
        color: "#86bfff",
        emissive: "#5a8fd1",
        emissiveIntensity: 0.45,
        roughness: 0.2,
        metalness: 0.02,
      }),
    );
    mixerScreen.position.set(0.18, 0.135, -0.13);
    mixerScreen.rotation.x = -0.32;
    mixer.add(mixerScreen);

    mixer.position.set(-0.34, 1.05, -0.04);
    mixer.rotation.y = 0.24;
    setup.add(mixer);

    const headphoneStand = new THREE.Group();
    const standBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.09, 0.02, 18),
      frameMaterial,
    );
    headphoneStand.add(standBase);
    const standPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.24, 10),
      frameMaterial,
    );
    standPole.position.y = 0.13;
    headphoneStand.add(standPole);
    const standHook = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.008, 8, 18, Math.PI),
      chromeMaterial,
    );
    standHook.rotation.z = Math.PI;
    standHook.position.y = 0.26;
    headphoneStand.add(standHook);
    const headphones = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.012, 10, 24, Math.PI),
      frameMaterial,
    );
    headphones.rotation.z = Math.PI;
    headphones.position.set(0, 0.22, 0);
    headphoneStand.add(headphones);
    headphoneStand.position.set(-0.04, 1.01, 0.1);
    setup.add(headphoneStand);

    const paperOne = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28, 0.18),
      paperMaterial,
    );
    paperOne.position.set(0.34, 1.012, 0.08);
    paperOne.rotation.x = -Math.PI / 2;
    paperOne.rotation.z = 0.18;
    setup.add(paperOne);

    const paperTwo = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.16),
      paperMaterial,
    );
    paperTwo.position.set(0.56, 1.013, 0.02);
    paperTwo.rotation.x = -Math.PI / 2;
    paperTwo.rotation.z = -0.08;
    setup.add(paperTwo);

    const tissue = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.028, 0.09),
      new THREE.MeshStandardMaterial({
        color: "#ece8e2",
        roughness: 0.96,
        metalness: 0.01,
      }),
    );
    tissue.position.set(0.74, 1.02, 0.13);
    tissue.rotation.y = -0.18;
    setup.add(tissue);

    const can = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.038, 0.12, 16),
      new THREE.MeshStandardMaterial({
        color: "#dfdfe1",
        roughness: 0.42,
        metalness: 0.48,
      }),
    );
    can.position.set(0.58, 1.06, -0.04);
    setup.add(can);

    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.14, 10),
      new THREE.MeshStandardMaterial({
        color: "#2e7dff",
        roughness: 0.42,
        metalness: 0.08,
      }),
    );
    marker.rotation.z = Math.PI / 2;
    marker.position.set(0.28, 1.03, -0.12);
    setup.add(marker);

    const stackedBoxes = new THREE.Group();
    const bottomBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.08, 0.18),
      new THREE.MeshStandardMaterial({
        color: "#d9cfad",
        roughness: 0.72,
        metalness: 0.04,
      }),
    );
    stackedBoxes.add(bottomBox);
    const topBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.05, 0.14),
      paperMaterial,
    );
    topBox.position.y = 0.065;
    stackedBoxes.add(topBox);
    stackedBoxes.position.set(0.26, 1.04, -0.18);
    setup.add(stackedBoxes);

    const smallCamera = new THREE.Group();
    const cameraBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.09, 0.1),
      frameMaterial,
    );
    smallCamera.add(cameraBody);
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.024, 0.08, 14),
      new THREE.MeshStandardMaterial({
        color: "#17191c",
        roughness: 0.34,
        metalness: 0.18,
      }),
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 0, -0.08);
    smallCamera.add(lens);
    smallCamera.position.set(0.28, 1.13, -0.18);
    setup.add(smallCamera);

    const camcorder = new THREE.Group();
    const camBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.1, 0.12),
      frameMaterial,
    );
    camcorder.add(camBody);
    const camLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.026, 0.12, 14),
      new THREE.MeshStandardMaterial({
        color: "#1a1c1e",
        roughness: 0.32,
        metalness: 0.16,
      }),
    );
    camLens.rotation.x = Math.PI / 2;
    camLens.position.set(0.07, 0, -0.1);
    camcorder.add(camLens);
    camcorder.position.set(0.72, 1.07, -0.22);
    camcorder.rotation.y = -0.2;
    setup.add(camcorder);

    const rackUnit = new THREE.Group();
    const rackBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.22, 0.36),
      frameMaterial,
    );
    rackUnit.add(rackBody);
    [-0.2, 0, 0.2].forEach((x, index) => {
      const module = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.06, 0.04),
        new THREE.MeshStandardMaterial({
          color: "#0d1012",
          roughness: 0.48,
          metalness: 0.16,
        }),
      );
      module.position.set(x, 0.03, -0.17);
      rackUnit.add(module);

      const light = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.012, 0.01),
        new THREE.MeshStandardMaterial({
          color: index === 1 ? "#68c8ff" : "#7dff96",
          emissive: index === 1 ? "#4d9ada" : "#57cb73",
          emissiveIntensity: 0.5,
          roughness: 0.22,
          metalness: 0.04,
        }),
      );
      light.position.set(x, -0.02, -0.19);
      rackUnit.add(light);
    });
    rackUnit.position.set(0.02, 0.16, 0.12);
    setup.add(rackUnit);

    [
      { size: [0.22, 0.18, 0.18], pos: [0.58, 0.1, 0.22] },
      { size: [0.18, 0.16, 0.16], pos: [0.52, 0.28, 0.18] },
      { size: [0.16, 0.14, 0.16], pos: [0.74, 0.09, 0.18] },
    ].forEach(({ size, pos }) => {
      const box = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), cardboardMaterial);
      box.position.set(pos[0], pos[1], pos[2]);
      setup.add(box);
    });

    [
      [
        new THREE.Vector3(-0.34, 1.06, 0.02),
        new THREE.Vector3(-0.16, 0.96, 0.08),
        new THREE.Vector3(-0.06, 0.62, 0.14),
        new THREE.Vector3(0.02, 0.2, 0.12),
      ],
      [
        new THREE.Vector3(0.02, 1.06, 0.08),
        new THREE.Vector3(0.14, 0.98, 0.02),
        new THREE.Vector3(0.28, 0.7, 0.1),
        new THREE.Vector3(0.46, 0.22, 0.18),
      ],
    ].forEach((points) => {
      const cable = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 18, 0.005, 8, false),
        cableMaterial,
      );
      setup.add(cable);
    });

    enableShadows(setup);
    placePlanObject(setup, center, 0, rotation, furnishingGroup);
  }

  function addWestSideStandingTv(center, rotation = 0) {
    const tv = new THREE.Group();
    const standingTvTexture = new THREE.TextureLoader().load(
      new URL("./sqquoiasunrise.jpg", import.meta.url).href,
    );
    standingTvTexture.colorSpace = THREE.SRGBColorSpace;
    const standMaterial = new THREE.MeshStandardMaterial({
      color: "#1a1d21",
      roughness: 0.66,
      metalness: 0.18,
    });
    const bezelMaterial = new THREE.MeshStandardMaterial({
      color: "#0e1012",
      roughness: 0.38,
      metalness: 0.12,
    });
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: standingTvTexture,
      toneMapped: false,
    });

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.05, 18),
      standMaterial,
    );
    base.position.y = 0.025;
    tv.add(base);

    const mast = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 1.46, 0.08),
      standMaterial,
    );
    mast.position.y = 0.78;
    tv.add(mast);

    const backPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.22, 0.05),
      standMaterial,
    );
    backPlate.position.set(0, 1.66, 0);
    tv.add(backPlate);

    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(1.62, 0.96, 0.09),
      bezelMaterial,
    );
    bezel.position.set(0, 1.84, 0.06);
    tv.add(bezel);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.48, 0.84),
      screenMaterial,
    );
    screen.position.set(0, 1.84, 0.108);
    tv.add(screen);

    tv.position.set(-0.51, 0, 1.99);
    tv.rotation.y = 0;
    enableShadows(tv);
    placePlanObject(tv, center, 0, rotation, furnishingGroup);
  }

  function addTallVerticalMonitor(center, rotation = 0, { suspended = false } = {}) {
    const display = new THREE.Group();
    const monitorTexture = new THREE.TextureLoader().load(
      new URL("./sqquoiasunrise.jpg", import.meta.url).href,
    );
    monitorTexture.colorSpace = THREE.SRGBColorSpace;
    const standMaterial = new THREE.MeshStandardMaterial({
      color: "#1a1d21",
      roughness: 0.66,
      metalness: 0.18,
    });
    const bezelMaterial = new THREE.MeshStandardMaterial({
      color: "#0e1012",
      roughness: 0.38,
      metalness: 0.12,
    });
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: monitorTexture,
      toneMapped: false,
    });
    const bezelWidth = 0.92;
    const bezelHeight = suspended ? 2.18 : 1.74;
    const screenWidth = 0.8;
    const screenHeight = suspended ? 2.0 : 1.58;
    const screenCenterY = suspended ? 2.56 : 1.78;

    if (suspended) {
      [-0.18, 0.18].forEach((x) => {
        const cable = new THREE.Mesh(
          new THREE.CylinderGeometry(0.012, 0.012, 1.48, 10),
          standMaterial,
        );
        cable.position.set(x, 4.06, 0);
        display.add(cable);
      });

      const hangerBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.05, 0.05),
        standMaterial,
      );
      hangerBar.position.set(0, 3.32, 0);
      display.add(hangerBar);
    } else {
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.24, 0.06, 18),
        standMaterial,
      );
      base.position.y = 0.03;
      display.add(base);

      const mast = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.62, 0.08),
        standMaterial,
      );
      mast.position.y = 0.84;
      display.add(mast);
    }

    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(bezelWidth, bezelHeight, 0.09),
      bezelMaterial,
    );
    bezel.position.set(0, screenCenterY, 0.06);
    display.add(bezel);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(screenWidth, screenHeight),
      screenMaterial,
    );
    screen.position.set(0, screenCenterY, 0.108);
    display.add(screen);

    enableShadows(display);
    placePlanObject(display, center, 0, rotation, furnishingGroup);
  }

  const northStudioLightCenter = [-2.3, 21.2];
  const southStudioLightCenter = [-2.3, 18.0];
  const studioLightAimCenter = [-2.3, 19.6];

  addStudioLight(northStudioLightCenter, 0, 1.98, -0.46, studioLightAimCenter, 0.05);
  addStudioLight(southStudioLightCenter, Math.PI, 1.98, -0.46, studioLightAimCenter, 0.05);

  const midHangarCameraCenter = [0.83, 18.85];
  const northeastCameraStandCenter = [9.4, 25.0];
  const midHangarSoftboxCenter = [1.07, 19.9];
  const midHangarAimCenter = [-2.6, 19.5];
  const midHangarTableCenter = [PLAN_WIDTH / 2, 16.0];

  addCameraTripodRig(midHangarCameraCenter, Math.PI / 2, 1, true);
  addCameraTripodRig(northeastCameraStandCenter, -Math.PI / 4, 0.76, true);
  addSoftboxRig(midHangarSoftboxCenter, Math.PI / 2, midHangarAimCenter, 0.42, {
    intensity: 8.8,
    distance: 10.5,
    angle: 0.48,
    penumbra: 0.52,
    decay: 1.15,
    effectIntensity: 26,
    effectDistance: 11.8,
    effectAngle: 0.84,
    effectPenumbra: 0.52,
    effectDecay: 1.35,
  });
  const westSideTableCenter = [midHangarTableCenter[0] - 2.65, 15.5];
  const eastSideTableCenter = [midHangarTableCenter[0] + 2.65, 15.5];
  const westSideTableRotation = Math.PI - Math.PI / 6;
  const eastSideTableRotation = Math.PI + Math.PI / 6;
  const offsetPlanPoint = ([x, z], [dx, dz], rotation = 0) => [
    x + dx * Math.cos(rotation) - dz * Math.sin(rotation),
    z + dx * Math.sin(rotation) + dz * Math.cos(rotation),
  ];

  addStandingTable(midHangarTableCenter, 0, 3.35);
  addMiddleTableMonitorRow(midHangarTableCenter, 0);
  addMiddleTableDeskProps(midHangarTableCenter, 0);
  addTallDeskStool(offsetPlanPoint(midHangarTableCenter, [0.08, -0.76], 0), 0.12);
  const hangarCenterDeskCenter = [5.19, 17.8];
  addDoubleLayerDesk(hangarCenterDeskCenter, Math.PI * 1.5, 2.2);
  addDeskPaperAndMarkers(hangarCenterDeskCenter, Math.PI * 1.5, {
    deskWidth: 2.2,
    deskDepth: 1.34,
    deskHeight: 0.8,
    localOffset: [-0.18, -0.08],
    variant: "a",
  });
  const hangarCenterDeskChairCenter = [hangarCenterDeskCenter[0] - 0.9, hangarCenterDeskCenter[1]];
  addRollingChair(hangarCenterDeskChairCenter, Math.PI / 2, { registerAsSeat: false });
  addSeatedCharacter({
    planPosition: hangarCenterDeskChairCenter,
    rotation: Math.atan2(
      hangarCenterDeskCenter[0] - hangarCenterDeskChairCenter[0],
      hangarCenterDeskCenter[1] - hangarCenterDeskChairCenter[1],
    ) + Math.PI,
    seatHeight: 0.48,
    hairColor: "#4a3d32",
    tieColor: "#9f6745",
    suitColor: "#434d56",
    shirtColor: "#f3efe6",
  });
  const mirroredSingleDeskCenter = [PLAN_WIDTH - hangarCenterDeskCenter[0], hangarCenterDeskCenter[1] + 0.2];
  addSingleLayerDesk(mirroredSingleDeskCenter, Math.PI / 2, 2.6);
  addDeskPaperAndMarkers(mirroredSingleDeskCenter, Math.PI / 2, {
    deskWidth: 2.6,
    deskDepth: 1.18,
    deskHeight: 0.64,
    localOffset: [-0.14, -0.02],
    variant: "b",
  });
  const huggingSingleDeskCenter = [mirroredSingleDeskCenter[0], mirroredSingleDeskCenter[1] + 2.5];
  addSingleLayerDesk(huggingSingleDeskCenter, Math.PI / 2, 2.4, 0.7);
  addDeskPaperAndMarkers(huggingSingleDeskCenter, Math.PI / 2, {
    deskWidth: 2.4,
    deskDepth: 1.18,
    deskHeight: 0.7,
    localOffset: [-0.1, -0.05],
    variant: "c",
  });
  const mirroredSingleDeskChairCenter = [mirroredSingleDeskCenter[0] + 0.95, mirroredSingleDeskCenter[1]];
  addRollingChair(mirroredSingleDeskChairCenter, -Math.PI / 2, { registerAsSeat: false });
  addSeatedCharacter({
    planPosition: mirroredSingleDeskChairCenter,
    rotation: Math.atan2(
      mirroredSingleDeskCenter[0] - mirroredSingleDeskChairCenter[0],
      mirroredSingleDeskCenter[1] - mirroredSingleDeskChairCenter[1],
    ),
    seatHeight: 0.48,
    hairColor: "#30231d",
    tieColor: "#9f6745",
    suitColor: "#434d56",
    shirtColor: "#f3efe6",
  });
  addRollingChair([huggingSingleDeskCenter[0] + 0.95, huggingSingleDeskCenter[1]], -Math.PI / 2);
  const southHangarDeskCenter = [5.19, 20.2];
  addDoubleLayerDesk(southHangarDeskCenter, Math.PI * 1.5, 2.2);
  addDeskPaperAndMarkers(southHangarDeskCenter, Math.PI * 1.5, {
    deskWidth: 2.2,
    deskDepth: 1.34,
    deskHeight: 0.8,
    localOffset: [0.16, -0.1],
    variant: "d",
  });
  addDeskCornerMonitorAt(
    [
      offsetPlanPoint(southHangarDeskCenter, [-2.2 / 2, -1.34 / 2], Math.PI * 1.5)[0] + 0.5,
      offsetPlanPoint(southHangarDeskCenter, [-2.2 / 2, -1.34 / 2], Math.PI * 1.5)[1] - 1.9,
    ],
    Math.PI * 1.5 + THREE.MathUtils.degToRad(20),
    1.32,
    "#8b929b",
  );
  const southHangarDeskChairCenter = [southHangarDeskCenter[0] - 0.9, southHangarDeskCenter[1]];
  addRollingChair(southHangarDeskChairCenter, Math.PI / 2, { registerAsSeat: false });
  addSeatedCharacter({
    planPosition: southHangarDeskChairCenter,
    rotation: Math.atan2(
      southHangarDeskCenter[0] - southHangarDeskChairCenter[0],
      southHangarDeskCenter[1] - southHangarDeskChairCenter[1],
    ) + Math.PI,
    seatHeight: 0.48,
    hairColor: "#1a1512",
    tieColor: "#9f6745",
    suitColor: "#434d56",
    shirtColor: "#f3efe6",
  });
  const hangarStageCenter = [6.5, 30.0];
  const slimHangarShelfWidth = 2.4;
  const slimHangarShelfDepth = 0.34;
  const cableTrackLength = 1.24;
  const cableTrackWidth = 0.19;
  const cableTrackShelfGap = 0.16;
  const eastCableTrackGap = 0.5;
  const cableTrackPairSpacing = cableTrackLength + eastCableTrackGap;
  const eastHangarDeskCenter = [10.6, 23.4];
  const eastHangarDeskRotation = Math.PI + THREE.MathUtils.degToRad(25);
  const eastHangarDeskWidth = 2.6;
  const eastHangarDeskDepth = 1.18;
  const eastHangarDeskHeight = 0.64;
  const trussTrackColumnCount = 7;
  const trussTrackColumnStart = [1, 25.35];
  const eastTrackRowCount = 5;
  const eastTrackRowOppositeCount = 1;
  const eastTrackRowStart = [13.6, 18.5];
  const upperTrussTrackColumnCount = 2;
  const upperTrussTrackColumnOppositeCount = 1;
  const upperTrussTrackColumnStart = [-1.6, 28.8];
  const mirroredTrussTrackColumnCount = 5;
  const mirroredTrussTrackColumnStart = [1, 24 - (trussTrackColumnStart[1] - 24)];
  const trussTrackColumnCableCenter = [
    trussTrackColumnStart[0],
    trussTrackColumnStart[1] + ((trussTrackColumnCount - 1) * cableTrackPairSpacing) / 2,
  ];
  const eastTrackRowCableCenter = [
    eastTrackRowStart[0]
      - ((eastTrackRowCount - 1 - eastTrackRowOppositeCount) * cableTrackPairSpacing) / 2,
    eastTrackRowStart[1],
  ];
  const upperTrussTrackColumnCableCenter = [
    upperTrussTrackColumnStart[0]
      - ((upperTrussTrackColumnCount - 1 - upperTrussTrackColumnOppositeCount) * cableTrackPairSpacing) / 2,
    upperTrussTrackColumnStart[1],
  ];
  const mirroredTrussTrackColumnCableCenter = [
    mirroredTrussTrackColumnStart[0],
    mirroredTrussTrackColumnStart[1] - ((mirroredTrussTrackColumnCount - 1) * cableTrackPairSpacing) / 2,
  ];
  const trussTrackColumnCableLength =
    cableTrackLength + (trussTrackColumnCount - 1) * cableTrackPairSpacing + 0.36;
  const eastTrackRowCableLength =
    cableTrackLength + (eastTrackRowCount - 1 + eastTrackRowOppositeCount) * cableTrackPairSpacing + 0.36;
  const upperTrussTrackColumnCableLength =
    cableTrackLength
    + (upperTrussTrackColumnCount - 1 + upperTrussTrackColumnOppositeCount) * cableTrackPairSpacing
    + 0.36;
  const fourDeskSetupNorthEdgeZ = Math.max(
    hangarCenterDeskCenter[1] + 2.2 / 2,
    southHangarDeskCenter[1] + 2.2 / 2,
    mirroredSingleDeskCenter[1] + 2.6 / 2,
    huggingSingleDeskCenter[1] + 2.4 / 2,
  );
  const hangarSlidingCameraShelfCenter = [
    hangarStageCenter[0],
    fourDeskSetupNorthEdgeZ + 2 + slimHangarShelfDepth / 2,
  ];
  const centerShelfTrackColumnCount = 4;
  const centerShelfTrackColumnStart = [
    hangarSlidingCameraShelfCenter[0],
    hangarSlidingCameraShelfCenter[1]
      + slimHangarShelfDepth / 2
      + cableTrackLength / 2
      + cableTrackShelfGap,
  ];
  const centerShelfTrackColumnCableCenter = [
    centerShelfTrackColumnStart[0],
    centerShelfTrackColumnStart[1] + ((centerShelfTrackColumnCount - 1) * cableTrackPairSpacing) / 2,
  ];
  const centerShelfTrackColumnCableLength =
    cableTrackLength + (centerShelfTrackColumnCount - 1) * cableTrackPairSpacing + 0.36;
  const underShelfCenterCableCenter = hangarSlidingCameraShelfCenter;
  const underShelfCenterCableLength = slimHangarShelfDepth + cableTrackShelfGap * 2;
  const shelfTrackBaseOffset = slimHangarShelfWidth / 2 + cableTrackLength / 2 + cableTrackShelfGap;
  const westShelfTrackCenter = offsetPlanPoint(hangarSlidingCameraShelfCenter, [-shelfTrackBaseOffset, 0], 0);
  const eastShelfTrackCenter = offsetPlanPoint(hangarSlidingCameraShelfCenter, [shelfTrackBaseOffset, 0], 0);
  const extraWestShelfTrackCenter = offsetPlanPoint(
    hangarSlidingCameraShelfCenter,
    [-(slimHangarShelfWidth / 2 + cableTrackLength * 1.5 + cableTrackShelfGap + eastCableTrackGap), 0],
    0,
  );
  const shelfCableBundleWidth = 0.24;
  const eastShelfCableLength = cableTrackLength + 0.24;
  const eastShelfCableWidth = 0.22;
  const westShelfCableCenter = [
    (westShelfTrackCenter[0] + extraWestShelfTrackCenter[0]) / 2,
    westShelfTrackCenter[1],
  ];
  const westShelfCableLength = cableTrackLength * 2 + eastCableTrackGap + 0.3;
  const westShelfCableConnectionPoint = [
    westShelfCableCenter[0] + westShelfCableLength / 2,
    westShelfCableCenter[1],
  ];
  const eastShelfCableConnectionPoint = [
    eastShelfTrackCenter[0] - eastShelfCableLength / 2,
    eastShelfTrackCenter[1],
  ];
  const eastShelfMonitorConnectionPoint = [
    eastShelfTrackCenter[0] + eastShelfCableLength / 2,
    eastShelfTrackCenter[1],
  ];
  const eastDeskMonitorCenter = offsetPlanPoint(
    eastHangarDeskCenter,
    [-eastHangarDeskWidth / 2 + 0.52, -eastHangarDeskDepth / 2 + 0.22],
    eastHangarDeskRotation,
  );
  const eastShelfMonitorConnectorDx = eastDeskMonitorCenter[0] - eastShelfMonitorConnectionPoint[0];
  const eastShelfMonitorConnectorDz = eastDeskMonitorCenter[1] - eastShelfMonitorConnectionPoint[1];
  const eastShelfMonitorConnectorLength =
    Math.hypot(eastShelfMonitorConnectorDx, eastShelfMonitorConnectorDz) || 1;
  const eastDeskMonitorCablePort = [
    eastDeskMonitorCenter[0] - (eastShelfMonitorConnectorDx / eastShelfMonitorConnectorLength) * 0.12,
    eastDeskMonitorCenter[1] - (eastShelfMonitorConnectorDz / eastShelfMonitorConnectorLength) * 0.12,
  ];
  const eastDeskMonitorCablePerp = [
    -eastShelfMonitorConnectorDz / eastShelfMonitorConnectorLength,
    eastShelfMonitorConnectorDx / eastShelfMonitorConnectorLength,
  ];
  const eastShelfMonitorConnectorPoints = [
    eastShelfMonitorConnectionPoint,
    [
      (eastShelfMonitorConnectionPoint[0] + eastDeskMonitorCablePort[0]) / 2,
      eastShelfMonitorConnectionPoint[1],
    ],
    [
      (eastShelfMonitorConnectionPoint[0] + eastDeskMonitorCablePort[0]) / 2,
      eastDeskMonitorCablePort[1],
    ],
    eastDeskMonitorCablePort,
  ];
  const eastShelfMonitorConnectorStartAnchors = Array.from({ length: 4 }, (_, cableIndex) =>
    getMessyCableEndpoint(
      eastShelfTrackCenter,
      Math.PI / 2,
      { length: eastShelfCableLength, width: eastShelfCableWidth },
      cableIndex,
      "start",
    ),
  );
  const eastShelfMonitorConnectorEndAnchors = getMessyCableRunVariants(0.08).map(({ x }) => [
    eastDeskMonitorCablePort[0] + eastDeskMonitorCablePerp[0] * x,
    eastDeskMonitorCablePort[1] + eastDeskMonitorCablePerp[1] * x,
  ]);
  const shelfTrackConnectionMidpoint = [
    (westShelfCableConnectionPoint[0] + eastShelfCableConnectionPoint[0]) / 2,
    (westShelfCableConnectionPoint[1] + eastShelfCableConnectionPoint[1]) / 2,
  ];
  const shelfTrackConnectorPoints = [
    westShelfCableConnectionPoint,
    shelfTrackConnectionMidpoint,
    eastShelfCableConnectionPoint,
  ];
  const shelfTrackConnectorStartAnchors = Array.from({ length: 4 }, (_, cableIndex) =>
    getMessyCableEndpoint(
      westShelfCableCenter,
      Math.PI / 2,
      { length: westShelfCableLength, width: shelfCableBundleWidth },
      cableIndex,
      "start",
    ),
  );
  const shelfTrackConnectorEndAnchors = Array.from({ length: 4 }, (_, cableIndex) =>
    getMessyCableEndpoint(
      eastShelfTrackCenter,
      Math.PI / 2,
      { length: eastShelfCableLength, width: eastShelfCableWidth },
      cableIndex,
      "end",
    ),
  );
  const underShelfCenterConnectionPoint = [
    underShelfCenterCableCenter[0],
    underShelfCenterCableCenter[1] + underShelfCenterCableLength / 2,
  ];
  const centerShelfTrackColumnConnectionPoint = [
    centerShelfTrackColumnCableCenter[0],
    centerShelfTrackColumnCableCenter[1] - centerShelfTrackColumnCableLength / 2,
  ];
  const underShelfToCenterTrackConnectorPoints = [
    underShelfCenterConnectionPoint,
    [
      underShelfCenterConnectionPoint[0],
      (underShelfCenterConnectionPoint[1] + centerShelfTrackColumnConnectionPoint[1]) / 2,
    ],
    centerShelfTrackColumnConnectionPoint,
  ];
  const underShelfToCenterTrackStartAnchors = Array.from({ length: 4 }, (_, cableIndex) =>
    getMessyCableEndpoint(
      underShelfCenterCableCenter,
      Math.PI,
      { length: underShelfCenterCableLength, width: shelfCableBundleWidth },
      cableIndex,
      "start",
    ),
  );
  const underShelfToCenterTrackEndAnchors = Array.from({ length: 4 }, (_, cableIndex) =>
    getMessyCableEndpoint(
      centerShelfTrackColumnCableCenter,
      Math.PI,
      { length: centerShelfTrackColumnCableLength, width: shelfCableBundleWidth },
      cableIndex,
      "end",
    ),
  );
  const pairToTrussCornerStartPoint = [
    westShelfCableCenter[0] - westShelfCableLength / 2,
    westShelfCableCenter[1],
  ];
  const pairToTrussCornerEndPoint = [
    trussTrackColumnCableCenter[0],
    trussTrackColumnCableCenter[1] - trussTrackColumnCableLength / 2,
  ];
  const pairToTrussCornerPoint = [
    pairToTrussCornerEndPoint[0],
    pairToTrussCornerStartPoint[1],
  ];
  const pairToTrussCornerConnectorPoints = [
    pairToTrussCornerStartPoint,
    [
      (pairToTrussCornerStartPoint[0] + pairToTrussCornerPoint[0]) / 2,
      pairToTrussCornerStartPoint[1],
    ],
    pairToTrussCornerPoint,
    [
      pairToTrussCornerEndPoint[0],
      (pairToTrussCornerPoint[1] + pairToTrussCornerEndPoint[1]) / 2,
    ],
    pairToTrussCornerEndPoint,
  ];
  const pairToTrussCornerStartAnchors = Array.from({ length: 4 }, (_, cableIndex) =>
    getMessyCableEndpoint(
      westShelfCableCenter,
      Math.PI / 2,
      { length: westShelfCableLength, width: shelfCableBundleWidth },
      cableIndex,
      "end",
    ),
  );
  const pairToTrussCornerEndAnchors = Array.from({ length: 4 }, (_, cableIndex) =>
    getMessyCableEndpoint(
      trussTrackColumnCableCenter,
      Math.PI,
      { length: trussTrackColumnCableLength, width: shelfCableBundleWidth },
      cableIndex,
      "end",
    ),
  );
  const trussFeedPoint = [trussTrackColumnStart[0], 22.95];
  const trussTrackToTrussConnectorPoints = [
    pairToTrussCornerEndPoint,
    [
      pairToTrussCornerEndPoint[0],
      (pairToTrussCornerEndPoint[1] + trussFeedPoint[1]) / 2,
    ],
    trussFeedPoint,
  ];
  const trussTrackToTrussStartAnchors = Array.from({ length: 4 }, (_, cableIndex) =>
    getMessyCableEndpoint(
      trussTrackColumnCableCenter,
      Math.PI,
      { length: trussTrackColumnCableLength, width: shelfCableBundleWidth },
      cableIndex,
      "end",
    ),
  );
  const trussTrackToTrussEndAnchors = getMessyCableRunVariants(0.08).map(({ x }) => [
    trussFeedPoint[0] + x,
    trussFeedPoint[1],
  ]);
  const behindHangarSlidingCameraTripodCenter = [
    hangarSlidingCameraShelfCenter[0],
    hangarSlidingCameraShelfCenter[1] - 1.15,
  ];
  const behindHangarSlidingCameraTripodRotation = Math.atan2(
    -(hangarStageCenter[0] - behindHangarSlidingCameraTripodCenter[0]),
    -(hangarStageCenter[1] - behindHangarSlidingCameraTripodCenter[1]),
  );
  addHangarSlimShelf(
    hangarSlidingCameraShelfCenter,
    0,
    {
      width: slimHangarShelfWidth,
      depth: slimHangarShelfDepth,
      cameraAimTarget: hangarStageCenter,
    },
  );
  [-1, 1].forEach((side) => {
    addCableProtectorTrack(
      offsetPlanPoint(
        hangarSlidingCameraShelfCenter,
        [side * shelfTrackBaseOffset, 0],
        0,
      ),
      Math.PI / 2,
      {
        length: cableTrackLength,
        width: cableTrackWidth,
        yOffset: 0.065,
      },
    );
  });
  addMessyFloorCableRun(westShelfCableCenter, Math.PI / 2, {
    length: westShelfCableLength,
    width: 0.24,
    yOffset: 0.018,
  });
  addMessyFloorCableRun(eastShelfTrackCenter, Math.PI / 2, {
    length: eastShelfCableLength,
    width: eastShelfCableWidth,
    yOffset: 0.018,
  });
  addCurvedFloorCableConnection(eastShelfMonitorConnectorPoints, {
    yOffset: 0.018,
    lateralSpread: eastShelfCableWidth,
    startAnchors: eastShelfMonitorConnectorStartAnchors,
    endAnchors: eastShelfMonitorConnectorEndAnchors,
  });
  addCableProtectorTrack(extraWestShelfTrackCenter, Math.PI / 2, {
    length: cableTrackLength,
    width: cableTrackWidth,
    yOffset: 0.065,
  });
  addCameraTripodRig(
    behindHangarSlidingCameraTripodCenter,
    behindHangarSlidingCameraTripodRotation,
    0.96,
    false,
    {
      proRig: true,
      headYOffset: -0.22,
    },
  );
  addMessyFloorCableRun(underShelfCenterCableCenter, Math.PI, {
    length: underShelfCenterCableLength,
    width: shelfCableBundleWidth,
    yOffset: 0.018,
  });
  addMessyFloorCableRun(centerShelfTrackColumnCableCenter, Math.PI, {
    length: centerShelfTrackColumnCableLength,
    width: 0.24,
    yOffset: 0.018,
  });
  addCurvedFloorCableConnection(underShelfToCenterTrackConnectorPoints, {
    yOffset: 0.018,
    lateralSpread: shelfCableBundleWidth,
    startAnchors: underShelfToCenterTrackStartAnchors,
    endAnchors: underShelfToCenterTrackEndAnchors,
  });
  Array.from({ length: centerShelfTrackColumnCount }, (_, index) => {
    addCableProtectorTrack(
      [
        centerShelfTrackColumnStart[0],
        centerShelfTrackColumnStart[1] + index * cableTrackPairSpacing,
      ],
      Math.PI,
      {
        length: cableTrackLength,
        width: cableTrackWidth,
        yOffset: 0.065,
      },
    );
  });
  addMessyFloorCableRun(trussTrackColumnCableCenter, Math.PI, {
    length: trussTrackColumnCableLength,
    width: 0.24,
    yOffset: 0.018,
  });
  addMessyFloorCableRun(eastTrackRowCableCenter, Math.PI / 2, {
    length: eastTrackRowCableLength,
    width: 0.24,
    yOffset: 0.018,
  });
  addMessyFloorCableRun(upperTrussTrackColumnCableCenter, Math.PI / 2, {
    length: upperTrussTrackColumnCableLength,
    width: 0.24,
    yOffset: 0.018,
  });
  addMessyFloorCableRun(mirroredTrussTrackColumnCableCenter, Math.PI, {
    length: cableTrackLength + (mirroredTrussTrackColumnCount - 1) * cableTrackPairSpacing + 0.36,
    width: 0.24,
    yOffset: 0.018,
  });
  addCurvedFloorCableConnection(pairToTrussCornerConnectorPoints, {
    yOffset: 0.018,
    lateralSpread: shelfCableBundleWidth,
    startAnchors: pairToTrussCornerStartAnchors,
    endAnchors: pairToTrussCornerEndAnchors,
  });
  addCurvedFloorCableConnection(trussTrackToTrussConnectorPoints, {
    yOffset: 0.018,
    lateralSpread: shelfCableBundleWidth,
    startAnchors: trussTrackToTrussStartAnchors,
    endAnchors: trussTrackToTrussEndAnchors,
  });
  addCurvedFloorCableConnection(shelfTrackConnectorPoints, {
    yOffset: 0.018,
    lateralSpread: shelfCableBundleWidth,
    startAnchors: shelfTrackConnectorStartAnchors,
    endAnchors: shelfTrackConnectorEndAnchors,
  });
  Array.from({ length: trussTrackColumnCount }, (_, index) => {
    addCableProtectorTrack(
      [trussTrackColumnStart[0], trussTrackColumnStart[1] + index * cableTrackPairSpacing],
      Math.PI,
      {
        length: cableTrackLength,
        width: cableTrackWidth,
        yOffset: 0.065,
      },
    );
  });
  Array.from({ length: eastTrackRowCount }, (_, index) => {
    addCableProtectorTrack(
      [eastTrackRowStart[0] - index * cableTrackPairSpacing, eastTrackRowStart[1]],
      Math.PI / 2,
      {
        length: cableTrackLength,
        width: cableTrackWidth,
        yOffset: 0.065,
      },
    );
  });
  Array.from({ length: eastTrackRowOppositeCount }, (_, index) => {
    addCableProtectorTrack(
      [eastTrackRowStart[0] + (index + 1) * cableTrackPairSpacing, eastTrackRowStart[1]],
      Math.PI / 2,
      {
        length: cableTrackLength,
        width: cableTrackWidth,
        yOffset: 0.065,
      },
    );
  });
  Array.from({ length: upperTrussTrackColumnCount }, (_, index) => {
    addCableProtectorTrack(
      [upperTrussTrackColumnStart[0] - index * cableTrackPairSpacing, upperTrussTrackColumnStart[1]],
      Math.PI / 2,
      {
        length: cableTrackLength,
        width: cableTrackWidth,
        yOffset: 0.065,
      },
    );
  });
  Array.from({ length: upperTrussTrackColumnOppositeCount }, (_, index) => {
    addCableProtectorTrack(
      [upperTrussTrackColumnStart[0] + (index + 1) * cableTrackPairSpacing, upperTrussTrackColumnStart[1]],
      Math.PI / 2,
      {
        length: cableTrackLength,
        width: cableTrackWidth,
        yOffset: 0.065,
      },
    );
  });
  Array.from({ length: mirroredTrussTrackColumnCount }, (_, index) => {
    addCableProtectorTrack(
      [mirroredTrussTrackColumnStart[0], mirroredTrussTrackColumnStart[1] - index * cableTrackPairSpacing],
      Math.PI,
      {
        length: cableTrackLength,
        width: cableTrackWidth,
        yOffset: 0.065,
      },
    );
  });
  const hangarStageTrussPlacements = [
    { center: [12, 24], rotation: THREE.MathUtils.degToRad(135) },
    { center: [1, 24], rotation: THREE.MathUtils.degToRad(225) },
    { center: [12, 36], rotation: THREE.MathUtils.degToRad(45) },
    { center: [1, 36], rotation: THREE.MathUtils.degToRad(315) },
  ];
  const hangarStageChairConfigs = [
    { center: [9.1, 30.0] },
    { center: [3.9, 30.0] },
    { center: [6.5, 32.7], rotation: Math.PI },
  ];
  const stageSideMonitorCenters = [
    [1.0, 24.0],
    [12.0, 24.0],
  ].map(([x, z]) => {
    const dx = hangarStageCenter[0] - x;
    const dz = hangarStageCenter[1] - z;
    const length = Math.hypot(dx, dz) || 1;
    const inwardOffset = 0.32;
    return [x + (dx / length) * inwardOffset, z + (dz / length) * inwardOffset];
  });
  addHangarCenterStructure(hangarStageCenter, hangarStageTrussPlacements);
  addCenterStageRoundTable(hangarStageCenter, 4.2);
  stageSideMonitorCenters.forEach((monitorCenter) => {
    addTallVerticalMonitor(
      monitorCenter,
      Math.atan2(
        hangarStageCenter[0] - monitorCenter[0],
        hangarStageCenter[1] - monitorCenter[1],
      ),
      { suspended: true },
    );
  });
  const circleTableChairSeats = [
    [9.1, 30.0],
    [3.9, 30.0],
  ];
  hangarStageChairConfigs.forEach(({ center: chairCenter, rotation }) => {
    const chairRotation =
      rotation ??
      Math.atan2(
        hangarStageCenter[0] - chairCenter[0],
        hangarStageCenter[1] - chairCenter[1],
      );
    const isOccupied = circleTableChairSeats.some(
      ([x, z]) => Math.abs(chairCenter[0] - x) < 0.01 && Math.abs(chairCenter[1] - z) < 0.01,
    );
    addOversizedSwivelChair(chairCenter, chairRotation, {
      registerAsSeat: !isOccupied,
    });
    if (isOccupied) {
      const towardTable = 0.08;
      const characterPos = [
        chairCenter[0] + (hangarStageCenter[0] - chairCenter[0]) * towardTable,
        chairCenter[1] + (hangarStageCenter[1] - chairCenter[1]) * towardTable,
      ];
      addSeatedCharacter({
        planPosition: characterPos,
        rotation: chairRotation + Math.PI,
        seatHeight: 0.62,
        pose: {
          ...SITTING_POSE,
          verticalOffset: 0.14,
          leftArmRotationX: 1.2,
          rightArmRotationX: 1.16,
        },
        hairColor: "#4a3d32",
        tieColor: "#9f6745",
        suitColor: "#434d56",
        shirtColor: "#f3efe6",
      });
    }
    addStudioTableMicrophone(hangarStageCenter, chairCenter, 4.2 / 2, 0.96);
  });
  addHangarRingGong([1.8, 34.9], Math.PI - THREE.MathUtils.degToRad(15));
  addHangarRearShelf(HANGAR_REAR_SHELF_CENTER);
  hangarStageTrussPlacements.forEach(({ center, rotation }) => {
    addTrussArch(center, rotation);
  });
  addTrussBarLight([12, 24], [10, 22.5]);
  addTrussHangingLightRod([11.7, 23.8], 1.2, 2.2, 0.4, THREE.MathUtils.degToRad(-30), 0.3, [10, 22.5]);
  addSingleLayerDesk(eastHangarDeskCenter, eastHangarDeskRotation, eastHangarDeskWidth);
  addDeskPaperAndMarkers(eastHangarDeskCenter, eastHangarDeskRotation, {
    deskWidth: 2.6,
    deskDepth: 1.18,
    deskHeight: 0.64,
    localOffset: [0.12, 0.03],
    variant: "c",
  });
  addDeskCornerMonitor(eastHangarDeskCenter, eastHangarDeskRotation, {
    deskWidth: 2.6,
    deskDepth: 1.18,
    deskHeight: 0.64,
  });
  addDeskCornerMonitorAt([6.5, 19.85], Math.PI / 2, 1.18);
  const eastDeskChairCenter = [10, 22.5];
  const eastDeskChairRotation = Math.atan2(
    eastHangarDeskCenter[0] - eastDeskChairCenter[0],
    eastHangarDeskCenter[1] - eastDeskChairCenter[1],
  );
  addRollingChair(eastDeskChairCenter, eastDeskChairRotation, { registerAsSeat: false });
  const tyler = addSeatedCharacter({
    planPosition: eastDeskChairCenter,
    rotation: eastHangarDeskRotation,
    seatHeight: 0.48,
    hairColor: "#8b6f47",
    tieColor: "#9f6745",
    suitColor: "#434d56",
    shirtColor: "#f3efe6",
  });
  if (tyler) {
    registerChatNpc(tyler, {
      promptEyebrow: "Tyler",
      promptTitle: "Press E to talk",
      lines: ["Hey.", "What's up?", "Busy with the desk."],
    });
  }
  addRug([4.2, 13.5], [2.4, 1.6], "#3c3f43", Math.PI);
  addRug([1.85, 13.5], [2.4, 1.6], "#3c3f43", Math.PI + THREE.MathUtils.degToRad(10));
  addRug([0.5, 14.9], [2.4, 1.6], "#3c3f43", Math.PI + THREE.MathUtils.degToRad(70));
  addRug([-0.5, 16.6], [2.4, 1.6], "#3c3f43", Math.PI + THREE.MathUtils.degToRad(83));
  addRug([-1.1, 18.9], [2.4, 1.6], "#3c3f43", Math.PI / 2);
  addRug([-1.1, 20.5], [2.4, 1.6], "#3c3f43", Math.PI / 2 + THREE.MathUtils.degToRad(12));
  addPlanBlock({
    center: [-1.35, 19.625],
    size: [0.09, 0.006, 0.95],
    centerY: 0.045,
    material: new THREE.MeshStandardMaterial({
      color: "#f28c28",
      roughness: 0.92,
      metalness: 0.02,
    }),
    group: furnishingGroup,
  });
  addStandingTable(westSideTableCenter, westSideTableRotation, 1.85);
  addWestSideDeskProps(westSideTableCenter, westSideTableRotation);
  addTallDeskStool(
    [8.2, 14.0],
    westSideTableRotation + 0.16,
  );
  addWestSideStandingTv([2.53, 15.77], westSideTableRotation);
  addStandingTable(eastSideTableCenter, eastSideTableRotation, 1.85);
  addProductionDeskSetup(eastSideTableCenter, eastSideTableRotation);
  addTallDeskStool(
    [3.8, 14.5],
    eastSideTableRotation - 0.14,
  );

  const wardrobeWidth = 2.68;
  const wardrobeDepth = 0.56;
  const wardrobeHeight = 1.9;
  const wardrobeRailY = 1.64;
  const wardrobeTopY = 1.84;
  const chromeRackMaterial = new THREE.MeshStandardMaterial({
    color: "#e5eaee",
    roughness: 0.14,
    metalness: 0.96,
  });
  const matteBlackMaterial = new THREE.MeshStandardMaterial({
    color: "#151719",
    roughness: 0.72,
    metalness: 0.1,
  });
  const shirtSpecs = [
    { body: "#ffffff", trim: "#e6e6e2" },
    { body: "#8bb7ff", trim: "#6898df" },
    { body: "#f4f2ed", trim: "#dddad3" },
    { body: "#ffb347", trim: "#e0932c" },
    { body: "#eef3f8", trim: "#d7dee6" },
    { body: "#6de2d1", trim: "#4cc8b7" },
    { body: "#fbfbf7", trim: "#e7e7e1" },
    { body: "#d59cff", trim: "#bb7fe4" },
  ];
  const wardrobeCenterX = 1.45 - westShift;

  function addDressShirtWardrobe(center, rotation) {
    const wardrobeRack = new THREE.Group();

    [
      [-wardrobeWidth / 2 + 0.07, wardrobeHeight / 2, -wardrobeDepth / 2 + 0.06],
      [wardrobeWidth / 2 - 0.07, wardrobeHeight / 2, -wardrobeDepth / 2 + 0.06],
      [-wardrobeWidth / 2 + 0.07, wardrobeHeight / 2, wardrobeDepth / 2 - 0.06],
      [wardrobeWidth / 2 - 0.07, wardrobeHeight / 2, wardrobeDepth / 2 - 0.06],
    ].forEach(([x, y, z]) => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.017, 0.017, wardrobeHeight, 12),
        chromeRackMaterial,
      );
      post.position.set(x, y, z);
      wardrobeRack.add(post);
    });

    [
      [0, wardrobeTopY, -wardrobeDepth / 2 + 0.06, wardrobeWidth - 0.14],
      [0, wardrobeTopY, wardrobeDepth / 2 - 0.06, wardrobeWidth - 0.14],
      [0, 0.08, -wardrobeDepth / 2 + 0.06, wardrobeWidth - 0.14],
      [0, 0.08, wardrobeDepth / 2 - 0.06, wardrobeWidth - 0.14],
    ].forEach(([x, y, z, length]) => {
      const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, length, 12),
        chromeRackMaterial,
      );
      rail.rotation.z = Math.PI / 2;
      rail.position.set(x, y, z);
      wardrobeRack.add(rail);
    });

    [
      [-wardrobeWidth / 2 + 0.07, 0.08, 0, wardrobeDepth - 0.12],
      [wardrobeWidth / 2 - 0.07, 0.08, 0, wardrobeDepth - 0.12],
      [-wardrobeWidth / 2 + 0.07, wardrobeTopY, 0, wardrobeDepth - 0.12],
      [wardrobeWidth / 2 - 0.07, wardrobeTopY, 0, wardrobeDepth - 0.12],
    ].forEach(([x, y, z, length]) => {
      const rail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, length, 12),
        chromeRackMaterial,
      );
      rail.rotation.x = Math.PI / 2;
      rail.position.set(x, y, z);
      wardrobeRack.add(rail);
    });

    const baseShelf = new THREE.Mesh(
      new THREE.BoxGeometry(wardrobeWidth - 0.18, 0.05, wardrobeDepth - 0.12),
      matteBlackMaterial,
    );
    baseShelf.position.set(0, 0.12, 0);
    wardrobeRack.add(baseShelf);

    const shirtCount = shirtSpecs.length;
    const shirtSpan = wardrobeWidth - 0.48;
    const shirtStartX = -shirtSpan / 2;
    const shirtStep = shirtCount > 1 ? shirtSpan / (shirtCount - 1) : 0;
    shirtSpecs.forEach(({ body, trim }, index) => {
      const shirt = new THREE.Group();
      const hangerX = shirtStartX + shirtStep * index;
      const shirtMaterial = new THREE.MeshStandardMaterial({
        color: body,
        roughness: 0.94,
        metalness: 0.02,
      });
      const cuffMaterial = new THREE.MeshStandardMaterial({
        color: trim,
        roughness: 0.95,
        metalness: 0.02,
      });

      const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.026, 0.004, 8, 18, Math.PI),
        chromeRackMaterial,
      );
      hook.position.set(0, wardrobeRailY + 0.07, -0.04);
      hook.rotation.z = Math.PI / 2;
      shirt.add(hook);

      const hangerBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.24, 10),
        chromeRackMaterial,
      );
      hangerBar.rotation.z = Math.PI / 2;
      hangerBar.position.set(0, wardrobeRailY + 0.025, -0.04);
      shirt.add(hangerBar);

      const torso = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.76, 0.08),
        shirtMaterial,
      );
      torso.position.set(0, wardrobeRailY - 0.39, -0.01);
      shirt.add(torso);

      [-0.14, 0.14].forEach((sleeveX, sleeveIndex) => {
        const sleeve = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.52, 0.075),
          shirtMaterial,
        );
        sleeve.position.set(sleeveX, wardrobeRailY - 0.31, -0.01);
        sleeve.rotation.z = sleeveIndex === 0 ? 0.5 : -0.5;
        shirt.add(sleeve);
      });

      [-0.05, 0.05].forEach((collarX, collarIndex) => {
        const collar = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.09, 0.085),
          cuffMaterial,
        );
        collar.position.set(collarX, wardrobeRailY - 0.03, 0.005);
        collar.rotation.z = collarIndex === 0 ? 0.36 : -0.36;
        shirt.add(collar);
      });

      const placket = new THREE.Mesh(
        new THREE.BoxGeometry(0.026, 0.7, 0.086),
        cuffMaterial,
      );
      placket.position.set(0, wardrobeRailY - 0.4, 0.005);
      shirt.add(placket);

      shirt.position.set(hangerX, 0, 0);
      shirt.rotation.y = Math.PI / 2 + (index % 2 === 0 ? 0.04 : -0.04);
      wardrobeRack.add(shirt);
    });

    [-1.02, -0.52, 0.58, 1.0].forEach((hangerX, index) => {
      const spareHanger = new THREE.Group();
      const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.026, 0.004, 8, 18, Math.PI),
        chromeRackMaterial,
      );
      hook.position.set(0, wardrobeRailY + 0.07, -0.04);
      hook.rotation.z = Math.PI / 2;
      spareHanger.add(hook);

      const hangerBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.24, 10),
        chromeRackMaterial,
      );
      hangerBar.rotation.z = Math.PI / 2;
      hangerBar.position.set(0, wardrobeRailY + 0.025, -0.04);
      spareHanger.add(hangerBar);

      const leftArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, 0.14, 10),
        chromeRackMaterial,
      );
      leftArm.position.set(-0.06, wardrobeRailY - 0.015, -0.04);
      leftArm.rotation.z = 1.02;
      spareHanger.add(leftArm);

      const rightArm = leftArm.clone();
      rightArm.position.x = 0.06;
      rightArm.rotation.z = -1.02;
      spareHanger.add(rightArm);

      spareHanger.position.set(hangerX, 0, index % 2 === 0 ? -0.02 : 0.02);
      spareHanger.rotation.y = Math.PI / 2;
      wardrobeRack.add(spareHanger);
    });

    const foldedStack = new THREE.Group();
    ["#ffffff", "#d9e6f2", "#f3efe6"].forEach((color, index) => {
      const fold = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.05, 0.22),
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.95,
          metalness: 0.02,
        }),
      );
      fold.position.set(0, 0.15 + index * 0.045, 0);
      foldedStack.add(fold);
    });
    foldedStack.position.set(wardrobeWidth / 2 - 0.34, 0.12, 0);
    wardrobeRack.add(foldedStack);

    enableShadows(wardrobeRack);
    placePlanObject(wardrobeRack, center, 0, rotation, furnishingGroup);
    pushPlanRectCollider(center, wardrobeWidth, wardrobeDepth, rotation, PLAYER_RADIUS * 0.08);
  }

  const primaryWardrobeCenter = [wardrobeCenterX, HANGAR_GREENSCREEN_PROP_BASE_Z + 0.94];
  const duplicateWardrobeCenter = [wardrobeCenterX - 3.4, HANGAR_GREENSCREEN_PROP_BASE_Z + 4.22];
  addDressShirtWardrobe(primaryWardrobeCenter, 0);
  addDressShirtWardrobe(duplicateWardrobeCenter, Math.PI / 2);

  const mirrorCorner = [
    duplicateWardrobeCenter[0] + wardrobeDepth / 2,
    primaryWardrobeCenter[1] + wardrobeDepth / 2,
  ];
  const mirrorOffset = 0.54;
  const diagonalUnit = Math.SQRT1_2;
  const mirrorCenter = [
    mirrorCorner[0] + mirrorOffset * diagonalUnit,
    mirrorCorner[1] + mirrorOffset * diagonalUnit,
  ];
  const mirror = new THREE.Group();
  const mirrorHeight = 2.16;
  const centerPanelWidth = 0.96;
  const sidePanelWidth = 0.38;
  const panelThickness = 0.035;
  const sidePanelAngle = 0.52;
  const sidePanelOffsetX = centerPanelWidth / 2 + Math.cos(sidePanelAngle) * (sidePanelWidth / 2);
  const sidePanelOffsetZ = Math.sin(sidePanelAngle) * (sidePanelWidth / 2);
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: "#15181b",
    roughness: 0.72,
    metalness: 0.18,
  });
  const lightBarMaterial = new THREE.MeshStandardMaterial({
    color: "#f7f7f2",
    emissive: "#ffffff",
    emissiveIntensity: 0.7,
    roughness: 0.18,
    metalness: 0.08,
  });
  const staticMirrorMaterial = new THREE.MeshStandardMaterial({
    color: "#f4f4ef",
    roughness: 0.9,
    metalness: 0.01,
  });
  const farMirrorMaterial = new THREE.MeshStandardMaterial({
    color: "#f4f4ef",
    roughness: 0.9,
    metalness: 0.01,
  });

  const addMirrorPanel = (
    parent,
    width,
    position,
    rotation = 0,
    lightWidth = width * 0.74,
    reflective = false,
    glassMaterial = null,
  ) => {
    const panel = new THREE.Group();
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(width, mirrorHeight, panelThickness),
      frameMaterial,
    );
    frame.position.y = mirrorHeight / 2;
    panel.add(frame);

    const mirrorBack = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.08, mirrorHeight - 0.12, 0.012),
      new THREE.MeshStandardMaterial({
        color: "#090b0d",
        roughness: 0.7,
        metalness: 0.12,
      }),
    );
    mirrorBack.position.set(0, mirrorHeight / 2, -0.012);
    panel.add(mirrorBack);

    const glass = reflective
      ? new Reflector(
          new THREE.PlaneGeometry(width - 0.08, mirrorHeight - 0.12),
          {
            clipBias: 0.01,
            textureWidth: 384,
            textureHeight: 768,
            color: 0xcfd7df,
          },
        )
      : new THREE.Mesh(
          new THREE.PlaneGeometry(width - 0.08, mirrorHeight - 0.12),
          glassMaterial ?? staticMirrorMaterial,
        );
    glass.position.set(0, mirrorHeight / 2, panelThickness * 0.56);
    panel.add(glass);

    const farGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(width - 0.08, mirrorHeight - 0.12),
      farMirrorMaterial.clone(),
    );
    farGlass.position.set(0, mirrorHeight / 2, panelThickness * 0.52);
    farGlass.visible = false;
    panel.add(farGlass);

    mirrorDistanceLods.push({
      reflective: glass,
      fallback: farGlass,
      threshold: 8,
    });

    const topLight = new THREE.Mesh(
      new THREE.BoxGeometry(lightWidth, 0.045, 0.028),
      lightBarMaterial,
    );
    topLight.position.set(0, mirrorHeight - 0.08, -0.01);
    panel.add(topLight);

    const baseRail = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.04, 0.03, 0.028),
      frameMaterial,
    );
    baseRail.position.set(0, 0.05, 0.01);
    panel.add(baseRail);

    panel.position.set(position[0], 0, position[2]);
    panel.rotation.y = rotation;
    parent.add(panel);
    return glass;
  };

  addMirrorPanel(mirror, centerPanelWidth, [0, 0, 0], 0, 0.74, false, staticMirrorMaterial);
  const sharedSideMirrorMaterial = staticMirrorMaterial;
  addMirrorPanel(
    mirror,
    sidePanelWidth,
    [-sidePanelOffsetX, 0, sidePanelOffsetZ],
    sidePanelAngle,
    0.25,
    false,
    sharedSideMirrorMaterial,
  );
  addMirrorPanel(
    mirror,
    sidePanelWidth,
    [sidePanelOffsetX, 0, sidePanelOffsetZ],
    -sidePanelAngle,
    0.25,
    false,
    sharedSideMirrorMaterial,
  );

  [-centerPanelWidth / 2, centerPanelWidth / 2].forEach((x) => {
    const seamPost = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, mirrorHeight, 0.04),
      frameMaterial,
    );
    seamPost.position.set(x, mirrorHeight / 2, 0.002);
    mirror.add(seamPost);
  });

  [
    [-sidePanelOffsetX, 0.01, sidePanelOffsetZ - 0.06, sidePanelAngle],
    [0, 0.01, 0.12, 0],
    [sidePanelOffsetX, 0.01, sidePanelOffsetZ - 0.06, -sidePanelAngle],
  ].forEach(([x, y, z, rotation]) => {
    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.02, 0.045),
      frameMaterial,
    );
    foot.position.set(x, y, z);
    foot.rotation.y = rotation;
    mirror.add(foot);
  });

  const mirrorLightBar = new THREE.Group();
  const lightHousing = new THREE.Mesh(
    new THREE.BoxGeometry(centerPanelWidth + 0.08, 0.08, 0.08),
    frameMaterial,
  );
  lightHousing.position.set(0, mirrorHeight + 0.08, -0.03);
  mirrorLightBar.add(lightHousing);

  const lightDiffuser = new THREE.Mesh(
    new THREE.BoxGeometry(centerPanelWidth - 0.06, 0.028, 0.04),
    lightBarMaterial,
  );
  lightDiffuser.position.set(0, mirrorHeight + 0.045, -0.03);
  mirrorLightBar.add(lightDiffuser);

  const dressingLight = new THREE.SpotLight("#fff8e8", 5.5, 3.8, 0.62, 0.55, 1.5);
  dressingLight.position.set(0, mirrorHeight + 0.03, -0.02);
  dressingLight.castShadow = false;
  mirrorLightBar.add(dressingLight);

  const dressingLightTarget = new THREE.Object3D();
  dressingLightTarget.position.set(0, 0.82, 0.34);
  mirrorLightBar.add(dressingLightTarget);
  dressingLight.target = dressingLightTarget;

  mirror.add(mirrorLightBar);

  enableShadows(mirror);
  placePlanObject(mirror, mirrorCenter, 0, Math.PI / 4, furnishingGroup);
  pushPlanRectCollider(mirrorCenter, 1.5, 0.66, Math.PI / 4, PLAYER_RADIUS * 0.06);
}

function addBedroom() {
  addBed([10.55, 1.4], [1.72, 2.1], Math.PI / 2);
  addDesk([9.35, 1.0], [1.55, 0.72], 0);
  addBoxFurniture({
    center: [11.3, 2.3],
    size: [0.46, 1.95, 1.98],
    color: "#7a6b60",
    collider: true,
  });
  addChair([8.95, 2.25], Math.PI / 2);
}

function addUtilityRoom() {
  addBoxFurniture({
    center: [8.8, 4.95],
    size: [1.2, 0.58, 0.92],
    color: "#7b8573",
    topColor: "#d7ddd1",
    collider: true,
  });
  addBoxFurniture({
    center: [11.28, 4.6],
    size: [0.42, 2.1, 2.08],
    color: "#8c7d72",
    collider: true,
  });
}

function addBathZone() {
  addBoxFurniture({
    center: [8.58, 6.55],
    size: [1.05, 0.54, 0.9],
    color: "#d5d4d0",
    topColor: "#f4f2ec",
    collider: true,
  });
  addBoxFurniture({
    center: [8.62, 5.95],
    size: [1.05, 0.54, 0.9],
    color: "#d5d4d0",
    topColor: "#f4f2ec",
    collider: true,
  });
}

function addStudio() {
  addDesk([9.6, 9.8], [1.45, 0.72], 0);
  addBoxFurniture({
    center: [11.1, 9.65],
    size: [0.4, 1.55, 1.85],
    color: "#726960",
    collider: true,
  });
  addChair([8.7, 9.95]);
}

function addP1P10CornerArchitecture() {
  const plasterMaterial = new THREE.MeshStandardMaterial({
    color: "#efebe2",
    roughness: 0.94,
    metalness: 0.02,
  });
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: "#2a241f",
    roughness: 0.9,
    metalness: 0.08,
  });
  const backingMaterial = new THREE.MeshStandardMaterial({
    color: "#131313",
    roughness: 0.97,
    metalness: 0.02,
  });
  const steelMaterial = new THREE.MeshStandardMaterial({
    color: "#3b3d3f",
    roughness: 0.56,
    metalness: 0.52,
  });

  addPlanBlock({
    center: [2.15, 7.86],
    size: [4.45, 1.56, 2.48],
    centerY: 4.08,
    material: plasterMaterial,
    group: architectureGroup,
  });
  addPlanBlock({
    center: [3.55, 8.95],
    size: [6.05, 1.44, 0.34],
    centerY: 3.9,
    material: plasterMaterial,
    group: architectureGroup,
  });
  addPlanBlock({
    center: [0.34, 8.88],
    size: [0.42, 1.3, 1.28],
    centerY: 3.88,
    material: plasterMaterial,
    group: architectureGroup,
  });

  const westShelf = createShelfModule({
    size: [3.1, 2.44, 0.42],
    columns: 3,
    rows: 3,
    frameMaterial,
    backingMaterial,
  });
  placePlanObject(westShelf, [0.58, 7.1], 0, -Math.PI / 2, architectureGroup);
  pushPlanRectCollider([0.58, 7.1], 3.1, 0.42, -Math.PI / 2, PLAYER_RADIUS * 0.14);

  const northShelf = createShelfModule({
    size: [5.55, 2.18, 0.44],
    columns: 7,
    rows: 3,
    frameMaterial,
    backingMaterial,
  });
  placePlanObject(northShelf, [3.58, 8.78], 0, 0, architectureGroup);
  pushPlanRectCollider([3.58, 8.78], 5.55, 0.44, 0, PLAYER_RADIUS * 0.14);

  const floatingShelf = createShelfModule({
    size: [1.78, 1.02, 0.32],
    columns: 2,
    rows: 1,
    frameMaterial,
    backingMaterial,
  });
  placePlanObject(floatingShelf, [1.95, 8.02], 1.68, 0, architectureGroup);

  const lowShelf = createShelfModule({
    size: [1.18, 0.82, 0.28],
    columns: 2,
    rows: 1,
    frameMaterial,
    backingMaterial,
  });
  placePlanObject(lowShelf, [9.25, -0.72], 0, 0, architectureGroup);
  pushPlanRectCollider([9.25, -0.72], 1.18, 0.28, 0, PLAYER_RADIUS * 0.08);

  const tvMount = new THREE.Group();
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.16, 0.78),
    steelMaterial,
  );
  arm.position.set(0, 0, 0.15);
  tvMount.add(arm);
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(1.04, 0.58, 0.08),
    new THREE.MeshStandardMaterial({
      color: "#121314",
      map: createDisplaySceneTexture("aurora"),
      emissive: "#090a0b",
      emissiveIntensity: 0.22,
      roughness: 0.34,
      metalness: 0.08,
    }),
  );
  screen.position.set(0, 0, -0.2);
  tvMount.add(screen);
  enableShadows(tvMount);
  placePlanObject(tvMount, [4.48, 8.48], 2.1, 0, architectureGroup);

  const pendant = new THREE.Group();
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 1.48, 10),
    new THREE.MeshStandardMaterial({ color: "#d7d1c5", roughness: 0.82 }),
  );
  cord.position.y = 0.74;
  pendant.add(cord);
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.1, 0.34, 16),
    new THREE.MeshStandardMaterial({
      color: "#f2ede4",
      roughness: 0.88,
      emissive: "#f7e5c4",
      emissiveIntensity: 0.18,
    }),
  );
  shade.position.y = 0.16;
  pendant.add(shade);
  enableShadows(pendant);
  placePlanObject(pendant, [4.58, 8.18], 2.54, 0, architectureGroup);

}

function addP1P10CurvedCeiling() {
  const slatMaterial = new THREE.MeshStandardMaterial({
    color: "#171615",
    roughness: 0.96,
    metalness: 0.05,
  });
  const canopyMaterial = new THREE.MeshStandardMaterial({
    color: "#1f1d1b",
    roughness: 0.94,
    metalness: 0.04,
  });
  const zCenter = toWorldPoint([0, 8.06]).z;
  const zLength = 4.9;
  const archCenter = 5.15;
  const radius = 2.45;
  const baseY = 2.95;
  const peakHeight = 2.72;

  for (let i = 0; i < 22; i += 1) {
    const t = i / 21;
    const planX = THREE.MathUtils.lerp(2.45, 7.38, t);
    const normalized = (planX - archCenter) / radius;
    if (Math.abs(normalized) >= 0.98) {
      continue;
    }
    const archFactor = Math.sqrt(1 - normalized * normalized);
    const y = baseY + archFactor * peakHeight;
    const slope = (-peakHeight * normalized) / Math.max(0.15, radius * archFactor);
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.54, zLength),
      slatMaterial,
    );
    slat.position.set(toWorldPoint([planX, 0]).x, y, zCenter);
    slat.rotation.z = Math.atan(slope);
    slat.castShadow = true;
    slat.receiveShadow = true;
    architectureGroup.add(slat);
  }

  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(4.85, 0.14, zLength),
    canopyMaterial,
  );
  canopy.position.set(toWorldPoint([4.96, 0]).x, 5.45, zCenter);
  canopy.rotation.z = -0.2;
  canopy.castShadow = true;
  canopy.receiveShadow = true;
  architectureGroup.add(canopy);
}

function addP1P10Ductwork() {
  const ductMaterial = new THREE.MeshStandardMaterial({
    color: "#a5adb4",
    roughness: 0.38,
    metalness: 0.68,
  });
  const ventMaterial = new THREE.MeshStandardMaterial({
    color: "#f0ebe3",
    roughness: 0.72,
    metalness: 0.16,
  });

  const elbow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 1.35, 24),
    ductMaterial,
  );
  elbow.rotation.z = Math.PI / 2;
  elbow.position.set(toWorldPoint([2.58, 7.38]).x, 4.72, toWorldPoint([2.58, 7.38]).z);
  elbow.castShadow = true;
  elbow.receiveShadow = true;
  architectureGroup.add(elbow);

  const drop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 1.45, 20),
    ductMaterial,
  );
  drop.position.set(toWorldPoint([5.98, 7.45]).x, 5.16, toWorldPoint([5.98, 7.45]).z);
  drop.castShadow = true;
  drop.receiveShadow = true;
  architectureGroup.add(drop);

  const diffuser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.08, 28),
    ventMaterial,
  );
  diffuser.position.set(toWorldPoint([5.98, 7.45]).x, 4.46, toWorldPoint([5.98, 7.45]).z);
  diffuser.castShadow = true;
  diffuser.receiveShadow = true;
  architectureGroup.add(diffuser);

  const puck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.1, 24),
    new THREE.MeshStandardMaterial({
      color: "#ece6dd",
      roughness: 0.8,
      emissive: "#f6e2bd",
      emissiveIntensity: 0.14,
    }),
  );
  puck.position.set(toWorldPoint([1.92, 7.36]).x, 5.72, toWorldPoint([1.92, 7.36]).z);
  puck.castShadow = true;
  puck.receiveShadow = true;
  architectureGroup.add(puck);
}

function addP1P10ShelfDecor() {
  const shelfDepth = 0.42;
  const westShelfX = OUTER_WALL_THICKNESS / 2 + shelfDepth / 2 + 0.03;
  const northShelfZ = LEFT_ROOM_DEPTH - (OUTER_WALL_THICKNESS / 2 + shelfDepth / 2 + 0.03);
  const westShelfFrontX = westShelfX + 0.1;
  const northShelfFrontZ = northShelfZ - 0.09;
  const bottomShelfY = 0.08;
  const middleShelfY = 0.86;
  const topShelfY = 1.72;
  const shelfTopY = 2.54;

  addBookCluster({ center: [westShelfFrontX, 4.45], y: bottomShelfY, count: 12, rotation: -Math.PI / 2 });
  addBookCluster({ center: [westShelfFrontX, 5.28], y: bottomShelfY, count: 8, rotation: -Math.PI / 2 });
  addBookCluster({ center: [westShelfFrontX, 6.82], y: bottomShelfY, count: 7, rotation: -Math.PI / 2 });
  addBookCluster({ center: [westShelfFrontX, 6.08], y: middleShelfY, count: 14, rotation: -Math.PI / 2 });
  addBookCluster({ center: [westShelfFrontX, 4.88], y: middleShelfY, count: 6, rotation: -Math.PI / 2 });
  addBookCluster({
    center: [westShelfFrontX, 7.02],
    y: middleShelfY,
    count: 7,
    rotation: -Math.PI / 2,
    palette: ["#d4d8de", "#778292", "#8a5e49", "#5e6367"],
  });
  addBookCluster({ center: [westShelfFrontX, 7.78], y: topShelfY, count: 8, rotation: -Math.PI / 2 });
  addBookCluster({ center: [westShelfFrontX, 5.78], y: topShelfY, count: 5, rotation: -Math.PI / 2 });
  addBookCluster({ center: [1.1, northShelfFrontZ], y: bottomShelfY, count: 10 });
  addBookCluster({ center: [2.02, northShelfFrontZ], y: bottomShelfY, count: 8 });
  addBookCluster({ center: [3.18, northShelfFrontZ], y: bottomShelfY, count: 9 });
  addBookCluster({ center: [2.08, northShelfFrontZ], y: middleShelfY, count: 14 });
  addBookCluster({ center: [0.82, northShelfFrontZ], y: middleShelfY, count: 7 });
  addBookCluster({
    center: [3.34, northShelfFrontZ],
    y: middleShelfY,
    count: 12,
    palette: ["#d1d4d8", "#8d95a3", "#615c72", "#485e88", "#7e4654", "#a64e3d"],
  });
  addBookCluster({
    center: [0.84, northShelfFrontZ],
    y: topShelfY,
    count: 6,
    palette: ["#e2e4e8", "#8c95a5", "#635c57", "#a56843"],
  });
  addBookCluster({ center: [2.48, northShelfFrontZ], y: topShelfY, count: 7 });
  addBookCluster({ center: [3.55, northShelfFrontZ], y: topShelfY, count: 6 });
  addPictureFrame({ center: [westShelfFrontX + 0.01, 5.18], y: middleShelfY + 0.02, size: [0.7, 0.52], rotation: -Math.PI / 2 });
  addPictureFrame({ center: [westShelfFrontX + 0.01, 7.12], y: topShelfY + 0.02, size: [0.48, 0.48], rotation: -Math.PI / 2 });
  addPictureFrame({ center: [westShelfFrontX + 0.01, 6.34], y: bottomShelfY + 0.02, size: [0.58, 0.44], rotation: -Math.PI / 2 });
  addPictureFrame({ center: [1.78, northShelfFrontZ], y: topShelfY + 0.02, size: [0.88, 0.52] });
  addPictureFrame({ center: [3.26, northShelfFrontZ], y: bottomShelfY + 0.02, size: [0.72, 0.42] });
  addPictureFrame({ center: [0.72, northShelfFrontZ], y: middleShelfY + 0.02, size: [0.58, 0.42] });
  addPlant({ center: [2.72, northShelfFrontZ], y: middleShelfY, scale: 0.88 });
  addPlant({ center: [0.72, northShelfFrontZ], y: shelfTopY, scale: 0.72 });
  addBootPair({ center: [3.78, northShelfFrontZ], y: 0.04 });
  addBootPair({ center: [westShelfFrontX + 0.01, 4.12], y: 0.04 });
  addDigitalClock({ center: [1.08, northShelfFrontZ], y: topShelfY + 0.02, text: "4:27" });
  addDigitalClock({ center: [westShelfFrontX + 0.01, 8.26], y: shelfTopY, text: "12:08" });
  addLetterTile({ center: [2.92, northShelfFrontZ], y: topShelfY + 0.04, label: "T" });
  addLetterTile({ center: [3.5, northShelfFrontZ], y: shelfTopY, label: "S" });
  addDecorDisc({ center: [3.88, northShelfFrontZ], y: topShelfY + 0.2, radius: 0.28 });
  addDecorDisc({ center: [1.24, northShelfFrontZ], y: shelfTopY + 0.2, radius: 0.22 });
  addDecorDisc({ center: [westShelfFrontX + 0.02, 5.52], y: shelfTopY + 0.18, radius: 0.2 });
  addTrophy({ center: [westShelfFrontX + 0.01, 6.58], y: middleShelfY, scale: 0.9 });
  addTrophy({ center: [2.14, northShelfFrontZ], y: shelfTopY, scale: 1.02 });
  addMiniGong({ center: [westShelfFrontX + 0.02, 7.54], y: shelfTopY, scale: 0.72, rotation: -Math.PI / 2 });
  addDisplayCaseDecor({ center: [3.08, northShelfFrontZ], y: shelfTopY, rotation: 0 });
  addDisplayCaseDecor({ center: [westShelfFrontX + 0.01, 5.1], y: topShelfY, rotation: -Math.PI / 2, size: [0.34, 0.22, 0.2] });
}

function addP1P10CornerLighting() {
  [
    { center: [2.15, 8.15], y: 4.34, color: "#ffe7c2", intensity: 0.7, distance: 5.4 },
    { center: [5.72, 8.22], y: 4.2, color: "#ffe2b7", intensity: 0.62, distance: 5.6 },
    { center: [0.82, 6.52], y: 2.1, color: "#d7e6f2", intensity: 0.34, distance: 3.8 },
  ].forEach(({ center, y, color, intensity, distance }) => {
    const worldPoint = toWorldPoint(center);
    const light = new THREE.PointLight(color, intensity, distance, 2);
    light.position.set(worldPoint.x, y, worldPoint.z);
    scene.add(light);
  });
}

function addP1P10CornerFurnishings() {
  addFeatureRug([2.45, 7.02], [4.05, 3.18]);
  addLSectional({
    corner: [0.87, 8.06],
    horizontalLength: 3.25,
    verticalLength: 2.98,
    depth: 1.0,
    flipTopRun: true,
    westOffset: 0.3,
  });
  addRoundCoffeeTable([2.88, 6.4], 0.62, 0.4);
  addChessSet([2.76, 6.38], 0.51, 0.42);
  addFrontCornerShelves();
  addP1P10CornerShelves();
  addP1P10ShelfDecor();
  addP10DisplayShelf();
  addP10P9aCornerShelf();
}

function addFrontCornerShelves() {
  const shelfMaterial = new THREE.MeshStandardMaterial({
    color: "#4a5058",
    roughness: 0.82,
    metalness: 0.04,
  });
  const shelfHeight = 1.2;
  const shelfDepth = 0.4;
  const shelfStartZ = -2.9;
  const shelfEndZ = -0.3;
  const shelfRun = shelfEndZ - shelfStartZ;
  const shelfCenter = [3.8, (shelfStartZ + shelfEndZ) / 2];
  pushPlanRectCollider(
    shelfCenter,
    shelfDepth,
    shelfRun,
    0,
    PLAYER_RADIUS * 0.08,
  );

  const returnStartX = 1.3;
  const returnEndX = 3.8;
  const returnRun = returnEndX - returnStartX;
  const returnCenter = [(returnStartX + returnEndX) / 2, shelfEndZ];
  pushPlanRectCollider(
    returnCenter,
    returnRun,
    shelfDepth,
    0,
    PLAYER_RADIUS * 0.08,
  );

  const shelfStructure = new THREE.Group();
  const verticalWorld = toWorldPoint(shelfCenter);
  const verticalShelf = new THREE.Mesh(
    new THREE.BoxGeometry(shelfDepth, shelfHeight, shelfRun),
    shelfMaterial,
  );
  verticalShelf.position.set(verticalWorld.x, shelfHeight / 2, verticalWorld.z);
  shelfStructure.add(verticalShelf);

  const returnWorld = toWorldPoint(returnCenter);
  const returnShelf = new THREE.Mesh(
    new THREE.BoxGeometry(returnRun, shelfHeight, shelfDepth),
    shelfMaterial,
  );
  returnShelf.position.set(returnWorld.x, shelfHeight / 2, returnWorld.z);
  shelfStructure.add(returnShelf);

  enableShadows(shelfStructure);
  architectureGroup.add(shelfStructure);
}

function addP1P10CornerShelves() {
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: "#434952",
    roughness: 0.74,
    metalness: 0.1,
  });
  const backingMaterial = new THREE.MeshStandardMaterial({
    color: "#373d45",
    roughness: 0.8,
    metalness: 0.04,
  });
  const shelfHeight = 2.5;
  const shelfDepth = 0.42;
  const westShelfX = OUTER_WALL_THICKNESS / 2 + shelfDepth / 2 + 0.03;
  const northShelfZ = LEFT_ROOM_DEPTH - (OUTER_WALL_THICKNESS / 2 + shelfDepth / 2 + 0.03);
  const shelfStartZ = 3.8;
  const shelfEndZ = northShelfZ;
  const shelfRun = shelfEndZ - shelfStartZ;
  const shelfCenter = [westShelfX, (shelfStartZ + shelfEndZ) / 2];
  pushPlanRectCollider(
    shelfCenter,
    shelfDepth,
    shelfRun,
    0,
    PLAYER_RADIUS * 0.08,
  );

  const returnStartX = westShelfX;
  const returnEndX = LEFT_EXTENSION_X;
  const returnRun = returnEndX - returnStartX;
  const returnCenter = [(returnStartX + returnEndX) / 2, northShelfZ];
  pushPlanRectCollider(
    returnCenter,
    returnRun,
    shelfDepth,
    0,
    PLAYER_RADIUS * 0.08,
  );

  const shelfStructure = new THREE.Group();
  const verticalShelf = createShelfModule({
    size: [shelfRun, shelfHeight, shelfDepth],
    columns: 1,
    rows: 3,
    frameMaterial,
    backingMaterial,
  });
  placePlanObject(
    verticalShelf,
    shelfCenter,
    0,
    -Math.PI / 2,
    shelfStructure,
  );

  const returnShelf = createShelfModule({
    size: [returnRun, shelfHeight, shelfDepth],
    columns: 1,
    rows: 3,
    frameMaterial,
    backingMaterial,
  });
  placePlanObject(
    returnShelf,
    returnCenter,
    0,
    0,
    shelfStructure,
  );

  enableShadows(shelfStructure);
  architectureGroup.add(shelfStructure);

  const tableWidth = 2.22;
  const tableHeight = 0.5;
  const tableEndZ = 3.5;
  const tableStartZ = 0.11;
  const tableDepth = tableEndZ - tableStartZ;
  const tableCenter = [2.8, (tableStartZ + tableEndZ) / 2];
  const table = new THREE.Group();
  const tableTopThickness = 0.06;
  const tableLegSize = 0.08;
  const tableTop = new THREE.Mesh(
    new THREE.BoxGeometry(tableWidth, tableTopThickness, tableDepth),
    new THREE.MeshStandardMaterial({
      color: "#3a3a3d",
      roughness: 0.82,
      metalness: 0.04,
    }),
  );
  tableTop.position.y = tableHeight - tableTopThickness / 2;
  table.add(tableTop);

  const legGeometry = new THREE.BoxGeometry(tableLegSize, tableHeight - tableTopThickness, tableLegSize);
  const legMaterial = new THREE.MeshStandardMaterial({
    color: "#4f443c",
    roughness: 0.86,
    metalness: 0.06,
  });
  [
    [-tableWidth / 2 + 0.12, (tableHeight - tableTopThickness) / 2, -tableDepth / 2 + 0.12],
    [tableWidth / 2 - 0.12, (tableHeight - tableTopThickness) / 2, -tableDepth / 2 + 0.12],
    [-tableWidth / 2 + 0.12, (tableHeight - tableTopThickness) / 2, tableDepth / 2 - 0.12],
    [tableWidth / 2 - 0.12, (tableHeight - tableTopThickness) / 2, tableDepth / 2 - 0.12],
  ].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(x, y, z);
    table.add(leg);
  });

  const laptop = new THREE.Group();
  const laptopBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.018, 0.3),
    new THREE.MeshStandardMaterial({
      color: "#8c9299",
      roughness: 0.44,
      metalness: 0.58,
    }),
  );
  laptopBase.position.y = tableHeight + 0.012;
  laptop.add(laptopBase);

  const laptopScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.26, 0.016),
    new THREE.MeshStandardMaterial({
      color: "#111317",
      emissive: "#0a0d11",
      emissiveIntensity: 0.2,
      roughness: 0.28,
      metalness: 0.1,
    }),
  );
  laptopScreen.position.set(0, tableHeight + 0.14, -0.1);
  laptopScreen.rotation.x = -1.95;
  laptop.add(laptopScreen);
  laptop.position.set(-0.48, 0, -0.26);
  laptop.rotation.y = Math.PI / 2;
  table.add(laptop);

  const paperMaterial = new THREE.MeshStandardMaterial({
    color: "#f1eee7",
    roughness: 0.92,
    metalness: 0.02,
  });
  [
    { x: 0.12, z: -0.34, rotation: 0.12, width: 0.28, depth: 0.2 },
    { x: 0.24, z: -0.08, rotation: -0.08, width: 0.3, depth: 0.22 },
    { x: -0.04, z: 0.18, rotation: 0.06, width: 0.26, depth: 0.19 },
    { x: 0.4, z: -0.28, rotation: -0.18, width: 0.27, depth: 0.19 },
    { x: 0.46, z: 0.08, rotation: 0.14, width: 0.29, depth: 0.21 },
    { x: 0.3, z: 0.4, rotation: -0.04, width: 0.32, depth: 0.22 },
    { x: -0.28, z: 0.44, rotation: 0.11, width: 0.24, depth: 0.18 },
    { x: -0.36, z: 0.08, rotation: -0.09, width: 0.25, depth: 0.18 },
  ].forEach(({ x, z, rotation, width, depth }, index) => {
    const sheet = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.006, depth),
      paperMaterial,
    );
    sheet.position.set(x, tableHeight + 0.008 + index * 0.002, z);
    sheet.rotation.y = rotation;
    sheet.castShadow = true;
    sheet.receiveShadow = true;
    table.add(sheet);
  });

  const cameraProp = new THREE.Group();
  const cameraBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.09, 0.09),
    new THREE.MeshStandardMaterial({
      color: "#f4f1eb",
      roughness: 0.72,
      metalness: 0.08,
    }),
  );
  cameraBody.position.y = tableHeight + 0.05;
  cameraProp.add(cameraBody);

  const cameraLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.07, 18),
    new THREE.MeshStandardMaterial({
      color: "#1a1d22",
      roughness: 0.36,
      metalness: 0.34,
    }),
  );
  cameraLens.rotation.z = Math.PI / 2;
  cameraLens.position.set(0.085, tableHeight + 0.05, 0);
  cameraProp.add(cameraLens);

  const cameraTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.025, 0.045),
    new THREE.MeshStandardMaterial({
      color: "#e6e1d9",
      roughness: 0.74,
      metalness: 0.06,
    }),
  );
  cameraTop.position.set(-0.02, tableHeight + 0.105, 0);
  cameraProp.add(cameraTop);
  cameraProp.position.set(-0.22, 0, -0.42);
  cameraProp.rotation.y = -0.4;
  enableShadows(cameraProp);
  table.add(cameraProp);

  enableShadows(table);
  placePlanObject(table, tableCenter, 0, 0, furnishingGroup);
  pushPlanRectCollider(
    tableCenter,
    tableWidth,
    tableDepth,
    0,
    PLAYER_RADIUS * 0.08,
  );

  const chairOffsetX = tableWidth / 2 + 0.38;
  const chairZs = [
    tableStartZ + 0.55,
    (tableStartZ + tableEndZ) / 2,
    tableEndZ - 0.55,
  ];
  chairZs.forEach((z, index) => {
    addRollingChair([tableCenter[0] - chairOffsetX, z], Math.PI / 2);
    if (index !== 0) {
      addRollingChair([tableCenter[0] + chairOffsetX, z], -Math.PI / 2);
    }
  });
}

function addP10DisplayShelf() {
  const cabinetWidth = 4.17;
  const cabinetHeight = 2.5;
  const cabinetDepth = 0.42;
  const center = [
    OUTER_WALL_THICKNESS / 2 + cabinetDepth / 2 + 0.04,
    1.715,
  ];
  const cabinet = createTwoTierDisplayShelf({
    width: cabinetWidth,
    height: cabinetHeight,
    depth: cabinetDepth,
    withItems: true,
    theme: "black",
  });
  placePlanObject(cabinet, center, 0, -Math.PI / 2, furnishingGroup);
  pushPlanRectCollider(center, cabinetWidth, cabinetDepth, -Math.PI / 2, PLAYER_RADIUS * 0.08);
}

function addP10P9aCornerShelf() {
  const cabinetWidth = 2.05;
  const cabinetHeight = 1.96;
  const cabinetDepth = 0.42;
  const center = [
    OUTER_WALL_THICKNESS / 2 + cabinetDepth / 2 + 0.04,
    FRONT_EDGE_Z + cabinetWidth / 2 + 0.08,
  ];
  const cabinet = createSolidDisplayShelf({
    width: cabinetWidth,
    height: cabinetHeight,
    depth: cabinetDepth,
  });
  placePlanObject(cabinet, center, 0, -Math.PI / 2, furnishingGroup);
  pushPlanRectCollider(center, cabinetWidth, cabinetDepth, -Math.PI / 2, PLAYER_RADIUS * 0.08);
}

function createShelfModule({ size, columns, rows, frameMaterial, backingMaterial }) {
  const [width, height, depth] = size;
  const board = 0.04;
  const group = new THREE.Group();
  const shelfLayerMaterial = new THREE.MeshStandardMaterial({
    color: "#69717b",
    roughness: 0.62,
    metalness: 0.08,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: "#767d87",
    roughness: 0.58,
    metalness: 0.18,
  });

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.02),
    backingMaterial,
  );
  back.position.set(0, height / 2, depth / 2 - 0.01);
  group.add(back);

  const verticalGeometry = new THREE.BoxGeometry(board, height, depth);
  const horizontalGeometry = new THREE.BoxGeometry(width, board, depth);

  [-width / 2 + board / 2, width / 2 - board / 2].forEach((x) => {
    const side = new THREE.Mesh(verticalGeometry, frameMaterial);
    side.position.set(x, height / 2, 0);
    group.add(side);
  });

  [board / 2, height - board / 2].forEach((y) => {
    const rail = new THREE.Mesh(horizontalGeometry, frameMaterial);
    rail.position.set(0, y, 0);
    group.add(rail);
  });

  for (let i = 1; i < columns; i += 1) {
    const divider = new THREE.Mesh(verticalGeometry, frameMaterial);
    divider.position.set(-width / 2 + (width * i) / columns, height / 2, 0);
    group.add(divider);
  }

  for (let i = 1; i < rows; i += 1) {
    const shelf = new THREE.Mesh(horizontalGeometry, shelfLayerMaterial);
    shelf.position.set(0, (height * i) / rows, 0);
    group.add(shelf);
  }

  const faceTrim = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.06, 0.025),
    trimMaterial,
  );
  faceTrim.position.set(0, height - 0.08, -depth / 2 + 0.0125);
  group.add(faceTrim);

  return enableShadows(group);
}

function addHangarEmptyPropShelf() {
  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: "#f4f6f8",
    roughness: 0.1,
    metalness: 1,
    emissive: "#8a9299",
    emissiveIntensity: 0.08,
  });
  const wireMaterial = new THREE.MeshStandardMaterial({
    color: "#edf1f4",
    roughness: 0.14,
    metalness: 1,
    emissive: "#7c858d",
    emissiveIntensity: 0.06,
  });
  const whitePlasticMaterial = new THREE.MeshStandardMaterial({
    color: "#f4f4ef",
    roughness: 0.48,
    metalness: 0.06,
  });
  const darkPlasticMaterial = new THREE.MeshStandardMaterial({
    color: "#17191d",
    roughness: 0.78,
    metalness: 0.16,
  });
  const visorMaterial = new THREE.MeshStandardMaterial({
    color: "#5ea9f8",
    roughness: 0.08,
    metalness: 0.24,
    transparent: true,
    opacity: 0.72,
    transmission: 0.46,
    thickness: 0.02,
  });
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: "#aeb5ba",
    roughness: 0.32,
    metalness: 0.74,
  });
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: "#d9bf5a",
    roughness: 0.28,
    metalness: 0.56,
  });
  const strawMaterial = new THREE.MeshStandardMaterial({
    color: "#b99363",
    roughness: 0.86,
    metalness: 0.02,
  });
  const fabricMaterial = new THREE.MeshStandardMaterial({
    color: "#ece8db",
    roughness: 0.94,
    metalness: 0.02,
  });
  const brownMaterial = new THREE.MeshStandardMaterial({
    color: "#8c5b45",
    roughness: 0.82,
    metalness: 0.04,
  });
  const pinkMaterial = new THREE.MeshStandardMaterial({
    color: "#f6c0d7",
    roughness: 0.76,
    metalness: 0.04,
  });
  const footballMaterial = new THREE.MeshStandardMaterial({
    color: "#7d4935",
    roughness: 0.88,
    metalness: 0.04,
  });
  const shelfWidth = 2.36;
  const shelfHeight = 2.26;
  const shelfDepth = 0.6;
  const shelfLevels = [0.06, 0.82, 1.52, 2.14];
  const shelfCenter = [HANGAR_INNER_EAST_X - shelfDepth / 2 - 1.12, 14.35];
  const shelf = new THREE.Group();

  const addBox = (size, position, material) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
    mesh.position.set(position[0], position[1], position[2]);
    shelf.add(mesh);
  };
  const addSphere = (radius, position, material, scale = [1, 1, 1]) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 16), material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    shelf.add(mesh);
    return mesh;
  };
  const addCylinder = (radius, height, position, material, axis = "y") => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 20), material);
    mesh.position.set(position[0], position[1], position[2]);
    if (axis === "x") {
      mesh.rotation.z = Math.PI / 2;
    } else if (axis === "z") {
      mesh.rotation.x = Math.PI / 2;
    }
    shelf.add(mesh);
    return mesh;
  };

  const addAstronautHelmet = (position, primaryColor, visorTint) => {
    const helmet = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.1, 20), whitePlasticMaterial);
    base.position.y = 0.05;
    helmet.add(base);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 16), primaryColor);
    dome.position.y = 0.2;
    dome.scale.set(1, 0.94, 1);
    helmet.add(dome);
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.11, 18, 14, 0, Math.PI), visorTint);
    visor.position.set(0, 0.19, 0.085);
    visor.scale.set(1, 0.78, 0.54);
    helmet.add(visor);
    helmet.position.set(position[0], position[1], position[2]);
    shelf.add(helmet);
  };

  const addKnightHelmet = (position) => {
    const helmet = new THREE.Group();
    addSphere(0.12, [position[0], position[1] + 0.15, position[2]], metalMaterial, [1, 1.1, 1]);
    addBox([0.22, 0.18, 0.18], [position[0], position[1] + 0.1, position[2]], metalMaterial);
    addBox([0.12, 0.02, 0.02], [position[0], position[1] + 0.11, position[2] - 0.095], darkPlasticMaterial);
    addBox([0.02, 0.12, 0.02], [position[0], position[1] + 0.08, position[2] - 0.095], darkPlasticMaterial);
    shelf.add(helmet);
  };

  const addAnimalHead = (position, material, snoutMaterial, horn = false) => {
    addSphere(0.14, [position[0], position[1] + 0.14, position[2]], material, [1.05, 0.92, 1.2]);
    addBox([0.12, 0.1, 0.16], [position[0], position[1] + 0.09, position[2] - 0.12], snoutMaterial);
    addBox([0.06, 0.1, 0.06], [position[0] - 0.08, position[1] + 0.22, position[2]], material);
    addBox([0.06, 0.1, 0.06], [position[0] + 0.08, position[1] + 0.22, position[2]], material);
    if (horn) {
      addCylinder(0.018, 0.16, [position[0], position[1] + 0.28, position[2] - 0.03], new THREE.MeshStandardMaterial({
        color: "#74d6ff",
        roughness: 0.42,
        metalness: 0.08,
      }));
    }
  };

  const addRiceHat = (position, radius, height) => {
    const hat = new THREE.Mesh(
      new THREE.ConeGeometry(radius, height, 20),
      strawMaterial,
    );
    hat.position.set(position[0], position[1] + height / 2, position[2]);
    hat.rotation.x = Math.PI;
    shelf.add(hat);
  };

  const addFootball = (position) => {
    const ball = addSphere(0.12, [position[0], position[1] + 0.12, position[2]], footballMaterial, [1.4, 1, 1]);
    ball.rotation.z = Math.PI / 2;
    addBox([0.05, 0.01, 0.01], [position[0], position[1] + 0.13, position[2] - 0.11], whitePlasticMaterial);
  };

  const addSpinWheel = (position) => {
    const wheel = new THREE.Group();
    const colors = ["#dc4850", "#3b83d1", "#f0d95e", "#2d7d6d", "#f2efe8", "#8b63b2"];
    colors.forEach((color, index) => {
      const wedge = new THREE.Mesh(
        new THREE.CircleGeometry(0.205, 20, (index / colors.length) * Math.PI * 2, (Math.PI * 2) / colors.length),
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.48,
          metalness: 0.06,
          side: THREE.DoubleSide,
        }),
      );
      wedge.position.set(0, 0.34, -0.038);
      wheel.add(wedge);
    });
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.04, 24),
      new THREE.MeshStandardMaterial({
        color: "#dad8cc",
        roughness: 0.42,
        metalness: 0.12,
      }),
    );
    disc.rotation.x = Math.PI / 2;
    disc.position.set(0, 0.34, -0.01);
    wheel.add(disc);
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.34, 0.04), darkPlasticMaterial);
    stand.position.y = 0.17;
    wheel.add(stand);
    const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 3), new THREE.MeshStandardMaterial({
      color: "#d7434c",
      roughness: 0.46,
      metalness: 0.06,
    }));
    pointer.position.set(0, 0.62, 0);
    pointer.rotation.z = Math.PI;
    wheel.add(pointer);
    wheel.position.set(position[0], position[1], position[2]);
    shelf.add(wheel);
  };

  [
    [-shelfWidth / 2 + 0.03, shelfHeight / 2, -shelfDepth / 2 + 0.03],
    [shelfWidth / 2 - 0.03, shelfHeight / 2, -shelfDepth / 2 + 0.03],
    [-shelfWidth / 2 + 0.03, shelfHeight / 2, shelfDepth / 2 - 0.03],
    [shelfWidth / 2 - 0.03, shelfHeight / 2, shelfDepth / 2 - 0.03],
  ].forEach(([x, y, z]) => {
    addBox([0.03, shelfHeight, 0.03], [x, y, z], chromeMaterial);
  });

  shelfLevels.forEach((y) => {
    addBox([shelfWidth, 0.024, 0.022], [0, y, -shelfDepth / 2], chromeMaterial);
    addBox([shelfWidth, 0.024, 0.022], [0, y, shelfDepth / 2], chromeMaterial);
    addBox([0.022, 0.024, shelfDepth], [-shelfWidth / 2, y, 0], chromeMaterial);
    addBox([0.022, 0.024, shelfDepth], [shelfWidth / 2, y, 0], chromeMaterial);
    for (let i = 0; i < 9; i += 1) {
      const z = -shelfDepth / 2 + 0.045 + i * ((shelfDepth - 0.09) / 8);
      addBox([shelfWidth - 0.03, 0.008, 0.008], [0, y + 0.006, z], wireMaterial);
    }
  });

  const topY = shelfLevels[3] + 0.024;
  const upperY = shelfLevels[2] + 0.024;
  const midY = shelfLevels[1] + 0.024;
  const bottomY = shelfLevels[0] + 0.024;

  addAstronautHelmet(
    [-0.78, topY, -0.02],
    new THREE.MeshStandardMaterial({ color: "#2e92ef", roughness: 0.34, metalness: 0.12 }),
    visorMaterial,
  );
  addAstronautHelmet(
    [-0.34, topY - 0.02, -0.03],
    new THREE.MeshStandardMaterial({ color: "#111c3b", roughness: 0.42, metalness: 0.14 }),
    new THREE.MeshStandardMaterial({
      color: "#1e2c62",
      roughness: 0.12,
      metalness: 0.18,
      transparent: true,
      opacity: 0.64,
      transmission: 0.34,
      thickness: 0.02,
    }),
  );
  addBox([0.2, 0.08, 0.18], [0.03, topY + 0.04, -0.02], fabricMaterial);
  addRiceHat([0.44, topY + 0.01, -0.04], 0.22, 0.14);
  addRiceHat([0.66, topY, 0.02], 0.2, 0.12);
  addRiceHat([0.86, topY - 0.01, -0.03], 0.18, 0.1);
  addBox([0.04, 0.52, 0.04], [-1.06, topY + 0.22, 0.18], new THREE.MeshStandardMaterial({
    color: "#18a44a",
    roughness: 0.74,
    metalness: 0.04,
  }));
  addBox([0.06, 0.34, 0.03], [-1.02, topY + 0.16, 0.18], new THREE.MeshStandardMaterial({
    color: "#25b657",
    roughness: 0.8,
    metalness: 0.02,
  }));

  addKnightHelmet([-0.76, upperY, -0.02]);
  addBox([0.24, 0.05, 0.22], [-0.9, upperY + 0.025, 0.14], new THREE.MeshStandardMaterial({
    color: "#c5b0a0",
    roughness: 0.88,
    metalness: 0.02,
  }));
  addBox([0.26, 0.18, 0.18], [-0.42, upperY + 0.09, 0.04], brownMaterial);
  addBox([0.18, 0.12, 0.14], [-0.14, upperY + 0.06, -0.02], whitePlasticMaterial);
  addSpinWheel([0.22, upperY, 0]);
  addBox([0.18, 0.08, 0.14], [0.58, upperY + 0.04, -0.02], goldMaterial);
  addCylinder(0.06, 0.16, [0.8, upperY + 0.08, 0.05], new THREE.MeshStandardMaterial({
    color: "#c4a16d",
    roughness: 0.42,
    metalness: 0.3,
  }));
  addBox([0.18, 0.14, 0.16], [1.0, upperY + 0.07, -0.03], darkPlasticMaterial);

  addAnimalHead([-0.78, midY, 0], new THREE.MeshStandardMaterial({
    color: "#68463a",
    roughness: 0.86,
    metalness: 0.04,
  }), new THREE.MeshStandardMaterial({
    color: "#a95c58",
    roughness: 0.82,
    metalness: 0.02,
  }));
  addAnimalHead([-0.34, midY, -0.02], brownMaterial, darkPlasticMaterial);
  addAnimalHead([0.08, midY, -0.01], whitePlasticMaterial, pinkMaterial, true);
  addBox([0.44, 0.24, 0.28], [0.58, midY + 0.12, 0.02], new THREE.MeshStandardMaterial({
    color: "#d1d2d3",
    roughness: 0.36,
    metalness: 0.46,
  }));
  addFootball([1.02, midY, 0.02]);

  addBox([0.42, 0.22, 0.34], [-0.74, bottomY + 0.11, 0.02], darkPlasticMaterial);
  addBox([0.34, 0.22, 0.26], [-0.22, bottomY + 0.11, 0.08], new THREE.MeshStandardMaterial({
    color: "#131519",
    roughness: 0.72,
    metalness: 0.14,
  }));
  addBox([0.44, 0.18, 0.3], [0.62, bottomY + 0.09, 0.02], new THREE.MeshStandardMaterial({
    color: "#c7c9cc",
    roughness: 0.34,
    metalness: 0.62,
  }));

  enableShadows(shelf);
  placePlanObject(shelf, shelfCenter, 0, Math.PI / 2, furnishingGroup);
  pushPlanRectCollider(shelfCenter, shelfDepth, shelfWidth, Math.PI / 2, PLAYER_RADIUS * 0.08);
}

function addHangarBasketballHoop() {
  const hoopCenter = [HANGAR_INNER_EAST_X - 2.26, 16.18];
  const hoop = new THREE.Group();
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: "#43484d",
    roughness: 0.58,
    metalness: 0.54,
  });
  const backboardMaterial = new THREE.MeshStandardMaterial({
    color: "#f4f5f2",
    roughness: 0.3,
    metalness: 0.08,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: "#141618",
    roughness: 0.7,
    metalness: 0.16,
  });
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: "#ec5a22",
    roughness: 0.42,
    metalness: 0.18,
  });
  const netMaterial = new THREE.MeshStandardMaterial({
    color: "#eceae3",
    roughness: 0.9,
    metalness: 0.02,
    transparent: true,
    opacity: 0.82,
  });

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.08, 3.34, 16),
    poleMaterial,
  );
  pole.position.set(0, 1.67, 0.18);
  hoop.add(pole);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.18, 1.06),
    trimMaterial,
  );
  base.position.set(0, 0.09, 0.22);
  hoop.add(base);

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.08, 0.54),
    poleMaterial,
  );
  arm.position.set(0, 3.04, -0.08);
  hoop.add(arm);

  const backboard = new THREE.Mesh(
    new THREE.BoxGeometry(1.24, 0.8, 0.06),
    backboardMaterial,
  );
  backboard.position.set(0, 3.04, -0.38);
  hoop.add(backboard);

  const backboardTrim = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.66, 0.02),
    trimMaterial,
  );
  backboardTrim.position.set(0, 3.04, -0.415);
  hoop.add(backboardTrim);

  const targetSquare = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.22, 0.021),
    new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.32,
      metalness: 0.04,
    }),
  );
  targetSquare.position.set(0, 2.94, -0.414);
  hoop.add(targetSquare);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.23, 0.018, 10, 24),
    rimMaterial,
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 2.74, -0.64);
  hoop.add(rim);

  for (let i = 0; i < 8; i += 1) {
    const strand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.34, 8),
      netMaterial,
    );
    const angle = (i / 8) * Math.PI * 2;
    strand.position.set(Math.cos(angle) * 0.18, 2.58, -0.64 + Math.sin(angle) * 0.18);
    strand.rotation.x = 0.18;
    hoop.add(strand);
  }

  enableShadows(hoop);
  placePlanObject(hoop, hoopCenter, 0, Math.PI / 2, furnishingGroup);
  pushPlanRectCollider(hoopCenter, 1.06, 0.72, Math.PI / 2, PLAYER_RADIUS * 0.08);

  const fridgeCenter = [hoopCenter[0] + 0.22, hoopCenter[1] + 1.08];
  const fridge = new THREE.Group();
  const fridgeBodyMaterial = new THREE.MeshStandardMaterial({
    color: "#1f4f34",
    roughness: 0.54,
    metalness: 0.18,
  });
  const fridgeTrimMaterial = new THREE.MeshStandardMaterial({
    color: "#d8ddd8",
    roughness: 0.24,
    metalness: 0.46,
  });
  const fridgeVentMaterial = new THREE.MeshStandardMaterial({
    color: "#243329",
    roughness: 0.7,
    metalness: 0.08,
  });
  const fridgeTopMaterial = new THREE.MeshStandardMaterial({
    color: "#9da39f",
    roughness: 0.34,
    metalness: 0.16,
  });
  const fridgeGlassMaterial = new THREE.MeshStandardMaterial({
    color: "#b9d7d2",
    roughness: 0.08,
    metalness: 0.06,
    transparent: true,
    opacity: 0.22,
    transmission: 0.78,
    thickness: 0.02,
  });

  const fridgeBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 1.14, 0.68),
    fridgeBodyMaterial,
  );
  fridgeBody.position.y = 0.57;
  fridge.add(fridgeBody);

  const fridgeTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.04, 0.72),
    fridgeTopMaterial,
  );
  fridgeTop.position.set(0, 1.16, 0);
  fridge.add(fridgeTop);

  const cavity = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.96, 0.56),
    new THREE.MeshStandardMaterial({
      color: "#0d1511",
      roughness: 0.9,
      metalness: 0.02,
    }),
  );
  cavity.position.set(0, 0.59, -0.02);
  fridge.add(cavity);

  const innerWallMaterial = new THREE.MeshStandardMaterial({
    color: "#17211b",
    roughness: 0.88,
    metalness: 0.03,
  });
  [
    [0.58, 0.96, 0.02, 0, 0.59, 0.26],
    [0.02, 0.96, 0.56, -0.29, 0.59, -0.02],
    [0.02, 0.96, 0.56, 0.29, 0.59, -0.02],
    [0.58, 0.02, 0.56, 0, 1.06, -0.02],
    [0.58, 0.02, 0.56, 0, 0.12, -0.02],
  ].forEach(([sx, sy, sz, x, y, z]) => {
    const innerWall = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      innerWallMaterial,
    );
    innerWall.position.set(x, y, z);
    fridge.add(innerWall);
  });

  [
    [0.72, 0.11, 0.09, 0, 1.08, -0.295],
    [0.72, 0.11, 0.09, 0, 0.06, -0.295],
    [0.09, 0.96, 0.09, -0.315, 0.57, -0.295],
    [0.09, 0.96, 0.09, 0.315, 0.57, -0.295],
  ].forEach(([sx, sy, sz, x, y, z]) => {
    const framePiece = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      fridgeBodyMaterial,
    );
    framePiece.position.set(x, y, z);
    fridge.add(framePiece);
  });

  const fridgeGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.56, 0.9),
    fridgeGlassMaterial,
  );
  fridgeGlass.position.set(0, 0.59, -0.349);
  fridge.add(fridgeGlass);

  const frontFrameMaterial = new THREE.MeshStandardMaterial({
    color: "#234b33",
    roughness: 0.5,
    metalness: 0.16,
  });
  [
    [0.68, 0.07, 0.05, 0, 1.06, -0.335],
    [0.68, 0.07, 0.05, 0, 0.12, -0.335],
    [0.07, 0.96, 0.05, -0.305, 0.59, -0.335],
    [0.07, 0.96, 0.05, 0.305, 0.59, -0.335],
  ].forEach(([sx, sy, sz, x, y, z]) => {
    const frontFrame = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      frontFrameMaterial,
    );
    frontFrame.position.set(x, y, z);
    fridge.add(frontFrame);
  });

  const fridgeHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.42, 0.03),
    fridgeTrimMaterial,
  );
  fridgeHandle.position.set(0.245, 0.62, -0.365);
  fridge.add(fridgeHandle);

  for (let i = 0; i < 4; i += 1) {
    const vent = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.02, 0.02),
      fridgeVentMaterial,
    );
    vent.position.set(0, 0.18 + i * 0.075, 0.341);
    fridge.add(vent);
  }

  [-0.24, 0.24].forEach((x) => {
    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.04, 0.07),
      fridgeVentMaterial,
    );
    foot.position.set(x, 0.02, 0.22);
    fridge.add(foot);
  });

  enableShadows(fridge);
  placePlanObject(fridge, fridgeCenter, 0, Math.PI / 2, furnishingGroup);
  pushPlanRectCollider(fridgeCenter, 0.72, 0.68, 0, PLAYER_RADIUS * 0.08);
}

function addFootballGoalpost(center, rotation = 0) {
  const goalpost = new THREE.Group();
  const scale = 0.58;
  const postMaterial = new THREE.MeshStandardMaterial({
    color: "#f4c51d",
    roughness: 0.52,
    metalness: 0.28,
  });
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: "#5a5f63",
    roughness: 0.78,
    metalness: 0.18,
  });

  const crossbarThickness = 0.12 * scale;
  const crossbarY = 3.05 * scale;
  const stemHeight = crossbarY - crossbarThickness / 2;
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07 * scale, 0.08 * scale, stemHeight, 16),
    postMaterial,
  );
  stem.position.y = stemHeight / 2;
  goalpost.add(stem);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.68 * scale, 0.18 * scale, 0.68 * scale),
    baseMaterial,
  );
  base.position.y = 0.09 * scale;
  goalpost.add(base);

  const crossbar = new THREE.Mesh(
    new THREE.BoxGeometry(3.1 * scale, crossbarThickness, crossbarThickness),
    postMaterial,
  );
  crossbar.position.y = crossbarY;
  goalpost.add(crossbar);

  const uprightHeight = 2.9 * scale;
  [-1.46, 1.46].forEach((x) => {
    const upright = new THREE.Mesh(
      new THREE.BoxGeometry(0.12 * scale, uprightHeight, 0.12 * scale),
      postMaterial,
    );
    upright.position.set(x * scale, crossbarY + crossbarThickness / 2 + uprightHeight / 2, 0);
    goalpost.add(upright);
  });

  enableShadows(goalpost);
  placePlanObject(goalpost, center, 0, rotation, furnishingGroup);
  pushPlanRectCollider(center, 0.78 * scale, 0.78 * scale, rotation, PLAYER_RADIUS * 0.04);
}

function addRollingChair(center, rotation = 0, { registerAsSeat = true } = {}) {
  const chair = new THREE.Group();
  const seatMaterial = new THREE.MeshStandardMaterial({
    color: "#202124",
    roughness: 0.7,
    metalness: 0.08,
  });
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: "#4a4d50",
    roughness: 0.52,
    metalness: 0.58,
  });

  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.08, 0.5),
    seatMaterial,
  );
  seat.position.y = 0.48;
  chair.add(seat);

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.46, 0.08),
    seatMaterial,
  );
  back.position.set(0, 0.72, -0.21);
  chair.add(back);

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.38, 16),
    baseMaterial,
  );
  post.position.y = 0.23;
  chair.add(post);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16),
    baseMaterial,
  );
  hub.position.y = 0.04;
  chair.add(hub);

  for (let i = 0; i < 5; i += 1) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.025, 0.04),
      baseMaterial,
    );
    arm.position.y = 0.05;
    arm.rotation.y = (Math.PI * 2 * i) / 5;
    arm.position.x = Math.cos((Math.PI * 2 * i) / 5) * 0.12;
    arm.position.z = Math.sin((Math.PI * 2 * i) / 5) * 0.12;
    chair.add(arm);

    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.03, 12),
      baseMaterial,
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(
      Math.cos((Math.PI * 2 * i) / 5) * 0.23,
      0.03,
      Math.sin((Math.PI * 2 * i) / 5) * 0.23,
    );
    chair.add(wheel);
  }

  enableShadows(chair);
  placePlanObject(chair, center, 0, rotation, furnishingGroup);
  if (registerAsSeat) {
    registerSeat(center, rotation, 1.16, 0.8, 0.52);
  }
  pushPlanRectCollider(center, 0.68, 0.68, 0, PLAYER_RADIUS * 0.08);
}

function addOversizedSwivelChair(center, rotation = 0, { registerAsSeat = true } = {}) {
  const chair = new THREE.Group();
  const upholsteryMaterial = new THREE.MeshStandardMaterial({
    color: "#191b1e",
    roughness: 0.92,
    metalness: 0.03,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: "#24272b",
    roughness: 0.88,
    metalness: 0.04,
  });
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: "#121416",
    roughness: 0.78,
    metalness: 0.2,
  });

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.06, 24),
    baseMaterial,
  );
  hub.position.y = 0.09;
  chair.add(hub);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.11, 0.26, 20),
    baseMaterial,
  );
  pedestal.position.y = 0.22;
  chair.add(pedestal);

  for (let i = 0; i < 5; i += 1) {
    const angle = (Math.PI * 2 * i) / 5;
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.035, 0.06),
      baseMaterial,
    );
    spoke.position.set(Math.cos(angle) * 0.18, 0.08, Math.sin(angle) * 0.18);
    spoke.rotation.y = angle;
    chair.add(spoke);

    const casterFork = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.08, 0.05),
      baseMaterial,
    );
    casterFork.position.set(Math.cos(angle) * 0.39, 0.06, Math.sin(angle) * 0.39);
    chair.add(casterFork);

    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.035, 14),
      baseMaterial,
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(Math.cos(angle) * 0.45, 0.04, Math.sin(angle) * 0.45);
    wheel.rotation.y = angle;
    chair.add(wheel);
  }

  const swivelPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.22, 0.05, 20),
    baseMaterial,
  );
  swivelPlate.position.y = 0.42;
  chair.add(swivelPlate);

  const seatBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.54, 0.2, 32),
    accentMaterial,
  );
  seatBase.position.y = 0.46;
  chair.add(seatBase);

  const seatCushion = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.48, 0.16, 32),
    upholsteryMaterial,
  );
  seatCushion.position.y = 0.58;
  chair.add(seatCushion);

  const backBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.58, 0.24),
    accentMaterial,
  );
  backBase.position.set(0, 0.82, -0.24);
  chair.add(backBase);

  const backCushion = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.48, 0.18),
    upholsteryMaterial,
  );
  backCushion.position.set(0, 0.86, -0.17);
  chair.add(backCushion);

  [-0.42, 0.42].forEach((x) => {
    const armSupport = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.24, 0.14),
      accentMaterial,
    );
    armSupport.position.set(x, 0.57, 0.03);
    chair.add(armSupport);

    const armCushion = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.52, 18),
      upholsteryMaterial,
    );
    armCushion.rotation.x = Math.PI / 2;
    armCushion.position.set(x, 0.68, 0.06);
    chair.add(armCushion);
  });

  const headCushion = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.18, 0.16),
    upholsteryMaterial,
  );
  headCushion.position.set(0, 1.07, -0.12);
  chair.add(headCushion);

  enableShadows(chair);
  placePlanObject(chair, center, 0.04, rotation, furnishingGroup);
  if (registerAsSeat) {
    registerSeat(center, rotation, 1.4, 0.8, 0.7);
  }
  pushPlanRectCollider(center, 1.28, 1.28, 0, PLAYER_RADIUS * 0.06);
}

function addTallDeskStool(center, rotation = 0) {
  const stool = new THREE.Group();
  const seatMaterial = new THREE.MeshStandardMaterial({
    color: "#202124",
    roughness: 0.7,
    metalness: 0.08,
  });
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: "#4a4d50",
    roughness: 0.52,
    metalness: 0.58,
  });

  const seat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.26, 0.08, 24),
    seatMaterial,
  );
  seat.position.y = 0.78;
  stool.add(seat);

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.28, 0.04),
    seatMaterial,
  );
  back.position.set(0, 0.99, -0.18);
  stool.add(back);

  [
    [-0.15, -0.15],
    [0.15, -0.15],
    [-0.15, 0.15],
    [0.15, 0.15],
  ].forEach(([x, z]) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.014, 0.76, 10),
      baseMaterial,
    );
    leg.position.set(x, 0.38, z);
    stool.add(leg);
  });

  const footRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.19, 0.01, 10, 24),
    baseMaterial,
  );
  footRing.rotation.x = Math.PI / 2;
  footRing.position.y = 0.34;
  stool.add(footRing);

  enableShadows(stool);
  placePlanObject(stool, center, 0, rotation, furnishingGroup);
  pushPlanRectCollider(center, 0.58, 0.58, 0, PLAYER_RADIUS * 0.08);
}

function addPlanBlock({
  center,
  size,
  centerY,
  rotation = 0,
  material,
  group = furnishingGroup,
}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    material,
  );
  const worldPoint = toWorldPoint(center);
  mesh.position.set(worldPoint.x, centerY, worldPoint.z);
  mesh.rotation.y = rotation;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function placePlanObject(object, center, y = 0, rotation = 0, group = furnishingGroup) {
  const worldPoint = toWorldPoint(center);
  object.position.set(worldPoint.x, y, worldPoint.z);
  object.rotation.y = rotation;
  group.add(object);
  return object;
}

function registerSeat(
  center,
  rotation,
  eyeHeight = 1.12,
  standOffset = 0.82,
  surfaceHeight = Math.max(0.34, eyeHeight - 0.6),
) {
  const interactionWorld = toWorldPoint(center);
  interactiveSeats.push({
    center,
    rotation,
    eyeHeight,
    standOffset,
    surfaceHeight,
    interactionPoint: new THREE.Vector3(interactionWorld.x, eyeHeight, interactionWorld.z),
    promptOffsetY: 0.28,
  });
}

function setLayerRecursive(root, layer) {
  root.traverse((child) => {
    child.layers.set(layer);
  });
}

function promoteNewChildrenToLayer(group, startIndex, layer) {
  for (let index = startIndex; index < group.children.length; index += 1) {
    setLayerRecursive(group.children[index], layer);
  }
}

function enableShadows(root, castShadow = true, receiveShadow = true) {
  root.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = castShadow;
      child.receiveShadow = receiveShadow;
    }
  });
  return root;
}

function pushPlanRectCollider(center, width, depth, rotation = 0, padding = PLAYER_RADIUS * 0.18) {
  const worldPoint = toWorldPoint(center);
  const footprint = getFootprint(width, depth, rotation);
  furnitureRects.push(axisAlignedRect(worldPoint, footprint.width, footprint.depth, padding));
}

function pushPlanCircularCollider(center, radius, padding = PLAYER_RADIUS * 0.04, bandCount = 7) {
  const worldPoint = toWorldPoint(center);
  const bandDepth = (radius * 2) / bandCount;

  for (let i = 0; i < bandCount; i += 1) {
    const zCenter = -radius + bandDepth * (i + 0.5);
    const outerZ = Math.min(radius, Math.abs(zCenter) + bandDepth / 2);
    const halfWidth = Math.sqrt(Math.max(0, radius * radius - outerZ * outerZ));

    if (halfWidth <= 0.02) {
      continue;
    }

    furnitureRects.push(
      axisAlignedRect(
        {
          x: worldPoint.x,
          z: worldPoint.z + zCenter,
        },
        halfWidth * 2,
        bandDepth,
        padding,
      ),
    );
  }
}

function addFeatureRug(center, size) {
  const texture = createWovenRugTexture();
  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], 0.02, size[1]),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 1,
      metalness: 0.01,
    }),
  );
  const worldPoint = toWorldPoint(center);
  rug.position.set(worldPoint.x, 0.02, worldPoint.z);
  rug.receiveShadow = true;
  furnishingGroup.add(rug);
}

function addPlushSofa({
  center,
  size,
  rotation = 0,
  seatCount = 2,
  leftArm = true,
  rightArm = true,
  color = "#68717d",
  seamColor = "#5f6773",
  footHeight = 0.05,
}) {
  const [width, depth] = size;
  const sofa = new THREE.Group();
  const verticalLift = footHeight - 0.05;
  const upholstery = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
  });
  const seamMaterial = new THREE.MeshStandardMaterial({
    color: seamColor,
    roughness: 0.93,
  });
  const footMaterial = new THREE.MeshStandardMaterial({
    color: "#121212",
    roughness: 0.75,
    metalness: 0.18,
  });

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.34, depth),
    upholstery,
  );
  base.position.y = 0.18 + verticalLift;
  sofa.add(base);

  const inset = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.1, 0.05, depth - 0.12),
    seamMaterial,
  );
  inset.position.set(0, 0.34 + verticalLift, 0.02);
  sofa.add(inset);

  const armWidth = 0.18;
  if (leftArm) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(armWidth, 0.58, depth - 0.04),
      upholstery,
    );
    arm.position.set(-width / 2 + armWidth / 2, 0.45 + verticalLift, 0);
    sofa.add(arm);
  }
  if (rightArm) {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(armWidth, 0.58, depth - 0.04),
      upholstery,
    );
    arm.position.set(width / 2 - armWidth / 2, 0.45 + verticalLift, 0);
    sofa.add(arm);
  }

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.04, 0.7, 0.18),
    upholstery,
  );
  back.position.set(0, 0.63 + verticalLift, -depth / 2 + 0.09);
  sofa.add(back);

  const usableWidth = width - (leftArm ? armWidth + 0.06 : 0.08) - (rightArm ? armWidth + 0.06 : 0.08);
  const cushionGap = 0.04;
  const cushionWidth = (usableWidth - cushionGap * (seatCount - 1)) / seatCount;
  const startX = -usableWidth / 2 + cushionWidth / 2 + (leftArm ? 0.02 : 0);

  for (let i = 0; i < seatCount; i += 1) {
    const x = startX + i * (cushionWidth + cushionGap);
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(cushionWidth, 0.17, depth * 0.62),
      seamMaterial,
    );
    seat.position.set(x, 0.43 + verticalLift, 0.06);
    sofa.add(seat);

    const backCushion = new THREE.Mesh(
      new THREE.BoxGeometry(cushionWidth * 0.96, 0.34, 0.18),
      seamMaterial,
    );
    backCushion.position.set(x, 0.67 + verticalLift, -depth / 2 + 0.2);
    sofa.add(backCushion);
  }

  [-width / 2 + 0.18, width / 2 - 0.18].forEach((x) => {
    [-depth / 2 + 0.16, depth / 2 - 0.16].forEach((z) => {
      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, footHeight, 0.08),
        footMaterial,
      );
      foot.position.set(x, footHeight / 2 - 0.005, z);
      sofa.add(foot);
    });
  });

  enableShadows(sofa);
  placePlanObject(sofa, center, 0, rotation, furnishingGroup);
  pushPlanRectCollider(center, width, depth, rotation, PLAYER_RADIUS * 0.18);
}

function addLSectional({
  corner,
  horizontalLength,
  verticalLength,
  depth,
  flipTopRun = false,
  westOffset = 0,
}) {
  const sectional = new THREE.Group();
  const upholstery = new THREE.MeshStandardMaterial({
    color: "#68717d",
    roughness: 0.95,
  });
  const seamMaterial = new THREE.MeshStandardMaterial({
    color: "#5f6773",
    roughness: 0.93,
  });
  const footMaterial = new THREE.MeshStandardMaterial({
    color: "#121212",
    roughness: 0.75,
    metalness: 0.18,
  });

  const armThickness = 0.18;
  const seatHeight = 0.34;
  const armHeight = 0.58;
  const backHeight = 0.7;
  const backThickness = 0.18;
  const topRunDirection = flipTopRun ? 1 : -1;
  const cornerSeat = depth;
  const horizontalExtension = Math.max(0.4, horizontalLength - cornerSeat);
  const verticalExtension = Math.max(0.4, verticalLength - cornerSeat);

  const horizontalBase = new THREE.Mesh(
    new THREE.BoxGeometry(horizontalLength, seatHeight, depth),
    upholstery,
  );
  horizontalBase.position.set(horizontalLength / 2, 0.18, 0);
  sectional.add(horizontalBase);

  const verticalBase = new THREE.Mesh(
    new THREE.BoxGeometry(depth, seatHeight, verticalLength),
    upholstery,
  );
  verticalBase.position.set(westOffset, 0.18, -verticalLength / 2);
  sectional.add(verticalBase);

  const horizontalInset = new THREE.Mesh(
    new THREE.BoxGeometry(horizontalLength - 0.1, 0.05, depth - 0.12),
    seamMaterial,
  );
  horizontalInset.position.set(horizontalLength / 2, 0.34, -topRunDirection * 0.02);
  sectional.add(horizontalInset);

  const verticalInset = new THREE.Mesh(
    new THREE.BoxGeometry(depth - 0.12, 0.05, verticalLength - 0.1),
    seamMaterial,
  );
  verticalInset.position.set(westOffset + 0.02, 0.34, -verticalLength / 2);
  sectional.add(verticalInset);

  const northBack = new THREE.Mesh(
    new THREE.BoxGeometry(horizontalLength, backHeight, backThickness),
    upholstery,
  );
  northBack.position.set(horizontalLength / 2, 0.63, topRunDirection * (depth / 2 - backThickness / 2));
  sectional.add(northBack);

  const westBack = new THREE.Mesh(
    new THREE.BoxGeometry(backThickness, backHeight, verticalLength),
    upholstery,
  );
  westBack.position.set(westOffset - depth / 2 + backThickness / 2, 0.63, -verticalLength / 2);
  sectional.add(westBack);

  const eastArm = new THREE.Mesh(
    new THREE.BoxGeometry(armThickness, armHeight, depth - 0.04),
    upholstery,
  );
  eastArm.position.set(horizontalLength - armThickness / 2, 0.45, 0);
  sectional.add(eastArm);

  const southArm = new THREE.Mesh(
    new THREE.BoxGeometry(depth - 0.04, armHeight, armThickness),
    upholstery,
  );
  southArm.position.set(westOffset, 0.45, -verticalLength + armThickness / 2);
  sectional.add(southArm);

  const horizontalSeats = 3;
  const verticalSeats = 2;
  const cushionGap = 0.04;
  const horizontalUsable = horizontalExtension - armThickness - 0.08;
  const verticalUsable = verticalExtension - armThickness - 0.08;
  const horizontalSeatWidth = (horizontalUsable - cushionGap * (horizontalSeats - 1)) / horizontalSeats;
  const verticalSeatDepth = (verticalUsable - cushionGap * (verticalSeats - 1)) / verticalSeats;

  for (let i = 0; i < horizontalSeats; i += 1) {
    const x = cornerSeat + horizontalSeatWidth / 2 + i * (horizontalSeatWidth + cushionGap);
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(horizontalSeatWidth, 0.17, depth * 0.62),
      seamMaterial,
    );
    seat.position.set(x, 0.43, -topRunDirection * 0.06);
    sectional.add(seat);

    const backCushion = new THREE.Mesh(
      new THREE.BoxGeometry(horizontalSeatWidth * 0.96, 0.34, 0.18),
      seamMaterial,
    );
    backCushion.position.set(x, 0.67, topRunDirection * (depth / 2 - 0.2));
    sectional.add(backCushion);
  }

  for (let i = 0; i < verticalSeats; i += 1) {
    const z = -cornerSeat - verticalSeatDepth / 2 - i * (verticalSeatDepth + cushionGap);
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(depth * 0.62, 0.17, verticalSeatDepth),
      seamMaterial,
    );
    seat.position.set(westOffset + 0.06, 0.43, z);
    sectional.add(seat);

    const backCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.34, verticalSeatDepth * 0.96),
      seamMaterial,
    );
    backCushion.position.set(westOffset - depth / 2 + 0.2, 0.67, z);
    sectional.add(backCushion);
  }

  const cornerSeatPad = new THREE.Mesh(
    new THREE.BoxGeometry(depth * 0.68, 0.17, depth * 0.68),
    seamMaterial,
  );
  cornerSeatPad.position.set(depth * 0.1, 0.43, -topRunDirection * depth * 0.1);
  sectional.add(cornerSeatPad);

  const cornerBackNorth = new THREE.Mesh(
    new THREE.BoxGeometry(depth * 0.56, 0.34, 0.18),
    seamMaterial,
  );
  cornerBackNorth.position.set(depth * 0.16, 0.67, topRunDirection * (depth / 2 - 0.2));
  sectional.add(cornerBackNorth);

  const cornerBackWest = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.34, depth * 0.56),
    seamMaterial,
  );
  cornerBackWest.position.set(westOffset - depth / 2 + 0.2, 0.67, -depth * 0.16);
  sectional.add(cornerBackWest);

  [
    [horizontalLength - 0.2, -depth / 2 + 0.16],
    [horizontalLength - 0.2, depth / 2 - 0.16],
    [westOffset - depth / 2 + 0.16, -verticalLength + 0.2],
    [westOffset + depth / 2 - 0.16, -verticalLength + 0.2],
  ].forEach(([x, z]) => {
    const foot = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.05, 0.08),
      footMaterial,
    );
    foot.position.set(x, 0.02, z);
    sectional.add(foot);
  });

  enableShadows(sectional);
  placePlanObject(sectional, corner, 0, 0, furnishingGroup);
  pushPlanRectCollider(
    [corner[0] + horizontalLength / 2, corner[1]],
    horizontalLength,
    depth,
    0,
    PLAYER_RADIUS * 0.18,
  );
  pushPlanRectCollider(
    [corner[0] + westOffset, corner[1] - verticalLength / 2],
    depth,
    verticalLength,
    0,
    PLAYER_RADIUS * 0.18,
  );
}

function addPlushOttoman(center, size, rotation = 0) {
  const [width, depth] = size;
  const ottoman = new THREE.Group();
  const upholstery = new THREE.MeshStandardMaterial({
    color: "#68717d",
    roughness: 0.95,
  });

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.34, depth),
    upholstery,
  );
  base.position.y = 0.18;
  ottoman.add(base);

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.08, 0.15, depth - 0.08),
    new THREE.MeshStandardMaterial({
      color: "#727b87",
      roughness: 0.94,
    }),
  );
  top.position.y = 0.42;
  ottoman.add(top);

  enableShadows(ottoman);
  placePlanObject(ottoman, center, 0, rotation, furnishingGroup);
  pushPlanRectCollider(center, width, depth, rotation, PLAYER_RADIUS * 0.14);
}

function addThrow(center, size, roll = 0) {
  const worldPoint = toWorldPoint(center);
  const throwBlanket = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    new THREE.MeshStandardMaterial({
      color: "#5d6550",
      roughness: 0.98,
    }),
  );
  throwBlanket.position.set(worldPoint.x, 0.55, worldPoint.z);
  throwBlanket.rotation.z = roll;
  throwBlanket.castShadow = true;
  throwBlanket.receiveShadow = true;
  furnishingGroup.add(throwBlanket);
}

function addRoundCoffeeTable(center, radius, height) {
  const table = new THREE.Group();
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: "#6f3d22",
    roughness: 0.5,
    metalness: 0.1,
  });
  const innerMaterial = new THREE.MeshStandardMaterial({
    color: "#4c2716",
    roughness: 0.72,
    metalness: 0.05,
  });

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.92, radius * 0.92, height, 44),
    woodMaterial,
  );
  body.position.y = height / 2;
  table.add(body);

  const topRing = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.06, 44),
    woodMaterial,
  );
  topRing.position.y = height - 0.03;
  table.add(topRing);

  const tray = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, 0.1, 44),
    innerMaterial,
  );
  tray.position.y = height - 0.05;
  table.add(tray);

  enableShadows(table);
  placePlanObject(table, center, 0, 0, furnishingGroup);
  pushPlanRectCollider(center, radius * 2, radius * 2, 0, PLAYER_RADIUS * 0.12);
}

function addChessSet(center, size, tableHeight) {
  const set = new THREE.Group();
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(size, 0.025, size),
    new THREE.MeshStandardMaterial({
      map: createChessTexture(),
      roughness: 0.86,
      metalness: 0.03,
    }),
  );
  board.position.y = tableHeight + 0.0125;
  set.add(board);

  const pieceRows = [0, 1, 6, 7];
  pieceRows.forEach((row) => {
    for (let col = 0; col < 8; col += 1) {
      if ((row === 1 || row === 6) && col > 4) {
        continue;
      }
      const dark = row < 2;
      const piece = createChessPiece(dark ? "#1e1e1d" : "#f0eee8");
      piece.position.set(
        -size / 2 + size / 16 + col * (size / 8),
        tableHeight + 0.04,
        -size / 2 + size / 16 + row * (size / 8),
      );
      set.add(piece);
    }
  });

  const phone = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.02, 0.1),
    new THREE.MeshStandardMaterial({ color: "#d9ddd9", roughness: 0.55 }),
  );
  phone.position.set(-0.34, tableHeight + 0.02, 0.28);
  set.add(phone);

  const remote = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.02, 0.05),
    new THREE.MeshStandardMaterial({ color: "#242424", roughness: 0.62 }),
  );
  remote.position.set(-0.18, tableHeight + 0.02, 0.31);
  set.add(remote);

  enableShadows(set);
  placePlanObject(set, center, 0, 0, furnishingGroup);
}

function createChessPiece(color) {
  const piece = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    metalness: 0.08,
  });

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.03, 0.05, 12),
    material,
  );
  base.position.y = 0.025;
  piece.add(base);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.018, 0.06, 12),
    material,
  );
  stem.position.y = 0.075;
  piece.add(stem);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 12, 12),
    material,
  );
  head.position.y = 0.115;
  piece.add(head);

  return enableShadows(piece);
}

function addSpeakerTower(center, rotation = 0) {
  const speaker = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 1.54, 0.22),
    new THREE.MeshStandardMaterial({
      color: "#d8d9dc",
      roughness: 0.38,
      metalness: 0.28,
    }),
  );
  body.position.y = 0.77;
  speaker.add(body);

  [0.34, 0.66, 0.98, 1.28].forEach((y, index) => {
    const driver = new THREE.Mesh(
      new THREE.CylinderGeometry(index === 0 || index === 3 ? 0.06 : 0.075, index === 0 || index === 3 ? 0.06 : 0.075, 0.05, 24),
      new THREE.MeshStandardMaterial({
        color: "#232427",
        roughness: 0.56,
        metalness: 0.24,
      }),
    );
    driver.rotation.x = Math.PI / 2;
    driver.position.set(0, y, 0.12);
    speaker.add(driver);
  });

  enableShadows(speaker);
  placePlanObject(speaker, center, 0, rotation, furnishingGroup);
  pushPlanRectCollider(center, 0.28, 0.22, rotation, PLAYER_RADIUS * 0.08);
}

function addPlushArmchair(center, rotation = 0) {
  const chair = new THREE.Group();
  const shellMaterial = new THREE.MeshStandardMaterial({
    color: "#6d4429",
    roughness: 0.82,
  });
  const cushionMaterial = new THREE.MeshStandardMaterial({
    color: "#6b7160",
    roughness: 0.95,
  });

  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.56, 0.62, 28, 1, false, Math.PI * 0.2, Math.PI * 1.55),
    shellMaterial,
  );
  shell.rotation.x = Math.PI / 2;
  shell.rotation.z = Math.PI / 2;
  shell.position.set(0, 0.45, 0);
  chair.add(shell);

  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.14, 0.62),
    cushionMaterial,
  );
  seat.position.set(0, 0.28, 0);
  chair.add(seat);

  const pillow = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.16, 0.42),
    new THREE.MeshStandardMaterial({
      color: "#859170",
      roughness: 0.97,
    }),
  );
  pillow.position.set(-0.02, 0.42, 0.06);
  chair.add(pillow);

  enableShadows(chair);
  placePlanObject(chair, center, 0, rotation, furnishingGroup);
  registerSeat(center, rotation, 1.42, 0.8, 0.35);
  pushPlanRectCollider(center, 0.92, 0.92, rotation, PLAYER_RADIUS * 0.08);
}

function addBookCluster({
  center,
  y,
  count,
  rotation = 0,
  palette = ["#d7d8da", "#697289", "#504b47", "#8b5e4a", "#4e5b70"],
  axis = "x",
}) {
  const group = new THREE.Group();
  let offset = -((count - 1) * 0.05) / 2;

  for (let i = 0; i < count; i += 1) {
    const width = 0.038 + (i % 3) * 0.008;
    const height = 0.24 + ((i * 7) % 5) * 0.05;
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(axis === "x" ? width : 0.16, height, axis === "x" ? 0.16 : width),
      new THREE.MeshStandardMaterial({
        color: palette[i % palette.length],
        roughness: 0.78,
        metalness: 0.04,
      }),
    );
    if (axis === "x") {
      book.position.set(offset, height / 2, 0);
    } else {
      book.position.set(0, height / 2, offset);
    }
    group.add(book);
    offset += width + 0.018;
  }

  enableShadows(group);
  placePlanObject(group, center, y, rotation, furnishingGroup);
}

function addPictureFrame({ center, y, size, rotation = 0, accent = "#b0b8bc" }) {
  const [width, height] = size;
  const frame = new THREE.Group();

  const outer = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.05),
    new THREE.MeshStandardMaterial({
      color: "#3a322c",
      roughness: 0.72,
    }),
  );
  outer.position.set(0, height / 2, 0);
  frame.add(outer);

  const art = new THREE.Mesh(
    new THREE.PlaneGeometry(width - 0.12, height - 0.12),
    new THREE.MeshStandardMaterial({
      map: createArtworkTexture(accent),
      roughness: 0.92,
    }),
  );
  art.position.set(0, height / 2, 0.028);
  frame.add(art);

  frame.rotation.x = -0.08;
  enableShadows(frame);
  placePlanObject(frame, center, y, rotation, furnishingGroup);
}

function addPlant({ center, y, scale = 1 }) {
  const plant = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * scale, 0.1 * scale, 0.2 * scale, 18),
    new THREE.MeshStandardMaterial({
      color: "#9a6a45",
      roughness: 0.78,
    }),
  );
  pot.position.y = 0.1 * scale;
  plant.add(pot);

  [
    [0, 0.34, 0],
    [0.08, 0.28, 0.04],
    [-0.08, 0.3, 0.02],
    [0.02, 0.3, -0.08],
    [-0.06, 0.26, -0.05],
  ].forEach(([x, py, z]) => {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.12 * scale, 12, 12),
      new THREE.MeshStandardMaterial({
        color: "#506e47",
        roughness: 0.92,
      }),
    );
    leaf.position.set(x * scale, py * scale, z * scale);
    leaf.scale.set(1, 1.4, 1);
    plant.add(leaf);
  });

  enableShadows(plant);
  placePlanObject(plant, center, y, 0, furnishingGroup);
}

function addBootPair({ center, y }) {
  const boots = new THREE.Group();
  [-0.08, 0.08].forEach((x) => {
    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.24, 0.2),
      new THREE.MeshStandardMaterial({
        color: "#6c3f2f",
        roughness: 0.82,
      }),
    );
    boot.position.set(x, 0.12, 0);
    boots.add(boot);
  });
  enableShadows(boots);
  placePlanObject(boots, center, y, 0, furnishingGroup);
}

function addDigitalClock({ center, y, text }) {
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.12, 0.12),
    new THREE.MeshStandardMaterial({
      color: "#0f1012",
      roughness: 0.42,
      metalness: 0.16,
    }),
  );
  body.position.y = 0.06;
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.06),
    new THREE.MeshBasicMaterial({
      map: createClockTexture(text),
      transparent: true,
    }),
  );
  face.position.set(0, 0.065, 0.062);

  const group = new THREE.Group();
  group.add(body);
  group.add(face);
  enableShadows(group);
  placePlanObject(group, center, y, 0, furnishingGroup);
}

function addCorkBoard({ center, y, size, rotation = 0 }) {
  const board = new THREE.Group();
  const backing = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], 0.05),
    new THREE.MeshStandardMaterial({
      map: createCorkTexture(),
      roughness: 0.95,
    }),
  );
  backing.position.y = size[1] / 2;
  board.add(backing);
  enableShadows(board);
  placePlanObject(board, center, y, rotation, furnishingGroup);
}

function addLetterTile({ center, y, label }) {
  const tile = new THREE.Group();
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.34, 0.06),
    new THREE.MeshStandardMaterial({
      color: "#f2efe7",
      roughness: 0.82,
    }),
  );
  cube.position.y = 0.17;
  tile.add(cube);

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.26),
    new THREE.MeshBasicMaterial({
      map: createCanvasTexture(128, 128, (ctx, width, height) => {
        ctx.fillStyle = "#f2efe7";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#6cac64";
        ctx.font = "700 86px Avenir Next";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, width / 2, height / 2 + 6);
      }),
      transparent: true,
    }),
  );
  face.position.set(0, 0.17, 0.031);
  tile.add(face);

  enableShadows(tile);
  placePlanObject(tile, center, y, 0, furnishingGroup);
}

function addDecorDisc({ center, y, radius }) {
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.05, 36),
    new THREE.MeshStandardMaterial({
      color: "#8b6b4a",
      roughness: 0.56,
      metalness: 0.35,
    }),
  );
  disc.rotation.z = Math.PI / 2;
  disc.position.y = radius + 0.14;
  enableShadows(disc);
  placePlanObject(disc, center, y, 0, furnishingGroup);
}

function addTrophy({ center, y, scale = 1 }) {
  const trophy = new THREE.Group();
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: "#c9a24a",
    roughness: 0.34,
    metalness: 0.82,
  });
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: "#2f251d",
    roughness: 0.72,
    metalness: 0.1,
  });

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.18 * scale, 0.06 * scale, 0.12 * scale),
    baseMaterial,
  );
  base.position.y = 0.03 * scale;
  trophy.add(base);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02 * scale, 0.024 * scale, 0.16 * scale, 14),
    metalMaterial,
  );
  stem.position.y = 0.14 * scale;
  trophy.add(stem);

  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07 * scale, 0.045 * scale, 0.12 * scale, 18),
    metalMaterial,
  );
  cup.position.y = 0.28 * scale;
  trophy.add(cup);

  [-1, 1].forEach((side) => {
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.03 * scale, 0.007 * scale, 8, 16, Math.PI),
      metalMaterial,
    );
    handle.rotation.z = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    handle.position.set(side * 0.06 * scale, 0.29 * scale, 0);
    trophy.add(handle);
  });

  enableShadows(trophy);
  placePlanObject(trophy, center, y, 0, furnishingGroup);
}

function addMiniGong({ center, y, scale = 1, rotation = 0 }) {
  const gong = new THREE.Group();
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: "#392a21",
    roughness: 0.72,
    metalness: 0.08,
  });
  const gongMaterial = new THREE.MeshStandardMaterial({
    color: "#9b7240",
    roughness: 0.44,
    metalness: 0.56,
  });

  [-0.1, 0.1].forEach((x) => {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.025 * scale, 0.28 * scale, 0.025 * scale),
      frameMaterial,
    );
    post.position.set(x * scale, 0.14 * scale, 0);
    gong.add(post);
  });

  const topBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.24 * scale, 0.025 * scale, 0.025 * scale),
    frameMaterial,
  );
  topBar.position.y = 0.27 * scale;
  gong.add(topBar);

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075 * scale, 0.075 * scale, 0.018 * scale, 24),
    gongMaterial,
  );
  disc.rotation.x = Math.PI / 2;
  disc.position.set(0, 0.16 * scale, 0);
  gong.add(disc);

  enableShadows(gong);
  placePlanObject(gong, center, y, rotation, furnishingGroup);
}

function addHangarRingGong(center, rotation = 0) {
  const gong = new THREE.Group();
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: "#cdb38b",
    roughness: 0.52,
    metalness: 0.34,
  });
  const outerDiscMaterial = new THREE.MeshStandardMaterial({
    color: "#4a4d4f",
    roughness: 0.92,
    metalness: 0.08,
  });
  const innerDiscMaterial = new THREE.MeshStandardMaterial({
    color: "#cfad71",
    roughness: 0.38,
    metalness: 0.72,
  });
  const centerCapMaterial = new THREE.MeshStandardMaterial({
    color: "#2c2e31",
    roughness: 0.84,
    metalness: 0.08,
  });

  const legX = 1.04;
  const legHeight = 0.7;
  const frameRadius = 0.024;
  const arcBaseY = legHeight;
  const apexY = 2.3;
  const outerDiscRadius = 0.94;
  const innerDiscRadius = 0.58;
  const gongCenterY = 1.24;
  const gongTopY = gongCenterY + outerDiscRadius;
  const gongBottomY = gongCenterY - outerDiscRadius;

  const addFrameTube = (start, end, radius = frameRadius) => {
    const vector = new THREE.Vector3().subVectors(end, start);
    const length = vector.length();
    const segment = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, length, 10),
      frameMaterial,
    );
    segment.position.copy(new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5));
    segment.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.normalize());
    gong.add(segment);
  };

  [-legX, legX].forEach((x) => {
    addFrameTube(new THREE.Vector3(x, 0.03, 0), new THREE.Vector3(x, legHeight, 0));
  });

  const arcCenterY = (arcBaseY ** 2 - apexY ** 2 + legX ** 2) / (2 * (arcBaseY - apexY));
  const arcRadius = apexY - arcCenterY;
  const endpointAngle = Math.atan2(arcBaseY - arcCenterY, legX);
  const leftAngle = Math.PI - endpointAngle;
  const rightAngle = endpointAngle;
  const arcPoints = [];
  const arcSegments = 48;
  for (let i = 0; i <= arcSegments; i += 1) {
    const angle = leftAngle + ((rightAngle - leftAngle) * i) / arcSegments;
    arcPoints.push(
      new THREE.Vector3(
        Math.cos(angle) * arcRadius,
        arcCenterY + Math.sin(angle) * arcRadius,
        0,
      ),
    );
  }
  const frameArc = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arcPoints), arcSegments, frameRadius, 12, false),
    frameMaterial,
  );
  gong.add(frameArc);

  const topJoin = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.055, 0.05),
    frameMaterial,
  );
  topJoin.position.set(0, apexY - 0.02, 0);
  gong.add(topJoin);

  const topBolt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.03, 10),
    new THREE.MeshStandardMaterial({
      color: "#8a7358",
      roughness: 0.5,
      metalness: 0.3,
    }),
  );
  topBolt.position.set(0, apexY - 0.005, 0.02);
  gong.add(topBolt);

  [-legX, legX].forEach((x) => {
    const joinCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(frameRadius * 1.18, frameRadius * 1.18, 0.06, 12),
      frameMaterial,
    );
    joinCollar.rotation.z = Math.PI / 2;
    joinCollar.position.set(x, arcBaseY, 0);
    gong.add(joinCollar);
  });

  const wheelBaseY = 0.045;
  const wheelDepth = 0.58;
  [-legX, legX].forEach((x) => {
    const casterUpright = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.11, 0.05),
      frameMaterial,
    );
    casterUpright.position.set(x, 0.075, 0);
    gong.add(casterUpright);

    const floorRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.035, wheelDepth),
      frameMaterial,
    );
    floorRail.position.set(x, wheelBaseY, 0);
    gong.add(floorRail);

    [-wheelDepth / 2 + 0.06, wheelDepth / 2 - 0.06].forEach((z) => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.03, 14),
        new THREE.MeshStandardMaterial({
          color: "#595d62",
          roughness: 0.68,
          metalness: 0.18,
        }),
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, wheelBaseY, z);
      gong.add(wheel);
    });
  });

  const arcHalfWidthAtY = (y) => Math.sqrt(Math.max(0, arcRadius ** 2 - (y - arcCenterY) ** 2));
  const hangerBarY = gongTopY + 0.16;
  const hangerBarHalfSpan = arcHalfWidthAtY(hangerBarY) - frameRadius * 1.6;
  addFrameTube(
    new THREE.Vector3(-hangerBarHalfSpan, hangerBarY, -0.015),
    new THREE.Vector3(hangerBarHalfSpan, hangerBarY, -0.015),
    0.008,
  );

  const lowerCrossbarY = gongBottomY - 0.12;
  addFrameTube(
    new THREE.Vector3(-legX, lowerCrossbarY, 0),
    new THREE.Vector3(legX, lowerCrossbarY, 0),
    0.012,
  );

  const hookX = innerDiscRadius * 0.78;
  const hookBottomY = gongTopY - 0.04;
  [-hookX, hookX].forEach((x) => {
    const hook = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, hangerBarY - hookBottomY, 8),
      new THREE.MeshStandardMaterial({
        color: "#242629",
        roughness: 0.8,
        metalness: 0.1,
      }),
    );
    hook.position.set(x, hookBottomY + (hangerBarY - hookBottomY) / 2, -0.015);
    gong.add(hook);
  });

  const outerDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(outerDiscRadius, outerDiscRadius, 0.08, 48),
    outerDiscMaterial,
  );
  outerDisc.rotation.x = Math.PI / 2;
  outerDisc.position.set(0, gongCenterY, 0);
  gong.add(outerDisc);

  const innerDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(innerDiscRadius, innerDiscRadius, 0.085, 48),
    innerDiscMaterial,
  );
  innerDisc.rotation.x = Math.PI / 2;
  innerDisc.position.set(0, gongCenterY, 0.004);
  gong.add(innerDisc);

  const centerCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.17, 0.09, 28),
    centerCapMaterial,
  );
  centerCap.rotation.x = Math.PI / 2;
  centerCap.position.set(0, gongCenterY, 0.01);
  gong.add(centerCap);

  enableShadows(gong);
  gong.scale.setScalar(1.25);
  placePlanObject(gong, center, 0, rotation, furnishingGroup);
  pushPlanRectCollider(center, 2.95, 0.88, rotation, PLAYER_RADIUS * 0.04);
}

function addHangarRearShelf(center, rotation = 0) {
  const shelf = new THREE.Group();
  const width = HANGAR_REAR_SHELF_WIDTH;
  const depth = 0.7;
  const height = 0.78;
  const sideThickness = 0.045;
  const topThickness = 0.05;
  const dividerThickness = 0.038;
  const dividerOffset = width * (1.9 / 4.6);
  const projectorWidth = 0.52;
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: "#0c0d0f",
    roughness: 0.74,
    metalness: 0.18,
  });
  const shelfShadowMaterial = new THREE.MeshStandardMaterial({
    color: "#16181b",
    roughness: 0.86,
    metalness: 0.08,
  });
  const screenHousingMaterial = new THREE.MeshStandardMaterial({
    color: "#0f1012",
    roughness: 0.72,
    metalness: 0.16,
  });
  const projectorTexture = new THREE.TextureLoader().load("./sqquoiasunrise.jpg");
  projectorTexture.colorSpace = THREE.SRGBColorSpace;
  projectorTexture.center.set(0.5, 0.5);
  projectorTexture.rotation = Math.PI;
  const screenMaterial = new THREE.MeshStandardMaterial({
    color: "#f2f2ee",
    emissive: "#d9deef",
    emissiveIntensity: 0.16,
    roughness: 0.26,
    metalness: 0.02,
    map: projectorTexture,
  });
  const screenBorderMaterial = new THREE.MeshStandardMaterial({
    color: "#080909",
    roughness: 0.78,
    metalness: 0.06,
  });
  const projectorBodyMaterial = new THREE.MeshStandardMaterial({
    color: "#111317",
    roughness: 0.62,
    metalness: 0.14,
  });
  const projectorLensMaterial = new THREE.MeshStandardMaterial({
    color: "#171b20",
    roughness: 0.28,
    metalness: 0.32,
  });

  const addShelfPiece = (size, position, material = frameMaterial) => {
    const piece = new THREE.Mesh(
      new THREE.BoxGeometry(size[0], size[1], size[2]),
      material,
    );
    piece.position.set(position[0], position[1], position[2]);
    shelf.add(piece);
  };

  addShelfPiece([width, topThickness, depth], [0, height - topThickness / 2, 0]);
  addShelfPiece([width, topThickness, depth], [0, topThickness / 2, 0], shelfShadowMaterial);
  addShelfPiece([sideThickness, height, depth], [-width / 2 + sideThickness / 2, height / 2, 0]);
  addShelfPiece([sideThickness, height, depth], [width / 2 - sideThickness / 2, height / 2, 0]);
  addShelfPiece([width - sideThickness * 2, height - topThickness * 2, 0.03], [0, height / 2, depth / 2 - 0.015], shelfShadowMaterial);

  [-dividerOffset, 0, dividerOffset].forEach((x) => {
    addShelfPiece([dividerThickness, height - topThickness * 2, depth - 0.02], [x, height / 2 - 0.01, 0]);
  });

  addShelfPiece([width - sideThickness * 2, dividerThickness, depth - 0.02], [0, height * 0.5, 0], shelfShadowMaterial);

  [-width / 2 + 0.18, width / 2 - 0.18].forEach((x) => {
    [-depth / 2 + 0.08, depth / 2 - 0.08].forEach((z) => {
      addShelfPiece([0.08, 0.06, 0.08], [x, 0.03, z], shelfShadowMaterial);
    });
  });

  const screenGroup = new THREE.Group();
  screenGroup.position.set(0, height + 2.88, depth / 2 - 0.12);
  screenGroup.rotation.y = Math.PI;

  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.14, 0.18),
    screenHousingMaterial,
  );
  housing.position.y = 0.08;
  screenGroup.add(housing);

  const screenBorder = new THREE.Mesh(
    new THREE.BoxGeometry(4.02, 2.84, 0.04),
    screenBorderMaterial,
  );
  screenBorder.position.set(0, -1.42, 0.02);
  screenGroup.add(screenBorder);

  const screenFace = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 2.62),
    screenMaterial,
  );
  screenFace.position.set(0, -1.42, 0.085);
  screenGroup.add(screenFace);

  const lowerBar = new THREE.Mesh(
    new THREE.BoxGeometry(3.88, 0.06, 0.06),
    screenHousingMaterial,
  );
  lowerBar.position.set(0, -2.82, 0.04);
  screenGroup.add(lowerBar);

  const leftSupport = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 2.88, 0.08),
    screenHousingMaterial,
  );
  leftSupport.position.set(-1.92, -1.36, 0.08);
  screenGroup.add(leftSupport);

  const rightSupport = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 2.88, 0.08),
    screenHousingMaterial,
  );
  rightSupport.position.set(1.92, -1.36, 0.08);
  screenGroup.add(rightSupport);

  const projector = new THREE.Group();
  const projectorBody = new THREE.Mesh(
    new THREE.BoxGeometry(projectorWidth, 0.16, 0.28),
    projectorBodyMaterial,
  );
  projector.add(projectorBody);

  const projectorTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.03, 0.16),
    screenHousingMaterial,
  );
  projectorTop.position.set(0.02, 0.095, 0);
  projector.add(projectorTop);

  const projectorLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.05, 0.12, 18),
    projectorLensMaterial,
  );
  projectorLens.rotation.x = Math.PI / 2;
  projectorLens.position.set(0, 0, -0.18);
  projector.add(projectorLens);

  const projectorRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.058, 0.008, 8, 18),
    screenHousingMaterial,
  );
  projectorRing.position.set(0, 0, -0.245);
  projector.add(projectorRing);

  const projectorFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.035, 0.14),
    screenHousingMaterial,
  );
  projectorFoot.position.set(0, -0.095, 0.02);
  projector.add(projectorFoot);

  projector.position.set(width / 2 - 0.72, height + 0.17, 0.05);
  projector.rotation.y = Math.PI;
  shelf.add(projector);

  shelf.add(screenGroup);

  enableShadows(shelf);
  placePlanObject(shelf, center, 0, rotation, furnishingGroup);
  pushPlanRectCollider(center, width, depth, rotation, PLAYER_RADIUS * 0.06);
}

function addHangarRearHorseStatue() {
  const statue = createRearingHorseStatue(3.6);
  placePlanObject(
    statue,
    [11.1, 34.1],
    0,
    THREE.MathUtils.degToRad(245),
    furnishingGroup,
  );
}

function createRearingHorseStatue(targetHeight = 3) {
  const statue = new THREE.Group();
  gltfLoader.load(
    HORSE_STATUE_MODEL_URL,
    (gltf) => {
      const sculpture = gltf.scene;
      sculpture.updateMatrixWorld(true);
      applyArmyGreenStatueMaterial(sculpture);
      normalizeStatueModel(sculpture, targetHeight);
      const sculptureBounds = new THREE.Box3().setFromObject(sculpture);
      statue.clear();
      statue.add(sculpture);
      addCowboyHatToStatue(statue, sculptureBounds);
      finalizeHorseStatuePlacement(statue, sculptureBounds);
    },
    undefined,
    (error) => {
      console.error("Unable to load horse statue GLTF; using procedural fallback.", error);
      statue.clear();
      statue.add(createProceduralRearingHorseStatue(targetHeight));
      finalizeHorseStatuePlacement(statue);
    },
  );
  return statue;
}

function applyArmyGreenStatueMaterial(model) {
  model.traverse((child) => {
    if (child.isMesh) {
      child.material = horseStatueMaterial;
    }
  });
}

function normalizeStatueModel(model, targetHeight) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  bounds.getSize(size);
  const heightScale = targetHeight / Math.max(size.y, 0.001);
  model.scale.setScalar(heightScale);
  model.updateMatrixWorld(true);

  const scaledBounds = new THREE.Box3().setFromObject(model);
  model.position.x -= (scaledBounds.min.x + scaledBounds.max.x) / 2;
  model.position.y -= scaledBounds.min.y;
  model.position.z -= (scaledBounds.min.z + scaledBounds.max.z) / 2;
  model.updateMatrixWorld(true);
}

function addCowboyHatToStatue(statue, sculptureBounds) {
  const size = new THREE.Vector3();
  sculptureBounds.getSize(size);
  const hat = createCowboyHat();
  hat.scale.setScalar(1.35);
  const baseHatPosition = new THREE.Vector3(
    sculptureBounds.max.x - size.x * 0.17,
    sculptureBounds.max.y - size.y * 0.03,
    sculptureBounds.min.z + size.z * 0.55,
  );
  const worldHatPosition = statue.localToWorld(baseHatPosition.clone());
  worldHatPosition.x += 0.25;
  worldHatPosition.y -= 0.08;
  worldHatPosition.z -= 1.0;
  hat.position.copy(statue.worldToLocal(worldHatPosition));
  hat.rotation.z = -0.3;
  hat.rotation.x = 0.12;
  hat.rotation.y = 0.08;
  statue.add(hat);
}

function createCowboyHat() {
  const hat = new THREE.Group();
  const hatMaterial = new THREE.MeshStandardMaterial({
    color: "#826344",
    roughness: 0.84,
    metalness: 0.06,
  });
  const hatBandMaterial = new THREE.MeshStandardMaterial({
    color: "#2a1b12",
    roughness: 0.72,
    metalness: 0.1,
  });

  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.36, 0.034, 28),
    hatMaterial,
  );
  brim.scale.x = 1.45;
  hat.add(brim);

  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.21, 0.32, 22),
    hatMaterial,
  );
  crown.position.y = 0.17;
  crown.scale.x = 0.94;
  hat.add(crown);

  const hatBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.176, 0.055, 22),
    hatBandMaterial,
  );
  hatBand.position.y = 0.06;
  hatBand.scale.x = 0.96;
  hat.add(hatBand);

  return hat;
}

function finalizeHorseStatuePlacement(statue, sculptureBounds = null) {
  const localBounds = sculptureBounds ?? new THREE.Box3().setFromObject(statue);
  statue.position.y -= localBounds.min.y + HORSE_STATUE_GROUND_OFFSET;
  statue.updateWorldMatrix(true, true);
  enableShadows(statue);
  setLayerRecursive(statue, HANGAR_LIGHTING_LAYER);

  const colliderRects = getHorseStatueColliderRects(statue, localBounds);
  if (!Array.isArray(statue.userData.colliderRectIndices)) {
    statue.userData.colliderRectIndices = [];
  }

  colliderRects.forEach((rect, index) => {
    const existingIndex = statue.userData.colliderRectIndices[index];
    if (Number.isInteger(existingIndex)) {
      furnitureRects[existingIndex] = rect;
      return;
    }
    statue.userData.colliderRectIndices[index] = furnitureRects.push(rect) - 1;
  });
}

function getHorseStatueColliderRects(statue, bounds) {
  const size = new THREE.Vector3();
  bounds.getSize(size);
  const padding = PLAYER_RADIUS * 0.08;

  return [
    { x: bounds.min.x + size.x * 0.28, z: bounds.min.z + size.z * 0.52, width: size.x * 0.24, depth: size.z * 0.42 },
    { x: bounds.min.x + size.x * 0.46, z: bounds.min.z + size.z * 0.5, width: size.x * 0.26, depth: size.z * 0.46 },
    { x: bounds.min.x + size.x * 0.64, z: bounds.min.z + size.z * 0.48, width: size.x * 0.2, depth: size.z * 0.32 },
  ].map(({ x, z, width, depth }) =>
    axisAlignedBoundsForRotatedRect(
      localPointToWorldXZ(statue, x, z),
      width,
      depth,
      statue.rotation.y,
      padding,
    )
  );
}

function createProceduralRearingHorseStatue(targetHeight = 3) {
  const statue = new THREE.Group();
  const sculpture = new THREE.Group();
  statue.add(sculpture);

  const sphereGeometry = new THREE.SphereGeometry(1, 22, 16);
  const up = new THREE.Vector3(0, 1, 0);
  const patinaMaterial = new THREE.MeshStandardMaterial({
    color: "#536b63",
    roughness: 0.82,
    metalness: 0.26,
    emissive: "#1b2f28",
    emissiveIntensity: 0.07,
  });
  const darkPatinaMaterial = new THREE.MeshStandardMaterial({
    color: "#2f4039",
    roughness: 0.88,
    metalness: 0.18,
  });
  const faceDetailMaterial = new THREE.MeshStandardMaterial({
    color: "#050706",
    roughness: 0.58,
    metalness: 0.04,
    emissive: "#000000",
    emissiveIntensity: 0.42,
  });
  const mouthCavityMaterial = new THREE.MeshBasicMaterial({
    color: "#020202",
  });
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: "#5d6e66",
    roughness: 0.94,
    metalness: 0.14,
  });
  const hatMaterial = new THREE.MeshStandardMaterial({
    color: "#7a5634",
    roughness: 0.82,
    metalness: 0.08,
  });
  const hatBandMaterial = new THREE.MeshStandardMaterial({
    color: "#2a1b12",
    roughness: 0.72,
    metalness: 0.12,
  });

  const addScaledSphere = (parent, position, scale, material, rotation = new THREE.Euler()) => {
    const mesh = new THREE.Mesh(sphereGeometry, material);
    mesh.position.copy(position);
    mesh.rotation.copy(rotation);
    mesh.scale.copy(scale);
    parent.add(mesh);
    return mesh;
  };

  const addExtrudedPart = (shape, {
    depth,
    material,
    zOffset = 0,
    bevelSize = 0.045,
    bevelThickness = 0.05,
  }) => {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      steps: 1,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize,
      bevelThickness,
      curveSegments: 28,
    });
    geometry.translate(0, 0, zOffset - depth / 2);
    const mesh = new THREE.Mesh(geometry, material);
    sculpture.add(mesh);
    return mesh;
  };

  const addSegment = (parent, start, end, startRadius, endRadius, material) => {
    const vector = new THREE.Vector3().subVectors(end, start);
    const length = vector.length();
    if (length < 0.001) {
      return null;
    }

    const segment = new THREE.Mesh(
      new THREE.CylinderGeometry(endRadius, startRadius, length, 14),
      material,
    );
    segment.position.copy(start.clone().add(end).multiplyScalar(0.5));
    segment.quaternion.setFromUnitVectors(up, vector.normalize());
    parent.add(segment);
    return segment;
  };

  const addLimb = (points, radii, material, hoofSize = [0.11, 0.07, 0.13]) => {
    for (let i = 0; i < points.length - 1; i += 1) {
      addSegment(sculpture, points[i], points[i + 1], radii[i], radii[i + 1], material);
    }

    for (let i = 1; i < points.length - 1; i += 1) {
      addScaledSphere(
        sculpture,
        points[i],
        new THREE.Vector3(radii[i] * 1.25, radii[i] * 1.4, radii[i] * 1.25),
        material,
      );
    }

    const hoof = new THREE.Mesh(
      new THREE.BoxGeometry(hoofSize[0], hoofSize[1], hoofSize[2]),
      darkPatinaMaterial,
    );
    const hoofVector = new THREE.Vector3().subVectors(points[points.length - 1], points[points.length - 2]);
    const hoofDirection = hoofVector.clone().normalize();
    hoof.position.copy(points[points.length - 1]).addScaledVector(hoofDirection, hoofSize[2] * 0.16);
    hoof.position.y += hoofSize[1] * 0.2;
    hoof.quaternion.setFromUnitVectors(up, hoofDirection);
    sculpture.add(hoof);
  };

  [
    { position: new THREE.Vector3(0.04, 0.08, 0), scale: new THREE.Vector3(0.82, 0.11, 0.54) },
    { position: new THREE.Vector3(-0.34, 0.11, 0.1), scale: new THREE.Vector3(0.24, 0.12, 0.18) },
    { position: new THREE.Vector3(0.28, 0.09, -0.08), scale: new THREE.Vector3(0.26, 0.1, 0.18) },
  ].forEach(({ position, scale }) => {
    addScaledSphere(sculpture, position, scale, baseMaterial);
  });

  const torsoShape = new THREE.Shape();
  torsoShape.moveTo(-0.48, 0.76);
  torsoShape.quadraticCurveTo(-0.56, 1.16, -0.38, 1.62);
  torsoShape.quadraticCurveTo(-0.18, 2.02, 0.08, 2.08);
  torsoShape.quadraticCurveTo(0.28, 2.06, 0.38, 1.84);
  torsoShape.quadraticCurveTo(0.46, 1.56, 0.36, 1.18);
  torsoShape.quadraticCurveTo(0.22, 0.8, -0.02, 0.68);
  torsoShape.quadraticCurveTo(-0.24, 0.62, -0.48, 0.76);
  addExtrudedPart(torsoShape, {
    depth: 0.56,
    material: patinaMaterial,
    bevelSize: 0.05,
    bevelThickness: 0.06,
  });

  const neckHeadShape = new THREE.Shape();
  neckHeadShape.moveTo(0.02, 1.82);
  neckHeadShape.quadraticCurveTo(0.12, 2.12, 0.22, 2.48);
  neckHeadShape.quadraticCurveTo(0.34, 2.92, 0.42, 3.12);
  neckHeadShape.lineTo(0.5, 3.0);
  neckHeadShape.quadraticCurveTo(0.72, 2.96, 0.94, 2.78);
  neckHeadShape.quadraticCurveTo(0.9, 2.58, 0.74, 2.38);
  neckHeadShape.quadraticCurveTo(0.56, 2.16, 0.34, 1.94);
  neckHeadShape.quadraticCurveTo(0.16, 1.74, 0.02, 1.82);
  addExtrudedPart(neckHeadShape, {
    depth: 0.34,
    material: patinaMaterial,
    bevelSize: 0.035,
    bevelThickness: 0.045,
  });

  addScaledSphere(
    sculpture,
    new THREE.Vector3(-0.18, 0.96, 0),
    new THREE.Vector3(0.38, 0.48, 0.28),
    patinaMaterial,
    new THREE.Euler(0, 0, -0.18),
  );
  addScaledSphere(
    sculpture,
    new THREE.Vector3(0.02, 1.34, 0),
    new THREE.Vector3(0.4, 0.74, 0.28),
    patinaMaterial,
    new THREE.Euler(0, 0, 0.16),
  );
  addScaledSphere(
    sculpture,
    new THREE.Vector3(0.18, 1.64, 0),
    new THREE.Vector3(0.22, 0.32, 0.24),
    patinaMaterial,
    new THREE.Euler(0, 0, 0.28),
  );
  addScaledSphere(
    sculpture,
    new THREE.Vector3(0.66, 2.66, 0),
    new THREE.Vector3(0.11, 0.09, 0.1),
    darkPatinaMaterial,
  );

  [
    [0.4, 3.12, 0.08, -0.22],
    [0.4, 3.12, -0.08, 0.22],
  ].forEach(([x, y, z, tilt]) => {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.04, 0.18, 12),
      darkPatinaMaterial,
    );
    ear.position.set(x, y, z);
    ear.rotation.z = tilt;
    ear.rotation.x = z > 0 ? 0.18 : -0.18;
    sculpture.add(ear);
  });

  const cowboyHat = new THREE.Group();
  cowboyHat.position.set(0.45, 3.18, 0);
  cowboyHat.rotation.z = -0.18;
  cowboyHat.rotation.x = 0.04;

  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.4, 0.036, 28),
    hatMaterial,
  );
  brim.scale.x = 1.48;
  cowboyHat.add(brim);

  const crown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.23, 0.36, 22),
    hatMaterial,
  );
  crown.position.y = 0.19;
  crown.scale.x = 0.96;
  cowboyHat.add(crown);

  const hatBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.188, 0.194, 0.06, 22),
    hatBandMaterial,
  );
  hatBand.position.y = 0.065;
  hatBand.scale.x = 0.98;
  cowboyHat.add(hatBand);

  sculpture.add(cowboyHat);

  [-1, 1].forEach((side) => {
    const eyeSocket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.06, 0.09, 16),
      faceDetailMaterial,
    );
    eyeSocket.rotation.z = Math.PI / 2;
    eyeSocket.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    eyeSocket.position.set(0.56, 2.88, side * 0.19);
    sculpture.add(eyeSocket);
  });

  [-1, 1].forEach((side) => {
    const mouthSlit = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.03, 0.14),
      mouthCavityMaterial,
    );
    mouthSlit.position.set(0.82, 2.64, side * 0.17);
    mouthSlit.rotation.z = -0.3;
    mouthSlit.rotation.y = side * 0.42;
    sculpture.add(mouthSlit);
  });

  const maneShape = new THREE.Shape();
  maneShape.moveTo(-0.14, 1.92);
  maneShape.quadraticCurveTo(-0.02, 2.16, 0.1, 2.44);
  maneShape.quadraticCurveTo(0.22, 2.78, 0.34, 3.18);
  maneShape.lineTo(0.24, 3.12);
  maneShape.quadraticCurveTo(0.08, 2.78, -0.08, 2.42);
  maneShape.quadraticCurveTo(-0.18, 2.14, -0.24, 1.96);
  addExtrudedPart(maneShape, {
    depth: 0.22,
    material: darkPatinaMaterial,
    bevelSize: 0.024,
    bevelThickness: 0.03,
  });

  [
    { position: new THREE.Vector3(0.08, 2.04, 0), rotationZ: 0.5, size: [0.1, 0.24, 0.04] },
    { position: new THREE.Vector3(0.16, 2.24, 0), rotationZ: 0.44, size: [0.11, 0.26, 0.04] },
    { position: new THREE.Vector3(0.24, 2.46, 0), rotationZ: 0.34, size: [0.1, 0.24, 0.04] },
    { position: new THREE.Vector3(0.32, 2.68, 0), rotationZ: 0.22, size: [0.09, 0.22, 0.035] },
  ].forEach(({ position, rotationZ, size }) => {
    const maneBlade = new THREE.Mesh(
      new THREE.BoxGeometry(size[0], size[1], size[2]),
      darkPatinaMaterial,
    );
    maneBlade.position.copy(position);
    maneBlade.rotation.z = rotationZ;
    sculpture.add(maneBlade);
  });

  const tail = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.44, 1.16, -0.03),
        new THREE.Vector3(-0.6, 0.86, -0.05),
        new THREE.Vector3(-0.56, 0.46, 0.03),
        new THREE.Vector3(-0.32, 0.08, 0.12),
      ]),
      40,
      0.058,
      10,
      false,
    ),
    darkPatinaMaterial,
  );
  sculpture.add(tail);

  const tailPlume = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.09, 0.46, 14),
    darkPatinaMaterial,
  );
  tailPlume.position.set(-0.45, 0.24, 0.14);
  tailPlume.rotation.z = 0.78;
  tailPlume.rotation.x = -0.14;
  sculpture.add(tailPlume);

  const tailTip = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.24, 14),
    darkPatinaMaterial,
  );
  tailTip.position.set(-0.58, 0.08, 0.22);
  tailTip.rotation.z = 0.96;
  tailTip.rotation.x = -0.18;
  sculpture.add(tailTip);

  addScaledSphere(
    sculpture,
    new THREE.Vector3(-0.38, 0.34, 0.14),
    new THREE.Vector3(0.08, 0.14, 0.08),
    darkPatinaMaterial,
    new THREE.Euler(0, 0, 0.58),
  );

  addLimb(
    [
      new THREE.Vector3(-0.14, 0.78, 0.15),
      new THREE.Vector3(-0.22, 0.42, 0.16),
      new THREE.Vector3(-0.12, 0.14, 0.18),
      new THREE.Vector3(-0.04, 0.02, 0.19),
    ],
    [0.11, 0.095, 0.075, 0.065],
    patinaMaterial,
  );
  addLimb(
    [
      new THREE.Vector3(-0.28, 0.82, -0.13),
      new THREE.Vector3(-0.34, 0.48, -0.14),
      new THREE.Vector3(-0.28, 0.18, -0.14),
      new THREE.Vector3(-0.2, 0.02, -0.13),
    ],
    [0.105, 0.09, 0.07, 0.06],
    patinaMaterial,
  );
  addLimb(
    [
      new THREE.Vector3(0.22, 1.64, 0.14),
      new THREE.Vector3(0.62, 1.56, 0.16),
      new THREE.Vector3(1.08, 1.7, 0.2),
      new THREE.Vector3(1.4, 1.38, 0.22),
      new THREE.Vector3(1.5, 1.18, 0.22),
    ],
    [0.09, 0.08, 0.07, 0.06, 0.055],
    patinaMaterial,
    [0.12, 0.07, 0.11],
  );
  addLimb(
    [
      new THREE.Vector3(0.14, 1.56, -0.12),
      new THREE.Vector3(0.46, 1.44, -0.14),
      new THREE.Vector3(0.84, 1.54, -0.18),
      new THREE.Vector3(1.04, 1.22, -0.2),
      new THREE.Vector3(1.08, 1.0, -0.2),
    ],
    [0.085, 0.075, 0.065, 0.055, 0.05],
    patinaMaterial,
    [0.11, 0.07, 0.1],
  );

  const bounds = new THREE.Box3().setFromObject(sculpture);
  const size = new THREE.Vector3();
  bounds.getSize(size);
  const heightScale = targetHeight / Math.max(size.y, 0.001);
  sculpture.scale.setScalar(heightScale);
  sculpture.updateMatrixWorld(true);

  const scaledBounds = new THREE.Box3().setFromObject(sculpture);
  sculpture.position.x -= (scaledBounds.min.x + scaledBounds.max.x) / 2;
  sculpture.position.y -= scaledBounds.min.y;
  sculpture.position.z -= (scaledBounds.min.z + scaledBounds.max.z) / 2;

  enableShadows(statue);
  return statue;
}

function addDisplayCaseDecor({ center, y, rotation = 0, size = [0.42, 0.26, 0.22] }) {
  const [width, height, depth] = size;
  const caseGroup = new THREE.Group();
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: "#3f444b",
    roughness: 0.54,
    metalness: 0.26,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: "#edf7ff",
    roughness: 0.04,
    metalness: 0.04,
    transparent: true,
    opacity: 0.12,
    transmission: 0.78,
    thickness: 0.02,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: "#d7dadf",
    roughness: 0.38,
    metalness: 0.22,
  });

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.04, depth),
    baseMaterial,
  );
  base.position.y = 0.02;
  caseGroup.add(base);

  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.03, height, depth - 0.03),
    glassMaterial,
  );
  glass.position.y = height / 2 + 0.04;
  caseGroup.add(glass);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.04, 0.09, 14),
    accentMaterial,
  );
  pedestal.position.y = 0.085;
  caseGroup.add(pedestal);

  const artifact = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.05, 0.04),
    new THREE.MeshStandardMaterial({
      color: "#6f7377",
      roughness: 0.44,
      metalness: 0.34,
    }),
  );
  artifact.position.y = 0.14;
  caseGroup.add(artifact);

  enableShadows(caseGroup);
  placePlanObject(caseGroup, center, y, rotation, furnishingGroup);
}

function createTwoTierDisplayShelf({ width, height, depth, withItems, theme = "default" }) {
  const isBlack = theme === "black";
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: isBlack ? "#17191c" : "#575d66",
    roughness: isBlack ? 0.78 : 0.72,
    metalness: isBlack ? 0.18 : 0.12,
  });
  const backMaterial = new THREE.MeshStandardMaterial({
    color: isBlack ? "#343a42" : "#4f5660",
    roughness: isBlack ? 0.82 : 0.78,
    metalness: isBlack ? 0.08 : 0.04,
  });
  const shelfLayerMaterial = new THREE.MeshStandardMaterial({
    color: isBlack ? "#22262b" : "#69717b",
    roughness: isBlack ? 0.68 : 0.62,
    metalness: isBlack ? 0.12 : 0.08,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: isBlack ? "#2c3137" : "#767d87",
    roughness: isBlack ? 0.64 : 0.58,
    metalness: isBlack ? 0.22 : 0.18,
  });
  const board = 0.04;

  const cabinet = new THREE.Group();
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.02),
    backMaterial,
  );
  back.position.set(0, height / 2, depth / 2 - 0.01);
  cabinet.add(back);

  const sideGeometry = new THREE.BoxGeometry(board, height, depth);
  [-width / 2 + board / 2, width / 2 - board / 2].forEach((x) => {
    const side = new THREE.Mesh(sideGeometry, frameMaterial);
    side.position.set(x, height / 2, 0);
    cabinet.add(side);
  });

  [board / 2, height / 2, height - board / 2].forEach((y, index) => {
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(width, index === 2 ? 0.06 : board, depth),
      index === 1 ? shelfLayerMaterial : frameMaterial,
    );
    shelf.position.set(0, y, 0);
    cabinet.add(shelf);
  });

  const faceTrim = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.06, 0.025),
    trimMaterial,
  );
  faceTrim.position.set(0, height - 0.08, -depth / 2 + 0.0125);
  cabinet.add(faceTrim);

  if (withItems) {
    [
      { x: -1.48, z: -0.03, scale: 0.98 },
      { x: -0.72, z: -0.03, scale: 1.05 },
      { x: 0.0, z: -0.02, scale: 1.15 },
      { x: 0.72, z: -0.03, scale: 1.05 },
      { x: 1.46, z: -0.03, scale: 0.98 },
    ].forEach(({ x, z, scale }) => {
      addFoldedSweatshirtStack(cabinet, { x, y: 0.05, z }, scale);
    });
    addZynCanRow(cabinet, {
      y: height / 2 + 0.035,
      z: -0.02,
      startX: -1.5,
      count: 12,
      spacing: 0.27,
    });
    addZynCanRow(cabinet, {
      y: height - 0.095,
      z: -0.02,
      startX: -1.36,
      count: 10,
      spacing: 0.27,
    });

    [
      { x: -1.05, y: height / 2 + 0.06, z: 0.11, width: 0.36, height: 0.22, depth: 0.18 },
      { x: 0.08, y: height / 2 + 0.06, z: 0.11, width: 0.42, height: 0.26, depth: 0.2 },
      { x: 1.08, y: height / 2 + 0.06, z: 0.1, width: 0.34, height: 0.2, depth: 0.17 },
      { x: -0.72, y: height - 0.09, z: 0.11, width: 0.28, height: 0.18, depth: 0.16 },
      { x: 0.56, y: height - 0.09, z: 0.11, width: 0.32, height: 0.2, depth: 0.17 },
    ].forEach(({ x, y, z, width: itemWidth, height: itemHeight, depth: itemDepth }, index) => {
      const display = new THREE.Group();
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(itemWidth, 0.03, itemDepth),
        new THREE.MeshStandardMaterial({
          color: "#50565e",
          roughness: 0.56,
          metalness: 0.22,
        }),
      );
      base.position.y = 0.015;
      display.add(base);

      const cover = new THREE.Mesh(
        new THREE.BoxGeometry(itemWidth - 0.02, itemHeight, itemDepth - 0.02),
        new THREE.MeshStandardMaterial({
          color: "#edf7ff",
          roughness: 0.04,
          metalness: 0.04,
          transparent: true,
          opacity: 0.1,
          transmission: 0.72,
          thickness: 0.02,
        }),
      );
      cover.position.y = itemHeight / 2 + 0.03;
      display.add(cover);

      const artifact = new THREE.Mesh(
        new THREE.BoxGeometry(itemWidth * 0.24, itemHeight * 0.22, itemDepth * 0.2),
        new THREE.MeshStandardMaterial({
          color: index % 2 === 0 ? "#c4ccd4" : "#8d7652",
          roughness: 0.42,
          metalness: 0.28,
        }),
      );
      artifact.position.y = 0.06;
      artifact.rotation.y = index % 2 === 0 ? 0.2 : -0.28;
      display.add(artifact);

      display.position.set(x, y, z);
      enableShadows(display);
      cabinet.add(display);
    });
  }

  return enableShadows(cabinet);
}

function createSolidDisplayShelf({ width, height, depth }) {
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: "#575d66",
    roughness: 0.72,
    metalness: 0.12,
  });
  const backingMaterial = new THREE.MeshStandardMaterial({
    color: "#4f5660",
    roughness: 0.78,
    metalness: 0.04,
  });

  const cabinet = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    frameMaterial,
  );
  body.position.y = height / 2;
  cabinet.add(body);

  const inset = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.1, height - 0.1, depth - 0.08),
    backingMaterial,
  );
  inset.position.set(0, height / 2, 0.02);
  cabinet.add(inset);

  const topCap = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.04, 0.06, depth + 0.02),
    frameMaterial,
  );
  topCap.position.set(0, height - 0.03, 0);
  cabinet.add(topCap);

  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.04, 0.08, depth + 0.02),
    frameMaterial,
  );
  plinth.position.set(0, 0.04, 0);
  cabinet.add(plinth);

  return enableShadows(cabinet);
}

function addFoldedSweatshirtStack(parent, position, scale = 1) {
  const stack = new THREE.Group();
  const shades = ["#3d5d47", "#4d765b", "#5f8867"];

  shades.forEach((color, index) => {
    const folded = new THREE.Mesh(
      new THREE.BoxGeometry(0.28 * scale, 0.045 * scale, 0.22 * scale),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.96,
      }),
    );
    folded.position.set(0, index * 0.05 * scale + 0.022 * scale, 0);
    stack.add(folded);

    const cuff = new THREE.Mesh(
      new THREE.BoxGeometry(0.09 * scale, 0.012 * scale, 0.2 * scale),
      new THREE.MeshStandardMaterial({
        color: "#2f4939",
        roughness: 0.98,
      }),
    );
    cuff.position.set(0.08 * scale, index * 0.05 * scale + 0.034 * scale, 0);
    stack.add(cuff);
  });

  stack.position.set(position.x, position.y, position.z);
  enableShadows(stack);
  parent.add(stack);
}

function addZynCanRow(parent, {
  y,
  z = 0,
  startX,
  count,
  spacing,
}) {
  const lidColors = ["#6d8fb4", "#8aa3bf", "#58789d"];

  for (let i = 0; i < count; i += 1) {
    const can = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.035, 24),
      new THREE.MeshStandardMaterial({
        color: "#f5f7f8",
        roughness: 0.42,
        metalness: 0.08,
      }),
    );
    can.add(body);

    const lid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.01, 24),
      new THREE.MeshStandardMaterial({
        color: lidColors[i % lidColors.length],
        roughness: 0.3,
        metalness: 0.16,
      }),
    );
    lid.position.y = 0.0225;
    can.add(lid);

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.07, 0.02),
      new THREE.MeshBasicMaterial({
        map: createCanvasTexture(96, 32, (ctx, width, height) => {
          ctx.fillStyle = "#f5f7f8";
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = "#27486b";
          ctx.font = "700 18px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("ZYN", width / 2, height / 2 + 1);
        }),
        transparent: true,
      }),
    );
    label.position.set(0, 0, 0.051);
    can.add(label);

    can.position.set(startX + i * spacing, y, z);
    enableShadows(can);
    parent.add(can);
  }
}

function createCanvasTexture(width, height, drawFn) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  drawFn(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createDisplaySceneTexture(scene = "forest") {
  return createCanvasTexture(640, 360, (ctx, width, height) => {
    const palettes = {
      forest: {
        skyTop: "#d7ecff",
        skyBottom: "#a8d59a",
        horizon: "#76a95f",
        accent: "#f6d7a8",
      },
      coast: {
        skyTop: "#9fd3ff",
        skyBottom: "#e4f6ff",
        horizon: "#4f89b8",
        accent: "#f4dfb6",
      },
      control: {
        skyTop: "#1d2632",
        skyBottom: "#33465d",
        horizon: "#11161e",
        accent: "#8fd3ff",
      },
      aurora: {
        skyTop: "#06111f",
        skyBottom: "#10253a",
        horizon: "#0b1624",
        accent: "#7fffd4",
      },
    };

    const palette = palettes[scene] ?? palettes.forest;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, palette.skyTop);
    gradient.addColorStop(0.58, palette.skyBottom);
    gradient.addColorStop(1, palette.horizon);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    if (scene === "forest") {
      for (let i = 0; i < 14; i += 1) {
        const x = (i / 13) * width + ((i % 2) * 18 - 9);
        const trunkWidth = 18 + (i % 4) * 8;
        ctx.fillStyle = i % 2 === 0 ? "#7b4c34" : "#915d3e";
        ctx.fillRect(x, 0, trunkWidth, height);
        ctx.fillStyle = "rgba(255, 220, 180, 0.22)";
        ctx.fillRect(x + trunkWidth * 0.18, 0, trunkWidth * 0.14, height);
      }
      ctx.fillStyle = "#4d8c45";
      ctx.fillRect(0, height * 0.74, width, height * 0.26);
    } else if (scene === "coast") {
      ctx.fillStyle = "#3e7fb2";
      ctx.fillRect(0, height * 0.62, width, height * 0.38);
      ctx.fillStyle = "#e8d3aa";
      ctx.fillRect(0, height * 0.76, width, height * 0.24);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      for (let i = 0; i < 9; i += 1) {
        ctx.fillRect(0, height * (0.64 + i * 0.03), width, 3);
      }
    } else if (scene === "control") {
      ctx.fillStyle = "#0d1117";
      ctx.fillRect(0, 0, width, height);
      for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          ctx.fillStyle = row === 0 ? "#7fd0ff" : row === 1 ? "#91f2b2" : "#ffd27f";
          ctx.fillRect(36 + col * 146, 42 + row * 88, 104, 50);
          ctx.strokeStyle = "rgba(255,255,255,0.14)";
          ctx.strokeRect(36 + col * 146, 42 + row * 88, 104, 50);
        }
      }
    } else if (scene === "aurora") {
      ctx.fillStyle = "#08131f";
      ctx.fillRect(0, 0, width, height);
      const aurora = ctx.createLinearGradient(width * 0.15, 0, width * 0.85, height);
      aurora.addColorStop(0, "rgba(64, 255, 208, 0)");
      aurora.addColorStop(0.35, "rgba(64, 255, 208, 0.65)");
      aurora.addColorStop(0.65, "rgba(155, 116, 255, 0.4)");
      aurora.addColorStop(1, "rgba(64, 255, 208, 0)");
      ctx.fillStyle = aurora;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#0b1624";
      ctx.fillRect(0, height * 0.78, width, height * 0.22);
    }

    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(width * 0.78, height * 0.24, 28, 0, Math.PI * 2);
    ctx.fill();
  });
}

function createWovenRugTexture() {
  return createCanvasTexture(640, 448, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#1a3c3f");
    gradient.addColorStop(0.45, "#14464c");
    gradient.addColorStop(1, "#0d1b1e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 320; i += 1) {
      const alpha = 0.05 + (i % 5) * 0.012;
      ctx.strokeStyle = `rgba(${20 + (i % 4) * 12}, ${70 + (i % 6) * 14}, ${74 + (i % 3) * 10}, ${alpha})`;
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      ctx.moveTo((i * 17) % width, 0);
      ctx.lineTo(((i * 17) % width) + Math.sin(i * 0.33) * 28, height);
      ctx.stroke();
    }

    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.1, width / 2, height / 2, width * 0.7);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.34)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  });
}

function createChessTexture() {
  return createCanvasTexture(256, 256, (ctx, width, height) => {
    const square = width / 8;
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        ctx.fillStyle = (row + col) % 2 === 0 ? "#dcc7a3" : "#6b4630";
        ctx.fillRect(col * square, row * square, square, square);
      }
    }
  });
}

function createClockTexture(text) {
  return createCanvasTexture(160, 44, (ctx, width, height) => {
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#73a8ff";
    ctx.font = "700 30px Menlo";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, width / 2, height / 2 + 2);
  });
}

function createCorkTexture() {
  return createCanvasTexture(320, 192, (ctx, width, height) => {
    ctx.fillStyle = "#9b6d43";
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 420; i += 1) {
      const x = (i * 37) % width;
      const y = (i * 19) % height;
      const shade = 105 + (i % 4) * 18;
      ctx.fillStyle = `rgba(${shade}, ${80 + (i % 5) * 9}, ${50 + (i % 3) * 6}, 0.3)`;
      ctx.fillRect(x, y, 3, 3);
    }

    [
      [36, 30, 44, 32],
      [112, 66, 36, 26],
      [172, 44, 40, 30],
      [228, 92, 34, 26],
      [256, 34, 28, 22],
    ].forEach(([x, y, w, h], index) => {
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((index - 2) * 0.08);
      ctx.fillStyle = "#f3efe8";
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    });
  });
}

function createArtworkTexture(accent) {
  return createCanvasTexture(240, 160, (ctx, width, height) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#d8d7d2");
    gradient.addColorStop(1, "#70747d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(22, 24, 27, 0.22)";
    ctx.fillRect(width * 0.08, height * 0.58, width * 0.84, height * 0.14);
    ctx.fillStyle = accent;
    ctx.fillRect(width * 0.22, height * 0.26, width * 0.34, height * 0.22);
    ctx.strokeStyle = "rgba(255,255,255,0.34)";
    ctx.strokeRect(width * 0.08, height * 0.08, width * 0.84, height * 0.84);
  });
}

function addTransomAt(centerX, centerZ, openingWidth, orientation) {
  const transomHeight = WALL_HEIGHT - DOOR_HEIGHT;
  const worldPoint = toWorldPoint([centerX, centerZ]);
  const material = new THREE.MeshStandardMaterial({
    color: "#f7f7f3",
    roughness: 0.8,
    metalness: 0.03,
  });
  let panel;
  if (orientation === "vertical") {
    panel = new THREE.Mesh(
      new THREE.BoxGeometry(INNER_WALL_THICKNESS, transomHeight, openingWidth),
      material,
    );
  } else {
    panel = new THREE.Mesh(
      new THREE.BoxGeometry(openingWidth, transomHeight, INNER_WALL_THICKNESS),
      material,
    );
  }
  panel.position.set(worldPoint.x, DOOR_HEIGHT + transomHeight / 2, worldPoint.z);
  panel.castShadow = true;
  panel.receiveShadow = true;
  architectureGroup.add(panel);
}

function addDoorTransom(doorway) {
  const start = toWorldPoint(doorway.start);
  const end = toWorldPoint(doorway.end);
  const width = Math.abs(end.x - start.x);
  const height = WALL_HEIGHT - doorway.doorHeight;
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, OUTER_WALL_THICKNESS),
    new THREE.MeshStandardMaterial({
      color: "#f7f7f3",
      roughness: 0.8,
      metalness: 0.03,
    }),
  );
  panel.position.set((start.x + end.x) / 2, doorway.doorHeight + height / 2, start.z);
  panel.castShadow = true;
  panel.receiveShadow = true;
  architectureGroup.add(panel);
}

function createFramedDoorLeaf(width, height, depth, stileWidth, material, direction = 1) {
  const leaf = new THREE.Group();
  const centerX = direction * width / 2;
  const railWidth = Math.max(0.001, width - stileWidth * 2);

  [
    {
      size: [stileWidth, height, depth],
      position: [direction * stileWidth / 2, height / 2, 0],
    },
    {
      size: [stileWidth, height, depth],
      position: [direction * (width - stileWidth / 2), height / 2, 0],
    },
    {
      size: [railWidth, stileWidth, depth],
      position: [centerX, height - stileWidth / 2, 0],
    },
    {
      size: [railWidth, stileWidth, depth],
      position: [centerX, stileWidth / 2, 0],
    },
  ].forEach(({ size, position }) => {
    const segment = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), material);
    segment.position.set(position[0], position[1], position[2]);
    leaf.add(segment);
  });

  return enableShadows(leaf);
}

function addOther5DoubleDoorFrame() {
  const doorMaterial = new THREE.MeshStandardMaterial({
    color: DOOR_COLOR,
    roughness: 0.58,
    metalness: 0.18,
  });
  const start = toWorldPoint(other5Doorway.start);
  const end = toWorldPoint(other5Doorway.end);
  const openingWidth = Math.abs(end.x - start.x);
  const headerHeight = 0.08;
  const jambWidth = 0.08;
  const leafGap = 0.04;
  const leafDepth = 0.045;
  const leafHeight = other5Doorway.doorHeight - headerHeight - 0.04;
  const leafWidth = (openingWidth - leafGap) / 2;
  const frameZ = start.z;
  const pivotZ = frameZ + OUTER_WALL_THICKNESS / 2 - leafDepth / 2;
  const doorGroup = new THREE.Group();

  [
    { size: [jambWidth, other5Doorway.doorHeight, OUTER_WALL_THICKNESS], x: start.x + jambWidth / 2 },
    { size: [jambWidth, other5Doorway.doorHeight, OUTER_WALL_THICKNESS], x: end.x - jambWidth / 2 },
    {
      size: [openingWidth, headerHeight, OUTER_WALL_THICKNESS],
      x: (start.x + end.x) / 2,
      y: other5Doorway.doorHeight - headerHeight / 2,
    },
  ].forEach(({ size, x, y = other5Doorway.doorHeight / 2 }) => {
    const framePiece = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), doorMaterial);
    framePiece.position.set(x, y, frameZ);
    framePiece.castShadow = true;
    framePiece.receiveShadow = true;
    architectureGroup.add(framePiece);
  });

  const leftPivot = new THREE.Group();
  leftPivot.position.set(start.x, 0, pivotZ);
  leftPivot.add(createFramedDoorLeaf(leafWidth, leafHeight, leafDepth, jambWidth, doorMaterial, 1));
  doorGroup.add(leftPivot);

  const rightPivot = new THREE.Group();
  rightPivot.position.set(end.x, 0, pivotZ);
  rightPivot.add(createFramedDoorLeaf(leafWidth, leafHeight, leafDepth, jambWidth, doorMaterial, -1));
  doorGroup.add(rightPivot);

  architectureGroup.add(doorGroup);

  interactiveDoors.push({
    name: "Other 5 double doors",
    pivot: doorGroup,
    slab: doorGroup,
    currentAngle: 0,
    targetAngle: 0,
    openAngle: DOOR_FRAME_OPEN_ANGLE,
    interactionPoint: new THREE.Vector3(
      (start.x + end.x) / 2,
      PLAYER_HEIGHT,
      frameZ - 0.45,
    ),
    promptAnchor: doorGroup,
    promptOffsetY: 1,
    applyRotation(angle) {
      leftPivot.rotation.y = angle;
      rightPivot.rotation.y = -angle;
    },
    getCollisionRects() {
      return this.currentAngle >= Math.PI * 0.22 ? [] : [getBoundsRectForObject(this.slab)];
    },
  });
}

function addOther3Other4Doors() {
  addInteractiveSwingDoor({
    name: "Other 4 door",
    wallX: RIGHT_STACK_X,
    doorCenterZ: I2_DOOR_Z,
    openingWidth: INTERIOR_DOOR_OPENING,
    swingDirection: 1,
  });
  addInteractiveSwingDoor({
    name: "Other 3 door",
    wallX: RIGHT_STACK_X,
    doorCenterZ: I4_DOOR_Z,
    openingWidth: INTERIOR_DOOR_OPENING,
    swingDirection: 1,
  });
  addInteractiveSwingDoor({
    name: "Other 4 inner door",
    wallX: 12,
    doorCenterZ: I2_DOOR_Z,
    openingWidth: INTERIOR_DOOR_OPENING,
    swingDirection: 1,
  });
  addInteractiveSwingDoor({
    name: "Other 3 inner door",
    wallX: 12,
    doorCenterZ: I4_DOOR_Z,
    openingWidth: INTERIOR_DOOR_OPENING,
    swingDirection: 1,
  });
}

function addNewRoomDoor() {
  addInteractiveHorizontalSwingDoor({
    name: "New room door",
    wallZ: hallwaySouthDoorway.wallZ,
    doorCenterX: hallwaySouthDoorway.centerX,
    openingWidth: hallwaySouthDoorway.openingWidth,
    swingDirection: -1,
    hingeSide: "right",
    handleColor: "#c6ccd2",
  });
}

function addInteractiveSwingDoor({
  name,
  wallX,
  doorCenterZ,
  openingWidth,
  swingDirection = 1,
  handleColor = "#d1c08b",
}) {
  const doorWidth = openingWidth - 0.04;
  const doorHeight = DOOR_HEIGHT - 0.03;
  const doorThickness = 0.05;
  const hingePlanZ = doorCenterZ - doorWidth / 2;
  const hingeWorld = toWorldPoint([wallX, hingePlanZ]);

  const pivot = new THREE.Group();
  pivot.position.set(hingeWorld.x, 0, hingeWorld.z);

  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(doorThickness, doorHeight, doorWidth),
    new THREE.MeshStandardMaterial({
      color: DOOR_COLOR,
      roughness: 0.66,
      metalness: 0.12,
    }),
  );
  slab.position.set(0, doorHeight / 2, doorWidth / 2);
  pivot.add(slab);

  const inset = new THREE.Mesh(
    new THREE.BoxGeometry(doorThickness * 0.35, doorHeight - 0.28, doorWidth - 0.18),
    new THREE.MeshStandardMaterial({
      color: DOOR_INSET_COLOR,
      roughness: 0.78,
      metalness: 0.08,
    }),
  );
  inset.position.set(doorThickness * 0.08, doorHeight / 2, doorWidth / 2);
  pivot.add(inset);

  [
    doorHeight * 0.42,
    doorHeight * 0.58,
  ].forEach((y) => {
    [-1, 1].forEach((side) => {
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.08, 12),
        new THREE.MeshStandardMaterial({
          color: handleColor,
          roughness: 0.32,
          metalness: 0.7,
        }),
      );
      handle.rotation.z = Math.PI / 2;
      handle.position.set(side * 0.03, y, doorWidth - 0.14);
      pivot.add(handle);
    });
  });

  enableShadows(pivot);
  architectureGroup.add(pivot);

  interactiveDoors.push({
    name,
    pivot,
    slab,
    swingDirection,
    currentAngle: 0,
    targetAngle: 0,
    openAngle: swingDirection * (Math.PI / 2 - 0.18),
    interactionPoint: new THREE.Vector3(
      toWorldPoint([wallX, doorCenterZ]).x,
      PLAYER_HEIGHT,
      toWorldPoint([wallX, doorCenterZ]).z,
    ),
    promptAnchor: pivot,
    promptOffsetY: 1,
  });
}

function addInteractiveHorizontalSwingDoor({
  name,
  wallZ,
  doorCenterX,
  openingWidth,
  swingDirection = 1,
  hingeSide = "left",
  handleColor = "#d1c08b",
}) {
  const doorWidth = openingWidth - 0.04;
  const doorHeight = DOOR_HEIGHT - 0.03;
  const doorThickness = 0.05;
  const hingeDirection = hingeSide === "right" ? -1 : 1;
  const hingePlanX = doorCenterX - (hingeDirection * doorWidth) / 2;
  const hingeWorld = toWorldPoint([hingePlanX, wallZ]);

  const pivot = new THREE.Group();
  pivot.position.set(hingeWorld.x, 0, hingeWorld.z);

  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth, doorHeight, doorThickness),
    new THREE.MeshStandardMaterial({
      color: DOOR_COLOR,
      roughness: 0.66,
      metalness: 0.12,
    }),
  );
  slab.position.set((hingeDirection * doorWidth) / 2, doorHeight / 2, 0);
  pivot.add(slab);

  const inset = new THREE.Mesh(
    new THREE.BoxGeometry(doorWidth - 0.18, doorHeight - 0.28, doorThickness * 0.35),
    new THREE.MeshStandardMaterial({
      color: DOOR_INSET_COLOR,
      roughness: 0.78,
      metalness: 0.08,
    }),
  );
  inset.position.set((hingeDirection * doorWidth) / 2, doorHeight / 2, doorThickness * 0.08);
  pivot.add(inset);

  [
    doorHeight * 0.42,
    doorHeight * 0.58,
  ].forEach((y) => {
    [-1, 1].forEach((side) => {
      const handle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.08, 12),
        new THREE.MeshStandardMaterial({
          color: handleColor,
          roughness: 0.32,
          metalness: 0.7,
        }),
      );
      handle.rotation.x = Math.PI / 2;
      handle.position.set(hingeDirection * (doorWidth - 0.14), y, side * 0.03);
      pivot.add(handle);
    });
  });

  enableShadows(pivot);
  architectureGroup.add(pivot);

  interactiveDoors.push({
    name,
    pivot,
    slab,
    swingDirection,
    currentAngle: 0,
    targetAngle: 0,
    openAngle: swingDirection * (Math.PI / 2 - 0.18),
    interactionPoint: new THREE.Vector3(
      toWorldPoint([doorCenterX, wallZ - 0.45]).x,
      PLAYER_HEIGHT,
      toWorldPoint([doorCenterX, wallZ - 0.45]).z,
    ),
    promptAnchor: pivot,
    promptOffsetY: 1,
  });
}

function updateInteractiveDoors(delta) {
  interactiveDoors.forEach((door) => {
    const difference = door.targetAngle - door.currentAngle;
    const animationSpeed = door.animationSpeed ?? 10;
    if (Math.abs(difference) < 0.001) {
      door.currentAngle = door.targetAngle;
    } else {
      door.currentAngle += difference * Math.min(1, delta * animationSpeed);
    }
    if (door.applyRotation) {
      door.applyRotation(door.currentAngle);
    } else {
      door.pivot.rotation.y = door.currentAngle;
    }
  });
}

function updateInteractiveNpcs(elapsedTime) {
  interactiveNpcs.forEach((npc) => {
    if (npc.type === "chat") {
      return;
    }
    const phase = elapsedTime * 1.9 + npc.phaseOffset;
    const sway = Math.sin(phase) * 0.09;
    const bob = Math.sin(phase * 0.72) * 0.012;
    npc.avatar.root.position.y = npc.baseRootY + bob;
    npc.avatar.head.rotation.x = npc.baseHeadRotationX + Math.sin(phase * 0.84) * 0.03;
    npc.avatar.head.rotation.y = npc.baseHeadRotationY + sway;
    npc.avatar.leftArmPivot.rotation.x = npc.baseLeftArmX + Math.sin(phase * 0.9) * 0.05;
    npc.avatar.rightArmPivot.rotation.x = npc.baseRightArmX - Math.sin(phase * 0.9) * 0.05;
  });
}

function hideInteractionPrompt() {
  interactionPrompt.classList.add("npc-prompt--hidden");
  interactionPrompt.setAttribute("aria-hidden", "true");
}

function getInteractionDistanceLimit(type, target) {
  return type === "npc" ? target.promptRadius : target.promptRadius ?? 1.8;
}

function getNearestInteraction() {
  return [
    ...interactiveDoors.map((door) => ({
      type: "door",
      target: door,
      distance: door.interactionPoint.distanceTo(playerState.position),
    })),
    ...interactiveSeats.map((seat) => ({
      type: "seat",
      target: seat,
      distance: seat.interactionPoint.distanceTo(playerState.position),
    })),
    ...interactiveNpcs.map((npc) => ({
      type: "npc",
      target: npc,
      distance: npc.interactionPoint.distanceTo(playerState.position),
    })),
  ]
    .filter(({ distance, target, type }) => distance <= getInteractionDistanceLimit(type, target))
    .sort((a, b) => a.distance - b.distance)[0];
}

function positionInteractionPrompt(target) {
  if (target.promptAnchor) {
    target.promptAnchor.getWorldPosition(npcPromptWorldPosition);
  } else {
    npcPromptWorldPosition.copy(target.interactionPoint);
  }
  npcPromptWorldPosition.y += target.promptOffsetY ?? 0.42;
  npcPromptWorldPosition.project(camera);

  if (npcPromptWorldPosition.z < -1 || npcPromptWorldPosition.z > 1) {
    return false;
  }

  const screenX = (npcPromptWorldPosition.x * 0.5 + 0.5) * window.innerWidth;
  const screenY = (-npcPromptWorldPosition.y * 0.5 + 0.5) * window.innerHeight;
  if (
    screenX < -80 ||
    screenX > window.innerWidth + 80 ||
    screenY < -80 ||
    screenY > window.innerHeight + 80
  ) {
    return false;
  }

  interactionPrompt.style.left = `${screenX}px`;
  interactionPrompt.style.top = `${screenY}px`;
  return true;
}

function updateInteractionPrompt(elapsedTime) {
  if (state.mode !== "walk") {
    hideInteractionPrompt();
    return;
  }

  if (state.seatedSeat) {
    if (!positionInteractionPrompt({
      interactionPoint: state.seatedSeat.interactionPoint,
      promptOffsetY: 0.28,
    })) {
      hideInteractionPrompt();
      return;
    }
    interactionPromptEyebrow.textContent = "Seat";
    interactionPromptTitle.textContent = "Press E to Stand";
    interactionPromptLine.textContent = "Leave the seat.";
    interactionPrompt.classList.remove("npc-prompt--hidden");
    interactionPrompt.setAttribute("aria-hidden", "false");
    return;
  }

  const nearestInteraction = getNearestInteraction();
  if (!nearestInteraction || !positionInteractionPrompt(nearestInteraction.target)) {
    hideInteractionPrompt();
    return;
  }

  if (nearestInteraction.type === "door") {
    interactionPromptEyebrow.textContent = "Door";
    interactionPromptTitle.textContent =
      Math.abs(nearestInteraction.target.targetAngle) > 0.2
        ? "Press E to Close Door"
        : "Press E to Open Door";
    interactionPromptLine.textContent = nearestInteraction.target.name;
  } else if (nearestInteraction.type === "seat") {
    interactionPromptEyebrow.textContent = "Seat";
    interactionPromptTitle.textContent = "Press E to Sit";
    interactionPromptLine.textContent = "Take a seat.";
  } else {
    interactionPromptEyebrow.textContent = nearestInteraction.target.promptEyebrow;
    interactionPromptTitle.textContent = nearestInteraction.target.promptTitle;
    interactionPromptLine.textContent =
      nearestInteraction.target.lines[
        Math.floor(elapsedTime / 3.2) % nearestInteraction.target.lines.length
      ];
  }

  interactionPrompt.classList.remove("npc-prompt--hidden");
  interactionPrompt.setAttribute("aria-hidden", "false");
}

function startForecastFrenzy(npc) {
  clearMovementState();
  state.seatedSeat = null;
  playerState.motion = 0;
  state.mode = "minigame";
  unlockPointer();
  hideInteractionPrompt();
  const line = npc.lines[Math.floor(Math.random() * npc.lines.length)] ?? "Match the term.";
  forecastFrenzy.start({ introLine: line });
  syncUi();
}

function handleForecastFrenzyExit() {
  state.mode = "walk";
  syncUi();
}

function sitInSeat(seat) {
  state.seatedSeat = seat;
  clearMovementState();
  state.velocityY = 0;
  const seatWorld = toWorldPoint(seat.center);
  playerState.position.set(seatWorld.x, seat.eyeHeight, seatWorld.z);
  const lookTarget = new THREE.Vector3(
    seatWorld.x + Math.sin(seat.rotation),
    seat.eyeHeight,
    seatWorld.z + Math.cos(seat.rotation),
  );
  setLookAnglesFromTarget(playerState, playerState.position, lookTarget);
  playerState.facingYaw = playerState.yaw;
  playerState.motion = 0;
}

function standUpFromSeat() {
  if (!state.seatedSeat) {
    return;
  }
  const seat = state.seatedSeat;
  const candidates = [
    [
      seat.center[0] + Math.sin(seat.rotation) * seat.standOffset,
      seat.center[1] + Math.cos(seat.rotation) * seat.standOffset,
    ],
    [
      seat.center[0] - Math.sin(seat.rotation) * seat.standOffset,
      seat.center[1] - Math.cos(seat.rotation) * seat.standOffset,
    ],
  ];
  const standPoint =
    candidates.find((candidate) => {
      const world = toWorldPoint(candidate);
      return isWalkable(new THREE.Vector2(world.x, world.z));
    }) ?? candidates[0];
  const standWorld = toWorldPoint(standPoint);
  state.seatedSeat = null;
  playerState.position.set(standWorld.x, PLAYER_HEIGHT, standWorld.z);
  playerState.motion = 0;
  state.velocityY = 0;
}

function toggleNearestInteraction() {
  if (state.seatedSeat) {
    standUpFromSeat();
    return;
  }

  const nearestInteraction = getNearestInteraction();
  if (!nearestInteraction) {
    return;
  }

  if (nearestInteraction.type === "seat") {
    sitInSeat(nearestInteraction.target);
    return;
  }

  if (nearestInteraction.type === "npc") {
    const npc = nearestInteraction.target;
    if (npc.type === "forecast") {
      startForecastFrenzy(npc);
    }
    return;
  }

  const nearestDoor = nearestInteraction.target;
  nearestDoor.targetAngle =
    Math.abs(nearestDoor.targetAngle) > 0.2
      ? 0
      : nearestDoor.openAngle;
}

function getBoundsRectForObject(object) {
  object.updateWorldMatrix(true, true);
  const bounds = new THREE.Box3().setFromObject(object);
  return {
    minX: bounds.min.x - PLAYER_RADIUS * 0.12,
    maxX: bounds.max.x + PLAYER_RADIUS * 0.12,
    minZ: bounds.min.z - PLAYER_RADIUS * 0.12,
    maxZ: bounds.max.z + PLAYER_RADIUS * 0.12,
  };
}

function getInteractiveDoorRects(door) {
  if (door.getCollisionRects) {
    return door.getCollisionRects();
  }
  return [getBoundsRectForObject(door.slab)];
}

function getInteractiveDoorRect(door) {
  return getBoundsRectForObject(door.slab);
}

function expandWallForDoorway(wall) {
  if (!wall.doorway) {
    return [wall];
  }

  const openingHalf = wall.doorway.openingWidth / 2;

  if (Math.abs(wall.start[0] - wall.end[0]) < 0.001) {
    const x = wall.start[0];
    const minZ = Math.min(wall.start[1], wall.end[1]);
    const maxZ = Math.max(wall.start[1], wall.end[1]);
    const doorMinZ = wall.doorway.center[1] - openingHalf;
    const doorMaxZ = wall.doorway.center[1] + openingHalf;
    const planSegments = [];

    if (doorMinZ > minZ) {
      planSegments.push({ start: [x, minZ], end: [x, doorMinZ] });
    }
    if (doorMaxZ < maxZ) {
      planSegments.push({ start: [x, doorMaxZ], end: [x, maxZ] });
    }

    return planSegments.map((segment) => ({
      ...wall,
      start: segment.start,
      end: segment.end,
      worldStart: toWorldPoint(segment.start),
      worldEnd: toWorldPoint(segment.end),
      doorway: null,
    }));
  }

  if (Math.abs(wall.start[1] - wall.end[1]) < 0.001) {
    const z = wall.start[1];
    const minX = Math.min(wall.start[0], wall.end[0]);
    const maxX = Math.max(wall.start[0], wall.end[0]);
    const doorMinX = wall.doorway.center[0] - openingHalf;
    const doorMaxX = wall.doorway.center[0] + openingHalf;
    const planSegments = [];

    if (doorMinX > minX) {
      planSegments.push({ start: [minX, z], end: [doorMinX, z] });
    }
    if (doorMaxX < maxX) {
      planSegments.push({ start: [doorMaxX, z], end: [maxX, z] });
    }

    return planSegments.map((segment) => ({
      ...wall,
      start: segment.start,
      end: segment.end,
      worldStart: toWorldPoint(segment.start),
      worldEnd: toWorldPoint(segment.end),
      doorway: null,
    }));
  }

  return [wall];
}

function hangarInnerHeightAtWorldX(worldX) {
  const ratio = Math.abs(worldX) / HANGAR_INNER_GROUND;
  if (ratio >= 1) {
    return 0;
  }
  return HANGAR_INNER_APEX_HEIGHT * (1 - ratio * ratio);
}

function hangarInnerXForHeight(height) {
  if (height <= 0) {
    return HANGAR_INNER_GROUND;
  }
  if (height >= HANGAR_INNER_APEX_HEIGHT) {
    return 0;
  }
  return HANGAR_INNER_GROUND * Math.sqrt(1 - height / HANGAR_INNER_APEX_HEIGHT);
}

function createClippedHorizontalWall(start, end, {
  color,
  thickness,
  baseY = 0,
  capY = WALL_HEIGHT,
  opening = null,
}) {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const zCenter = (start.z + end.z) / 2;
  const samples = Math.max(12, Math.ceil((maxX - minX) * 8));
  const shape = new THREE.Shape();

  shape.moveTo(minX, baseY);
  for (let i = 0; i <= samples; i += 1) {
    const x = minX + ((maxX - minX) * i) / samples;
    const topY = Math.max(baseY, Math.min(capY, hangarInnerHeightAtWorldX(x)));
    shape.lineTo(x, topY);
  }
  shape.lineTo(maxX, baseY);
  shape.lineTo(minX, baseY);

  if (opening) {
    const holeMinX = Math.max(minX + 0.08, opening.centerX - opening.width / 2);
    const holeMaxX = Math.min(maxX - 0.08, opening.centerX + opening.width / 2);
    const holeBottomY = Math.max(baseY + 0.08, opening.bottomY);
    let holeTopY = Math.min(capY - 0.08, opening.bottomY + opening.height);

    if (holeMaxX > holeMinX) {
      const openingSamples = Math.max(6, Math.ceil((holeMaxX - holeMinX) * 8));
      for (let i = 0; i <= openingSamples; i += 1) {
        const x = holeMinX + ((holeMaxX - holeMinX) * i) / openingSamples;
        holeTopY = Math.min(
          holeTopY,
          Math.max(baseY + 0.08, Math.min(capY - 0.08, hangarInnerHeightAtWorldX(x) - 0.08)),
        );
      }
    }

    if (holeMaxX > holeMinX && holeTopY > holeBottomY) {
      const hole = new THREE.Path();
      hole.moveTo(holeMinX, holeBottomY);
      hole.lineTo(holeMinX, holeTopY);
      hole.lineTo(holeMaxX, holeTopY);
      hole.lineTo(holeMaxX, holeBottomY);
      hole.closePath();
      shape.holes.push(hole);
    }
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
  });
  geometry.translate(0, 0, zCenter - thickness / 2);

  const wall = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0.03,
      side: THREE.DoubleSide,
    }),
  );
  wall.castShadow = true;
  wall.receiveShadow = true;
  return wall;
}

function createHorizontalWallWithOpening(start, end, {
  color,
  thickness,
  height,
  opening,
}) {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const zCenter = (start.z + end.z) / 2;
  const holeMinX = Math.max(minX + 0.08, opening.centerX - opening.width / 2);
  const holeMaxX = Math.min(maxX - 0.08, opening.centerX + opening.width / 2);
  const holeBottomY = Math.max(0.08, opening.bottomY);
  const holeTopY = Math.min(height - 0.08, opening.bottomY + opening.height);
  const shape = new THREE.Shape();

  shape.moveTo(minX, 0);
  shape.lineTo(maxX, 0);
  shape.lineTo(maxX, height);
  shape.lineTo(minX, height);
  shape.closePath();

  if (holeMaxX > holeMinX && holeTopY > holeBottomY) {
    const hole = new THREE.Path();
    hole.moveTo(holeMinX, holeBottomY);
    hole.lineTo(holeMinX, holeTopY);
    hole.lineTo(holeMaxX, holeTopY);
    hole.lineTo(holeMaxX, holeBottomY);
    hole.closePath();
    shape.holes.push(hole);
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
  });
  geometry.translate(0, 0, zCenter - thickness / 2);

  const wall = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0.03,
      side: THREE.DoubleSide,
    }),
  );
  wall.castShadow = true;
  wall.receiveShadow = true;
  return wall;
}

function createSouthWallWithDoor({
  start,
  end,
  doorway,
  color,
  thickness,
  capY = WALL_HEIGHT,
}) {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const zCenter = (start.z + end.z) / 2;
  const shape = new THREE.Shape();
  const doorStartX = Math.max(minX, Math.min(maxX, toWorldPoint(doorway.start).x));
  const doorEndX = Math.max(minX, Math.min(maxX, toWorldPoint(doorway.end).x));
  const doorTop = Math.min(
    DOOR_HEIGHT,
    capY,
    hangarInnerHeightAtWorldX(doorStartX),
    hangarInnerHeightAtWorldX(doorEndX),
  );
  const samples = Math.max(12, Math.ceil((maxX - minX) * 8));
  const topProfile = [];

  for (let i = 0; i <= samples; i += 1) {
    const x = minX + ((maxX - minX) * i) / samples;
    topProfile.push({
      x,
      y: Math.max(0, Math.min(capY, hangarInnerHeightAtWorldX(x))),
    });
  }

  shape.moveTo(minX, 0);
  shape.lineTo(doorStartX, 0);
  if (doorTop > 0.001 && doorEndX - doorStartX > 0.001) {
    shape.lineTo(doorStartX, doorTop);
    shape.lineTo(doorEndX, doorTop);
    shape.lineTo(doorEndX, 0);
  }
  shape.lineTo(maxX, 0);
  for (let i = samples; i >= 0; i -= 1) {
    shape.lineTo(topProfile[i].x, topProfile[i].y);
  }
  shape.lineTo(minX, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
  });
  geometry.translate(0, 0, zCenter - thickness / 2);

  const wall = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0.03,
      side: THREE.DoubleSide,
    }),
  );
  wall.castShadow = true;
  wall.receiveShadow = true;
  return wall;
}

function createClippedRoofVolume({
  startX,
  endX,
  startZ,
  endZ,
  baseY,
  color,
}) {
  if (endX <= startX + 0.001 || endZ <= startZ + 0.001) {
    return null;
  }

  const samples = Math.max(16, Math.ceil((endX - startX) * 8));
  const shape = new THREE.Shape();
  shape.moveTo(startX, baseY);
  for (let i = 0; i <= samples; i += 1) {
    const x = startX + ((endX - startX) * i) / samples;
    const topY = Math.max(baseY, hangarInnerHeightAtWorldX(x));
    shape.lineTo(x, topY);
  }
  shape.lineTo(endX, baseY);
  shape.lineTo(startX, baseY);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: endZ - startZ,
    bevelEnabled: false,
  });
  geometry.translate(0, 0, startZ);

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.92,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createRightWingRoofVolume({
  startPlanZ,
  endPlanZ,
  startSetback = LOW_ROOM_ROOF_SETBACK,
  endSetback = LOW_ROOM_ROOF_SETBACK,
  baseY,
  color,
}) {
  const worldStartX = toWorldPoint([RIGHT_STACK_X, 0]).x;
  const worldEndX = toWorldPoint([HANGAR_INNER_EAST_X, 0]).x;
  const worldStartZ = toWorldPoint([0, startPlanZ + startSetback]).z;
  const worldEndZ = toWorldPoint([0, endPlanZ - endSetback]).z;
  return createClippedRoofVolume({
    startX: worldStartX,
    endX: worldEndX,
    startZ: worldStartZ,
    endZ: worldEndZ,
    baseY,
    color,
  });
}

function createOther4RoofVolume() {
  return createRightWingRoofVolume({
    startPlanZ: I1_Z,
    endPlanZ: OTHER4_BOTTOM,
    baseY: OTHER34_ROOF_BASE_HEIGHT,
    color: "#d3d7dc",
  });
}

function createOther3RoofVolume() {
  return createRightWingRoofVolume({
    startPlanZ: OTHER3_TOP,
    endPlanZ: OTHER3_BOTTOM,
    baseY: OTHER34_ROOF_BASE_HEIGHT,
    color: "#d3d7dc",
  });
}

function createNewRoomRoofVolume() {
  return createRightWingRoofVolume({
    startPlanZ: OTHER3_BOTTOM,
    endPlanZ: PLAN_DEPTH,
    startSetback: NEW_ROOM_ROOF_NORTH_SETBACK,
    endSetback: NEW_ROOM_ROOF_SOUTH_SETBACK,
    baseY: NEW_ROOM_ROOF_BASE_HEIGHT,
    color: "#d3d7dc",
  });
}

function createExtrudedPolygon(points, { color, y, depth }) {
  const shape = createShape(points);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, y - depth, 0);

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.95,
      metalness: 0.02,
    }),
  );
  mesh.receiveShadow = true;
  return mesh;
}

function createWall(start, end, { color, height, thickness }) {
  const length = distance2(start, end);
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(length, height, thickness),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0.03,
    }),
  );

  wall.position.set((start.x + end.x) / 2, height / 2, (start.z + end.z) / 2);
  wall.rotation.y = -Math.atan2(end.z - start.z, end.x - start.x);
  wall.castShadow = true;
  wall.receiveShadow = true;
  return wall;
}

function createLabel(title, subtitle) {
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 512;
  labelCanvas.height = 180;
  const context = labelCanvas.getContext("2d");

  context.fillStyle = "rgba(12, 17, 19, 0.8)";
  roundRect(context, 20, 22, 472, 136, 22);
  context.fill();

  context.strokeStyle = "rgba(255,255,255,0.15)";
  context.lineWidth = 2;
  roundRect(context, 20, 22, 472, 136, 22);
  context.stroke();

  context.fillStyle = "#f6f3ef";
  context.font = "700 38px Avenir Next";
  context.textAlign = "center";
  context.fillText(title, 256, 82);

  context.fillStyle = "rgba(232, 236, 235, 0.72)";
  context.font = "400 28px Avenir Next";
  context.fillText(subtitle, 256, 122);

  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  sprite.scale.set(2.5, 0.88, 1);
  return sprite;
}

function addBoxFurniture({
  center,
  size,
  color,
  topColor = null,
  collider = false,
}) {
  const worldPoint = toWorldPoint(center);
  const [width, depth, height] = size;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.78,
      metalness: 0.04,
    }),
  );
  body.position.set(worldPoint.x, height / 2, worldPoint.z);
  body.castShadow = true;
  body.receiveShadow = true;
  furnishingGroup.add(body);

  if (topColor) {
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.02, 0.05, depth + 0.02),
      new THREE.MeshStandardMaterial({
        color: topColor,
        roughness: 0.55,
        metalness: 0.03,
      }),
    );
    top.position.set(worldPoint.x, height + 0.025, worldPoint.z);
    top.castShadow = true;
    top.receiveShadow = true;
    furnishingGroup.add(top);
  }

  if (collider) {
    furnitureRects.push({
      minX: worldPoint.x - width / 2 - PLAYER_RADIUS * 0.5,
      maxX: worldPoint.x + width / 2 + PLAYER_RADIUS * 0.5,
      minZ: worldPoint.z - depth / 2 - PLAYER_RADIUS * 0.5,
      maxZ: worldPoint.z + depth / 2 + PLAYER_RADIUS * 0.5,
    });
  }
}

function addDesk(center, size, rotation = 0) {
  const worldPoint = toWorldPoint(center);
  const desk = new THREE.Group();

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], 0.06, size[1]),
    new THREE.MeshStandardMaterial({ color: "#7d5d48", roughness: 0.66 }),
  );
  top.position.y = 0.76;
  desk.add(top);

  const legGeometry = new THREE.BoxGeometry(0.08, 0.76, 0.08);
  const legMaterial = new THREE.MeshStandardMaterial({ color: "#302726", roughness: 0.52 });
  [
    [-size[0] / 2 + 0.08, 0.38, -size[1] / 2 + 0.08],
    [size[0] / 2 - 0.08, 0.38, -size[1] / 2 + 0.08],
    [-size[0] / 2 + 0.08, 0.38, size[1] / 2 - 0.08],
    [size[0] / 2 - 0.08, 0.38, size[1] / 2 - 0.08],
  ].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(x, y, z);
    desk.add(leg);
  });

  desk.position.set(worldPoint.x, 0, worldPoint.z);
  desk.rotation.y = rotation;
  desk.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  furnishingGroup.add(desk);

  const footprint = getFootprint(size[0], size[1], rotation);
  furnitureRects.push(axisAlignedRect(worldPoint, footprint.width, footprint.depth, PLAYER_RADIUS * 0.45));
}

function addBed(center, size, rotation = 0) {
  const worldPoint = toWorldPoint(center);
  const bed = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], 0.3, size[1]),
    new THREE.MeshStandardMaterial({ color: "#6d5443", roughness: 0.72 }),
  );
  frame.position.y = 0.22;
  bed.add(frame);

  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(size[0] - 0.12, 0.22, size[1] - 0.12),
    new THREE.MeshStandardMaterial({ color: "#ece8e3", roughness: 0.92 }),
  );
  mattress.position.y = 0.47;
  bed.add(mattress);

  const headboard = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], 1.0, 0.08),
    new THREE.MeshStandardMaterial({ color: "#7e6550", roughness: 0.7 }),
  );
  headboard.position.set(0, 0.75, -size[1] / 2 + 0.04);
  bed.add(headboard);

  bed.position.set(worldPoint.x, 0, worldPoint.z);
  bed.rotation.y = rotation;
  bed.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  furnishingGroup.add(bed);

  const footprint = getFootprint(size[0], size[1], rotation);
  furnitureRects.push(axisAlignedRect(worldPoint, footprint.width, footprint.depth, PLAYER_RADIUS * 0.4));
}

function addSofa(center, size, rotation = 0) {
  const worldPoint = toWorldPoint(center);
  const sofa = new THREE.Group();
  const upholstery = new THREE.MeshStandardMaterial({
    color: "#d7cab8",
    roughness: 0.96,
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(size[0], 0.4, size[1]), upholstery);
  base.position.y = 0.22;
  sofa.add(base);

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], 0.72, 0.16),
    upholstery,
  );
  back.position.set(0, 0.62, -size[1] / 2 + 0.08);
  sofa.add(back);

  const armGeometry = new THREE.BoxGeometry(0.16, 0.58, size[1]);
  [-size[0] / 2 + 0.08, size[0] / 2 - 0.08].forEach((x) => {
    const arm = new THREE.Mesh(armGeometry, upholstery);
    arm.position.set(x, 0.45, 0);
    sofa.add(arm);
  });

  sofa.position.set(worldPoint.x, 0, worldPoint.z);
  sofa.rotation.y = rotation;
  sofa.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  furnishingGroup.add(sofa);

  const footprint = getFootprint(size[0], size[1], rotation);
  furnitureRects.push(axisAlignedRect(worldPoint, footprint.width, footprint.depth, PLAYER_RADIUS * 0.35));
}

function addChair(center, rotation = 0) {
  const worldPoint = toWorldPoint(center);
  const chair = new THREE.Group();

  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.08, 0.5),
    new THREE.MeshStandardMaterial({ color: "#6f5748", roughness: 0.66 }),
  );
  seat.position.y = 0.48;
  chair.add(seat);

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.56, 0.08),
    new THREE.MeshStandardMaterial({ color: "#6f5748", roughness: 0.66 }),
  );
  back.position.set(0, 0.76, -0.21);
  chair.add(back);

  const legMaterial = new THREE.MeshStandardMaterial({ color: "#2f2622", roughness: 0.45 });
  const legGeometry = new THREE.BoxGeometry(0.06, 0.48, 0.06);
  [
    [-0.2, 0.24, -0.2],
    [0.2, 0.24, -0.2],
    [-0.2, 0.24, 0.2],
    [0.2, 0.24, 0.2],
  ].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(x, y, z);
    chair.add(leg);
  });

  chair.position.set(worldPoint.x, 0, worldPoint.z);
  chair.rotation.y = rotation;
  chair.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  furnishingGroup.add(chair);
  registerSeat(center, rotation, 1.14, 0.78, 0.52);
}

function addRug(center, size, color, rotation = 0) {
  const worldPoint = toWorldPoint(center);
  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], 0.02, size[1]),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.98,
      metalness: 0.01,
    }),
  );
  rug.position.set(worldPoint.x, 0.02, worldPoint.z);
  rug.rotation.y = rotation;
  rug.receiveShadow = true;
  furnishingGroup.add(rug);
}

function addTableLegs(worldPoint, offsetX, offsetZ) {
  const legGeometry = new THREE.BoxGeometry(0.08, 0.78, 0.08);
  const legMaterial = new THREE.MeshStandardMaterial({ color: "#423129", roughness: 0.4 });
  [
    [-offsetX, 0.39, -offsetZ],
    [offsetX, 0.39, -offsetZ],
    [-offsetX, 0.39, offsetZ],
    [offsetX, 0.39, offsetZ],
  ].forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(worldPoint.x + x, y, worldPoint.z + z);
    leg.castShadow = true;
    leg.receiveShadow = true;
    furnishingGroup.add(leg);
  });
}

function createPlayerAvatar({
  skinColor = "#cfab87",
  suitColor = "#46515b",
  shirtColor = "#f2efe7",
  tieColor = "#9f6745",
  pantColor = "#2a3137",
  shoeColor = "#2a201b",
  hairColor = "#30231d",
  slickBackHair = false,
} = {}) {
  const group = new THREE.Group();
  const root = new THREE.Group();
  group.add(root);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.36, 24),
    new THREE.MeshBasicMaterial({
      color: "#050608",
      transparent: true,
      opacity: 0.18,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  group.add(shadow);

  const skinMaterial = new THREE.MeshStandardMaterial({
    color: skinColor,
    roughness: 0.82,
    metalness: 0.02,
  });
  const coatMaterial = new THREE.MeshStandardMaterial({
    color: suitColor,
    roughness: 0.82,
    metalness: 0.04,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: tieColor,
    roughness: 0.62,
    metalness: 0.08,
  });
  const shirtMaterial = new THREE.MeshStandardMaterial({
    color: shirtColor,
    roughness: 0.88,
    metalness: 0.02,
  });
  const pantMaterial = new THREE.MeshStandardMaterial({
    color: pantColor,
    roughness: 0.84,
    metalness: 0.04,
  });
  const bootMaterial = new THREE.MeshStandardMaterial({
    color: shoeColor,
    roughness: 0.66,
    metalness: 0.04,
  });
  const soleMaterial = new THREE.MeshStandardMaterial({
    color: "#171c1f",
    roughness: 0.78,
    metalness: 0.08,
  });
  const hairMaterial = new THREE.MeshStandardMaterial({
    color: hairColor,
    roughness: 0.88,
    metalness: 0.02,
  });
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: "#1b1d1f",
    roughness: 0.4,
    metalness: 0.08,
  });
  const mouthMaterial = new THREE.MeshStandardMaterial({
    color: "#915e56",
    roughness: 0.82,
    metalness: 0.02,
  });

  const torso = new THREE.Group();
  torso.position.y = 1.17;
  root.add(torso);

  const torsoCore = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.14, 0.34, 4, 10),
    coatMaterial,
  );
  torsoCore.scale.set(0.94, 1, 0.76);
  torsoCore.position.set(0, 0.02, -0.02);
  torso.add(torsoCore);

  const coatShell = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.56, 0.14),
    coatMaterial,
  );
  coatShell.position.set(0, 0.02, 0.055);
  torso.add(coatShell);

  const shoulderYoke = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.12, 0.18),
    coatMaterial,
  );
  shoulderYoke.position.set(0, 0.18, 0.035);
  torso.add(shoulderYoke);

  const shirtBib = new THREE.Mesh(
    new THREE.BoxGeometry(0.125, 0.4, 0.02),
    shirtMaterial,
  );
  shirtBib.position.set(0, 0.03, -0.112);
  torso.add(shirtBib);

  const collarBand = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.05, 0.028),
    shirtMaterial,
  );
  collarBand.position.set(0, 0.29, -0.104);
  torso.add(collarBand);

  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.37, 0.08, 0.24),
    coatMaterial,
  );
  belt.position.set(0, -0.14, 0.01);
  torso.add(belt);

  const centerPlacket = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.32, 0.024),
    trimMaterial,
  );
  centerPlacket.position.set(0, -0.03, -0.118);
  torso.add(centerPlacket);

  [-1, 1].forEach((side) => {
    const collarWing = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.072, 0.016),
      shirtMaterial,
    );
    collarWing.position.set(side * 0.034, 0.255, -0.11);
    collarWing.rotation.z = side * 0.58;
    torso.add(collarWing);
  });

  const chestStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.072, 0.06, 0.026),
    trimMaterial,
  );
  chestStripe.position.set(0, 0.15, -0.118);
  torso.add(chestStripe);

  [-1, 1].forEach((side) => {
    const lapel = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.22, 0.024),
      coatMaterial,
    );
    lapel.position.set(side * 0.058, 0.11, -0.104);
    lapel.rotation.z = side * 0.28;
    torso.add(lapel);

    const hemPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.22, 0.06),
      coatMaterial,
    );
    hemPanel.position.set(side * 0.085, -0.18, -0.085);
    torso.add(hemPanel);
  });

  const pelvis = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.16, 0.19),
    pantMaterial,
  );
  pelvis.position.y = 0.91;
  root.add(pelvis);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.054, 0.1, 12),
    skinMaterial,
  );
  neck.position.y = 1.47;
  root.add(neck);

  const head = new THREE.Group();
  head.position.y = 1.62;
  root.add(head);

  const skull = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 20, 18),
    skinMaterial,
  );
  skull.scale.set(0.88, 1.05, 0.84);
  head.add(skull);

  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.08, 0.12),
    skinMaterial,
  );
  jaw.position.set(0, -0.11, -0.01);
  head.add(jaw);

  let hairCap;
  if (slickBackHair) {
    hairCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.06, 0.18),
      hairMaterial,
    );
    hairCap.position.set(0, 0.12, 0.04);
    hairCap.rotation.x = -0.25;
  } else {
    hairCap = new THREE.Mesh(
      new THREE.SphereGeometry(1, 20, 18, 0, Math.PI * 2, 0, Math.PI * 0.54),
      hairMaterial,
    );
    hairCap.scale.set(0.145, 0.092, 0.132);
    hairCap.position.set(0, 0.115, 0.012);
  }
  head.add(hairCap);

  [-1, 1].forEach((side) => {
    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.014, 0.012),
      hairMaterial,
    );
    brow.position.set(side * 0.045, 0.055, -0.125);
    brow.rotation.z = side * 0.08;
    head.add(brow);
  });

  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.012, 0.01),
      eyeMaterial,
    );
    eye.position.set(side * 0.044, 0.01, -0.126);
    head.add(eye);
  });

  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.034, 0.028),
    skinMaterial,
  );
  nose.position.set(0, -0.015, -0.12);
  head.add(nose);

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.008, 0.01),
    mouthMaterial,
  );
  mouth.position.set(0, -0.086, -0.122);
  head.add(mouth);

  const shoulderWidth = 0.23;
  const hipWidth = 0.11;

  const leftShoulderPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.15),
    coatMaterial,
  );
  leftShoulderPad.position.set(-shoulderWidth, 1.34, 0.01);
  leftShoulderPad.rotation.z = 0.18;
  root.add(leftShoulderPad);

  const rightShoulderPad = leftShoulderPad.clone();
  rightShoulderPad.position.x = shoulderWidth;
  rightShoulderPad.rotation.z = -0.18;
  root.add(rightShoulderPad);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-shoulderWidth, 1.33, 0.01);
  root.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(shoulderWidth, 1.33, 0.01);
  root.add(rightArmPivot);

  const upperArmGeometry = new THREE.CapsuleGeometry(0.055, 0.24, 4, 10);
  const forearmGeometry = new THREE.CapsuleGeometry(0.048, 0.22, 4, 10);

  const leftUpperArm = new THREE.Mesh(
    upperArmGeometry,
    coatMaterial,
  );
  leftUpperArm.position.y = -0.16;
  leftArmPivot.add(leftUpperArm);

  const leftElbow = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 14, 10),
    coatMaterial,
  );
  leftElbow.position.y = -0.33;
  leftArmPivot.add(leftElbow);

  const leftForearm = new THREE.Mesh(
    forearmGeometry,
    coatMaterial,
  );
  leftForearm.position.y = -0.49;
  leftArmPivot.add(leftForearm);

  const leftWristBand = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.04, 0.08),
    shirtMaterial,
  );
  leftWristBand.position.y = -0.64;
  leftArmPivot.add(leftWristBand);

  const rightUpperArm = leftUpperArm.clone();
  rightArmPivot.add(rightUpperArm);

  const rightElbow = leftElbow.clone();
  rightArmPivot.add(rightElbow);

  const rightForearm = leftForearm.clone();
  rightArmPivot.add(rightForearm);

  const rightWristBand = leftWristBand.clone();
  rightArmPivot.add(rightWristBand);

  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.08, 0.06),
    skinMaterial,
  );
  leftHand.position.y = -0.74;
  leftArmPivot.add(leftHand);

  const rightHand = leftHand.clone();
  rightArmPivot.add(rightHand);

  const leftHip = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.14, 0.16),
    pantMaterial,
  );
  leftHip.position.set(-hipWidth, 0.89, 0.01);
  root.add(leftHip);

  const rightHip = leftHip.clone();
  rightHip.position.x = hipWidth;
  root.add(rightHip);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-hipWidth, 0.89, 0.01);
  root.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(hipWidth, 0.89, 0.01);
  root.add(rightLegPivot);

  const thighGeometry = new THREE.CapsuleGeometry(0.066, 0.3, 4, 10);
  const shinGeometry = new THREE.CapsuleGeometry(0.058, 0.28, 4, 10);

  const leftThigh = new THREE.Mesh(
    thighGeometry,
    pantMaterial,
  );
  leftThigh.position.y = -0.19;
  leftLegPivot.add(leftThigh);

  const leftKneePivot = new THREE.Group();
  leftKneePivot.position.y = -0.38;
  leftLegPivot.add(leftKneePivot);

  const leftKnee = new THREE.Mesh(
    new THREE.SphereGeometry(0.056, 16, 12),
    pantMaterial,
  );
  leftKneePivot.add(leftKnee);

  const leftShin = new THREE.Mesh(
    shinGeometry,
    pantMaterial,
  );
  leftShin.position.y = -0.2;
  leftKneePivot.add(leftShin);

  const rightThigh = leftThigh.clone();
  rightLegPivot.add(rightThigh);

  const rightKneePivot = new THREE.Group();
  rightKneePivot.position.y = -0.38;
  rightLegPivot.add(rightKneePivot);

  const rightKnee = leftKnee.clone();
  rightKneePivot.add(rightKnee);

  const rightShin = leftShin.clone();
  rightKneePivot.add(rightShin);

  const leftBootCuff = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.1, 0.12),
    bootMaterial,
  );
  leftBootCuff.position.set(0, -0.38, 0.01);
  leftKneePivot.add(leftBootCuff);

  const leftBoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.08, 0.24),
    bootMaterial,
  );
  leftBoot.position.set(0, -0.45, -0.05);
  leftKneePivot.add(leftBoot);

  const leftSole = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.03, 0.25),
    soleMaterial,
  );
  leftSole.position.set(0, -0.5, -0.05);
  leftKneePivot.add(leftSole);

  const rightBootCuff = leftBootCuff.clone();
  rightKneePivot.add(rightBootCuff);

  const rightBoot = leftBoot.clone();
  rightKneePivot.add(rightBoot);

  const rightSole = leftSole.clone();
  rightKneePivot.add(rightSole);

  enableShadows(root);
  shadow.receiveShadow = false;
  shadow.castShadow = false;

  return {
    group,
    root,
    shadow,
    torso,
    head,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    leftKneePivot,
    rightKneePivot,
  };
}

function setLookAnglesFromTarget(player, origin, target) {
  cameraDirectionVector.copy(target).sub(origin).normalize();
  player.yaw = Math.atan2(-cameraDirectionVector.x, -cameraDirectionVector.z);
  player.pitch = clamp(
    Math.asin(clamp(cameraDirectionVector.y, -1, 1)),
    -PLAYER_MAX_PITCH,
    PLAYER_MAX_PITCH,
  );
}

function getLookDirection(yaw, pitch, target = new THREE.Vector3()) {
  const cosPitch = Math.cos(pitch);
  return target.set(
    -Math.sin(yaw) * cosPitch,
    Math.sin(pitch),
    -Math.cos(yaw) * cosPitch,
  );
}

function getFlatLookDirection(yaw, target = new THREE.Vector3()) {
  return target.set(-Math.sin(yaw), 0, -Math.cos(yaw));
}

function angleDifference(current, target) {
  return Math.atan2(Math.sin(target - current), Math.cos(target - current));
}

function syncPlayerPresentation(delta, elapsedTime) {
  const avatarVisible = state.mode === "overview" || state.walkView === "thirdPerson";
  const isSeated = Boolean(state.seatedSeat);
  playerAvatar.group.visible = avatarVisible;
  playerAvatar.group.position.set(
    playerState.position.x,
    Math.max(0, playerState.position.y - PLAYER_HEIGHT),
    playerState.position.z,
  );

  if (avatarVisible) {
    const turnStep = delta > 0 ? Math.min(1, delta * 10) : 1;
    playerAvatar.root.rotation.y += angleDifference(
      playerAvatar.root.rotation.y,
      playerState.facingYaw,
    ) * turnStep;

    if (isSeated) {
      const seatedAvatarDrop =
        state.mode === "walk" && state.walkView === "thirdPerson"
          ? THIRD_PERSON_SEATED_AVATAR_DROP
          : 0;
      playerAvatar.leftArmPivot.rotation.x = -0.18;
      playerAvatar.rightArmPivot.rotation.x = -0.18;
      playerAvatar.leftLegPivot.rotation.x = 1.26;
      playerAvatar.rightLegPivot.rotation.x = 1.26;
      playerAvatar.torso.rotation.z = 0;
      playerAvatar.root.position.y =
        (state.seatedSeat?.surfaceHeight ?? 0.52) - 0.6 - seatedAvatarDrop;
    } else {
      const stride = Math.sin(elapsedTime * (7 + playerState.motion * 5)) * playerState.motion;
      playerAvatar.leftArmPivot.rotation.x = stride * 0.85;
      playerAvatar.rightArmPivot.rotation.x = -stride * 0.85;
      playerAvatar.leftLegPivot.rotation.x = -stride * 0.72;
      playerAvatar.rightLegPivot.rotation.x = stride * 0.72;
      playerAvatar.torso.rotation.z = stride * 0.08;
      playerAvatar.root.position.y = 0;
    }
    playerAvatar.head.rotation.y = clamp(
      angleDifference(playerState.facingYaw, playerState.yaw) * 0.4,
      -0.45,
      0.45,
    );

    const airborne = Math.max(0, playerState.position.y - PLAYER_HEIGHT);
    const shadowScale = isSeated ? 0.92 : 1 - Math.min(0.18, airborne * 0.08);
    playerAvatar.shadow.scale.setScalar(shadowScale);
    playerAvatar.shadow.material.opacity = isSeated
      ? 0.12
      : 0.18 * (1 - Math.min(0.5, airborne * 0.24));
  }

  if (state.mode !== "walk") {
    return;
  }

  if (state.walkView === "firstPerson") {
    camera.position.copy(playerState.position);
    lookEuler.set(playerState.pitch, playerState.yaw, 0);
    camera.quaternion.setFromEuler(lookEuler);
    return;
  }

  getLookDirection(playerState.yaw, playerState.pitch, cameraForwardVector);
  cameraLookTarget.copy(playerState.position);
  cameraLookTarget.y -= THIRD_PERSON_TARGET_DROP;

  desiredCameraPosition.copy(cameraLookTarget);
  desiredCameraPosition.addScaledVector(cameraForwardVector, -THIRD_PERSON_CAMERA_DISTANCE);
  desiredCameraPosition.y += THIRD_PERSON_CAMERA_HEIGHT;

  cameraOffsetVector.copy(desiredCameraPosition).sub(cameraLookTarget);
  const idealDistance = cameraOffsetVector.length();
  if (idealDistance > 0.001) {
    cameraOffsetVector.normalize();
    cameraCollisionRaycaster.set(cameraLookTarget, cameraOffsetVector);
    cameraCollisionRaycaster.far = idealDistance;
    const obstruction = cameraCollisionRaycaster
      .intersectObjects([architectureGroup, furnishingGroup], true)
      .find(({ object }) => object.visible);
    const unobstructedDistance = obstruction
      ? Math.min(idealDistance, obstruction.distance - CAMERA_COLLISION_PADDING)
      : idealDistance;
    const resolvedDistance = obstruction
      ? Math.max(THIRD_PERSON_CAMERA_MIN_DISTANCE, unobstructedDistance)
      : idealDistance;
    camera.position.copy(cameraLookTarget).addScaledVector(cameraOffsetVector, resolvedDistance);
  } else {
    camera.position.copy(desiredCameraPosition);
  }
  camera.lookAt(cameraLookTarget);
}

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsedTime = clock.elapsedTime;
  updateInteractiveDoors(delta);
  updateInteractiveNpcs(elapsedTime);

  if (state.mode === "walk") {
    updateWalkthrough(delta, elapsedTime);
  } else if (state.mode === "overview") {
    orbitControls.update();
  }

  slidingShelfCameras.forEach(({
    object,
    targetLocalX,
    targetLocalZ,
    slideAmplitude,
    speed,
    phase,
  }) => {
    object.position.x = Math.sin(elapsedTime * speed + phase) * slideAmplitude;
    const aimX = targetLocalX - object.position.x;
    object.rotation.y = Math.atan2(-aimX, -targetLocalZ);
  });

  syncPlayerPresentation(delta, elapsedTime);
  updateInteractionPrompt(elapsedTime);
  updateCoordinateDisplay();
  forecastFrenzy.update(delta, elapsedTime);
  mirrorDistanceLods.forEach(({ reflective, fallback, threshold }) => {
    const worldPosition = new THREE.Vector3();
    reflective.getWorldPosition(worldPosition);
    const useFallback = camera.position.distanceTo(worldPosition) > threshold;
    reflective.visible = !useFallback;
    fallback.visible = useFallback;
  });
  renderer.render(scene, camera);
}

function updateWalkthrough(delta) {
  if (state.seatedSeat) {
    const seatWorld = toWorldPoint(state.seatedSeat.center);
    playerState.position.x = seatWorld.x;
    playerState.position.z = seatWorld.z;
    playerState.position.y = state.seatedSeat.eyeHeight;
    state.velocityY = 0;
    playerState.motion = THREE.MathUtils.lerp(playerState.motion, 0, Math.min(1, delta * 10));
    return;
  }

  const moveIntent = new THREE.Vector2(0, 0);
  if (state.moveForward) moveIntent.y += 1;
  if (state.moveBackward) moveIntent.y -= 1;
  if (state.moveLeft) moveIntent.x -= 1;
  if (state.moveRight) moveIntent.x += 1;

  if (moveIntent.lengthSq() > 0) {
    moveIntent.normalize();
    const speed = WALK_SPEED * (state.sprint ? SPRINT_MULTIPLIER : 1);
    const forward = getFlatLookDirection(playerState.yaw, cameraForwardVector);
    const right = cameraLookTarget.set(-forward.z, 0, forward.x).normalize();
    const movement = cameraOffsetVector
      .set(0, 0, 0)
      .addScaledVector(forward, moveIntent.y * speed * delta)
      .addScaledVector(right, moveIntent.x * speed * delta);

    attemptMove(movement.x, movement.z);
  }
  playerState.facingYaw += angleDifference(
    playerState.facingYaw,
    playerState.yaw,
  ) * Math.min(1, delta * 12);
  const targetMotion = moveIntent.lengthSq() > 0 ? (state.sprint ? 1.22 : 1) : 0;
  playerState.motion = THREE.MathUtils.lerp(playerState.motion, targetMotion, Math.min(1, delta * 10));

  state.velocityY -= GRAVITY * delta;
  playerState.position.y += state.velocityY * delta;

  if (playerState.position.y <= PLAYER_HEIGHT) {
    playerState.position.y = PLAYER_HEIGHT;
    state.velocityY = 0;
  }

  const currentRoom = worldRooms.find((room) =>
    pointInPolygon({ x: playerState.position.x, z: playerState.position.z }, room.worldPoints),
  ) ?? null;
  let roofHeight = WALL_HEIGHT;
  if (currentRoom?.id === "other3" || currentRoom?.id === "other4") {
    roofHeight = Math.min(
      OTHER34_ROOF_BASE_HEIGHT,
      hangarInnerHeightAtWorldX(playerState.position.x),
    );
  } else if (currentRoom?.id === "newRoom") {
    roofHeight = Math.min(
      NEW_ROOM_ROOF_BASE_HEIGHT,
      hangarInnerHeightAtWorldX(playerState.position.x),
    );
  } else if (currentRoom?.id === "hangarBay") {
    roofHeight = hangarInnerHeightAtWorldX(playerState.position.x);
  }
  if (playerState.position.y >= roofHeight - 0.1) {
    playerState.position.y = roofHeight - 0.1;
    state.velocityY = 0;
  }
}

function attemptMove(deltaX, deltaZ) {
  const current = playerState.position.clone();
  const candidateX = new THREE.Vector2(current.x + deltaX, current.z);
  if (isWalkable(candidateX)) {
    playerState.position.x = candidateX.x;
  }

  const candidateZ = new THREE.Vector2(playerState.position.x, current.z + deltaZ);
  if (isWalkable(candidateZ)) {
    playerState.position.z = candidateZ.y;
  }
}

const PLAZA_RADIUS = 34;

function isWalkable(point) {
  const dist = Math.sqrt(point.x * point.x + point.y * point.y);
  if (dist > PLAZA_RADIUS) {
    return false;
  }

  const room = worldRooms.find((candidate) => pointInPolygon({ x: point.x, z: point.y }, candidate.worldPoints));
  const o5ExteriorLot = [
    toWorldPoint([-6.0, FRONT_EDGE_Z - 6.0]),
    toWorldPoint([OTHER5_RIGHT + 3.0, FRONT_EDGE_Z - 6.0]),
    toWorldPoint([OTHER5_RIGHT + 3.0, OTHER5_DEPTH + 1.8]),
    toWorldPoint([OTHER5_LEFT + 0.18, OTHER5_DEPTH + 1.8]),
    toWorldPoint([OTHER5_LEFT + 0.18, LEFT_ROOM_DEPTH + 4.0]),
    toWorldPoint([-6.0, LEFT_ROOM_DEPTH + 4.0]),
  ];
  const inO5Exterior = pointInPolygon({ x: point.x, z: point.y }, o5ExteriorLot);
  if (!room && !inO5Exterior) {
    return false;
  }

  if (
    room &&
    (room.id === "newRoom" || room.id === "hangarBay") &&
    hangarInnerHeightAtWorldX(point.x) <= PLAYER_HEIGHT + 0.1
  ) {
    return false;
  }

  if (collisionRects.some((rect) => pointInRect(point, rect))) {
    return false;
  }

  if (interactiveDoors.some((door) => getInteractiveDoorRects(door).some((rect) => pointInRect(point, rect)))) {
    return false;
  }

  if (furnitureRects.some((rect) => pointInRect(point, rect))) {
    return false;
  }

  return true;
}

function enterWalkMode(view = "firstPerson") {
  clearMovementState();
  state.mode = "walk";
  state.walkView = view;
  orbitControls.enabled = false;
  syncPlayerPresentation(0, clock.elapsedTime);
  maybeLockWalkthrough();
  syncUi();
}

function enterOverviewMode(shouldUnlock = true) {
  clearMovementState();
  state.seatedSeat = null;
  playerState.motion = 0;
  playerState.position.y = Math.max(playerState.position.y, PLAYER_HEIGHT);
  state.velocityY = 0;
  state.mode = "overview";
  orbitControls.enabled = true;
  camera.position.copy(overviewCameraPosition);
  orbitControls.target.copy(overviewTarget);
  orbitControls.update();
  if (shouldUnlock) {
    unlockPointer();
  }
  syncUi();
}

function updateCoordinateDisplay() {
  if (!coordX || !coordY || !coordZ) {
    return;
  }
  const p = playerState.position;
  coordX.textContent = `x: ${p.x.toFixed(2)}`;
  coordY.textContent = `y: ${p.y.toFixed(2)}`;
  coordZ.textContent = `z: ${p.z.toFixed(2)}`;
}

function syncUi() {
  labelGroup.visible = state.mode === "overview";
  if (state.mode !== "walk") {
    hideInteractionPrompt();
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function unlockPointer() {
  if (document.pointerLockElement === canvas) {
    document.exitPointerLock();
  }
}

function onPointerLockChange() {
  isPointerLocked = document.pointerLockElement === canvas;
  clearMovementState();
  syncUi();
}

function onPointerMove(event) {
  if (state.mode !== "walk" || !isPointerLocked) {
    return;
  }

  playerState.yaw -= event.movementX * POINTER_LOOK_SENSITIVITY;
  playerState.pitch = clamp(
    playerState.pitch - event.movementY * POINTER_LOOK_SENSITIVITY,
    -PLAYER_MAX_PITCH,
    PLAYER_MAX_PITCH,
  );
}

function maybeLockWalkthrough() {
  if (state.mode === "walk" && !isPointerLocked) {
    canvas.requestPointerLock();
  }
}

function onKeyDown(event) {
  if (state.mode === "minigame") {
    forecastFrenzy.handleKeyDown(event);
    return;
  }

  switch (event.code) {
    case "KeyW":
      if (state.mode === "walk" && isPointerLocked) {
        state.moveForward = true;
      }
      break;
    case "KeyS":
      if (state.mode === "walk" && isPointerLocked) {
        state.moveBackward = true;
      }
      break;
    case "KeyA":
      if (state.mode === "walk" && isPointerLocked) {
        state.moveLeft = true;
      }
      break;
    case "KeyD":
      if (state.mode === "walk" && isPointerLocked) {
        state.moveRight = true;
      }
      break;
    case "ShiftLeft":
    case "ShiftRight":
      if (state.mode === "walk" && isPointerLocked) {
        state.sprint = true;
      }
      break;
    case "Space":
      if (state.mode === "walk" && isPointerLocked) {
        event.preventDefault();
        if (playerState.position.y <= PLAYER_HEIGHT + 0.01) {
          state.velocityY = JUMP_VELOCITY;
        }
      }
      break;
    case "Digit1":
      if (state.mode === "walk" && !event.repeat) {
        enterWalkMode("firstPerson");
      }
      break;
    case "Digit2":
      if (state.mode === "walk" && !event.repeat) {
        enterWalkMode("thirdPerson");
      }
      break;
    case "KeyV":
      if (state.mode === "walk" && !event.repeat) {
        enterWalkMode(state.walkView === "firstPerson" ? "thirdPerson" : "firstPerson");
      }
      break;
    case "KeyO":
      enterOverviewMode();
      break;
    case "KeyE":
      if (state.mode === "walk" && isPointerLocked && !event.repeat) {
        event.preventDefault();
        toggleNearestInteraction();
      }
      break;
    default:
      break;
  }
}

function onKeyUp(event) {
  if (state.mode === "minigame") {
    return;
  }

  switch (event.code) {
    case "KeyW":
      state.moveForward = false;
      break;
    case "KeyS":
      state.moveBackward = false;
      break;
    case "KeyA":
      state.moveLeft = false;
      break;
    case "KeyD":
      state.moveRight = false;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      state.sprint = false;
      break;
    default:
      break;
  }
}

function pointInRect(point, rect) {
  return (
    point.x > rect.minX &&
    point.x < rect.maxX &&
    point.y > rect.minZ &&
    point.y < rect.maxZ
  );
}

function clearMovementState() {
  state.moveForward = false;
  state.moveBackward = false;
  state.moveLeft = false;
  state.moveRight = false;
  state.sprint = false;
  state.velocityY = 0;
}

function pointInPolygon(point, polygon) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const zi = polygon[i].z;
    const xj = polygon[j].x;
    const zj = polygon[j].z;

    const intersects =
      zi > point.z !== zj > point.z &&
      point.x < ((xj - xi) * (point.z - zi)) / (zj - zi + Number.EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function createShape(points) {
  const shape = new THREE.Shape();
  points.forEach((point, index) => {
    if (index === 0) {
      shape.moveTo(point.x, point.z);
      return;
    }
    shape.lineTo(point.x, point.z);
  });
  shape.closePath();
  return shape;
}

function createShapeGeometry(points) {
  return new THREE.ShapeGeometry(createShape(points));
}

function rectFromSegment(start, end, thickness, padding) {
  const half = thickness / 2 + padding;
  if (Math.abs(start.x - end.x) < 0.0001) {
    return {
      minX: start.x - half,
      maxX: start.x + half,
      minZ: Math.min(start.z, end.z) - half,
      maxZ: Math.max(start.z, end.z) + half,
    };
  }

  return {
    minX: Math.min(start.x, end.x) - half,
    maxX: Math.max(start.x, end.x) + half,
    minZ: start.z - half,
    maxZ: start.z + half,
  };
}

function axisAlignedRect(center, width, depth, padding = 0) {
  return {
    minX: center.x - width / 2 - padding,
    maxX: center.x + width / 2 + padding,
    minZ: center.z - depth / 2 - padding,
    maxZ: center.z + depth / 2 + padding,
  };
}

function axisAlignedBoundsForRotatedRect(center, width, depth, rotation, padding = 0) {
  const cos = Math.abs(Math.cos(rotation));
  const sin = Math.abs(Math.sin(rotation));
  return axisAlignedRect(
    center,
    width * cos + depth * sin,
    width * sin + depth * cos,
    padding,
  );
}

function localPointToWorldXZ(root, x, z) {
  const point = root.localToWorld(new THREE.Vector3(x, 0, z));
  return { x: point.x, z: point.z };
}

function getFootprint(width, depth, rotation) {
  const normalized = Math.abs(rotation) % Math.PI;
  const swapped = Math.abs(normalized - Math.PI / 2) < 0.001;
  return swapped
    ? { width: depth, depth: width }
    : { width, depth };
}

function distance2(a, b) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getBounds(points) {
  const xs = points.map((point) => point[0] ?? point.x);
  const zs = points.map((point) => point[1] ?? point.z);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
    width: Math.max(...xs) - Math.min(...xs),
    depth: Math.max(...zs) - Math.min(...zs),
  };
}

function segmentsFromPolygon(points) {
  return points.map((point, index) => [point, points[(index + 1) % points.length]]);
}

function matchesPoint(a, b) {
  return Math.abs(a[0] - b[0]) < 0.0001 && Math.abs(a[1] - b[1]) < 0.0001;
}

function matchesSegment(startA, endA, startB, endB) {
  return (
    (matchesPoint(startA, startB) && matchesPoint(endA, endB)) ||
    (matchesPoint(startA, endB) && matchesPoint(endA, startB))
  );
}

function toWorldPoint(point) {
  return {
    x: point[0] - planCenter.x,
    z: point[1] - planCenter.z,
  };
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
