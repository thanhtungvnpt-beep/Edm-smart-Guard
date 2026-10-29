import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Info,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wrench,
  X,
  Zap
} from 'lucide-react';
import { Device } from '../types';

interface AIVibrationFailurePredictionModalProps {
  device: Device | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduleMaintenance?: (device: Device, reason: string) => void;
}

interface FailureDataPoint {
  day: string;
  dateStr: string;
  dayIndex: number;
  projectedVibration: number; // mm/s
  failureProbability: number; // 0 - 100%
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  primaryFactor: string;
}

export const AIVibrationFailurePredictionModal: React.FC<AIVibrationFailurePredictionModalProps> = ({
  device,
  isOpen,
  onClose,
  onScheduleMaintenance,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<FailureDataPoint | null>(null);

  // Generate 7-day predictive failure data based on current machine vibration
  const predictionData: FailureDataPoint[] = useMemo(() => {
    if (!device) return [];

    const baseVib = device.telemetry?.vibration ?? 0.8; // mm/s
    const isAlarm = device.status === 'ALARM_STOPPED';
    const temp = device.telemetry?.dielectricTemp ?? 40;

    const today = new Date();
    const days: FailureDataPoint[] = [];

    // Calculate progression based on baseline vibration
    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      const dateStr = `${String(targetDate.getDate()).padStart(2, '0')}/${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
      const dayName = i === 0 ? 'Hôm nay' : `Ngày +${i} (${dateStr})`;

      // Exponential growth model if vibration exceeds safe boundary
      let driftFactor = 1.0;
      if (baseVib > 2.0) {
        driftFactor = 1 + (i * 0.18) + (isAlarm ? 0.2 : 0);
      } else if (baseVib > 1.2) {
        driftFactor = 1 + (i * 0.08);
      } else {
        driftFactor = 1 + (i * 0.03);
      }

      const projVib = Number((baseVib * driftFactor).toFixed(2));
      
      // Calculate probability (ISO 10816 standards: > 1.8 mm/s is warning, > 4.5 mm/s is dangerous)
      let prob = 0;
      if (projVib < 0.8) {
        prob = Math.min(20, Math.round(5 + i * 1.5));
      } else if (projVib < 1.8) {
        prob = Math.min(45, Math.round(15 + (projVib - 0.8) * 20 + i * 2.5));
      } else if (projVib < 3.5) {
        prob = Math.min(75, Math.round(40 + (projVib - 1.8) * 15 + i * 3.5));
      } else {
        prob = Math.min(96, Math.round(65 + (projVib - 3.5) * 12 + i * 4));
      }

      let riskLevel: FailureDataPoint['riskLevel'] = 'LOW';
      let primaryFactor = 'Dao động trong dải dung sai tiêu chuẩn';

      if (prob >= 75) {
        riskLevel = 'CRITICAL';
        primaryFactor = 'Rung chấn vượt ngưỡng phá hủy vòng bi trục chính / kẹt ray trượt';
      } else if (prob >= 50) {
        riskLevel = 'HIGH';
        primaryFactor = 'Mất cân bằng động rotor hoặc cộng hưởng buồng gia công';
      } else if (prob >= 25) {
        riskLevel = 'MODERATE';
        primaryFactor = 'Suy thoái dầu bôi trơn & mòn sơ bộ ổ lăn';
      }

      days.push({
        day: dayName,
        dateStr,
        dayIndex: i,
        projectedVibration: projVib,
        failureProbability: prob,
        riskLevel,
        primaryFactor,
      });
    }

    return days;
  }, [device]);

  // Max failure probability
  const peakRisk = useMemo(() => {
    if (!predictionData.length) return null;
    return predictionData.reduce((prev, curr) => (curr.failureProbability > prev.failureProbability ? curr : prev));
  }, [predictionData]);

  // D3.js Render Chart Logic
  useEffect(() => {
    if (!isOpen || !svgRef.current || predictionData.length === 0) return;

    // Clear previous D3 elements
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = svgRef.current.clientWidth || 560;
    const containerHeight = 260;

    const margin = { top: 30, right: 35, bottom: 45, left: 50 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Create defs for high-tech gradients and glows
    const defs = svg.append('defs');

    // Area gradient
    const areaGradient = defs.append('linearGradient')
      .attr('id', 'failure-area-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');

    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#FF5263')
      .attr('stop-opacity', 0.45);

    areaGradient.append('stop')
      .attr('offset', '60%')
      .attr('stop-color', '#00C8F0')
      .attr('stop-opacity', 0.15);

    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#061522')
      .attr('stop-opacity', 0.0);

    // Filter for line glow
    const filter = defs.append('filter')
      .attr('id', 'cyan-glow')
      .attr('x', '-20%').attr('y', '-20%')
      .attr('width', '140%').attr('height', '140%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg
      .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X scale
    const x = d3.scalePoint<string>()
      .domain(predictionData.map((d) => d.day))
      .range([0, width])
      .padding(0.2);

    // Y scale (0% to 100%)
    const y = d3.scaleLinear()
      .domain([0, 100])
      .nice()
      .range([height, 0]);

    // Grid lines horizontal
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(y)
          .tickSize(-width)
          .tickFormat(() => '')
          .ticks(5)
      )
      .selectAll('line')
      .attr('stroke', '#15324C')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-opacity', 0.7);

    g.select('.domain').remove();

    // Critical Threshold Line (75%)
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', y(75))
      .attr('y2', y(75))
      .attr('stroke', '#FF5263')
      .attr('stroke-dasharray', '4 3')
      .attr('stroke-width', 1.2)
      .attr('opacity', 0.85);

    g.append('text')
      .attr('x', width)
      .attr('y', y(75) - 6)
      .attr('text-anchor', 'end')
      .attr('fill', '#FF5263')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .text('Ngưỡng Cực Kỳ Nguy Hiểm (75%)');

    // Warning Threshold Line (50%)
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', y(50))
      .attr('y2', y(50))
      .attr('stroke', '#FFB547')
      .attr('stroke-dasharray', '4 3')
      .attr('stroke-width', 1)
      .attr('opacity', 0.85);

    g.append('text')
      .attr('x', width)
      .attr('y', y(50) - 6)
      .attr('text-anchor', 'end')
      .attr('fill', '#FFB547')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .text('Ngưỡng Cần Giám Sát (50%)');

    // Area generator
    const area = d3.area<FailureDataPoint>()
      .x((d) => x(d.day) ?? 0)
      .y0(height)
      .y1((d) => y(d.failureProbability))
      .curve(d3.curveMonotoneX);

    // Line generator
    const line = d3.line<FailureDataPoint>()
      .x((d) => x(d.day) ?? 0)
      .y((d) => y(d.failureProbability))
      .curve(d3.curveMonotoneX);

    // Render area path
    g.append('path')
      .datum(predictionData)
      .attr('fill', 'url(#failure-area-gradient)')
      .attr('d', area);

    // Render line path with animation
    const path = g.append('path')
      .datum(predictionData)
      .attr('fill', 'none')
      .attr('stroke', '#00C8F0')
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#cyan-glow)')
      .attr('d', line);

    // Animate line reveal
    const totalLength = (path.node() as SVGPathElement)?.getTotalLength() || 600;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Render circles on points
    const dots = g.selectAll('.dot')
      .data(predictionData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (d) => x(d.day) ?? 0)
      .attr('cy', (d) => y(d.failureProbability))
      .attr('r', 4.5)
      .attr('fill', (d) => {
        if (d.failureProbability >= 75) return '#FF5263';
        if (d.failureProbability >= 50) return '#FFB547';
        return '#00C8F0';
      })
      .attr('stroke', '#061522')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 7)
          .attr('stroke', '#FFFFFF');

        setSelectedPoint(d);
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 4.5)
          .attr('stroke', '#061522');
      });

    // Render X Axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .attr('color', '#9CB4C8');

    xAxis.select('.domain').attr('stroke', '#15324C');
    xAxis.selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#9CB4C8')
      .attr('dy', '12px');

    // Render Y Axis
    const yAxis = g.append('g')
      .call(
        d3.axisLeft(y)
          .ticks(5)
          .tickFormat((d) => `${d}%`)
      )
      .attr('color', '#9CB4C8');

    yAxis.select('.domain').attr('stroke', '#15324C');
    yAxis.selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#9CB4C8');

    // Default select highest point or today
    setSelectedPoint(predictionData[predictionData.length - 1]);
  }, [isOpen, predictionData]);

  if (!isOpen || !device) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0A2032] border border-[#15324C] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#EAF5FF] ring-1 ring-[#00C8F0]/30 max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#15324C] bg-gradient-to-r from-[#0D2940] to-[#0A2032]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00C8F0]/15 border border-[#00C8F0]/30 flex items-center justify-center text-[#00C8F0]">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#EAF5FF]">Dự Báo Hỏng Hóc 7 Ngày (AI Predictive D3)</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#168BFF]/20 text-[#00C8F0] border border-[#168BFF]/40 font-bold">
                  {device.code}
                </span>
              </div>
              <p className="text-[11px] text-[#9CB4C8]">
                Thuật toán D3.js tính toán đường cong rủi ro dựa trên dao động phổ rung ({device.telemetry?.vibration || 0.6} mm/s)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CB4C8] hover:text-white hover:bg-[#15324C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 custom-tower-scrollbar flex-1">
          {/* Key metrics cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-[#081B2B] border border-[#15324C] rounded-xl p-2.5">
              <span className="text-[10px] text-[#9CB4C8]">Độ rung hiện tại</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-base font-bold font-mono ${
                  (device.telemetry?.vibration || 0) > 2.5 ? 'text-[#FF5263]' : (device.telemetry?.vibration || 0) > 1.2 ? 'text-[#FFB547]' : 'text-[#16D9A0]'
                }`}>
                  {device.telemetry?.vibration || 0.6}
                </span>
                <span className="text-[10px] text-[#9CB4C8]">mm/s</span>
              </div>
            </div>

            <div className="bg-[#081B2B] border border-[#15324C] rounded-xl p-2.5">
              <span className="text-[10px] text-[#9CB4C8]">Xác suất đỉnh (7N)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-base font-bold font-mono ${
                  (peakRisk?.failureProbability || 0) >= 75 ? 'text-[#FF5263]' : (peakRisk?.failureProbability || 0) >= 50 ? 'text-[#FFB547]' : 'text-[#00C8F0]'
                }`}>
                  {peakRisk?.failureProbability || 0}%
                </span>
                <span className="text-[10px] text-[#9CB4C8]">{peakRisk?.dateStr}</span>
              </div>
            </div>

            <div className="bg-[#081B2B] border border-[#15324C] rounded-xl p-2.5">
              <span className="text-[10px] text-[#9CB4C8]">Chuẩn ISO 10816</span>
              <div className="text-base font-bold text-[#EAF5FF] mt-0.5">
                {(device.telemetry?.vibration || 0) <= 1.8 ? 'Cấp A/B (Ổn)' : 'Cấp C/D (Cảnh báo)'}
              </div>
            </div>

            <div className="bg-[#081B2B] border border-[#15324C] rounded-xl p-2.5">
              <span className="text-[10px] text-[#9CB4C8]">Nhiệt độ dung môi</span>
              <div className="text-base font-bold text-[#EAF5FF] mt-0.5 font-mono">
                {device.telemetry?.dielectricTemp || 42}°C
              </div>
            </div>
          </div>

          {/* D3 SVG Chart Container */}
          <div className="bg-[#081B2B] border border-[#15324C] rounded-xl p-3 shadow-inner">
            <div className="flex items-center justify-between pb-1 text-xs">
              <span className="font-semibold text-[#EAF5FF] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#00C8F0]" />
                Biểu đồ D3.js: Đường cong xác suất dừng máy ngoài ý muốn
              </span>
              <span className="text-[10px] text-[#9CB4C8]">Di chuột lên điểm để xem chi tiết</span>
            </div>

            <div className="w-full overflow-hidden">
              <svg ref={svgRef} className="w-full h-[220px]" />
            </div>
          </div>

          {/* Point Inspector Card (Selected Day Breakdown) */}
          {selectedPoint && (
            <div className={`p-3 rounded-xl border transition-all text-xs ${
              selectedPoint.riskLevel === 'CRITICAL'
                ? 'bg-[#FF5263]/10 border-[#FF5263]/40'
                : selectedPoint.riskLevel === 'HIGH'
                ? 'bg-[#FFB547]/10 border-[#FFB547]/40'
                : 'bg-[#081B2B] border-[#15324C]'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#EAF5FF]">{selectedPoint.day}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    selectedPoint.riskLevel === 'CRITICAL'
                      ? 'bg-[#FF5263]/20 text-[#FF5263] border-[#FF5263]/40'
                      : selectedPoint.riskLevel === 'HIGH'
                      ? 'bg-[#FFB547]/20 text-[#FFB547] border-[#FFB547]/40'
                      : 'bg-[#16D9A0]/20 text-[#16D9A0] border-[#16D9A0]/40'
                  }`}>
                    Rủi ro: {selectedPoint.failureProbability}% ({selectedPoint.riskLevel})
                  </span>
                </div>
                <span className="font-mono text-[#00C8F0] font-bold">
                  Dự phóng rung: {selectedPoint.projectedVibration} mm/s
                </span>
              </div>
              <p className="mt-1.5 text-[#9CB4C8] text-[11px] leading-relaxed">
                <strong className="text-[#EAF5FF]">Nhân tố chính:</strong> {selectedPoint.primaryFactor}
              </p>
            </div>
          )}

          {/* AI Advisory Note */}
          <div className="bg-[#0D2940]/60 border border-[#15324C] rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#9CB4C8]">
            <Info className="w-4 h-4 text-[#00C8F0] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-[#EAF5FF]">Khuyến nghị bảo trì phòng ngừa từ AI:</span>
              <p className="text-[11px] leading-relaxed">
                Nếu độ rung tiếp tục xu hướng tăng vượt 2.5 mm/s, xác suất hỏng trục chính hoặc kẹt dây cắt EDM sẽ chạm đỉnh vào khoảng {peakRisk?.day}. Đề xuất kiểm tra vòng bi, siết bu lông bệ gá và hiệu chuẩn lực căng dây trước khi bước sang ngày thứ 4.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#15324C] bg-[#081B2B]">
          <span className="text-[11px] text-[#9CB4C8]">
            Mô hình D3.js Vector Interpolation • Dữ liệu cảm biến rung piezo
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs rounded-lg bg-[#0D2940] hover:bg-[#15324C] text-[#EAF5FF] transition-colors"
            >
              Đóng
            </button>
            {onScheduleMaintenance && (
              <button
                onClick={() => {
                  onScheduleMaintenance(device, `Lên lịch bảo trì do dự báo rung chấn D3: ${peakRisk?.failureProbability}% rủi ro vào ${peakRisk?.dateStr}`);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-[#168BFF] to-[#00C8F0] text-[#061522] hover:opacity-90 shadow-md shadow-[#00C8F0]/30 transition-all active:scale-95"
              >
                <Wrench className="w-3.5 h-3.5" />
                Lên Lịch Bảo Trì Máy Này
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
