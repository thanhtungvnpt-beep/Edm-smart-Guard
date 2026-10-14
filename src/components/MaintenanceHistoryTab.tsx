import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Calendar,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  User,
  DollarSign,
  Download,
  Printer,
  ChevronDown,
  RotateCcw,
  Sparkles,
  FileText,
  SlidersHorizontal,
  X,
  ExternalLink,
  Trash2,
  Edit3,
  ShieldCheck,
  Tag,
  Eye,
  Check,
  Activity,
  Send,
  Mail,
} from 'lucide-react';
import { Device, Technician, MaintenanceRecord } from '../types';
import {
  getStoredMaintenanceRecords,
  saveMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  DEVICE_METADATA_MAP,
} from '../utils/maintenanceHistoryData';
import { WeeklyIncidentReportModal } from './WeeklyIncidentReportModal';

interface MaintenanceHistoryTabProps {
  devices: Device[];
  technicians: Technician[];
  onOpenMachineDetails?: (device: Device) => void;
  onOpenRCA?: (deviceId?: string, errorCode?: string) => void;
  onToast?: (message: string) => void;
}

export type HistoryDatePreset = 'ALL' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'CUSTOM';

export const MaintenanceHistoryTab: React.FC<MaintenanceHistoryTabProps> = ({
  devices,
  technicians,
  onOpenMachineDetails,
  onOpenRCA,
  onToast,
}) => {
  // Master records state from persistent localStorage
  const [records, setRecords] = useState<MaintenanceRecord[]>(() => getStoredMaintenanceRecords());

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('ALL');
  const [selectedTaskType, setSelectedTaskType] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<HistoryDatePreset>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // View mode: 'cards' or 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showWeeklyReportModal, setShowWeeklyReportModal] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(null);
  const [inspectRecord, setInspectRecord] = useState<MaintenanceRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state for Add/Edit
  const [formData, setFormData] = useState({
    deviceId: devices[0]?.id || 'dev-01',
    taskTitle: '',
    taskType: 'CORRECTIVE' as MaintenanceRecord['taskType'],
    date: new Date().toISOString().slice(0, 16),
    incidentDescription: '',
    repairActions: '',
    technicianName: technicians[0]?.name || 'Nguyễn Văn Hùng',
    technicianRole: 'Kỹ sư Trưởng Bảo Trì',
    durationMinutes: 60,
    operatingHours: 4200,
    costEstimateVND: 2500000,
    partsInput: '',
    partsList: [] as string[],
    technicianNotes: '',
    qualityPassed: true,
  });

  // Reload records from storage helper
  const reloadRecords = () => {
    setRecords(getStoredMaintenanceRecords());
  };

  // Reset filter form
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDeviceId('ALL');
    setSelectedTaskType('ALL');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    if (onToast) onToast('Đã xóa tất cả bộ lọc tìm kiếm lịch sử!');
  };

  // Filtered & Searched records
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      // 1. Device filter
      if (selectedDeviceId !== 'ALL' && record.deviceId !== selectedDeviceId) {
        return false;
      }

      // 2. Incident / Task type filter
      if (selectedTaskType !== 'ALL' && record.taskType !== selectedTaskType) {
        return false;
      }

      // 3. Date filtering
      const recordDate = new Date(record.completedAt);
      const now = new Date();

      if (datePreset === 'LAST_7_DAYS') {
        const past7 = new Date();
        past7.setDate(now.getDate() - 7);
        if (recordDate < past7) return false;
      } else if (datePreset === 'LAST_30_DAYS') {
        const past30 = new Date();
        past30.setDate(now.getDate() - 30);
        if (recordDate < past30) return false;
      } else if (datePreset === 'LAST_90_DAYS') {
        const past90 = new Date();
        past90.setDate(now.getDate() - 90);
        if (recordDate < past90) return false;
      } else if (datePreset === 'CUSTOM') {
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          if (recordDate < s) return false;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (recordDate > e) return false;
        }
      }

      // 4. Keyword search (mô tả sự cố, hành động sửa chữa, bộ phận thay thế, kỹ thuật viên, tên máy, mã máy)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const inTitle = record.taskTitle.toLowerCase().includes(term);
        const inIncident = (record.incidentDescription || '').toLowerCase().includes(term);
        const inActions = (record.repairActions || record.findingsAndActions || '').toLowerCase().includes(term);
        const inParts = (record.partsReplaced || []).some((p) => p.toLowerCase().includes(term));
        const inTech = record.technicianName.toLowerCase().includes(term);
        const inDevCode = (record.deviceCode || '').toLowerCase().includes(term);
        const inDevName = (record.deviceName || '').toLowerCase().includes(term);
        const inNotes = (record.technicianNotes || '').toLowerCase().includes(term);

        if (!inTitle && !inIncident && !inActions && !inParts && !inTech && !inDevCode && !inDevName && !inNotes) {
          return false;
        }
      }

      return true;
    });
  }, [records, selectedDeviceId, selectedTaskType, datePreset, startDate, endDate, searchTerm]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = records.length;
    const corrective = records.filter((r) => r.taskType === 'CORRECTIVE').length;
    const preventive = records.filter((r) => r.taskType === 'PREVENTIVE').length;
    const partsReplacement = records.filter((r) => r.taskType === 'PARTS_REPLACEMENT').length;
    const calibration = records.filter((r) => r.taskType === 'CALIBRATION').length;
    const overhaul = records.filter((r) => r.taskType === 'OVERHAUL').length;

    const totalPartsCount = records.reduce((acc, r) => acc + (r.partsReplaced?.length || 0), 0);
    const totalCost = records.reduce((acc, r) => acc + (r.costEstimateVND || 0), 0);
    const totalMinutes = records.reduce((acc, r) => acc + (r.durationMinutes || 0), 0);

    return {
      total,
      corrective,
      preventive,
      partsReplacement,
      calibration,
      overhaul,
      totalPartsCount,
      totalCost,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    };
  }, [records]);

  // Handle open add modal
  const handleOpenAdd = () => {
    setEditingRecord(null);
    setFormData({
      deviceId: selectedDeviceId !== 'ALL' ? selectedDeviceId : devices[0]?.id || 'dev-01',
      taskTitle: '',
      taskType: 'CORRECTIVE',
      date: new Date().toISOString().slice(0, 16),
      incidentDescription: '',
      repairActions: '',
      technicianName: technicians[0]?.name || 'Nguyễn Văn Hùng',
      technicianRole: 'Kỹ sư Trưởng Bảo Trì',
      durationMinutes: 60,
      operatingHours: 4250,
      costEstimateVND: 2500000,
      partsInput: '',
      partsList: [],
      technicianNotes: '',
      qualityPassed: true,
    });
    setShowAddModal(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (rec: MaintenanceRecord) => {
    setEditingRecord(rec);
    const d = new Date(rec.completedAt);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setFormData({
      deviceId: rec.deviceId,
      taskTitle: rec.taskTitle,
      taskType: rec.taskType,
      date: localIso,
      incidentDescription: rec.incidentDescription || '',
      repairActions: rec.repairActions || rec.findingsAndActions || '',
      technicianName: rec.technicianName,
      technicianRole: rec.technicianRole || 'Kỹ thuật viên Bảo trì',
      durationMinutes: rec.durationMinutes,
      operatingHours: rec.operatingHoursAtMaintenance,
      costEstimateVND: rec.costEstimateVND || 0,
      partsInput: '',
      partsList: rec.partsReplaced || [],
      technicianNotes: rec.technicianNotes || '',
      qualityPassed: rec.qualityPassed,
    });
    setShowAddModal(true);
  };

  // Add a part to partsList
  const handleAddPart = () => {
    if (!formData.partsInput.trim()) return;
    const clean = formData.partsInput.trim();
    if (!formData.partsList.includes(clean)) {
      setFormData((prev) => ({
        ...prev,
        partsList: [...prev.partsList, clean],
        partsInput: '',
      }));
    }
  };

  // Remove a part from partsList
  const handleRemovePart = (partToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      partsList: prev.partsList.filter((p) => p !== partToRemove),
    }));
  };

  // Save or Update submit handler
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.taskTitle.trim()) {
      if (onToast) onToast('Vui lòng nhập tiêu đề công việc bảo trì / sửa chữa!');
      return;
    }
    if (!formData.incidentDescription.trim()) {
      if (onToast) onToast('Vui lòng nhập mô tả sự cố / hiện tượng hư hỏng!');
      return;
    }
    if (!formData.repairActions.trim()) {
      if (onToast) onToast('Vui lòng nhập hành động sửa chữa / quy trình khắc phục!');
      return;
    }

    const targetDev = devices.find((d) => d.id === formData.deviceId);
    const meta = DEVICE_METADATA_MAP[formData.deviceId];
    const devCode = targetDev?.code || meta?.code || formData.deviceId;
    const devName = targetDev?.name || meta?.name || 'Máy gia công EDM';

    const completedIso = new Date(formData.date).toISOString();

    if (editingRecord) {
      // Update existing
      const updated: MaintenanceRecord = {
        ...editingRecord,
        deviceId: formData.deviceId,
        deviceCode: devCode,
        deviceName: devName,
        taskTitle: formData.taskTitle.trim(),
        taskType: formData.taskType,
        completedAt: completedIso,
        incidentDescription: formData.incidentDescription.trim(),
        repairActions: formData.repairActions.trim(),
        findingsAndActions: formData.repairActions.trim(),
        partsReplaced: formData.partsList,
        technicianName: formData.technicianName.trim(),
        technicianRole: formData.technicianRole,
        durationMinutes: Number(formData.durationMinutes) || 60,
        operatingHoursAtMaintenance: Number(formData.operatingHours) || 4000,
        costEstimateVND: Number(formData.costEstimateVND) || 0,
        technicianNotes: formData.technicianNotes.trim(),
        qualityPassed: formData.qualityPassed,
      };
      updateMaintenanceRecord(updated);
      reloadRecords();
      setShowAddModal(false);
      setEditingRecord(null);
      if (onToast) onToast(`Đã cập nhật hồ sơ sửa chữa "${updated.taskTitle}" thành công!`);
    } else {
      // Create new
      const newRec: MaintenanceRecord = {
        id: `maint-${Date.now()}`,
        deviceId: formData.deviceId,
        deviceCode: devCode,
        deviceName: devName,
        taskTitle: formData.taskTitle.trim(),
        taskType: formData.taskType,
        completedAt: completedIso,
        incidentDescription: formData.incidentDescription.trim(),
        repairActions: formData.repairActions.trim(),
        findingsAndActions: formData.repairActions.trim(),
        partsReplaced: formData.partsList,
        technicianName: formData.technicianName.trim() || 'Kỹ thuật viên ca trực',
        technicianRole: formData.technicianRole,
        durationMinutes: Number(formData.durationMinutes) || 60,
        operatingHoursAtMaintenance: Number(formData.operatingHours) || 4200,
        costEstimateVND: Number(formData.costEstimateVND) || 0,
        technicianNotes: formData.technicianNotes.trim(),
        qualityPassed: formData.qualityPassed,
        aiVerified: true,
      };
      saveMaintenanceRecord(newRec);
      reloadRecords();
      setShowAddModal(false);
      if (onToast) onToast(`Đã ghi nhận lịch sử sửa chữa mới cho ${devCode} thành công!`);
    }
  };

  // Delete handler
  const handleDelete = (id: string) => {
    deleteMaintenanceRecord(id);
    reloadRecords();
    setDeleteConfirmId(null);
    if (inspectRecord?.id === id) setInspectRecord(null);
    if (onToast) onToast('Đã xóa bản ghi lịch sử bảo trì thành công.');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      if (onToast) onToast('Không có dữ liệu để xuất CSV!');
      return;
    }

    const headers = [
      'ID',
      'Mã Thiết Bị',
      'Tên Thiết Bị',
      'Ngày Thực Hiện',
      'Loại Sự Cố/Bảo Trì',
      'Tiêu Đề',
      'Mô Tả Sự Cố',
      'Hành Động Sửa Chữa',
      'Bộ Phận Thay Thế',
      'Kỹ Thuật Viên',
      'Thời Lượng (Phút)',
      'Giờ Máy (Hours)',
      'Chi Phí Ước Tính (VND)',
      'Nghiệm Thu',
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.id}"`,
      `"${r.deviceCode || r.deviceId}"`,
      `"${(r.deviceName || '').replace(/"/g, '""')}"`,
      `"${new Date(r.completedAt).toLocaleString('vi-VN')}"`,
      `"${r.taskType}"`,
      `"${r.taskTitle.replace(/"/g, '""')}"`,
      `"${(r.incidentDescription || '').replace(/"/g, '""')}"`,
      `"${(r.repairActions || r.findingsAndActions || '').replace(/"/g, '""')}"`,
      `"${(r.partsReplaced || []).join('; ').replace(/"/g, '""')}"`,
      `"${r.technicianName.replace(/"/g, '""')}"`,
      r.durationMinutes,
      r.operatingHoursAtMaintenance,
      r.costEstimateVND || 0,
      r.qualityPassed ? 'Đạt Chuẩn' : 'Chưa Đạt',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Lich_Su_Bao_Tri_EDM_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onToast) onToast(`Đã xuất file CSV với ${filteredRecords.length} bản ghi lịch sử!`);
  };

  // Format currency
  const formatVND = (amount?: number) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Badge for task type
  const getTaskTypeBadge = (type: MaintenanceRecord['taskType']) => {
    switch (type) {
      case 'CORRECTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/40 px-2.5 py-0.5 text-[11px] font-bold text-red-400">
            <AlertTriangle className="h-3 w-3" />
            Sửa Chữa Khẩn Cấp
          </span>
        );
      case 'PREVENTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Bảo Dưỡng Định Kỳ
          </span>
        );
      case 'PARTS_REPLACEMENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 text-[11px] font-bold text-purple-400">
            <Layers className="h-3 w-3" />
            Thay Thế Linh Kiện
          </span>
        );
      case 'CALIBRATION':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 text-[11px] font-bold text-cyan-400">
            <Activity className="h-3 w-3" />
            Hiệu Chuẩn Cơ Khí
          </span>
        );
      case 'OVERHAUL':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
            <Wrench className="h-3 w-3" />
            Đại Tu Toàn Diện
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
            Bảo Trì
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP BANNER & ACTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/20 p-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Hồ Sơ Lưu Trữ Lịch Sử Bảo Trì & Sửa Chữa</span>
                <span className="rounded-full bg-amber-500/20 border border-amber-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-300">
                  {records.length} Bản Ghi
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Theo dõi toàn diện ngày thực hiện, mô tả sự cố, hành động sửa chữa, linh kiện thay thế và KTV cho từng máy EDM.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Root Cause Analysis Module Quick Launch */}
          {onOpenRCA && (
            <button
              onClick={() => onOpenRCA(selectedDeviceId !== 'ALL' ? selectedDeviceId : undefined)}
              title="Khởi chạy Module AI phân tích nguyên nhân gốc rễ (5-Whys, Ishikawa) cho các sự cố dừng máy"
              className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-cyan-950/80 hover:from-cyan-900/80 hover:to-slate-800 px-3.5 py-2 text-xs font-bold text-cyan-300 transition active:scale-95 shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
              <span>Phân Tích Gốc Rễ AI (RCA)</span>
              <span className="rounded bg-cyan-500/20 px-1 py-0.2 text-[9px] font-mono text-cyan-300 font-bold border border-cyan-500/30">
                5-Whys
              </span>
            </button>
          )}

          {/* Báo Cáo Tóm Tắt Tuần (CSV / PDF / Tự Động Email Quản Lý) */}
          <button
            onClick={() => setShowWeeklyReportModal(true)}
            title="Mở bảng điều khiển Báo Cáo Tóm Tắt Sự Cố Tuần (CSV/PDF) & Lịch Tự Động Gửi Email Cho Quản Lý"
            className="flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/70 via-purple-950/60 to-indigo-950/70 hover:from-indigo-900/70 hover:to-purple-900/70 px-3.5 py-2 text-xs font-bold text-indigo-300 transition active:scale-95 shadow-md shadow-indigo-500/15 cursor-pointer"
          >
            <Mail className="h-4 w-4 text-indigo-400" />
            <span>Báo Cáo Sự Cố & Email Tuần</span>
            <span className="rounded bg-indigo-500/20 px-1 py-0.2 text-[9px] font-mono text-indigo-300 font-bold border border-indigo-500/30 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Auto-Email
            </span>
          </button>

          <button
            onClick={handleExportCSV}
            title="Xuất file CSV danh sách lịch sử đang lọc"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition active:scale-95 shadow-sm"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            title="In trang nhật ký bảo trì"
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition active:scale-95 shadow-sm"
          >
            <Printer className="h-4 w-4 text-cyan-400" />
            <span className="hidden sm:inline">In Báo Cáo</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/25 transition active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Ghi Nhận Lịch Sử Mới</span>
          </button>
        </div>

      </div>

      {/* 2. OVERALL KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Tổng Công Việc</span>
            <FileText className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-xl font-mono font-bold text-white">{stats.total}</div>
          <div className="text-[10px] text-slate-400">100% hồ sơ số hóa</div>
        </div>

        <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-red-300 text-[11px]">
            <span>Sự Cố Khẩn Cấp</span>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-xl font-mono font-bold text-red-400">{stats.corrective}</div>
          <div className="text-[10px] text-red-300">Khắc phục dừng máy</div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-emerald-300 text-[11px]">
            <span>Bảo Dưỡng Định Kỳ</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl font-mono font-bold text-emerald-400">{stats.preventive}</div>
          <div className="text-[10px] text-emerald-300">Theo chu kỳ giờ máy</div>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-purple-300 text-[11px]">
            <span>Linh Kiện Thay Mới</span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-xl font-mono font-bold text-purple-400">{stats.totalPartsCount}</div>
          <div className="text-[10px] text-purple-300">Phụ tùng chính hãng</div>
        </div>

        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-cyan-300 text-[11px]">
            <span>Tổng Giờ Thực Hiện</span>
            <Clock className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-xl font-mono font-bold text-cyan-400">{stats.totalHours}h</div>
          <div className="text-[10px] text-cyan-300">Thời gian xử lý MTTR</div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-amber-300 text-[11px]">
            <span>Tổng Chi Phí</span>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-sm sm:text-base font-mono font-bold text-amber-400 truncate">
            {formatVND(stats.totalCost)}
          </div>
          <div className="text-[10px] text-amber-300">Bảo trì & vật tư</div>
        </div>
      </div>

      {/* 3. MULTI-FILTER & SEARCH CONTROLS BAR */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3.5 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Bộ Lọc & Tìm Kiếm Lịch Sử Theo Yêu Cầu</span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: Cards / Table */}
            <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-0.5">
              <button
                onClick={() => setViewMode('cards')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  viewMode === 'cards'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Thẻ Chi Tiết
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  viewMode === 'table'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bảng Dữ Liệu
              </button>
            </div>

            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-300 transition"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Keyword Search Input */}
          <div className="relative">
            <label className="block text-slate-400 mb-1 font-medium">Tìm kiếm từ khóa</label>
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Mô tả sự cố, hành động, linh kiện, KTV..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-8 pr-8 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Device Filter Selector */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Lọc theo Thiết Bị (Máy)</label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            >
              <option value="ALL">Tất cả thiết bị ({devices.length} máy)</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  [{d.code}] {d.name} ({d.model})
                </option>
              ))}
            </select>
          </div>

          {/* Incident / Task Type Selector */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Lọc theo Loại Sự Cố / Công Việc</label>
            <select
              value={selectedTaskType}
              onChange={(e) => setSelectedTaskType(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            >
              <option value="ALL">Tất cả loại sự cố / bảo trì</option>
              <option value="CORRECTIVE">🚨 Sửa chữa khẩn cấp (Corrective)</option>
              <option value="PREVENTIVE">🛡️ Bảo dưỡng định kỳ (Preventive)</option>
              <option value="PARTS_REPLACEMENT">⚙️ Thay thế linh kiện (Parts Replacement)</option>
              <option value="CALIBRATION">📐 Hiệu chuẩn độ chính xác (Calibration)</option>
              <option value="OVERHAUL">🔧 Đại tu toàn diện (Overhaul)</option>
            </select>
          </div>

          {/* Date Range Preset Selector */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Lọc theo Ngày Tháng (Thời gian)</label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as HistoryDatePreset)}
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            >
              <option value="ALL">Toàn bộ thời gian</option>
              <option value="LAST_7_DAYS">7 ngày gần nhất</option>
              <option value="LAST_30_DAYS">30 ngày gần nhất</option>
              <option value="LAST_90_DAYS">90 ngày gần nhất</option>
              <option value="CUSTOM">📅 Tùy chỉnh khoảng ngày...</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Pickers (shown if CUSTOM is chosen) */}
        {datePreset === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 animate-in fade-in duration-150 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-amber-400" />
              Khoảng ngày:
            </span>
            <div className="flex items-center gap-2">
              <label className="text-slate-400">Từ:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-400">Đến:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-1.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-amber-400 underline hover:text-amber-300"
              >
                Xóa ngày
              </button>
            )}
          </div>
        )}

        {/* Result summary strip */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <div>
            Hiển thị <span className="font-mono font-bold text-amber-400">{filteredRecords.length}</span> /{' '}
            <span className="font-mono">{records.length}</span> bản ghi bảo trì phù hợp.
          </div>
          {(searchTerm || selectedDeviceId !== 'ALL' || selectedTaskType !== 'ALL' || datePreset !== 'ALL') && (
            <button
              onClick={handleResetFilters}
              className="text-amber-400 hover:underline flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Xóa bộ lọc để xem toàn bộ
            </button>
          )}
        </div>
      </div>

      {/* 4. MAIN RECORDS DISPLAY: CARDS VIEW OR TABLE VIEW */}
      {filteredRecords.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">Không tìm thấy lịch sử phù hợp</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Không có bản ghi bảo trì hoặc sửa chữa nào khớp với từ khóa, máy hoặc bộ lọc ngày bạn đã chọn.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleResetFilters}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white"
            >
              Đặt Lại Bộ Lọc
            </button>
            <button
              onClick={handleOpenAdd}
              className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950"
            >
              Ghi Nhận Bản Ghi Mới
            </button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* --- TIMELINE DETAILED CARDS VIEW --- */
        <div className="space-y-4">
          {filteredRecords.map((item) => {
            const dev = devices.find((d) => d.id === item.deviceId);
            const devCode = item.deviceCode || dev?.code || item.deviceId;
            const devName = item.deviceName || dev?.name || 'Máy gia công EDM';
            const location = dev?.location || 'Xưởng gia công chính';

            return (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-800/90 bg-slate-900/80 p-5 hover:border-slate-700 transition shadow-xl space-y-4"
              >
                {/* Card Top Strip: Device, Task Badge, Date, Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span
                      onClick={() => dev && onOpenMachineDetails && onOpenMachineDetails(dev)}
                      className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700 font-mono text-xs font-black text-amber-400 cursor-pointer hover:border-amber-500 hover:bg-amber-500/10 transition"
                      title="Bấm để mở chi tiết & cảm biến máy này"
                    >
                      {devCode}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white">{item.taskTitle}</h3>
                        {getTaskTypeBadge(item.taskType)}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Thiết bị: <span className="text-slate-200 font-medium">{devName}</span> • Vị trí:{' '}
                        <span className="text-slate-300">{location}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-xl bg-slate-950 border border-slate-800 px-3 py-1 text-xs font-mono text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-amber-400" />
                      <span>{new Date(item.completedAt).toLocaleString('vi-VN')}</span>
                    </div>

                    <button
                      onClick={() => handleOpenEdit(item)}
                      title="Chỉnh sửa bản ghi này"
                      className="p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 hover:text-amber-400 transition"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      title="Xóa bản ghi này"
                      className="p-1.5 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 hover:text-red-400 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Main 2-Column Content: Incident Description & Repair Actions Taken */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Box: MÔ TẢ SỰ CỐ / HIỆN TƯỢNG BAN ĐẦU */}
                  <div className="rounded-2xl border border-red-500/30 bg-red-950/15 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Mô Tả Sự Cố & Hiện Tượng Hư Hỏng:</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-line">
                      {item.incidentDescription || item.findingsAndActions}
                    </p>
                  </div>

                  {/* Right Box: HÀNH ĐỘNG SỬA CHỮA / QUY TRÌNH KHẮC PHỤC */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/15 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                      <Wrench className="h-4 w-4" />
                      <span>Hành Động Sửa Chữa & Biện Pháp Kỹ Thuật:</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-line">
                      {item.repairActions || item.findingsAndActions}
                    </p>
                  </div>
                </div>

                {/* Replacement Parts Strip */}
                {item.partsReplaced && item.partsReplaced.length > 0 && (
                  <div className="rounded-2xl border border-purple-500/30 bg-purple-950/15 p-3.5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
                      <Layers className="h-4 w-4 text-purple-400" />
                      <span>Bộ Phận / Linh Kiện Đã Thay Thế ({item.partsReplaced.length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.partsReplaced.map((part, pIdx) => (
                        <span
                          key={pIdx}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 px-3 py-1 text-xs font-medium text-purple-200 shadow-sm"
                        >
                          <Tag className="h-3 w-3 text-purple-400" />
                          <span>{part}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Details: Technician, Duration, Operating Hours, Cost & Quality Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3 text-xs">
                  <div className="flex flex-wrap items-center gap-4 text-slate-300">
                    <div className="flex items-center gap-1.5 font-medium text-white">
                      <User className="h-4 w-4 text-amber-400" />
                      <span>KTV Thực Hiện:</span>
                      <span className="font-bold text-amber-300">{item.technicianName}</span>
                      {item.technicianRole && (
                        <span className="text-slate-400">({item.technicianRole})</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Thời lượng:</span>
                      <span className="font-mono font-bold text-cyan-300">{item.durationMinutes} phút</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      <span>Giờ máy:</span>
                      <span className="font-mono font-bold text-slate-200">
                        {item.operatingHoursAtMaintenance} giờ
                      </span>
                    </div>

                    {item.costEstimateVND !== undefined && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <span>Chi phí:</span>
                        <span className="font-mono font-bold text-amber-300">
                          {formatVND(item.costEstimateVND)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.qualityPassed ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Nghiệm Thu Đạt Chuẩn
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
                        Chờ Kiểm Tra Lại
                      </span>
                    )}

                    {dev && onOpenMachineDetails && (
                      <button
                        onClick={() => onOpenMachineDetails(dev)}
                        className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold transition"
                      >
                        <span>Hồ sơ máy</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* --- SCADA DATA TABLE VIEW --- */
        <div className="rounded-3xl border border-slate-800 bg-slate-900 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-slate-950/90 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3 px-4">Ngày Thực Hiện</th>
                  <th className="py-3 px-3">Thiết Bị</th>
                  <th className="py-3 px-3">Loại Sự Cố</th>
                  <th className="py-3 px-4 min-w-[200px]">Mô Tả Sự Cố</th>
                  <th className="py-3 px-4 min-w-[220px]">Hành Động Sửa Chữa</th>
                  <th className="py-3 px-4 min-w-[160px]">Bộ Phận Thay Thế</th>
                  <th className="py-3 px-3">Kỹ Thuật Viên</th>
                  <th className="py-3 px-3 text-right">Chi Phí</th>
                  <th className="py-3 px-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredRecords.map((item) => {
                  const dev = devices.find((d) => d.id === item.deviceId);
                  const devCode = item.deviceCode || dev?.code || item.deviceId;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/50 transition">
                      {/* Date */}
                      <td className="py-3 px-4 font-mono whitespace-nowrap text-slate-300">
                        {new Date(item.completedAt).toLocaleDateString('vi-VN')}
                        <div className="text-[10px] text-slate-500">
                          {new Date(item.completedAt).toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Device */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-amber-400 block">{devCode}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px] block">
                          {item.deviceName}
                        </span>
                      </td>

                      {/* Task Type */}
                      <td className="py-3 px-3 whitespace-nowrap">{getTaskTypeBadge(item.taskType)}</td>

                      {/* Incident Description */}
                      <td className="py-3 px-4 text-slate-200">
                        <div className="line-clamp-2" title={item.incidentDescription}>
                          {item.incidentDescription || item.findingsAndActions}
                        </div>
                      </td>

                      {/* Repair Actions */}
                      <td className="py-3 px-4 text-slate-200">
                        <div className="line-clamp-2" title={item.repairActions || item.findingsAndActions}>
                          {item.repairActions || item.findingsAndActions}
                        </div>
                      </td>

                      {/* Replacement Parts */}
                      <td className="py-3 px-4">
                        {item.partsReplaced && item.partsReplaced.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.partsReplaced.map((part, pIdx) => (
                              <span
                                key={pIdx}
                                className="rounded bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.5 text-[10px] text-purple-300 whitespace-nowrap"
                              >
                                {part}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Không thay thế</span>
                        )}
                      </td>

                      {/* Technician */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-bold text-white block">{item.technicianName}</span>
                        <span className="text-[10px] text-slate-400 block">{item.durationMinutes} phút</span>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-400 whitespace-nowrap">
                        {formatVND(item.costEstimateVND)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Sửa bản ghi"
                            className="p-1 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            title="Xóa bản ghi"
                            className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      )}

      {/* --- ADD / EDIT MAINTENANCE RECORD MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl my-auto rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingRecord ? 'Cập Nhật Hồ Sơ Sửa Chữa & Bảo Trì' : 'Ghi Nhận Lịch Sử Bảo Trì & Sửa Chữa Mới'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lưu trữ chi tiết ngày, sự cố, hành động sửa chữa, linh kiện thay thế và kỹ thuật viên thực hiện.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Row 1: Device and Task Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Thiết Bị Cần Ghi Nhận *
                  </label>
                  <select
                    value={formData.deviceId}
                    onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-medium focus:ring-2 focus:ring-amber-500"
                  >
                    {devices.map((d) => (
                      <option key={d.id} value={d.id}>
                        [{d.code}] {d.name} ({d.model})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Loại Sự Cố / Công Việc Bảo Trì *
                  </label>
                  <select
                    value={formData.taskType}
                    onChange={(e) => setFormData({ ...formData, taskType: e.target.value as any })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-medium focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="CORRECTIVE">🚨 Khắc phục sự cố dừng máy khẩn cấp (Corrective)</option>
                    <option value="PREVENTIVE">🛡️ Bảo dưỡng định kỳ giờ máy (Preventive)</option>
                    <option value="PARTS_REPLACEMENT">⚙️ Thay thế linh kiện hao mòn (Parts Replacement)</option>
                    <option value="CALIBRATION">📐 Hiệu chuẩn độ chính xác & đo kiểm (Calibration)</option>
                    <option value="OVERHAUL">🔧 Đại tu toàn diện thiết bị (Overhaul)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Title and Date/Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">
                    Tiêu Đề Công Việc Sửa Chữa / Bảo Trì *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.taskTitle}
                    onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
                    placeholder="VD: Khắc phục kẹt dây cắt E-102 & Thông tắc vòi phun áp lực cao"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Ngày & Giờ Thực Hiện *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Row 3: MÔ TẢ SỰ CỐ (Yêu cầu chính) */}
              <div className="rounded-2xl border border-red-500/40 bg-red-950/20 p-4 space-y-1.5">
                <label className="block text-red-300 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span>Mô Tả Sự Cố / Hiện Tượng Hư Hỏng Ban Đầu *</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.incidentDescription}
                  onChange={(e) => setFormData({ ...formData, incidentDescription: e.target.value })}
                  placeholder="Ghi lại triệu chứng: Máy báo lỗi gì, âm thanh bất thường, áp suất giảm, điện áp sụt, phôi gia công bị lỗi ra sao..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 leading-relaxed"
                />
              </div>

              {/* Row 4: HÀNH ĐỘNG SỬA CHỮA (Yêu cầu chính) */}
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-1.5">
                <label className="block text-emerald-300 font-bold flex items-center gap-1.5">
                  <Wrench className="h-4 w-4 text-emerald-400" />
                  <span>Hành Động Sửa Chữa & Quy Trình Khắc Phục Kỹ Thuật *</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.repairActions}
                  onChange={(e) => setFormData({ ...formData, repairActions: e.target.value })}
                  placeholder="Ghi rõ các bước đã làm: Tháo gỡ cụm nào, vệ sinh súc rửa bằng dung môi gì, thay thế linh kiện nào, cân chỉnh lại khe hở hay thước quang ra sao..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              {/* Row 5: BỘ PHẬN THAY THẾ (Yêu cầu chính) */}
              <div className="rounded-2xl border border-purple-500/40 bg-purple-950/20 p-4 space-y-2">
                <label className="block text-purple-300 font-bold flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-purple-400" />
                  <span>Bộ Phận / Linh Kiện Thay Thế</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.partsInput}
                    onChange={(e) => setFormData({ ...formData, partsInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPart();
                      }
                    }}
                    placeholder="Nhập tên linh kiện thay thế (VD: Ống xả áp Upper Nozzle 4mm) rồi bấm Thêm..."
                    className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 font-bold text-white transition active:scale-95"
                  >
                    Thêm
                  </button>
                </div>

                {formData.partsList.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {formData.partsList.map((part, pIdx) => (
                      <span
                        key={pIdx}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500/30 border border-purple-500/50 px-2.5 py-1 text-xs text-purple-200"
                      >
                        <span>{part}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePart(part)}
                          className="text-purple-300 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 6: KỸ THUẬT VIÊN THỰC HIỆN & CHỈ SỐ */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">
                    Kỹ Thuật Viên Thực Hiện *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.technicianName}
                      onChange={(e) => {
                        const tech = technicians.find((t) => t.name === e.target.value);
                        setFormData({
                          ...formData,
                          technicianName: e.target.value,
                          technicianRole: tech?.role || 'Kỹ thuật viên Bảo trì',
                        });
                      }}
                      className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-medium focus:ring-2 focus:ring-amber-500"
                    >
                      {technicians.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.role} - {t.shift})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Thời Lượng (Phút)</label>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Giờ Máy (Hours)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.operatingHours}
                    onChange={(e) => setFormData({ ...formData, operatingHours: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Row 7: Chi Phí & Nghiệm Thu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Chi Phí Ước Tính (VND)
                  </label>
                  <input
                    type="number"
                    step={100000}
                    value={formData.costEstimateVND}
                    onChange={(e) => setFormData({ ...formData, costEstimateVND: Number(e.target.value) })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Trạng Thái Nghiệm Thu Kỹ Thuật
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        checked={formData.qualityPassed}
                        onChange={() => setFormData({ ...formData, qualityPassed: true })}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-emerald-400 font-bold">✓ Đạt chuẩn nghiệm thu</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        checked={!formData.qualityPassed}
                        onChange={() => setFormData({ ...formData, qualityPassed: false })}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-amber-400 font-bold">Chờ chạy rà thêm</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 font-bold text-slate-300 hover:bg-slate-700 transition"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-6 py-2.5 font-black text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-95"
                >
                  {editingRecord ? 'Lưu Cập Nhật Hồ Sơ' : 'Lưu Hồ Sơ Bảo Trì Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-red-500/40 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/20 border border-red-500/40">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Xác Nhận Xóa Bản Ghi Lịch Sử?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa bản ghi bảo trì này khỏi hồ sơ thiết bị? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-600/30"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- WEEKLY INCIDENT SUMMARY REPORT MODAL (CSV / PDF / DIRECT SEND TO MANAGER) --- */}
      <WeeklyIncidentReportModal
        isOpen={showWeeklyReportModal}
        onClose={() => setShowWeeklyReportModal(false)}
        records={records}
        devices={devices}
        technicians={technicians}
        onToast={onToast}
      />
    </div>
  );
};
