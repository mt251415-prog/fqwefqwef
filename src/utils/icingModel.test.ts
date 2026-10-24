/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateIcingPhysics, SCENARIO_PRESETS } from './icingModel';

test('1단계 평상시 모니터링: 기온 3°C, 습도 55%, LWC 0.05 -> 안전 및 대기 상태', () => {
  const preset1 = SCENARIO_PRESETS[0];
  const evalResult = calculateIcingPhysics(preset1.weather, preset1.autoPulse);

  assert.equal(evalResult.riskLevel, 'SAFE');
  assert.equal(evalResult.riskLevelKo, '안전');
  assert.equal(evalResult.isSupercooled, false);
  assert.equal(evalResult.heatingStatus, 'STANDBY');
  assert.equal(evalResult.iceThicknessMm, 0);
  assert.ok(evalResult.riskScore < 35, `Risk score should be < 35, got ${evalResult.riskScore}`);
});

test('2단계 과냉각 위험 감지 및 선제 예열 (2+3단계 통합): Zero-Icing 및 70% 이상 전력 절약', () => {
  const preset2 = SCENARIO_PRESETS[1];
  const evalResult = calculateIcingPhysics(preset2.weather, preset2.autoPulse);

  assert.equal(evalResult.isSupercooled, true);
  assert.equal(evalResult.iceThicknessMm, 0, 'Zero-Icing: ice thickness must be strictly 0 mm');
  assert.equal(evalResult.targetSurfaceTemp, 1.8, 'Leading edge maintained at ~1.8°C');
  assert.equal(evalResult.heatingStatus, 'PULSE_ACTIVE');
  assert.ok(
    evalResult.powerSavingPercent >= 70.0,
    `Power saving percentage must be >= 70%, got ${evalResult.powerSavingPercent}%`
  );
  assert.equal(Math.round(evalResult.powerSavingPercent), 73);
});

test('선제 예열 미가동 시 과냉각 수적 결빙 경보 및 카운트다운 발생 검증', () => {
  const hazardWeather = {
    temperature: -6.0,
    humidity: 92,
    lwc: 0.65,
    windSpeed: 13.0,
  };
  const evalResult = calculateIcingPhysics(hazardWeather, false);
  assert.equal(evalResult.isSupercooled, true);
  assert.ok(evalResult.riskScore >= 70);
  assert.ok(evalResult.estimatedTimeToIcingSec > 0 && evalResult.estimatedTimeToIcingSec < 1000);
});

test('극저온 극한 기상 (-20°C)에서도 일관된 물리적 범위 유지', () => {
  const extremeWeather = {
    temperature: -20,
    humidity: 100,
    lwc: 1.0,
    windSpeed: 25,
  };
  const evalResult = calculateIcingPhysics(extremeWeather, true);
  assert.ok(evalResult.riskScore <= 100);
  assert.ok(evalResult.powerSavingPercent >= 70.0);
  assert.equal(evalResult.iceThicknessMm, 0);
});
