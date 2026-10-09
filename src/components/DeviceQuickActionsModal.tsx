import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Sliders,
  RefreshCw,
  Radio,
  CheckCircle2,
  X,
  Gauge,
  Zap,
  Activity,
  Flame,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import { Device, MachineTelemetry } from '../types';
import { soundManager } from '../utils/audio';
import { saveMaintenanceRecord } from '../utils/maintenanceHistoryData';

export type QuickActionMode = 'RESET_COUNTER' | 'CALIBRATE_SENSOR' | 'FORCE_SYNC' | 'PING_CONTROLLER' | null;

interface DeviceQuickActionsModalProps {
  device: Device;
  mode: QuickActionMode;
  onClose: () => void;
  onSuccess: (updatedDevice: Device, message: string) => void;
}

export const DeviceQuickActionsModal: React.FC<DeviceQuickActionsModalProps> = ({
  device,
  mode,
  onClose,
  onSuccess,
}) => {
  if (!mode) return null;

  // --- STATE FOR RESET COUNTER ---
  const [resetScope, setResetScope] = useState<string>('FULL_CYCLE');
  const [resetPerformer, setResetPerformer] = useState<string>(
    device.assignedTechnician?.name || 'Kỹ thuật viên hiện trường'
  );
  const [resetNotes, setResetNotes] = useState<string>('Đã kiểm tra định kỳ, vệ sinh phôi và thay phụ tùng tiêu hao theo quy trình chuẩn.');
  const [isResetting, setIsResetting] = useState(false);

  // --- STATE FOR CALIBRATE SENSOR ---
  const [selectedSensor, setSelectedSensor] = useState<string>('ALL');
  const [calibStage, setCalibStage] = useState<number>(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibProgress, setCalibProgress] = useState(0);

  // --- STATE FOR FORCE SYNC ---
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLatency, setSyncLatency] = useState<number | null>(null);

  // --- STATE FOR PING ---
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ pingMs: number; status: string } | null>(null);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isResetting && !isCalibrating && !isSyncing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isResetting, isCalibrating, isSyncing]);

  // ==========================================
  // ACTION HANDLERS
  // ==========================================

  // 1. Handle Reset Service Counter
  const handleExecuteResetCounter = async () => {
    setIsResetting(true);
    try {
      const scopeLabelMap: Record<string, string> = {
        FULL_CYCLE: 'Toàn bộ chu kỳ bảo dưỡng 500h',
        FILTER: 'Bộ lọc áp lực dung môi (Filter Cartridge - 250h)',
        GUIDE: 'Cụm dẫn hướng kim cương & Khối tiếp điện (300h)',
        RESIN: 'Hạt nhựa trao đổi Ion khử khoáng (150h)',
      };
      const scopeLabel = scopeLabelMap[resetScope] || 'Chu kỳ bảo dưỡng';

      const res = await fetch(`/api/devices/${device.id}/quick-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-service-counter',
          resetScope: scopeLabel,
          technicianName: resetPerformer,
          note: resetNotes,
        }),
      });

      const data = await res.json();
      if (data.success && data.device) {
        // Record in maintenance history log
        saveMaintenanceRecord({
          id: `maint-reset-${Date.now()}`,
          deviceId: device.id,
          taskTitle: `Tác vụ nhanh: Đặt lại bộ đếm (${scopeLabel})`,
          taskType: 'PREVENTIVE',
          completedAt: new Date().toISOString(),
          technicianName: resetPerformer,
          technicianRole: device.assignedTechnician?.role || 'Kỹ thuật viên bảo trì',
          durationMinutes: 15,
          partsReplaced:
            resetScope === 'FILTER'
              ? ['Bộ lọc giấy ion 3-micron']
              : resetScope === 'GUIDE'
              ? ['Cụm dẫn hướng kim cương trên/dưới']
              : resetScope === 'RESIN'
              ? ['Cột hạt nhựa Deionizing Resin']
              : ['Vệ sinh tổng thể & Kiểm tra cảm biến'],
          findingsAndActions: `Thực hiện reset bộ đếm giờ vận hành từ SCADA Quick Actions. Ghi chú: ${resetNotes}`,
          technicianNotes: `Bộ đếm chu kỳ đặt lại về 0h. Máy sẵn sàng chu kỳ gia công kế tiếp.`,
          operatingHoursAtMaintenance: 4200,
          qualityPassed: true,
          costEstimateVND: 1200000,
          aiVerified: true,
        });

        soundManager.playSuccessChime();
        onSuccess(data.device, data.message);
        onClose();
      } else {
        alert(data.message || 'Lỗi khi đặt lại bộ đếm');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối đến máy chủ để đặt lại bộ đếm');
    } finally {
      setIsResetting(false);
    }
  };

  // 2. Handle Calibrate Sensor
  const handleExecuteCalibration = async () => {
    setIsCalibrating(true);
    setCalibProgress(10);
    setCalibStage(1);

    // Realistic multi-stage calibration sequence
    await new Promise((r) => setTimeout(r, 350));
    setCalibProgress(35);
    setCalibStage(2);

    await new Promise((r) => setTimeout(r, 450));
    setCalibProgress(70);
    setCalibStage(3);

    await new Promise((r) => setTimeout(r, 400));
    setCalibProgress(95);
    setCalibStage(4);

    try {
      const res = await fetch(`/api/devices/${device.id}/quick-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'calibrate-sensor',
          sensorType: selectedSensor,
          technicianName: device.assignedTechnician?.name || 'Kỹ thuật viên hiện trường',
        }),
      });

      const data = await res.json();
      setCalibProgress(100);
      await new Promise((r) => setTimeout(r, 200));

      if (data.success && data.device) {
        soundManager.playSuccessChime();
        onSuccess(data.device, data.message);
        onClose();
      } else {
        alert(data.message || 'Lỗi hiệu chuẩn cảm biến');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối đến máy chủ để hiệu chuẩn');
    } finally {
      setIsCalibrating(false);
      setCalibStage(0);
    }
  };

  // 3. Handle Force Sync
  const handleExecuteForceSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/devices/${device.id}/quick-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'force-sync',
          technicianName: device.assignedTechnician?.name || 'Kỹ thuật viên hiện trường',
        }),
      });

      const data = await res.json();
      if (data.success && data.device) {
        setSyncLatency(data.data?.latencyMs || 14);
        soundManager.playSuccessChime();
        onSuccess(data.device, data.message);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        alert(data.message || 'Lỗi đồng bộ PLC');
      }
    } catch (err) {
      console.error(err);
      alert('Không thể kết nối đến máy chủ để đồng bộ');
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. Handle Ping Controller
  const handleExecutePing = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await fetch(`/api/devices/${device.id}/quick-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping-controller' }),
      });
      const data = await res.json();
      if (data.success) {
        setPingResult(data.data);
        soundManager.playBeep();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl shadow-black/80 overflow-hidden">
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              {mode === 'RESET_COUNTER' && <RotateCcw className="h-5 w-5" />}
              {mode === 'CALIBRATE_SENSOR' && <Sliders className="h-5 w-5" />}
              {mode === 'FORCE_SYNC' && <RefreshCw className="h-5 w-5" />}
              {mode === 'PING_CONTROLLER' && <Radio className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700">
                  {device.code}
                </span>
                <h3 className="font-bold text-white text-base">
                  {mode === 'RESET_COUNTER' && 'Đặt Lại Bộ Đếm Bảo Dưỡng (Reset Service Counter)'}
                  {mode === 'CALIBRATE_SENSOR' && 'Hiệu Chuẩn Cảm Biến Tức Thì (Calibrate Sensor)'}
                  {mode === 'FORCE_SYNC' && 'Cưỡng Bức Đồng Bộ PLC (Force Sync)'}
                  {mode === 'PING_CONTROLLER' && 'Kiểm Tra Kết Nối PLC Controller (Ping)'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {device.name} • {device.model} ({device.location})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isResetting || isCalibrating || isSyncing}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
            title="Đóng cửa sổ"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* MODE 1: RESET SERVICE COUNTER */}
        {/* ============================================================== */}
        {mode === 'RESET_COUNTER' && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-300">Thông tin chu kỳ hiện tại:</span>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">Thời gian chạy liên tục:</span>{' '}
                      <strong className="text-white font-mono">
                        {device.serviceCounterResetAt ? 'Vừa reset' : 'Đang tích lũy'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Chu kỳ tiêu chuẩn:</span>{' '}
                      <strong className="text-emerald-400 font-mono">500 giờ</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scope selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Hạng mục bộ đếm cần đặt lại về 0:
              </label>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {[
                  {
                    id: 'FULL_CYCLE',
                    title: 'Toàn bộ chu kỳ bảo dưỡng định kỳ (500 Giờ)',
                    desc: 'Khởi tạo lại đồng hồ bảo dưỡng tổng thể, xóa tích lũy nguy cơ và đưa dự đoán bảo dưỡng về mức an toàn.',
                  },
                  {
                    id: 'FILTER',
                    title: 'Bộ lọc áp lực dung môi (Filter Cartridge - 250 Giờ)',
                    desc: 'Xác nhận vừa thay phin lọc ion 3-micron, áp suất bơm trở lại định mức.',
                  },
                  {
                    id: 'GUIDE',
                    title: 'Cụm dẫn hướng kim cương & Khối tiếp điện (300 Giờ)',
                    desc: 'Xác nhận đã đảo vị trí khối tiếp điện cacbua và làm sạch lỗ kim cương.',
                  },
                  {
                    id: 'RESIN',
                    title: 'Cột hạt nhựa Deionizer trao đổi Ion (150 Giờ)',
                    desc: 'Khôi phục độ điện trở suất nước khử khoáng theo chuẩn EDM.',
                  },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition ${
                      resetScope === item.id
                        ? 'border-amber-500 bg-amber-500/10 text-white'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resetScope"
                      value={item.id}
                      checked={resetScope === item.id}
                      onChange={() => setResetScope(item.id)}
                      className="mt-0.5 accent-amber-500"
                    />
                    <div>
                      <div className="font-bold text-xs">{item.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Technician name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Kỹ thuật viên thực hiện:
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={resetPerformer}
                    onChange={(e) => setResetPerformer(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    placeholder="Tên kỹ thuật viên"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Xác nhận hồ sơ:
                </label>
                <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2 text-[11px] text-slate-300 flex items-center gap-1.5 h-[38px]">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Tự động tạo biên bản bảo trì SCADA</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Ghi chú thao tác bảo trì:
              </label>
              <textarea
                value={resetNotes}
                onChange={(e) => setResetNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                placeholder="Nhập ghi chú hoặc mã linh kiện đã vệ sinh..."
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isResetting}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteResetCounter}
                disabled={isResetting}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition active:scale-95 disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Đang ghi nhận bộ đếm...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    <span>Xác Nhận Đặt Lại Bộ Đếm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 2: CALIBRATE SENSOR */}
        {/* ============================================================== */}
        {mode === 'CALIBRATE_SENSOR' && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs text-slate-300">
              <p className="flex items-center gap-1.5 font-semibold text-cyan-300">
                <Sliders className="h-4 w-4" />
                Quy trình hiệu chuẩn cảm biến trực tiếp từ xa (Zero/Span Field Calibration)
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Lệnh gửi trực tiếp tới module thu thập tín hiệu PLC để khử trôi điểm 0, lấy mẫu trung bình 128 chu kỳ xung và chuẩn hóa thông số về giá trị danh định.
              </p>
            </div>

            {/* Sensor selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Chọn cảm biến cần hiệu chuẩn:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'ALL', label: 'Tất cả cảm biến', icon: Sliders, current: 'Đồng bộ toàn máy' },
                  {
                    id: 'DIELECTRIC_PRESSURE',
                    label: 'Áp suất dung môi',
                    icon: Gauge,
                    current: `${device.telemetry.dielectricPressure.toFixed(2)} Bar (Chuẩn: ${device.nominalRanges.dielectricPressure.join('-')})`,
                  },
                  {
                    id: 'DISCHARGE_VOLTAGE',
                    label: 'Điện áp xung',
                    icon: Zap,
                    current: `${device.telemetry.dischargeVoltage.toFixed(1)} V (Chuẩn: ${device.nominalRanges.dischargeVoltage.join('-')})`,
                  },
                  {
                    id: 'PEAK_CURRENT',
                    label: 'Dòng đỉnh xung',
                    icon: Activity,
                    current: `${device.telemetry.peakCurrent.toFixed(1)} A (Chuẩn: ${device.nominalRanges.peakCurrent.join('-')})`,
                  },
                  {
                    id: 'DIELECTRIC_TEMP',
                    label: 'Nhiệt độ dung môi',
                    icon: Flame,
                    current: `${device.telemetry.dielectricTemp.toFixed(1)} °C (Chuẩn: ${device.nominalRanges.dielectricTemp.join('-')})`,
                  },
                  {
                    id: 'VIBRATION',
                    label: 'Độ rung động',
                    icon: Activity,
                    current: `${device.telemetry.vibration.toFixed(2)} mm/s`,
                  },
                ].map((s) => {
                  const Icon = s.icon;
                  const isSelected = selectedSensor === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => !isCalibrating && setSelectedSensor(s.id)}
                      className={`text-left rounded-xl border p-2.5 transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-500/10 text-white ring-1 ring-cyan-500/50'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                        <span>{s.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1 truncate">
                        {s.current}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Industrial progress & animation */}
            {isCalibrating ? (
              <div className="rounded-xl border border-cyan-500/40 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-cyan-300 flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
                    {calibStage === 1 && '1/4. Đọc tín hiệu thô ADC 24-bit từ module PLC...'}
                    {calibStage === 2 && '2/4. Lấy mẫu trung bình 128 điểm & lọc nhiễu Kalman...'}
                    {calibStage === 3 && '3/4. Bù trừ độ lệch điểm 0 (Zero-offset) & Span Gain...'}
                    {calibStage === 4 && '4/4. Ghi thông số mới vào bộ nhớ flash CNC...'}
                  </span>
                  <span className="font-mono text-cyan-400">{calibProgress}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${calibProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs flex items-center justify-between">
                <div className="text-slate-400">
                  <span>Trạng thái lần hiệu chuẩn trước:</span>
                  <div className="text-slate-200 font-semibold mt-0.5">
                    {device.lastCalibrationTime
                      ? new Date(device.lastCalibrationTime).toLocaleString('vi-VN')
                      : 'Đang dùng tham số nhà máy (Factory Default)'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] text-emerald-400 font-medium">
                    Sẵn sàng hiệu chuẩn
                  </span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isCalibrating}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteCalibration}
                disabled={isCalibrating}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-600/20 transition active:scale-95 disabled:opacity-50"
              >
                {isCalibrating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Đang Hiệu Chuẩn...</span>
                  </>
                ) : (
                  <>
                    <Sliders className="h-4 w-4" />
                    <span>Bắt Đầu Hiệu Chuẩn Ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 3: FORCE SYNC */}
        {/* ============================================================== */}
        {mode === 'FORCE_SYNC' && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 text-xs text-slate-300">
              <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4" />
                Cưỡng bức đồng bộ dữ liệu SCADA với Gateway PLC/CNC
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Gửi lệnh Poll tức thì qua đường truyền công nghiệp Modbus TCP/IP, làm mới toàn bộ snapshot thông số đo và làm sạch bộ đệm đọng.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Giao thức kết nối:</span>
                <span className="font-mono text-white font-semibold">Modbus TCP / OPC UA Client</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Địa chỉ IP Bộ Điều Khiển:</span>
                <span className="font-mono text-cyan-400">192.168.1.1{device.id.replace('dev-0', '')} (Port 502)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Lần đồng bộ gần nhất:</span>
                <span className="font-mono text-amber-300">
                  {new Date(device.lastEdmSignalTime).toLocaleTimeString('vi-VN')}
                </span>
              </div>
              {syncLatency !== null && (
                <div className="flex items-center justify-between text-emerald-400 pt-1 border-t border-slate-800">
                  <span className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Đồng bộ hoàn tất:
                  </span>
                  <span className="font-mono font-bold">Độ trễ: {syncLatency}ms</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSyncing}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleExecuteForceSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Đang Đồng Bộ PLC...' : 'Đồng Bộ Tức Thì'}</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 4: PING CONTROLLER */}
        {/* ============================================================== */}
        {mode === 'PING_CONTROLLER' && (
          <div className="p-5 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>Bộ điều khiển CNC:</span>
                <span className="font-mono text-white font-semibold">{device.model} CNC Core</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Địa chỉ mạng LAN công nghiệp:</span>
                <span className="font-mono text-cyan-400">192.168.1.1{device.id.replace('dev-0', '')}</span>
              </div>
              {pingResult && (
                <div className="flex items-center justify-between text-emerald-400 pt-2 border-t border-slate-800 font-mono">
                  <span>Trạng thái phản hồi: OK</span>
                  <span className="font-bold text-emerald-400">RTT: {pingResult.pingMs}ms</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleExecutePing}
                disabled={isPinging}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 px-4 py-2 text-xs font-bold text-white transition active:scale-95"
              >
                <Radio className={`h-4 w-4 ${isPinging ? 'animate-pulse text-amber-400' : ''}`} />
                <span>{isPinging ? 'Đang gửi gói tin ICMP...' : 'Ping Lại'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
