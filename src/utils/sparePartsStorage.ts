import { SparePart, StockTransaction, PurchaseOrderRequest } from '../types';

export const INITIAL_SPARE_PARTS: SparePart[] = [
  {
    id: 'part-01',
    partNumber: 'FLT-EDM-300',
    name: 'Lõi lọc áp lực 3µm máy cắt dây EDM (Sodick / Makino / Fanuc)',
    category: 'FILTRATION',
    categoryLabel: 'Lọc & Điện Môi',
    compatibleModels: ['Sodick AG60L', 'Sodick ALN400G', 'Fanuc Robocut C600iB', 'Makino U6 H.E.A.T.'],
    currentStock: 0, // OUT OF STOCK to trigger critical shortage alert!
    minSafetyStock: 2,
    unit: 'Quả',
    unitPriceUSD: 85,
    binLocation: 'Kệ A2-03 (Kho Cơ Điện Lầu 1)',
    leadTimeDays: 4,
    supplier: 'Sodick OEM Filtration Solutions Co.',
    lastRestockDate: '2026-09-12',
    status: 'OUT_OF_STOCK',
    criticality: 'CRITICAL',
    description: 'Lõi lọc áp lực cao sợi tổng hợp 3-micron lọc mùn phoi EDM trong dung môi nước deion.',
    specifications: 'Áp suất làm việc max 35 Bar, đường kính 340mm x cao 300mm, ren kết nối tiêu chuẩn',
  },
  {
    id: 'part-02',
    partNumber: 'MK-U6-GD25',
    name: 'Bạc cấp điện Carbide trên/dưới (Carbide Power Feed Contacts)',
    category: 'POWER_FEED_CONTACTS',
    categoryLabel: 'Tiếp Điện Phóng Điểm',
    compatibleModels: ['Makino U6 H.E.A.T.', 'Sodick AG60L', 'Fanuc Robocut C600iB'],
    currentStock: 1, // LOW STOCK (1 / 3) to trigger low stock warning!
    minSafetyStock: 3,
    unit: 'Cặp',
    unitPriceUSD: 140,
    binLocation: 'Tủ B1-04 (Ngăn Linh Kiện Quý)',
    leadTimeDays: 3,
    supplier: 'Makino Precision Spares Asia',
    lastRestockDate: '2026-09-28',
    status: 'LOW_STOCK',
    criticality: 'CRITICAL',
    description: 'Bạc cấp dòng xung phóng điện bằng hợp kim Vonfram-Cacbua siêu cứng dẫn dòng xung cao tần.',
    specifications: 'Độ dày 3.5mm, 4 cạnh xoay đổi vị trí tiếp xúc, chịu nhiệt độ tức thời >2500°C',
  },
  {
    id: 'part-03',
    partNumber: 'FANUC-BLD-A98',
    name: 'Lưỡi dao hàn & cắt nhiệt dây Fanuc AWF A98L',
    category: 'WIRE_DRIVE',
    categoryLabel: 'Hệ Dẫn Dây Cắt',
    compatibleModels: ['Fanuc Robocut C600iB', 'Fanuc Robocut α-C400iB'],
    currentStock: 0, // OUT OF STOCK
    minSafetyStock: 2,
    unit: 'Chiếc',
    unitPriceUSD: 210,
    binLocation: 'Tủ B2-08 (Phụ Tùng Fanuc Robot)',
    leadTimeDays: 7,
    supplier: 'Fanuc Vietnam Automation Corp',
    lastRestockDate: '2026-08-15',
    status: 'OUT_OF_STOCK',
    criticality: 'HIGH',
    description: 'Cụm dao cắt nhiệt và vuốt nhọn đầu dây tự động AWF (Auto Wire Feed) cho máy Fanuc.',
    specifications: 'Điện trở sấy nung 24V-80W, lưỡi cắt hợp kim titan chống bám dính',
  },
  {
    id: 'part-04',
    partNumber: 'PURO-MB400',
    name: 'Hạt nhựa trao đổi ion hỗn hợp Purolite MB400',
    category: 'DIELECTRIC_FLUID',
    categoryLabel: 'Xử Lý Nước & Deion',
    compatibleModels: ['Sodick AG60L', 'Sodick ALN400G', 'Fanuc Robocut C600iB', 'Mitsubishi MV2400S', 'Makino U6 H.E.A.T.', 'Castek ZNC'],
    currentStock: 5,
    minSafetyStock: 2,
    unit: 'Bình 25L',
    unitPriceUSD: 120,
    binLocation: 'Khu Kho Hóa Chất C3 (Khu vực thông gió)',
    leadTimeDays: 2,
    supplier: 'Purolite Water Technologies VN',
    lastRestockDate: '2026-10-02',
    status: 'IN_STOCK',
    criticality: 'HIGH',
    description: 'Nhựa khử ion deionite hỗn hợp cation/anion duy trì độ dẫn điện dung môi nước < 15 µS/cm.',
    specifications: 'Dung tích 25 lít/thùng, hạt nguyên sinh cấp công nghiệp EDM bán dẫn',
  },
  {
    id: 'part-05',
    partNumber: 'A290-8110-X382',
    name: 'Khối tiếp điện cacbua Fanuc Robocut chính hãng OEM',
    category: 'POWER_FEED_CONTACTS',
    categoryLabel: 'Tiếp Điện Phóng Điểm',
    compatibleModels: ['Fanuc Robocut C600iB'],
    currentStock: 4,
    minSafetyStock: 2,
    unit: 'Bộ (2 chiếc)',
    unitPriceUSD: 165,
    binLocation: 'Tủ B2-02 (Ngăn Fanuc EDM)',
    leadTimeDays: 3,
    supplier: 'Fanuc Industrial Spares Singapore',
    lastRestockDate: '2026-10-05',
    status: 'IN_STOCK',
    criticality: 'HIGH',
    description: 'Khối cấp điện cực trên và dưới gia công từ siêu hợp kim vonfram cacbua.',
    specifications: 'Mã OEM Fanuc A290-8110-X382, kích thước chuẩn 8x12x25mm',
  },
  {
    id: 'part-06',
    partNumber: 'MTR-03-PUMP',
    name: 'Bộ phớt cơ khí Grundfos MTR-03 & Gioăng đệm EPDM',
    category: 'PNEUMATIC_VALVES',
    categoryLabel: 'Bơm & Thủy Lực',
    compatibleModels: ['Sodick AG60L', 'Mitsubishi MV2400S', 'Agie Charmilles Form 20'],
    currentStock: 0, // OUT OF STOCK
    minSafetyStock: 1,
    unit: 'Bộ',
    unitPriceUSD: 240,
    binLocation: 'Kệ C1-05 (Cụm Bơm Thủy Lực)',
    leadTimeDays: 5,
    supplier: 'Grundfos Vietnam Industry',
    lastRestockDate: '2026-08-30',
    status: 'OUT_OF_STOCK',
    criticality: 'CRITICAL',
    description: 'Bộ phớt làm kín trục bơm cao áp dung môi điện môi chống rò rỉ nước vào động cơ bơm.',
    specifications: 'Trục cốt 16mm, vật liệu SiC/SiC/Viton, chịu áp 25 Bar',
  },
  {
    id: 'part-07',
    partNumber: 'KLUBER-NBU15',
    name: 'Mỡ bôi trơn cao tốc Kluber Isoflex NBU 15 (Tuýp 400g)',
    category: 'CONSUMABLES',
    categoryLabel: 'Bôi Trơn & Vật Tư',
    compatibleModels: ['DMG Mori NHX4000', 'Sodick AG60L', 'Makino U6 H.E.A.T.', 'Agie Charmilles Form 20'],
    currentStock: 6,
    minSafetyStock: 2,
    unit: 'Tuýp 400g',
    unitPriceUSD: 55,
    binLocation: 'Kệ B2-01 (Khu Mỡ Chuyên Dụng)',
    leadTimeDays: 2,
    supplier: 'Kluber Lubrication VN Co.',
    lastRestockDate: '2026-10-08',
    status: 'IN_STOCK',
    criticality: 'STANDARD',
    description: 'Mỡ tổng hợp gốc barium chuyên bôi trơn ray trượt bi dẫn hướng và ổ bi trục chính tốc độ cao.',
    specifications: 'Dải nhiệt -40°C đến +130°C, hệ số tốc độ dn = 1,000,000',
  },
  {
    id: 'part-08',
    partNumber: 'BELT-W-104',
    name: 'Dây curoa truyền động phanh căng dây cao su bọc vải',
    category: 'WIRE_DRIVE',
    categoryLabel: 'Hệ Dẫn Dây Cắt',
    compatibleModels: ['Sodick AG60L', 'Sodick ALN400G', 'Mitsubishi MV2400S'],
    currentStock: 1, // LOW STOCK
    minSafetyStock: 2,
    unit: 'Sợi',
    unitPriceUSD: 45,
    binLocation: 'Kệ A3-11 (Dây Đai & Curoa)',
    leadTimeDays: 3,
    supplier: 'Bando Industrial Belts Vietnam',
    lastRestockDate: '2026-09-18',
    status: 'LOW_STOCK',
    criticality: 'HIGH',
    description: 'Dây đai răng truyền động cho mô tơ căng phanh hãm cuộn dây đồng EDM.',
    specifications: 'Bước răng T5-450mm, chiều rộng 12mm, lõi sợi aramid chống giãn',
  },
  {
    id: 'part-09',
    partNumber: 'SLD-DMG-600',
    name: 'Bộ phớt gạt phoi ray trượt CNC / EDM trục X/Y/Z',
    category: 'MECHANICAL_AXIS',
    categoryLabel: 'Cơ Khí Trục & Ray',
    compatibleModels: ['DMG Mori NHX4000', 'Agie Charmilles Form 20'],
    currentStock: 1, // LOW STOCK
    minSafetyStock: 2,
    unit: 'Bộ (4 cái)',
    unitPriceUSD: 130,
    binLocation: 'Kệ A1-09 (Băng Máy Cơ Khí)',
    leadTimeDays: 5,
    supplier: 'THK Precision Motion Spares',
    lastRestockDate: '2026-09-22',
    status: 'LOW_STOCK',
    criticality: 'STANDARD',
    description: 'Phớt gạt phoi cao su polyurethane hai lớp bảo vệ rãnh bi dẫn hướng tuyến tính.',
    specifications: 'Tương thích ray trượt THK SNR/SNS kích thước 35 & 45',
  },
  {
    id: 'part-10',
    partNumber: 'BRS-ERW-50',
    name: 'Chổi quét tiếp mát than đồng Erowa 50mm',
    category: 'POWER_FEED_CONTACTS',
    categoryLabel: 'Tiếp Điện Phóng Điểm',
    compatibleModels: ['Agie Charmilles Form 20', 'Sodick AG60L', 'Castek ZNC'],
    currentStock: 5,
    minSafetyStock: 2,
    unit: 'Chiếc',
    unitPriceUSD: 65,
    binLocation: 'Tủ B1-06 (Ngăn Erowa)',
    leadTimeDays: 3,
    supplier: 'Erowa Precision Tooling Swiss',
    lastRestockDate: '2026-10-01',
    status: 'IN_STOCK',
    criticality: 'STANDARD',
    description: 'Chổi than đồng nối đất thoát tĩnh điện bảo vệ đầu mâm cặp Erowa ITS.',
    specifications: 'Hợp kim đồng 80% - cacbon 20%, lò xo nén chống rung',
  },
  {
    id: 'part-11',
    partNumber: 'SL-CST-70',
    name: 'Gioăng xoay cao áp Viton Castek Rotary Seal 60 Bar',
    category: 'PNEUMATIC_VALVES',
    categoryLabel: 'Bơm & Thủy Lực',
    compatibleModels: ['Castek ZNC', 'Hole Popper EDM'],
    currentStock: 3,
    minSafetyStock: 2,
    unit: 'Bộ',
    unitPriceUSD: 110,
    binLocation: 'Kệ C2-04 (Linh Kiện Bắn Lỗ)',
    leadTimeDays: 4,
    supplier: 'Castek EDM Machine Technologies',
    lastRestockDate: '2026-09-25',
    status: 'IN_STOCK',
    criticality: 'HIGH',
    description: 'Cụm phớt quay trục chính dẫn nước xả áp suất cao qua ruột que điện cực đồng.',
    specifications: 'Chịu áp max 70 Bar, vòng bi gốm quay 3000 rpm, vật liệu Viton',
  },
  {
    id: 'part-12',
    partNumber: 'CER-GD-10',
    name: 'Đầu dẫn hướng gốm Ceramic Guide 1.0mm cho que bắn lỗ',
    category: 'MECHANICAL_AXIS',
    categoryLabel: 'Cơ Khí Trục & Ray',
    compatibleModels: ['Castek ZNC'],
    currentStock: 6,
    minSafetyStock: 2,
    unit: 'Chiếc',
    unitPriceUSD: 40,
    binLocation: 'Hộp Linh Kiện P-12',
    leadTimeDays: 3,
    supplier: 'Castek EDM Machine Technologies',
    lastRestockDate: '2026-10-04',
    status: 'IN_STOCK',
    criticality: 'STANDARD',
    description: 'Đầu dẫn hướng gốm Ruby/Ceramic giữ thẳng que điện cực đồng đỏ khi khoan mồi.',
    specifications: 'Đường kính lỗ định tâm Ø1.0mm dung sai ±0.002mm',
  },
  {
    id: 'part-13',
    partNumber: 'IGBT-MOD-300',
    name: 'Khối Modul công suất IGBT nguồn phát xung EDM 300A',
    category: 'ELECTRONICS',
    categoryLabel: 'Điện Tử & Bo Mạch',
    compatibleModels: ['Sodick AG60L', 'Mitsubishi MV2400S', 'Fanuc Robocut C600iB'],
    currentStock: 1, // LOW STOCK
    minSafetyStock: 2,
    unit: 'Modul',
    unitPriceUSD: 380,
    binLocation: 'Tủ Bo Mạch E-03 (Chống Tĩnh Điện ESD)',
    leadTimeDays: 8,
    supplier: 'Mitsubishi Electric Semiconductors',
    lastRestockDate: '2026-08-10',
    status: 'LOW_STOCK',
    criticality: 'CRITICAL',
    description: 'Khối bán dẫn IGBT công suất phát xung tần số cao tạo tia lửa điện khe hở EDM.',
    specifications: 'Điện áp 1200V, dòng đỉnh 300A, thời gian đóng ngắt < 80ns',
  },
  {
    id: 'part-14',
    partNumber: 'TH-CUT-WIRE',
    name: 'Cuộn dây cắt EDM đồng thau 0.25mm P-5 (5kg)',
    category: 'CONSUMABLES',
    categoryLabel: 'Bôi Trơn & Vật Tư',
    compatibleModels: ['Sodick AG60L', 'Sodick ALN400G', 'Fanuc Robocut C600iB', 'Mitsubishi MV2400S', 'Makino U6 H.E.A.T.'],
    currentStock: 16,
    minSafetyStock: 5,
    unit: 'Cuộn (5kg)',
    unitPriceUSD: 48,
    binLocation: 'Kệ D1 (Kho Dây Đồng Cắt)',
    leadTimeDays: 1,
    supplier: 'Sumitomo Electric Wire Japan',
    lastRestockDate: '2026-10-10',
    status: 'IN_STOCK',
    criticality: 'HIGH',
    description: 'Dây cắt đồng thau tráng kẽm cao cấp độ thẳng cao dùng cho cơ chế xỏ dây tự động.',
    specifications: 'Đường kính Ø0.25mm, độ bền kéo 1000 N/mm², cuộn DIN 160 (5kg)',
  },
  {
    id: 'part-15',
    partNumber: 'Z-BEAR-AXIS',
    name: 'Bộ ổ bi đỡ trục vít me Z-axis chính xác cấp P4 (Z-Axis Ball Screw Bearings)',
    category: 'MECHANICAL_AXIS',
    categoryLabel: 'Cơ Khí Trục & Ray',
    compatibleModels: ['Sodick AG60L', 'Makino U6 H.E.A.T.', 'Agie Charmilles Form 20'],
    currentStock: 0, // OUT OF STOCK
    minSafetyStock: 1,
    unit: 'Bộ (2 vòng)',
    unitPriceUSD: 310,
    binLocation: 'Tủ B3-05 (Ổ Bi Chính Xác Cao)',
    leadTimeDays: 10,
    supplier: 'NSK Precision Bearings Japan',
    lastRestockDate: '2026-07-20',
    status: 'OUT_OF_STOCK',
    criticality: 'CRITICAL',
    description: 'Cặp ổ bi tiếp xúc góc chính xác cấp P4 chịu tải dọc trục vít me nâng hạ đầu Z.',
    specifications: 'Ký hiệu NSK 25TAC62B, góc tiếp xúc 60°, dự tải tiêu chuẩn nhẹ',
  },
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrderRequest[] = [
  {
    id: 'po-101',
    partId: 'part-01',
    partNumber: 'FLT-EDM-300',
    partName: 'Lõi lọc áp lực 3µm máy cắt dây EDM',
    quantityRequested: 6,
    urgency: 'EMERGENCY_DOWNTIME',
    requestedBy: 'Nguyễn Văn Hùng (Trưởng Kíp)',
    requestedAt: '2026-10-12 14:30',
    status: 'ORDERED',
    estimatedArrivalDate: '2026-10-16',
    supplier: 'Sodick OEM Filtration Solutions Co.',
    notes: 'Đặt gấp do kho đã hết sạch, máy EDM-01 và EDM-04 sắp đến hạn thay lọc!',
    targetDeviceCode: 'EDM-01',
  },
  {
    id: 'po-102',
    partId: 'part-03',
    partNumber: 'FANUC-BLD-A98',
    partName: 'Lưỡi dao hàn & cắt nhiệt dây Fanuc AWF A98L',
    quantityRequested: 3,
    urgency: 'RESTOCK_WARNING',
    requestedBy: 'Trần Minh Tuấn',
    requestedAt: '2026-10-11 09:15',
    status: 'PENDING_APPROVAL',
    estimatedArrivalDate: '2026-10-18',
    supplier: 'Fanuc Vietnam Automation Corp',
    notes: 'Dự phòng cho máy Fanuc Robocut C600iB trong ca đêm',
    targetDeviceCode: 'EDM-03',
  },
];

export const INITIAL_STOCK_TRANSACTIONS: StockTransaction[] = [
  {
    id: 'tx-001',
    partId: 'part-01',
    partNumber: 'FLT-EDM-300',
    partName: 'Lõi lọc áp lực 3µm máy cắt dây EDM',
    type: 'ISSUE',
    quantity: 1,
    previousStock: 1,
    newStock: 0,
    timestamp: '2026-10-12 10:20',
    technicianName: 'Nguyễn Văn Hùng',
    targetDeviceId: 'dev-01',
    targetDeviceCode: 'EDM-01',
    reason: 'Thay thế lõi lọc bị nghẹt gây báo động áp suất ALARM-204',
    workOrderOrIncidentId: 'INC-2026-102',
  },
  {
    id: 'tx-002',
    partId: 'part-04',
    partNumber: 'PURO-MB400',
    partName: 'Hạt nhựa trao đổi ion hỗn hợp Purolite MB400',
    type: 'ISSUE',
    quantity: 1,
    previousStock: 6,
    newStock: 5,
    timestamp: '2026-10-10 16:45',
    technicianName: 'Lê Hoàng Nam',
    targetDeviceId: 'dev-02',
    targetDeviceCode: 'EDM-02',
    reason: 'Độ dẫn điện nước deion vượt 18 uS/cm (DIE-201)',
  },
  {
    id: 'tx-003',
    partId: 'part-14',
    partNumber: 'TH-CUT-WIRE',
    partName: 'Cuộn dây cắt EDM đồng thau 0.25mm P-5',
    type: 'RECEIPT',
    quantity: 10,
    previousStock: 6,
    newStock: 16,
    timestamp: '2026-10-10 08:30',
    technicianName: 'Thủ kho Nguyễn Thị Mai',
    reason: 'Nhập lô hàng định kỳ từ Sumitomo Electric',
  },
];

const LOCAL_STORAGE_PARTS_KEY = 'smartguard_spare_parts_inventory_v1';
const LOCAL_STORAGE_PO_KEY = 'smartguard_spare_parts_pos_v1';
const LOCAL_STORAGE_TX_KEY = 'smartguard_spare_parts_tx_v1';

/**
 * Retrieve current spare parts list from localStorage (or fallback to INITIAL_SPARE_PARTS)
 */
export function getStoredSpareParts(): SparePart[] {
  if (typeof window === 'undefined') return INITIAL_SPARE_PARTS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PARTS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_PARTS_KEY, JSON.stringify(INITIAL_SPARE_PARTS));
      return INITIAL_SPARE_PARTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading spare parts:', err);
    return INITIAL_SPARE_PARTS;
  }
}

