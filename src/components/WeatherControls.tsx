/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WeatherInput } from '../utils/icingModel';
import { Thermometer, Droplets, CloudRain, Wind, RotateCcw } from 'lucide-react';

interface WeatherControlsProps {
  weather: WeatherInput;
  onChange: (updated: WeatherInput) => void;
  onReset: () => void;
}

export const WeatherControls: React.FC<WeatherControlsProps> = ({
  weather,
  onChange,
  onReset,
}) => {
  const updateField = (field: keyof WeatherInput, value: number) => {
    onChange({
      ...weather,
      [field]: value,
    });
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            기상 조건 조작 패널
          </h2>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition"
          title="기상 수치 초기화"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>초기화</span>
        </button>
      </div>

      {/* Sliders Grid in Clean White Styling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* 1. Temperature Slider (-20°C to 5°C) */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Thermometer className="w-4 h-4 text-sky-600" />
              <span>대기 기온 (T)</span>
            </div>
            <div className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
              weather.temperature < 0
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}>
              {weather.temperature > 0 ? `+${weather.temperature.toFixed(1)}` : weather.temperature.toFixed(1)}°C
            </div>
          </div>

          <input
            type="range"
            min={-20}
            max={5}
            step={0.5}
            value={weather.temperature}
            onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>-20°C (혹한)</span>
            <span className="text-blue-600 font-bold">0°C (빙점)</span>
            <span>+5°C (영상)</span>
          </div>
        </div>

        {/* 2. Liquid Water Content (LWC: 0 to 1.0 g/m³) */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <CloudRain className="w-4 h-4 text-indigo-600" />
              <span>수적량 (LWC)</span>
            </div>
            <div className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
              weather.lwc > 0.4
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-slate-200 text-slate-700'
            }`}>
              {weather.lwc.toFixed(2)} g/m³
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={1.0}
            step={0.02}
            value={weather.lwc}
            onChange={(e) => updateField('lwc', parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0.00 (맑음)</span>
            <span>0.40</span>
            <span className="text-purple-600 font-bold">1.00 g/m³ (고밀도)</span>
          </div>
        </div>

        {/* 3. Relative Humidity (40% to 100%) */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Droplets className="w-4 h-4 text-cyan-600" />
              <span>상대습도 (RH)</span>
            </div>
            <div className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-200">
              {weather.humidity}%
            </div>
          </div>

          <input
            type="range"
            min={40}
            max={100}
            step={1}
            value={weather.humidity}
            onChange={(e) => updateField('humidity', parseInt(e.target.value, 10))}
            className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>40%</span>
            <span>70%</span>
            <span className="text-cyan-700 font-bold">100% (포화)</span>
          </div>
        </div>

        {/* 4. Wind Speed (3 to 25 m/s) */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Wind className="w-4 h-4 text-emerald-600" />
              <span>바람 속도 (V)</span>
            </div>
            <div className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              {(weather.windSpeed ?? 11.5).toFixed(1)} m/s
            </div>
          </div>

          <input
            type="range"
            min={3}
            max={25}
            step={0.5}
            value={weather.windSpeed ?? 11.5}
            onChange={(e) => updateField('windSpeed', parseFloat(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>3 m/s</span>
            <span>11.5 m/s (정격)</span>
            <span>25 m/s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
