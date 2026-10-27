import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cpu,
  Eye,
  FileText,
  Filter,
  Flame,
  Headphones,
  Layers,
  LineChart as LineChartIcon,
  Maximize2,
  Minimize2,
  Radio,
  Search,
  Server,
  Sparkles,
  Thermometer,
  User,
  Users,
  Wrench,
  Zap,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  BarChart2,
  Smartphone
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Device, Technician, NotificationLog, FactoryStats } from '../types';

interface IndustrialControlTowerProProps {
  devices: Device[];
  technicians: Technician[];
  stats: FactoryStats | null;
  notifications: NotificationLog[];
  currentPlant: string;
  onOpenDiagnosis: (device: Device) => void;
  onOpenMachineDetails: (device: Device) => void;
  onOpenRepairReport: (device: Device) => void;
  onOpenTelemetryHistory: (device: Device) => void;
  onOpenPredictiveModal?: (device: Device) => void;
  onAcknowledgeIncident?: (incidentId: string) => void;
  onOpenWeeklyReport?: () => void;
  onNavigateToTab?: (tab: string) => void;
  onToast?: (message: string) => void;
}

export const IndustrialControlTowerPro: React.FC<IndustrialControlTowerProProps> = ({
  devices,
  technicians,
  stats,
  notifications,
  currentPlant,
  onOpenDiagnosis,
  onOpenMachineDetails,
  onOpenRepairReport,
  onOpenTelemetryHistory,
  onOpenPredictiveModal,
  onAcknowledgeIncident,
  onOpenWeeklyReport,
  onNavigateToTab,
  onToast
}) => {
  // Filters & State
  const [deviceSearchTerm, setDeviceSearchTerm] = useState('');
  const [selectedWorkshopFilter, setSelectedWorkshopFilter] = useState<'ALL' | 'Xưởng 1 EDM' | 'Xưởng 2 CNC' | 'Xưởng 3 Khác' | 'Xưởng 4 Lắp ráp'>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'RUNNING' | 'ALARM_STOPPED' | 'IDLE' | 'MAINTENANCE'>('ALL');
  const [techSearchTerm, setTechSearchTerm] = useState('');
  
  // Work Order Active Tab
  const [workOrderTab, setWorkOrderTab] = useState<'IN_PROGRESS' | 'PENDING_APPROVAL' | 'COMPLETED'>('IN_PROGRESS');
  
  // Trend Chart Metric
  const [trendMetric, setTrendMetric] = useState<'temp' | 'current' | 'vibration' | 'oee'>('temp');
  const [trendTimeRange, setTrendTimeRange] = useState('24h');
  
  // Map View Mode (2D / 3D) & Map filter
  const [mapMode, setMapMode] = useState<'2D' | '3D'>('3D');
  const [selectedMapNode, setSelectedMapNode] = useState<string>('factory-a');
  const [mapZoom, setMapZoom] = useState(1);
  const [activeCampusTab, setActiveCampusTab] = useState<'overview' | 'factory' | 'workshop' | 'device-type'>('overview');

  // Computed Device metrics
  const totalDeviceCount = devices.length || 18;
  const runningCount = devices.filter((d) => d.status === 'RUNNING').length || 14;
  const plannedStopCount = devices.filter((d) => d.status === 'IDLE' || d.status === 'MAINTENANCE_SCHEDULED').length || 3;
  const alarmStopCount = devices.filter((d) => d.status === 'ALARM_STOPPED').length || 1;

  // Helper to determine workshop from device location or code
  const getDeviceWorkshop = (d: Device): string => {
    if (d.location?.includes('Xưởng 1') || d.code.startsWith('EDM-0')) return 'Xưởng 1 EDM';
    if (d.location?.includes('Xưởng 2') || d.code.startsWith('CNC')) return 'Xưởng 2 CNC';
    if (d.location?.includes('Xưởng 3') || d.code.includes('S0') || d.code.startsWith('HP')) return 'Xưởng 3 Khác';
    if (d.location?.includes('Xưởng 4') || d.code.startsWith('ASY') || d.code.startsWith('QC') || d.code.startsWith('CMM')) return 'Xưởng 4 Lắp ráp';
    return d.location || 'Xưởng 1 EDM';
  };

  // Filtered devices for Panel 5
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const matchSearch =
        d.code.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
        d.name.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
        d.model.toLowerCase().includes(deviceSearchTerm.toLowerCase());
      
      const workshop = getDeviceWorkshop(d);
      const matchWorkshop =
        selectedWorkshopFilter === 'ALL' ||
        workshop.toLowerCase().includes(selectedWorkshopFilter.toLowerCase().replace('xưởng ', ''));
      
      const matchStatus =
        selectedStatusFilter === 'ALL' || d.status === selectedStatusFilter;

      return matchSearch && matchWorkshop && matchStatus;
    });
  }, [devices, deviceSearchTerm, selectedWorkshopFilter, selectedStatusFilter]);

  // Technicians filtered for Panel 7
  const filteredTechs = useMemo(() => {
    return technicians.filter((t) =>
      t.name.toLowerCase().includes(techSearchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(techSearchTerm.toLowerCase())
    );
  }, [technicians, techSearchTerm]);

  // Workshop OEE data for Panel 2 (BarChart)
  const workshopPerformanceData = [
    { workshop: 'Xưởng 1', oee: 82, runtime: 85, plannedStop: 10, unplannedStop: 5 },
    { workshop: 'Xưởng 2', oee: 76, runtime: 78, plannedStop: 16, unplannedStop: 6 },
    { workshop: 'Xưởng 3', oee: 68, runtime: 70, plannedStop: 22, unplannedStop: 8 },
    { workshop: 'Xưởng 4', oee: 74, runtime: 76, plannedStop: 18, unplannedStop: 6 },
  ];

  // Operational Trend 24h data for Panel 8 (LineChart)
  const trendData = [
    { time: '00:00', 'EDM-01': 38, 'EDM-02': 36, 'CNC-02': 42, 'CNC-01': 34 },
    { time: '04:00', 'EDM-01': 39, 'EDM-02': 37, 'CNC-02': 44, 'CNC-01': 35 },
    { time: '08:00', 'EDM-01': 42, 'EDM-02': 38, 'CNC-02': 52, 'CNC-01': 36 },
    { time: '12:00', 'EDM-01': 44, 'EDM-02': 39, 'CNC-02': 50, 'CNC-01': 37 },
    { time: '16:00', 'EDM-01': 43, 'EDM-02': 38, 'CNC-02': 48, 'CNC-01': 36 },
    { time: '20:00', 'EDM-01': 41, 'EDM-02': 37, 'CNC-02': 46, 'CNC-01': 35 },
  ];

  // Equipment Status Distribution for Panel 9 (PieChart Donut)
  const statusDistributionData = [
    { name: 'Đang chạy', value: runningCount, color: '#16D9A0', percentage: '78%' },
    { name: 'Dừng kế hoạch', value: plannedStopCount, color: '#168BFF', percentage: '17%' },
    { name: 'Dừng sự cố', value: alarmStopCount, color: '#FF5263', percentage: '5%' },
    { name: 'Bảo trì', value: 0, color: '#FFB547', percentage: '0%' },
    { name: 'Ngoại tuyến', value: 0, color: '#64748B', percentage: '0%' },
  ];

  // Work Orders List for Panel 6
  const workOrders = [
    {
      id: 'WO-101',
      priority: 'HIGH',
      priorityLabel: 'Cao',
      priorityColor: 'bg-[#FF5263]/20 text-[#FF5263] border-[#FF5263]/40',
      deviceCode: 'EDM-03',
      title: 'Kiểm tra trục chính',
      technician: 'Nguyễn Văn B',
      deadline: '16/01/2025',
      status: 'IN_PROGRESS',
      statusLabel: 'Đang xử lý',
      statusColor: 'bg-[#FFB547]/20 text-[#FFB547] border-[#FFB547]/40'
    },
    {
      id: 'WO-102',
      priority: 'MEDIUM',
      priorityLabel: 'Trung bình',
      priorityColor: 'bg-[#FFB547]/20 text-[#FFB547] border-[#FFB547]/40',
      deviceCode: 'CNC-02',
      title: 'Kiểm tra thủy lực',
      technician: 'Trần Văn A',
      deadline: '15/01/2025',
      status: 'PENDING_APPROVAL',
      statusLabel: 'Chờ duyệt',
      statusColor: 'bg-[#168BFF]/20 text-[#168BFF] border-[#168BFF]/40'
    },
    {
      id: 'WO-103',
      priority: 'MEDIUM',
      priorityLabel: 'Trung bình',
      priorityColor: 'bg-[#FFB547]/20 text-[#FFB547] border-[#FFB547]/40',
      deviceCode: 'EDM-01',
      title: 'Thay lọc nước',
      technician: 'Lê Văn C',
      deadline: '20/01/2025',
      status: 'IN_PROGRESS',
      statusLabel: 'Đang xử lý',
      statusColor: 'bg-[#FFB547]/20 text-[#FFB547] border-[#FFB547]/40'
    },
    {
      id: 'WO-104',
      priority: 'LOW',
      priorityLabel: 'Thấp',
      priorityColor: 'bg-[#00C8F0]/20 text-[#00C8F0] border-[#00C8F0]/40',
      deviceCode: 'CNC-03',
      title: 'Kiểm tra cảm biến',
      technician: 'Phạm Văn D',
      deadline: '21/01/2025',
      status: 'PENDING_APPROVAL',
      statusLabel: 'Chờ duyệt',
      statusColor: 'bg-[#168BFF]/20 text-[#168BFF] border-[#168BFF]/40'
    },
    {
      id: 'WO-105',
      priority: 'LOW',
      priorityLabel: 'Thấp',
      priorityColor: 'bg-[#00C8F0]/20 text-[#00C8F0] border-[#00C8F0]/40',
      deviceCode: 'EDM-02',
      title: 'Vệ sinh hệ thống',
      technician: 'Nguyễn Văn E',
      deadline: '22/01/2025',
      status: 'PENDING_APPROVAL',
      statusLabel: 'Chờ duyệt',
      statusColor: 'bg-[#168BFF]/20 text-[#168BFF] border-[#168BFF]/40'
    },
    {
      id: 'WO-106',
      priority: 'LOW',
      priorityLabel: 'Thấp',
      priorityColor: 'bg-[#00C8F0]/20 text-[#00C8F0] border-[#00C8F0]/40',
      deviceCode: 'EDM-05',
      title: 'Hiệu chuẩn thước quang',
      technician: 'Hoàng Minh T',
      deadline: '14/01/2025',
      status: 'COMPLETED',
      statusLabel: 'Hoàn thành',
      statusColor: 'bg-[#16D9A0]/20 text-[#16D9A0] border-[#16D9A0]/40'
    },
    {
      id: 'WO-107',
      priority: 'MEDIUM',
      priorityLabel: 'Trung bình',
      priorityColor: 'bg-[#FFB547]/20 text-[#FFB547] border-[#FFB547]/40',
      deviceCode: 'CNC-04',
      title: 'Thay dầu trục chính',
      technician: 'Vũ Quốc H',
      deadline: '13/01/2025',
      status: 'COMPLETED',
      statusLabel: 'Hoàn thành',
      statusColor: 'bg-[#16D9A0]/20 text-[#16D9A0] border-[#16D9A0]/40'
    },
    {
      id: 'WO-108',
      priority: 'LOW',
      priorityLabel: 'Thấp',
      priorityColor: 'bg-[#00C8F0]/20 text-[#00C8F0] border-[#00C8F0]/40',
      deviceCode: 'ASY-01',
      title: 'Kiểm tra van khí nén',
      technician: 'Đỗ Tuấn K',
      deadline: '12/01/2025',
      status: 'COMPLETED',
      statusLabel: 'Hoàn thành',
      statusColor: 'bg-[#16D9A0]/20 text-[#16D9A0] border-[#16D9A0]/40'
    }
  ];

  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => wo.status === workOrderTab);
  }, [workOrders, workOrderTab]);

  // System Notifications for Panel 11
  const systemNotifications = [
    { time: '10:24', message: 'Nhiệt độ trục chính EDM-03 vượt ngưỡng 48°C', level: 'Cao', levelColor: 'bg-[#FF5263]/20 text-[#FF5263] border-[#FF5263]/40' },
    { time: '09:18', message: 'Phát hiện rò rỉ áp lực thủy lực CNC-02', level: 'Trung bình', levelColor: 'bg-[#FFB547]/20 text-[#FFB547] border-[#FFB547]/40' },
    { time: '08:45', message: 'Áp suất nước làm mát thấp EDM-01 (0.8 MPa)', level: 'Trung bình', levelColor: 'bg-[#FFB547]/20 text-[#FFB547] border-[#FFB547]/40' },
    { time: '07:30', message: 'Hệ thống AI hoàn tất cập nhật mô hình học máy', level: 'Thông tin', levelColor: 'bg-[#00C8F0]/20 text-[#00C8F0] border-[#00C8F0]/40' },
    { time: '06:12', message: 'Sao lưu dữ liệu telemetry 24h thành công', level: 'Thông tin', levelColor: 'bg-[#00C8F0]/20 text-[#00C8F0] border-[#00C8F0]/40' },
  ];

  // Top 5 frequent faults for Panel 10
  const frequentFaults = [
    { title: 'Nhiệt độ trục chính cao', count: 8, max: 10 },
    { title: 'Rò rỉ thủy lực', count: 6, max: 10 },
    { title: 'Áp suất nước thấp', count: 4, max: 10 },
    { title: 'Lỗi servo', count: 3, max: 10 },
    { title: 'Dòng điện vượt ngưỡng', count: 3, max: 10 },
  ];

  return (
    <div className="space-y-4">
      {/* ============================================================== */}
      {/* 6 TOP KPI SUMMARY CARDS                                        */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Tổng thiết bị */}
        <div
          onClick={() => onNavigateToTab?.('devices')}
          className="bg-[#0A2032] border border-[#15324C] hover:border-[#00C8F0]/50 rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-[#00C8F0]/10 border border-[#00C8F0]/30 flex items-center justify-center text-[#00C8F0]">
              <Server className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-[#9CB4C8] hover:text-[#00C8F0]">✕</span>
          </div>
          <div className="mt-2">
            <div className="text-xs text-[#9CB4C8] font-medium">Tổng thiết bị</div>
            <div className="text-2xl font-bold text-[#EAF5FF] font-mono tracking-tight">{totalDeviceCount}</div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#15324C]/60 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-[#16D9A0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16D9A0]"></span>
              {runningCount}
            </span>
            <span className="flex items-center gap-1 text-[#168BFF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#168BFF]"></span>
              {plannedStopCount}
            </span>
            <span className="flex items-center gap-1 text-[#FF5263]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5263]"></span>
              {alarmStopCount}
            </span>
          </div>
        </div>

        {/* KPI 2: Hiệu suất OEE */}
        <div
          onClick={() => onNavigateToTab?.('reports')}
          className="bg-[#0A2032] border border-[#15324C] hover:border-[#00C8F0]/50 rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="relative w-8 h-8 rounded-full border-2 border-[#00C8F0] flex items-center justify-center text-[10px] font-bold text-[#00C8F0] font-mono">
              76%
            </div>
            <span className="text-[10px] text-[#9CB4C8]">✕</span>
          </div>
          <div className="mt-2">
            <div className="text-xs text-[#9CB4C8] font-medium">Hiệu suất OEE</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#EAF5FF] font-mono">76%</span>
              <span className="text-xs font-semibold text-[#16D9A0] flex items-center">
                + 6%
              </span>
            </div>
          </div>
          {/* Mini Cyan Spark Bars */}
          <div className="mt-2 pt-2 border-t border-[#15324C]/60 flex items-end gap-1 h-4">
            <div className="w-1.5 h-2 bg-[#00C8F0]/40 rounded-t-sm"></div>
            <div className="w-1.5 h-2.5 bg-[#00C8F0]/60 rounded-t-sm"></div>
            <div className="w-1.5 h-3 bg-[#00C8F0]/70 rounded-t-sm"></div>
            <div className="w-1.5 h-3.5 bg-[#00C8F0]/90 rounded-t-sm"></div>
            <div className="w-1.5 h-4 bg-[#00C8F0] rounded-t-sm shadow-[0_0_8px_#00C8F0]"></div>
          </div>
        </div>

        {/* KPI 3: Cảnh báo hiện tại */}
        <div
          onClick={() => onNavigateToTab?.('notifications')}
          className="bg-[#0A2032] border border-[#15324C] hover:border-[#FF5263]/50 rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-[#FF5263]/10 border border-[#FF5263]/30 flex items-center justify-center text-[#FF5263]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-[#9CB4C8]">✕</span>
          </div>
          <div className="mt-2">
            <div className="text-xs text-[#9CB4C8] font-medium">Cảnh báo hiện tại</div>
            <div className="text-2xl font-bold text-[#FF5263] font-mono tracking-tight">3</div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#15324C]/60 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-[#FF5263]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5263]"></span>
              1
            </span>
            <span className="flex items-center gap-1 text-[#FFB547]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB547]"></span>
              2
            </span>
            <span className="flex items-center gap-1 text-[#00C8F0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C8F0]"></span>
              0
            </span>
          </div>
        </div>

        {/* KPI 4: Lệnh bảo trì */}
        <div
          onClick={() => onNavigateToTab?.('maintenance')}
          className="bg-[#0A2032] border border-[#15324C] hover:border-[#00C8F0]/50 rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-[#168BFF]/10 border border-[#168BFF]/30 flex items-center justify-center text-[#168BFF]">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-[#9CB4C8]">✕</span>
          </div>
          <div className="mt-2">
            <div className="text-xs text-[#9CB4C8] font-medium">Lệnh bảo trì</div>
            <div className="text-2xl font-bold text-[#EAF5FF] font-mono tracking-tight">12</div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#15324C]/60 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-[#00C8F0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C8F0]"></span>
              5
            </span>
            <span className="flex items-center gap-1 text-[#168BFF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#168BFF]"></span>
              4
            </span>
            <span className="flex items-center gap-1 text-[#16D9A0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16D9A0]"></span>
              3
            </span>
          </div>
        </div>

        {/* KPI 5: Yêu cầu hỗ trợ */}
        <div
          onClick={() => onNavigateToTab?.('community')}
          className="bg-[#0A2032] border border-[#15324C] hover:border-[#00C8F0]/50 rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-[#A855F7]/10 border border-[#A855F7]/30 flex items-center justify-center text-[#A855F7]">
              <Headphones className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-[#9CB4C8]">✕</span>
          </div>
          <div className="mt-2">
            <div className="text-xs text-[#9CB4C8] font-medium">Yêu cầu hỗ trợ</div>
            <div className="text-2xl font-bold text-[#EAF5FF] font-mono tracking-tight">6</div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#15324C]/60 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-[#FF5263]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5263]"></span>
              3
            </span>
            <span className="flex items-center gap-1 text-[#A855F7]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]"></span>
              2
            </span>
            <span className="flex items-center gap-1 text-[#00C8F0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C8F0]"></span>
              1
            </span>
          </div>
        </div>

        {/* KPI 6: Kỹ thuật viên */}
        <div
          onClick={() => onNavigateToTab?.('technician-eval')}
          className="bg-[#0A2032] border border-[#15324C] hover:border-[#16D9A0]/50 rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-[#16D9A0]/10 border border-[#16D9A0]/30 flex items-center justify-center text-[#16D9A0]">
              <User className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-[#9CB4C8]">✕</span>
          </div>
          <div className="mt-2">
            <div className="text-xs text-[#9CB4C8] font-medium">Kỹ thuật viên</div>
            <div className="text-2xl font-bold text-[#EAF5FF] font-mono tracking-tight">{technicians.length || 8}</div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#15324C]/60 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-[#16D9A0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16D9A0]"></span>
              6
            </span>
            <span className="flex items-center gap-1 text-[#00C8F0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00C8F0]"></span>
              2
            </span>
            <span className="flex items-center gap-1 text-[#FFB547]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB547]"></span>
              0
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 1: CAMPUS MAP (PANEL 1), WORKSHOP OEE (PANEL 2), ALERTS (PANEL 3) & AI DIAGNOSIS (PANEL 4) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* PANEL 1: SƠ ĐỒ NHÀ MÁY VÀ TRẠNG THÁI THIẾT BỊ (7 COLS) */}
        <div className="lg:col-span-7 bg-[#0A2032] border border-[#15324C] rounded-xl p-4 flex flex-col justify-between shadow-xl">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#15324C]/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00C8F0] shadow-[0_0_8px_#00C8F0]"></span>
              <h2 className="text-sm font-bold text-[#EAF5FF] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#00C8F0]" />
                Sơ đồ nhà máy và trạng thái thiết bị
              </h2>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-1 bg-[#061522] p-1 rounded-lg border border-[#15324C]/60">
              <button
                onClick={() => setActiveCampusTab('overview')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  activeCampusTab === 'overview'
                    ? 'bg-[#168BFF] text-white shadow-sm'
                    : 'text-[#9CB4C8] hover:text-[#EAF5FF]'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveCampusTab('factory')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  activeCampusTab === 'factory'
                    ? 'bg-[#168BFF] text-white shadow-sm'
                    : 'text-[#9CB4C8] hover:text-[#EAF5FF]'
                }`}
              >
                Nhà máy
              </button>
              <button
                onClick={() => setActiveCampusTab('workshop')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  activeCampusTab === 'workshop'
                    ? 'bg-[#168BFF] text-white shadow-sm'
                    : 'text-[#9CB4C8] hover:text-[#EAF5FF]'
                }`}
              >
                Xưởng
              </button>
              <button
                onClick={() => setActiveCampusTab('device-type')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  activeCampusTab === 'device-type'
                    ? 'bg-[#168BFF] text-white shadow-sm'
                    : 'text-[#9CB4C8] hover:text-[#EAF5FF]'
                }`}
              >
                Loại thiết bị
              </button>
            </div>

            <div className="flex items-center gap-1 text-[#9CB4C8]">
              <button
                onClick={() => onToast?.('Chế độ toàn màn hình sơ đồ')}
                className="p-1 hover:text-[#00C8F0] rounded"
                title="Mở rộng"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onToast?.('Thu nhỏ sơ đồ')}
                className="p-1 hover:text-[#00C8F0] rounded"
                title="Thu nhỏ"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Campus / 2.5D Schematic Area */}
          <div className="relative my-3 min-h-[300px] rounded-lg bg-gradient-to-b from-[#081B2B] to-[#061522] border border-[#15324C]/80 overflow-hidden flex items-center justify-center p-4">
            {/* Background Grid Lines */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #00C8F0 1px, transparent 1px), linear-gradient(to right, #15324C 1px, transparent 1px), linear-gradient(to bottom, #15324C 1px, transparent 1px)',
                backgroundSize: '20px 20px, 40px 40px, 40px 40px'
              }}
            ></div>

            {/* Overlay Radios on Right */}
            <div className="absolute top-3 right-3 z-10 bg-[#0A2032]/90 backdrop-blur-md border border-[#15324C] rounded-lg p-2 flex flex-col gap-1.5 text-xs text-[#9CB4C8] shadow-lg">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#EAF5FF]">
                <input
                  type="radio"
                  name="campusNode"
                  checked={selectedMapNode === 'all'}
                  onChange={() => setSelectedMapNode('all')}
                  className="accent-[#00C8F0]"
                />
                Toàn bộ
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-[#00C8F0] font-semibold">
                <input
                  type="radio"
                  name="campusNode"
                  checked={selectedMapNode === 'factory-a'}
                  onChange={() => setSelectedMapNode('factory-a')}
                  className="accent-[#00C8F0]"
                />
                Nhà máy A
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#EAF5FF]">
                <input
                  type="radio"
                  name="campusNode"
                  checked={selectedMapNode === 'factory-b'}
                  onChange={() => setSelectedMapNode('factory-b')}
                  className="accent-[#00C8F0]"
                />
                Nhà máy B
              </label>
              <div className="h-px bg-[#15324C] my-0.5"></div>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#EAF5FF]">
                <input
                  type="radio"
                  name="campusNode"
                  checked={selectedMapNode === 'workshop-1'}
                  onChange={() => setSelectedMapNode('workshop-1')}
                  className="accent-[#00C8F0]"
                />
                Xưởng 1
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#EAF5FF]">
                <input
                  type="radio"
                  name="campusNode"
                  checked={selectedMapNode === 'workshop-2'}
                  onChange={() => setSelectedMapNode('workshop-2')}
                  className="accent-[#00C8F0]"
                />
                Xưởng 2
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#EAF5FF]">
                <input
                  type="radio"
                  name="campusNode"
                  checked={selectedMapNode === 'workshop-3'}
                  onChange={() => setSelectedMapNode('workshop-3')}
                  className="accent-[#00C8F0]"
                />
                Xưởng 3
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#EAF5FF]">
                <input
                  type="radio"
                  name="campusNode"
                  checked={selectedMapNode === 'workshop-4'}
                  onChange={() => setSelectedMapNode('workshop-4')}
                  className="accent-[#00C8F0]"
                />
                Xưởng 4
              </label>

              {/* 2D / 3D Switch */}
              <div className="flex items-center gap-1 mt-1 pt-1 border-t border-[#15324C]">
                <button
                  onClick={() => setMapMode('2D')}
                  className={`flex-1 py-0.5 text-[10px] font-bold rounded ${mapMode === '2D' ? 'bg-[#00C8F0] text-[#061522]' : 'bg-[#0D2940] text-[#9CB4C8]'}`}
                >
                  2D
                </button>
                <button
                  onClick={() => setMapMode('3D')}
                  className={`flex-1 py-0.5 text-[10px] font-bold rounded ${mapMode === '3D' ? 'bg-[#00C8F0] text-[#061522]' : 'bg-[#0D2940] text-[#9CB4C8]'}`}
                >
                  3D
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center justify-between gap-1 pt-1">
                <button
                  onClick={() => setMapZoom((prev) => Math.min(prev + 0.1, 1.5))}
                  className="p-1 rounded bg-[#0D2940] hover:text-[#00C8F0] hover:bg-[#15324C]"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setMapZoom((prev) => Math.max(prev - 0.1, 0.7))}
                  className="p-1 rounded bg-[#0D2940] hover:text-[#00C8F0] hover:bg-[#15324C]"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Campus SVG Graphic Representation matching reference image layout */}
            <div
              className="relative w-full max-w-[620px] h-[260px] transition-transform duration-300"
              style={{ transform: `scale(${mapZoom})` }}
            >
              {/* Central Factory Campus Graphic */}
              <svg className="w-full h-full" viewBox="0 0 600 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Isometric Base Grid Platform */}
                <polygon points="300,10 570,120 300,240 30,120" fill="#0A2032" stroke="#15324C" strokeWidth="2" opacity="0.8" />
                <polygon points="300,240 570,120 570,140 300,260 30,140 30,120" fill="#061522" stroke="#15324C" strokeWidth="1" />

                {/* Internal Pathways */}
                <path d="M 160 120 L 300 180 L 440 120 L 300 60 Z" fill="#0D2940" stroke="#00C8F0" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
              </svg>

              {/* Workshop Node 1: XƯỞNG 1 EDM (Green Status 5/6) */}
              <div
                onClick={() => {
                  setSelectedWorkshopFilter('Xưởng 1 EDM');
                  onToast?.('Đang lọc Xưởng 1 EDM');
                }}
                className="absolute top-[40px] left-[70px] bg-[#0A2032]/95 border-2 border-[#16D9A0] hover:border-[#00C8F0] rounded-xl p-2 shadow-xl shadow-[#16D9A0]/20 cursor-pointer transform hover:-translate-y-1 transition-all group z-10 w-36"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#16D9A0]/20 flex items-center justify-center text-[#16D9A0]">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[#EAF5FF] group-hover:text-[#00C8F0]">Xưởng 1</div>
                    <div className="text-[9px] text-[#9CB4C8] uppercase tracking-wider font-semibold">EDM</div>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-[#16D9A0] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16D9A0] animate-pulse"></span>
                    5/6
                  </span>
                  <span className="text-[9px] text-[#9CB4C8]">82% OEE</span>
                </div>
              </div>

              {/* Workshop Node 2: XƯỞNG 2 CNC (Amber Status 3/4) */}
              <div
                onClick={() => {
                  setSelectedWorkshopFilter('Xưởng 2 CNC');
                  onToast?.('Đang lọc Xưởng 2 CNC');
                }}
                className="absolute top-[130px] left-[150px] bg-[#0A2032]/95 border-2 border-[#FFB547] hover:border-[#00C8F0] rounded-xl p-2 shadow-xl shadow-[#FFB547]/20 cursor-pointer transform hover:-translate-y-1 transition-all group z-10 w-36"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#FFB547]/20 flex items-center justify-center text-[#FFB547]">
                    <Server className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[#EAF5FF] group-hover:text-[#00C8F0]">Xưởng 2</div>
                    <div className="text-[9px] text-[#9CB4C8] uppercase tracking-wider font-semibold">CNC</div>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-[#FFB547] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFB547]"></span>
                    3/4
                  </span>
                  <span className="text-[9px] text-[#9CB4C8]">76% OEE</span>
                </div>
              </div>

              {/* Workshop Node 3: XƯỞNG 3 KHÁC (Red/Amber Status 3/4) */}
              <div
                onClick={() => {
                  setSelectedWorkshopFilter('Xưởng 3 Khác');
                  onToast?.('Đang lọc Xưởng 3 Khác');
                }}
                className="absolute top-[40px] right-[110px] bg-[#0A2032]/95 border-2 border-[#FF5263] hover:border-[#00C8F0] rounded-xl p-2 shadow-xl shadow-[#FF5263]/20 cursor-pointer transform hover:-translate-y-1 transition-all group z-10 w-36"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#FF5263]/20 flex items-center justify-center text-[#FF5263]">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[#EAF5FF] group-hover:text-[#00C8F0]">Xưởng 3</div>
                    <div className="text-[9px] text-[#9CB4C8] uppercase tracking-wider font-semibold">Khác</div>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-[#FF5263] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5263]"></span>
                    3/4
                  </span>
                  <span className="text-[9px] text-[#9CB4C8]">68% OEE</span>
                </div>
              </div>

              {/* Workshop Node 4: XƯỞNG 4 LẮP RÁP (Red/Amber Status 2/4) */}
              <div
                onClick={() => {
                  setSelectedWorkshopFilter('Xưởng 4 Lắp ráp');
                  onToast?.('Đang lọc Xưởng 4 Lắp ráp');
                }}
                className="absolute top-[135px] right-[180px] bg-[#0A2032]/95 border-2 border-[#FF5263] hover:border-[#00C8F0] rounded-xl p-2 shadow-xl shadow-[#FF5263]/20 cursor-pointer transform hover:-translate-y-1 transition-all group z-10 w-36"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#FF5263]/20 flex items-center justify-center text-[#FF5263]">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[#EAF5FF] group-hover:text-[#00C8F0]">Xưởng 4</div>
                    <div className="text-[9px] text-[#9CB4C8] uppercase tracking-wider font-semibold">Lắp ráp</div>
                  </div>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-[#FF5263] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF5263]"></span>
                    2/4
                  </span>
                  <span className="text-[9px] text-[#9CB4C8]">74% OEE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#15324C]/60 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5 text-[#16D9A0]">
                <span className="w-2 h-2 rounded-full bg-[#16D9A0]"></span>
                Đang chạy
              </span>
              <span className="flex items-center gap-1.5 text-[#168BFF]">
                <span className="w-2 h-2 rounded-full bg-[#168BFF]"></span>
                Dừng kế hoạch
              </span>
              <span className="flex items-center gap-1.5 text-[#FF5263]">
                <span className="w-2 h-2 rounded-full bg-[#FF5263]"></span>
                Dừng sự cố
              </span>
              <span className="flex items-center gap-1.5 text-[#FFB547]">
                <span className="w-2 h-2 rounded-full bg-[#FFB547]"></span>
                Bảo trì
              </span>
              <span className="flex items-center gap-1.5 text-[#9CB4C8]">
                <span className="w-2 h-2 rounded-full bg-[#64748B]"></span>
                Ngoại tuyến
              </span>
            </div>
            <button
              onClick={() => onNavigateToTab?.('devices')}
              className="text-[#00C8F0] hover:underline text-xs font-semibold flex items-center gap-1"
            >
              Xem chi tiết thiết bị <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* PANEL 2: HIỆU SUẤT THEO XƯỞNG (OEE) (5 COLS) */}
        <div className="lg:col-span-5 bg-[#0A2032] border border-[#15324C] rounded-xl p-4 flex flex-col justify-between shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#15324C]/80 pb-3">
            <h2 className="text-sm font-bold text-[#EAF5FF] flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-[#00C8F0]" />
              Hiệu suất theo xưởng (OEE)
            </h2>
            <button className="text-[10px] text-[#9CB4C8]">✕</button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] my-2 flex-wrap">
            <span className="flex items-center gap-1 text-[#00C8F0]">
              <span className="w-2 h-2 rounded-full bg-[#00C8F0]"></span>
              OEE
            </span>
            <span className="flex items-center gap-1 text-[#16D9A0]">
              <span className="w-2 h-2 rounded-full bg-[#16D9A0]"></span>
              Thời gian chạy
            </span>
            <span className="flex items-center gap-1 text-[#FFB547]">
              <span className="w-2 h-2 rounded-full bg-[#FFB547]"></span>
              Dừng kế hoạch
            </span>
            <span className="flex items-center gap-1 text-[#FF5263]">
              <span className="w-2 h-2 rounded-full bg-[#FF5263]"></span>
              Dừng sự cố
            </span>
          </div>

          {/* Bar Chart */}
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workshopPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#15324C" vertical={false} />
                <XAxis dataKey="workshop" stroke="#9CB4C8" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CB4C8" fontSize={11} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#081B2B', borderColor: '#15324C', borderRadius: '8px', fontSize: '11px', color: '#EAF5FF' }}
                  itemStyle={{ color: '#EAF5FF' }}
                />
                <Bar dataKey="oee" name="OEE %" fill="#00C8F0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="runtime" name="Chạy %" fill="#16D9A0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="plannedStop" name="Dừng KH %" fill="#FFB547" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-[#9CB4C8] text-center pt-2 border-t border-[#15324C]/60 flex items-center justify-between">
            <span>Dữ liệu OEE tính toán tự động từ telemetry máy</span>
            <span className="text-[#16D9A0] font-semibold">TB Toàn xưởng: 76%</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 2: PANEL 3 (CẢNH BÁO MỚI NHẤT) & PANEL 4 (AI CHẨN ĐOÁN ĐỀ XUẤT) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* PANEL 3: CẢNH BÁO MỚI NHẤT (6 COLS) */}
        <div className="lg:col-span-6 bg-[#0A2032] border border-[#15324C] rounded-xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between border-b border-[#15324C]/80 pb-3">
            <h2 className="text-sm font-bold text-[#EAF5FF] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#FF5263]" />
              Cảnh báo mới nhất
            </h2>
            <button
              onClick={() => onNavigateToTab?.('notifications')}
              className="text-xs text-[#00C8F0] hover:underline font-semibold"
            >
              Xem tất cả (3)
            </button>
          </div>

          <div className="overflow-x-auto my-2 custom-tower-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#15324C] text-[#9CB4C8]">
                  <th className="py-2 px-2 font-medium">Thời gian</th>
                  <th className="py-2 px-2 font-medium">Thiết bị</th>
                  <th className="py-2 px-2 font-medium">Nội dung cảnh báo</th>
                  <th className="py-2 px-2 font-medium text-right">Mức độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15324C]/60">
                {/* Alert 1 */}
                <tr
                  onClick={() => {
                    const dev = devices.find((d) => d.code === 'EDM-03') || devices[0];
                    if (dev) onOpenDiagnosis(dev);
                  }}
                  className="hover:bg-[#0D2940] cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-2 font-mono text-[#FF5263] flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    10:24
                  </td>
                  <td className="py-2.5 px-2 font-bold text-[#EAF5FF]">EDM-03</td>
                  <td className="py-2.5 px-2 text-[#EAF5FF]">Nhiệt độ trục chính tăng bất thường...</td>
                  <td className="py-2.5 px-2 text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF5263]/20 text-[#FF5263] border border-[#FF5263]/40">
                      Cao
                    </span>
                  </td>
                </tr>

                {/* Alert 2 */}
                <tr
                  onClick={() => {
                    const dev = devices.find((d) => d.code === 'CNC-02') || devices[1];
                    if (dev) onOpenDiagnosis(dev);
                  }}
                  className="hover:bg-[#0D2940] cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-2 font-mono text-[#FFB547] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    09:18
                  </td>
                  <td className="py-2.5 px-2 font-bold text-[#EAF5FF]">CNC-02</td>
                  <td className="py-2.5 px-2 text-[#EAF5FF]">Rò rỉ áp lực thủy lực</td>
                  <td className="py-2.5 px-2 text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFB547]/20 text-[#FFB547] border border-[#FFB547]/40">
                      Trung bình
                    </span>
                  </td>
                </tr>

                {/* Alert 3 */}
                <tr
                  onClick={() => {
                    const dev = devices.find((d) => d.code === 'EDM-01') || devices[0];
                    if (dev) onOpenDiagnosis(dev);
                  }}
                  className="hover:bg-[#0D2940] cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-2 font-mono text-[#FFB547] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    08:45
                  </td>
                  <td className="py-2.5 px-2 font-bold text-[#EAF5FF]">EDM-01</td>
                  <td className="py-2.5 px-2 text-[#EAF5FF]">Áp suất nước thấp 0.8 MPa</td>
                  <td className="py-2.5 px-2 text-right">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFB547]/20 text-[#FFB547] border border-[#FFB547]/40">
                      Trung bình
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-[#15324C]/60 flex items-center justify-between text-xs text-[#9CB4C8]">
            <span>Đã kết nối cảm biến IoT thời gian thực</span>
            <button
              onClick={() => onNavigateToTab?.('notifications')}
              className="text-[#00C8F0] hover:underline flex items-center gap-1 font-semibold"
            >
              Mở trung tâm cảnh báo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* PANEL 4: AI CHẨN ĐOÁN ĐỀ XUẤT (6 COLS) */}
        <div className="lg:col-span-6 bg-[#0A2032] border border-[#15324C] rounded-xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between border-b border-[#15324C]/80 pb-3">
            <h2 className="text-sm font-bold text-[#EAF5FF] flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-[#00C8F0]" />
              AI chẩn đoán đề xuất
            </h2>
            <button
              onClick={() => onNavigateToTab?.('ai-diagnosis')}
              className="text-xs text-[#00C8F0] hover:underline font-semibold"
            >
              Xem tất cả
            </button>
          </div>

          {/* 3 AI Recommendations matching reference */}
          <div className="space-y-2.5 my-2">
            {/* Recommendation 1 */}
            <div className="bg-[#081B2B] border border-[#15324C] hover:border-[#00C8F0]/60 rounded-lg p-2.5 flex items-center justify-between gap-3 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0A2032] border border-[#15324C] flex items-center justify-center text-[#00C8F0] overflow-hidden">
                  <Cpu className="w-5 h-5 text-[#FF5263]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#EAF5FF]">EDM-03</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#16D9A0]/20 text-[#16D9A0] border border-[#16D9A0]/40">
                      Độ tin cậy: Cao
                    </span>
                  </div>
                  <div className="text-xs text-[#9CB4C8] mt-0.5">Nhiệt độ trục chính tăng bất thường</div>
                </div>
              </div>
              <button
                onClick={() => {
                  const dev = devices.find((d) => d.code === 'EDM-03') || devices[0];
                  if (dev) onOpenDiagnosis(dev);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-[#00C8F0]/10 hover:bg-[#00C8F0]/20 text-[#00C8F0] border border-[#00C8F0]/40 transition-colors whitespace-nowrap"
              >
                Xem chi tiết
              </button>
            </div>

            {/* Recommendation 2 */}
            <div className="bg-[#081B2B] border border-[#15324C] hover:border-[#00C8F0]/60 rounded-lg p-2.5 flex items-center justify-between gap-3 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0A2032] border border-[#15324C] flex items-center justify-center text-[#00C8F0] overflow-hidden">
                  <Zap className="w-5 h-5 text-[#FFB547]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#EAF5FF]">CNC-02</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#FFB547]/20 text-[#FFB547] border border-[#FFB547]/40">
                      Độ tin cậy: Trung bình
                    </span>
                  </div>
                  <div className="text-xs text-[#9CB4C8] mt-0.5">Dòng điện vượt ngưỡng cho phép</div>
                </div>
              </div>
              <button
                onClick={() => {
                  const dev = devices.find((d) => d.code === 'CNC-02') || devices[1];
                  if (dev) onOpenDiagnosis(dev);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-[#00C8F0]/10 hover:bg-[#00C8F0]/20 text-[#00C8F0] border border-[#00C8F0]/40 transition-colors whitespace-nowrap"
              >
                Xem chi tiết
              </button>
            </div>

            {/* Recommendation 3 */}
            <div className="bg-[#081B2B] border border-[#15324C] hover:border-[#00C8F0]/60 rounded-lg p-2.5 flex items-center justify-between gap-3 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#0A2032] border border-[#15324C] flex items-center justify-center text-[#00C8F0] overflow-hidden">
                  <Activity className="w-5 h-5 text-[#00C8F0]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#EAF5FF]">EDM-01</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#FFB547]/20 text-[#FFB547] border border-[#FFB547]/40">
                      Độ tin cậy: Trung bình
                    </span>
                  </div>
                  <div className="text-xs text-[#9CB4C8] mt-0.5">Xu hướng rung động tăng dần theo thời gian</div>
                </div>
              </div>
              <button
                onClick={() => {
                  const dev = devices.find((d) => d.code === 'EDM-01') || devices[0];
                  if (dev) onOpenDiagnosis(dev);
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-[#00C8F0]/10 hover:bg-[#00C8F0]/20 text-[#00C8F0] border border-[#00C8F0]/40 transition-colors whitespace-nowrap"
              >
                Xem chi tiết
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-[#15324C]/60 flex items-center justify-between text-xs text-[#9CB4C8]">
            <span>Mô hình Gemini AI suy luận từ 5.000+ ca sự cố</span>
            <button
              onClick={() => onNavigateToTab?.('ai-diagnosis')}
              className="text-[#00C8F0] hover:underline flex items-center gap-1 font-semibold"
            >
              Mở RCA chẩn đoán <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 3: PANEL 5 (DANH SÁCH THIẾT BỊ 18)                         */}
      {/* ============================================================== */}
      <div className="bg-[#0A2032] border border-[#15324C] rounded-xl p-4 shadow-xl">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#15324C]/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00C8F0]"></span>
            <h2 className="text-sm font-bold text-[#EAF5FF]">
              Danh sách thiết bị ({filteredDevices.length})
            </h2>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CB4C8]" />
              <input
                type="text"
                value={deviceSearchTerm}
                onChange={(e) => setDeviceSearchTerm(e.target.value)}
                placeholder="Tìm thiết bị, mã thiết bị..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#081B2B] border border-[#15324C] rounded-lg text-[#EAF5FF] placeholder-[#9CB4C8] focus:border-[#00C8F0] focus:outline-none"
              />
            </div>

            {/* Workshop Dropdown */}
            <select
              value={selectedWorkshopFilter}
              onChange={(e) => setSelectedWorkshopFilter(e.target.value as any)}
              className="py-1.5 px-2.5 text-xs bg-[#081B2B] border border-[#15324C] rounded-lg text-[#EAF5FF] focus:border-[#00C8F0] focus:outline-none"
            >
              <option value="ALL">Tất cả xưởng</option>
              <option value="Xưởng 1 EDM">Xưởng 1 EDM</option>
              <option value="Xưởng 2 CNC">Xưởng 2 CNC</option>
              <option value="Xưởng 3 Khác">Xưởng 3 Khác</option>
              <option value="Xưởng 4 Lắp ráp">Xưởng 4 Lắp ráp</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="py-1.5 px-2.5 text-xs bg-[#081B2B] border border-[#15324C] rounded-lg text-[#EAF5FF] focus:border-[#00C8F0] focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="RUNNING">Đang chạy</option>
              <option value="ALARM_STOPPED">Cảnh báo / Dừng sự cố</option>
              <option value="IDLE">Dừng kế hoạch</option>
              <option value="MAINTENANCE">Bảo trì</option>
            </select>
          </div>
        </div>

        {/* Table of 18 devices */}
        <div className="overflow-x-auto mt-3 custom-tower-scrollbar max-h-[340px]">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-[#0A2032] z-10">
              <tr className="border-b border-[#15324C] text-[#9CB4C8]">
                <th className="py-2.5 px-3 font-semibold">Thiết bị</th>
                <th className="py-2.5 px-3 font-semibold">Xưởng</th>
                <th className="py-2.5 px-3 font-semibold">Loại</th>
                <th className="py-2.5 px-3 font-semibold">Trạng thái</th>
                <th className="py-2.5 px-3 font-semibold">Nhiệt độ</th>
                <th className="py-2.5 px-3 font-semibold">Dòng điện</th>
                <th className="py-2.5 px-3 font-semibold">Rung động</th>
                <th className="py-2.5 px-3 font-semibold">OEE</th>
                <th className="py-2.5 px-3 font-semibold text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#15324C]/50">
              {filteredDevices.map((device) => {
                const isAlarm = device.status === 'ALARM_STOPPED';
                const isRunning = device.status === 'RUNNING';
                const isIdle = device.status === 'IDLE' || device.status === 'MAINTENANCE_SCHEDULED';

                return (
                  <tr
                    key={device.id}
                    className="hover:bg-[#0D2940] transition-colors group cursor-pointer"
                    onClick={() => onOpenMachineDetails(device)}
                  >
                    {/* Machine Name & Code */}
                    <td className="py-2.5 px-3 font-bold text-[#EAF5FF] flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-[#081B2B] border border-[#15324C] flex items-center justify-center text-[#00C8F0]">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-mono text-[#00C8F0] group-hover:underline">{device.code}</div>
                        <div className="text-[10px] text-[#9CB4C8] font-normal">{device.name}</div>
                      </div>
                    </td>

                    {/* Workshop */}
                    <td className="py-2.5 px-3 text-[#9CB4C8] font-medium">{getDeviceWorkshop(device)}</td>

                    {/* Machine Type */}
                    <td className="py-2.5 px-3 text-[#EAF5FF]">{device.type}</td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3">
                      {isRunning ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#16D9A0]/20 text-[#16D9A0] border border-[#16D9A0]/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16D9A0] animate-pulse"></span>
                          Đang chạy
                        </span>
                      ) : isAlarm ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF5263]/20 text-[#FF5263] border border-[#FF5263]/40">
                          <AlertTriangle className="w-3 h-3" />
                          Cảnh báo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#168BFF]/20 text-[#168BFF] border border-[#168BFF]/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#168BFF]"></span>
                          Dừng KH
                        </span>
                      )}
                    </td>

                    {/* Telemetry Temp */}
                    <td className="py-2.5 px-3 font-mono font-medium">
                      <span className={device.telemetry?.dielectricTemp && device.telemetry.dielectricTemp > 45 ? 'text-[#FF5263] font-bold' : 'text-[#EAF5FF]'}>
                        {device.telemetry?.dielectricTemp || 42}°C
                      </span>
                    </td>

                    {/* Current */}
                    <td className="py-2.5 px-3 font-mono font-medium text-[#EAF5FF]">
                      {device.telemetry?.peakCurrent || 12.4} A
                    </td>

                    {/* Vibration */}
                    <td className="py-2.5 px-3 font-mono font-medium text-[#EAF5FF]">
                      {device.telemetry?.vibration || 0.6} mm/s
                    </td>

                    {/* OEE */}
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span className={device.telemetry?.oee && device.telemetry.oee < 60 ? 'text-[#FF5263]' : 'text-[#16D9A0]'}>
                        {device.telemetry?.oee || 82}%
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onOpenTelemetryHistory(device)}
                          className="p-1 rounded bg-[#081B2B] hover:bg-[#00C8F0]/20 text-[#00C8F0] border border-[#15324C]"
                          title="Lịch sử đo đạc & Biểu đồ"
                        >
                          <LineChartIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenRepairReport(device)}
                          className="p-1 rounded bg-[#081B2B] hover:bg-[#FFB547]/20 text-[#FFB547] border border-[#15324C]"
                          title="Ghi chú sửa chữa / Lệnh bảo trì"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenDiagnosis(device)}
                          className="p-1 rounded bg-[#081B2B] hover:bg-[#16D9A0]/20 text-[#16D9A0] border border-[#15324C]"
                          title="AI Chẩn đoán"
                        >
                          <Brain className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 4: PANEL 6 (LỆNH BẢO TRÌ & CÔNG VIỆC) & PANEL 7 (KỸ THUẬT VIÊN HIỆN TRƯỜNG) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* PANEL 6: LỆNH BẢO TRÌ & CÔNG VIỆC (7 COLS) */}
        <div className="lg:col-span-7 bg-[#0A2032] border border-[#15324C] rounded-xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#15324C]/80 pb-3">
            <h2 className="text-sm font-bold text-[#EAF5FF] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#168BFF]" />
              Lệnh bảo trì & công việc
            </h2>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-[#061522] p-1 rounded-lg border border-[#15324C]">
              <button
                onClick={() => setWorkOrderTab('IN_PROGRESS')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  workOrderTab === 'IN_PROGRESS'
                    ? 'bg-[#168BFF] text-white shadow-sm'
                    : 'text-[#9CB4C8] hover:text-[#EAF5FF]'
                }`}
              >
                Đang xử lý (5)
              </button>
              <button
                onClick={() => setWorkOrderTab('PENDING_APPROVAL')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  workOrderTab === 'PENDING_APPROVAL'
                    ? 'bg-[#168BFF] text-white shadow-sm'
                    : 'text-[#9CB4C8] hover:text-[#EAF5FF]'
                }`}
              >
                Chờ duyệt (4)
              </button>
              <button
                onClick={() => setWorkOrderTab('COMPLETED')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  workOrderTab === 'COMPLETED'
                    ? 'bg-[#168BFF] text-white shadow-sm'
                    : 'text-[#9CB4C8] hover:text-[#EAF5FF]'
                }`}
              >
                Hoàn thành (3)
              </button>
            </div>

            <button
              onClick={() => onNavigateToTab?.('maintenance')}
              className="text-xs text-[#00C8F0] hover:underline font-semibold"
            >
              Xem tất cả
            </button>
          </div>

          <div className="overflow-x-auto my-2 custom-tower-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#15324C] text-[#9CB4C8]">
                  <th className="py-2 px-2 font-medium">Ưu tiên</th>
                  <th className="py-2 px-2 font-medium">Thiết bị</th>
                  <th className="py-2 px-2 font-medium">Nội dung công việc</th>
                  <th className="py-2 px-2 font-medium">Người phụ trách</th>
                  <th className="py-2 px-2 font-medium">Hạn hoàn thành</th>
                  <th className="py-2 px-2 font-medium text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15324C]/60">
                {filteredWorkOrders.map((wo) => (
                  <tr
                    key={wo.id}
                    onClick={() => {
                      const dev = devices.find((d) => d.code === wo.deviceCode) || devices[0];
                      if (dev) onOpenRepairReport(dev);
                    }}
                    className="hover:bg-[#0D2940] cursor-pointer transition-colors"
                  >
                    <td className="py-2 px-2">
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${wo.priorityColor}`}>
                        {wo.priorityLabel}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-bold font-mono text-[#EAF5FF]">{wo.deviceCode}</td>
                    <td className="py-2 px-2 text-[#EAF5FF]">{wo.title}</td>
                    <td className="py-2 px-2 text-[#9CB4C8] flex items-center gap-1">
                      <User className="w-3 h-3 text-[#00C8F0]" />
                      {wo.technician}
                    </td>
                    <td className="py-2 px-2 font-mono text-[#9CB4C8]">{wo.deadline}</td>
                    <td className="py-2 px-2 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${wo.statusColor}`}>
                        {wo.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-[#15324C]/60 flex items-center justify-between text-xs text-[#9CB4C8]">
            <span>Tổng cộng 12 lệnh bảo trì trong hệ thống</span>
            <button
              onClick={() => onNavigateToTab?.('maintenance')}
              className="text-[#00C8F0] hover:underline flex items-center gap-1 font-semibold"
            >
              Mở sổ lịch sử bảo trì <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* PANEL 7: KỸ THUẬT VIÊN HIỆN TRƯỜNG (5 COLS) */}
        <div className="lg:col-span-5 bg-[#0A2032] border border-[#15324C] rounded-xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between border-b border-[#15324C]/80 pb-3">
            <h2 className="text-sm font-bold text-[#EAF5FF] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#16D9A0]" />
              Kỹ thuật viên hiện trường
            </h2>
            <button
              onClick={() => onNavigateToTab?.('technician-eval')}
              className="text-xs text-[#00C8F0] hover:underline font-semibold"
            >
              Xem tất cả (8)
            </button>
          </div>

          {/* Search bar */}
          <div className="my-2 relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CB4C8]" />
            <input
              type="text"
              value={techSearchTerm}
              onChange={(e) => setTechSearchTerm(e.target.value)}
              placeholder="Tìm kỹ thuật viên..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-[#081B2B] border border-[#15324C] rounded-lg text-[#EAF5FF] placeholder-[#9CB4C8] focus:border-[#00C8F0] focus:outline-none"
            />
          </div>

          {/* Techs list */}
          <div className="overflow-x-auto custom-tower-scrollbar max-h-[220px]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#15324C] text-[#9CB4C8]">
                  <th className="py-1.5 px-2 font-medium">Tên</th>
                  <th className="py-1.5 px-2 font-medium">Trạng thái</th>
                  <th className="py-1.5 px-2 font-medium">Hiệu suất tuần</th>
                  <th className="py-1.5 px-2 font-medium text-right">Số công việc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15324C]/60">
                {filteredTechs.map((tech, idx) => {
                  const isOnDuty = tech.activeStatus === 'ON_DUTY';
                  const isBusy = tech.activeStatus === 'BUSY';
                  const weeklyScore = idx === 0 ? 80 : idx === 1 ? 60 : idx === 2 ? 0 : idx === 3 ? 40 : idx === 4 ? 75 : idx === 5 ? 90 : idx === 6 ? 85 : 0;
                  const jobsCount = isOnDuty ? (idx === 0 || idx === 5 ? 2 : 1) : 0;

                  return (
                    <tr
                      key={tech.id}
                      onClick={() => onToast?.(`Kỹ thuật viên ${tech.name} - Chức vụ: ${tech.role}`)}
                      className="hover:bg-[#0D2940] cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-2 font-semibold text-[#EAF5FF] flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#168BFF]/20 border border-[#168BFF]/40 flex items-center justify-center text-[10px] text-[#00C8F0] font-bold">
                          {tech.name.charAt(tech.name.lastIndexOf(' ') + 1) || 'K'}
                        </div>
                        <span>{tech.name}</span>
                      </td>
                      <td className="py-2 px-2">
                        {isOnDuty ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#16D9A0]/20 text-[#16D9A0] border border-[#16D9A0]/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16D9A0]"></span>
                            Đang làm việc
                          </span>
                        ) : isBusy ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FFB547]/20 text-[#FFB547] border border-[#FFB547]/40">
                            Bận việc
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#00C8F0]/20 text-[#00C8F0] border border-[#00C8F0]/40">
                            Sẵn sàng
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 font-mono font-bold">
                        <div className="flex items-center gap-1.5">
                          <span className={weeklyScore > 70 ? 'text-[#16D9A0]' : 'text-[#EAF5FF]'}>{weeklyScore}%</span>
                          <div className="w-12 h-1.5 bg-[#081B2B] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#16D9A0] rounded-full"
                              style={{ width: `${weeklyScore}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-[#EAF5FF] font-bold">
                        {jobsCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-[#15324C]/60 flex items-center justify-between text-xs text-[#9CB4C8]">
            <span>6 đang xử lý ca trực • 2 đang chờ điều phối</span>
            <button
              onClick={() => onNavigateToTab?.('technician-eval')}
              className="text-[#00C8F0] hover:underline flex items-center gap-1 font-semibold"
            >
              Xem ma trận kỹ năng <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 5: PANEL 8 (XU HƯỚNG VẬN HÀNH), PANEL 9 (PHÂN BỐ TRẠNG THÁI), PANEL 10 (TOP SỰ CỐ) & PANEL 11 (THÔNG BÁO) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* PANEL 8: XU HƯỚNG VẬN HÀNH (4 COLS) */}
        <div className="lg:col-span-4 bg-[#0A2032] border border-[#15324C] rounded-xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between border-b border-[#15324C]/80 pb-2.5">
            <h2 className="text-sm font-bold text-[#EAF5FF] flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#00C8F0]" />
              Xu hướng vận hành
            </h2>
            <select
              value={trendTimeRange}
              onChange={(e) => setTrendTimeRange(e.target.value)}
              className="py-0.5 px-2 text-[10px] bg-[#081B2B] border border-[#15324C] rounded text-[#EAF5FF] focus:outline-none"
            >
              <option value="24h">24 giờ ⌄</option>
              <option value="7d">7 ngày</option>
              <option value="30d">30 ngày</option>
            </select>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 my-2 bg-[#061522] p-1 rounded-lg border border-[#15324C]">
            <button
              onClick={() => setTrendMetric('temp')}
              className={`flex-1 py-1 text-center text-xs font-semibold rounded ${
                trendMetric === 'temp' ? 'bg-[#168BFF] text-white' : 'text-[#9CB4C8] hover:text-[#EAF5FF]'
              }`}
            >
              Nhiệt độ
            </button>
            <button
              onClick={() => setTrendMetric('current')}
              className={`flex-1 py-1 text-center text-xs font-semibold rounded ${
                trendMetric === 'current' ? 'bg-[#168BFF] text-white' : 'text-[#9CB4C8] hover:text-[#EAF5FF]'
              }`}
            >
              Dòng điện
            </button>
            <button
              onClick={() => setTrendMetric('vibration')}
              className={`flex-1 py-1 text-center text-xs font-semibold rounded ${
                trendMetric === 'vibration' ? 'bg-[#168BFF] text-white' : 'text-[#9CB4C8] hover:text-[#EAF5FF]'
              }`}
            >
              Rung động
            </button>
            <button
              onClick={() => setTrendMetric('oee')}
              className={`flex-1 py-1 text-center text-xs font-semibold rounded ${
                trendMetric === 'oee' ? 'bg-[#168BFF] text-white' : 'text-[#9CB4C8] hover:text-[#EAF5FF]'
              }`}
            >
              OEE
            </button>
          </div>

          {/* Line Chart */}
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#15324C" vertical={false} />
                <XAxis dataKey="time" stroke="#9CB4C8" fontSize={10} tickLine={false} />
                <YAxis stroke="#9CB4C8" fontSize={10} tickLine={false} domain={[20, 60]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#081B2B', borderColor: '#15324C', borderRadius: '8px', fontSize: '11px', color: '#EAF5FF' }}
                />
                <Line type="monotone" dataKey="EDM-01" stroke="#00C8F0" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="EDM-02" stroke="#16D9A0" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="CNC-02" stroke="#FFB547" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="CNC-01" stroke="#E83D84" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-3 pt-2 border-t border-[#15324C]/60 text-[10px] text-[#9CB4C8] flex-wrap">
            <span className="flex items-center gap-1 text-[#00C8F0]">
              <span className="w-2 h-0.5 bg-[#00C8F0]"></span> EDM-01
            </span>
            <span className="flex items-center gap-1 text-[#16D9A0]">
              <span className="w-2 h-0.5 bg-[#16D9A0]"></span> EDM-02
            </span>
            <span className="flex items-center gap-1 text-[#FFB547]">
              <span className="w-2 h-0.5 bg-[#FFB547]"></span> CNC-02
            </span>
            <span className="flex items-center gap-1 text-[#E83D84]">
              <span className="w-2 h-0.5 bg-[#E83D84]"></span> CNC-01
            </span>
          </div>
        </div>

        {/* PANEL 9: PHÂN BỐ TRẠNG THÁI THIẾT BỊ (3 COLS) */}
        <div className="lg:col-span-3 bg-[#0A2032] border border-[#15324C] rounded-xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between border-b border-[#15324C]/80 pb-2.5">
            <h2 className="text-sm font-bold text-[#EAF5FF] flex items-center gap-1.5">
              <Server className="w-4 h-4 text-[#00C8F0]" />
              Phân bố trạng thái thiết bị
            </h2>
            <button className="text-[10px] text-[#9CB4C8]">✕</button>
          </div>

          <div className="flex items-center justify-between my-2">
            {/* Donut Chart with center label */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={54}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-bold font-mono text-[#EAF5FF]">18</span>
                <span className="text-[9px] text-[#9CB4C8] uppercase tracking-wider font-semibold">Thiết bị</span>
              </div>
            </div>

            {/* Legend list */}
            <div className="space-y-1.5 text-[11px] text-[#9CB4C8] flex-1 pl-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#16D9A0]">
                  <span className="w-2 h-2 rounded-full bg-[#16D9A0]"></span>
                  Đang chạy
                </span>
                <span className="font-mono font-bold text-[#EAF5FF]">14 (78%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#168BFF]">
                  <span className="w-2 h-2 rounded-full bg-[#168BFF]"></span>
                  Dừng kế hoạch
                </span>
                <span className="font-mono font-bold text-[#EAF5FF]">3 (17%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#FF5263]">
                  <span className="w-2 h-2 rounded-full bg-[#FF5263]"></span>
                  Dừng sự cố
                </span>
                <span className="font-mono font-bold text-[#EAF5FF]">1 (5%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#FFB547]">
                  <span className="w-2 h-2 rounded-full bg-[#FFB547]"></span>
                  Bảo trì
                </span>
                <span className="font-mono font-bold text-[#EAF5FF]">0 (0%)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[#64748B]">
                  <span className="w-2 h-2 rounded-full bg-[#64748B]"></span>
                  Ngoại tuyến
                </span>
                <span className="font-mono font-bold text-[#EAF5FF]">0 (0%)</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#15324C]/60 text-center text-[10px] text-[#9CB4C8]">
            Đồng bộ dữ liệu cảm biến PLC/SCADA mỗi 30s
          </div>
        </div>

        {/* PANEL 10: TOP 5 SỰ CỐ THƯỜNG GẶP (2.5 COLS ~ 2 COLS) & PANEL 11 (3 COLS) */}
        <div className="lg:col-span-2 bg-[#0A2032] border border-[#15324C] rounded-xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between border-b border-[#15324C]/80 pb-2.5">
            <h2 className="text-xs font-bold text-[#EAF5FF] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#FFB547]" />
              Top 5 sự cố
            </h2>
            <span className="text-[10px] text-[#00C8F0] font-semibold">30 ngày ⌄</span>
          </div>

          {/* Progress Bars */}
          <div className="space-y-2.5 my-2">
            {frequentFaults.map((f, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-[#9CB4C8] truncate max-w-[100px]">{f.title}</span>
                  <span className="font-mono font-bold text-[#00C8F0]">{f.count}</span>
                </div>
                <div className="w-full h-2 bg-[#081B2B] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#168BFF] to-[#00C8F0] rounded-full"
                    style={{ width: `${(f.count / f.max) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#15324C]/60 text-center text-[10px] text-[#9CB4C8]">
            Thống kê từ hệ thống AI RCA
          </div>
        </div>

        {/* PANEL 11: THÔNG BÁO HỆ THỐNG (3 COLS) */}
        <div className="lg:col-span-3 bg-[#0A2032] border border-[#15324C] rounded-xl p-4 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between border-b border-[#15324C]/80 pb-2.5">
            <h2 className="text-xs font-bold text-[#EAF5FF] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#00C8F0]" />
              Thông báo hệ thống
            </h2>
            <button
              onClick={() => onNavigateToTab?.('notifications')}
              className="text-[10px] text-[#00C8F0] hover:underline font-semibold"
            >
              Xem tất cả
            </button>
          </div>

          <div className="overflow-x-auto my-1 custom-tower-scrollbar max-h-[190px]">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-[#15324C] text-[#9CB4C8]">
                  <th className="py-1 px-1 font-medium">Thời gian</th>
                  <th className="py-1 px-1 font-medium">Nội dung</th>
                  <th className="py-1 px-1 font-medium text-right">Mức độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#15324C]/50">
                {systemNotifications.map((sn, i) => (
                  <tr key={i} className="hover:bg-[#0D2940] transition-colors">
                    <td className="py-1.5 px-1 font-mono text-[#9CB4C8] whitespace-nowrap">{sn.time}</td>
                    <td className="py-1.5 px-1 text-[#EAF5FF] truncate max-w-[140px]" title={sn.message}>
                      {sn.message}
                    </td>
                    <td className="py-1.5 px-1 text-right">
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${sn.levelColor}`}>
                        {sn.level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-[#15324C]/60 text-center text-[10px] text-[#9CB4C8]">
            5 thông báo mới nhất trong ca trực
          </div>
        </div>
      </div>
    </div>
  );
};
