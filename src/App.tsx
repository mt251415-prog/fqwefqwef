/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  WeatherInput,
  IcingEvaluation,
  calculateIcingPhysics,
  SCENARIO_PRESETS,
} from './utils/icingModel';
import { Header } from './components/Header';
import { WindTurbineCanvas } from './components/WindTurbineCanvas';
import { WeatherControls } from './components/WeatherControls';
import { SafetyDashboard } from './components/SafetyDashboard';
import { CheckCircle2, Zap } from 'lucide-react';

export default function App() {
  // Weather state (Default: Step 1 Normal)
  const [weather, setWeather] = useState<WeatherInput>({
    temperature: 3.0,
    humidity: 55,
    lwc: 0.05,
    windSpeed: 11.5,
  });

  // Pulse heating manual toggle
  const [pulseHeatingActive, setPulseHeatingActive] = useState<boolean>(false);

  // Auto-defense toggle
  const [autoDefenseEnabled, setAutoDefenseEnabled] = useState<boolean>(true);

  // Active Preset Step (1, 2, 3 or null if custom-modified)
  const [activePresetStep, setActivePresetStep] = useState<number | null>(1);

  // Calculate thermodynamic evaluation
  const evaluation: IcingEvaluation = useMemo(() => {
    return calculateIcingPhysics(weather, pulseHeatingActive);
  }, [weather, pulseHeatingActive]);

  // Auto-Defense Logic
  useEffect(() => {
    if (autoDefenseEnabled) {
      if (evaluation.riskScore >= 65 && !pulseHeatingActive) {
        setPulseHeatingActive(true);
      }
    }
  }, [autoDefenseEnabled, evaluation.riskScore, pulseHeatingActive]);

  // Single unified scenario selector handler (2-Step Unified Flow)
  const handleSelectPreset = useCallback((stepNumber: number) => {
    const preset = SCENARIO_PRESETS.find((p) => p.step === stepNumber);
    if (!preset) return;

    setActivePresetStep(stepNumber);
    setWeather({ ...preset.weather });

    if (stepNumber === 1) {
      setPulseHeatingActive(false);
      setAutoDefenseEnabled(true);
    } else if (stepNumber === 2) {
      // Combined Step 2: Supercooling detected + Immediate pinpoint pulse preheating
      setPulseHeatingActive(true);
      setAutoDefenseEnabled(true);
    }
  }, []);

  // Handle manual weather slider modifications
  const handleWeatherChange = useCallback((updated: WeatherInput) => {
    setWeather(updated);
    setActivePresetStep(null);
  }, []);

  // Reset weather to normal
  const handleReset = useCallback(() => {
    handleSelectPreset(1);
  }, [handleSelectPreset]);

  const togglePulseHeating = useCallback(() => {
    setPulseHeatingActive((prev) => !prev);
  }, []);

  const toggleAutoDefense = useCallback(() => {
    setAutoDefenseEnabled((prev) => !prev);
  }, []);

  // One-line summary banner logic according to user specification
  const renderSummaryBanner = () => {
    if (pulseHeatingActive && evaluation.riskScore >= 35) {
      // 위험시 예열 가동 배너: 🟠 [AI 관제] 8분 뒤 얼음이 맺힐 것으로 예상되어, 날개에 AI 미세 예열을 가동합니다. (전기 73% 절약 중)
      return (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-5 py-3 shadow-sm flex items-center gap-3">
          <span className="text-xl">🟠</span>
          <span className="text-sm font-bold tracking-tight">
            [AI 관제] 8분 뒤 얼음이 맺힐 것으로 예상되어, 날개에 AI 미세 예열을 가동합니다. (전기 73% 절약 중)
          </span>
        </div>
      );
    }

    if (!pulseHeatingActive && evaluation.riskScore >= 65) {
      // 위험 포착 시 (히터 미가동):
      return (
        <div className="bg-red-50 border border-red-300 text-red-900 rounded-xl px-5 py-3 shadow-sm flex items-center gap-3 animate-pulse">
          <span className="text-xl">🔴</span>
          <span className="text-sm font-bold tracking-tight">
            [AI 관제] 영하 및 과냉각 수적으로 인해 8분 뒤 얼음이 맺힐 위험이 있습니다. (날개 예열 필요)
          </span>
        </div>
      );
    }

    // 평상시 배너: 🟢 [AI 관제] 날씨가 따뜻하여 히터를 켜지 않고 에너지를 아끼는 중입니다.
    return (
      <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl px-5 py-3 shadow-sm flex items-center gap-3">
        <span className="text-xl">🟢</span>
        <span className="text-sm font-bold tracking-tight">
          [AI 관제] 날씨가 따뜻하여 히터를 켜지 않고 에너지를 아끼는 중입니다.
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <Header pulseHeatingActive={pulseHeatingActive} />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* ① Unified 2-Step Scenario Switcher (Clean White Cards) */}
        <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              시연 단계 선택
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            {/* 1단계 Button */}
            <button
              onClick={() => handleSelectPreset(1)}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                activePresetStep === 1
                  ? 'border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-bold shrink-0 ${
                  activePresetStep === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  1
                </span>
                <div>
                  <div className={`text-sm font-bold ${activePresetStep === 1 ? 'text-emerald-800' : 'text-slate-800'}`}>
                    1단계: 평상시 모니터링
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    기온 +3°C · 결빙 없음 (히터 대기)
                  </div>
                </div>
              </div>
              {activePresetStep === 1 && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
            </button>

            {/* 2단계 Button (과냉각 감지 및 선제 예열 통합) */}
            <button
              onClick={() => handleSelectPreset(2)}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                activePresetStep === 2
                  ? 'border-amber-500 bg-amber-50 shadow-sm ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-bold shrink-0 ${
                  activePresetStep === 2 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  2
                </span>
                <div>
                  <div className={`text-sm font-bold ${activePresetStep === 2 ? 'text-amber-800' : 'text-slate-800'}`}>
                    2단계: 과냉각 위험 감지 및 선제 예열
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    영하 -6°C · Zero-Icing (전기 73% 절약)
                  </div>
                </div>
              </div>
              {activePresetStep === 2 && (
                <Zap className="w-5 h-5 text-amber-600 shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* 2D/3D Wind Turbine Simulation + Weather Sliders Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Visual Simulation Screen */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                풍력 발전기 실시간 시뮬레이션
              </span>
              <span className="font-mono text-slate-500 hidden sm:inline">
                3.5MW · 115m 로터
              </span>
            </div>

            <WindTurbineCanvas
              weather={weather}
              evaluation={evaluation}
              pulseHeatingActive={pulseHeatingActive}
              onTogglePulse={togglePulseHeating}
            />
          </div>

          {/* Real-time Weather Input Controls */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-start">
            <WeatherControls
              weather={weather}
              onChange={handleWeatherChange}
              onReset={handleReset}
            />
          </div>
        </div>

        {/* ③ 한 줄 요약 띠(Banner) - 대시보드 바로 위 배치 */}
        {renderSummaryBanner()}

        {/* ② AI 착빙 예측 및 방빙 관제 대시보드 (4개 카드) */}
        <SafetyDashboard
          weather={weather}
          evaluation={evaluation}
          pulseHeatingActive={pulseHeatingActive}
          onTogglePulse={togglePulseHeating}
          autoDefenseEnabled={autoDefenseEnabled}
          onToggleAutoDefense={toggleAutoDefense}
        />
      </main>

      {/* Clean Minimal White Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span>풍력 발전기 과냉각 수적 예측 및 결빙 방지 AI 관제 시스템</span>
          <span className="font-mono text-[11px] text-slate-400">
            Zero-Icing &amp; 73% 전력 절약
          </span>
        </div>
      </footer>
    </div>
  );
}
