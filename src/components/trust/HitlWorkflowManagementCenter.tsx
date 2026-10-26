import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  DollarSign,
  Lock,
} from 'lucide-react';
import { HitlWorkflowItem, HitlWorkflowState, SystemRoleKey } from '../../types';
import { INITIAL_HITL_WORKFLOW_ITEMS } from '../../utils/trustedFoundationData';

interface HitlWorkflowManagementCenterProps {
  onToast?: (message: string) => void;
  currentUserRole?: string;
}

export const HitlWorkflowManagementCenter: React.FC<HitlWorkflowManagementCenterProps> = ({
  onToast,
  currentUserRole = 'PLANT_MANAGER',
}) => {
  const [workflowItems, setWorkflowItems] = useState<HitlWorkflowItem[]>(INITIAL_HITL_WORKFLOW_ITEMS);
  const [selectedItem, setSelectedItem] = useState<HitlWorkflowItem | null>(null);
  const [filterState, setFilterState] = useState<string>('ALL');
  const [notesInput, setNotesInput] = useState<string>('');

  const filteredItems = workflowItems.filter((item) => {
    return filterState === 'ALL' || item.currentState === filterState;
  });

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'LEVEL_3_CRITICAL_ACTION':
        return (
          <span className="rounded-full bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-0.5 text-xs font-bold animate-pulse">
            Level 3: Hành Động Rủi Ro Cao (Cần Giám Đốc Ký Duyệt)
          </span>
        );
      case 'LEVEL_2_RECOMMENDATION':
        return (
          <span className="rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold">
            Level 2: Khuyến Nghị Vận Hành (Leader EQM Thẩm Tra)
          </span>
        );
      case 'LEVEL_1_INFO':
        return (
          <span className="rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-0.5 text-xs font-bold">
            Level 1: Thông Tin Tham Khảo
          </span>
        );
      default:
        return null;
    }
  };

  const getStateBadge = (state: HitlWorkflowState) => {
    switch (state) {
      case 'DRAFT':
        return 'bg-slate-700 text-slate-200';
      case 'PENDING_REVIEW':
        return 'bg-amber-500 text-slate-950 font-bold animate-pulse';
      case 'APPROVED':
        return 'bg-emerald-600 text-white font-bold';
      case 'REJECTED':
        return 'bg-red-600 text-white font-bold';
      case 'EXECUTION_PENDING':
        return 'bg-blue-600 text-white font-bold';
      case 'EXECUTED':
        return 'bg-purple-600 text-white font-bold';
      case 'VERIFICATION_PENDING':
        return 'bg-indigo-600 text-white font-bold';
      case 'VERIFIED':
        return 'bg-cyan-600 text-white font-bold';
    }
  };

  const handleApprove = (item: HitlWorkflowItem) => {
    setWorkflowItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              currentState: 'APPROVED',
              approvedBy: 'Lê Hoàng Nam (Plant Director)',
              approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              approvalNotes: notesInput || 'Đã kiểm tra bằng chứng và tính khả thi. Phê duyệt triển khai.',
            }
          : i
      )
    );
    setNotesInput('');
    onToast?.(`Đã phê duyệt đề xuất ${item.id}. Chuyển sang trạng thái APPROVED → Khởi tạo Work Order.`);
  };

  const handleReject = (item: HitlWorkflowItem) => {
    setWorkflowItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              currentState: 'REJECTED',
              approvedBy: 'Lê Hoàng Nam (Plant Director)',
              approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              approvalNotes: notesInput || 'Từ chối do rủi ro gợn sóng bề mặt phôi.',
            }
          : i
      )
    );
    setNotesInput('');
    onToast?.(`Đã từ chối đề xuất ${item.id}. Đề xuất được lưu vết vào Audit Log.`);
  };

  const handleExecute = (item: HitlWorkflowItem) => {
    setWorkflowItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              currentState: 'EXECUTED',
              executedBy: 'Phạm Minh Tuấn (Technician)',
              executedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              executionResultNotes: 'Kỹ thuật viên đã hoàn tất thay linh kiện và hiệu chuẩn trục.',
            }
          : i
      )
    );
    onToast?.(`Kỹ thuật viên đã hoàn tất thực thi lệnh công tác ${item.id}`);
  };

  const handleVerify = (item: HitlWorkflowItem) => {
    setWorkflowItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              currentState: 'VERIFIED',
              verifiedBy: 'Trần Văn Mạnh (Leader EQM)',
              verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
              verificationOutcome: 'EFFECTIVE',
              actualDowntimePreventedHours: 4.5,
            }
          : i
      )
    );
    onToast?.(`Leader đã nghiệm thu thành công ${item.id}: Hiệu quả, tiết kiệm 4.5h dừng máy.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-900/40 p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Mô-đun 3: Human-in-the-Loop Workflow
              </span>
              <span className="rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono font-medium">
                Chuỗi 8 Trạng Thái • Chống Tự Ý Thực Thi
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-indigo-400" />
              <span>Hàng Đợi Quyết Định & Quy Trình Ký Duyệt Phân Tầng</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Cơ chế kiểm soát bắt buộc: AI chỉ đóng vai trò phân tích và đề xuất phương án tối ưu. Mọi can thiệp thiết bị, dừng máy hoặc đổi kế hoạch giao hàng đều bắt buộc phải qua thẩm định và phê duyệt của con người.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-slate-950 border border-slate-800 px-4 py-2 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Chờ Phê Duyệt</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {workflowItems.filter((i) => i.currentState === 'PENDING_REVIEW').length} Đề Xuất
              </span>
            </div>
          </div>
        </div>

        {/* 8 States Pipeline */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-xs text-slate-400 font-mono">
          <span className="text-slate-300 font-bold uppercase">Luồng Chuyển Trạng Thái:</span>
          <span>DRAFT</span>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <span className="text-amber-400 font-bold">PENDING_REVIEW</span>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <span className="text-emerald-400 font-bold">APPROVED / REJECTED</span>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <span>EXECUTION_PENDING</span>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <span className="text-purple-400 font-bold">EXECUTED</span>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <span className="text-cyan-400 font-bold">VERIFIED</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">Lọc Trạng Thái:</span>
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái ({workflowItems.length})</option>
            <option value="PENDING_REVIEW">Chờ Duyệt (PENDING_REVIEW)</option>
            <option value="APPROVED">Đã Duyệt (APPROVED)</option>
            <option value="EXECUTED">Đã Thực Hiện (EXECUTED)</option>
            <option value="VERIFIED">Đã Nghiệm Thu (VERIFIED)</option>
            <option value="REJECTED">Từ Chối (REJECTED)</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Hiển thị: <strong className="text-white">{filteredItems.length}</strong> phiếu đề xuất
        </div>
      </div>

      {/* Workflow Cards */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 space-y-4 shadow-xl transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded">
                  {item.id}
                </span>
                <span className="font-mono text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                  {item.correlationId}
                </span>
                <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                  {item.targetDeviceCode}
                </span>
                {getRiskBadge(item.riskLevel)}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-mono font-bold ${getStateBadge(
                    item.currentState
                  )}`}
                >
                  {item.currentState}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-base font-bold text-white">{item.title}</h4>
              <p className="text-xs text-slate-300 mt-1 bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                <strong className="text-cyan-400 block mb-1">Đề Xuất Phân Tích Từ AI:</strong>
                {item.aiProposalSummary}
              </p>
            </div>

            {/* Evidence Checklist */}
            <div className="space-y-1.5 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Bằng Chứng & Nguồn Dữ Liệu Kiểm Chứng ({item.evidenceSources.length}):
              </span>
              <ul className="space-y-1">
                {item.evidenceSources.map((ev, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 font-mono text-[11px]">
                    <span className="text-cyan-400 font-bold">●</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Approval / Rejection / Execution Trails */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] bg-slate-950/60 p-3 rounded-xl font-mono text-slate-400 border border-slate-800">
              <div>
                Khởi tạo bởi: <span className="text-white block">{item.submittedBy}</span>
                <span className="text-slate-500">{item.submittedAt}</span>
              </div>
              <div>
                Phê duyệt bởi: <span className="text-emerald-300 block">{item.approvedBy || 'Chưa duyệt'}</span>
                <span className="text-slate-500">{item.approvedAt || '—'}</span>
              </div>
              <div>
                KTV thực thi: <span className="text-purple-300 block">{item.executedBy || 'Chưa thực hiện'}</span>
                <span className="text-slate-500">{item.executedAt || '—'}</span>
              </div>
              <div>
                Nghiệm thu: <span className="text-cyan-300 block">{item.verifiedBy || 'Chưa nghiệm thu'}</span>
                <span className="text-slate-500">{item.verifiedAt || '—'}</span>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-400">
                Cổng dữ liệu lúc phê duyệt: <span className="text-emerald-400 font-bold font-mono">{item.dataReadinessAtApproval}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {item.currentState === 'PENDING_REVIEW' && (
                  <>
                    <input
                      type="text"
                      placeholder="Ghi chú phê duyệt / phương án thay thế..."
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 min-w-[240px]"
                    />
                    <button
                      onClick={() => handleReject(item)}
                      className="flex items-center gap-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 px-3 py-1.5 text-xs font-bold transition"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Từ Chối</span>
                    </button>
                    <button
                      onClick={() => handleApprove(item)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 text-xs font-bold transition shadow"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Ký Phê Duyệt Lệnh</span>
                    </button>
                  </>
                )}

                {item.currentState === 'APPROVED' && (
                  <button
                    onClick={() => handleExecute(item)}
                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 text-xs font-bold transition shadow"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>KTV Bắt Đầu Thực Thi</span>
                  </button>
                )}

                {item.currentState === 'EXECUTED' && (
                  <button
                    onClick={() => handleVerify(item)}
                    className="flex items-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-1.5 text-xs font-bold transition shadow"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Nghiệm Thu Kết Quả Thực Tế</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
