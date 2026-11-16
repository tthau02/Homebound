import React from 'react';
import { SkyAndLighting } from './SkyAndLighting';
import { RoadSystem } from './RoadSystem';
import { StreetLights } from './StreetLights';
import { RouteScenery } from './scenery/RouteScenery';
import { RouteStation } from './station/RouteStation';
import { TrafficSystem } from './traffic/TrafficSystem';
import { StopArea } from './StopArea';
import { WeatherEffects } from './WeatherEffects';

export const EnvironmentManager: React.FC = () => {
  return (
    <group name="EnvironmentRoot">
      <SkyAndLighting />
      <RoadSystem />
      <StreetLights />
      <RouteScenery />
      <TrafficSystem />
      <RouteStation />
      <StopArea />
      <WeatherEffects />
    </group>
  );
};

