import type { BiomeId } from '../../config/biomeConfig';

/**
 * Live scenery telemetry shared with other systems (HUD, story triggers) without re-renders.
 * - `traveledM`: visual distance the world has scrolled past the bus.
 * - `landmarkNear`: id of the landmark currently passing the bus (within ~90 m), else null.
 */
export const sceneryLive = {
  traveledM: 0,
  biome: 'village' as BiomeId,
  landmarkNear: null as string | null,
};
