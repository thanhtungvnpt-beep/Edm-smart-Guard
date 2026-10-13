import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  Droplets,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Gauge,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Power,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Thermometer,
  Wind,
  Wrench,
  Zap,
} from 'lucide-react';
import { Device } from '../types';
import { getStoredMaintenanceRecords } from '../utils/maintenanceHistoryData';

interface WorkshopHeatmapProps {
  devices: Device[];
  onOpenMachineDetails?: (device: Device) => void;
  onOpenDiagnosis?: (device: Device) => void;
}

export type HeatmapTimeRange = 'today' | '7days' | '30days';
export type HeatmapMetricMode = 'incident_density' | 'downtime_hours' | 'infrastructure_risk';

export interface WorkshopZone {
  id: string;
  zoneCode: string;
  name: string;
  shortName: string;
  gridCoordinates: string; // e.g. "Row 1, Bay A"
  primaryDeviceId: string;
  primaryDeviceCode: string;
  locationDescription: string;
  ambientTempC: number;
  humidityPercent: number;
  powerPhase: string;
  coolingLoop: string;
  infrastructureNotes: string;
  keyBottleneck: string;
}

export const WORKSHOP_ZONES: WorkshopZone[] = [
  {
    id: 'zone-01',
    zoneCode: 'ZONE-L01',
    name: 'Xưởng Khuôn Mẫu Chính - Line 01',
    shortName: 'Line 01 (Khuôn Mẫu)',
    gridCoordinates: 'Bay A1 - Hàng Phía Bắc',
    primaryDeviceId: 'dev-01',
    primaryDeviceCode: 'EDM-W01',
    locationDescription: 'Cụm cắt dây CNC siêu chính xác cho khuôn ép nhựa và dập vuốt',
    ambientTempC: 25.2,
    humidityPercent: 54,
    powerPhase: 'Pha A (Trạm Biến Áp TR-01)',
    coolingLoop: 'Vòng Làm Mát Trung Tâm CH-1',
    infrastructureNotes: 'Đường dây điện chịu tải cao khi nhiều máy phóng điện xung cùng chu kỳ',
    keyBottleneck: 'Sụt áp phóng điện & đứt dây đồng do cặn xỉ khe phóng (E-102)',
  },
  {
    id: 'zone-02',
    zoneCode: 'ZONE-L02',
    name: 'Xưởng Linh Kiện Bán Dẫn - Line 02',
    shortName: 'Line 02 (Bán Dẫn)',
    gridCoordinates: 'Bay A2 - Hàng Phía Đông Bắc',
    primaryDeviceId: 'dev-02',
    primaryDeviceCode: 'EDM-W02',
    locationDescription: 'Cụm cắt dây vi mạch & đầu nối bán dẫn phòng sạch cấp 10.000',
    ambientTempC: 22.8,
    humidityPercent: 48,
    powerPhase: 'Pha B (Bộ Ổn Áp Tinh AVR-02)',
    coolingLoop: 'Chiller Khép Kín CH-2',
    infrastructureNotes: 'Độ dẫn điện nước Deion cần duy trì nghiêm ngặt dưới 15 uS/cm',
    keyBottleneck: 'Tụt áp suất bơm dung dịch điện môi & nghẹt lõi lọc xỉ (ALARM-204)',
  },
  {
    id: 'zone-03',
    zoneCode: 'ZONE-CLB',
    name: 'Xưởng Khuôn Độ Chính Xác Cao - Cell B',
    shortName: 'Cell B (Xung Điện Tỷ Mỷ)',
    gridCoordinates: 'Bay B1 - Trung Tâm Nhà Xưởng',
    primaryDeviceId: 'dev-03',
    primaryDeviceCode: 'EDM-S01',
    locationDescription: 'Cụm máy xung định hình điện cực đồng & than chì cho khuôn quang học',
    ambientTempC: 24.1,
    humidityPercent: 52,
    powerPhase: 'Pha C (Trạm Biến Áp TR-01)',
    coolingLoop: 'Vòng Làm Mát Trung Tâm CH-1',
    infrastructureNotes: 'Nhiệt độ dầu điện môi nhạy cảm với nhiệt độ môi trường xung quanh',
    keyBottleneck: 'Hao mòn điện cực than chì & quá nhiệt dầu xung trong chu kỳ gia công sâu',
  },
  {
    id: 'zone-04',
    zoneCode: 'ZONE-L03',
    name: 'Xưởng Cắt Dây Tốc Độ Cao - Line 03',
    shortName: 'Line 03 (Tốc Độ Cao)',
    gridCoordinates: 'Bay C1 - Hàng Phía Nam',
    primaryDeviceId: 'dev-04',
    primaryDeviceCode: 'EDM-W03',
    locationDescription: 'Cụm gia công hàng loạt chi tiết cơ khí chính xác cao tải liên tục',
    ambientTempC: 25.8,
    humidityPercent: 56,
    powerPhase: 'Pha B (Trạm Biến Áp TR-02)',
    coolingLoop: 'Tháp Giải Nhiệt CT-01',
    infrastructureNotes: 'Tốc độ cuộn dây cao yêu cầu áp lực nước sục xả ổn định liên tục',
    keyBottleneck: 'Rung động bệ máy và mòn cụm dẫn hướng kim cương khi gia công tốc độ cao',
  },
  {
    id: 'zone-05',
    zoneCode: 'ZONE-CLA',
    name: 'Xưởng Khuôn Mẫu Điện Tử - Cell A',
    shortName: 'Cell A (Khuôn Điện Tử)',
    gridCoordinates: 'Bay B2 - Hàng Phía Tây',
    primaryDeviceId: 'dev-05',
    primaryDeviceCode: 'EDM-S02',
    locationDescription: 'Cụm máy xung tuyến tính CNC gia công khuôn đầu nối điện thoại & laptop',
    ambientTempC: 23.5,
    humidityPercent: 50,
    powerPhase: 'Pha A (Trạm Biến Áp TR-02)',
    coolingLoop: 'Chiller Khép Kín CH-3',
    infrastructureNotes: 'Động cơ tuyến tính yêu cầu điều hòa luồng gió lạnh trực tiếp',
    keyBottleneck: 'Bụi bẩn bám thước quang từ tính & chênh lệch nhiệt độ ray trượt trục Z',
  },
  {
    id: 'zone-06',
    zoneCode: 'ZONE-ARD',
    name: 'Xưởng Chuẩn Bị Phôi & Lỗ Mồi - Area D',
    shortName: 'Area D (Khoan Lỗ Mồi)',
    gridCoordinates: 'Bay C2 - Hàng Phía Tây Nam',
    primaryDeviceId: 'dev-06',
    primaryDeviceCode: 'EDM-D01',
    locationDescription: 'Cụm máy khoan lỗ mồi cao tốc xỏ dây cho các tấm phôi thép dày',
    ambientTempC: 26.5,
    humidityPercent: 58,
    powerPhase: 'Pha C (Trạm Biến Áp TR-02)',
    coolingLoop: 'Bể Nước Hồi Deion',
    infrastructureNotes: 'Áp lực khí nén 8 bar cấp cho xả phôi ống đồng khoan mồi',
    keyBottleneck: 'Nghẹt ống điện cực đồng thau 0.3mm & sụt áp khí nén giờ cao điểm',
  },
];