/**
 * Save spare parts to localStorage
 */
export function saveStoredSpareParts(parts: SparePart[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PARTS_KEY, JSON.stringify(parts));
  } catch (err) {
    console.error('Error saving spare parts:', err);
  }
}

/**
 * Retrieve Purchase Orders
 */
export function getStoredPurchaseOrders(): PurchaseOrderRequest[] {
  if (typeof window === 'undefined') return INITIAL_PURCHASE_ORDERS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PO_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_PO_KEY, JSON.stringify(INITIAL_PURCHASE_ORDERS));
      return INITIAL_PURCHASE_ORDERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_PURCHASE_ORDERS;
  }
}

/**
 * Save Purchase Orders
 */
export function saveStoredPurchaseOrders(pos: PurchaseOrderRequest[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_PO_KEY, JSON.stringify(pos));
  } catch (err) {
    console.error('Error saving POs:', err);
  }
}

/**
 * Retrieve Transactions
 */
export function getStoredStockTransactions(): StockTransaction[] {
  if (typeof window === 'undefined') return INITIAL_STOCK_TRANSACTIONS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TX_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(INITIAL_STOCK_TRANSACTIONS));
      return INITIAL_STOCK_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    return INITIAL_STOCK_TRANSACTIONS;
  }
}

/**
 * Save Transactions
 */
