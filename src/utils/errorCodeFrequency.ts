/**
 * 30-Day Error Code Frequency and Deeper Root Cause Analysis (RCA) Analysis Engine
 * Calculates deterministic, realistic daily frequency distributions for error codes on EDM machines.
 */

export interface ErrorCodeDayBucket {
  dateStr: string; // YYYY-MM-DD
  displayDate: string; // DD/MM
  fullDateLabel: string; // DD/MM/YYYY
  dayOffset: number; // -29 to 0 (0 is today)
  count: number;
  hasIncident: boolean;
  incidentDetails?: string;
  shift?: 'Ca 1 (Sáng)' | 'Ca 2 (Chiều)' | 'Ca 3 (Đêm)';
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NONE';
}

export interface ErrorCodeAnalysisSummary {
  errorCode: string;
  errorTitle: string;
  totalOccurrences30Days: number;
  requiresDeepRca: boolean;
  rcaUrgency: 'CRITICAL_RCA' | 'MODERATE_MONITOR' | 'LOW_ISOLATED';
  rcaRationale: string;
  rootCauseRecommendations: string[];
  daysBetweenOccurrences: number; // Average MTBF days between recurrences
  highestDailyCount: number;
  trend: 'INCREASING' | 'STABLE' | 'DECREASING';
  dayBuckets: ErrorCodeDayBucket[];
  recentIncidentsList: {
    date: string;
    description: string;
    shift: string;
    durationMinutes: number;
  }[];
}

export interface ErrorCodeOption {
  code: string;
  title: string;
  category: string;
  baseFrequency: number; // Approximate 30-day baseline
}

export const COMMON_EDM_ERROR_CODES: ErrorCodeOption[] = [
  {
    code: 'E-102',
    title: 'Đứt Dây Cắt & Sụt Áp Khe Phóng Điện (Spark Gap Short-Circuit)',
    category: 'Hệ Thống Phóng Điện & Dây',
    baseFrequency: 6,
  },
  {
    code: 'ALARM-204',
    title: 'Tụt Áp Suất Dung Môi Làm Nguội & Xâm Thực Bơm (<0.3 Bar)',
    category: 'Thủy Lực & Điện Môi',
    baseFrequency: 4,
  },
  {
    code: 'SPW-303',
    title: 'Quá Nhiệt Biến Áp Xung & Khối IGBT Nguồn Phát (>75°C)',
    category: 'Điện Tử & Tản Nhiệt',
    baseFrequency: 3,
  },
  {
    code: 'DIE-201',
    title: 'Độ Dẫn Điện Hạt Deion Vượt Ngưỡng Chuẩn (>15 µS/cm)',
    category: 'Xử Lý Nước & Nhựa Deion',
    baseFrequency: 2,
  },
  {
    code: 'W-104',
    title: 'Dao Động Bất Thường Lực Căng Dây Cắt (Wire Tension Fluctuation)',
    category: 'Hệ Cơ Khí Phanh Dây',
    baseFrequency: 3,
  },
  {
    code: 'AWF-402',
    title: 'Kẹt Xỏ Dây Tự Động & Mòn Dao Cắt Nhiệt Annealing',
    category: 'Cơ Cấu Xỏ Dây Tự Động',
    baseFrequency: 2,
  },
  {
    code: 'AXIS-Z',
    title: 'Kẹt Cơ Khí Dẫn Hướng & Rơ Trượt Bi Trục Z (Z-Axis Jam)',
    category: 'Chuyển Động Trục Vít Me',
    baseFrequency: 4,
  },
  {
    code: 'SYS-101',
    title: 'Trôi Điểm 0 Cảm Biến Dao Động & Lệch Góc Gia Công',
    category: 'Cảm Biến & Đo Lường',
    baseFrequency: 1,
  },
];

/**
 * Generate 30-day frequency breakdown for a specific machine and error code
 */
