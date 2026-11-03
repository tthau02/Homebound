import React from 'react';
import { BusModel } from '../bus/BusModel';
import { CameraManager } from '../camera/CameraManager';
import { EnvironmentManager } from '../environment/EnvironmentManager';

export const GameWorld: React.FC = () => {
  return (
    <>
      <CameraManager />
      <EnvironmentManager />
      <BusModel />
    </>
  );
};