export function saveStoredStockTransactions(txs: StockTransaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_TX_KEY, JSON.stringify(txs));
  } catch (err) {
    console.error('Error saving transactions:', err);
  }
}

/**
 * Intelligent Matching: Takes an AI recommended part text string (e.g. "Lõi lọc áp lực 3µm (FLT-EDM-300)"
 * or "Khối tiếp điện cacbua Fanuc A290-8110-X382") and returns the matched SparePart with stock status.
 */
export function matchRecommendedPartToInventory(
  recommendedPartStr: string,
  inventory?: SparePart[]
): {
  part: SparePart | null;
  matchScore: number;
  matchType: 'EXACT_SKU' | 'KEYWORD_MATCH' | 'NONE';
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'UNKNOWN';
  stockCount: number;
  minSafe: number;
  unit: string;
  binLocation: string;
  leadTimeDays: number;
} {
  const parts = inventory || getStoredSpareParts();
  const lowerStr = recommendedPartStr.toLowerCase();

  // 1. Try exact SKU or code inside parentheses, e.g. (FLT-EDM-300)
  const skuMatch = recommendedPartStr.match(/\(([A-Z0-9\-_]{3,20})\)/i);
  if (skuMatch && skuMatch[1]) {
    const code = skuMatch[1].toUpperCase();
    const found = parts.find((p) => p.partNumber.toUpperCase().includes(code));
    if (found) {
      return {
        part: found,
        matchScore: 100,
        matchType: 'EXACT_SKU',
        stockStatus: found.status,
        stockCount: found.currentStock,
        minSafe: found.minSafetyStock,
        unit: found.unit,
        binLocation: found.binLocation,
        leadTimeDays: found.leadTimeDays,
      };
    }
  }

  // 2. Direct partNumber match anywhere in string
  for (const p of parts) {
    if (recommendedPartStr.toUpperCase().includes(p.partNumber.toUpperCase())) {
      return {
        part: p,
        matchScore: 95,
        matchType: 'EXACT_SKU',
        stockStatus: p.status,
        stockCount: p.currentStock,
        minSafe: p.minSafetyStock,
        unit: p.unit,
        binLocation: p.binLocation,
        leadTimeDays: p.leadTimeDays,
      };
    }
  }

  // 3. Keyword heuristic matching
  let bestMatch: SparePart | null = null;
  let highestScore = 0;

  for (const p of parts) {
    let score = 0;
    const pName = p.name.toLowerCase();

    // Specific domain keywords
    if (lowerStr.includes('lọc') && pName.includes('lọc')) score += 30;
    if (lowerStr.includes('carbide') && pName.includes('carbide')) score += 35;
    if (lowerStr.includes('tiếp điện') && pName.includes('tiếp điện')) score += 35;
    if (lowerStr.includes('deion') || lowerStr.includes('nhựa') || lowerStr.includes('purolite')) {
      if (pName.includes('nhựa') || pName.includes('deion')) score += 40;
    }
    if (lowerStr.includes('mỡ') || lowerStr.includes('kluber')) {
      if (pName.includes('mỡ') || pName.includes('kluber')) score += 40;
    }
    if (lowerStr.includes('phớt') && pName.includes('phớt')) score += 30;
    if (lowerStr.includes('curoa') && pName.includes('curoa')) score += 35;
    if (lowerStr.includes('dao') || lowerStr.includes('awf')) {
      if (pName.includes('dao') || pName.includes('awf')) score += 40;
    }
    if (lowerStr.includes('igbt') && pName.includes('igbt')) score += 45;
    if (lowerStr.includes('gốm') || lowerStr.includes('ceramic')) {
      if (pName.includes('gốm') || pName.includes('ceramic')) score += 35;
    }
    if (lowerStr.includes('dây cắt') && pName.includes('dây cắt')) score += 30;
    if (lowerStr.includes('ổ bi') || lowerStr.includes('trục z') || lowerStr.includes('vít me')) {
      if (pName.includes('ổ bi') || pName.includes('trục z')) score += 40;
    }

    if (score > highestScore && score >= 30) {
      highestScore = score;
      bestMatch = p;
    }
  }

  if (bestMatch) {
    return {
      part: bestMatch,
      matchScore: highestScore,
      matchType: 'KEYWORD_MATCH',
      stockStatus: bestMatch.status,
      stockCount: bestMatch.currentStock,
      minSafe: bestMatch.minSafetyStock,
      unit: bestMatch.unit,
      binLocation: bestMatch.binLocation,
      leadTimeDays: bestMatch.leadTimeDays,
    };
  }

  // Not found in catalog: assume safe estimate or unknown
  return {
    part: null,
    matchScore: 0,
    matchType: 'NONE',
    stockStatus: 'UNKNOWN',
    stockCount: 0,
    minSafe: 1,
    unit: 'Đơn vị',
    binLocation: 'Liên hệ thủ kho để tra vị trí kệ',
    leadTimeDays: 3,
  };
}

