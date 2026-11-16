import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../../stores/useGameStore';
import { useMultiplayerStore } from '../../../stores/useMultiplayerStore';
import { JOURNEY_STOPS, StationStop, liveJourneyTelemetry } from '../../../stores/useJourneyStore';
import { ROAD_LAYOUT } from '../../config/environmentConfig';
import { DOOR_Z, PLATFORM_Y, STATION_LAYOUTS, StationLayout } from '../../config/stationConfig';
import { sceneryLive } from '../scenery/sceneryLive';
import { StationPeople } from './StationPeople';
import {
  Bench,
  Bin,
  Box,
  Cyl,
  LampPost,
  ParkedScooter,
  ParkedVehicle,
  Pavement,
  Shelter,
  Shop,
  Sign,
  StallCart,
  TreePlanter,
  UmbrellaTable,
} from './stationKit';

const KERB_X = 1.55;
/** People and small props are only mounted within this distance of the bus. */
const DETAIL_RANGE_AHEAD = 170;
const DETAIL_RANGE_BEHIND = 95;

interface SceneProps {
  stop: StationStop;
  layout: StationLayout;
  night: boolean;
}

/** Yellow bus-bay box painted on the road + the stop flag next to the door. */
const BusBay: React.FC<{ stop: StationStop; night: boolean }> = ({ stop, night }) => (
  <group>
    {[-7.2, 7.2].map((z) => (
      <Box key={z} p={[0, 0.014 - PLATFORM_Y, z]} s={[3.1, 0.006, 0.16]} c="#facc15" rough={0.5} />
    ))}
    <Box p={[ROAD_LAYOUT.rightLineX - 3.3, 0.014 - PLATFORM_Y, 0]} s={[0.16, 0.006, 14.4]} c="#facc15" rough={0.5} />
    {/* Stop flag */}
    <Cyl p={[2.15, 1.45, DOOR_Z - 2.9]} s={[0.08, 2.9, 0.08]} c="#475569" metal={0.7} rough={0.35} shadow />
    <Sign lines={['BUS']} p={[2.15, 2.75, DOOR_Z - 2.9]} w={0.62} h={0.62} bg="#1d4ed8" face="ahead" night={night} />
    <Sign lines={[stop.shortName]} p={[2.15, 2.2, DOOR_Z - 2.9]} w={1.5} h={0.36} bg="#f8fafc" fg="#0f172a" face="ahead" night={night} />
  </group>
);

/** Large station name board at the end the bus reaches first, readable while approaching. */
const NameBoard: React.FC<{ lines: string[]; x: number; z: number; night: boolean; bg?: string }> = ({ lines, x, z, night, bg = '#1e40af' }) => (
  <group position={[x, 0, z]}>
    {[-2.3, 2.3].map((px) => (
      <Cyl key={px} p={[px, 1.9, 0]} s={[0.14, 3.8, 0.14]} c="#64748b" metal={0.6} rough={0.4} shadow />
    ))}
    <Sign lines={lines} p={[0, 3.3, 0]} w={5.4} h={1.5} bg={bg} face="ahead" night={night} />
  </group>
);

