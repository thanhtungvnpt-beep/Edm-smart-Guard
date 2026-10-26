import React from 'react';
import {
  Building2,
  Users2,
  Wrench,
  Monitor,
  Smartphone,
  ChevronDown,
  MapPin,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Info,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Database,
} from 'lucide-react';

export type UserRole = 'DIRECTOR' | 'EQM_LEADER' | 'TECHNICIAN' | 'COMMUNITY';
export type ViewportMode = 'PC' | 'MOBILE';
export type MainViewMode =
  | 'ROLE_VIEW'
  | 'FLEET_GRID'
  | 'CONTROL_TOWER'
  | 'DATA_TRUST'
  | 'HITL_WORKFLOW'
  | 'AUDIT_RBAC'
  | 'ALERT_GOVERNANCE';

interface RoleNavigationHeaderProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  viewportMode: ViewportMode;
  onSelectViewportMode: (mode: ViewportMode) => void;
  currentPlant: string;
  onSelectPlant: (plant: string) => void;
  activeAlarmCount: number;
  mainViewMode?: MainViewMode;
  onSelectMainViewMode?: (mode: MainViewMode) => void;
  phoneFramePreview?: boolean;
  onTogglePhoneFramePreview?: () => void;
}

export const PLANTS = [
  { id: 'plant-01', name: 'Nhà Máy 1 - Bắc Ninh', desc: 'Xưởng Cắt Dây & Bắn Điện Xung CNC', area: 'KCN Yên Phong', oee: 89.4, machines: 12 },
  { id: 'plant-02', name: 'Nhà Máy 2 - Hà Nội', desc: 'Xưởng Chế Tạo Khuôn Mẫu Chính Xác', area: 'Khu CNC Hòa Lạc', oee: 92.1, machines: 8 },
  { id: 'plant-03', name: 'Nhà Máy 3 - TP.HCM', desc: 'Trung Tâm Gia Công Linh Kiện Y Tế', area: 'Khu CNC Quận 9', oee: 87.8, machines: 10 },
];

