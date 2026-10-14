import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ShoppingCart,
  MapPin,
  Tag,
  Wrench,
  DollarSign,
  TrendingDown,
  Layers,
  FileText,
  Calendar,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Download,
  Flame,
  Check,
  User,
  Cpu,
  Truck,
} from 'lucide-react';
import { Device, SparePart, StockTransaction, PurchaseOrderRequest, SparePartCategory } from '../types';
import {
  getStoredSpareParts,
  saveStoredSpareParts,
  getStoredPurchaseOrders,
  saveStoredPurchaseOrders,
  getStoredStockTransactions,
  saveStoredStockTransactions,
  issueSparePart,
  restockSparePart,
  createQuickPurchaseOrder,
} from '../utils/sparePartsStorage';

interface SparePartsInventoryTabProps {
  devices: Device[];
  onOpenMachineDetails?: (device: Device) => void;
  initialFilterPartId?: string;
  onToast: (msg: string) => void;
}

export const SparePartsInventoryTab: React.FC<SparePartsInventoryTabProps> = ({
  devices,
  onOpenMachineDetails,
  initialFilterPartId,
  onToast,
}) => {
  // State
  const [parts, setParts] = useState<SparePart[]>(() => getStoredSpareParts());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRequest[]>(() => getStoredPurchaseOrders());
  const [transactions, setTransactions] = useState<StockTransaction[]>(() => getStoredStockTransactions());

  // Views & Tabs within the module
  const [activeSubTab, setActiveSubTab] = useState<'INVENTORY' | 'PURCHASE_ORDERS' | 'TRANSACTIONS'>('INVENTORY');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SHORTAGE_ONLY' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK'>('ALL');
  const [machineFilter, setMachineFilter] = useState<string>('ALL');

  // Modal Dialog States
  const [issueModalPart, setIssueModalPart] = useState<SparePart | null>(null);
  const [issueQty, setIssueQty] = useState<number>(1);
  const [issueDeviceCode, setIssueDeviceCode] = useState<string>('');
  const [issueReason, setIssueReason] = useState<string>('');
  const [issueTechName, setIssueTechName] = useState<string>('Kỹ thuật viên ca trực');

  const [restockModalPart, setRestockModalPart] = useState<SparePart | null>(null);
  const [restockQty, setRestockQty] = useState<number>(2);
  const [restockNotes, setRestockNotes] = useState<string>('');

  const [poModalPart, setPoModalPart] = useState<SparePart | null>(null);
  const [poQty, setPoQty] = useState<number>(5);
  const [poUrgency, setPoUrgency] = useState<'EMERGENCY_DOWNTIME' | 'RESTOCK_WARNING' | 'SCHEDULED_PM'>('EMERGENCY_DOWNTIME');
  const [poNotes, setPoNotes] = useState<string>('');

  const [showAddPartModal, setShowAddPartModal] = useState<boolean>(false);
  const [newPartName, setNewPartName] = useState<string>('');
  const [newPartNumber, setNewPartNumber] = useState<string>('');
  const [newPartCategory, setNewPartCategory] = useState<SparePartCategory>('FILTRATION');
  const [newPartStock, setNewPartStock] = useState<number>(2);
  const [newPartMinStock, setNewPartMinStock] = useState<number>(2);
  const [newPartUnit, setNewPartUnit] = useState<string>('Quả');
  const [newPartPrice, setNewPartPrice] = useState<number>(80);
  const [newPartLocation, setNewPartLocation] = useState<string>('Kệ A1');
  const [newPartSupplier, setNewPartSupplier] = useState<string>('');
  const [newPartLeadDays, setNewPartLeadDays] = useState<number>(3);

  // Sync state if initialFilterPartId changes
  useEffect(() => {
    if (initialFilterPartId) {
      const target = parts.find((p) => p.id === initialFilterPartId || p.partNumber.includes(initialFilterPartId));
      if (target) {
        setSearchQuery(target.partNumber);
      }
    }
  }, [initialFilterPartId, parts]);

  const refreshData = () => {
    setParts(getStoredSpareParts());
    setPurchaseOrders(getStoredPurchaseOrders());
    setTransactions(getStoredStockTransactions());
  };

  // Inventory KPI Metrics
  const metrics = useMemo(() => {
    const totalCount = parts.length;
    const outOfStock = parts.filter((p) => p.status === 'OUT_OF_STOCK').length;
    const lowStock = parts.filter((p) => p.status === 'LOW_STOCK').length;
    const shortageCount = outOfStock + lowStock;
    const inStockCount = parts.filter((p) => p.status === 'IN_STOCK').length;
    const totalInventoryValueUSD = parts.reduce((acc, p) => acc + p.currentStock * p.unitPriceUSD, 0);
    const fulfillmentRate = totalCount > 0 ? Math.round((inStockCount / totalCount) * 100) : 100;
    const pendingPoCount = purchaseOrders.filter((po) => po.status === 'ORDERED' || po.status === 'PENDING_APPROVAL').length;

    return {
      totalCount,
      outOfStock,
      lowStock,
      shortageCount,
      inStockCount,
      totalInventoryValueUSD,
      fulfillmentRate,
      pendingPoCount,
    };
  }, [parts, purchaseOrders]);

  // Filtered Parts
  const filteredParts = useMemo(() => {
    return parts.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.partNumber.toLowerCase().includes(q);
        const matchLoc = p.binLocation.toLowerCase().includes(q);
        const matchSupplier = p.supplier.toLowerCase().includes(q);
        const matchModel = p.compatibleModels.some((m) => m.toLowerCase().includes(q));
        if (!matchName && !matchSku && !matchLoc && !matchSupplier && !matchModel) return false;
      }

      // Category
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;

      // Status
      if (statusFilter === 'SHORTAGE_ONLY') {
        if (p.status !== 'OUT_OF_STOCK' && p.status !== 'LOW_STOCK') return false;
      } else if (statusFilter === 'OUT_OF_STOCK' && p.status !== 'OUT_OF_STOCK') {
        return false;
      } else if (statusFilter === 'LOW_STOCK' && p.status !== 'LOW_STOCK') {
        return false;
      } else if (statusFilter === 'IN_STOCK' && p.status !== 'IN_STOCK') {
        return false;
      }

      // Machine compatibility
      if (machineFilter !== 'ALL') {
        const matchesMachine = p.compatibleModels.some((m) =>
          m.toLowerCase().includes(machineFilter.toLowerCase())
        );
        if (!matchesMachine) return false;
      }

      return true;
    });
  }, [parts, searchQuery, categoryFilter, statusFilter, machineFilter]);

  // Handler: Execute Issue Part
  const handleExecuteIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueModalPart) return;
    const res = issueSparePart(
      issueModalPart.id,
      issueQty,
      issueTechName,
      issueDeviceCode || undefined,
      issueReason || undefined
    );

    if (res.success) {
      onToast(`✓ ${res.message}`);
      refreshData();
      setIssueModalPart(null);
      setIssueQty(1);
      setIssueReason('');
    } else {
      onToast(`❌ ${res.message}`);
    }
  };

  // Handler: Execute Restock
  const handleExecuteRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockModalPart) return;
    const res = restockSparePart(restockModalPart.id, restockQty, 'Thủ kho phụ tùng', restockNotes);
    if (res.success) {
      onToast(`✓ ${res.message}`);
      refreshData();
      setRestockModalPart(null);
      setRestockQty(2);
      setRestockNotes('');
    } else {
      onToast(`❌ ${res.message}`);
    }
  };

  // Handler: Execute Create PO
  const handleExecuteCreatePo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poModalPart) return;
    const res = createQuickPurchaseOrder(
      poModalPart.id,
      poQty,
      'Kỹ thuật viên ca trực',
      issueDeviceCode || undefined,
      poNotes || undefined
    );
    if (res.success) {
      onToast(`✓ ${res.message}`);
      refreshData();
      setPoModalPart(null);
      setPoQty(5);
      setPoNotes('');
    } else {
      onToast(`❌ ${res.message}`);
    }
  };

  // Handler: Add New Spare Part
  const handleCreateNewPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim() || !newPartNumber.trim()) {
      onToast('❌ Vui lòng nhập tên và mã linh kiện SKU');
      return;
    }

    const newPart: SparePart = {
      id: `part-${Date.now().toString().slice(-6)}`,
      partNumber: newPartNumber.trim().toUpperCase(),
      name: newPartName.trim(),
      category: newPartCategory,
      categoryLabel:
        newPartCategory === 'FILTRATION'
          ? 'Lọc & Điện Môi'
          : newPartCategory === 'POWER_FEED_CONTACTS'
          ? 'Tiếp Điện Phóng Điểm'
          : newPartCategory === 'WIRE_DRIVE'
          ? 'Hệ Dẫn Dây Cắt'
          : newPartCategory === 'DIELECTRIC_FLUID'
          ? 'Xử Lý Nước & Deion'
          : newPartCategory === 'MECHANICAL_AXIS'
          ? 'Cơ Khí Trục & Ray'
          : newPartCategory === 'PNEUMATIC_VALVES'
          ? 'Bơm & Thủy Lực'
          : newPartCategory === 'ELECTRONICS'
          ? 'Điện Tử & Bo Mạch'
          : 'Bôi Trơn & Vật Tư',
      compatibleModels: ['Sodick AG60L', 'Fanuc Robocut C600iB'],
      currentStock: Number(newPartStock),
      minSafetyStock: Number(newPartMinStock),
      unit: newPartUnit || 'Cái',
      unitPriceUSD: Number(newPartPrice) || 50,
      binLocation: newPartLocation || 'Kệ A1 (Kho Cơ Điện)',
      leadTimeDays: Number(newPartLeadDays) || 3,
      supplier: newPartSupplier || 'OEM Industrial Supply',
      lastRestockDate: new Date().toISOString().substring(0, 10),
      status: Number(newPartStock) === 0 ? 'OUT_OF_STOCK' : Number(newPartStock) <= Number(newPartMinStock) ? 'LOW_STOCK' : 'IN_STOCK',
      criticality: 'HIGH',
      description: `Linh kiện ${newPartName} bổ sung vào danh mục phụ tùng thiết bị xưởng.`,
    };

    const currentParts = getStoredSpareParts();
    saveStoredSpareParts([newPart, ...currentParts]);
    refreshData();
    setShowAddPartModal(false);
    onToast(`✓ Đã thêm mã phụ tùng mới "${newPart.partNumber} - ${newPart.name}"`);
    // Reset form
    setNewPartName('');
    setNewPartNumber('');
  };

  // CSV Export
  const handleExportCsv = () => {
    const headers = ['Mã SKU', 'Tên Linh Kiện', 'Nhóm', 'Tồn Kho', 'Ngưỡng An Toàn', 'Đơn Vị', 'Vị Trí Kệ', 'Đơn Giá (USD)', 'Trạng Thái', 'Nhà Cung Cấp'];
    const rows = parts.map((p) => [
      `"${p.partNumber}"`,
      `"${p.name}"`,
      `"${p.categoryLabel}"`,
      p.currentStock,
      p.minSafetyStock,
      `"${p.unit}"`,
      `"${p.binLocation}"`,
      p.unitPriceUSD,
      `"${p.status === 'OUT_OF_STOCK' ? 'HẾT HÀNG' : p.status === 'LOW_STOCK' ? 'TỒN THẤP' : 'SẴN HÀNG'}"`,
      `"${p.supplier}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_Kho_Phu_Tung_EDM_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('✓ Đã xuất danh mục tồn kho phụ tùng ra file CSV');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Module Title & Top Action Buttons */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20 shrink-0">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Quản Lý Kho Phụ Tùng & Vật Tư EDM
                </h2>
                <span className="rounded bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-300 flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Mô-đun Vật Tư & Cảnh Báo Thiếu Hụt
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Theo dõi tồn kho thời gian thực, cảnh báo thiếu hụt linh kiện trực tiếp cho AI Diagnosis, quản lý phiếu xuất kho và tạo đơn đặt hàng khẩn cấp
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-200 transition cursor-pointer"
              title="Xuất danh mục tồn kho ra CSV"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              <span>Xuất CSV</span>
            </button>

            <button
              onClick={() => setShowAddPartModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Mã Phụ Tùng</span>
            </button>
          </div>
        </div>

        {/* 2. Top Inventory Health KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {/* KPI 1: Shortage Alerts (Crucial requirement!) */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'SHORTAGE_ONLY' ? 'ALL' : 'SHORTAGE_ONLY')}
            className={`rounded-2xl p-4 border transition cursor-pointer ${
              metrics.shortageCount > 0
                ? 'bg-gradient-to-br from-red-950/40 via-slate-900 to-slate-950 border-red-500/50 ring-1 ring-red-500/30 shadow-lg shadow-red-950/20'
                : 'bg-slate-900/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-red-300">Cảnh Báo Thiếu Hụt</span>
              <AlertOctagon className="h-4 w-4 text-red-400 animate-pulse" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-black text-red-400">
                {metrics.shortageCount}
              </span>
              <span className="text-xs font-mono text-slate-400">mã vật tư</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-red-300/90 font-mono">
              <span className="font-bold text-red-400">{metrics.outOfStock} hết hàng</span>
              <span>•</span>
              <span className="font-bold text-amber-400">{metrics.lowStock} dưới ngưỡng</span>
            </div>
          </div>

          {/* KPI 2: Total Items */}
          <div className="rounded-2xl p-4 border border-slate-800 bg-slate-900/80">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Tổng Mã Phụ Tùng</span>
              <Package className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-black text-white">
                {metrics.totalCount}
              </span>
              <span className="text-xs font-mono text-slate-400">mặt hàng</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {metrics.inStockCount} mã đang sẵn hàng trong kho ({metrics.fulfillmentRate}%)
            </p>
          </div>

          {/* KPI 3: Estimated Inventory Asset Value */}
          <div className="rounded-2xl p-4 border border-slate-800 bg-slate-900/80">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Tổng Giá Trị Tồn Kho</span>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400">
                ${metrics.totalInventoryValueUSD.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-slate-400">USD</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Định giá theo đơn giá nhập kho gần nhất
            </p>
          </div>

          {/* KPI 4: Pending Purchase Orders */}
          <div
            onClick={() => setActiveSubTab('PURCHASE_ORDERS')}
            className="rounded-2xl p-4 border border-slate-800 bg-slate-900/80 transition hover:border-slate-700 cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Đơn Đặt Hàng Chờ Về</span>
              <Truck className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-black text-indigo-300">
                {metrics.pendingPoCount}
              </span>
              <span className="text-xs font-mono text-slate-400">phiếu PO</span>
            </div>
            <p className="text-[11px] text-indigo-300/80 mt-1 flex items-center gap-1">
              <span>Bấm xem tiến độ giao hàng</span>
            </p>
          </div>
        </div>

        {/* 3. Sub-tabs Selector */}
        <div className="mt-6 flex items-center gap-2 border-b border-slate-800 pb-1">
          <button
            onClick={() => setActiveSubTab('INVENTORY')}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              activeSubTab === 'INVENTORY'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Danh Mục Tồn Kho ({parts.length})</span>
            {metrics.shortageCount > 0 && (
              <span className="rounded-full bg-red-500/20 border border-red-500/40 px-1.5 py-0.2 text-[10px] font-mono text-red-300 font-bold">
                {metrics.shortageCount} thiếu
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('PURCHASE_ORDERS')}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              activeSubTab === 'PURCHASE_ORDERS'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="h-4 w-4" />
            <span>Đơn Đặt Hàng & PO Khẩn ({purchaseOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('TRANSACTIONS')}
            className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition cursor-pointer ${
              activeSubTab === 'TRANSACTIONS'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Lịch Sử Xuất / Nhập Kho ({transactions.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: INVENTORY LIST & SEARCH/FILTER */}
      {/* ========================================================================= */}
      {activeSubTab === 'INVENTORY' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên linh kiện, mã SKU (FLT-EDM-300, MK-U6...), vị trí kệ, model máy..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Machine Compatibility Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 whitespace-nowrap hidden sm:inline">Dòng máy:</span>
                <select
                  value={machineFilter}
                  onChange={(e) => setMachineFilter(e.target.value)}
                  className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer"
                >
                  <option value="ALL">Tất cả dòng máy</option>
                  <option value="Sodick">Sodick (AG60L / ALN)</option>
                  <option value="Fanuc">Fanuc Robocut</option>
                  <option value="Makino">Makino U6</option>
                  <option value="Mitsubishi">Mitsubishi MV</option>
                  <option value="Agie">Agie Charmilles</option>
                  <option value="Castek">Castek Bắn Lỗ</option>
                  <option value="DMG">DMG Mori CNC</option>
                </select>
              </div>
            </div>

            {/* Quick Status Filters */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400 font-medium">Trạng thái:</span>

              <button
                onClick={() => setStatusFilter('ALL')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả ({parts.length})
              </button>

              <button
                onClick={() => setStatusFilter('SHORTAGE_ONLY')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'SHORTAGE_ONLY'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/50 font-bold'
                    : 'text-slate-400 hover:text-red-300'
                }`}
              >
                <AlertOctagon className="h-3 w-3 text-red-400" />
                <span>Cần bổ sung ({metrics.shortageCount})</span>
              </button>

              <button
                onClick={() => setStatusFilter('OUT_OF_STOCK')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'OUT_OF_STOCK'
                    ? 'bg-red-500 text-white font-bold'
                    : 'text-slate-400 hover:text-red-300'
                }`}
              >
                <span>Hết hàng ({metrics.outOfStock})</span>
              </button>

              <button
                onClick={() => setStatusFilter('LOW_STOCK')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'LOW_STOCK'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                    : 'text-slate-400 hover:text-amber-300'
                }`}
              >
                <span>Dưới ngưỡng an toàn ({metrics.lowStock})</span>
              </button>

              <button
                onClick={() => setStatusFilter('IN_STOCK')}
                className={`rounded-lg px-2.5 py-1 font-semibold transition cursor-pointer flex items-center gap-1 ${
                  statusFilter === 'IN_STOCK'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold'
                    : 'text-slate-400 hover:text-emerald-300'
                }`}
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>Sẵn hàng ({metrics.inStockCount})</span>
              </button>
            </div>
          </div>

          {/* Critical Shortage Warning Banner */}
          {metrics.outOfStock > 0 && statusFilter !== 'IN_STOCK' && (
            <div className="rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/40 via-slate-900/80 to-red-950/20 p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/20 text-red-400 shrink-0 mt-0.5">
                  <AlertOctagon className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-bold text-red-300 text-sm">
                    CẢNH BÁO TỒN KHO: Có {metrics.outOfStock} linh kiện quan trọng đang HẾT HÀNG (OUT OF STOCK)!
                  </h4>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">
                    Các linh kiện này bao gồm: {parts.filter((p) => p.status === 'OUT_OF_STOCK').map((p) => p.name.split('(')[0].trim()).join(', ')}.
                    Nếu máy phát sinh sự cố cần thay thế, thời gian dừng máy (MTTR) sẽ bị kéo dài.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStatusFilter('OUT_OF_STOCK')}
                className="shrink-0 rounded-xl bg-red-500 hover:bg-red-400 text-slate-950 font-bold px-3 py-1.5 transition shadow cursor-pointer self-start sm:self-center"
              >
                Xem Các Mã Hết Hàng
              </button>
            </div>
          )}

          {/* Parts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParts.map((part) => {
              const isOut = part.status === 'OUT_OF_STOCK';
              const isLow = part.status === 'LOW_STOCK';
              const isIn = part.status === 'IN_STOCK';

              return (
                <div
                  key={part.id}
                  className={`rounded-2xl border p-4.5 transition-all duration-200 flex flex-col justify-between ${
                    isOut
                      ? 'border-red-500/60 bg-gradient-to-br from-red-950/25 via-slate-900 to-slate-950 shadow-lg shadow-red-950/20 ring-1 ring-red-500/20'
                      : isLow
                      ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/15 via-slate-900 to-slate-950 shadow-md'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  }`}
                >
                  {/* Top section: SKU, Category & Status Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-md">
                          {part.partNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-medium">
                          {part.categoryLabel}
                        </span>
                      </div>

                      {/* Stock Status Badge */}
                      <div className="shrink-0">
                        {isOut ? (
                          <span className="rounded-full bg-red-500/20 border border-red-500/50 px-2.5 py-0.5 text-[10px] font-mono font-black text-red-300 animate-pulse flex items-center gap-1">
                            <AlertOctagon className="h-3 w-3" />
                            HẾT HÀNG (0 {part.unit})
                          </span>
                        ) : isLow ? (
                          <span className="rounded-full bg-amber-500/20 border border-amber-500/50 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            TỒN THẤP ({part.currentStock}/{part.minSafetyStock})
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            SẴN HÀNG ({part.currentStock} {part.unit})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Part Name */}
                    <h3 className="text-white font-bold text-sm sm:text-base mt-2 leading-snug line-clamp-2">
                      {part.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {part.description}
                    </p>

                    {/* Stock Bar Indicator */}
                    <div className="mt-3.5 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <span>Tồn kho / Ngưỡng an toàn:</span>
                        </span>
                        <span
                          className={`font-mono text-xs font-black ${
                            isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {part.currentStock} / {part.minSafetyStock} {part.unit}
                        </span>
                      </div>

                      {/* Visual Stock Level Bar */}
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOut
                              ? 'bg-red-500 w-0'
                              : isLow
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(8, Math.round((part.currentStock / Math.max(1, part.minSafetyStock * 2)) * 100))
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Shelf Location & Specifications */}
                    <div className="mt-3 rounded-xl bg-slate-900/60 border border-slate-800/80 p-2.5 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                          <span>Vị trí kho:</span>
                        </span>
                        <span className="font-mono font-bold text-slate-200 truncate">
                          {part.binLocation}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-amber-400 shrink-0" />
                          <span>Thời gian đặt hàng (Lead time):</span>
                        </span>
                        <span className="font-mono text-slate-300">
                          {part.leadTimeDays} ngày làm việc
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Đơn giá tham khảo:</span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          ${part.unitPriceUSD} / {part.unit}
                        </span>
                      </div>
                    </div>

                    {/* Compatible Models Tags */}
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {part.compatibleModels.map((m, mIdx) => (
                        <span
                          key={mIdx}
                          className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400 font-mono"
                        >
                          ⚙️ {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action Buttons: Xuất kho / Nhập kho / Đặt hàng khẩn */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-1.5 text-xs">
                    {/* Button 1: Xuất Kho (Issue) */}
                    <button
                      disabled={isOut}
                      onClick={() => {
                        setIssueModalPart(part);
                        setIssueQty(1);
                      }}
                      className={`flex-1 rounded-xl py-1.5 px-2 font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        isOut
                          ? 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                      title={isOut ? 'Kho đã hết hàng, không thể xuất' : 'Xuất kho cho máy sửa chữa'}
                    >
                      <ArrowDownRight className="h-3.5 w-3.5 text-amber-400" />
                      <span>Xuất Kho</span>
                    </button>

                    {/* Button 2: Nhập Kho (Restock) */}
                    <button
                      onClick={() => {
                        setRestockModalPart(part);
                        setRestockQty(part.minSafetyStock * 2 || 2);
                      }}
                      className="flex-1 rounded-xl py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Nhập thêm hàng bổ sung vào kho"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Nhập Kho</span>
                    </button>

                    {/* Button 3: Đặt Hàng Khẩn Cấp (Quick PO) */}
                    <button
                      onClick={() => {
                        setPoModalPart(part);
                        setPoQty(part.minSafetyStock * 2 || 4);
                        setPoUrgency(isOut ? 'EMERGENCY_DOWNTIME' : 'RESTOCK_WARNING');
                      }}
                      className={`rounded-xl py-1.5 px-2.5 font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                        isOut
                          ? 'bg-red-500 hover:bg-red-400 text-slate-950 shadow-md shadow-red-500/20'
                          : 'bg-indigo-600/80 hover:bg-indigo-500 text-white border border-indigo-500/40'
                      }`}
                      title="Tạo đơn đặt hàng khẩn cấp từ nhà cung cấp"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>Đặt Hàng</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredParts.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
              <Package className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <h4 className="font-bold text-white text-base">Không tìm thấy linh kiện phù hợp</h4>
              <p className="text-xs text-slate-500 mt-1">
                Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setCategoryFilter('ALL');
                  setMachineFilter('ALL');
                }}
                className="mt-3 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-cyan-300 border border-slate-700"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: PURCHASE ORDERS & REQUISITIONS */}
      {/* ========================================================================= */}
      {activeSubTab === 'PURCHASE_ORDERS' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-400" />
                <span>Danh Sách Đơn Đặt Hàng & Phiếu Cấp Phát Khẩn Cấp (Purchase Orders)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Theo dõi các phiếu đặt mua linh kiện từ nhà cung cấp để bù đắp các mục thiếu hụt
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-800/80">
            {purchaseOrders.map((po) => (
              <div key={po.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded">
                      #{po.id}
                    </span>
                    <span className="font-mono text-xs text-cyan-300 font-bold bg-slate-800 px-2 py-0.5 rounded">
                      {po.partNumber}
                    </span>
                    <span className="font-bold text-white text-sm">
                      {po.partName}
                    </span>
                    {po.urgency === 'EMERGENCY_DOWNTIME' && (
                      <span className="rounded bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 text-[10px] font-mono font-bold animate-pulse">
                        🚨 ĐẶT GẤP DỪNG MÁY
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400">
                    Số lượng đặt: <strong className="text-white font-mono">{po.quantityRequested}</strong> • Nhà cung cấp:{' '}
                    <span className="text-slate-300 font-medium">{po.supplier}</span>
                  </p>
                  {po.notes && (
                    <p className="text-[11px] text-slate-400 italic">
                      Ghi chú: {po.notes}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500 font-mono">
                    Người tạo: {po.requestedBy} • Thời gian: {po.requestedAt} {po.targetDeviceCode && `• Máy đích: ${po.targetDeviceCode}`}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Dự kiến giao hàng:</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      📅 {po.estimatedArrivalDate}
                    </span>
                  </div>

                  <span
                    className={`rounded-xl px-3 py-1 text-xs font-bold font-mono ${
                      po.status === 'ORDERED'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        : po.status === 'PENDING_APPROVAL'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {po.status === 'ORDERED'
                      ? 'ĐÃ ĐẶT HÀNG'
                      : po.status === 'PENDING_APPROVAL'
                      ? 'CHỜ DUYỆT'
                      : 'ĐÃ NHẬN HÀNG'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: STOCK TRANSACTIONS HISTORY */}
      {/* ========================================================================= */}
      {activeSubTab === 'TRANSACTIONS' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-400" />
                <span>Nhật Ký Biến Động Kho (Stock Transactions Log)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Lịch sử minh bạch ghi nhận từng lần xuất vật tư sửa máy và nhập hàng bổ sung
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-800/80">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 mt-0.5 ${
                      tx.type === 'ISSUE'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {tx.type === 'ISSUE' ? (
                      <ArrowDownRight className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                          tx.type === 'ISSUE'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {tx.type === 'ISSUE' ? 'XUẤT KHO' : 'NHẬP KHO'}
                      </span>
                      <span className="font-mono text-xs font-bold text-cyan-300">
                        {tx.partNumber}
                      </span>
                      <span className="font-bold text-white text-xs sm:text-sm">
                        {tx.partName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-0.5">
                      Lý do: {tx.reason}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-1">
                      <span>👤 {tx.technicianName}</span>
                      <span>🕒 {tx.timestamp}</span>
                      {tx.targetDeviceCode && <span>⚙️ Máy: {tx.targetDeviceCode}</span>}
                    </div>
                  </div>
                </div>

                <div className="text-right sm:self-center font-mono text-xs">
                  <div
                    className={`font-black text-sm ${
                      tx.type === 'ISSUE' ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {tx.type === 'ISSUE' ? `-${tx.quantity}` : `+${tx.quantity}`}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Tồn: {tx.previousStock} ➔ {tx.newStock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ISSUE PART (XUẤT KHO) */}
      {/* ========================================================================= */}
      {issueModalPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Phiếu Xuất Kho Linh Kiện</h3>
              </div>
              <button
                onClick={() => setIssueModalPart(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 text-xs space-y-1">
              <span className="font-mono text-cyan-300 font-bold block">{issueModalPart.partNumber}</span>
              <p className="font-bold text-white">{issueModalPart.name}</p>
              <p className="text-slate-400">
                Tồn kho hiện tại: <strong className="text-white font-mono">{issueModalPart.currentStock} {issueModalPart.unit}</strong> • Vị trí: {issueModalPart.binLocation}
              </p>
            </div>

            <form onSubmit={handleExecuteIssue} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Số lượng xuất ({issueModalPart.unit}):
                </label>
                <input
                  type="number"
                  min="1"
                  max={issueModalPart.currentStock}
                  value={issueQty}
                  onChange={(e) => setIssueQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Mã thiết bị nhận linh kiện:
                </label>
                <select
                  value={issueDeviceCode}
                  onChange={(e) => setIssueDeviceCode(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                >
                  <option value="">-- Chọn máy cần thay thế --</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.code}>
                      {d.code} - {d.name} ({d.status})
                    </option>
                  ))}
                  <option value="KHAC">Thiết bị xưởng khác</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Lý do xuất kho & Mã sự cố:
                </label>
                <input
                  type="text"
                  value={issueReason}
                  onChange={(e) => setIssueReason(e.target.value)}
                  placeholder="Ví dụ: Thay thế bạc tiếp điện do mòn sâu theo gợi ý AI Diagnosis..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Kỹ thuật viên nhận:
                </label>
                <input
                  type="text"
                  value={issueTechName}
                  onChange={(e) => setIssueTechName(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIssueModalPart(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 font-bold hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 transition shadow-lg shadow-amber-500/20"
                >
                  Xác Nhận Xuất Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESTOCK (NHẬP KHO) */}
      {/* ========================================================================= */}
      {restockModalPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Phiếu Nhập Bổ Sung Kho</h3>
              </div>
              <button
                onClick={() => setRestockModalPart(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 text-xs space-y-1">
              <span className="font-mono text-cyan-300 font-bold block">{restockModalPart.partNumber}</span>
              <p className="font-bold text-white">{restockModalPart.name}</p>
              <p className="text-slate-400">
                Tồn kho hiện tại: <strong className="text-white font-mono">{restockModalPart.currentStock} {restockModalPart.unit}</strong>
              </p>
            </div>

            <form onSubmit={handleExecuteRestock} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Số lượng nhập thêm ({restockModalPart.unit}):
                </label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Ghi chú lô hàng nhập / Số hóa đơn:
                </label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="Ví dụ: Nhập theo hợp đồng bảo trì quý 4 từ Sodick..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRestockModalPart(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 font-bold hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 transition shadow-lg shadow-emerald-500/20"
                >
                  Xác Nhận Nhập Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EMERGENCY PURCHASE ORDER (ĐẶT HÀNG KHẨN) */}
      {/* ========================================================================= */}
      {poModalPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Tạo Đơn Đặt Hàng Phụ Tùng (PO)</h3>
              </div>
              <button
                onClick={() => setPoModalPart(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 text-xs space-y-1">
              <span className="font-mono text-cyan-300 font-bold block">{poModalPart.partNumber}</span>
              <p className="font-bold text-white">{poModalPart.name}</p>
              <p className="text-slate-400">
                Nhà cung cấp: <strong className="text-white">{poModalPart.supplier}</strong> • Lead time dự kiến: {poModalPart.leadTimeDays} ngày
              </p>
            </div>

            <form onSubmit={handleExecuteCreatePo} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Mức độ khẩn cấp:
                </label>
                <select
                  value={poUrgency}
                  onChange={(e) => setPoUrgency(e.target.value as any)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
                >
                  <option value="EMERGENCY_DOWNTIME">🚨 Khẩn cấp: Máy đang dừng cần vật tư gấp</option>
                  <option value="RESTOCK_WARNING">⚠️ Cảnh báo: Tồn kho dưới ngưỡng an toàn</option>
                  <option value="SCHEDULED_PM">📅 Định kỳ: Dự phòng cho kế hoạch bảo dưỡng 500h</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Số lượng đặt mua ({poModalPart.unit}):
                </label>
                <input
                  type="number"
                  min="1"
                  value={poQty}
                  onChange={(e) => setPoQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Ghi chú yêu cầu thu mua:
                </label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="Yêu cầu giao hàng hỏa tốc trong 24h, liên hệ bộ phận kỹ thuật xưởng khi hàng tới..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPoModalPart(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 font-bold hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 transition shadow-lg shadow-indigo-600/30"
                >
                  Tạo Đơn Hàng PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD NEW SPARE PART */}
      {/* ========================================================================= */}
      {showAddPartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="rounded-3xl border border-slate-700 bg-slate-900 p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Thêm Mã Phụ Tùng Mới</h3>
              </div>
              <button
                onClick={() => setShowAddPartModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewPart} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Mã SKU / Part Number (*):
                  </label>
                  <input
                    type="text"
                    value={newPartNumber}
                    onChange={(e) => setNewPartNumber(e.target.value)}
                    placeholder="VD: FLT-SNK-200"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Nhóm phân loại:
                  </label>
                  <select
                    value={newPartCategory}
                    onChange={(e) => setNewPartCategory(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer"
                  >
                    <option value="FILTRATION">Lọc & Điện Môi</option>
                    <option value="POWER_FEED_CONTACTS">Tiếp Điện Phóng Điểm</option>
                    <option value="WIRE_DRIVE">Hệ Dẫn Dây Cắt</option>
                    <option value="DIELECTRIC_FLUID">Xử Lý Nước & Deion</option>
                    <option value="MECHANICAL_AXIS">Cơ Khí Trục & Ray</option>
                    <option value="PNEUMATIC_VALVES">Bơm & Thủy Lực</option>
                    <option value="ELECTRONICS">Điện Tử & Bo Mạch</option>
                    <option value="CONSUMABLES">Bôi Trơn & Vật Tư</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Tên linh kiện phụ tùng (*):
                </label>
                <input
                  type="text"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder="VD: Lõi lọc dầu EDM xung 5µm"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Tồn ban đầu:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newPartStock}
                    onChange={(e) => setNewPartStock(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Ngưỡng an toàn:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newPartMinStock}
                    onChange={(e) => setNewPartMinStock(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Đơn vị:
                  </label>
                  <input
                    type="text"
                    value={newPartUnit}
                    onChange={(e) => setNewPartUnit(e.target.value)}
                    placeholder="Quả / Bộ / Cái"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Vị trí kệ kho:
                  </label>
                  <input
                    type="text"
                    value={newPartLocation}
                    onChange={(e) => setNewPartLocation(e.target.value)}
                    placeholder="VD: Kệ A2-05 (Kho Điện)"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Đơn giá ước tính ($):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newPartPrice}
                    onChange={(e) => setNewPartPrice(parseFloat(e.target.value) || 1)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Nhà cung cấp:
                  </label>
                  <input
                    type="text"
                    value={newPartSupplier}
                    onChange={(e) => setNewPartSupplier(e.target.value)}
                    placeholder="VD: Sodick OEM Spares"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Thời gian giao hàng (ngày):
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newPartLeadDays}
                    onChange={(e) => setNewPartLeadDays(parseInt(e.target.value) || 3)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddPartModal(false)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 font-bold hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 transition shadow-lg shadow-cyan-500/20"
                >
                  Lưu Linh Kiện Vào Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
