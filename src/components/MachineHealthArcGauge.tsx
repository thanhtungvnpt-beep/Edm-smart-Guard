import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, HeartPulse } from 'lucide-react';

interface MachineHealthArcGaugeProps {
  score: number; // 0 - 100
  incidentCount: number;
  continuousUptimeHours: number;
  size?: number; // default 96
  showLabel?: boolean;
}

/**
 * High-precision SVG Arc Gauge indicating machine overall reliability & health score
 * based on incident frequency and recent continuous uptime.
 */
export const MachineHealthArcGauge: React.FC<MachineHealthArcGaugeProps> = ({
  score,
  incidentCount,
  continuousUptimeHours,
  size = 80,
  showLabel = true,
}) => {
  // Clamped score
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));

  // Color scheme based on health tier
  let strokeColor = '#10b981'; // emerald-500 (> 80)
  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let tierLabel = 'Rất Tốt';
  let tierGrade = 'A';
  let statusIcon = <ShieldCheck className="h-3 w-3 text-emerald-400" />;

  if (safeScore < 50) {
    strokeColor = '#ef4444'; // red-500 (< 50)
    badgeBg = 'bg-red-500/15 text-red-300 border-red-500/40';
    tierLabel = 'Rủi Ro Cao';
    tierGrade = 'D';
    statusIcon = <ShieldAlert className="h-3 w-3 text-red-400" />;
  } else if (safeScore < 70) {
    strokeColor = '#f59e0b'; // amber-500 (50 - 69)
    badgeBg = 'bg-amber-500/15 text-amber-300 border-amber-500/40';
    tierLabel = 'Cần Lưu Ý';
    tierGrade = 'C';
    statusIcon = <AlertTriangle className="h-3 w-3 text-amber-400" />;
  } else if (safeScore < 85) {
    strokeColor = '#06b6d4'; // cyan-500 (70 - 84)
    badgeBg = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
    tierLabel = 'Ổn Định';
    tierGrade = 'B';
    statusIcon = <ShieldCheck className="h-3 w-3 text-cyan-400" />;
  }

  // 180-degree semi-circle or 220-degree arc parameters
  // Using 220-degree arc for industrial instrument gauge feel
  // SVG coordinates:
  // Center: 50, 50, Radius: 38
  const radius = 34;
  const strokeWidth = 6.5;
  const startAngle = 145; // in degrees
  const endAngle = 395; // total sweep 250 degrees
  const totalSweep = endAngle - startAngle;

  // Polar to Cartesian conversion
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startA: number, endA: number) => {
    const start = polarToCartesian(x, y, r, endA);
    const end = polarToCartesian(x, y, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const backgroundArcD = describeArc(50, 50, radius, startAngle, endAngle);

  // Active arc calculated proportionally from score (0 -> startAngle, 100 -> endAngle)
  const currentAngle = startAngle + (safeScore / 100) * totalSweep;
  const valueArcD =
    safeScore > 0 ? describeArc(50, 50, radius, startAngle, Math.max(startAngle + 1, currentAngle)) : '';

  return (
    <div className="flex items-center gap-3">
      {/* Gauge Arc Graphic */}
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id={`gaugeGradient-${safeScore}`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor={strokeColor} floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={backgroundArcD}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Arc */}
          {safeScore > 0 && (
            <path
              d={valueArcD}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter="url(#gaugeGlow)"
              className="transition-all duration-700 ease-out"
            />
          )}

          {/* Center needle indicator dot at end of arc */}
          {(() => {
            const pt = polarToCartesian(50, 50, radius, currentAngle);
            return (
              <circle
                cx={pt.x}
                cy={pt.y}
                r={3.5}
                fill="#ffffff"
                stroke={strokeColor}
                strokeWidth={2}
                className="transition-all duration-700 ease-out shadow-sm"
              />
            );
          })()}
        </svg>

        {/* Center Score Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2 select-none">
          <span className="font-mono text-base font-black tracking-tight text-white leading-none">
            {safeScore}
            <span className="text-[10px] text-slate-400 font-semibold">%</span>
          </span>
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
            Độ Tin Cậy
          </span>
        </div>
      </div>

      {/* Side Meta Details */}
      {showLabel && (
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${badgeBg}`}>
              {statusIcon}
              <span>{tierLabel} ({tierGrade})</span>
            </span>
          </div>

          <p className="text-[10px] text-slate-400 mt-1 leading-tight">
            <span>Tần suất sự cố: <strong className="text-slate-200 font-mono">{incidentCount} lần</strong></span>
            <span className="mx-1">•</span>
            <span>Uptime: <strong className="text-slate-200 font-mono">{continuousUptimeHours.toFixed(1)}h</strong></span>
          </p>

          <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-400">
            <HeartPulse className="h-3 w-3 text-rose-400 shrink-0" />
            <span className="truncate">
              {safeScore >= 85
                ? 'Máy hoạt động ổn định, rủi ro dừng rất thấp'
                : safeScore >= 70
                ? 'Hệ số độ bền đạt chuẩn chu kỳ làm việc'
                : safeScore >= 50
                ? 'Cần bảo dưỡng phòng ngừa để tránh dừng máy'
                : 'Cảnh báo rủi ro cao! Kiểm tra cụm phóng điện'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
