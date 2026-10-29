import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  XCircle,
  HelpCircle,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

// Design tokens
export const CLARITY_COLORS = {
  primaryNavy: '#073B68',
  darkNavy: '#082A4A',
  actionBlue: '#1677D2',
  mainBg: '#F3F7FB',
  cardBg: '#FFFFFF',
  border: '#D9E3ED',
  textPrimary: '#19324D',
  textSecondary: '#64748B',
  success: '#16A36A',
  warning: '#F2A51A',
  critical: '#E5484D',
  info: '#2196D2',
};

// 1. StatusBadge
export type StatusBadgeVariant =
  | 'success'
  | 'warning'
  | 'critical'
  | 'info'
  | 'purple'
  | 'neutral';

export interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  label: string;
  icon?: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  label,
  icon,
  pulse = false,
  className = '',
}) => {
  const styles: Record<StatusBadgeVariant, string> = {
    success: 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]',
    warning: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
    critical: 'bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]',
    info: 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]',
    purple: 'bg-[#F3E8FF] text-[#7C3AED] border-[#E9D5FF]',
    neutral: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${styles[variant]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
        </span>
      )}
      {icon}
      <span>{label}</span>
    </span>
  );
};

// 2. PageHeader
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: string[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, breadcrumbs, actions }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mb-1 font-medium">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-[#94A3B8]">/</span>}
                <span className={idx === breadcrumbs.length - 1 ? 'text-[#1677D2] font-semibold' : ''}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-[#19324D] tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

// 3. KPIStatCard
export interface KPIBreakdownItem {
  label: string;
  value: string | number;
  color: string;
}

export interface KPIStatCardProps {
  title: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  icon: React.ReactNode;
  iconBgColor?: string;
  breakdown?: KPIBreakdownItem[];
  sparkline?: React.ReactNode;
  onClick?: () => void;
}

export const KPIStatCard: React.FC<KPIStatCardProps> = ({
  title,
  value,
  delta,
  deltaPositive = true,
  icon,
  iconBgColor = 'bg-[#E0F2FE] text-[#1677D2]',
  breakdown,
  sparkline,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-[#D9E3ED] p-3.5 shadow-sm hover:shadow transition-shadow flex flex-col justify-between ${
        onClick ? 'cursor-pointer group' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${iconBgColor}`}>
          {icon}
        </div>
        {onClick && <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#1677D2] transition-colors" />}
      </div>
      <div className="mt-2.5">
        <div className="text-xs text-[#64748B] font-medium">{title}</div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-2xl font-bold text-[#19324D] font-mono">{value}</span>
          {delta && (
            <span
              className={`text-xs font-semibold flex items-center ${
                deltaPositive ? 'text-[#16A36A]' : 'text-[#E5484D]'
              }`}
            >
              {delta}
            </span>
          )}
        </div>
      </div>
      {sparkline && <div className="mt-2 pt-2 border-t border-[#F1F5F9]">{sparkline}</div>}
      {breakdown && breakdown.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B] flex-wrap gap-1">
          {breakdown.map((item, idx) => (
            <span key={idx} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
              <span>{item.label}:</span>
              <strong className="text-[#19324D]">{item.value}</strong>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// 4. LoadingState
export const LoadingState: React.FC<{ message?: string; height?: string }> = ({
  message = 'Đang đồng bộ dữ liệu thời gian thực...',
  height = 'min-h-[160px]',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center text-[#64748B] ${height}`}>
      <Loader2 className="w-6 h-6 text-[#1677D2] animate-spin mb-2" />
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
};

// 5. EmptyState
export const EmptyState: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  height?: string;
}> = ({
  title,
  description,
  icon = <Info className="w-8 h-8 text-[#94A3B8]" />,
  actionText,
  onAction,
  height = 'min-h-[160px]',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center text-[#64748B] ${height}`}>
      <div className="mb-2">{icon}</div>
      <h4 className="text-xs font-bold text-[#19324D]">{title}</h4>
      {description && <p className="text-[11px] text-[#64748B] mt-1 max-w-sm">{description}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-3 px-3 py-1 rounded bg-[#1677D2] hover:bg-[#135ea8] text-white text-xs font-semibold transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

// 6. ErrorState
export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({
  title = 'Lỗi kết nối dữ liệu',
  message,
  onRetry,
}) => {
  return (
    <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-4 text-[#DC2626] flex items-start gap-3">
      <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 text-xs">
        <h4 className="font-bold">{title}</h4>
        <p className="text-[#991B1B] mt-0.5">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#DC2626] text-white text-[11px] font-bold hover:bg-[#B91C1C] transition"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Thử lại</span>
          </button>
        )}
      </div>
    </div>
  );
};

// 7. ConfirmationDialog
export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-xl border border-[#D9E3ED] p-5 shadow-2xl max-w-md w-full text-[#19324D] space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              confirmVariant === 'danger'
                ? 'bg-[#FEE2E2] text-[#DC2626]'
                : 'bg-[#E0F2FE] text-[#1677D2]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{title}</h3>
            <p className="text-xs text-[#64748B] mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white transition ${
              confirmVariant === 'danger'
                ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                : 'bg-[#1677D2] hover:bg-[#135ea8]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
