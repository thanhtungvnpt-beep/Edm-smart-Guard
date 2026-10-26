import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Radio,
  Sparkles,
  UserCheck,
  Search,
  Filter,
  ArrowRight,
  Eye,
  FileCheck,
  CheckSquare,
  AlertOctagon,
  Info,
} from 'lucide-react';
import {
  ManagedAlertItem,
  ManagedAlertLifecycleStage,
  AlertProvenanceType,
  SystemRoleKey,
} from '../../types';
import { INITIAL_MANAGED_ALERTS } from '../../utils/trustedFoundationData';

interface EnhancedAlertManagementCenterProps {
  onToast?: (message: string) => void;
  onNavigateToLineage?: (correlationId: string) => void;
}

export const EnhancedAlertManagementCenter: React.FC<EnhancedAlertManagementCenterProps> = ({
  onToast,
  onNavigateToLineage,
}) => {
  const [alerts, setAlerts] = useState<ManagedAlertItem[]>(INITIAL_MANAGED_ALERTS);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterProvenance, setFilterProvenance] = useState<string>('ALL');
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // Resolution note state for modal/inline
  const [resolutionInput, setResolutionInput] = useState<string>('');

  const filteredAlerts = alerts.filter((a) => {
    const matchesSev = filterSeverity === 'ALL' || a.severity === filterSeverity;
    const matchesProv = filterProvenance === 'ALL' || a.provenanceType === filterProvenance;
    const matchesStage = filterStage === 'ALL' || a.lifecycleStage === filterStage;
    return matchesSev && matchesProv && matchesStage;
  });

  const getProvenanceBadge = (type: AlertProvenanceType) => {
    switch (type) {
      case 'OBSERVED_REAL':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
            <Radio className="h-3 w-3 text-emerald-400" />
            OBSERVED REAL (Đo đạc thực tế)
          </span>
        );
      case 'RULE_BASED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-bold">
            <CheckSquare className="h-3 w-3 text-cyan-400" />
            RULE BASED (Quy tắc ngưỡng)
          </span>
        );
      case 'AI_PREDICTION':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 text-[10px] font-bold">
            <Sparkles className="h-3 w-3 text-purple-300 animate-pulse" />
            AI PREDICTION (Dự báo AI)
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 text-[10px] font-bold">
            <UserCheck className="h-3 w-3 text-blue-400" />
            CONFIRMED (Hiện trường xác nhận)
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-600 text-white font-bold animate-pulse';
      case 'HIGH':
        return 'bg-orange-500 text-white font-bold';
      case 'MEDIUM':
        return 'bg-amber-500 text-slate-950 font-bold';
      case 'LOW':
        return 'bg-blue-600 text-white font-medium';
      case 'INFO':
        return 'bg-slate-700 text-slate-200 font-medium';
      default:
        return 'bg-slate-800 text-white';
    }
  };

  const handleAdvanceStage = (alertId: string, nextStage: ManagedAlertLifecycleStage) => {
    setAlerts((prev) =>
      prev.map((a) => {
        if (a.id !== alertId) return a;
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const updated: ManagedAlertItem = {
          ...a,
          lifecycleStage: nextStage,
        };
        if (nextStage === 'ACKNOWLEDGED') {
          updated.acknowledgedAt = now;
        } else if (nextStage === 'RESOLVED') {
          updated.resolvedAt = now;
          updated.resolutionNote = resolutionInput || 'Đã kiểm tra, xử lý hoàn tất tại máy.';
        } else if (nextStage === 'VERIFIED') {
          updated.verifiedAt = now;
          updated.verifiedBy = 'Trần Văn Mạnh (Leader EQM)';
        }
        return updated;
      })
    );
    setResolutionInput('');
    onToast?.(`Đã cập nhật trạng thái cảnh báo sang: ${nextStage}`);
  };

  const lifecycleStagesList: ManagedAlertLifecycleStage[] = [
    'DETECTED',
    'TRIAGED',
    'ASSIGNED',
    'ACKNOWLEDGED',
    'IN_PROGRESS',
    'RESOLVED',
    'VERIFIED',
    'CLOSED',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950/60 to-slate-900 border border-rose-900/40 p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
                Mô-đun 6: Alert Governance
              </span>
              <span className="rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-mono font-medium">
                Vòng Đời 8 Bước • 4 Nhãn Phân Định Nguồn
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-rose-400" />
              <span>Trung Tâm Quản Trị Cảnh Báo Đa Nguồn & Phản Ứng Sự Cố</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Phân biệt rõ ràng giữa cảnh báo đo đạc thực tế từ cảm biến, quy tắc ngưỡng cứng, dự báo xác suất của AI và nghiệm thu thực địa. Ngăn ngừa hoàn toàn hiện tượng báo động giả và ảo giác cảnh báo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-slate-950 border border-slate-800 px-4 py-2 text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Tổng Cảnh Báo</span>
              <span className="text-xl font-black text-white font-mono">{alerts.length}</span>
            </div>
          </div>
        </div>

        {/* 8-Stage Lifecycle Visualization */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            Vòng Đời Cảnh Báo Chuẩn Hóa (8 Stages Lifecycle):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
            {lifecycleStagesList.map((stage, idx) => {
              const count = alerts.filter((a) => a.lifecycleStage === stage).length;
              return (
                <div
                  key={stage}
                  className={`p-2 rounded-xl border transition ${
                    count > 0
                      ? 'bg-rose-950/30 border-rose-500/40 text-white font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="text-[10px] font-mono text-slate-400">0{idx + 1}</div>
                  <div className="text-[11px] font-mono truncate">{stage}</div>
                  <div className="text-xs font-bold font-mono text-rose-400 mt-0.5">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-300">Lọc Cảnh Báo:</span>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">Tất cả mức độ</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          <select
            value={filterProvenance}
            onChange={(e) => setFilterProvenance(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">Tất cả nguồn gốc</option>
            <option value="OBSERVED_REAL">OBSERVED REAL</option>
            <option value="RULE_BASED">RULE BASED</option>
            <option value="AI_PREDICTION">AI PREDICTION</option>
            <option value="CONFIRMED">CONFIRMED</option>
          </select>

          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">Tất cả vòng đời</option>
            {lifecycleStagesList.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Hiển thị: <strong className="text-white">{filteredAlerts.length}</strong> cảnh báo
        </div>
      </div>

      {/* Alert Cards List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 transition shadow-md space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rounded-md px-2 py-0.5 text-xs font-mono ${getSeverityBadge(alert.severity)}`}>
                  {alert.severity}
                </span>
                <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                  {alert.deviceCode}
                </span>
                <span className="font-mono text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {alert.id}
                </span>
                {getProvenanceBadge(alert.provenanceType)}
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-950 border border-slate-800 text-slate-300 px-3 py-1 text-xs font-mono font-bold">
                  Giai Đoạn: <strong className="text-amber-400">{alert.lifecycleStage}</strong>
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">{alert.title}</h4>
              <p className="text-xs text-slate-300 mt-1 font-mono bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                <strong className="text-slate-400">Bằng chứng kỹ thuật:</strong> {alert.evidenceValues}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-950/40 p-2.5 rounded-xl text-slate-400 font-mono">
              <div>Nguồn cấp: <span className="text-cyan-300">{alert.dataSource}</span></div>
              <div>Người phân công: <span className="text-white">{alert.assignedTo || 'Chưa phân công'}</span></div>
              <div>Thời điểm phát hiện: <span className="text-slate-300">{alert.detectedAt}</span></div>
            </div>

            {/* Action Buttons to Advance Lifecycle */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-mono text-slate-500">
                Correlation: <span className="text-purple-400">{alert.correlationId}</span>
              </div>

              <div className="flex items-center gap-2">
                {alert.lifecycleStage === 'DETECTED' && (
                  <button
                    onClick={() => handleAdvanceStage(alert.id, 'TRIAGED')}
                    className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1 shadow"
                  >
                    Phân Loại (Triage)
                  </button>
                )}
                {alert.lifecycleStage === 'TRIAGED' && (
                  <button
                    onClick={() => handleAdvanceStage(alert.id, 'ASSIGNED')}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1 shadow"
                  >
                    Giao Việc KTV (Assign)
                  </button>
                )}
                {alert.lifecycleStage === 'ASSIGNED' && (
                  <button
                    onClick={() => handleAdvanceStage(alert.id, 'ACKNOWLEDGED')}
                    className="rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3 py-1 shadow"
                  >
                    Xác Nhận Đã Nhận (Acknowledge)
                  </button>
                )}
                {alert.lifecycleStage === 'ACKNOWLEDGED' && (
                  <button
                    onClick={() => handleAdvanceStage(alert.id, 'IN_PROGRESS')}
                    className="rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-1 shadow"
                  >
                    Bắt Đầu Xử Lý (In Progress)
                  </button>
                )}
                {alert.lifecycleStage === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleAdvanceStage(alert.id, 'RESOLVED')}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1 shadow"
                  >
                    Đã Khắc Phục (Resolve)
                  </button>
                )}
                {alert.lifecycleStage === 'RESOLVED' && (
                  <button
                    onClick={() => handleAdvanceStage(alert.id, 'VERIFIED')}
                    className="rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-3 py-1 shadow"
                  >
                    Leader Nghiệm Thu (Verify)
                  </button>
                )}
                {alert.lifecycleStage === 'VERIFIED' && (
                  <button
                    onClick={() => handleAdvanceStage(alert.id, 'CLOSED')}
                    className="rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-3 py-1 shadow"
                  >
                    Đóng Sự Cố (Close)
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
