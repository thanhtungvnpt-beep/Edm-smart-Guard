import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Radio,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface TelemetrySparklineCardProps {
  title: string;
  metricKey: string;
  currentValue: number;
  unit: string;
  history: number[];
  nominalMin: number;
  nominalMax: number;
  thresholdType: 'UPPER' | 'LOWER';
  criticalThreshold: number;
  isLiveStreaming: boolean;
  icon: React.ReactNode;
  lineColor?: string;
}

export const TelemetrySparklineCard: React.FC<TelemetrySparklineCardProps> = ({
  title,
  metricKey,
  currentValue,
  unit,
  history,
  nominalMin,
  nominalMax,
  thresholdType,
  criticalThreshold,
  isLiveStreaming,
  icon,
  lineColor = '#38bdf8',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Proximity & violation calculations
  let isViolated = false;
  let isNearingThreshold = false;
  let proximityPercent = 0; // 0 = safe, 100 = at or exceeding threshold

  if (thresholdType === 'UPPER') {
    isViolated = currentValue >= criticalThreshold;
    const span = Math.max(0.01, criticalThreshold - nominalMin);
    const progress = (currentValue - nominalMin) / span;
    proximityPercent = Math.min(100, Math.max(0, Math.round(progress * 100)));
    isNearingThreshold = !isViolated && proximityPercent >= 80;
  } else {
    isViolated = currentValue <= criticalThreshold;
    const span = Math.max(0.01, nominalMax - criticalThreshold);
    const progress = (nominalMax - currentValue) / span;
    proximityPercent = Math.min(100, Math.max(0, Math.round(progress * 100)));
    isNearingThreshold = !isViolated && proximityPercent >= 80;
  }

  // SVG Geometry
  const width = 280;
  const height = 64;
  const paddingY = 8;
  const usableHeight = height - paddingY * 2;

  // Determine scale range that comfortably contains history + nominal bounds + critical threshold
  const dataMin = Math.min(...history, nominalMin, criticalThreshold);
  const dataMax = Math.max(...history, nominalMax, criticalThreshold);
  const paddingMargin = (dataMax - dataMin) * 0.1 || 0.5;
  const scaleMin = dataMin - paddingMargin;
  const scaleMax = dataMax + paddingMargin;
  const range = scaleMax - scaleMin || 1;

  const points = history.map((val, idx) => {
    const x = (idx / (history.length - 1 || 1)) * width;
    const y = height - paddingY - ((val - scaleMin) / range) * usableHeight;
    return { x, y, val };
  });

  // Calculate threshold Y position on the chart
  const thresholdY = height - paddingY - ((criticalThreshold - scaleMin) / range) * usableHeight;

  // Generate SVG bezier curve path
  const linePath = points.reduce((acc, pt, idx) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    const prev = points[idx - 1];
    const cX1 = prev.x + (pt.x - prev.x) / 2;
    const cY1 = prev.y;
    const cX2 = prev.x + (pt.x - prev.x) / 2;
    const cY2 = pt.y;
    return `${acc} C ${cX1},${cY1} ${cX2},${cY2} ${pt.x},${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;
  const lastPoint = points[points.length - 1] || { x: width, y: height / 2, val: currentValue };

  // Status colors
  const activeColor = isViolated
    ? '#ef4444' // Red
    : isNearingThreshold
    ? '#f97316' // Orange warning
    : lineColor;

  const cardBorder = isViolated
    ? 'border-red-500/80 bg-gradient-to-br from-red-950/30 via-slate-900 to-slate-950 shadow-lg shadow-red-950/40 ring-1 ring-red-500/40'
    : isNearingThreshold
    ? 'border-amber-500/70 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 shadow-md ring-1 ring-amber-500/30'
    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700';

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${cardBorder}`}>
      {/* Real-time fluctuation pulse highlight border when streaming */}
      {isLiveStreaming && (
        <span className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></span>
      )}

      {/* Header: Title, Live indicator & Current Value */}
      <div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            {icon}
            <span>{title}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isLiveStreaming ? (
              <span className="flex items-center gap-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[9px] font-mono font-bold text-cyan-400 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                LIVE
              </span>
            ) : (
              <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[9px] font-mono text-slate-400">
                Tạm Dừng
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-2xl font-black transition-all ${
              isViolated
                ? 'text-red-400 animate-pulse'
                : isNearingThreshold
                ? 'text-amber-400'
                : 'text-white'
            }`}>
              {currentValue.toFixed(currentValue >= 10 ? 1 : 2)}
            </span>
            <span className="font-mono text-xs text-slate-400 font-semibold">{unit}</span>
          </div>

          {/* Visual Alert Threshold Indicator Pill */}
          <div>
            {isViolated ? (
              <span className="rounded-full bg-red-500/20 border border-red-500/50 px-2.5 py-0.5 text-[10px] font-mono font-black text-red-300 animate-pulse flex items-center gap-1">
                <AlertOctagon className="h-3 w-3" />
                VƯỢT NGƯỠNG!
              </span>
            ) : isNearingThreshold ? (
              <span className="rounded-full bg-amber-500/20 border border-amber-500/50 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 animate-pulse flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                GẦN CHẠM NGƯỠNG ({proximityPercent}%)
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                An Toàn
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Performance Sparkline with Alert Threshold Line */}
      <div className="mt-3 relative pt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-14 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={`grad-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={activeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {/* Fill under sparkline */}
          <path d={areaPath} fill={`url(#grad-${metricKey})`} />

          {/* Visual Alert Threshold Line */}
          <line
            x1={0}
            y1={thresholdY}
            x2={width}
            y2={thresholdY}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity={0.85}
          />

          {/* Alert Threshold Label on SVG */}
          <text
            x={width - 4}
            y={Math.max(10, thresholdY - 4)}
            fill="#f87171"
            fontSize="8.5"
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="end"
          >
            Ngưỡng {thresholdType === 'UPPER' ? 'Max' : 'Min'}: {criticalThreshold}{unit}
          </text>

          {/* Sparkline curve */}
          <path
            d={linePath}
            fill="none"
            stroke={activeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hitboxes for interactive data inspection */}
          {points.map((pt, idx) => (
            <g key={idx} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
              <rect
                x={Math.max(0, pt.x - width / (history.length * 2))}
                y={0}
                width={width / history.length}
                height={height}
                fill="transparent"
                className="cursor-pointer"
              />
              {hoveredIdx === idx && (
                <>
                  <line
                    x1={pt.x}
                    y1={0}
                    x2={pt.x}
                    y2={height}
                    stroke={activeColor}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity={0.8}
                  />
                  <circle cx={pt.x} cy={pt.y} r={4} fill="#ffffff" stroke={activeColor} strokeWidth="2.5" />
                </>
              )}
            </g>
          ))}

          {/* Current Live Point Marker */}
          {hoveredIdx === null && (
            <circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={isLiveStreaming ? 4 : 3}
              fill="#ffffff"
              stroke={activeColor}
              strokeWidth="2.5"
              className={isLiveStreaming ? 'animate-pulse' : ''}
            />
          )}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null ? (
          <div className="absolute top-0 right-0 rounded bg-slate-900 border border-slate-700 px-2 py-0.5 text-[10px] font-mono font-bold text-white shadow-lg pointer-events-none">
            Mẫu #{hoveredIdx + 1}: {points[hoveredIdx].val.toFixed(2)}
            {unit}
          </div>
        ) : null}
      </div>

      {/* Footer Info: Nominal Bounds & Critical Margin Warning */}
      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>
          Chuẩn: {nominalMin}-{nominalMax}{unit}
        </span>

        {isViolated ? (
          <span className="text-red-400 font-bold animate-pulse">
            🚨 Vượt ngưỡng {(Math.abs(currentValue - criticalThreshold)).toFixed(2)}{unit}!
          </span>
        ) : isNearingThreshold ? (
          <span className="text-amber-400 font-bold">
            ⚠️ Cách ngưỡng {(Math.abs(criticalThreshold - currentValue)).toFixed(2)}{unit}
          </span>
        ) : (
          <span className="text-emerald-400">
            ✓ Trong ngưỡng an toàn
          </span>
        )}
      </div>
    </div>
  );
};