/**
 * Issue part from inventory (Xuất kho)
 */
export function issueSparePart(
  partId: string,
  quantity: number,
  technicianName: string,
  targetDeviceCode?: string,
  reason?: string
): { success: boolean; message: string; updatedPart?: SparePart } {
  const parts = getStoredSpareParts();
  const partIndex = parts.findIndex((p) => p.id === partId);
  if (partIndex === -1) {
    return { success: false, message: 'Không tìm thấy linh kiện trong kho' };
  }

  const part = parts[partIndex];
  if (part.currentStock < quantity) {
    return {
      success: false,
      message: `Tồn kho không đủ! Chỉ còn ${part.currentStock} ${part.unit} (yêu cầu xuất ${quantity} ${part.unit})`,
    };
  }

  const prevStock = part.currentStock;
  const newStock = prevStock - quantity;
  part.currentStock = newStock;
  part.status = newStock === 0 ? 'OUT_OF_STOCK' : newStock <= part.minSafetyStock ? 'LOW_STOCK' : 'IN_STOCK';

  parts[partIndex] = part;
  saveStoredSpareParts(parts);

  // Record transaction
  const txs = getStoredStockTransactions();
  const newTx: StockTransaction = {
    id: `tx-${Date.now()}`,
    partId: part.id,
    partNumber: part.partNumber,
    partName: part.name,
    type: 'ISSUE',
    quantity,
    previousStock: prevStock,
    newStock,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    technicianName: technicianName || 'Kỹ thuật viên ca trực',
    targetDeviceCode: targetDeviceCode || 'EDM-XƯỞNG',
    reason: reason || 'Xuất linh kiện phục vụ sửa chữa sự cố máy',
  };
  saveStoredStockTransactions([newTx, ...txs]);

  return {
    success: true,
    message: `Đã xuất ${quantity} ${part.unit} "${part.name}". Tồn kho mới: ${newStock} ${part.unit}.`,
    updatedPart: part,
  };
}