export function get30DayErrorCodeFrequency(
  deviceId: string,
  errorCode: string,
  activeIncidentCode?: string
): ErrorCodeAnalysisSummary {
  // Use benchmark date Oct 8/9, 2026
  const benchmarkDate = new Date('2026-10-08T18:00:00Z');

  // Match or construct error code metadata
  const knownConfig = COMMON_EDM_ERROR_CODES.find(
    (e) => e.code.toUpperCase() === errorCode.toUpperCase()
  );
  const errorTitle =
    knownConfig?.title || `Sự cố dừng khẩn cấp mã lỗi ${errorCode}`;

  // Deterministic seed based on deviceId and errorCode
  const seedString = `${deviceId}_${errorCode}`;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  // Determine occurrences count based on error code type and device
  let targetTotalCount = knownConfig ? knownConfig.baseFrequency : 2;
  
  // Specific machine overrides for realistic factory correlation
  if (errorCode.includes('102') || errorCode === 'E-102') {
    targetTotalCount = deviceId === 'dev-01' ? 6 : deviceId === 'dev-02' ? 3 : 5;
  } else if (errorCode.includes('204') || errorCode === 'ALARM-204') {
    targetTotalCount = deviceId === 'dev-03' ? 5 : 4;
  } else if (errorCode.includes('303') || errorCode === 'SPW-303') {
    targetTotalCount = deviceId === 'dev-02' ? 5 : 3;
  } else if (errorCode.includes('Z') || errorCode === 'AXIS-Z') {
    targetTotalCount = 4;
  }

  // If this error is currently the active incident, ensure today (Day 0) has an incident
  const isActiveIncident = activeIncidentCode
    ? activeIncidentCode.toUpperCase() === errorCode.toUpperCase()
    : false;

  // Build 30 continuous daily buckets (from Day -29 to Day 0)
  const dayBuckets: ErrorCodeDayBucket[] = [];
  const incidentOccurrencesDays = new Set<number>();

  if (isActiveIncident) {
    incidentOccurrencesDays.add(0); // Today
  }

  // Distribute the remaining occurrences deterministically across the past 29 days
  const candidateOffsets: number[] = [];
  for (let d = -29; d < 0; d++) {
    candidateOffsets.push(d);
  }

  // Shuffle candidateOffsets using pseudo-random linear congruential generator
  const shuffledOffsets = [...candidateOffsets];
  let rngSeed = positiveHash + 42;
  for (let i = shuffledOffsets.length - 1; i > 0; i--) {
    rngSeed = (rngSeed * 9301 + 49297) % 233280;
    const j = Math.floor((rngSeed / 233280) * (i + 1));
    [shuffledOffsets[i], shuffledOffsets[j]] = [shuffledOffsets[j], shuffledOffsets[i]];
  }

  const neededPastOccurrences = Math.max(
    0,
    isActiveIncident ? targetTotalCount - 1 : targetTotalCount
  );

  for (let i = 0; i < neededPastOccurrences && i < shuffledOffsets.length; i++) {
    incidentOccurrencesDays.add(shuffledOffsets[i]);
  }

  // Specific high recurrence clusters if >= 4 (to mimic chronic wear pattern)
  if (targetTotalCount >= 4) {
    // Add a double occurrence on one day in the last 10 days to highlight recurrence surge
    incidentOccurrencesDays.add(-4);
  }

  let totalCount = 0;
  let highestDailyCount = 0;
  const recentIncidentsList: ErrorCodeAnalysisSummary['recentIncidentsList'] = [];

  for (let offset = -29; offset <= 0; offset++) {
    const curDate = new Date(benchmarkDate);
    curDate.setDate(curDate.getDate() + offset);

    const day = curDate.getDate().toString().padStart(2, '0');
    const month = (curDate.getMonth() + 1).toString().padStart(2, '0');
    const year = curDate.getFullYear();
    const dateStr = `${year}-${month}-${day}`;
    const displayDate = `${day}/${month}`;
    const fullDateLabel = `${day}/${month}/${year}`;

    let count = 0;
    let incidentDetails: string | undefined;
    let shift: ErrorCodeDayBucket['shift'];
    let severity: ErrorCodeDayBucket['severity'] = 'NONE';

    if (incidentOccurrencesDays.has(offset)) {
      // If it's the cluster day -4 and high frequency, count = 2
      count = offset === -4 && targetTotalCount >= 5 ? 2 : 1;
      totalCount += count;
      severity = count > 1 || offset === 0 ? 'CRITICAL' : 'HIGH';

      const shiftOptions: ('Ca 1 (Sáng)' | 'Ca 2 (Chiều)' | 'Ca 3 (Đêm)')[][] = [
        ['Ca 1 (Sáng)'],
        ['Ca 2 (Chiều)'],
        ['Ca 3 (Đêm)'],
      ];
      const shiftIdx = Math.abs((offset + positiveHash) % 3);
      shift = shiftOptions[shiftIdx][0];

      if (offset === 0) {
        incidentDetails = isActiveIncident
          ? 'Đang dừng máy khẩn cấp: Tín hiệu sụt áp & đứt dây tại khe phóng'
          : 'Sự cố phát sinh trong ca làm việc hôm nay';
      } else if (offset === -4) {
        incidentDetails = 'Dừng máy 2 lần liên tiếp: Đứt dây khi vào góc R và quá dòng phóng';
      } else if (offset < -20) {
        incidentDetails = 'Dừng máy trong chu kỳ gia công phôi thép khuôn dập SKD11';
      } else {
        incidentDetails = 'Cảnh báo sensor kích hoạt dừng máy, KTV đã thay linh kiện tạm thời';
      }

      recentIncidentsList.push({
        date: fullDateLabel,
        description: incidentDetails,
        shift: shift,
        durationMinutes: count > 1 ? 65 : 35 + ((Math.abs(offset) * 3) % 25),
      });
    }

    if (count > highestDailyCount) {
      highestDailyCount = count;
    }

    dayBuckets.push({
      dateStr,
      displayDate,
      fullDateLabel,
      dayOffset: offset,
      count,
      hasIncident: count > 0,
      incidentDetails,
      shift,
      severity,
    });
  }

  // Analyze Deeper RCA Requirement
  const requiresDeepRca = totalCount >= 4;
  const isModerate = totalCount >= 2 && totalCount < 4;

  const rcaUrgency: ErrorCodeAnalysisSummary['rcaUrgency'] = requiresDeepRca
    ? 'CRITICAL_RCA'
    : isModerate
    ? 'MODERATE_MONITOR'
    : 'LOW_ISOLATED';

  // Calculate days between occurrences
  const daysBetweenOccurrences =
    totalCount > 1 ? parseFloat((30 / totalCount).toFixed(1)) : 30;

  // Trend analysis (compare last 15 days vs first 15 days)
  const first15Count = dayBuckets
    .slice(0, 15)
    .reduce((sum, b) => sum + b.count, 0);
  const last15Count = dayBuckets
    .slice(15)
    .reduce((sum, b) => sum + b.count, 0);

  const trend: ErrorCodeAnalysisSummary['trend'] =
    last15Count > first15Count
      ? 'INCREASING'
      : last15Count < first15Count
      ? 'DECREASING'
      : 'STABLE';

  // Build Rationale and Recommendations
  let rcaRationale = '';
  const rootCauseRecommendations: string[] = [];

  if (requiresDeepRca) {
    rcaRationale = `Mã lỗi [${errorCode}] đã lặp lại ${totalCount} lần trong 30 ngày qua (trung bình cứ ${daysBetweenOccurrences} ngày/lần, xu hướng ${
      trend === 'INCREASING' ? 'GIA TĂNG MẠNH' : 'DÀY ĐẶC'
    }). Đây KHÔNG PHẢI sự cố ngẫu nhiên do phôi bẩn mà là dấu hiệu suy thoái cơ khí hoặc linh kiện bán dẫn tiềm ẩn. Kỹ thuật viên KHÔNG NÊN chỉ xử lý triệu chứng (như nối lại dây hay reset lỗi) mà BẮT BUỘC phải mở quy trình Phân tích Nguyên nhân Gốc rễ Chuyên sâu (Deeper RCA).`;

    if (errorCode.includes('102') || errorCode === 'E-102') {
      rootCauseRecommendations.push(
        'Đo kiểm độ rơ và độ mòn cụm dẫn hướng kim cương P-104 (Diamond Wire Guide) bằng đồng hồ so micron; thay mới nếu vượt quá 0.003mm.'
      );
      rootCauseRecommendations.push(
        'Kiểm tra rơ trượt vít me bi trục U/V và độ đồng trục vòi phun cao áp; xói mòn vòi phun làm lệch dòng xả xỉ khi cắt góc côn.'
      );
      rootCauseRecommendations.push(
        'Thực hiện phương pháp 5 Whys (5 Câu Hỏi Tại Sao) và Biểu đồ Xương Cá Ishikawa để truy tìm nguyên nhân kẹt phôi vi mô.'
      );
      rootCauseRecommendations.push(
        'Kiểm tra độ suy hao khối tiếp điện cacbua (Carbide Power Feed Plate); bề mặt rãnh mòn quá sâu tạo ra tia lửa hồ quang ngược.'
      );
    } else if (errorCode.includes('204') || errorCode === 'ALARM-204') {
      rootCauseRecommendations.push(
        'Kiểm tra hiện tượng bọt khí xâm thực (Cavitation) tại cánh bơm ly tâm cao áp và độ kín của phớt cơ khí trục bơm.'
      );
      rootCauseRecommendations.push(
        'Đo độ sụt áp qua phin lọc giấy 3-micron; tiến hành thay sớm nếu áp suất chênh lệch trước/sau lọc vượt 0.8 Bar.'
      );
      rootCauseRecommendations.push(
        'Lập phiếu phân tích RCA kiểm tra van một chiều bypass và hệ thống đường ống tuần hoàn dầu điện môi.'
      );
    } else if (errorCode.includes('303') || errorCode === 'SPW-303') {
      rootCauseRecommendations.push(
        'Kiểm tra lớp mỡ tản nhiệt (Thermal Paste) khối IGBT nguồn xung; mỡ bị khô cứng sau 2000h làm giảm hiệu suất truyền nhiệt sang cánh nhôm.'
      );
      rootCauseRecommendations.push(
        'Đo lưu lượng gió quạt làm mát tủ điện 24VDC; bụi kim loại lắng đọng làm giảm 40% thể tích gió lưu thông.'
      );
      rootCauseRecommendations.push(
        'Đo kiểm dạng sóng dao động xung bằng máy hiện sóng (Oscilloscope) để phát hiện tụ điện nguồn bị phồng rò rỉ.'
      );
    } else {
      rootCauseRecommendations.push(
        'Thực hiện phân tích Ishikawa truy xuất lỗi thao tác, hao mòn vật lý linh kiện và chất lượng vật tư phụ tùng.'
      );
      rootCauseRecommendations.push(
        'Lên kế hoạch bảo dưỡng phòng ngừa (Preventive Overhaul) toàn diện trước kỳ chạy hàng khuôn mẫu kế tiếp.'
      );
    }
  } else if (isModerate) {
    rcaRationale = `Mã lỗi [${errorCode}] xuất hiện ${totalCount} lần trong 30 ngày qua (trung bình ${daysBetweenOccurrences} ngày/lần). Tần suất ở mức cảnh báo trung bình. Cần giám sát xu hướng sau khi thay thế linh kiện hao mòn và đối chiếu với ca vận hành.`;
    rootCauseRecommendations.push(
      'Ghi chép chi tiết biên độ rung động và nhiệt độ dầu sau khi hoàn thành sửa chữa.'
    );
    rootCauseRecommendations.push(
      'Theo dõi sát sao nếu lỗi tái diễn trong vòng 7 ngày tới, cần kích hoạt phân tích RCA cấp 2.'
    );
  } else {
    rcaRationale = `Mã lỗi [${errorCode}] chỉ xuất hiện ${totalCount} lần trong 30 ngày qua. Đây là sự cố phát sinh đơn lẻ, có thể do biến động tức thời của vật liệu phôi hoặc bụi cặn thoáng qua. Máy chưa cần can thiệp phân tích nguyên nhân gốc rễ sâu; kỹ thuật viên tiến hành quy trình khắc phục SOP chuẩn.`;
    rootCauseRecommendations.push(
      'Thực hiện các bước khắc phục theo hướng dẫn SOP tiêu chuẩn.'
    );
    rootCauseRecommendations.push(
      'Kiểm tra lại phôi gia công và chất lượng dây cắt trước khi khởi động lại máy.'
    );
  }

  // Sort recent incidents descending
  recentIncidentsList.reverse();

  return {
    errorCode,
    errorTitle,
    totalOccurrences30Days: totalCount,
    requiresDeepRca,
    rcaUrgency,
    rcaRationale,
    rootCauseRecommendations,
    daysBetweenOccurrences,
    highestDailyCount,
    trend,
    dayBuckets,
    recentIncidentsList,
  };
}
