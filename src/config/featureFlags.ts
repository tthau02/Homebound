/** Build-time product switches for frontend-only releases. */
export const FEATURE_FLAGS = {
  playerGuide: true,
  feedbackExport: true,
  releaseNotes: true,
} as const;

export const APP_VERSION = '0.3.0';