/**
 * Restock part to inventory (Nhập kho bổ sung)
 */
export function restockSparePart(
  partId: string,
  quantity: number,
  technicianName: string,
  notes?: string
): { success: boolean; message: string; updatedPart?: SparePart } {
  const parts = getStoredSpareParts();
  const partIndex = parts.findIndex((p) => p.id === partId);
  if (partIndex === -1) {
    return { success: false, message: 'Không tìm thấy linh kiện trong kho' };
  }

  const part = parts[partIndex];
  const prevStock = part.currentStock;
  const newStock = prevStock + quantity;
  part.currentStock = newStock;
  part.status = newStock === 0 ? 'OUT_OF_STOCK' : newStock <= part.minSafetyStock ? 'LOW_STOCK' : 'IN_STOCK';
  part.lastRestockDate = new Date().toISOString().substring(0, 10);

  parts[partIndex] = part;
  saveStoredSpareParts(parts);

  // Record transaction
  const txs = getStoredStockTransactions();
  const newTx: StockTransaction = {
    id: `tx-${Date.now()}`,
    partId: part.id,
    partNumber: part.partNumber,
    partName: part.name,
    type: 'RECEIPT',
    quantity,
    previousStock: prevStock,
    newStock,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    technicianName: technicianName || 'Thủ kho phụ tùng',
    reason: notes || 'Nhập kho bổ sung vật tư phụ tùng',
  };
  saveStoredStockTransactions([newTx, ...txs]);

  return {
    success: true,
    message: `Đã nhập thêm ${quantity} ${part.unit} "${part.name}". Tồn kho mới: ${newStock} ${part.unit}.`,
    updatedPart: part,
  };
}

