export const ENVIRONMENT_CONFIG = {
  /** Total looping range along Z axis: from zMin (far ahead) to zMax (behind chase camera) */
  zMin: -160,
  zMax: 40,
  loopSpan: 200,

  /** Road dimensions */
  roadWidth: 9.2,
  shoulderWidth: 1.8,
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

export const LIGHTING_CONFIG = {
  day: {
    skyBg: '#38bdf8', // Vibrant tropical sunny cyan-blue sky
    fogColor: '#bae6fd',
    fogNear: 60,
    fogFar: 220,
    ambientIntensity: 0.95,
    ambientColor: '#ffffff',
    hemiSkyColor: '#e0f2fe',
    hemiGroundColor: '#84cc16', // Vibrant fresh grass bounce
    hemiIntensity: 1.05,
    sunColor: '#fffef0', // Radiant warm golden sunlight
    sunIntensity: 2.85,
    sunPosition: [28, 44, -22] as [number, number, number],
  },
  night: {
    skyBg: '#060b19',
    fogColor: '#091024',
    fogNear: 35,
    fogFar: 155,
    ambientIntensity: 0.28,
    ambientColor: '#1e293b',
    hemiSkyColor: '#1e3a8a',
    hemiGroundColor: '#0f172a',
    hemiIntensity: 0.4,
    sunColor: '#60a5fa',
    sunIntensity: 0.45,
    sunPosition: [-20, 35, -30] as [number, number, number],
  },
} as const;
