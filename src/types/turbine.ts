/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherInput, IcingEvaluation, RiskLevel } from '../utils/icingModel';

export interface TurbineTelemetry {
  turbineId: string;
  nominalCapacityMw: number; // 3.5 MW
  currentPowerMw: number;
  rotorDiameterM: number;    // 115 m
  rpm: number;               // 0 to 16.5 RPM
  pitchAngleDeg: number;     // blade pitch angle
  vibrationMmS: number;      // 0.5 to 8.0 mm/s (critical > 4.5 mm/s)
  iceThicknessMm: number;    // 0 to 18 mm
  leadingEdgeTempC: number;  // surface temperature
  pulseDutyCyclePercent: number; // 0 to 40%
  cumulativeEnergySavedKwh: number;
  operationalState: 'NORMAL' | 'PREHEATING' | 'ICING_STALL' | 'SHUTDOWN_WARNING';
}

export interface TelemetryPoint {
  time: string;
  timestamp: number;
  riskScore: number;
  temperature: number;
  powerKwLegacy: number;
  powerKwPulse: number;
  rpm: number;
  iceThicknessMm: number;
}

export interface SystemEventLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'ACTION' | 'AI_CONTROL';
  message: string;
  source: string;
}
