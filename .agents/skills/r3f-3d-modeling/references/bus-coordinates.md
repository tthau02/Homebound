# Virtual Bus 3D — Coordinate & Bounding Box Reference

## Global Bus Orientation
- **Origin `(0, 0, 0)`**: Road surface (`y = 0`) at the geometric center of the bus footprint.
- **Forward (`-Z`)**: Front windshield & bumper at `z = -6.20m`.
- **Rear (`+Z`)**: Engine bay & taillights at `z = +6.20m`.
- **Left (`-X`)**: Driver side outer wall at `x = -1.38m`.
- **Right (`+X`)**: Passenger entry door outer wall at `x = +1.38m`.

## Key Vertical Levels (`Y` Axis)
| Level Name | `Y` Coordinate (`m`) | Notes |
| :--- | :--- | :--- |
| Road Surface | `0.00` | Asphalt top surface |
| Chassis Bottom | `0.48` | Ground clearance under bus |
| Wheel Center | `0.52` | Axle height (`wheelRadius = 0.52m`) |
| Cabin Floor | `0.72` | Base reference for `BusSeat` & `DriverCabin` |
| Window Sill | `1.46` | Bottom of panoramic side windows |
| Overhead Rack | `2.48` | Luggage rack & handrail height |
| Window Header | `2.54` | Top of panoramic side windows |
| Interior Ceiling | `2.88` | Red ceiling (`#991b1b`) |
| Exterior Roof | `3.06` | Outer roof crown |

## Seat Grid Coordinates
- **Rows (`Z`)**: `[-3.2, -1.9, -0.6, 0.7, 2.0, 3.3, 4.6]` (`7 rows`, `1.30m` pitch)
- **Columns (`X`)**:
  - `leftWindow`: `-1.02m`
  - `leftAisle`: `-0.56m`
  - `rightAisle`: `+0.56m`
  - `rightWindow`: `+1.02m`
- **Central Aisle Clear Width**: `x ∈ [-0.35m, +0.35m]` (`0.70m` unobstructed walkway)