// ---------------------------------------------------------------------------
// 1. Town pick-up point: Bánh mì 168
// ---------------------------------------------------------------------------
const TownStop: React.FC<SceneProps> = ({ stop, layout, night }) => (
  <group>
    <Pavement minX={KERB_X} maxX={layout.depth} halfLength={layout.halfLength} height={PLATFORM_Y} />
    <group position={[0, PLATFORM_Y, 0]}>
      <BusBay stop={stop} night={night} />
      <NameBoard lines={['ĐIỂM ĐÓN KHÁCH', stop.shortName.toUpperCase()]} x={5.2} z={18.6} night={night} />
      <Shelter x={4.5} z={-10.5} night={night} />

      {/* Shop-houses facing the road */}
      <Shop x={13.5} z={-5} w={8} d={6} h={7.4} floors={1} wall="#f3e7c9" lines={['BÁNH MÌ 168']} signBg="#b91c1c" awning="#dc2626" night={night} />
      <Shop x={13.5} z={5} w={8} d={6} h={6.6} floors={1} wall="#dfe8d5" lines={['TẠP HOÁ · CÀ PHÊ']} signBg="#0f766e" awning="#0d9488" night={night} />
      <Shop x={13.5} z={14.2} w={7} d={6} h={10.4} floors={2} wall="#f9d6c4" lines={['NHÀ NGHỈ BÌNH LỤC']} signBg="#7c3aed" awning="#8b5cf6" night={night} />
      <Shop x={13.5} z={-14.2} w={7} d={6} h={7.0} floors={1} wall="#e9f0f7" lines={['SỬA XE · RỬA XE']} signBg="#1d4ed8" awning="#2563eb" night={night} />

      <StallCart x={8.4} z={-3.2} night={night} lines={['BÁNH MÌ NÓNG GIÒN']} body="#b45309" canopy="#dc2626" goods="bread" />
      <UmbrellaTable x={7.0} z={5.0} color="#0ea5e9" />
      <Box p={[7.0, 0.74, 5.0]} s={[0.3, 0.12, 0.3]} c="#e5e7eb" metal={0.7} rough={0.3} />

      {[11, 12.3, 13.6, 14.9].map((z, i) => (
        <ParkedScooter key={z} x={8.95} z={z} color={['#dc2626', '#1f2937', '#2563eb', '#f8fafc'][i]} />
      ))}
      <TreePlanter x={3.4} z={12} />
      <TreePlanter x={3.4} z={-15.5} scale={0.9} />
      <LampPost x={2.5} z={3.5} night={night} />
      <LampPost x={2.5} z={-17.5} night={night} />
      <LampPost x={2.5} z={17.5} night={night} />
      <Bin x={6.2} z={-7.4} />
      {night && <pointLight position={[5, 3.4, -3]} intensity={5} distance={16} decay={1.6} color="#ffd9a0" />}
    </group>
  </group>
);