export const RoleNavigationHeader: React.FC<RoleNavigationHeaderProps> = ({
  currentRole,
  onSelectRole,
  viewportMode,
  onSelectViewportMode,
  currentPlant,
  onSelectPlant,
  activeAlarmCount,
  mainViewMode = 'ROLE_VIEW',
  onSelectMainViewMode,
  phoneFramePreview = true,
  onTogglePhoneFramePreview,
}) => {
  const currentPlantObj = PLANTS.find((p) => p.id === currentPlant) || PLANTS[0];

  return (
    <div className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-[57px] z-30 shadow-md">
      {/* Top Bar: Role Switcher & Plant & Viewport */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        {/* Left: 3 Main Roles */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-1">
            <span className="text-amber-400">●</span>
            <span>Chức Danh:</span>
          </div>

          {/* 1. Giám Đốc Nhà Máy */}
          <button
            type="button"
            onClick={() => {
              onSelectRole('DIRECTOR');
              onSelectMainViewMode?.('ROLE_VIEW');
            }}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition shadow-sm ${
              mainViewMode === 'ROLE_VIEW' && currentRole === 'DIRECTOR'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-900/30 ring-2 ring-amber-400/60'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building2 className="h-4 w-4 shrink-0" />
            <span>Giám Đốc Nhà Máy</span>
            <span className="hidden md:inline rounded bg-black/30 px-1.5 py-0.2 text-[10px] font-mono font-medium">
              OEE & Ký Duyệt
            </span>
          </button>

          {/* 2. Leader EQM */}
          <button
            type="button"
            onClick={() => {
              onSelectRole('EQM_LEADER');
              onSelectMainViewMode?.('ROLE_VIEW');
            }}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition shadow-sm ${
              mainViewMode === 'ROLE_VIEW' && currentRole === 'EQM_LEADER'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-900/30 ring-2 ring-blue-400/60'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users2 className="h-4 w-4 shrink-0" />
            <span>Leader EQM</span>
            <span className="hidden md:inline rounded bg-black/30 px-1.5 py-0.2 text-[10px] font-mono font-medium">
              Điều Phối & Phụ Tùng
            </span>
          </button>

          {/* 3. Kỹ Thuật Viên */}
          <button
            type="button"
            onClick={() => {
              onSelectRole('TECHNICIAN');
              onSelectMainViewMode?.('ROLE_VIEW');
            }}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition shadow-sm ${
              mainViewMode === 'ROLE_VIEW' && currentRole === 'TECHNICIAN'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-900/30 ring-2 ring-emerald-400/60'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Wrench className="h-4 w-4 shrink-0" />
            <span>Kỹ Thuật Viên</span>
            <span className="hidden md:inline rounded bg-black/30 px-1.5 py-0.2 text-[10px] font-mono font-medium">
              QR & Checklist
            </span>
          </button>

          {/* 4. Cộng Đồng Chuyên Gia Liên Nhà Máy (COM-01 -> COM-06) */}
          <button
            type="button"
            onClick={() => {
              onSelectRole('COMMUNITY');
              onSelectMainViewMode?.('ROLE_VIEW');
            }}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition shadow-sm ${
              mainViewMode === 'ROLE_VIEW' && currentRole === 'COMMUNITY'
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white shadow-purple-900/40 ring-2 ring-purple-400/60'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4 shrink-0 text-amber-300 animate-pulse" />
            <span>Cộng Đồng Liên Nhà Máy</span>
            <span className="hidden md:inline rounded bg-black/30 px-1.5 py-0.2 text-[10px] font-mono font-medium text-amber-200">
              3 Nhà Máy • SOP
            </span>
          </button>
        </div>

        {/* Right: Plant Selector & PC/Mobile Toggle & View Mode */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap ml-auto">
          {/* Plant Selector */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-950 border border-slate-800 px-2.5 py-1.5 text-xs shadow-inner">
            <MapPin className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <select
              value={currentPlant}
              onChange={(e) => onSelectPlant(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
              title="Chọn Nhà Máy Quản Lý"
            >
              {PLANTS.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name} ({p.area})
                </option>
              ))}
            </select>
          </div>

          {/* PC vs Mobile Viewport Switcher */}
          <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-0.5 shadow-inner">
            <button
              type="button"
              onClick={() => onSelectViewportMode('PC')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewportMode === 'PC'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Xem giao diện chuẩn máy tính PC (Desktop)"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Màn hình PC</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectViewportMode('MOBILE')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewportMode === 'MOBILE'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Xem giao diện tối ưu điện thoại di động (Mobile)"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Màn hình Mobile</span>
            </button>
          </div>

          {/* Optional: Phone Bezel frame preview toggle in Mobile mode */}
          {viewportMode === 'MOBILE' && onTogglePhoneFramePreview && (
            <button
              type="button"
              onClick={onTogglePhoneFramePreview}
              className={`hidden md:flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition ${
                phoneFramePreview
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Bật/Tắt khung vỏ mô phỏng điện thoại Smartphone"
            >
              {phoneFramePreview ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="text-[11px]">{phoneFramePreview ? 'Khung ĐT' : 'Toàn Rộng'}</span>
            </button>
          )}

          {/* Switch to Control Tower / Roles / Fleet / Phase 1 Governance */}
          {onSelectMainViewMode && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onSelectMainViewMode('DATA_TRUST')}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold border transition ${
                  mainViewMode === 'DATA_TRUST'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400 shadow-md shadow-cyan-900/40 ring-1 ring-cyan-400'
                    : 'bg-slate-950 border-slate-800 text-cyan-300 hover:text-white hover:border-slate-700'
                }`}
                title="Data Trust Center (Mô-đun 2: 6 Chiều Chất Lượng & Phả Hệ Dữ Liệu)"
              >
                <Database className="h-3.5 w-3.5 text-cyan-300" />
                <span>Data Trust Center</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMainViewMode('HITL_WORKFLOW')}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold border transition ${
                  mainViewMode === 'HITL_WORKFLOW'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-md shadow-indigo-900/40 ring-1 ring-indigo-400'
                    : 'bg-slate-950 border-slate-800 text-indigo-300 hover:text-white hover:border-slate-700'
                }`}
                title="Quy Trình Duyệt Human-in-the-Loop (Mô-đun 3: 8 Trạng Thái)"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-300" />
                <span>Duyệt HITL</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMainViewMode('AUDIT_RBAC')}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold border transition ${
                  mainViewMode === 'AUDIT_RBAC'
                    ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white border-purple-400 shadow-md shadow-purple-900/40 ring-1 ring-purple-400'
                    : 'bg-slate-950 border-slate-800 text-purple-300 hover:text-white hover:border-slate-700'
                }`}
                title="Nhật Ký Kiểm Toán Bất Biến & RBAC (Mô-đun 4 & 5)"
              >
                <Layers className="h-3.5 w-3.5 text-purple-300" />
                <span>Audit & RBAC</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMainViewMode('ALERT_GOVERNANCE')}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold border transition ${
                  mainViewMode === 'ALERT_GOVERNANCE'
                    ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white border-rose-400 shadow-md shadow-rose-900/40 ring-1 ring-rose-400'
                    : 'bg-slate-950 border-slate-800 text-rose-300 hover:text-white hover:border-slate-700'
                }`}
                title="Quản Trị Cảnh Báo 8 Bước & 4 Nhãn Nguồn Gốc (Mô-đun 6)"
              >
                <Zap className="h-3.5 w-3.5 text-rose-300" />
                <span>Cảnh Báo (M6)</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectMainViewMode('CONTROL_TOWER')}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold border transition ${
                  mainViewMode === 'CONTROL_TOWER'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-md shadow-indigo-900/40 ring-1 ring-indigo-400'
                    : 'bg-slate-950 border-slate-800 text-indigo-300 hover:text-white hover:border-slate-700'
                }`}
                title="Mở Tháp Điều Hành Hiệu Suất AI (P2-01 Control Tower)"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                <span>Tháp P2</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onSelectMainViewMode(mainViewMode === 'ROLE_VIEW' ? 'FLEET_GRID' : 'ROLE_VIEW')
                }
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold border transition ${
                  mainViewMode === 'FLEET_GRID'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
                title="Chuyển đổi giữa Chế độ xem theo Vai Trò và Lưới thiết bị toàn xưởng"
              >
                <LayoutGrid className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden md:inline">
                  {mainViewMode === 'ROLE_VIEW' ? 'Xem Lưới Máy' : 'Xem Vai Trò'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Role Context & Guidance Helper Strip */}
      <div className="bg-slate-950/70 border-t border-slate-800/60 px-4 py-1.5 sm:px-6 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          {currentRole === 'DIRECTOR' && (
            <span>
              <strong className="text-amber-400">Góc nhìn Giám Đốc Nhà Máy:</strong> Giám sát OEE tổng thể ({currentPlantObj.oee}%), phân tích chi phí Downtime, phê duyệt chi phí linh kiện & lịch dừng máy, xuất báo cáo điều hành.
            </span>
          )}
          {currentRole === 'EQM_LEADER' && (
            <span>
              <strong className="text-blue-400">Góc nhìn Leader EQM:</strong> Phân bổ sự cố theo chuyên môn KTV, kiểm soát cam kết SLA 30 phút, phê duyệt xuất kho phụ tùng, phát thanh khẩn cấp toàn đội.
            </span>
          )}
          {currentRole === 'TECHNICIAN' && (
            <span>
              <strong className="text-emerald-400">Góc nhìn Kỹ Thuật Viên:</strong> Tiếp nhận sự cố 1-chạm, quét QR tại máy, quy trình checklist động theo model máy, ghi âm giọng nói rảnh tay, chat nhóm sự cố & AI Copilot.
            </span>
          )}
          {currentRole === 'COMMUNITY' && (
            <span>
              <strong className="text-purple-400">Góc nhìn Chuyên Gia & Cộng Đồng Liên Nhà Máy:</strong> Bảng tin sự cố 3 cơ sở (Bắc Ninh, Hà Nội, TP.HCM), bộ lọc tự động ẩn danh hóa bảo mật, quy trình 5 bước xác minh & chuẩn hóa tri thức SOP chính thức.
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>{currentPlantObj.name} ({currentPlantObj.machines} máy)</span>
          </span>
          {activeAlarmCount > 0 ? (
            <span className="text-red-400 font-bold animate-pulse">
              ● {activeAlarmCount} dừng khẩn
            </span>
          ) : (
            <span className="text-emerald-400 font-medium">● Bình thường</span>
          )}
        </div>
      </div>
    </div>
  );
};

