import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Award,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Cpu,
  DollarSign,
  FileCheck2,
  FileText,
  Filter,
  Flame,
  Gauge,
  Layers,
  Phone,
  Plus,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { Device, MaintenanceRecord } from '../types';
import { calculatePredictedMaintenance } from '../utils/maintenancePrediction';
import {
  getDeviceMaintenanceHistory,
  saveMaintenanceRecord,
} from '../utils/maintenanceHistoryData';
import { generateMachineQRDataUrl } from '../utils/qrCodeHelper';

interface MachineDetailsModalProps {
  device: Device;
  onClose: () => void;
  onOpenDiagnosis?: (device: Device) => void;
  onTriggerAlarm?: (deviceId: string) => void;
}

export const MachineDetailsModal: React.FC<MachineDetailsModalProps> = ({
  device,
  onClose,
  onOpenDiagnosis,
  onTriggerAlarm,
}) => {
  const [activeTab, setActiveTab] = useState<'maintenance' | 'telemetry' | 'prediction'>('maintenance');
  const [records, setRecords] = useState<MaintenanceRecord[]>(() =>
    getDeviceMaintenanceHistory(device.id)
  );
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [showQRTag, setShowQRTag] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    generateMachineQRDataUrl(device).then((url) => {
      if (active) setQrDataUrl(url);
    });
    return () => {
      active = false;
    };
  }, [device]);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<MaintenanceRecord['taskType']>('PREVENTIVE');
  const [newTech, setNewTech] = useState(device.assignedTechnician?.name || 'Kỹ thuật viên EDM');
  const [newDuration, setNewDuration] = useState('60');
  const [newParts, setNewParts] = useState('');
  const [newFindings, setNewFindings] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newHours, setNewHours] = useState('4250');
  const [formSuccess, setFormSuccess] = useState(false);

  // Heuristic maintenance prediction
  const prediction = useMemo(() => calculatePredictedMaintenance(device), [device]);

  // Filtered maintenance history
  const filteredRecords = useMemo(() => {
    if (filterType === 'ALL') return records;
    return records.filter((r) => r.taskType === filterType);
  }, [records, filterType]);

  // Statistics for this machine's maintenance
  const totalCost = useMemo(() => {
    return records.reduce((acc, r) => acc + (r.costEstimateVND || 0), 0);
  }, [records]);

  const totalMinutes = useMemo(() => {
    return records.reduce((acc, r) => acc + r.durationMinutes, 0);
  }, [records]);

  // Handle submit new maintenance record
  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const partsList = newParts
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const record: MaintenanceRecord = {
      id: `maint-${Date.now()}`,
      deviceId: device.id,
      taskTitle: newTitle.trim(),
      taskType: newType,
      completedAt: new Date().toISOString(),
      technicianName: newTech.trim() || 'Kỹ thuật viên ca trực',
      technicianRole: 'Kỹ thuật viên Bảo trì',
      durationMinutes: parseInt(newDuration, 10) || 60,
      partsReplaced: partsList,
      findingsAndActions:
        newFindings.trim() ||
        'Đã kiểm tra, vệ sinh cụm phóng điện, căn chỉnh khe hở và nghiệm thu hoạt động ổn định.',
      technicianNotes: newNotes.trim() || 'Đã vận hành thử không tải và có tải đạt yêu cầu kỹ thuật.',
      operatingHoursAtMaintenance: parseInt(newHours, 10) || 4200,
      qualityPassed: true,
      costEstimateVND: 1200000,
      aiVerified: true,
    };

    const updated = saveMaintenanceRecord(record);
    setRecords(updated.filter((r) => r.deviceId === device.id));
    setShowAddForm(false);
    setNewTitle('');
    setNewParts('');
    setNewFindings('');
    setNewNotes('');
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 4000);
  };

  const getTaskTypeBadge = (type: MaintenanceRecord['taskType']) => {
    switch (type) {
      case 'PREVENTIVE':
        return (
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
            BẢO DƯỠNG ĐỊNH KỲ
          </span>
        );
      case 'CORRECTIVE':
        return (
          <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-red-400">
            SỬA CHỮA KHẨN CẤP
          </span>
        );
      case 'PARTS_REPLACEMENT':
        return (
          <span className="rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-purple-400">
            THAY THẾ LINH KIỆN
          </span>
        );
      case 'CALIBRATION':
        return (
          <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-400">
            HIỆU CHUẨN ĐỘ CHÍNH XÁC
          </span>
        );
      case 'OVERHAUL':
        return (
          <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-400">
            ĐẠI TU TOÀN DIỆN
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-mono text-slate-300">
            BẢO DƯỠNG
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden my-auto">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 font-mono text-sm font-extrabold text-amber-400">
              {device.code}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {device.name}
                </h3>
                {device.status === 'RUNNING' ? (
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Đang Chạy
                  </span>
                ) : device.status === 'ALARM_STOPPED' ? (
                  <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-bold text-red-400">
                    Sự Cố Dừng Máy
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                    Chờ Lệnh
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Model: <span className="text-slate-200 font-medium">{device.model}</span> • Hãng:{' '}
                <span className="text-slate-200 font-medium">{device.brand}</span> • Khu vực:{' '}
                <span className="text-slate-200 font-medium">{device.location}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* QR Asset Tag Button */}
            <button
              onClick={() => setShowQRTag(!showQRTag)}
              className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 transition"
              title="Xem tem nhãn mã QR vật lý dán trên máy này"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>{showQRTag ? 'Ẩn Tem QR' : 'Tem QR Máy'}</span>
            </button>

            {onOpenDiagnosis && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDiagnosis(device);
                }}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 text-xs font-semibold text-purple-300 transition"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Trợ Lý Sửa Chữa AI</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Đóng cửa sổ"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-5 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${
                activeTab === 'maintenance'
                  ? 'border-amber-500 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="h-4 w-4" />
              <span>Lịch Sử Bảo Dưỡng ({records.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('prediction')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${
                activeTab === 'prediction'
                  ? 'border-amber-500 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarClock className="h-4 w-4" />
              <span>Dự Báo Bảo Dưỡng AI</span>
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs sm:text-sm font-semibold transition ${
                activeTab === 'telemetry'
                  ? 'border-amber-500 text-amber-400 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Thông Số & Cảm Biến</span>
            </button>
          </div>

          {activeTab === 'maintenance' && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showAddForm ? 'Hủy Biểu Mẫu' : 'Ghi Nhận Bảo Dưỡng Mới'}</span>
            </button>
          )}
        </div>

        {/* NOTIFICATION TOAST WHEN LOGGED */}
        {formSuccess && (
          <div className="bg-emerald-600/90 text-white px-5 py-2.5 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Đã ghi nhận nhiệm vụ bảo dưỡng thành công vào hồ sơ thiết bị và đồng bộ AI Brain!</span>
          </div>
        )}

        {/* QR ASSET TAG STICKER DRAWER */}
        {showQRTag && (
          <div className="border-b border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 p-4 animate-in slide-in-from-top-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="shrink-0 p-2 bg-white rounded-2xl shadow-lg border-2 border-amber-400">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt={`Mã QR ${device.code}`} className="h-24 w-24 object-contain" />
                  ) : (
                    <div className="h-24 w-24 flex items-center justify-center text-xs text-slate-500 font-mono">Tạo QR...</div>
                  )}
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-amber-500 text-slate-950 font-mono font-black px-1.5 py-0.5 text-[10px]">
                      PHYSICAL ASSET TAG
                    </span>
                    <span className="font-mono font-bold text-amber-400 text-sm">{device.code}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{device.name}</h4>
                  <p className="text-slate-300">Model: {device.model} • Hãng: {device.brand}</p>
                  <p className="text-slate-400">Vị trí dán tem: {device.location}</p>
                  <p className="text-[11px] text-emerald-400">✓ Quét mã này trên ứng dụng để mở trực tiếp chẩn đoán & bảo dưỡng</p>
                </div>
              </div>

              <div className="flex sm:flex-col gap-2 shrink-0">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md transition"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>In Tem Dán</span>
                </button>
                <button
                  onClick={() => setShowQRTag(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition"
                >
                  Đóng Tem
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: MAINTENANCE HISTORY */}
          {activeTab === 'maintenance' && (
            <div className="space-y-5">
              {/* Summary Metric Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Tổng số nhiệm vụ</span>
                    <Wrench className="h-3.5 w-3.5 text-amber-400" />
                  </div>
                  <div className="mt-1 font-mono text-xl font-bold text-white">
                    {records.length} <span className="text-xs font-normal text-slate-400">lần</span>
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">100% đạt chuẩn nghiệm thu</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Tổng thời gian bảo trì</span>
                    <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                  <div className="mt-1 font-mono text-xl font-bold text-cyan-400">
                    {(totalMinutes / 60).toFixed(1)}{' '}
                    <span className="text-xs font-normal text-slate-400">giờ</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">TB: {Math.round(totalMinutes / Math.max(1, records.length))} phút/lần</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Linh kiện đã thay thế</span>
                    <Layers className="h-3.5 w-3.5 text-purple-400" />
                  </div>
                  <div className="mt-1 font-mono text-xl font-bold text-purple-400">
                    {records.reduce((acc, r) => acc + r.partsReplaced.length, 0)}{' '}
                    <span className="text-xs font-normal text-slate-400">phụ tùng</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Lọc, kim cương, bạc đạn</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Lần bảo dưỡng gần nhất</span>
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div className="mt-1 font-mono text-sm font-bold text-emerald-400 truncate">
                    {records[0] ? new Date(records[0].completedAt).toLocaleDateString('vi-VN') : 'Chưa có'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    KTV: {records[0]?.technicianName || 'N/A'}
                  </div>
                </div>
              </div>

              {/* ADD NEW MAINTENANCE TASK FORM */}
              {showAddForm && (
                <form
                  onSubmit={handleCreateRecord}
                  className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 p-4 space-y-3.5 shadow-xl animate-in slide-in-from-top-3"
                >
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Plus className="h-4 w-4" />
                      <span>Ghi Nhận Nhiệm Vụ Bảo Dưỡng Hoàn Thành Mới</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">Mã máy: {device.code}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Tiêu đề nhiệm vụ bảo dưỡng *</label>
                      <input
                        type="text"
                        required
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="VD: Thay cụm ống dẫn kim cương & hiệu chỉnh độ vuông góc"
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Loại hình bảo dưỡng</label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                      >
                        <option value="PREVENTIVE">Bảo dưỡng định kỳ (Preventive)</option>
                        <option value="CORRECTIVE">Khắc phục sự cố khẩn cấp (Corrective)</option>
                        <option value="PARTS_REPLACEMENT">Thay thế linh kiện tiêu hao (Parts)</option>
                        <option value="CALIBRATION">Hiệu chuẩn độ chính xác & đo kiểm (Calibration)</option>
                        <option value="OVERHAUL">Đại tu toàn diện thiết bị (Overhaul)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-medium">Kỹ thuật viên thực hiện</label>
                      <input
                        type="text"
                        value={newTech}
                        onChange={(e) => setNewTech(e.target.value)}
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-300 mb-1 font-medium">Thời lượng (phút)</label>
                        <input
                          type="number"
                          value={newDuration}
                          onChange={(e) => setNewDuration(e.target.value)}
                          className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1 font-medium">Giờ máy (Hours)</label>
                        <input
                          type="number"
                          value={newHours}
                          onChange={(e) => setNewHours(e.target.value)}
                          className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 mb-1 font-medium">
                        Linh kiện thay thế (cách nhau bởi dấu phẩy)
                      </label>
                      <input
                        type="text"
                        value={newParts}
                        onChange={(e) => setNewParts(e.target.value)}
                        placeholder="VD: Cụm dẫn hướng kim cương 0.25mm, Lõi lọc điện môi 5µm, Tấm tiếp điện"
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 mb-1 font-medium">
                        Nội dung phát hiện & Biện pháp kỹ thuật đã xử lý
                      </label>
                      <textarea
                        rows={2}
                        value={newFindings}
                        onChange={(e) => setNewFindings(e.target.value)}
                        placeholder="Ghi lại hiện trạng linh kiện, nguyên nhân hao mòn và kết quả sau khi căn chỉnh..."
                        className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="rounded-xl border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20"
                    >
                      Lưu Hồ Sơ Bảo Dưỡng
                    </button>
                  </div>
                </form>
              )}

              {/* FILTER BAR FOR MAINTENANCE RECORDS */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  <span className="text-slate-400 flex items-center gap-1 pr-1">
                    <Filter className="h-3 w-3" />
                    Lọc:
                  </span>
                  {[
                    { id: 'ALL', label: 'Tất cả' },
                    { id: 'PREVENTIVE', label: 'Định kỳ' },
                    { id: 'CORRECTIVE', label: 'Khắc phục' },
                    { id: 'PARTS_REPLACEMENT', label: 'Thay linh kiện' },
                    { id: 'CALIBRATION', label: 'Hiệu chuẩn' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterType(f.id)}
                      className={`rounded-lg px-2.5 py-1 font-medium transition ${
                        filterType === f.id
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  Hiển thị {filteredRecords.length}/{records.length} bản ghi
                </span>
              </div>

              {/* TIMELINE OF COMPLETED MAINTENANCE RECORDS */}
              <div className="space-y-3">
                {filteredRecords.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-400 text-xs">
                    Không có lịch sử bảo dưỡng nào khớp với bộ lọc này.
                  </div>
                ) : (
                  filteredRecords.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 hover:border-slate-700 transition space-y-2.5"
                    >
                      {/* Record Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getTaskTypeBadge(item.taskType)}
                          <h4 className="font-bold text-white text-sm sm:text-base leading-snug">
                            {item.taskTitle}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-amber-400" />
                            {new Date(item.completedAt).toLocaleDateString('vi-VN')}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-cyan-400" />
                            {item.durationMinutes} phút
                          </span>
                          <span>•</span>
                          <span className="text-slate-300 font-bold">
                            Giờ máy: {item.operatingHoursAtMaintenance.toLocaleString()}h
                          </span>
                        </div>
                      </div>

                      {/* Findings and technical actions */}
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/60">
                        {item.findingsAndActions}
                      </p>

                      {/* Parts replaced pill tags */}
                      {item.partsReplaced && item.partsReplaced.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                            <Layers className="h-3 w-3 text-purple-400" />
                            Linh kiện đã thay:
                          </span>
                          {item.partsReplaced.map((part, pIdx) => (
                            <span
                              key={pIdx}
                              className="rounded-lg bg-slate-900 border border-slate-700/80 px-2 py-0.5 text-[10px] text-purple-300 font-medium"
                            >
                              ✓ {part}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer sign-off and technician */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-2 text-[11px]">
                        <div className="flex items-center gap-2 text-slate-400">
                          <span className="flex items-center gap-1 text-slate-300 font-medium">
                            <User className="h-3.5 w-3.5 text-amber-400" />
                            KTV: {item.technicianName}
                          </span>
                          {item.technicianRole && <span>({item.technicianRole})</span>}
                          {item.technicianNotes && (
                            <span className="italic text-slate-400 truncate max-w-xs">
                              — "{item.technicianNotes}"
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {item.qualityPassed && (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Nghiệm thu đạt chuẩn
                            </span>
                          )}
                          {item.aiVerified && (
                            <span className="flex items-center gap-1 text-amber-400 font-medium">
                              <Sparkles className="h-3 w-3" />
                              AI Brain Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: AI MAINTENANCE PREDICTIONS */}
          {activeTab === 'prediction' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 text-amber-400" />
                    <h4 className="font-bold text-white text-base">
                      Dự Đoán Thời Điểm Bảo Dưỡng Kế Tiếp Cho Thiết Bị Này
                    </h4>
                  </div>
                  <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 text-xs font-mono font-bold text-amber-400">
                    Heuristic Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                    <span className="text-xs text-slate-400 block">Ngày dự đoán cần bảo dưỡng</span>
                    <div className="mt-1 font-mono text-xl font-extrabold text-amber-400">
                      {prediction.predictedDateStr}
                    </div>
                    <span className="text-[11px] text-slate-400">Theo chu kỳ suy hao thực tế</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                    <span className="text-xs text-slate-400 block">Thời gian còn lại</span>
                    <div className={`mt-1 font-mono text-xl font-extrabold ${prediction.daysRemaining <= 2 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {prediction.daysRemaining === 0 ? 'Khẩn Cấp' : `${prediction.daysRemaining} ngày`}
                    </div>
                    <span className="text-[11px] text-slate-400">Mức độ: {prediction.urgencyLevel}</span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
                    <span className="text-xs text-slate-400 block">Điểm độ bền linh kiện (Health Score)</span>
                    <div className="mt-1 font-mono text-xl font-extrabold text-white">
                      {prediction.healthScore}%
                    </div>
                    <span className="text-[11px] text-emerald-400">Độ tin cậy vận hành cao</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-amber-400" />
                    <span>Hạng mục bảo dưỡng ưu tiên số 1 khi đến kỳ:</span>
                  </h5>
                  <p className="text-sm font-semibold text-white pl-5">
                    {prediction.primaryMaintenanceTask}
                  </p>
                  <p className="text-xs text-slate-400 pl-5 leading-relaxed">
                    💡 <strong>Cơ sở tính toán:</strong> {prediction.heuristicRationale}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE TELEMETRY & SPECS */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Điện áp xung</span>
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                  </span>
                  <div className="mt-1 font-mono text-xl font-bold text-white">
                    {device.telemetry.dischargeVoltage}V
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Chuẩn: {device.nominalRanges.dischargeVoltage[0]}-{device.nominalRanges.dischargeVoltage[1]}V
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Dòng đỉnh xung</span>
                    <Activity className="h-3.5 w-3.5 text-cyan-400" />
                  </span>
                  <div className="mt-1 font-mono text-xl font-bold text-white">
                    {device.telemetry.peakCurrent}A
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Chuẩn: {device.nominalRanges.peakCurrent[0]}-{device.nominalRanges.peakCurrent[1]}A
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Áp suất dung môi</span>
                    <Gauge className="h-3.5 w-3.5 text-blue-400" />
                  </span>
                  <div className="mt-1 font-mono text-xl font-bold text-white">
                    {device.telemetry.dielectricPressure} Bar
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Chuẩn: {device.nominalRanges.dielectricPressure[0]}-{device.nominalRanges.dielectricPressure[1]} Bar
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <span className="text-xs text-slate-400 flex items-center justify-between">
                    <span>Nhiệt độ dung dịch</span>
                    <Flame className="h-3.5 w-3.5 text-rose-400" />
                  </span>
                  <div className="mt-1 font-mono text-xl font-bold text-white">
                    {device.telemetry.dielectricTemp}°C
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Chuẩn: {device.nominalRanges.dielectricTemp[0]}-{device.nominalRanges.dielectricTemp[1]}°C
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-amber-400" />
                  <span>Hồ Sơ Kỹ Thuật Nhà Máy & Cấu Hình Thiết Bị</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Dòng máy:</span>
                    <span className="font-semibold text-white">{device.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Kỹ thuật viên phụ trách:</span>
                    <span className="font-semibold text-amber-400">
                      {device.assignedTechnician?.name || 'Chưa phân công'} ({device.assignedTechnician?.phone})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Tín hiệu EDM gần nhất:</span>
                    <span className="font-mono text-white">
                      {new Date(device.lastEdmSignalTime).toLocaleTimeString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-5 py-3">
          <div className="text-xs text-slate-400">
            Hồ sơ bảo trì liên kết cơ sở dữ liệu số hóa nhà máy thông minh
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
