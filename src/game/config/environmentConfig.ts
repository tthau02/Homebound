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
    skyBg: '#7dd3fc',
    fogColor: '#bae6fd',
    fogNear: 45,
    fogFar: 165,
    ambientIntensity: 0.75,
    ambientColor: '#f8fafc',
    hemiSkyColor: '#e0f2fe',
    hemiGroundColor: '#4d7c0f',
    hemiIntensity: 0.85,
    sunColor: '#fffbeb',
    sunIntensity: 2.2,
    sunPosition: [28, 42, -24] as [number, number, number],
  },
  night: {
    skyBg: '#060b19',
    fogColor: '#091024',
    fogNear: 28,
    fogFar: 135,
    ambientIntensity: 0.22,
    ambientColor: '#1e293b',
    hemiSkyColor: '#1e3a8a',
    hemiGroundColor: '#0f172a',
    hemiIntensity: 0.35,
    sunColor: '#60a5fa',
    sunIntensity: 0.35,
    sunPosition: [-20, 35, -30] as [number, number, number],
  },
} as const;

