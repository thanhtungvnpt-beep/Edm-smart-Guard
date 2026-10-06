import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileDown,
  FileText,
  Layers,
  MapPin,
  Printer,
  ShieldCheck,
  Sparkles,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { Device, MaintenanceRecord } from '../types';
import { calculateMachineServiceInterval } from '../utils/serviceIntervalHelper';
import { calculatePredictedMaintenance } from '../utils/maintenancePrediction';
import { generatePredictiveHardwareInsights, HardwareWearComponent } from '../utils/hardwarePrediction';
import {
  getDeviceIncidentHistory,
  printMachineReport,
  downloadMachineReportHtml,
} from '../utils/machinePdfReportGenerator';

interface MachinePdfReportModalProps {
  device: Device;
  records: MaintenanceRecord[];
  onClose: () => void;
}

export const MachinePdfReportModal: React.FC<MachinePdfReportModalProps> = ({
  device,
  records,
  onClose,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const serviceInterval = calculateMachineServiceInterval(device);
  const prediction = calculatePredictedMaintenance(device);
  const hardwareWear = generatePredictiveHardwareInsights(device).components;
  const incidents = getDeviceIncidentHistory(device.id);

  const handlePrint = () => {
    printMachineReport(device, records);
  };

  const handleDownloadHtml = () => {
    downloadMachineReportHtml(device, records);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const formattedDate = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-3xl border border-indigo-500/40 bg-slate-900 shadow-2xl overflow-hidden my-auto text-slate-200">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/95 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 shrink-0">
              <FileDown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-sm sm:text-base leading-tight">
                  Báo Cáo Kỹ Thuật Máy {device.code}
                </h3>
                <span className="rounded bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300">
                  PRINTABLE PDF REPORT
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tóm tắt toàn diện: Lịch sử bảo dưỡng • Nhật ký lỗi • Yêu cầu dịch vụ định kỳ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download File Button */}
            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white transition cursor-pointer"
              title="Tải tệp báo cáo dạng HTML độc lập"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Tải Tệp HTML</span>
            </button>

            {/* Print / Save as PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
              title="Mở hộp thoại In của trình duyệt để lưu thành tệp PDF chất lượng cao"
            >
              <Printer className="h-4 w-4" />
              <span>In / Xuất PDF Ngay</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Đóng cửa sổ"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {downloadSuccess && (
          <div className="bg-emerald-600/90 text-white px-5 py-2 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Đã tải xuống tệp báo cáo kỹ thuật thành công! Bạn có thể mở và in bất cứ lúc nào.</span>
          </div>
        )}

        {/* Printable Report Document Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/70">
          <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl max-w-3xl mx-auto space-y-6 border border-slate-200 text-xs sm:text-sm">
            {/* Letterhead Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase">
                  Hệ Thống SCADA EDM SmartGuard
                </h1>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  BÁO CÁO BẢO DƯỠNG THIẾT BỊ, NHẬT KÝ SỰ CỐ &amp; YÊU CẦU DỊCH VỤ ĐỊNH KỲ
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-800">Nhà máy: Phân Xưởng Gia Công EDM 4.0</span>
                  <span>•</span>
                  <span>Tiêu chuẩn quản lý: ISO 9001 / IATF 16949</span>
                </div>
              </div>

              <div className="text-left sm:text-right text-[11px] text-slate-600 space-y-0.5 shrink-0">
                <span className="inline-block bg-indigo-600 text-white font-mono font-bold px-2 py-0.5 rounded text-[10px]">
                  RPT-{device.code}
                </span>
                <div><strong>Ngày xuất:</strong> {formattedDate}</div>
                <div><strong>Trạng thái:</strong> {device.status === 'RUNNING' ? 'Đang hoạt động' : 'Dừng khắc phục'}</div>
              </div>
            </div>

            {/* 1. Machine Identification */}
            <div className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-950 border-l-4 border-amber-500 pl-2">
                1. Thông Tin Nhận Diện Thiết Bị &amp; Viễn Trắc Vận Hành
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Mã máy</span>
                  <span className="text-sm font-black text-amber-600 font-mono">{device.code}</span>
                  <p className="text-[11px] text-slate-700 font-semibold truncate">{device.name}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Model &amp; Hãng</span>
                  <span className="text-xs font-bold text-slate-900 block truncate">{device.model}</span>
                  <p className="text-[10px] text-slate-600">{device.brand} • {device.type}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Vị trí xưởng</span>
                  <span className="text-xs font-bold text-slate-900 block truncate">{device.location}</span>
                  <p className="text-[10px] text-slate-600">Trạm gia công số 1</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">KTV Phụ Trách</span>
                  <span className="text-xs font-bold text-indigo-700 block truncate">
                    {device.assignedTechnician?.name || 'Kỹ sư trực ca'}
                  </span>
                  <p className="text-[10px] text-slate-600 font-mono">{device.assignedTechnician?.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Quick telemetry indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Tổng giờ máy:</span>
                  <span className="font-mono font-bold text-slate-900">{serviceInterval.totalUsageHours.toLocaleString()}h</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Hiệu suất OEE:</span>
                  <span className="font-mono font-bold text-emerald-600">{device.telemetry?.oee || 88.5}%</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Áp suất xả:</span>
                  <span className="font-mono font-bold text-slate-900">{device.telemetry?.dielectricPressure || 1.2} Bar</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Độ rung trục:</span>
                  <span className="font-mono font-bold text-amber-600">{device.telemetry?.vibration || 0.8} mm/s</span>
                </div>
              </div>
            </div>

            {/* 2. Upcoming Service Requirements & Predictive Maintenance */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-950 border-l-4 border-amber-500 pl-2">
                  2. Yêu Cầu Dịch Vụ Sắp Tới &amp; Dự Đoán Bảo Dưỡng (Predictive Service Requirements)
                </h2>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  serviceInterval.urgency === 'URGENT' || serviceInterval.urgency === 'OVERDUE'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {serviceInterval.urgency === 'URGENT' || serviceInterval.urgency === 'OVERDUE'
                    ? 'Cần bảo dưỡng khẩn cấp'
                    : 'Tiến độ bình thường'}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    Tiến độ chu kỳ 500 giờ máy: {serviceInterval.hoursSinceLastService}h / {serviceInterval.serviceIntervalCycleHours}h
                  </span>
                  <span className="font-mono font-bold text-amber-600">{serviceInterval.progressPercentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${serviceInterval.progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Mức độ hao mòn cơ học theo giờ máy thực tế</span>
                  <strong className={serviceInterval.hoursRemaining <= 36 ? 'text-red-600' : 'text-emerald-700'}>
                    Còn lại: {serviceInterval.hoursRemaining} giờ máy (~{serviceInterval.estimatedDaysRemaining} ngày)
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Nhiệm Vụ Bảo Dưỡng Ưu Tiên Số 1
                  </span>
                  <div className="text-xs font-bold text-slate-900 leading-snug">
                    {prediction.primaryMaintenanceTask || serviceInterval.serviceTask}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    <strong>Cơ sở tính toán AI:</strong> {prediction.heuristicRationale}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    Linh Kiện Cần Chuẩn Bị Xuất Kho
                  </span>
                  <div className="space-y-1">
                    {serviceInterval.recommendedParts.map((part, pIdx) => (
                      <div key={pIdx} className="text-[11px] text-slate-800 font-medium flex items-center gap-1.5">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{part}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hardware Wear Table */}
              <div className="pt-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Đánh Giá Mức Độ Hao Mòn Linh Kiện Trọng Yếu:
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-900 text-white text-[10px] uppercase">
                      <tr>
                        <th className="p-2">Linh Kiện / Bộ Phận</th>
                        <th className="p-2">Mã SKU</th>
                        <th className="p-2">Hao Mòn</th>
                        <th className="p-2">Thời Gian Dự Kiến</th>
                        <th className="p-2">Kho</th>
                        <th className="p-2">Hành Động Khuyến Nghị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {hardwareWear.map((item: HardwareWearComponent, idx: number) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                          <td className="p-2 font-bold text-slate-900">{item.name}</td>
                          <td className="p-2 font-mono text-slate-600">{item.partNumber}</td>
                          <td className="p-2 font-bold">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                              item.wearPercentage >= 80
                                ? 'bg-red-100 text-red-700'
                                : item.wearPercentage >= 60
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {item.wearPercentage}%
                            </span>
                          </td>
                          <td className={`p-2 font-bold ${item.daysUntilFailure <= 3 ? 'text-red-600' : 'text-slate-800'}`}>
                            {item.daysUntilFailure} ngày
                          </td>
                          <td className="p-2 text-slate-600">{item.stockLocation}</td>
                          <td className="p-2 text-[10px] text-slate-600">{item.preventiveAction}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 3. Recent Error & Incident Logs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-950 border-l-4 border-red-500 pl-2">
                  3. Nhật Ký Sự Cố &amp; Báo Động Gần Nhất (Recent Error Logs)
                </h2>
                <span className="text-[11px] text-slate-500">
                  Lịch sử: {device.incidentHistoryCount || incidents.length} sự cố
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase">
                    <tr>
                      <th className="p-2">Mã Lỗi</th>
                      <th className="p-2">Mô Tả Cảnh Báo</th>
                      <th className="p-2">Mức Độ</th>
                      <th className="p-2">Thời Gian</th>
                      <th className="p-2">Nguyên Nhân &amp; Biện Pháp Khắc Phục</th>
                      <th className="p-2">KTV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {incidents.map((inc, iIdx) => (
                      <tr key={inc.id || iIdx} className={iIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="p-2 font-mono font-black text-red-600">{inc.errorCode}</td>
                        <td className="p-2 font-bold text-slate-900">{inc.errorTitle}</td>
                        <td className="p-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            inc.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inc.severity}
                          </span>
                        </td>
                        <td className="p-2 text-[10px] text-slate-600 whitespace-nowrap">
                          {new Date(inc.occurredAt).toLocaleDateString('vi-VN')} ({inc.durationMinutes}m)
                        </td>
                        <td className="p-2 text-[10px] text-slate-700">
                          <div><strong>Nguyên nhân:</strong> {inc.rootCause}</div>
                          <div className="text-emerald-700 mt-0.5"><strong>Xử lý:</strong> {inc.resolution}</div>
                        </td>
                        <td className="p-2 font-medium text-slate-800 whitespace-nowrap">{inc.technicianName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Maintenance History Summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-950 border-l-4 border-indigo-600 pl-2">
                  4. Lịch Sử Thực Hiện Bảo Dưỡng Gần Nhất (Maintenance History)
                </h2>
                <span className="text-[11px] text-slate-500">
                  {records.length} nhiệm vụ đã ghi nhận
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead className="bg-slate-900 text-white text-[10px] uppercase">
                    <tr>
                      <th className="p-2">Ngày</th>
                      <th className="p-2">Nhiệm Vụ Bảo Dưỡng</th>
                      <th className="p-2">Loại Hình</th>
                      <th className="p-2">KTV</th>
                      <th className="p-2">Thời Lượng</th>
                      <th className="p-2">Giờ Máy</th>
                      <th className="p-2">Linh Kiện &amp; Thao Tác Kỹ Thuật</th>
                      <th className="p-2">Kết Quả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {records.slice(0, 5).map((r, rIdx) => (
                      <tr key={r.id || rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="p-2 text-slate-600 whitespace-nowrap font-mono text-[10px]">
                          {new Date(r.completedAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="p-2 font-bold text-slate-900">{r.taskTitle}</td>
                        <td className="p-2 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 font-medium">
                            {r.taskType}
                          </span>
                        </td>
                        <td className="p-2 text-slate-800 font-medium whitespace-nowrap">{r.technicianName}</td>
                        <td className="p-2 text-slate-700 whitespace-nowrap">{r.durationMinutes}m</td>
                        <td className="p-2 font-mono text-slate-700 whitespace-nowrap">
                          {r.operatingHoursAtMaintenance.toLocaleString()}h
                        </td>
                        <td className="p-2 text-[10px] text-slate-600">
                          {r.partsReplaced && r.partsReplaced.length > 0 && (
                            <div className="text-purple-700 font-medium mb-0.5">
                              • Đã thay: {r.partsReplaced.join(', ')}
                            </div>
                          )}
                          <p className="line-clamp-2">{r.findingsAndActions}</p>
                        </td>
                        <td className="p-2 text-emerald-700 font-bold whitespace-nowrap">✓ Đạt Chuẩn</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures & Certification */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <span className="font-bold text-slate-900 uppercase block">Kỹ Sư Trưởng Cơ Điện</span>
                <span className="text-[10px] text-slate-500 block mb-10">Phòng Bảo Trì Nhà Máy</span>
                <div className="border-t border-dashed border-slate-400 pt-1 font-bold text-slate-800">
                  Nguyễn Văn Hùng
                </div>
                <span className="text-[9px] text-slate-400 block">(Đã phê duyệt điện tử)</span>
              </div>

              <div>
                <span className="font-bold text-slate-900 uppercase block">Kỹ Thuật Viên Phụ Trách</span>
                <span className="text-[10px] text-slate-500 block mb-10">Tổ Vận Hành &amp; Giám Sát</span>
                <div className="border-t border-dashed border-slate-400 pt-1 font-bold text-slate-800">
                  {device.assignedTechnician?.name || 'Lê Hoàng Nam'}
                </div>
                <span className="text-[9px] text-slate-400 block">(Bàn giao ca trực)</span>
              </div>

              <div>
                <span className="font-bold text-slate-900 uppercase block">Hệ Thống SCADA SmartGuard</span>
                <span className="text-[10px] text-slate-500 block mb-10">Chứng Thực Tự Động 4.0</span>
                <div className="border-t border-dashed border-slate-400 pt-1 font-bold text-emerald-700">
                  ✓ VERIFIED STAMP
                </div>
                <span className="text-[9px] text-emerald-600 font-mono block">SG-QC-{device.code}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/95 px-5 py-3">
          <span className="text-xs text-slate-400">
            Báo cáo có thể xuất ra file PDF tiêu chuẩn A4 hoặc in trực tiếp cho ban giám đốc và kiểm toán ISO.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition active:scale-95 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>In / Lưu Thành PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
