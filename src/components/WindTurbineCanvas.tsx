/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { IcingEvaluation, WeatherInput } from '../utils/icingModel';
import { Play, Pause, Eye, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface WindTurbineCanvasProps {
  weather: WeatherInput;
  evaluation: IcingEvaluation;
  pulseHeatingActive: boolean;
  onTogglePulse: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  isSupercooled: boolean;
}

export const WindTurbineCanvas: React.FC<WindTurbineCanvasProps> = ({
  weather,
  evaluation,
  pulseHeatingActive,
  onTogglePulse,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'overview' | 'rotor' | 'nacelle'>('overview');
  const [showAirflowVectors, setShowAirflowVectors] = useState<boolean>(true);

  // Animation state refs (to avoid React re-render lag)
  const animRef = useRef<{
    angle: number;
    rpm: number;
    pulsePhase: number;
    particles: Particle[];
    vibrationOffset: { x: number; y: number };
    lastTime: number;
  }>({
    angle: 0,
    rpm: 15.2,
    pulsePhase: 0,
    particles: [],
    vibrationOffset: { x: 0, y: 0 },
    lastTime: performance.now(),
  });

  // Keep state refs updated for requestAnimationFrame loop
  const stateRef = useRef({
    weather,
    evaluation,
    pulseHeatingActive,
    isPlaying,
    viewMode,
    showAirflowVectors,
  });

  useEffect(() => {
    stateRef.current = {
      weather,
      evaluation,
      pulseHeatingActive,
      isPlaying,
      viewMode,
      showAirflowVectors,
    };
  }, [weather, evaluation, pulseHeatingActive, isPlaying, viewMode, showAirflowVectors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Initialize particles
    const initParticles = (width: number, height: number) => {
      const particles: Particle[] = [];
      const count = Math.min(180, Math.max(50, Math.round(weather.lwc * 200) + 40));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 3 + Math.random() * (weather.windSpeed ?? 11.5) * 0.45,
          vy: (Math.random() - 0.5) * 1.2,
          size: 1.2 + Math.random() * (weather.lwc > 0.3 ? 2.5 : 1.5),
          alpha: 0.3 + Math.random() * 0.6,
          isSupercooled: weather.temperature < 0 && weather.lwc > 0.1,
        });
      }
      return particles;
    };

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      if (animRef.current.particles.length === 0) {
        animRef.current.particles = initParticles(rect.width, rect.height);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Main render loop
    const render = (currentTime: number) => {
      const dt = Math.min(0.1, (currentTime - animRef.current.lastTime) / 1000);
      animRef.current.lastTime = currentTime;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { weather: curWeather, evaluation: curEval, pulseHeatingActive: isPulse, isPlaying: run, viewMode: curView, showAirflowVectors: showVectors } = stateRef.current;

      // 1. Calculate RPM based on weather and ice thickness
      let targetRpm = 15.2;
      if (curWeather.windSpeed) {
        targetRpm = Math.min(17.5, Math.max(5.0, 7.0 + curWeather.windSpeed * 0.7));
      }
      // If ice accumulates without pulse heating, drag increases and RPM plummets
      if (!isPulse && curEval.iceThicknessMm > 0) {
        const penalty = Math.min(0.85, curEval.iceThicknessMm * 0.08);
        targetRpm *= (1 - penalty);
      }

      if (run) {
        // Smoothly approach target RPM
        animRef.current.rpm += (targetRpm - animRef.current.rpm) * 0.05;
        // Rotation step in radians
        const revPerSec = animRef.current.rpm / 60;
        animRef.current.angle += revPerSec * 2 * Math.PI * dt;
        animRef.current.pulsePhase = (animRef.current.pulsePhase + dt * 4.0) % (Math.PI * 2);

        // Vibration offset when iced
        if (!isPulse && curEval.iceThicknessMm > 2.0) {
          const intensity = Math.min(4.5, (curEval.iceThicknessMm - 2.0) * 0.6);
          animRef.current.vibrationOffset = {
            x: (Math.random() - 0.5) * intensity,
            y: (Math.random() - 0.5) * intensity,
          };
        } else {
          animRef.current.vibrationOffset = { x: 0, y: 0 };
        }
      }

      // Draw Sky & Environment Backdrop (Crisp Daylight Winter Sky)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (curWeather.temperature < -5) {
        // Frigid overcast winter daylight
        skyGrad.addColorStop(0, '#94a3b8');
        skyGrad.addColorStop(0.5, '#cbd5e1');
        skyGrad.addColorStop(1, '#e2e8f0');
      } else if (curWeather.temperature < 0) {
        // Cold crisp blue winter sky
        skyGrad.addColorStop(0, '#7dd3fc');
        skyGrad.addColorStop(0.4, '#bae6fd');
        skyGrad.addColorStop(1, '#f1f5f9');
      } else {
        // Clear bright daylight
        skyGrad.addColorStop(0, '#38bdf8');
        skyGrad.addColorStop(0.5, '#bae6fd');
        skyGrad.addColorStop(1, '#f8fafc');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Distance snowy mountains
      ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.78);
      ctx.lineTo(width * 0.2, height * 0.62);
      ctx.lineTo(width * 0.45, height * 0.74);
      ctx.lineTo(width * 0.75, height * 0.58);
      ctx.lineTo(width, height * 0.72);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();

      // Snowy peak ridge highlights
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ground snow terrain
      const groundGrad = ctx.createLinearGradient(0, height * 0.75, 0, height);
      groundGrad.addColorStop(0, '#f1f5f9');
      groundGrad.addColorStop(0.3, '#e2e8f0');
      groundGrad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = groundGrad;
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.88, width * 0.65, height * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Distant secondary wind turbines in background
      const drawBackgroundTurbine = (bx: number, by: number, bScale: number, bAngle: number) => {
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(bScale, bScale);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
        ctx.lineWidth = 1.5;

        // Tower
        ctx.beginPath();
        ctx.moveTo(-2, 50);
        ctx.lineTo(-1, 0);
        ctx.lineTo(1, 0);
        ctx.lineTo(2, 50);
        ctx.closePath();
        ctx.fill();

        // Hub
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Blades
        for (let b = 0; b < 3; b++) {
          const a = bAngle + (b * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.sin(a) * 28, -Math.cos(a) * 28);
          ctx.stroke();
        }
        ctx.restore();
      };

      drawBackgroundTurbine(width * 0.18, height * 0.65, 0.55, animRef.current.angle * 0.9);
      drawBackgroundTurbine(width * 0.82, height * 0.63, 0.65, animRef.current.angle * 1.05);

      // Camera view positioning
      let originX = width * 0.52 + animRef.current.vibrationOffset.x;
      let originY = height * 0.44 + animRef.current.vibrationOffset.y;
      let turbineScale = Math.min(width, height) / 520;

      if (curView === 'rotor') {
        turbineScale *= 1.35;
        originY = height * 0.48;
      } else if (curView === 'nacelle') {
        turbineScale *= 2.2;
        originY = height * 0.58;
      }

      // Draw Main Wind Turbine Tower
      ctx.save();
      ctx.translate(originX, originY);
      ctx.scale(turbineScale, turbineScale);

      // Tower gradient
      const towerGrad = ctx.createLinearGradient(-14, 0, 14, 280);
      towerGrad.addColorStop(0, '#f8fafc');
      towerGrad.addColorStop(0.35, '#cbd5e1');
      towerGrad.addColorStop(0.7, '#64748b');
      towerGrad.addColorStop(1, '#334155');

      ctx.fillStyle = towerGrad;
      ctx.beginPath();
      ctx.moveTo(-9, 12);
      ctx.lineTo(-18, 250);
      ctx.lineTo(18, 250);
      ctx.lineTo(9, 12);
      ctx.closePath();
      ctx.fill();

      // Tower maintenance hatch & platforms lines
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-11, 70);
      ctx.lineTo(11, 70);
      ctx.moveTo(-13, 140);
      ctx.lineTo(13, 140);
      ctx.moveTo(-15, 200);
      ctx.lineTo(15, 200);
      ctx.stroke();

      // Nacelle (Engine housing)
      const nacelleGrad = ctx.createLinearGradient(-40, -18, 45, 15);
      nacelleGrad.addColorStop(0, '#f1f5f9');
      nacelleGrad.addColorStop(0.5, '#cbd5e1');
      nacelleGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = nacelleGrad;

      ctx.beginPath();
      ctx.roundRect(-36, -14, 68, 26, [8, 14, 6, 6]);
      ctx.fill();

      // Nacelle details / cooling vents
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-32, -8, 12, 14);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(-32, -8, 12, 14);

      // Anemometer & aviation warning light atop nacelle
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-24, -18, 2.8, 0, Math.PI * 2);
      ctx.fill();
      if (Math.sin(currentTime * 0.005) > 0) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.beginPath();
        ctx.arc(-24, -18, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rotor Hub (Nose Cone Spinner)
      const hubGrad = ctx.createRadialGradient(18, 0, 2, 18, 0, 16);
      hubGrad.addColorStop(0, '#ffffff');
      hubGrad.addColorStop(0.7, '#94a3b8');
      hubGrad.addColorStop(1, '#475569');
      ctx.fillStyle = hubGrad;

      ctx.beginPath();
      ctx.ellipse(14, 0, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Rotor Blades
      const bladeLength = 175;
      const bladeRootW = 12;
      const bladeTipW = 2.4;

      for (let i = 0; i < 3; i++) {
        const bladeAngle = animRef.current.angle + (i * Math.PI * 2) / 3;

        ctx.save();
        ctx.translate(14, 0);
        ctx.rotate(bladeAngle);

        // Blade base body (Aerodynamic NACA airfoil shape projected)
        const bladeGrad = ctx.createLinearGradient(0, -6, 0, -bladeLength);
        bladeGrad.addColorStop(0, '#e2e8f0');
        bladeGrad.addColorStop(0.3, '#f8fafc');
        bladeGrad.addColorStop(0.85, '#e2e8f0');
        bladeGrad.addColorStop(1, '#cbd5e1');

        ctx.fillStyle = bladeGrad;
        ctx.beginPath();
        ctx.moveTo(3, -10);
        // Trailing edge curved back
        ctx.bezierCurveTo(8, -40, 7, -100, bladeTipW + 1, -bladeLength);
        // Tip cap
        ctx.lineTo(-bladeTipW, -bladeLength);
        // Leading edge (전연부: 과냉각 수적이 정면 충돌하는 핵심 구역)
        ctx.bezierCurveTo(-bladeRootW * 0.45, -100, -bladeRootW * 0.5, -40, -4, -10);
        ctx.closePath();
        ctx.fill();

        // High visibility red/orange tip markings (Aviation standard)
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(bladeTipW + 0.8, -bladeLength + 24);
        ctx.lineTo(bladeTipW + 1, -bladeLength);
        ctx.lineTo(-bladeTipW, -bladeLength);
        ctx.lineTo(-bladeTipW * 0.8, -bladeLength + 24);
        ctx.closePath();
        ctx.fill();

        // --- Pinpoint Leading Edge Heating Zone OR Ice Accumulation ---
        if (isPulse && curEval.riskScore >= 35) {
          // ACTIVE PINPOINT PULSE HEATING (Zero-Icing Mode)
          // Glow intensity modulates with pulse phase
          const pulseIntensity = 0.7 + 0.3 * Math.sin(animRef.current.pulsePhase + i);
          ctx.strokeStyle = `rgba(249, 115, 22, ${pulseIntensity * 0.95})`; // Amber-orange glow
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 10;

          // Trace along the leading edge strip (0 ~ 12% chord)
          ctx.beginPath();
          ctx.moveTo(-3, -12);
          ctx.bezierCurveTo(-bladeRootW * 0.48, -40, -bladeRootW * 0.42, -100, -bladeTipW - 0.5, -bladeLength + 15);
          ctx.stroke();

          // Embedded micro-pulse heater matrix lines
          ctx.strokeStyle = `rgba(254, 215, 170, ${pulseIntensity * 0.9})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-2, -14);
          ctx.bezierCurveTo(-bladeRootW * 0.4, -40, -bladeRootW * 0.35, -100, -bladeTipW, -bladeLength + 15);
          ctx.stroke();

          // Water film / runback droplets vaporizing off
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(186, 230, 253, 0.75)';
          const vaporCount = 4;
          for (let v = 0; v < vaporCount; v++) {
            const vPos = -25 - v * 32;
            ctx.beginPath();
            ctx.arc(-bladeRootW * 0.35 - Math.sin(currentTime * 0.01 + v) * 2, vPos, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (!isPulse && curEval.iceThicknessMm > 0.5) {
          // ICING ACCRETION (Ice build-up on leading edge)
          const iceWidth = Math.min(6.5, 1.5 + curEval.iceThicknessMm * 0.35);
          ctx.fillStyle = 'rgba(224, 242, 254, 0.92)';
          ctx.strokeStyle = 'rgba(147, 197, 253, 0.95)';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#93c5fd';
          ctx.shadowBlur = 6;

          ctx.beginPath();
          ctx.moveTo(-2, -12);
          // Jagged frozen rime surface
          for (let y = -14; y >= -bladeLength + 20; y -= 14) {
            const jag = Math.sin(y * 0.3 + i * 2) * (iceWidth * 0.4);
            ctx.lineTo(-bladeRootW * 0.45 - iceWidth + jag, y);
          }
          ctx.lineTo(-bladeTipW - iceWidth, -bladeLength + 15);
          ctx.lineTo(-bladeTipW, -bladeLength + 15);
          ctx.bezierCurveTo(-bladeRootW * 0.4, -100, -bladeRootW * 0.45, -40, -3, -12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      }

      ctx.restore(); // Restore turbine transform

      // 4. Supercooled Droplets & Wind Particle System
      if (animRef.current.particles.length > 0) {
        ctx.save();
        const particles = animRef.current.particles;
        for (let p = 0; p < particles.length; p++) {
          const pt = particles[p];
          if (run) {
            pt.x += pt.vx;
            pt.y += pt.vy;
            if (pt.x > width + 20) {
              pt.x = -20;
              pt.y = Math.random() * height;
            }
            if (pt.y < 0) pt.y = height;
            if (pt.y > height) pt.y = 0;
          }

          // Render particle
          if (curWeather.temperature < 0 && curWeather.lwc > 0.08) {
            // Cold supercooled liquid droplets (SLD): cyan-white glowing
            // Cold supercooled liquid droplets (SLD): high contrast cyan-blue with frosty core
            ctx.fillStyle = '#0284c7';
            ctx.shadowColor = '#0ea5e9';
            ctx.shadowBlur = 3;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size * 1.3, 0, Math.PI * 2);
            ctx.fill();

            // Inner bright droplet highlight
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pt.x - pt.size * 0.3, pt.y - pt.size * 0.3, pt.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            // Normal airflow moisture streaks
            ctx.fillStyle = 'rgba(71, 85, 105, 0.5)';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // 5. Airflow Streamlines (Prominent, High-Contrast Wind Tunnel Streamlines)
      if (showVectors) {
        ctx.save();
        const streamCount = 8;
        const windSpd = curWeather.windSpeed ?? 11.5;
        const speedScale = 0.08 * windSpd;

        for (let s = 1; s <= streamCount; s++) {
          const sy = (height / (streamCount + 1)) * s;
          
          // Streamline color: crisp visible blue with gradient
          const streamGrad = ctx.createLinearGradient(0, sy, width, sy);
          streamGrad.addColorStop(0, 'rgba(2, 132, 199, 0.15)');
          streamGrad.addColorStop(0.3, 'rgba(2, 132, 199, 0.85)');
          streamGrad.addColorStop(0.7, 'rgba(14, 165, 233, 0.9)');
          streamGrad.addColorStop(1, 'rgba(2, 132, 199, 0.25)');

          ctx.strokeStyle = streamGrad;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([20, 14]);
          ctx.lineDashOffset = -(currentTime * speedScale) % 34;

          // Aerodynamic deflection around rotor plane (originX, originY)
          const distToRotorY = sy - originY;
          const deflection = Math.sin((sy / height) * Math.PI) * (distToRotorY > 0 ? 18 : -18);

          ctx.beginPath();
          ctx.moveTo(0, sy);
          ctx.bezierCurveTo(
            originX - 160, sy,
            originX - 40, sy + deflection * 0.5,
            originX + 80, sy + deflection
          );
          ctx.bezierCurveTo(
            originX + 180, sy + deflection * 1.2,
            width * 0.85, sy + deflection * 0.7,
            width, sy + deflection * 0.4
          );
          ctx.stroke();

          // Flow Direction Chevrons (Arrows along the streamlines)
          ctx.setLineDash([]);
          const chevronSpacing = 220;
          const animOffset = (currentTime * speedScale * 1.5) % chevronSpacing;
          for (let x = animOffset; x < width; x += chevronSpacing) {
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.moveTo(x, sy - 4);
            ctx.lineTo(x + 8, sy);
            ctx.lineTo(x, sy + 4);
            ctx.lineTo(x + 2, sy);
            ctx.closePath();
            ctx.fill();
          }
        }
        ctx.restore();
      }

      ctx.restore(); // Restore dpr canvas context

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[460px] lg:min-h-[520px] rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm flex flex-col">
      {/* Canvas view */}
      <canvas
        ref={canvasRef}
        className="w-full h-full flex-1 block cursor-grab active:cursor-grabbing"
      />

      {/* Top Floating HUD Overlay */}
      <div className="absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left Telemetry Pills */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-white/95 px-3.5 py-1.5 rounded-full flex items-center gap-2 border border-slate-200 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                pulseHeatingActive ? 'bg-amber-400' : evaluation.riskScore >= 70 ? 'bg-red-400' : 'bg-emerald-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                pulseHeatingActive ? 'bg-amber-500' : evaluation.riskScore >= 70 ? 'bg-red-500' : 'bg-emerald-500'
              }`}></span>
            </span>
            <span className="text-xs font-bold text-slate-800">
              {pulseHeatingActive
                ? 'AI 날개 예열 가동 중 (1.8°C)'
                : evaluation.riskScore >= 70
                ? '과냉각 결빙 위험 (방빙 미가동)'
                : '풍력 터빈 정상 회전 중'}
            </span>
          </div>

          <div className="bg-white/95 hidden sm:flex px-3 py-1.5 rounded-full items-center gap-2 border border-slate-200 shadow-sm font-mono text-xs text-slate-700">
            <span className="text-slate-500 font-sans">회전속도:</span>
            <span className="text-blue-600 font-bold">{animRef.current.rpm.toFixed(1)} RPM</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-sans">발전량:</span>
            <span className="text-emerald-600 font-bold">
              {(!pulseHeatingActive && evaluation.iceThicknessMm > 0)
                ? (3.5 * Math.max(0.2, 1 - evaluation.iceThicknessMm * 0.12)).toFixed(2)
                : '3.50'} MW
            </span>
          </div>
        </div>

        {/* Right Action HUD */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onTogglePulse}
            className={`px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-all shadow-sm active:scale-95 border ${
              pulseHeatingActive
                ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${pulseHeatingActive ? 'text-white fill-white' : 'text-slate-500'}`} />
            <span>{pulseHeatingActive ? '예열 가동 중' : '예열 꺼짐'}</span>
          </button>
        </div>
      </div>

      {/* Floating Status Warning Banner when iced */}
      {!pulseHeatingActive && evaluation.riskScore >= 70 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-lg animate-bounce">
          <AlertTriangle className="w-4 h-4 text-white" />
          <div className="text-xs font-medium">
            <span className="font-bold">과냉각 수적 결빙 발생:</span> 발전기 회전 속도 저하
          </div>
          <button
            onClick={onTogglePulse}
            className="ml-2 bg-white text-red-600 font-bold px-2.5 py-1 rounded-lg text-xs shadow-sm"
          >
            예열 즉시 켜기
          </button>
        </div>
      )}

      {/* Success Banner when Zero-Icing with pulse active */}
      {pulseHeatingActive && evaluation.riskScore >= 65 && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2.5 shadow-lg">
          <ShieldCheck className="w-4 h-4 text-white" />
          <div className="text-xs font-medium">
            <span className="font-bold">Zero-Icing 방빙 가동:</span> 얼음 결빙 없이 정상 회전 유지 중
          </div>
        </div>
      )}

      {/* Bottom Floating Controls Bar */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Play/Pause & Streamlines */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-white/95 hover:bg-slate-100 text-slate-700 p-2 rounded-xl border border-slate-200 shadow-sm transition active:scale-95"
            title={isPlaying ? '시뮬레이션 일시 정지' : '시뮬레이션 재생'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-blue-600" />}
          </button>

          <button
            onClick={() => setShowAirflowVectors(!showAirflowVectors)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition flex items-center gap-1.5 shadow-sm ${
              showAirflowVectors
                ? 'border-blue-300 text-blue-700 bg-blue-50'
                : 'border-slate-200 text-slate-600 bg-white/95 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>바람 흐름선</span>
          </button>
        </div>

        {/* Camera Views */}
        <div className="bg-white/95 px-1.5 py-1 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1 pointer-events-auto">
          {(['overview', 'rotor', 'nacelle'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                viewMode === mode
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode === 'overview' ? '전체 전경' : mode === 'rotor' ? '날개 확대' : '엔진 확대'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