// ---------------------------------------------------------------------------
// 2. Expressway service area: Km227 Liêm Tuyền
// ---------------------------------------------------------------------------
const RestStop: React.FC<SceneProps> = ({ stop, layout, night }) => (
  <group>
    <Pavement minX={KERB_X} maxX={layout.depth} halfLength={layout.halfLength} height={PLATFORM_Y} color="#c8c4bb" />
    <group position={[0, PLATFORM_Y, 0]}>
      <BusBay stop={stop} night={night} />
      <NameBoard lines={['TRẠM DỪNG NGHỈ KM227', 'LIÊM TUYỀN']} x={5.4} z={24.4} night={night} bg="#0f6b3f" />

      {/* Main food hall with a deep roof overhang on columns */}
      <Box p={[24.5, 3.0, -4]} s={[11, 6, 24]} c="#f1ede4" rough={0.85} shadow />
      <Box p={[18.98, 2.5, -4]} s={[0.06, 3.8, 22]} c={night ? '#f3d28c' : '#27384a'} rough={0.15} metal={0.25} glow={night ? 0.8 : 0} />
      {[-13, -7, -1, 5].map((z) => (
        <Box key={z} p={[18.94, 2.5, z]} s={[0.1, 3.9, 0.16]} c="#e5e7eb" metal={0.5} />
      ))}
      <Box p={[21.5, 6.25, -4]} s={[18, 0.5, 26]} c="#b4472f" rough={0.8} shadow />
      <Box p={[12.7, 6.0, -4]} s={[0.5, 1.0, 26]} c="#f8fafc" rough={0.7} />
      {[-15, -9, -3, 3, 7].map((z) => (
        <Cyl key={z} p={[13.2, 3.0, z]} s={[0.34, 6.0, 0.34]} c="#e7e2d6" rough={0.8} shadow />
      ))}
      <Sign lines={['TRẠM DỪNG NGHỈ KM227 · LIÊM TUYỀN']} p={[12.42, 6.0, -4]} w={17} h={0.9} bg="#0f6b3f" face="road" night={night} backing={false} />
      <Sign lines={['NHÀ HÀNG · ĐẶC SẢN · CÀ PHÊ']} p={[18.9, 4.95, -4]} w={12} h={0.7} bg="#b45309" face="road" night={night} />

      {/* Toilet block */}
      <Shop x={23} z={18} w={8} d={6} h={3.9} floors={0} wall="#e9f0f7" lines={['WC · NHÀ VỆ SINH']} signBg="#1d4ed8" awning="#3b82f6" night={night} />

      <StallCart x={8.05} z={1.55} night={night} lines={['NƯỚC MÍA SIÊU SẠCH']} body="#059669" canopy="#f59e0b" signBg="#0369a1" goods="cane" />
      <StallCart x={8.05} z={8.05} night={night} lines={['BÁNH ĐA · CHUỐI NGỰ']} body="#b45309" canopy="#16a34a" signBg="#b91c1c" goods="baskets" />
      <UmbrellaTable x={11.5} z={-9.0} color="#dc2626" />
      <UmbrellaTable x={11.5} z={-4.5} color="#f59e0b" />
      <UmbrellaTable x={14.5} z={-6.8} color="#0ea5e9" />

      {/* Check-in board facing the road */}
      <Box p={[5.0, 0.25, -15]} s={[0.7, 0.5, 5.4]} c="#a8a29e" rough={0.9} shadow />
      <Sign lines={['KM 227', 'LIÊM TUYỀN · HÀ NAM']} p={[5.0, 1.75, -15]} w={5.0} h={2.4} bg="#be123c" face="road" night={night} />
      <Sign lines={['KM 227', 'LIÊM TUYỀN · HÀ NAM']} p={[5.02, 1.75, -15]} w={5.0} h={2.4} bg="#be123c" face="away" night={night} backing={false} />

      {/* Car park */}
      {[11.4, 16.6, 22.8].map((z) => (
        <Box key={z} p={[8.0, 0.004, z]} s={[2.6, 0.006, 0.12]} c="#f8fafc" rough={0.6} />
      ))}
      <ParkedVehicle kind="sedan" color="#9ca3af" x={8.0} z={14.0} />
      <ParkedVehicle kind="suv" color="#1d4ed8" x={8.0} z={20.0} />
      <ParkedVehicle kind="coach" color="#f97316" x={12.5} z={17.1} />

      {/* Flags, greenery, lighting */}
      {[9.5, 11, 12.5].map((z, i) => (
        <group key={z} position={[16.6, 0, z]}>
          <Cyl p={[0, 3.2, 0]} s={[0.07, 6.4, 0.07]} c="#cbd5e1" metal={0.7} />
          <Box p={[0, 5.8, 0.55]} s={[0.03, 0.7, 1.1]} c={['#dc2626', '#facc15', '#0f6b3f'][i]} rough={0.8} />
        </group>
      ))}
      <TreePlanter x={19.2} z={11.2} />
      <TreePlanter x={19.2} z={24.2} />
      <TreePlanter x={19.2} z={-24.2} />
      <LampPost x={2.5} z={8} night={night} />
      <LampPost x={2.5} z={-20} night={night} />
      <LampPost x={2.5} z={21} night={night} />
      <LampPost x={10} z={-19} night={night} height={5.4} />
      <Bench x={16.2} z={-18.5} length={3} />
      <Bin x={6.2} z={-6.5} />
      <Bin x={10.2} z={4.8} />
      {night && (
        <>
          <pointLight position={[6, 3.6, -1]} intensity={6} distance={18} decay={1.6} color="#ffd9a0" />
          <pointLight position={[13, 4.6, -6.5]} intensity={7} distance={20} decay={1.6} color="#ffe6b8" />
        </>
      )}
    </group>
  </group>
);

// ---------------------------------------------------------------------------
// 3. Inner-city kerbside stop (Pháp Vân, Khuất Duy Tiến)
// ---------------------------------------------------------------------------
const CITY_SHOPS: Record<string, { lines: string[]; signBg: string; awning: string; wall: string; h: number; floors: number }[]> = {
  'stop-2': [
    { lines: ['PHỞ BÒ NAM ĐỊNH'], signBg: '#b91c1c', awning: '#dc2626', wall: '#f6e7c1', h: 13.4, floors: 3 },
    { lines: ['NHÀ THUỐC 24H'], signBg: '#15803d', awning: '#16a34a', wall: '#e9f0f7', h: 16.6, floors: 4 },
    { lines: ['BẾN XE NƯỚC NGẦM →'], signBg: '#1d4ed8', awning: '#2563eb', wall: '#f7f1e3', h: 10.2, floors: 2 },
    { lines: ['TRÀ SỮA · BÁNH NGỌT'], signBg: '#be185d', awning: '#db2777', wall: '#f9d6c4', h: 13.4, floors: 3 },
    { lines: ['ĐIỆN THOẠI · PHỤ KIỆN'], signBg: '#0e7490', awning: '#0891b2', wall: '#d9efe1', h: 16.6, floors: 4 },
  ],
  'stop-3': [
    { lines: ['BÚN CHẢ HÀ NỘI'], signBg: '#b45309', awning: '#d97706', wall: '#f7f1e3', h: 16.6, floors: 4 },
    { lines: ['SIÊU THỊ THĂNG LONG →'], signBg: '#dc2626', awning: '#ef4444', wall: '#e9f0f7', h: 13.4, floors: 3 },
    { lines: ['NHÀ VĂN HOÁ THANH XUÂN'], signBg: '#1e40af', awning: '#1d4ed8', wall: '#f6e7c1', h: 10.2, floors: 2 },
    { lines: ['CÀ PHÊ · SINH TỐ'], signBg: '#6d28d9', awning: '#7c3aed', wall: '#d9efe1', h: 16.6, floors: 4 },
    { lines: ['THỜI TRANG · GIÀY DÉP'], signBg: '#0f766e', awning: '#14b8a6', wall: '#f9d6c4', h: 13.4, floors: 3 },
  ],
};