export const WorkshopHeatmap: React.FC<WorkshopHeatmapProps> = ({
  devices,
  onOpenMachineDetails,
  onOpenDiagnosis,
}) => {
  const [timeRange, setTimeRange] = useState<HeatmapTimeRange>('30days');
  const [metricMode, setMetricMode] = useState<HeatmapMetricMode>('incident_density');
  const [showInfraOverlay, setShowInfraOverlay] = useState<boolean>(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-01');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Calculate zone stats based on timeRange and stored maintenance records + live alarms
  const zoneStats = useMemo(() => {
    const records = getStoredMaintenanceRecords();
    const now = new Date();
    const rangeDays = timeRange === 'today' ? 1 : timeRange === '7days' ? 7 : 30;

    return WORKSHOP_ZONES.map((zone) => {
      const dev = devices.find((d) => d.id === zone.primaryDeviceId);
      const isAlarmStopped = dev?.status === 'ALARM_STOPPED';

      // Filter records in range
      const zoneRecords = records.filter((r) => {
        if (!r.completedAt) return false;
        if (r.deviceId !== zone.primaryDeviceId) return false;
        const diffDays = (now.getTime() - new Date(r.completedAt).getTime()) / (1000 * 3600 * 24);
        return diffDays <= rangeDays;
      });

      // Realistic downtime minutes calculation
      let incidentCount = zoneRecords.length;
      let downtimeHours = Math.round(
        zoneRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0) / 60 * 10
      ) / 10;

      // Realistic baselines for simulation if records are sparse
      if (zone.id === 'zone-01') {
        incidentCount = Math.max(incidentCount, timeRange === 'today' ? 2 : timeRange === '7days' ? 5 : 14);
        downtimeHours = Math.max(downtimeHours, timeRange === 'today' ? 2.6 : timeRange === '7days' ? 8.4 : 26.8);
      } else if (zone.id === 'zone-02') {
        incidentCount = Math.max(incidentCount, timeRange === 'today' ? 1 : timeRange === '7days' ? 4 : 11);
        downtimeHours = Math.max(downtimeHours, timeRange === 'today' ? 1.8 : timeRange === '7days' ? 6.2 : 19.4);
      } else if (zone.id === 'zone-03') {
        incidentCount = Math.max(incidentCount, timeRange === 'today' ? 1 : timeRange === '7days' ? 3 : 9);
        downtimeHours = Math.max(downtimeHours, timeRange === 'today' ? 1.2 : timeRange === '7days' ? 4.8 : 16.2);
      } else if (zone.id === 'zone-04') {
        incidentCount = Math.max(incidentCount, timeRange === 'today' ? 0 : timeRange === '7days' ? 2 : 6);
        downtimeHours = Math.max(downtimeHours, timeRange === 'today' ? 0.5 : timeRange === '7days' ? 2.4 : 9.8);
      } else if (zone.id === 'zone-05') {
        incidentCount = Math.max(incidentCount, timeRange === 'today' ? 0 : timeRange === '7days' ? 1 : 5);
        downtimeHours = Math.max(downtimeHours, timeRange === 'today' ? 0.4 : timeRange === '7days' ? 1.8 : 7.5);
      } else {
        // zone-06
        incidentCount = Math.max(incidentCount, timeRange === 'today' ? 0 : timeRange === '7days' ? 2 : 7);
        downtimeHours = Math.max(downtimeHours, timeRange === 'today' ? 0.8 : timeRange === '7days' ? 3.1 : 11.2);
      }

      if (isAlarmStopped) {
        incidentCount += 2;
        downtimeHours += 1.5;
      }

      // Calculate Heat Score (0 - 100)
      let heatScore = 0;
      if (metricMode === 'incident_density') {
        const maxExpectedIncidents = timeRange === 'today' ? 3 : timeRange === '7days' ? 6 : 16;
        heatScore = Math.min(100, Math.round((incidentCount / maxExpectedIncidents) * 100));
      } else if (metricMode === 'downtime_hours') {
        const maxExpectedDowntime = timeRange === 'today' ? 3.5 : timeRange === '7days' ? 10 : 30;
        heatScore = Math.min(100, Math.round((downtimeHours / maxExpectedDowntime) * 100));
      } else {
        // Infrastructure risk: combination of temperature stress, power phase, and downtime
        const tempStress = Math.max(0, (zone.ambientTempC - 23) * 12);
        const downtimeFactor = Math.min(50, (downtimeHours / (timeRange === 'today' ? 3 : 25)) * 50);
        heatScore = Math.min(100, Math.round(tempStress + downtimeFactor + (isAlarmStopped ? 25 : 0)));
      }

      // Heat Level Category
      let heatCategory: 'CRITICAL_HOTSPOT' | 'ELEVATED_WARM' | 'NORMAL_STABLE';
      if (heatScore >= 70 || isAlarmStopped) {
        heatCategory = 'CRITICAL_HOTSPOT';
      } else if (heatScore >= 40) {
        heatCategory = 'ELEVATED_WARM';
      } else {
        heatCategory = 'NORMAL_STABLE';
      }

      return {
        ...zone,
        device: dev,
        isAlarmStopped,
        incidentCount,
        downtimeHours,
        heatScore,
        heatCategory,
      };
    });
  }, [devices, timeRange, metricMode]);

  // Overall factory metrics
  const activeHotspotCount = useMemo(() => {
    return zoneStats.filter((z) => z.heatCategory === 'CRITICAL_HOTSPOT').length;
  }, [zoneStats]);

  const topHotspotZone = useMemo(() => {
    return [...zoneStats].sort((a, b) => b.heatScore - a.heatScore)[0];
  }, [zoneStats]);

  const totalFactoryDowntimeInRange = useMemo(() => {
    return Math.round(zoneStats.reduce((sum, z) => sum + z.downtimeHours, 0) * 10) / 10;
  }, [zoneStats]);

  const selectedZone = useMemo(() => {
    return zoneStats.find((z) => z.id === selectedZoneId) || zoneStats[0];
  }, [zoneStats, selectedZoneId]);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 shadow-xl space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 via-amber-500/20 to-orange-500/10 border border-rose-500/30 text-rose-400 shadow-md shadow-rose-500/10">
            <Flame className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Bản Đồ Nhiệt Mật Độ Sự Cố Xưởng (Workshop Incident Heatmap)
              </h3>
              <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-rose-400">
                SCADA 2D Spatial Map
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Phân tích mật độ gián đoạn máy móc theo tọa độ địa lý xưởng để định vị các điểm nghẽn hạ tầng (Điện lưới, Chiller tuần hoàn, Áp suất Deion).
            </p>
          </div>
        </div>

        {/* CONTROLS BAR */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center rounded-xl bg-slate-950/80 border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                timeRange === 'today'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hôm nay (24h)
            </button>
            <button
              onClick={() => setTimeRange('7days')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                timeRange === '7days'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => setTimeRange('30days')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                timeRange === '30days'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              30 ngày qua
            </button>
          </div>

          {/* Metric Mode Selector */}
          <div className="hidden sm:flex items-center rounded-xl bg-slate-950/80 border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setMetricMode('incident_density')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                metricMode === 'incident_density'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Độ nóng dựa trên số lượng sự cố xảy ra"
            >
              Mật độ sự cố
            </button>
            <button
              onClick={() => setMetricMode('downtime_hours')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                metricMode === 'downtime_hours'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Độ nóng dựa trên tổng số giờ dừng máy (downtime hours)"
            >
              Giờ dừng máy (Hours)
            </button>
            <button
              onClick={() => setMetricMode('infrastructure_risk')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                metricMode === 'infrastructure_risk'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Độ nóng dựa trên rủi ro nhiệt độ môi trường & điện áp"
            >
              Rủi ro hạ tầng
            </button>
          </div>

          {/* Infrastructure Overlay Toggle */}
          <button
            onClick={() => setShowInfraOverlay(!showInfraOverlay)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              showInfraOverlay
                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
            }`}
            title="Bật/Tắt hiển thị lớp phủ đường điện 380V, chiller và đường nước Deion"
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Lưới Hạ Tầng:</span>
            <span>{showInfraOverlay ? 'BẬT' : 'ẨN'}</span>
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-850 p-1.5 text-slate-400 hover:text-white transition"
            title={isExpanded ? 'Thu gọn bản đồ nhiệt' : 'Mở rộng bản đồ nhiệt'}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* TOP KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/30 to-slate-950/70 p-3.5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Điểm Nóng Nghiêm Trọng (Hotspots)</span>
                <Flame className="h-4 w-4 text-rose-400 animate-pulse" />
              </div>
              <div className="mt-2 font-mono text-xl sm:text-2xl font-black text-rose-400">
                {activeHotspotCount} <span className="text-xs font-normal text-slate-400">/ 6 khu vực</span>
              </div>
              <div className="mt-1 text-[11px] text-rose-300/80 truncate">
                Điểm nóng nhất: <strong className="text-white">{topHotspotZone?.shortName}</strong>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-slate-950/70 p-3.5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Tổng Dừng Máy Toàn Xưởng ({timeRange})</span>
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 font-mono text-xl sm:text-2xl font-black text-amber-300">
                {totalFactoryDowntimeInRange} <span className="text-xs font-normal text-slate-400">giờ</span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Chiếm ~{Math.min(100, Math.round((totalFactoryDowntimeInRange / (timeRange === 'today' ? 144 : timeRange === '7days' ? 1008 : 4320)) * 1000) / 10)}% tổng năng lực máy
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/70 p-3.5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Ổn Định Hạ Tầng Phụ Trợ</span>
                <ShieldAlert className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="mt-2 font-mono text-xl sm:text-2xl font-black text-cyan-300">
                87.4%
              </div>
              <div className="mt-1 text-[11px] text-cyan-400/80">
                Điện áp 3 pha: Ổn định • Nước Deion: Đạt chuẩn
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Điểm Nghẽn Hạ Tầng Cốt Lõi</span>
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 text-xs font-bold text-slate-200 line-clamp-1">
                {topHotspotZone?.keyBottleneck}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Khuyến nghị: Tăng áp bơm &amp; vệ sinh lọc xỉ định kỳ
              </div>
            </div>
          </div>

          {/* MAIN 2D WORKSHOP FLOOR MAP & INTERACTIVE HEAT TILES */}
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 shadow-2xl relative overflow-hidden">
            {/* Background Floor Blueprint Grid Lines */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            ></div>

            {/* Map Header with Legends */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-cyan-400" />
                  Mặt Bằng Nhà Máy (Floor Blueprint Grid):
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Khu Vực Sản Xuất CNC EDM • Diện tích 1.200 m²
                </span>
              </div>

              {/* Heat Density Legends */}
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-slate-400">Mức độ nhiệt:</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  Thấp (&lt;40%)
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                  Ấm (40-69%)
                </span>
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  Nóng Đỏ (&gt;70%)
                </span>
              </div>
            </div>

            {/* 2D Grid Layout of Factory Zones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 relative z-10">
              {zoneStats.map((zone) => {
                const isSelected = selectedZoneId === zone.id;
                const isCritical = zone.heatCategory === 'CRITICAL_HOTSPOT';
                const isElevated = zone.heatCategory === 'ELEVATED_WARM';

                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`relative rounded-2xl border p-4 cursor-pointer transition duration-200 overflow-hidden ${
                      isSelected
                        ? 'ring-2 ring-amber-400 border-amber-400 shadow-xl shadow-amber-500/10'
                        : isCritical
                        ? 'border-rose-500/60 hover:border-rose-400 bg-rose-950/20'
                        : isElevated
                        ? 'border-amber-500/40 hover:border-amber-400 bg-amber-950/15'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
                    }`}
                  >
                    {/* Simulated Radial Heat Background Glow */}
                    <div
                      className={`absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl pointer-events-none transition ${
                        isCritical
                          ? 'bg-rose-600/30'
                          : isElevated
                          ? 'bg-amber-600/20'
                          : 'bg-emerald-600/15'
                      }`}
                    ></div>

                    {/* Zone Header: Code, Grid, Status */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400">
                          {zone.zoneCode}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {zone.gridCoordinates}
                        </span>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold border ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : isElevated
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {isCritical ? '🚨 ĐIỂM NÓNG' : isElevated ? '⚠️ CẢNH BÁO' : '🟢 ỔN ĐỊNH'}
                      </span>
                    </div>

                    {/* Zone Body: Machine & Name */}
                    <div className="mt-3 relative z-10">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">
                            {zone.shortName}
                          </h4>
                          <span className="text-xs font-mono font-bold text-amber-400 mt-0.5 block">
                            {zone.primaryDeviceCode} • {zone.device?.model || 'CNC EDM'}
                          </span>
                        </div>
                        {zone.isAlarmStopped && (
                          <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white animate-pulse">
                            DỪNG SỰ CỐ
                          </span>
                        )}
                      </div>

                      {/* Heat Density Visual Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-400">
                            {metricMode === 'incident_density'
                              ? 'Chỉ số mật độ sự cố:'
                              : metricMode === 'downtime_hours'
                              ? 'Chỉ số dừng máy:'
                              : 'Chỉ số rủi ro hạ tầng:'}
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              isCritical ? 'text-rose-400' : isElevated ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {zone.heatScore}% ({zone.heatScore >= 70 ? 'Cao' : zone.heatScore >= 40 ? 'Vừa' : 'Thấp'})
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCritical
                                ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                                : isElevated
                                ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, zone.heatScore)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Zone Stats Grid */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2">
                          <span className="text-[10px] text-slate-400 block">Số vụ sự cố ({timeRange}):</span>
                          <span className="font-mono font-bold text-white text-sm">
                            {zone.incidentCount} vụ
                          </span>
                        </div>
                        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2">
                          <span className="text-[10px] text-slate-400 block">Tổng dừng máy:</span>
                          <span className="font-mono font-bold text-amber-300 text-sm">
                            {zone.downtimeHours} giờ
                          </span>
                        </div>
                      </div>

                      {/* Infrastructure Overlay details if enabled */}
                      {showInfraOverlay && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1">
                            <Thermometer className="h-3 w-3 text-cyan-400" />
                            {zone.ambientTempC}°C
                          </span>
                          <span className="flex items-center gap-1">
                            <Power className="h-3 w-3 text-amber-400" />
                            {zone.powerPhase.split(' ')[0]} {zone.powerPhase.split(' ')[1]}
                          </span>
                          <span className="flex items-center gap-1 text-cyan-300">
                            <Droplets className="h-3 w-3" />
                            {zone.coolingLoop.split(' ')[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Infrastructure Utility Facilities Strip (Power Substation, Central Chiller, DI Water Plant) */}
            {showInfraOverlay && (
              <div className="mt-4 pt-4 border-t border-slate-800 relative z-10">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-300">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>Trạm Phụ Trợ Hạ Tầng Kỹ Thuật Nhà Máy (Utility Sub-Facilities):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                      <Zap className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-[11px] block">Trạm Biến Áp TR-01 &amp; TR-02 (380V)</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Điện áp 3 pha: 382V • Cân bằng pha: 98.2%</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
                      <Droplets className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-[11px] block">Vòng Tuần Hoàn Nước Làm Mát Chiller</span>
                      <span className="text-[10px] text-cyan-300 font-mono">Nhiệt độ cấp: 19.5°C • Lưu lượng 45 m³/h</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
                      <Wind className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-[11px] block">Hệ Khí Nén &amp; Khử Ion Nước Deion</span>
                      <span className="text-[10px] text-purple-300 font-mono">Áp lực khí nén: 8.2 bar • Độ dẫn điện &lt; 12 uS/cm</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DETAILED DRILL-DOWN PANEL FOR SELECTED ZONE */}
          {selectedZone && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border font-mono font-bold text-sm ${
                      selectedZone.heatCategory === 'CRITICAL_HOTSPOT'
                        ? 'border-rose-500/40 bg-rose-950/30 text-rose-400'
                        : selectedZone.heatCategory === 'ELEVATED_WARM'
                        ? 'border-amber-500/40 bg-amber-950/30 text-amber-400'
                        : 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400'
                    }`}
                  >
                    {selectedZone.zoneCode.split('-')[1]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">
                        Chi Tiết Điểm Nghẽn Khu Vực: {selectedZone.name}
                      </h4>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                        {selectedZone.gridCoordinates}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedZone.locationDescription}
                    </p>
                  </div>
                </div>

                {/* Quick Action Buttons for Machine */}
                {selectedZone.device && (
                  <div className="flex items-center gap-2 shrink-0">
                    {onOpenDiagnosis && (
                      <button
                        onClick={() => onOpenDiagnosis(selectedZone.device!)}
                        className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 px-3 py-1.5 text-xs font-bold text-purple-300 hover:text-white transition active:scale-95"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                        <span>Chẩn Đoán AI</span>
                      </button>
                    )}

                    {onOpenMachineDetails && (
                      <button
                        onClick={() => onOpenMachineDetails(selectedZone.device!)}
                        className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95"
                      >
                        <span>Hồ Sơ Máy {selectedZone.primaryDeviceCode}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* 1. Infrastructure Bottleneck Analysis */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <ShieldAlert className="h-4 w-4 text-rose-400" />
                    Nguyên Nhân Gây Nghẽn Hạ Tầng:
                  </span>
                  <p className="text-slate-300 text-xs leading-relaxed bg-slate-900/80 rounded-xl p-3 border border-slate-800 font-medium">
                    {selectedZone.keyBottleneck}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    📌 Lưu ý phụ trợ: {selectedZone.infrastructureNotes}
                  </p>
                </div>

                {/* 2. Environmental & Operational Conditions */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <Gauge className="h-4 w-4 text-cyan-400" />
                    Điều Kiện Môi Trường &amp; Điện Năng:
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/80 text-[11px]">
                      <span className="text-slate-400">Nhiệt độ phòng xưởng:</span>
                      <span className="font-mono font-bold text-slate-200">{selectedZone.ambientTempC} °C</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/80 text-[11px]">
                      <span className="text-slate-400">Độ ẩm tương đối:</span>
                      <span className="font-mono font-bold text-slate-200">{selectedZone.humidityPercent} %</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/80 text-[11px]">
                      <span className="text-slate-400">Đường cấp nguồn:</span>
                      <span className="font-mono font-bold text-amber-300">{selectedZone.powerPhase}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 text-[11px]">
                      <span className="text-slate-400">Hệ làm mát phụ trợ:</span>
                      <span className="font-mono font-bold text-cyan-300">{selectedZone.coolingLoop}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Actionable Infrastructure Recommendations */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                    <Wrench className="h-4 w-4 text-amber-400" />
                    Biện Pháp Khắc Phục Hạ Tầng (AI Advice):
                  </span>
                  <ul className="space-y-2 text-[11px] text-slate-300">
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>
                        Điều chỉnh van điều áp và kiểm tra đường xả cặn thùng lọc để duy trì ổn định áp suất {selectedZone.primaryDeviceCode}.
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>
                        Bổ sung hạt nhựa khử ion (DI Resin) định kỳ 15 ngày/lần để tránh sụt áp hồ quang phóng điện.
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>
                        Bố trí nhân sự KTV kiểm tra cuộn dây đồng trước ca đêm để loại bỏ điểm nghẽn dừng máy đột xuất.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
