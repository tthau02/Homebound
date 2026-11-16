export const ENVIRONMENT_CONFIG = {
  /** Total looping range along Z axis: from zMin (far ahead) to zMax (behind chase camera) */
  zMin: -160,
  zMax: 40,
  loopSpan: 200,

  laneDashCount: 25,
  laneDashSpacing: 8.0,

  /** Roadside objects counts for pooling / instancing */
  streetLightCount: 16,
  streetLightSpacing: 25.0,

  nearTreeCount: 44,
  midHouseCount: 22,
  farMountainCount: 14,
  utilityPoleCount: 20,

  /** Rest stop periodic loop */
  restStopLoopSpan: 240,
  restStopInitialZ: -110,
} as const;

/**
 * Cross-section of the dual carriageway (metres, X axis). The bus drives in the right-hand
 * lane centred on x = 0 (Vietnam drives on the right; forward is -Z), so its door opens onto
 * the paved shoulder / station kerb on +X. Everything else is laid out to its left.
 *
 *   -14.0      -13.25   -9.75    -6.25 -5.25    -1.75     1.75      3.7
 *     | shoulder | oncoming | oncoming | median | overtake |  BUS  | shoulder |
 */
export const ROAD_LAYOUT = {
  laneWidth: 3.5,
  busLaneX: 0,
  overtakeLaneX: -3.5,
  medianX: -5.75,
  medianWidth: 1.0,
  oncomingInnerX: -8.0,
  oncomingOuterX: -11.5,
  /** Paved right shoulder used by motorbikes */
  shoulderLaneX: 2.7,
  rightLineX: 1.75,
  rightPavedX: 3.7,
  rightVergeX: 4.6,
  leftLineX: -13.25,
  leftPavedX: -14.0,
  leftVergeX: -15.2,
  /** Extra lateral offset applied to left-side scenery so it clears the wider carriageway */
  leftSceneryOffset: 8,
} as const;

export const LIGHTING_CONFIG = {
  day: {
    skyBg: '#9cc9e4',
    /** Warm atmospheric haze matched to the procedural Sky horizon */
    fogColor: '#c9dbe3',
    fogNear: 70,
    fogFar: 380,
    ambientIntensity: 0.25,
    ambientColor: '#ffffff',
    hemiSkyColor: '#cfe6f5',
    hemiGroundColor: '#5f7d3a',
    hemiIntensity: 0.7,
    sunColor: '#fff1d6',
    sunIntensity: 2.6,
    sunPosition: [28, 44, -22] as [number, number, number],
    environmentIntensity: 0.65,
  },
  night: {
    skyBg: '#070c1c',
    fogColor: '#0b1328',
    fogNear: 30,
    fogFar: 200,
    ambientIntensity: 0.18,
    ambientColor: '#334155',
    hemiSkyColor: '#1e3a8a',
    hemiGroundColor: '#0f172a',
    hemiIntensity: 0.35,
    sunColor: '#93b4f5',
    sunIntensity: 0.4,
    sunPosition: [-20, 35, -30] as [number, number, number],
    environmentIntensity: 0.18,
  },
} as const;

/** Per graphics-quality budgets shared by renderer, lighting and scenery. */
export const QUALITY_PROFILES = {
  low: { cameraFar: 300, fogScale: 0.7, shadowMapSize: 512, sceneryDensity: 0.55 },
  medium: { cameraFar: 450, fogScale: 0.9, shadowMapSize: 1024, sceneryDensity: 0.8 },
  high: { cameraFar: 620, fogScale: 1, shadowMapSize: 2048, sceneryDensity: 1 },
} as const;
