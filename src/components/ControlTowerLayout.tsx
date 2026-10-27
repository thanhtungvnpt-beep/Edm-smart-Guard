import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Cpu,
  FileCheck,
  FileText,
  HelpCircle,
  Home,
  Layers,
  Lock,
  Menu,
  MessageSquare,
  QrCode,
  Radio,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  User,
  Users,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Zap
} from 'lucide-react';

interface ControlTowerLayoutProps {
  activeNav: string;
  onSelectNav: (navId: string) => void;
  currentPlant: string;
  onSelectPlant: (plant: string) => void;
  onSearch?: (term: string) => void;
  notificationCount?: number;
  alertCount?: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onOpenSimulator?: () => void;
  onOpenShortcuts?: () => void;
  onOpenQuickReport?: () => void;
  children: React.ReactNode;
}

export const ControlTowerLayout: React.FC<ControlTowerLayoutProps> = ({
  activeNav,
  onSelectNav,
  currentPlant,
  onSelectPlant,
  onSearch,
  notificationCount = 12,
  alertCount = 3,
  isMuted = false,
  onToggleMute,
  onOpenSimulator,
  onOpenShortcuts,
  onOpenQuickReport,
  children
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('16/01/2025 10:24');
  const [selectedTimeRange, setSelectedTimeRange] = useState('Hôm nay');
  const [localSearch, setLocalSearch] = useState('');

  // Clock formatter
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${day}/${month}/${year}  ${hours}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: Home },
    { id: 'devices', label: 'Giám sát thiết bị', icon: Activity },
    { id: 'ai-diagnosis', label: 'AI chẩn đoán', icon: Cpu },
    { id: 'maintenance', label: 'Bảo trì & sửa chữa', icon: Wrench },
    { id: 'knowledge', label: 'Kho tri thức', icon: BookOpen },
    { id: 'documents', label: 'Tài liệu kỹ thuật', icon: FileText },
    { id: 'community', label: 'Cộng đồng kỹ thuật', icon: Users },
    { id: 'reports', label: 'Báo cáo & phân tích', icon: BarChart3 },
    { id: 'technician-eval', label: 'Đánh giá kỹ thuật viên', icon: Award },
    { id: 'mobile', label: 'Quản lý thiết bị di động', icon: Smartphone },
    { id: 'notifications', label: 'Thông báo & Cảnh báo', icon: Bell, badge: notificationCount },
    { id: 'data-trust', label: 'Data Trust Center', icon: ShieldCheck },
    { id: 'hitl', label: 'Human-in-the-Loop', icon: Sparkles },
    { id: 'audit', label: 'Audit Log & RBAC', icon: Lock },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#061522] text-[#EAF5FF] flex flex-col font-sans selection:bg-[#00C8F0] selection:text-[#061522]">
      {/* ============================================================== */}
      {/* GLOBAL HEADER                                                  */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-40 bg-[#081B2B] border-b border-[#15324C] px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 shadow-md">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="hidden md:flex p-1.5 rounded-lg text-[#9CB4C8] hover:text-[#00C8F0] hover:bg-[#0D2940] transition-colors"
            title="Đóng / mở sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-[#9CB4C8] hover:text-[#00C8F0] hover:bg-[#0D2940]"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onSelectNav('overview')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {/* High-tech hexagonal cyan brand icon */}
            <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#00C8F0] to-[#168BFF] p-0.5 shadow-[0_0_12px_rgba(0,200,240,0.5)] flex items-center justify-center">
              <div className="w-full h-full bg-[#081B2B] rounded-[6px] flex items-center justify-center">
                <Cpu className="w-4 h-4 text-[#00C8F0]" />
              </div>
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-wide text-[#EAF5FF] group-hover:text-[#00C8F0] transition-colors flex items-center gap-1.5">
                EDM SMARTGUARD AI
              </div>
              <div className="text-[9px] font-mono font-bold tracking-widest text-[#00C8F0] uppercase">
                INDUSTRIAL AI CONTROL TOWER
              </div>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CB4C8]" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                onSearch?.(e.target.value);
              }}
              placeholder="Tìm thiết bị, mã sự cố, lệnh bảo trì, tài liệu..."
              className="w-full pl-9 pr-14 py-1.5 text-xs bg-[#061522] border border-[#15324C] rounded-lg text-[#EAF5FF] placeholder-[#9CB4C8] focus:border-[#00C8F0] focus:ring-1 focus:ring-[#00C8F0] focus:outline-none transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-[#9CB4C8] bg-[#0A2032] border border-[#15324C] rounded">
                Ctrl K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right: Controls & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Factory Selector */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-[#9CB4C8]">
            <span>Nhà máy</span>
            <select
              value={currentPlant}
              onChange={(e) => onSelectPlant(e.target.value)}
              className="py-1 px-2 text-xs bg-[#061522] border border-[#15324C] rounded text-[#00C8F0] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="plant-01">Nhà máy A ⌄</option>
              <option value="plant-02">Nhà máy B ⌄</option>
              <option value="plant-03">Nhà máy C ⌄</option>
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="hidden 2xl:flex items-center gap-1.5 text-xs text-[#9CB4C8]">
            <span>Thời gian</span>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="py-1 px-2 text-xs bg-[#061522] border border-[#15324C] rounded text-[#EAF5FF] font-medium focus:outline-none cursor-pointer"
            >
              <option value="Hôm nay">Hôm nay ⌄</option>
              <option value="7 ngày qua">7 ngày qua</option>
              <option value="Tháng này">Tháng này</option>
            </select>
          </div>

          {/* Real-time Clock */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-[#9CB4C8] px-2 py-1 bg-[#061522] border border-[#15324C] rounded">
            <Calendar className="w-3.5 h-3.5 text-[#00C8F0]" />
            <span>{currentTime}</span>
          </div>

          {/* Audio Mute Toggle */}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg text-[#9CB4C8] hover:text-[#00C8F0] hover:bg-[#0D2940] transition-colors"
              title={isMuted ? 'Bật âm thanh cảnh báo' : 'Tắt âm thanh'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-[#FF5263]" /> : <Volume2 className="w-4 h-4 text-[#16D9A0]" />}
            </button>
          )}

          {/* Diagnostics tuning action with badge 3 */}
          <button
            onClick={() => onSelectNav('ai-diagnosis')}
            className="relative p-1.5 rounded-lg text-[#9CB4C8] hover:text-[#00C8F0] hover:bg-[#0D2940] transition-colors"
            title="Chẩn đoán AI (3 khuyến nghị)"
          >
            <Sliders className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5263] text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {alertCount}
              </span>
            )}
          </button>

          {/* Notification Bell with badge 12 */}
          <button
            onClick={() => onSelectNav('notifications')}
            className="relative p-1.5 rounded-lg text-[#9CB4C8] hover:text-[#00C8F0] hover:bg-[#0D2940] transition-colors"
            title="Thông báo & cảnh báo"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF5263] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#15324C]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#168BFF] to-[#00C8F0] p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#081B2B] rounded-full flex items-center justify-center text-xs font-bold text-[#00C8F0]">
                A
              </div>
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-[#EAF5FF] leading-tight">Nguyễn Văn A</div>
              <div className="text-[10px] text-[#9CB4C8] leading-tight">Quản lý</div>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* BODY WITH LEFT SIDEBAR AND WORKSPACE                           */}
      {/* ============================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`hidden md:flex flex-col bg-[#081B2B] border-r border-[#15324C] transition-all duration-300 select-none z-30 ${
            sidebarCollapsed ? 'w-16' : 'w-56'
          }`}
        >
          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 custom-tower-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectNav(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#168BFF] text-white font-bold shadow-[0_0_12px_rgba(22,139,255,0.4)]'
                      : 'text-[#9CB4C8] hover:text-[#EAF5FF] hover:bg-[#0D2940]'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-[#9CB4C8]'}`} />
                  {!sidebarCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-[#FF5263] text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Machine Graphic Card (Pixel-accurate matching reference image) */}
          {!sidebarCollapsed && (
            <div className="p-3 border-t border-[#15324C]">
              <div className="relative rounded-xl overflow-hidden border border-[#15324C] bg-gradient-to-b from-[#0D2940] to-[#081B2B] p-2.5 shadow-lg group">
                <div className="h-20 w-full rounded-lg bg-cover bg-center overflow-hidden flex items-end p-2 relative">
                  {/* Background Reference Asset */}
                  <img
                    src="/assets/aistudio/file_00000000e58c8211bd931eb3f46ef565_9cffacfc.png"
                    alt="EDM SmartGuard AI Machine"
                    className="absolute inset-0 w-full h-full object-cover object-bottom opacity-70 group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback gradient if image fails
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#061522] via-[#061522]/50 to-transparent"></div>
                  
                  <div className="relative z-10 w-full">
                    <div className="text-[11px] font-bold text-[#EAF5FF] leading-tight">
                      EDM SMARTGUARD AI
                    </div>
                    <div className="text-[10px] font-mono font-extrabold text-[#00C8F0] tracking-wider">
                      V2.0 PRO
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* MOBILE DRAWER SIDEBAR */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            <div className="relative w-64 bg-[#081B2B] border-r border-[#15324C] flex flex-col p-4 shadow-2xl z-10">
              <div className="flex items-center justify-between pb-3 border-b border-[#15324C]">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#00C8F0]" />
                  <span className="font-bold text-sm text-[#EAF5FF]">EDM SMARTGUARD AI</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded text-[#9CB4C8] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectNav(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold ${
                        isActive
                          ? 'bg-[#168BFF] text-white shadow-md'
                          : 'text-[#9CB4C8] hover:text-[#EAF5FF] hover:bg-[#0D2940]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-[#FF5263] text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MAIN WORKSPACE CONTENT */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 custom-tower-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};