const CityStop: React.FC<SceneProps> = ({ stop, layout, night }) => {
  const shops = CITY_SHOPS[stop.id] ?? CITY_SHOPS['stop-2'];
  return (
    <group>
      <Pavement minX={KERB_X} maxX={layout.depth} halfLength={layout.halfLength} height={PLATFORM_Y} color="#bdb9b1" />
      <group position={[0, PLATFORM_Y, 0]}>
        <BusBay stop={stop} night={night} />
        <NameBoard lines={['ĐIỂM DỪNG XE KHÁCH', stop.shortName.toUpperCase()]} x={5.0} z={20.6} night={night} />
        <Shelter x={4.2} z={-10.5} night={night} glass adLines={['VIRTUAL BUS', '168']} />

        {/* Route map board */}
        <Cyl p={[2.75, 1.0, -7.4]} s={[0.08, 2.0, 0.08]} c="#475569" metal={0.7} shadow />
        <Sign lines={['TUYẾN 168', 'PHÁP VÂN → MỸ ĐÌNH']} p={[2.75, 1.7, -7.4]} w={1.3} h={0.9} bg="#f8fafc" fg="#0f172a" face="away" night={night} />

        {shops.map((shop, i) => (
          <Shop key={shop.lines[0]} x={12.6} z={-17.6 + i * 8.8} w={8.6} d={6.8} night={night} {...shop} />
        ))}
        {/* Office tower behind the shop row */}
        <Box p={[27, 22, -6]} s={[15, 44, 16]} c="#9fb2c4" rough={0.3} metal={0.5} />
        {[8, 16, 24, 32, 40].map((y) => (
          <Box key={y} p={[19.46, y, -6]} s={[0.08, 2.4, 14.6]} c={night ? '#f3dfa6' : '#38506a'} rough={0.2} glow={night ? 0.6 : 0} />
        ))}

        <StallCart x={6.6} z={3.3} night={night} lines={['TRÀ CHANH · NƯỚC MÍA']} body="#15803d" canopy="#facc15" signBg="#15803d" goods="drinks" />
        <TreePlanter x={2.9} z={9} scale={0.8} />
        <TreePlanter x={2.9} z={-17} scale={0.8} />
        <TreePlanter x={2.9} z={17} scale={0.8} />
        {[10.8, 12.0, 13.2, 14.4].map((z, i) => (
          <ParkedScooter key={z} x={8.25} z={z} color={['#1f2937', '#dc2626', '#f8fafc', '#0f766e'][i]} />
        ))}
        <LampPost x={2.4} z={0.5} night={night} height={5.2} />
        <LampPost x={2.4} z={-13.5} night={night} height={5.2} />
        <LampPost x={2.4} z={13.5} night={night} height={5.2} />
        <Bin x={5.6} z={-7.2} />
        <Bin x={8.4} z={-1.2} />
        {night && <pointLight position={[5, 3.6, -4]} intensity={6} distance={18} decay={1.6} color="#ffe6b8" />}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------------------
// 4. Inter-provincial terminal: Bến xe Mỹ Đình
// ---------------------------------------------------------------------------
const BayCanopy: React.FC<{ x: number; z: number; length: number }> = ({ x, z, length }) => (
  <group position={[x, 0, z]}>
    {[-length / 2 + 0.6, 0, length / 2 - 0.6].map((pz) => (
      <group key={pz}>
        <Cyl p={[-1.9, 2.4, pz]} s={[0.18, 4.8, 0.18]} c="#64748b" metal={0.6} rough={0.4} shadow />
        <Cyl p={[1.9, 2.4, pz]} s={[0.18, 4.8, 0.18]} c="#64748b" metal={0.6} rough={0.4} shadow />
        <Box p={[0, 4.75, pz]} s={[4.4, 0.16, 0.16]} c="#64748b" metal={0.6} />
      </group>
    ))}
    <Box p={[0, 4.95, 0]} s={[4.9, 0.14, length]} c="#1d4ed8" rough={0.5} shadow />
    <Box p={[0, 5.04, 0]} s={[4.5, 0.06, length - 0.4]} c="#e2e8f0" rough={0.4} />
  </group>
);

const Terminal: React.FC<SceneProps> = ({ stop, layout, night }) => (
  <group>
    <Pavement minX={KERB_X} maxX={layout.depth} halfLength={layout.halfLength} height={PLATFORM_Y} color="#c4c0b8" />
    <group position={[0, PLATFORM_Y, 0]}>
      <BusBay stop={stop} night={night} />
      <NameBoard lines={['HÀ NỘI KÍNH CHÀO QUÝ KHÁCH', 'BẾN XE MỸ ĐÌNH']} x={6.0} z={26.6} night={night} bg="#b91c1c" />

      {/* Terminal hall */}
      <Box p={[30, 4.5, 0]} s={[12, 9, 44]} c="#eef1f5" rough={0.8} shadow />
      <Box p={[23.97, 3.6, 0]} s={[0.06, 5.6, 40]} c={night ? '#f3d28c' : '#2a3d52'} rough={0.12} metal={0.3} glow={night ? 0.85 : 0} />
      {[-18, -12, -6, 0, 6, 12, 18].map((z) => (
        <Box key={z} p={[23.92, 3.6, z]} s={[0.12, 5.8, 0.22]} c="#f8fafc" metal={0.4} />
      ))}
      <Box p={[29.5, 9.3, 0]} s={[14, 0.6, 46]} c="#1e3a8a" rough={0.6} shadow />
      <Box p={[29.5, 9.9, 0]} s={[9, 0.7, 40]} c="#e2e8f0" rough={0.5} />
      <Sign lines={['BẾN XE MỸ ĐÌNH']} p={[23.86, 7.6, 0]} w={20} h={2.2} bg="#b91c1c" face="road" night={night} />
      <Sign lines={['SẢNH TRẢ KHÁCH · QUẦY VÉ LIÊN TỈNH']} p={[23.86, 5.95, 0]} w={16} h={0.7} bg="#1e3a8a" face="road" night={night} />
      {/* Entrance canopy and clock */}
      <Box p={[22.4, 4.3, 0]} s={[3.2, 0.3, 11]} c="#b91c1c" rough={0.6} shadow />
      {[-5, 5].map((z) => (
        <Cyl key={z} p={[21.2, 2.15, z]} s={[0.28, 4.3, 0.28]} c="#e5e7eb" rough={0.6} shadow />
      ))}
      <Cyl p={[23.8, 8.95, 14]} s={[1.5, 0.12, 1.5]} c="#f8fafc" glow={night ? 0.8 : 0} rot={[0, 0, Math.PI / 2]} />

      {/* Covered bays with parked coaches */}
      <BayCanopy x={10.7} z={11.1} length={14.6} />
      <BayCanopy x={17.1} z={-9.1} length={14.6} />
      <BayCanopy x={17.1} z={11.1} length={14.6} />
      <ParkedVehicle kind="coach" color="#0ea5e9" x={10.7} z={11.1} />
      <ParkedVehicle kind="coach" color="#f8fafc" x={17.1} z={-9.1} />
      <ParkedVehicle kind="coach" color="#16a34a" x={17.1} z={11.1} rotY={Math.PI} />
      {[4.2, 18.0, -16.0, -2.2].map((z) => (
        <Box key={z} p={[14, 0.004, z]} s={[10.5, 0.006, 0.12]} c="#facc15" rough={0.6} />
      ))}

      {/* Information kiosk and drinks kiosk */}
      <Box p={[7.1, 1.3, -14]} s={[1.6, 2.6, 2.6]} c="#f8fafc" rough={0.7} shadow />
      <Box p={[6.28, 1.5, -14]} s={[0.05, 1.0, 1.9]} c="#9bd3e6" rough={0.1} opacity={0.4} />
      <Box p={[7.0, 2.72, -14]} s={[2.2, 0.16, 3.1]} c="#1d4ed8" rough={0.6} shadow />
      <Sign lines={['THÔNG TIN · VÉ XE']} p={[6.25, 2.3, -14]} w={2.4} h={0.5} bg="#1d4ed8" face="road" night={night} backing={false} />
      <StallCart x={6.5} z={4.0} night={night} lines={['NƯỚC GIẢI KHÁT']} body="#1d4ed8" canopy="#f8fafc" signBg="#1d4ed8" goods="drinks" />

      {/* Waiting benches */}
      <Bench x={13.5} z={-7.0} length={4.2} />
      <Bench x={13.5} z={1.0} length={4.2} />

      {/* Flag poles in front of the hall */}
      {[-9, -7.5, 7.5, 9].map((z, i) => (
        <group key={z} position={[23.2, 0, z]}>
          <Cyl p={[0, 3.6, 0]} s={[0.08, 7.2, 0.08]} c="#cbd5e1" metal={0.7} />
          <Box p={[0, 6.5, 0.6]} s={[0.03, 0.8, 1.2]} c={i % 2 === 0 ? '#dc2626' : '#facc15'} rough={0.8} />
        </group>
      ))}
      <TreePlanter x={23.3} z={20} />
      <TreePlanter x={23.3} z={-20} />
      <LampPost x={2.5} z={6} night={night} height={5.4} />
      <LampPost x={2.5} z={-12} night={night} height={5.4} />
      <LampPost x={2.5} z={22} night={night} height={5.4} />
      <LampPost x={2.5} z={-24} night={night} height={5.4} />
      <LampPost x={21.6} z={-14} night={night} height={5.4} />
      <LampPost x={21.6} z={14} night={night} height={5.4} />
      <Bin x={5.4} z={-9.5} />
      <Bin x={12.4} z={-2.6} />
      {night && (
        <>
          <pointLight position={[6, 3.8, -4]} intensity={7} distance={20} decay={1.6} color="#ffe6b8" />
          <pointLight position={[15, 4.4, 2]} intensity={8} distance={24} decay={1.6} color="#fff1d6" />
        </>
      )}
    </group>
  </group>
);

/**
 * The station of the current / next stop (offline single-player).
 * The journey store fixes its along-route position (`stationAnchorS`); here it is simply
 * drawn at `traveledM - anchor`, so it scrolls with the road and scenery instead of sliding
 * over them, and the bus brakes to a halt exactly beside the kerb.
 */
export const RouteStation: React.FC = () => {
  const groupRef = useRef<THREE.Group | null>(null);
  const night = useGameStore((s) => s.timeOfDay === 'night');
  const [shown, setShown] = useState<{ index: number; near: boolean }>({ index: 0, near: true });
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const anchor = liveJourneyTelemetry.stationAnchorS;
    // Online rooms use the simpler host-synchronised StopArea instead
    if (!Number.isFinite(anchor) || useMultiplayerStore.getState().isOnlineMode) {
      group.visible = false;
      return;
    }
    const z = sceneryLive.traveledM - anchor;
    group.visible = true;
    group.position.z = z;

    const index = liveJourneyTelemetry.stationStopIndex;
    const near = z > -DETAIL_RANGE_AHEAD && z < DETAIL_RANGE_BEHIND;
    const cur = shownRef.current;
    if (cur.index !== index || cur.near !== near) setShown({ index, near });
  });

  const stop = JOURNEY_STOPS[shown.index] ?? JOURNEY_STOPS[0];
  const layout = STATION_LAYOUTS[stop.layout];
  const sceneProps: SceneProps = { stop, layout, night };

  return (
    <group ref={groupRef} name="RouteStation" visible={false}>
      {layout.id === 'townStop' && <TownStop {...sceneProps} />}
      {layout.id === 'restStop' && <RestStop {...sceneProps} />}
      {layout.id === 'cityStop' && <CityStop {...sceneProps} />}
      {layout.id === 'terminal' && <Terminal {...sceneProps} />}
      {shown.near && (
        <group position={[0, PLATFORM_Y, 0]}>
          <StationPeople key={stop.id} layout={layout} stopId={stop.id} />
        </group>
      )}
    </group>
  );
};
