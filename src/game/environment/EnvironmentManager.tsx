import React from 'react';
import { SkyAndLighting } from './SkyAndLighting';
import { RoadSystem } from './RoadSystem';
import { StreetLights } from './StreetLights';
import { CountrysideScenery } from './CountrysideScenery';
import { StationPlatform } from './StationPlatform';
import { StopArea } from './StopArea';
import { WeatherEffects } from './WeatherEffects';

export const EnvironmentManager: React.FC = () => {
  return (
    <group name="EnvironmentRoot">
      <SkyAndLighting />
      <RoadSystem />
      <StreetLights />
      <CountrysideScenery />
      <StationPlatform />
      <StopArea />
      <WeatherEffects />
    </group>
  );
};

