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
  FileCheck,
  FileText,
  Filter,
  Flame,
  Layers,
  LineChart as LineChartIcon,
  Maximize2,
  Minimize2,
  Radio,
  Search,
  Server,
  Sparkles,
  User,
  Users,
  Wrench,
  Zap,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  BarChart2,
  Info,
  Check,
  TrendingUp,
  Settings
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
import { AIVibrationFailurePredictionModal } from './AIVibrationFailurePredictionModal';

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
  onOpenFailurePrediction?: (device: Device) => void;
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
  onOpenFailurePrediction,
  onAcknowledgeIncident,
  onOpenWeeklyReport,
  onNavigateToTab,
  onToast
}) => {
  // Filters & State
  const [deviceSearchTerm, setDeviceSearchTerm] = useState('');
  const [selectedD3Device, setSelectedD3Device] = useState<Device | null>(null);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [mapMode, setMapMode] = useState<'2D' | '3D'>('3D');
  const [selectedMapFilter, setSelectedMapFilter] = useState<string>('all');
  const [activeCampusTab, setActiveCampusTab] = useState<'overview' | 'plantA' | 'plantB' | 'ws1' | 'ws2'>('overview');
  const [trendDays, setTrendDays] = useState<'7' | '14' | '30'>('7');

  // Helper to determine workshop from device location or code
  const getDeviceWorkshop = (d: Device): string => {
    if (d.location?.includes('Xưởng 1') || d.code.startsWith('EDM-01') || d.code.startsWith('EDM-02')) return 'Xưởng 1';
    if (d.location?.includes('Xưởng 2') || d.code.startsWith('EDM-03') || d.code.startsWith('CNC-01')) return 'Xưởng 2';
    if (d.location?.includes('Xưởng 3') || d.code.startsWith('CNC-02') || d.code.includes('S0')) return 'Xưởng 3';
    return d.location || 'Xưởng 1';
  };

  // Filtered devices for Panel 5
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const matchSearch =
        d.code.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
        d.name.toLowerCase().includes(deviceSearchTerm.toLowerCase()) ||
        d.model.toLowerCase().includes(deviceSearchTerm.toLowerCase());

      const matchType =
        selectedTypeFilter === 'ALL' ||
        (selectedTypeFilter === 'EDM' && (d.type.includes('EDM') || d.code.startsWith('EDM'))) ||
        (selectedTypeFilter === 'CNC' && (d.type.includes('CNC') || d.code.startsWith('CNC')));

      const matchStatus =
        selectedStatusFilter === 'ALL' ||
        (selectedStatusFilter === 'RUNNING' && d.status === 'RUNNING') ||
        (selectedStatusFilter === 'MAINTENANCE' && (d.status === 'MAINTENANCE' || d.status === 'MAINTENANCE_SCHEDULED')) ||
        (selectedStatusFilter === 'ALARM' && (d.status === 'ALARM_STOPPED' || d.status === 'WARNING'));

      return matchSearch && matchType && matchStatus;
    });
  }, [devices, deviceSearchTerm, selectedTypeFilter, selectedStatusFilter]);

  // Workshop OEE data for Panel 2 (Clustered Bar Chart)
  const workshopPerformanceData = [
    { workshop: 'Xưởng 1', oee: 82, runtime: 85, plannedStop: 10, unplannedStop: 5 },
    { workshop: 'Xưởng 2', oee: 76, runtime: 78, plannedStop: 16, unplannedStop: 6 },
    { workshop: 'Xưởng 3', oee: 68, runtime: 70, plannedStop: 22, unplannedStop: 8 },
    { workshop: 'Xưởng 4', oee: 74, runtime: 76, plannedStop: 18, unplannedStop: 6 },
  ];

  // 7-day multi-metric trend data for Panel 8
  const trendData7Days = [
    { date: '20/04', temp: 42, current: 12.4, vibration: 0.6 },
    { date: '21/04', temp: 44, current: 13.1, vibration: 0.7 },
    { date: '22/04', temp: 43, current: 12.8, vibration: 0.65 },
    { date: '23/04', temp: 41, current: 11.9, vibration: 0.58 },
    { date: '24/04', temp: 42, current: 12.2, vibration: 0.62 },
    { date: '25/04', temp: 45, current: 14.0, vibration: 0.75 },
    { date: '26/04', temp: 43, current: 12.4, vibration: 0.6 },
  ];

  // Equipment Status Distribution for Panel 9
  const statusDistributionData = [
    { name: 'Đang chạy', value: 32, percentage: '66.7%', color: '#16A36A' },
    { name: 'Dừng máy', value: 10, percentage: '20.8%', color: '#64748B' },
    { name: 'Lỗi', value: 6, percentage: '12.5%', color: '#E5484D' },
    { name: 'Bảo trì', value: 4, percentage: '8.3%', color: '#1677D2' },
    { name: 'Ngoại tuyến', value: 2, percentage: '4.2%', color: '#F2A51A' },
  ];

  // Recent Alerts for Panel 3
  const recentAlerts = [
    {
      time: '14:25',
      deviceCode: 'EDM-03',
      message: 'Nhiệt độ trục chính tăng cao',
      level: 'Cao',
      levelColor: 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
    },
    {
      time: '11:08',
      deviceCode: 'CNC-02',
      message: 'Rò rỉ thủy lực',
      level: 'Trung bình',
      levelColor: 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
    },
    {
      time: '09:42',
      deviceCode: 'EDM-01',
      message: 'Áp suất nước thấp',
      level: 'Trung bình',
      levelColor: 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
    },
    {
      time: '08:18',
      deviceCode: 'CNC-01',
      message: 'Quá tải dòng điện',
      level: 'Cao',
      levelColor: 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
    },
    {
      time: '07:55',
      deviceCode: 'EDM-02',
      message: 'Bảo trì định kỳ đến hạn',
      level: 'Thông tin',
      levelColor: 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]'
    },
  ];

  // AI Diagnostic Recommendations for Panel 4
  const aiRecommendations = [
    {
      deviceCode: 'EDM-03',
      symptom: 'Nhiệt độ tăng',
      rootCause: 'Lỗi bơm làm mát',
      confidence: '85%',
      status: 'Chờ xác nhận',
      statusColor: 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]'
    },
    {
      deviceCode: 'CNC-02',
      symptom: 'Rò rỉ dầu',
      rootCause: 'Hở phớt thủy lực',
      confidence: '72%',
      status: 'Đang xử lý',
      statusColor: 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
    },
    {
      deviceCode: 'EDM-01',
      symptom: 'Dao động dòng',
      rootCause: 'Kết nối lỏng',
      confidence: '64%',
      status: 'Chờ xác nhận',
      statusColor: 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]'
    },
  ];

  // Work Orders for Panel 6
  const workOrdersList = [
    {
      id: 'WO-125',
      deviceCode: 'EDM-02',
      title: 'Bảo trì định kỳ',
      priority: 'Trung bình',
      priorityColor: 'text-[#D97706]',
      deadline: '20/04/2025',
      status: 'Đang xử lý',
      statusColor: 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
    },
    {
      id: 'WO-124',
      deviceCode: 'EDM-03',
      title: 'Kiểm tra bơm...',
      priority: 'Cao',
      priorityColor: 'text-[#DC2626] font-bold',
      deadline: '21/04/2025',
      status: 'Chờ duyệt',
      statusColor: 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]'
    },
    {
      id: 'WO-123',
      deviceCode: 'CNC-02',
      title: 'Thay phớt thủy lực',
      priority: 'Cao',
      priorityColor: 'text-[#DC2626] font-bold',
      deadline: '20/04/2025',
      status: 'Quá hạn',
      statusColor: 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
    },
    {
      id: 'WO-122',
      deviceCode: 'EDM-01',
      title: 'Kiểm tra nguồn',
      priority: 'Trung bình',
      priorityColor: 'text-[#D97706]',
      deadline: '22/04/2025',
      status: 'Đang xử lý',
      statusColor: 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
    },
    {
      id: 'WO-121',
      deviceCode: 'CNC-01',
      title: 'Vệ sinh hệ thống',
      priority: 'Thấp',
      priorityColor: 'text-[#64748B]',
      deadline: '24/04/2025',
      status: 'Hoàn thành',
      statusColor: 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]'
    },
  ];

  // Technicians on-duty for Panel 7
  const techniciansList = [
    {
      name: 'Nguyễn Văn B',
      skill: 'EDM',
      status: 'Đang làm việc',
      statusColor: 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]',
      jobsCount: 2,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=60&h=60&q=80'
    },
    {
      name: 'Trần Văn A',
      skill: 'CNC',
      status: 'Đang làm việc',
      statusColor: 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]',
      jobsCount: 3,
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=60&h=60&q=80'
    },
    {
      name: 'Lê Văn C',
      skill: 'EDM/CNC',
      status: 'Sẵn sàng',
      statusColor: 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]',
      jobsCount: 0,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=60&h=60&q=80'
    },
    {
      name: 'Phạm Văn D',
      skill: 'Điện',
      status: 'Đang nghỉ',
      statusColor: 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]',
      jobsCount: 0,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=60&h=60&q=80'
    },
    {
      name: 'Nguyễn Văn E',
      skill: 'Cơ khí',
      status: 'Sẵn sàng',
      statusColor: 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]',
      jobsCount: 1,
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=60&h=60&q=80'
    },
  ];

  // Top 5 Frequent Faults for Panel 10
  const topFrequentFaults = [
    { name: 'Nhiệt độ trục chính cao', count: 12, max: 15 },
    { name: 'Rò rỉ thủy lực', count: 9, max: 15 },
    { name: 'Quá tải dòng điện', count: 7, max: 15 },
    { name: 'Áp suất nước thấp', count: 6, max: 15 },
    { name: 'Lỗi servo', count: 5, max: 15 },
  ];

  // Data & System Status for Panel 11
  const systemStatusItems = [
    {
      name: 'Kết nối máy móc',
      status: 'Bình thường',
      statusBadge: 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]',
      note: 'Cập nhật: 14:32'
    },
    {
      name: 'Dịch vụ AI',
      status: 'Hoạt động',
      statusBadge: 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]',
      note: 'Cập nhật: 14:28'
    },
    {
      name: 'Cơ sở dữ liệu',
      status: 'Hoạt động',
      statusBadge: 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]',
      note: 'Cập nhật: 14:30'
    },
    {
      name: 'Chất lượng dữ liệu',
      status: 'Tốt',
      statusBadge: 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]',
      note: '98% bản ghi đầy đủ'
    },
    {
      name: 'Đồng bộ dữ liệu',
      status: 'Bình thường',
      statusBadge: 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]',
      note: 'Lần cuối: 14:25'
    },
  ];

  return (
    <div className="space-y-4 text-[#19324D] font-sans pb-8">
      {/* ============================================================== */}
      {/* PAGE TITLE & SUBTITLE                                          */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#19324D] tracking-tight">
            Tổng quan hệ thống
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Giám sát thiết bị EDM/CNC, cảnh báo, bảo trì và hiệu suất vận hành
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 6 TOP WHITE KPI CARDS                                          */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Tổng thiết bị */}
        <div
          onClick={() => onNavigateToTab?.('devices')}
          className="bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm hover:shadow transition-shadow cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-md bg-[#E0F2FE] text-[#1677D2] flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
          </div>
          <div className="mt-2.5">
            <div className="text-xs text-[#64748B] font-medium">Tổng thiết bị</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-[#19324D] font-mono">48</span>
              <span className="text-xs font-semibold text-[#16A36A] flex items-center">
                ↑ 5%
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#16A36A]"></span>
              Đang chạy: <strong className="text-[#19324D]">32</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#64748B]"></span>
              Dừng máy: <strong className="text-[#19324D]">10</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#E5484D]"></span>
              Lỗi: <strong className="text-[#19324D]">6</strong>
            </span>
          </div>
        </div>

        {/* KPI 2: Hiệu suất OEE */}
        <div
          onClick={() => onNavigateToTab?.('reports')}
          className="bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm hover:shadow transition-shadow cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            {/* Circular Gauge */}
            <div className="relative w-8 h-8 rounded-full border-2 border-[#00C8F0] flex items-center justify-center font-mono text-[10px] font-bold text-[#1677D2]">
              78%
            </div>
            <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
          </div>
          <div className="mt-2.5">
            <div className="text-xs text-[#64748B] font-medium">Hiệu suất OEE</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-[#19324D] font-mono">78%</span>
              <span className="text-xs font-semibold text-[#16A36A] flex items-center">
                ↑ 6%
              </span>
            </div>
          </div>
          {/* Mini Spark Bars */}
          <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-end gap-1 h-3.5">
            <div className="w-1.5 h-2 bg-[#93C5FD] rounded-t-sm"></div>
            <div className="w-1.5 h-2.5 bg-[#60A5FA] rounded-t-sm"></div>
            <div className="w-1.5 h-3 bg-[#3B82F6] rounded-t-sm"></div>
            <div className="w-1.5 h-3.5 bg-[#2563EB] rounded-t-sm"></div>
            <div className="w-1.5 h-3.5 bg-[#1D4ED8] rounded-t-sm"></div>
          </div>
        </div>

        {/* KPI 3: Cảnh báo đang mở */}
        <div
          onClick={() => onNavigateToTab?.('notifications')}
          className="bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm hover:shadow transition-shadow cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-md bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
          </div>
          <div className="mt-2.5">
            <div className="text-xs text-[#64748B] font-medium">Cảnh báo đang mở</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-[#E5484D] font-mono">14</span>
              <span className="text-xs font-semibold text-[#E5484D] flex items-center">
                ↑ 27%
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#E5484D]"></span>
              Nghiêm trọng: <strong className="text-[#19324D]">4</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#F2A51A]"></span>
              Cảnh báo: <strong className="text-[#19324D]">6</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#2196D2]"></span>
              Thông tin: <strong className="text-[#19324D]">4</strong>
            </span>
          </div>
        </div>

        {/* KPI 4: Lệnh bảo trì */}
        <div
          onClick={() => onNavigateToTab?.('maintenance')}
          className="bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm hover:shadow transition-shadow cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-md bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
          </div>
          <div className="mt-2.5">
            <div className="text-xs text-[#64748B] font-medium">Lệnh bảo trì</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-[#19324D] font-mono">28</span>
              <span className="text-xs font-semibold text-[#16A36A] flex items-center">
                ↑ 12%
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#1677D2]"></span>
              Đang xử lý: <strong className="text-[#19324D]">16</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#2196D2]"></span>
              Chờ duyệt: <strong className="text-[#19324D]">8</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#E5484D]"></span>
              Quá hạn: <strong className="text-[#19324D]">4</strong>
            </span>
          </div>
        </div>

        {/* KPI 5: Đề xuất AI */}
        <div
          onClick={() => onNavigateToTab?.('ai-diagnosis')}
          className="bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm hover:shadow transition-shadow cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-md bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
          </div>
          <div className="mt-2.5">
            <div className="text-xs text-[#64748B] font-medium">Đề xuất AI</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-[#19324D] font-mono">9</span>
              <span className="text-xs font-semibold text-[#16A36A] flex items-center">
                ↑ 50%
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED]"></span>
              Chờ xác nhận: <strong className="text-[#19324D]">5</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#2196D2]"></span>
              Đã xác nhận: <strong className="text-[#19324D]">3</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#1677D2]"></span>
              Đang xử lý: <strong className="text-[#19324D]">1</strong>
            </span>
          </div>
        </div>

        {/* KPI 6: Kỹ thuật viên */}
        <div
          onClick={() => onNavigateToTab?.('technician-eval')}
          className="bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm hover:shadow transition-shadow cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-md bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
          </div>
          <div className="mt-2.5">
            <div className="text-xs text-[#64748B] font-medium">Kỹ thuật viên</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-[#19324D] font-mono">12</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#16A36A]"></span>
              Đang làm việc: <strong className="text-[#19324D]">8</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#2196D2]"></span>
              Sẵn sàng: <strong className="text-[#19324D]">3</strong>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#F2A51A]"></span>
              Đang nghỉ: <strong className="text-[#19324D]">1</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 2: CAMPUS MAP (PANEL 1), WORKSHOP OEE (PANEL 2), ALERTS (PANEL 3) & AI DIAGNOSIS (PANEL 4) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* PANEL 1: SƠ ĐỒ NHÀ MÁY VÀ TRẠNG THÁI THIẾT BỊ (6 COLS) */}
        <div className="lg:col-span-6 bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5">
              <h2 className="text-sm font-bold text-[#19324D] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#1677D2]" />
                Sơ đồ nhà máy và trạng thái thiết bị
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onToast?.('Chế độ toàn màn hình sơ đồ')}
                  className="text-xs text-[#1677D2] hover:underline font-medium flex items-center gap-1"
                >
                  Xem toàn màn hình <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-1 mt-2.5">
              <button
                onClick={() => setActiveCampusTab('overview')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeCampusTab === 'overview'
                    ? 'bg-[#1677D2] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#19324D]'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveCampusTab('plantA')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeCampusTab === 'plantA'
                    ? 'bg-[#1677D2] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#19324D]'
                }`}
              >
                Nhà máy A
              </button>
              <button
                onClick={() => setActiveCampusTab('plantB')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeCampusTab === 'plantB'
                    ? 'bg-[#1677D2] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#19324D]'
                }`}
              >
                Nhà máy B
              </button>
              <button
                onClick={() => setActiveCampusTab('ws1')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeCampusTab === 'ws1'
                    ? 'bg-[#1677D2] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#19324D]'
                }`}
              >
                Xưởng 1
              </button>
              <button
                onClick={() => setActiveCampusTab('ws2')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeCampusTab === 'ws2'
                    ? 'bg-[#1677D2] text-white'
                    : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#19324D]'
                }`}
              >
                Xưởng 2
              </button>
            </div>

            {/* 3D Perspective Graphic with Pinned Machine Markers */}
            <div className="relative mt-2.5 rounded-lg border border-[#E2E8F0] overflow-hidden bg-[#0A192F] min-h-[220px] flex items-center justify-center">
              {/* Background Factory Isometric Render / Artwork */}
              <img
                src="/assets/aistudio/file_00000000e58c8211bd931eb3f46ef565_9cffacfc.png"
                alt="Factory Isometric Layout"
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-[#081B2B]/40"></div>

              {/* Pinned Machines Markers on the factory floor */}
              {/* Marker 1: EDM-01 (Đang chạy - green) */}
              <div
                onClick={() => {
                  const dev = devices.find((d) => d.code === 'EDM-01') || devices[0];
                  if (dev) onOpenMachineDetails(dev);
                }}
                className="absolute top-[28%] left-[24%] z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-105 transition-transform"
              >
                <div className="bg-[#082A4A] border-2 border-[#16A36A] rounded-lg px-2 py-1 text-center shadow-lg">
                  <div className="text-[10px] font-bold text-white font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A] animate-ping"></span>
                    EDM-01
                  </div>
                  <div className="text-[9px] font-semibold text-[#16D9A0]">Đang chạy</div>
                </div>
              </div>

              {/* Marker 2: CNC-02 (Cảnh báo - amber) */}
              <div
                onClick={() => {
                  const dev = devices.find((d) => d.code === 'CNC-02') || devices[1];
                  if (dev) onOpenDiagnosis(dev);
                }}
                className="absolute top-[38%] left-[54%] z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-105 transition-transform"
              >
                <div className="bg-[#082A4A] border-2 border-[#F2A51A] rounded-lg px-2 py-1 text-center shadow-lg">
                  <div className="text-[10px] font-bold text-white font-mono flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-[#F2A51A]" />
                    CNC-02
                  </div>
                  <div className="text-[9px] font-semibold text-[#F2A51A]">Cảnh báo</div>
                </div>
              </div>

              {/* Marker 3: EDM-03 (Lỗi - red) */}
              <div
                onClick={() => {
                  const dev = devices.find((d) => d.code === 'EDM-03') || devices[2];
                  if (dev) onOpenDiagnosis(dev);
                }}
                className="absolute top-[22%] right-[22%] z-10 cursor-pointer transform translate-x-1/2 -translate-y-1/2 hover:scale-105 transition-transform"
              >
                <div className="bg-[#082A4A] border-2 border-[#E5484D] rounded-lg px-2 py-1 text-center shadow-lg animate-bounce">
                  <div className="text-[10px] font-bold text-white font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D]"></span>
                    EDM-03
                  </div>
                  <div className="text-[9px] font-semibold text-[#FF5263]">Lỗi</div>
                </div>
              </div>

              {/* Marker 4: CNC-01 (Đang chạy - green) */}
              <div
                onClick={() => {
                  const dev = devices.find((d) => d.code === 'CNC-01') || devices[3];
                  if (dev) onOpenMachineDetails(dev);
                }}
                className="absolute bottom-[24%] left-[42%] z-10 cursor-pointer transform -translate-x-1/2 translate-y-1/2 hover:scale-105 transition-transform"
              >
                <div className="bg-[#082A4A] border-2 border-[#16A36A] rounded-lg px-2 py-1 text-center shadow-lg">
                  <div className="text-[10px] font-bold text-white font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]"></span>
                    CNC-01
                  </div>
                  <div className="text-[9px] font-semibold text-[#16D9A0]">Đang chạy</div>
                </div>
              </div>

              {/* Marker 5: EDM-02 (Bảo trì - blue) */}
              <div
                onClick={() => {
                  const dev = devices.find((d) => d.code === 'EDM-02') || devices[1];
                  if (dev) onOpenRepairReport(dev);
                }}
                className="absolute bottom-[28%] right-[26%] z-10 cursor-pointer transform translate-x-1/2 translate-y-1/2 hover:scale-105 transition-transform"
              >
                <div className="bg-[#082A4A] border-2 border-[#1677D2] rounded-lg px-2 py-1 text-center shadow-lg">
                  <div className="text-[10px] font-bold text-white font-mono flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-[#60A5FA]" />
                    EDM-02
                  </div>
                  <div className="text-[9px] font-semibold text-[#60A5FA]">Bảo trì</div>
                </div>
              </div>

              {/* Right overlay filters list inside map container */}
              <div className="absolute top-2.5 right-2.5 z-20 bg-white/90 backdrop-blur-sm border border-[#D9E3ED] rounded-md p-1.5 flex flex-col gap-1 text-[11px] text-[#19324D] shadow">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#1677D2]">
                  <input
                    type="radio"
                    name="mapFilter"
                    checked={selectedMapFilter === 'all'}
                    onChange={() => setSelectedMapFilter('all')}
                    className="accent-[#1677D2] w-3 h-3"
                  />
                  <span>Tất cả thiết bị</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#1677D2]">
                  <input
                    type="radio"
                    name="mapFilter"
                    checked={selectedMapFilter === 'edm'}
                    onChange={() => setSelectedMapFilter('edm')}
                    className="accent-[#1677D2] w-3 h-3"
                  />
                  <span>EDM</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#1677D2]">
                  <input
                    type="radio"
                    name="mapFilter"
                    checked={selectedMapFilter === 'cnc'}
                    onChange={() => setSelectedMapFilter('cnc')}
                    className="accent-[#1677D2] w-3 h-3"
                  />
                  <span>CNC</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#1677D2]">
                  <input
                    type="radio"
                    name="mapFilter"
                    checked={selectedMapFilter === 'ws1'}
                    onChange={() => setSelectedMapFilter('ws1')}
                    className="accent-[#1677D2] w-3 h-3"
                  />
                  <span>Xưởng 1</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#1677D2]">
                  <input
                    type="radio"
                    name="mapFilter"
                    checked={selectedMapFilter === 'ws2'}
                    onChange={() => setSelectedMapFilter('ws2')}
                    className="accent-[#1677D2] w-3 h-3"
                  />
                  <span>Xưởng 2</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#1677D2]">
                  <input
                    type="radio"
                    name="mapFilter"
                    checked={selectedMapFilter === 'ws3'}
                    onChange={() => setSelectedMapFilter('ws3')}
                    className="accent-[#1677D2] w-3 h-3"
                  />
                  <span>Xưởng 3</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#1677D2]">
                  <input
                    type="radio"
                    name="mapFilter"
                    checked={selectedMapFilter === 'ws4'}
                    onChange={() => setSelectedMapFilter('ws4')}
                    className="accent-[#1677D2] w-3 h-3"
                  />
                  <span>Xưởng 4</span>
                </label>
              </div>

              {/* 2D / 3D Toggle Buttons at bottom right */}
              <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center bg-[#082038] border border-[#14426E] rounded p-0.5 text-[10px] font-bold text-white shadow">
                <button
                  onClick={() => setMapMode('2D')}
                  className={`px-2 py-0.5 rounded ${mapMode === '2D' ? 'bg-[#1677D2] text-white' : 'text-slate-300'}`}
                >
                  2D
                </button>
                <button
                  onClick={() => setMapMode('3D')}
                  className={`px-2 py-0.5 rounded ${mapMode === '3D' ? 'bg-[#1677D2] text-white' : 'text-slate-300'}`}
                >
                  3D
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Legend */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 mt-2 border-t border-[#E2E8F0] text-xs">
            <div className="flex items-center gap-3.5 flex-wrap text-[11px] text-[#64748B]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16A36A]"></span>
                Đang chạy
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]"></span>
                Dừng máy
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E5484D]"></span>
                Lỗi
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1677D2]"></span>
                Bảo trì
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F2A51A]"></span>
                Ngoại tuyến
              </span>
            </div>
          </div>
        </div>

        {/* PANEL 2: HIỆU SUẤT THEO XƯỞNG (OEE) (3 COLS) */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
              <h2 className="text-sm font-bold text-[#19324D] flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-[#1677D2]" />
                Hiệu suất thiết bị theo xưởng (OEE)
              </h2>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2.5 text-[10px] my-2 text-[#64748B] flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#1677D2]"></span>
                OEE
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#16A36A]"></span>
                Thời gian chạy
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#F2A51A]"></span>
                Dừng máy
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#E5484D]"></span>
                Lỗi
              </span>
            </div>

            {/* Clustered BarChart */}
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workshopPerformanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="workshop" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D9E3ED', borderRadius: '6px', fontSize: '11px', color: '#19324D', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="oee" fill="#1677D2" radius={[2, 2, 0, 0]} barSize={9} />
                  <Bar dataKey="runtime" fill="#16A36A" radius={[2, 2, 0, 0]} barSize={9} />
                  <Bar dataKey="plannedStop" fill="#F2A51A" radius={[2, 2, 0, 0]} barSize={9} />
                  <Bar dataKey="unplannedStop" fill="#E5484D" radius={[2, 2, 0, 0]} barSize={9} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT STACKED: PANEL 3 (CẢNH BÁO MỚI NHẤT) & PANEL 4 (ĐỀ XUẤT AI CHẨN ĐOÁN) (3 COLS) */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          {/* PANEL 3: CẢNH BÁO MỚI NHẤT */}
          <div className="bg-white rounded-lg border border-[#D9E3ED] p-3 shadow-sm flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <h2 className="text-xs font-bold text-[#19324D] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#E5484D]" />
                  Cảnh báo mới nhất
                </h2>
                <button
                  onClick={() => onNavigateToTab?.('notifications')}
                  className="text-[11px] text-[#1677D2] hover:underline font-semibold flex items-center gap-0.5"
                >
                  Xem tất cả →
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto mt-1.5">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                      <th className="py-1 px-1 font-medium">Thời gian</th>
                      <th className="py-1 px-1 font-medium">Thiết bị</th>
                      <th className="py-1 px-1 font-medium">Nội dung cảnh báo</th>
                      <th className="py-1 px-1 font-medium text-right">Mức độ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {recentAlerts.map((alt, i) => (
                      <tr
                        key={i}
                        onClick={() => {
                          const dev = devices.find((d) => d.code === alt.deviceCode) || devices[0];
                          if (dev) onOpenDiagnosis(dev);
                        }}
                        className="hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                      >
                        <td className="py-1 px-1 font-mono text-[#64748B] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#F2A51A]" />
                          {alt.time}
                        </td>
                        <td className="py-1 px-1 font-bold text-[#19324D]">{alt.deviceCode}</td>
                        <td className="py-1 px-1 text-[#19324D] truncate max-w-[110px]" title={alt.message}>
                          {alt.message}
                        </td>
                        <td className="py-1 px-1 text-right">
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${alt.levelColor}`}>
                            {alt.level}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PANEL 4: ĐỀ XUẤT AI CHẨN ĐOÁN */}
          <div className="bg-white rounded-lg border border-[#D9E3ED] p-3 shadow-sm flex flex-col justify-between flex-1">
            <div>
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <h2 className="text-xs font-bold text-[#19324D] flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-[#7C3AED]" />
                  Đề xuất AI chẩn đoán
                </h2>
                <button
                  onClick={() => onNavigateToTab?.('ai-diagnosis')}
                  className="text-[11px] text-[#1677D2] hover:underline font-semibold flex items-center gap-0.5"
                >
                  Xem tất cả →
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto mt-1.5">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                      <th className="py-1 px-1 font-medium">Thiết bị</th>
                      <th className="py-1 px-1 font-medium">Triệu chứng</th>
                      <th className="py-1 px-1 font-medium">Nguyên nhân đề xuất</th>
                      <th className="py-1 px-1 font-medium">Độ tin cậy</th>
                      <th className="py-1 px-1 font-medium text-right">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {aiRecommendations.map((rec, i) => (
                      <tr
                        key={i}
                        onClick={() => {
                          const dev = devices.find((d) => d.code === rec.deviceCode) || devices[0];
                          if (dev) onOpenDiagnosis(dev);
                        }}
                        className="hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                      >
                        <td className="py-1 px-1 font-bold text-[#19324D]">{rec.deviceCode}</td>
                        <td className="py-1 px-1 text-[#64748B]">{rec.symptom}</td>
                        <td className="py-1 px-1 text-[#19324D] font-medium truncate max-w-[90px]" title={rec.rootCause}>
                          {rec.rootCause}
                        </td>
                        <td className="py-1 px-1 font-mono font-bold text-[#16A36A]">{rec.confidence}</td>
                        <td className="py-1 px-1 text-right">
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${rec.statusColor}`}>
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 3: PANEL 5 (DANH SÁCH THIẾT BỊ 48), PANEL 6 (LỆNH BẢO TRÌ 28) & PANEL 7 (KỸ THUẬT VIÊN 12) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* PANEL 5: DANH SÁCH THIẾT BỊ (48) (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2.5">
              <h2 className="text-sm font-bold text-[#19324D]">
                Danh sách thiết bị (48)
              </h2>

              {/* Search & Filters */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-36">
                  <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={deviceSearchTerm}
                    onChange={(e) => setDeviceSearchTerm(e.target.value)}
                    placeholder="Tìm thiết bị, mã máy..."
                    className="w-full pl-6 pr-2 py-1 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#19324D] placeholder-[#94A3B8] focus:border-[#1677D2] focus:outline-none"
                  />
                </div>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="py-1 px-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#19324D] focus:outline-none"
                >
                  <option value="ALL">Tất cả loại ⌄</option>
                  <option value="EDM">EDM</option>
                  <option value="CNC">CNC</option>
                </select>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="py-1 px-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#19324D] focus:outline-none"
                >
                  <option value="ALL">Tất cả trạng thái ⌄</option>
                  <option value="RUNNING">Đang chạy</option>
                  <option value="MAINTENANCE">Bảo trì</option>
                  <option value="ALARM">Lỗi / Cảnh báo</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-2 custom-tower-scrollbar max-h-[260px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#F8FAFC] z-10">
                  <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                    <th className="py-2 px-2 font-medium">Mã máy</th>
                    <th className="py-2 px-2 font-medium">Tên thiết bị</th>
                    <th className="py-2 px-2 font-medium">Xưởng</th>
                    <th className="py-2 px-2 font-medium">Loại</th>
                    <th className="py-2 px-2 font-medium">Trạng thái</th>
                    <th className="py-2 px-2 font-medium">Nhiệt độ</th>
                    <th className="py-2 px-2 font-medium">Dòng điện</th>
                    <th className="py-2 px-2 font-medium">OEE</th>
                    <th className="py-2 px-2 font-medium text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredDevices.slice(0, 8).map((device) => {
                    const isAlarm = device.status === 'ALARM_STOPPED';
                    const isRunning = device.status === 'RUNNING';
                    const isMaintenance = device.status === 'MAINTENANCE' || device.status === 'MAINTENANCE_SCHEDULED';

                    return (
                      <tr
                        key={device.id}
                        className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                        onClick={() => onOpenMachineDetails(device)}
                      >
                        <td className="py-2 px-2 font-bold font-mono text-[#1677D2]">{device.code}</td>
                        <td className="py-2 px-2 font-medium text-[#19324D]">{device.name}</td>
                        <td className="py-2 px-2 text-[#64748B]">{getDeviceWorkshop(device)}</td>
                        <td className="py-2 px-2 text-[#19324D]">{device.code.startsWith('EDM') ? 'EDM' : 'CNC'}</td>
                        <td className="py-2 px-2">
                          {isRunning ? (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                              Đang chạy
                            </span>
                          ) : isMaintenance ? (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]">
                              Bảo trì
                            </span>
                          ) : isAlarm ? (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]">
                              Lỗi
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                              Cảnh báo
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 font-mono text-[#19324D]">
                          {device.telemetry?.dielectricTemp || 42}°C
                        </td>
                        <td className="py-2 px-2 font-mono text-[#19324D]">
                          {device.telemetry?.peakCurrent || 12.4} A
                        </td>
                        <td className="py-2 px-2 font-mono font-bold text-[#16A36A]">
                          {device.telemetry?.oee || 82}%
                        </td>
                        <td className="py-2 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1 text-[#64748B]">
                            <button
                              onClick={() => {
                                if (onOpenFailurePrediction) {
                                  onOpenFailurePrediction(device);
                                } else {
                                  setSelectedD3Device(device);
                                }
                              }}
                              className="p-1 hover:text-[#1677D2] hover:bg-[#F1F5F9] rounded"
                              title="Dự báo bảo trì AI (D3.js)"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                            </button>
                            <button
                              onClick={() => onOpenTelemetryHistory(device)}
                              className="p-1 hover:text-[#1677D2] hover:bg-[#F1F5F9] rounded"
                              title="Lịch sử dữ liệu"
                            >
                              <LineChartIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenRepairReport(device)}
                              className="p-1 hover:text-[#1677D2] hover:bg-[#F1F5F9] rounded"
                              title="Lệnh bảo trì"
                            >
                              <Wrench className="w-3.5 h-3.5" />
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
        </div>

        {/* PANEL 6: LỆNH BẢO TRÌ & CÔNG VIỆC (28) (4 COLS) */}
        <div className="lg:col-span-4 bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
              <h2 className="text-sm font-bold text-[#19324D]">
                Lệnh bảo trì & công việc (28)
              </h2>
              <button
                onClick={() => onNavigateToTab?.('maintenance')}
                className="text-xs text-[#1677D2] hover:underline font-semibold flex items-center gap-0.5"
              >
                Xem tất cả →
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                    <th className="py-2 px-1.5 font-medium">Mã lệnh</th>
                    <th className="py-2 px-1.5 font-medium">Thiết bị</th>
                    <th className="py-2 px-1.5 font-medium">Nội dung công việc</th>
                    <th className="py-2 px-1.5 font-medium">Ưu tiên</th>
                    <th className="py-2 px-1.5 font-medium">Hạn hoàn thành</th>
                    <th className="py-2 px-1.5 font-medium text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {workOrdersList.map((wo) => (
                    <tr
                      key={wo.id}
                      onClick={() => {
                        const dev = devices.find((d) => d.code === wo.deviceCode) || devices[0];
                        if (dev) onOpenRepairReport(dev);
                      }}
                      className="hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-1.5 font-mono text-[#19324D]">{wo.id}</td>
                      <td className="py-2 px-1.5 font-bold font-mono text-[#1677D2]">{wo.deviceCode}</td>
                      <td className="py-2 px-1.5 text-[#19324D] truncate max-w-[100px]" title={wo.title}>
                        {wo.title}
                      </td>
                      <td className={`py-2 px-1.5 text-[11px] ${wo.priorityColor}`}>
                        {wo.priority}
                      </td>
                      <td className="py-2 px-1.5 font-mono text-[#64748B] text-[11px]">{wo.deadline}</td>
                      <td className="py-2 px-1.5 text-right">
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${wo.statusColor}`}>
                          {wo.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* PANEL 7: TÌNH TRẠNG KỸ THUẬT VIÊN (12) (3 COLS) */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
              <h2 className="text-sm font-bold text-[#19324D]">
                Tình trạng kỹ thuật viên (12)
              </h2>
              <button
                onClick={() => onNavigateToTab?.('technician-eval')}
                className="text-xs text-[#1677D2] hover:underline font-semibold flex items-center gap-0.5"
              >
                Xem tất cả →
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[#64748B]">
                    <th className="py-2 px-1.5 font-medium">Tên</th>
                    <th className="py-2 px-1.5 font-medium">Kỹ năng chính</th>
                    <th className="py-2 px-1.5 font-medium">Trạng thái</th>
                    <th className="py-2 px-1.5 font-medium text-right">Công việc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {techniciansList.map((t, idx) => (
                    <tr
                      key={idx}
                      onClick={() => onToast?.(`Kỹ thuật viên ${t.name} • Kỹ năng: ${t.skill}`)}
                      className="hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                    >
                      <td className="py-2 px-1.5 font-medium text-[#19324D] flex items-center gap-1.5">
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-5 h-5 rounded-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                        <span>{t.name}</span>
                      </td>
                      <td className="py-2 px-1.5 text-[#64748B]">{t.skill}</td>
                      <td className="py-2 px-1.5">
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${t.statusColor}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2 px-1.5 text-right font-mono font-bold text-[#19324D]">
                        {t.jobsCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 4: PANEL 8 (XU HƯỚNG THÔNG SỐ), PANEL 9 (PHÂN BỔ TRẠNG THÁI), PANEL 10 (TOP SỰ CỐ) & PANEL 11 (TÌNH TRẠNG HỆ THỐNG) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* PANEL 8: XU HƯỚNG THÔNG SỐ THIẾT BỊ (EDM-01) */}
        <div className="bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h2 className="text-xs font-bold text-[#19324D] flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-[#1677D2]" />
                Xu hướng thông số thiết bị (EDM-01)
              </h2>
              <select
                value={trendDays}
                onChange={(e) => setTrendDays(e.target.value as any)}
                className="py-0.5 px-1.5 text-[10px] bg-[#F8FAFC] border border-[#CBD5E1] rounded text-[#19324D] focus:outline-none"
              >
                <option value="7">7 ngày ⌄</option>
                <option value="14">14 ngày</option>
                <option value="30">30 ngày</option>
              </select>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 text-[10px] my-2 text-[#64748B] flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-[#1677D2]"></span>
                Nhiệt độ (°C)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-[#F2A51A]"></span>
                Dòng điện (A)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-[#E5484D]"></span>
                Độ rung (mm/s)
              </span>
            </div>

            {/* Multi-line chart */}
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData7Days} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[0, 60]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D9E3ED', borderRadius: '6px', fontSize: '10px', color: '#19324D' }}
                  />
                  <Line type="monotone" dataKey="temp" stroke="#1677D2" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="current" stroke="#F2A51A" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="vibration" stroke="#E5484D" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* PANEL 9: PHÂN BỔ TRẠNG THÁI THIẾT BỊ */}
        <div className="bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h2 className="text-xs font-bold text-[#19324D] flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-[#1677D2]" />
                Phân bổ trạng thái thiết bị
              </h2>
            </div>

            <div className="flex items-center justify-between my-2">
              {/* Donut Chart */}
              <div className="relative w-28 h-28 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={45}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-base font-bold font-mono text-[#19324D]">48</span>
                  <span className="text-[9px] text-[#64748B]">Thiết bị</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-1 text-[11px] text-[#64748B] flex-1 pl-2">
                {statusDistributionData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-[#19324D]">{item.name}</span>
                    </span>
                    <span className="font-mono text-[#64748B]">{item.value} ({item.percentage})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 10: TOP 5 SỰ CỐ THƯỜNG GẶP (30 NGÀY) */}
        <div className="bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h2 className="text-xs font-bold text-[#19324D] flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#F2A51A]" />
                Top 5 sự cố thường gặp (30 ngày)
              </h2>
            </div>

            {/* Horizontal progress bars */}
            <div className="space-y-2 mt-2">
              {topFrequentFaults.map((f, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="text-[#19324D] truncate">{f.name}</span>
                    <span className="font-mono font-bold text-[#1677D2]">{f.count}</span>
                  </div>
                  <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1677D2] rounded-full"
                      style={{ width: `${(f.count / f.max) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PANEL 11: TÌNH TRẠNG DỮ LIỆU VÀ HỆ THỐNG */}
        <div className="bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
              <h2 className="text-xs font-bold text-[#19324D] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
                Tình trạng dữ liệu và hệ thống
              </h2>
              <button
                onClick={() => onNavigateToTab?.('data-trust')}
                className="text-[11px] text-[#1677D2] hover:underline font-semibold flex items-center gap-0.5"
              >
                Xem chi tiết →
              </button>
            </div>

            {/* Rows list */}
            <div className="divide-y divide-[#F1F5F9] mt-1 text-xs">
              {systemStatusItems.map((item, idx) => (
                <div key={idx} className="py-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A36A]" />
                    <span className="text-[#19324D] font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${item.statusBadge}`}>
                      {item.status}
                    </span>
                    <span className="text-[10px] text-[#64748B] hidden sm:inline">{item.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* D3 AI VIBRATION FAILURE PROBABILITY MODAL */}
      <AIVibrationFailurePredictionModal
        device={selectedD3Device}
        isOpen={Boolean(selectedD3Device)}
        onClose={() => setSelectedD3Device(null)}
        onScheduleMaintenance={(d, reason) => {
          onToast?.(`Đã lên lịch bảo dưỡng máy ${d.code}: ${reason}`);
          onOpenRepairReport(d);
        }}
      />
    </div>
  );
};
