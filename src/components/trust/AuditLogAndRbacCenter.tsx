import React, { useState } from 'react';
import {
  FileText,
  Users2,
  Shield,
  Search,
  Filter,
  Download,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Eye,
  Building2,
  Wrench,
  Sparkles,
  KeyRound,
  Hash,
  Database,
  ExternalLink,
} from 'lucide-react';
import { AuditLogEntry, SystemRoleKey, SystemRoleDefinition } from '../../types';
import { INITIAL_AUDIT_LOGS, SYSTEM_ROLE_DEFINITIONS } from '../../utils/trustedFoundationData';

interface AuditLogAndRbacCenterProps {
  onToast?: (message: string) => void;
}

export const AuditLogAndRbacCenter: React.FC<AuditLogAndRbacCenterProps> = ({ onToast }) => {
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'RBAC'>('AUDIT');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedRoleKey, setSelectedRoleKey] = useState<SystemRoleKey>('PLANT_MANAGER');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.correlationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.reason && log.reason.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'ALL' || log.actorRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleExportAudit = () => {
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EDM_SmartGuard_AuditLog_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast?.(`Đã xuất ${filteredLogs.length} bản ghi nhật ký kiểm toán bất biến dạng JSON.`);
  };

  const rolesList = Object.values(SYSTEM_ROLE_DEFINITIONS);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-900 border border-purple-900/40 p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Mô-đun 4 & 5: Audit Log & Phân Quyền RBAC
              </span>
              <span className="rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono font-medium">
                Khóa Băm Bất Biến • 8 Vai Trò Chuẩn Hóa
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-purple-400" />
              <span>Nhật Ký Kiểm Toán Bất Biến & Ma Trận Phân Quyền RBAC</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Lưu trữ mọi dấu vết hành vi (AI đề xuất, Kỹ sư kiểm tra, Người phê duyệt, KTV thực hiện). Đảm bảo tính minh bạch, không thể chỉnh sửa và tuân thủ các quy định bảo mật công nghiệp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'AUDIT'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Nhật Ký Kiểm Toán ({auditLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('RBAC')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'RBAC'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Users2 className="h-4 w-4" />
              <span>Ma Trận 8 Vai Trò RBAC</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: AUDIT LOG (NHẬT KÝ KIỂM TOÁN BẤT BIẾN)                       */}
      {/* ==================================================================== */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo correlationId, người thực hiện, đối tượng..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-slate-400 shrink-0" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả vai trò</option>
                <option value="SYSTEM_ADMIN">Quản Trị Viên (System Admin)</option>
                <option value="PLANT_MANAGER">Giám Đốc Nhà Máy</option>
                <option value="LEADER">Leader EQM</option>
                <option value="TECHNICIAN">Kỹ Thuật Viên</option>
                <option value="DATA_STEWARD">Data Steward</option>
                <option value="WORKFLOW_APPROVER">Workflow Approver</option>
              </select>

              <button
                onClick={handleExportAudit}
                className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 transition"
              >
                <Download className="h-3.5 w-3.5 text-purple-400" />
                <span>Xuất JSON</span>
              </button>
            </div>
          </div>

          {/* Audit Records List */}
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const isSelected = selectedLogId === log.id;
              return (
                <div
                  key={log.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 transition shadow-md space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded">
                        {log.id}
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                        {log.correlationId}
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">
                        {log.actionType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px] bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <Lock className="h-3 w-3" />
                        <span>Chống Giả Mạo: Toàn Vẹn</span>
                      </span>
                      <span className="text-slate-400 font-mono">{log.timestamp}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Người / Tác Nhân Thực Hiện:</span>
                      <span className="font-bold text-white">
                        {log.actorName} ({log.actorRole})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Đối Tượng Tác Động:</span>
                      <span className="font-bold text-cyan-300">
                        {log.targetEntity} (ID: {log.targetEntityId})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Địa Chỉ IP / Mạng Gốc:</span>
                      <span className="font-mono text-slate-300">{log.ipAddress || 'Internal Bus'}</span>
                    </div>
                  </div>

                  {log.reason && (
                    <div className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                      <strong className="text-slate-400">Căn cứ / Lý do thực hiện:</strong> {log.reason}
                    </div>
                  )}

                  {/* Expandable State Diff & Checksum */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2 font-mono text-slate-500">
                      <Hash className="h-3.5 w-3.5 text-amber-400" />
                      <span className="truncate max-w-md">Checksum: {log.antiTamperHash}</span>
                    </div>

                    <button
                      onClick={() => setSelectedLogId(isSelected ? null : log.id)}
                      className="text-purple-400 hover:text-purple-300 font-bold inline-flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{isSelected ? 'Thu gọn Diff' : 'Xem Biến Động State (Diff)'}</span>
                    </button>
                  </div>

                  {isSelected && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                      <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/20">
                        <span className="font-bold text-red-400 block mb-1">TRẠNG THÁI TRƯỚC (BEFORE):</span>
                        <pre className="font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                          {log.previousState || '(Khởi tạo mới)'}
                        </pre>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                        <span className="font-bold text-emerald-400 block mb-1">TRẠNG THÁI SAU (AFTER):</span>
                        <pre className="font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                          {log.newState || '(Không thay đổi)'}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: RBAC MATRIX (8 VAI TRÒ CHUẨN HÓA)                            */}
      {/* ==================================================================== */}
      {activeTab === 'RBAC' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {rolesList.map((role) => (
              <button
                key={role.key}
                onClick={() => setSelectedRoleKey(role.key)}
                className={`text-left p-3.5 rounded-2xl border transition shadow-sm ${
                  selectedRoleKey === role.key
                    ? 'bg-purple-950/50 border-purple-400 text-white shadow-lg ring-1 ring-purple-400'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-purple-300">
                    {role.key}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {role.riskTierAuthority}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white">{role.vietnameseTitle}</h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{role.department}</p>
              </button>
            ))}
          </div>

          {/* Selected Role Deep Dive */}
          {(() => {
            const currentRoleDef = SYSTEM_ROLE_DEFINITIONS[selectedRoleKey];
            return (
              <div className="rounded-3xl bg-slate-900 border border-purple-500/40 p-6 space-y-5 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs uppercase font-bold text-purple-400 font-mono">
                      Quyền Hạn Chi Tiết Cho Vai Trò: {currentRoleDef.key}
                    </span>
                    <h3 className="text-lg font-black text-white">{currentRoleDef.title}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{currentRoleDef.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 text-xs font-bold">
                      Thẩm Quyền Rủi Ro: {currentRoleDef.riskTierAuthority}
                    </span>
                  </div>
                </div>

                {/* Permissions Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-purple-400" />
                    <span>Danh Sách Quyền Hạn Thực Thi Được Cấp Phép ({currentRoleDef.allowedActions.length})</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {currentRoleDef.allowedActions.map((action, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span className="font-mono text-[11px]">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk Tier Explanations */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-slate-300 block">Quy Định Phân Tầng Phê Duyệt Human-in-the-Loop:</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <strong className="text-cyan-300 block">Level 1: Thông Tin (Info Only)</strong>
                      <span className="text-slate-400">KTV & Leader tiếp nhận để theo dõi, không yêu cầu ký duyệt tài chính.</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <strong className="text-amber-300 block">Level 2: Khuyến Nghị Vận Hành</strong>
                      <span className="text-slate-400">Leader EQM hoặc Quản lý xưởng thẩm tra và duyệt thay đổi tham số cắt.</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <strong className="text-red-300 block">Level 3: Hành Động Rủi Ro Cao</strong>
                      <span className="text-slate-400">Chỉ Giám Đốc Nhà Máy hoặc Quản Trị Viên mới có quyền phê duyệt dừng máy hoặc đổi đơn hàng.</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
