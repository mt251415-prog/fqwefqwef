/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { IcingEvaluation, WeatherInput } from '../utils/icingModel';
import { Flame } from 'lucide-react';

interface SafetyDashboardProps {
  weather: WeatherInput;
  evaluation: IcingEvaluation;
  pulseHeatingActive: boolean;
  onTogglePulse: () => void;
  autoDefenseEnabled: boolean;
  onToggleAutoDefense: () => void;
}

export const SafetyDashboard: React.FC<SafetyDashboardProps> = ({
  weather,
  evaluation,
  pulseHeatingActive,
  onTogglePulse,
  autoDefenseEnabled,
  onToggleAutoDefense,
}) => {
  const [countdownSeconds, setCountdownSeconds] = useState<number>(evaluation.estimatedTimeToIcingSec);

  useEffect(() => {
    setCountdownSeconds(evaluation.estimatedTimeToIcingSec);
  }, [evaluation.estimatedTimeToIcingSec]);

  useEffect(() => {
    if (!isFinite(countdownSeconds) || countdownSeconds <= 0 || pulseHeatingActive) return;
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdownSeconds, pulseHeatingActive]);

  // Round savings percentage to integer (e.g. 73%)
  const powerSavingInteger = Math.round(evaluation.powerSavingPercent);

  // Time format: "약 8분 전" (골든타임) or "안전함"
  const getTimeRemainingText = () => {
    if (pulseHeatingActive) {
      return '안전함';
    }
    if (evaluation.riskScore >= 65) {
      const minutes = Math.max(1, Math.round(countdownSeconds / 60));
      return `약 ${minutes}분 전`;
    }
    if (evaluation.riskScore >= 35) {
      const minutes = Math.max(1, Math.round(countdownSeconds / 60));
      return `약 ${minutes}분 전`;
    }
    return '안전함';
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
      {/* 4 Cards Grid - Clean, light white theme, big numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 카드 1: 얼음 맺힘 위험도 */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <span className="text-sm font-bold text-slate-500">얼음 맺힘 위험도</span>
          <div className="my-3">
            <div className={`text-4xl sm:text-5xl font-black tracking-tight ${
              evaluation.riskScore >= 70 ? 'text-red-600' :
              evaluation.riskScore >= 35 ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {evaluation.riskScore}%
            </div>
          </div>
          <div>
            {evaluation.riskScore >= 65 ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg">
                [경고] 8분 뒤 결빙 예상
              </span>
            ) : evaluation.riskScore >= 35 ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg">
                [주의] 착빙 가능성 증가
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">
                [안전] 결빙 위험 없음
              </span>
            )}
          </div>
        </div>

        {/* 카드 2: 얼기까지 남은 시간 */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <span className="text-sm font-bold text-slate-500">얼기까지 남은 시간</span>
          <div className="my-3">
            <div className={`text-3xl sm:text-4xl font-black tracking-tight ${
              pulseHeatingActive
                ? 'text-emerald-600'
                : evaluation.riskScore >= 70
                ? 'text-red-600 animate-pulse'
                : evaluation.riskScore >= 35
                ? 'text-amber-600'
                : 'text-slate-800'
            }`}>
              {getTimeRemainingText()}
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">
              {pulseHeatingActive
                ? 'AI 예열로 얼음 0.0mm 유지'
                : evaluation.riskScore >= 65
                ? '사전 작동을 위한 골든타임'
                : '현재 안정적으로 회전 중'}
            </span>
          </div>
        </div>

        {/* 카드 3: 날개 히터 상태 */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500">날개 히터 상태</span>
            <span className="text-xs font-semibold text-slate-600">
              날개 온도 {evaluation.targetSurfaceTemp > 0 ? `+${evaluation.targetSurfaceTemp.toFixed(1)}` : evaluation.targetSurfaceTemp.toFixed(1)}°C
            </span>
          </div>
          <div className="my-3">
            <div className={`text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-2 ${
              pulseHeatingActive ? 'text-amber-600' : 'text-slate-800'
            }`}>
              {pulseHeatingActive ? (
                <>
                  <Flame className="w-8 h-8 text-amber-500 animate-pulse" />
                  <span>AI 예열 중</span>
                </>
              ) : (
                <span>대기 중</span>
              )}
            </div>
          </div>
          <div>
            <button
              onClick={onTogglePulse}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm border ${
                pulseHeatingActive
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <span>{pulseHeatingActive ? '[AI 자동 예열 켜짐]' : '[AI 자동 예열 켜기]'}</span>
            </button>
          </div>
        </div>

        {/* 카드 4: 에너지 절약 효과 */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500">에너지 절약 효과</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
              절약 인증
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-600">
              {powerSavingInteger}% 절약
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-600 font-medium leading-relaxed block">
              기존 방식 대비 전기 사용량 1/4 수준
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
