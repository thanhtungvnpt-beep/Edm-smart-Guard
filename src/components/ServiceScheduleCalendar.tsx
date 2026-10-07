import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Layers,
  MapPin,
  Plus,
  Phone,
  ShieldAlert,
  Sparkles,
  User,
  Wrench,
} from 'lucide-react';
import { Device } from '../types';
import {
  getMachineScheduledTasks,
  ScheduledServiceTask,
} from '../utils/serviceScheduleData';

interface ServiceScheduleCalendarProps {
  device: Device;
  onPreFillMaintenanceRecord?: (task: ScheduledServiceTask) => void;
  onOpenNewTaskForm?: () => void;
}

export const ServiceScheduleCalendar: React.FC<ServiceScheduleCalendarProps> = ({
  device,
  onPreFillMaintenanceRecord,
  onOpenNewTaskForm,
}) => {
  // Calendar current view month and year
  const [viewYear, setViewYear] = useState<number>(2026);
  const [viewMonth, setViewMonth] = useState<number>(10); // 1-12 (10 = October)

  // Default selected date is 2026-10-08 (first upcoming urgent task) or today
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-10-08');

  // Filter for task list
  const [filterUrgency, setFilterUrgency] = useState<'ALL' | 'URGENT' | 'UPCOMING'>('ALL');

  // Retrieve all scheduled tasks for this machine
  const allTasks = useMemo(() => {
    return getMachineScheduledTasks(device);
  }, [device]);

  // Tasks mapped by date string 'YYYY-MM-DD'
  const tasksByDate = useMemo(() => {
    const map = new Map<string, ScheduledServiceTask[]>();
    allTasks.forEach((task) => {
      const existing = map.get(task.dueDate) || [];
      existing.push(task);
      map.set(task.dueDate, existing);
    });
    return map;
  }, [allTasks]);

  // Tasks due on currently selected date
  const selectedDateTasks = useMemo(() => {
    return tasksByDate.get(selectedDateStr) || [];
  }, [tasksByDate, selectedDateStr]);

  // Calendar grid calculations
  const calendarDays = useMemo(() => {
    // viewMonth is 1-indexed (10 = Oct)
    const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth, 0);
    const totalDays = lastDayOfMonth.getDate();

    // Monday is index 0 in Vietnamese calendar (0 = Mon, ..., 6 = Sun)
    const dayOfWeek = firstDayOfMonth.getDay();
    const startingDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Previous month filler
    const days = [];
    const prevMonthLastDay = new Date(viewYear, viewMonth - 1, 0).getDate();
    for (let i = startingDayIndex - 1; i >= 0; i--) {
      const prevDate = prevMonthLastDay - i;
      const prevMonthNum = viewMonth === 1 ? 12 : viewMonth - 1;
      const prevYearNum = viewMonth === 1 ? viewYear - 1 : viewYear;
      const dateStr = `${prevYearNum}-${prevMonthNum.toString().padStart(2, '0')}-${prevDate.toString().padStart(2, '0')}`;
      days.push({
        dayNumber: prevDate,
        dateStr,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${viewYear}-${viewMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      days.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: true,
      });
    }

    // Next month filler to complete 35 or 42 cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthNum = viewMonth === 12 ? 1 : viewMonth + 1;
      const nextYearNum = viewMonth === 12 ? viewYear + 1 : viewYear;
      const dateStr = `${nextYearNum}-${nextMonthNum.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      days.push({
        dayNumber: day,
        dateStr,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleGoToday = () => {
    setViewYear(2026);
    setViewMonth(10);
    setSelectedDateStr('2026-10-06');
  };

  const getUrgencyBadge = (urgency: ScheduledServiceTask['urgency']) => {
    switch (urgency) {
      case 'CRITICAL':
        return (
          <span className="rounded-full bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-mono font-black text-red-300 animate-pulse flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            KHẨN CẤP
          </span>
        );
      case 'URGENT':
        return (
          <span className="rounded-full bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-orange-300 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            CẦN LÀM GẤP
          </span>
        );
      case 'UPCOMING':
        return (
          <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            SẮP ĐẾN KỲ
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            ĐỊNH KỲ THƯỜNG
          </span>
        );
    }
  };

  const getServiceTypeBadge = (type: ScheduledServiceTask['serviceType']) => {
    switch (type) {
      case 'PREVENTIVE':
        return (
          <span className="rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
            BẢO DƯỠNG ĐỊNH KỲ
          </span>
        );
      case 'CALIBRATION':
        return (
          <span className="rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
            HIỆU CHUẨN ĐỘ CHÍNH XÁC
          </span>
        );
      case 'PARTS_REPLACEMENT':
        return (
          <span className="rounded-lg bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
            THAY THẾ LINH KIỆN
          </span>
        );
      case 'OVERHAUL':
        return (
          <span className="rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
            ĐẠI TU HỆ THỐNG
          </span>
        );
      default:
        return (
          <span className="rounded-lg bg-slate-800 text-slate-300 px-2 py-0.5 text-[10px] font-mono">
            KIỂM TRA
          </span>
        );
    }
  };

  const formattedSelectedDate = useMemo(() => {
    const parts = selectedDateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    return selectedDateStr;
  }, [selectedDateStr]);

  return (
    <div className="space-y-5">
      {/* 1. Header Banner & Stats */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Lịch Bảo Dưỡng Dự Phòng (Service Schedule)
                </h3>
                <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400">
                  {allTasks.length} Nhiệm Vụ Đã Lên Lịch
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Xem lịch trực quan các mốc bảo trì theo chu kỳ giờ máy của thiết bị {device.code}. Bấm vào bất kỳ ngày nào để xem chi tiết hạng mục.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenNewTaskForm && (
              <button
                onClick={onOpenNewTaskForm}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Lên Lịch Mới</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Calendar & Details Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive Month Calendar Grid (7 Cols on large screens) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5 space-y-4 shadow-xl">
          {/* Calendar Month Navigation Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-white text-base capitalize">
                Tháng {viewMonth}, Năm {viewYear}
              </h4>
              <button
                onClick={handleGoToday}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-300 hover:text-white transition cursor-pointer"
                title="Quay về ngày hôm nay"
              >
                Hôm nay
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Tháng trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                title="Tháng sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 uppercase">
            <div>T2</div>
            <div>T3</div>
            <div>T4</div>
            <div>T5</div>
            <div>T6</div>
            <div>T7</div>
            <div className="text-amber-400">CN</div>
          </div>

          {/* Calendar Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              const dayTasks = tasksByDate.get(cell.dateStr) || [];
              const isSelected = cell.dateStr === selectedDateStr;
              const isToday = cell.dateStr === '2026-10-06';
              const hasTasks = dayTasks.length > 0;
              const hasUrgent = dayTasks.some(
                (t) => t.urgency === 'URGENT' || t.urgency === 'CRITICAL'
              );

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[58px] sm:min-h-[68px] p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/15 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500'
                      : isToday
                      ? 'border-indigo-500/60 bg-indigo-950/20'
                      : cell.isCurrentMonth
                      ? 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/90'
                      : 'border-slate-900 bg-slate-950/30 opacity-40 hover:opacity-70'
                  }`}
                >
                  {/* Date Number and Today Tag */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isSelected
                          ? 'text-amber-400 font-black'
                          : isToday
                          ? 'text-indigo-400'
                          : cell.isCurrentMonth
                          ? 'text-slate-200'
                          : 'text-slate-500'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {isToday && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 ring-2 ring-indigo-400/40"></span>
                    )}
                  </div>

                  {/* Task Indicators on this Day */}
                  {hasTasks && (
                    <div className="w-full space-y-0.5 mt-1">
                      {dayTasks.slice(0, 2).map((t, tIdx) => (
                        <div
                          key={tIdx}
                          className={`text-[9px] font-semibold truncate px-1 py-0.2 rounded ${
                            t.urgency === 'CRITICAL' || t.urgency === 'URGENT'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : t.urgency === 'UPCOMING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                          title={t.taskTitle}
                        >
                          {t.taskTitle}
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <span className="text-[8px] font-mono text-slate-400 pl-1">
                          +{dayTasks.length - 2} việc khác
                        </span>
                      )}
                    </div>
                  )}

                  {/* Subtle dot when has task */}
                  {hasTasks && dayTasks.length === 0 && (
                    <div className="flex justify-end">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          hasUrgent ? 'bg-red-500 animate-pulse' : 'bg-amber-400'
                        }`}
                      ></span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Legend Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500"></span>
                <span>Khẩn cấp / Gấp</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                <span>Sắp đến kỳ</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>Định kỳ thường</span>
              </span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              * Giờ máy thực tế cập nhật tự động qua SCADA
            </span>
          </div>
        </div>

        {/* Right Column: Selected Date Task Details (5 Cols on large screens) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-xl">
          <div>
            {/* Header of selected date panel */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
                  Lịch Nhiệm Vụ Ngày Đã Chọn
                </span>
                <h4 className="font-extrabold text-white text-sm sm:text-base capitalize">
                  {formattedSelectedDate}
                </h4>
              </div>

              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-400">
                {selectedDateTasks.length} nhiệm vụ
              </span>
            </div>

            {/* Content: Selected Date Tasks List or Empty State */}
            <div className="mt-4 space-y-3">
              {selectedDateTasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center space-y-2.5 text-xs text-slate-400">
                  <CalendarIcon className="h-8 w-8 text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-300">
                    Không có lịch bảo dưỡng phòng ngừa vào ngày này.
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                    Thiết bị hoạt động theo ca bình thường. Bạn có thể bấm vào các ngày có đánh dấu màu trên lịch để xem các mốc đã được xếp lịch.
                  </p>
                  {onOpenNewTaskForm && (
                    <button
                      onClick={onOpenNewTaskForm}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-200 transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Thêm lịch cho ngày này</span>
                    </button>
                  )}
                </div>
              ) : (
                selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 hover:border-slate-700 transition"
                  >
                    {/* Top: Badges & Title */}
                    <div>
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                        {getServiceTypeBadge(task.serviceType)}
                        {getUrgencyBadge(task.urgency)}
                      </div>
                      <h5 className="font-bold text-white text-sm leading-snug">
                        {task.taskTitle}
                      </h5>
                    </div>

                    {/* Target specs & Technician */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-2">
                        <span className="text-[10px] text-slate-400 block">Thời lượng dự kiến</span>
                        <span className="font-mono font-bold text-cyan-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {task.estimatedDurationMinutes} phút
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-2">
                        <span className="text-[10px] text-slate-400 block">Mốc giờ máy chuẩn</span>
                        <span className="font-mono font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                          <Wrench className="h-3 w-3" />
                          {task.operatingHoursTarget.toLocaleString()}h
                        </span>
                      </div>
                    </div>

                    {/* Assigned Technician */}
                    <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                          {task.assignedTechnicianName.slice(0, 1)}
                        </div>
                        <div>
                          <span className="font-bold text-white block leading-tight">
                            {task.assignedTechnicianName}
                          </span>
                          <span className="text-[10px] text-slate-400 leading-tight">
                            Kỹ thuật viên phụ trách
                          </span>
                        </div>
                      </div>
                      {task.assignedTechnicianPhone && (
                        <a
                          href={`tel:${task.assignedTechnicianPhone}`}
                          className="rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] font-mono text-amber-400 transition flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          <span>{task.assignedTechnicianPhone}</span>
                        </a>
                      )}
                    </div>

                    {/* Recommended Parts */}
                    {task.recommendedParts && task.recommendedParts.length > 0 && (
                      <div className="space-y-1 text-xs">
                        <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                          <Layers className="h-3 w-3 text-purple-400" />
                          Linh kiện dự phòng cần chuẩn bị:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {task.recommendedParts.map((p, pIdx) => (
                            <span
                              key={pIdx}
                              className="rounded-lg bg-slate-950 border border-slate-800 px-2 py-0.5 text-[10px] text-purple-300 font-medium"
                            >
                              📦 {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Technical SOP Instructions */}
                    <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-2.5 text-[11px] text-slate-300 space-y-1">
                      {task.sopDocumentTitle && (
                        <span className="font-mono font-semibold text-amber-400 block text-[10px]">
                          📖 {task.sopDocumentTitle}
                        </span>
                      )}
                      <p className="leading-relaxed text-slate-400">{task.instructions}</p>
                    </div>

                    {/* Action button */}
                    {onPreFillMaintenanceRecord && (
                      <button
                        onClick={() => onPreFillMaintenanceRecord(task)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 shadow-md transition active:scale-95 cursor-pointer"
                      >
                        <Wrench className="h-3.5 w-3.5" />
                        <span>Bắt Đầu &amp; Ghi Nhận Thực Hiện Ngay</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Chronological Upcoming Tasks List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-white text-sm sm:text-base">
              Toàn Bộ Lịch Bảo Dưỡng Phòng Ngừa Sắp Tới (Upcoming Tasks)
            </h4>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
              {allTasks.length} nhiệm vụ
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterUrgency('ALL')}
              className={`rounded-lg px-2.5 py-1 transition ${
                filterUrgency === 'ALL'
                  ? 'bg-slate-800 text-amber-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({allTasks.length})
            </button>
            <button
              onClick={() => setFilterUrgency('URGENT')}
              className={`rounded-lg px-2.5 py-1 transition flex items-center gap-1 ${
                filterUrgency === 'URGENT'
                  ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/40'
                  : 'text-slate-400 hover:text-red-300'
              }`}
            >
              Khẩn cấp / Gấp
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {allTasks
            .filter((t) => {
              if (filterUrgency === 'URGENT') return t.urgency === 'URGENT' || t.urgency === 'CRITICAL';
              return true;
            })
            .map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedDateStr(task.dueDate)}
                className={`rounded-2xl border p-3.5 space-y-2 transition cursor-pointer ${
                  selectedDateStr === task.dueDate
                    ? 'border-amber-500 bg-amber-950/20 ring-1 ring-amber-500'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span>{task.dueDate}</span>
                  </div>
                  {getUrgencyBadge(task.urgency)}
                </div>

                <h5 className="font-bold text-white text-xs sm:text-sm line-clamp-1">
                  {task.taskTitle}
                </h5>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-slate-500" />
                    <span>{task.assignedTechnicianName}</span>
                  </span>
                  <span className="font-mono text-cyan-400">
                    {task.estimatedDurationMinutes} phút • Giờ máy: {task.operatingHoursTarget.toLocaleString()}h
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