/**
 * Create a Quick Emergency Purchase Order Request
 */
export function createQuickPurchaseOrder(
  partId: string,
  quantity: number,
  technicianName: string,
  deviceCode?: string,
  notes?: string
): { success: boolean; message: string; po?: PurchaseOrderRequest } {
  const parts = getStoredSpareParts();
  const part = parts.find((p) => p.id === partId);
  if (!part) {
    return { success: false, message: 'Không tìm thấy mã linh kiện để tạo đơn đặt hàng' };
  }

  const now = new Date();
  const arrivalDate = new Date(now.getTime() + (part.leadTimeDays || 3) * 24 * 60 * 60 * 1000);
  const arrivalDateStr = arrivalDate.toISOString().substring(0, 10);

  const newPo: PurchaseOrderRequest = {
    id: `po-${Date.now().toString().slice(-6)}`,
    partId: part.id,
    partNumber: part.partNumber,
    partName: part.name,
    quantityRequested: quantity,
    urgency: part.currentStock === 0 ? 'EMERGENCY_DOWNTIME' : 'RESTOCK_WARNING',
    requestedBy: technicianName || 'Kỹ thuật viên ca trực',
    requestedAt: now.toISOString().replace('T', ' ').substring(0, 16),
    status: 'ORDERED',
    estimatedArrivalDate: arrivalDateStr,
    supplier: part.supplier,
    notes: notes || `Yêu cầu đặt khẩn cấp do ${part.currentStock === 0 ? 'hết hàng trong kho' : 'tồn kho dưới mức an toàn'} cho máy ${deviceCode || 'EDM'}.`,
    targetDeviceCode: deviceCode,
  };

  const pos = getStoredPurchaseOrders();
  saveStoredPurchaseOrders([newPo, ...pos]);

  return {
    success: true,
    message: `Đã tạo đơn đặt hàng khẩn cấp #${newPo.id} cho ${quantity} ${part.unit} "${part.name}". Dự kiến giao hàng: ${arrivalDateStr} (${part.leadTimeDays} ngày).`,
    po: newPo,
  };
}
