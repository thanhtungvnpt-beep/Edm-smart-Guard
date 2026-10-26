import React, { useState, useMemo } from 'react';
import {
  Users2,
  Brain,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  MessageSquare,
  ThumbsUp,
  Award,
  BookOpen,
  Send,
  Eye,
  Plus,
  ArrowRight,
  Clock,
  MapPin,
  Check,
  X,
  Share2,
  Lock,
  Unlock,
  AlertCircle,
  FileText,
  Star,
  ChevronRight,
  TrendingUp,
  Flame,
  BadgeCheck,
  Building2,
  Wrench,
  CheckSquare,
} from 'lucide-react';
import {
  CommunityPost,
  CommunityAnswer,
  CommunityVerificationBadge,
  CommunitySubsystem,
  ExpertProfile,
  KnowledgeLifecycleStage,
} from '../../types';
import { soundManager } from '../../utils/audio';

interface CrossFactoryCommunityViewProps {
  currentPlant: string;
  viewportMode: 'PC' | 'MOBILE';
  onApplyKnowledgeToRepair?: (post: CommunityPost) => void;
}

// Initial mock data grounded in EDM machining realities across 3 Vietnamese manufacturing plants
const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-01',
    title: 'Xử lý triệt để đứt dây EDM liên tục ở góc bo R0.2mm phôi SKD11 dày 80mm',
    targetModel: 'Makino U6 H.E.A.T',
    brand: 'Makino',
    subsystem: 'WIRE_FEED',
    errorCode: 'E-102',
    symptomDescription:
      'Khi gia công góc cung R nhỏ dưới 0.3mm trên thép SKD11 tôi 60HRC, dây đồng 0.25mm bị đứt liên tục dù áp lực nước xối đã chỉnh mức 8. Điểm đứt nằm sát đầu dẫn hướng trên.',
    attemptedSteps: [
      'Thay cuộn dây mới OKI 0.25mm',
      'Tăng áp suất xối lên 1.4 MPa',
      'Giảm tốc độ cấp phôi xuống 1.2 mm/min nhưng vẫn đứt ở pass thô thứ 2',
    ],
    anonymized: true,
    plantScope: 'ALL_FACTORIES',
    originPlant: 'Nhà Máy 1 - Bắc Ninh',
    authorId: 'tech-03',
    authorName: 'Lê Hoàng Nam',
    authorRole: 'KTV Trưởng Cắt Dây',
    authorBadge: 'Cứu Tinh Dây EDM',
    isAnonymousAuthor: false,
    status: 'STANDARDIZED_SOP',
    verificationBadge: 'VERIFIED',
    createdAt: '2 ngày trước',
    updatedAt: 'Hôm nay',
    likesCount: 24,
    answersCount: 3,
    viewCount: 186,
    bestAnswerId: 'ans-01',
    tags: ['Đứt Dây', 'Góc Bo R', 'SKD11', 'Makino U6', 'Áp Lực Nước'],
    aiSummary:
      'Nguyên nhân cốt lõi do dòng xối không thoát kịp ở góc nhọn gây tích tụ xỉ EDM, dẫn đến phóng điện thứ cấp (arc re-striking) làm cháy dây. Giải pháp: Kích hoạt chế độ Corner Control và hạ xung Peak Current từ 28A xuống 22A tại R < 0.5mm.',
    aiSafetyWarnings: [
      'Tuyệt đối không tăng điện áp khe hở quá 85V vì sẽ gây rỗ bề mặt chi tiết khuôn',
      'Đảm bảo tiếp địa thân máy và bơm xối thứ cấp hoạt động bình thường',
    ],
    lifecycle: {
      stage: 5,
      stageName: 'Đã phát hành SOP chính thức',
      submittedAt: '2 ngày trước',
      expertReviewedBy: 'Nguyễn Văn Hùng (Kỹ sư Trưởng)',
      expertReviewNotes: 'Đã kiểm chứng thực nghiệm trên 4 ca gia công khuôn SKD11, tỷ lệ đứt dây giảm 94%.',
      sopStandardizedDraft: 'SOP-EDM-CORNER-MKU6 v2.1',
      directorApprovedBy: 'Lê Đức Trọng (Giám Đốc Kỹ Thuật)',
      directorApprovedAt: 'Hôm qua 15:45',
      publishedAt: 'Hôm nay 08:30',
    },
    answers: [
      {
        id: 'ans-01',
        postId: 'post-01',
        authorId: 'tech-01',
        authorName: 'Nguyễn Văn Hùng',
        authorRole: 'Kỹ sư Trưởng Hệ Thống',
        authorPlant: 'Nhà Máy 1 - Bắc Ninh',
        authorBadge: 'Bậc Thầy Makino',
        content:
          'Trên dòng Makino U6 có tính năng Dynamic Corner Control (DCC). Bạn vào trang tham số cắt:\n1. Bật DCC = ON.\n2. Giảm I_PEAK từ 28A xuống 21A khi bán kính R < 0.4mm.\n3. Nâng áp xối phụ (Sub-flush) lên 1.2 Bar để đẩy phoi thoát nhanh.\n4. Đảm bảo tấm đệm dẫn hướng trên không bị rãnh mòn (thường bị khuyết 0.05mm làm dây rung lắc).',
        stepByStepFix: [
          'Vào Màn hình CNC > Công nghệ cắt > DCC Parameter > Chọn Corner Radius < 0.5mm',
          'Set Peak Current I_PEAK = 21A, T_OFF = 32µs',
          'Xoay mặt tiếp điện Carbide sang vị trí mới chưa mòn',
        ],
        partsReplaced: ['Tiếp điện dẫn hướng Carbide Ø0.25mm'],
        safetyCautions: 'Khóa cửa bảo vệ dung môi trước khi kích hoạt áp suất xối 1.2 Bar',
        upvotes: 18,
        isAccepted: true,
        createdAt: 'Hôm qua 09:15',
        verifiedByLeader: 'Trần Minh Tuấn (Leader EQM)',
      },
      {
        id: 'ans-02',
        postId: 'post-01',
        authorId: 'tech-02',
        authorName: 'Phạm Quốc Huy',
        authorRole: 'KTV Chuyên Sâu Sodick',
        authorPlant: 'Nhà Máy 2 - Hà Nội',
        content:
          'Bên Nhà máy 2 chúng tôi gặp ca tương tự trên khuôn đột dập. Ngoài việc chỉnh xung, anh em nên kiểm tra độ dẫn điện của nước ion (Resistivity). Nếu nước ion tụt dưới 50kΩ.cm (conductivity > 20µS/cm) thì dây cực kỳ dễ bị đứt do ion hóa cục bộ.',
        upvotes: 11,
        isAccepted: false,
        createdAt: 'Hôm qua 11:20',
      },
    ],
  },
  {
    id: 'post-02',
    title: 'Mã lỗi 1143 Water Chiller ALC600G báo nhiệt độ quá 24.5°C khi gia công ban ngày',
    targetModel: 'Sodick ALC600G',
    brand: 'Sodick',
    subsystem: 'WATER_CHILLER',
    errorCode: 'ERR-1143',
    symptomDescription:
      'Từ 11h trưa đến 15h chiều khi nhiệt độ xưởng lên 33°C, máy Sodick ALC600G số 2 liên tục báo cảnh báo nhiệt độ dung môi Dielectric vượt ngưỡng 24°C, máy tự động giảm 30% công suất cắt.',
    attemptedSteps: [
      'Vệ sinh tấm lưới lọc bụi giàn nóng bên hông máy',
      'Đo gas lạnh R410A áp suất hút 7.2 Bar (bình thường)',
      'Bật quạt công nghiệp thổi trực tiếp vào giàn giải nhiệt nhưng không giảm',
    ],
    anonymized: true,
    plantScope: 'ALL_FACTORIES',
    originPlant: 'Nhà Máy 2 - Hà Nội',
    authorId: 'tech-02',
    authorName: 'Phạm Quốc Huy',
    authorRole: 'KTV Chuyên Sâu Sodick',
    authorBadge: 'Chuyên Gia Lạnh Công Nghiệp',
    isAnonymousAuthor: false,
    status: 'IN_DISCUSSION',
    verificationBadge: 'IN_DISCUSSION',
    createdAt: 'Hôm qua',
    updatedAt: '3 giờ trước',
    likesCount: 15,
    answersCount: 2,
    viewCount: 112,
    tags: ['Chiller', 'Sodick ALC600G', 'Quá Nhiệt', 'Nhiệt Độ Dung Môi'],
    aiSummary:
      'Nhiệt độ dung môi tăng bất thường ngoài lỗi tản nhiệt dàn ngưng còn do van tiết lưu điện tử bị kẹt cặn dầu máy hoặc cảm biến RTD PT100 trôi sai số (drifting).',
    lifecycle: {
      stage: 2,
      stageName: 'Đang thẩm định chuyên gia',
      submittedAt: 'Hôm qua',
      expertReviewedBy: 'Nguyễn Văn Hùng',
      expertReviewNotes: 'Cần kiểm tra điện trở cảm biến PT100 ở nhiệt độ chuẩn 20°C để loại trừ lỗi trôi cảm biến.',
    },
    answers: [
      {
        id: 'ans-03',
        postId: 'post-02',
        authorId: 'tech-04',
        authorName: 'Vũ Đức Thắng',
        authorRole: 'KTV Điện & Tự Động Hóa',
        authorPlant: 'Nhà Máy 3 - TP.HCM',
        content:
          'Kinh nghiệm từ đợt nắng nóng ở Nhà máy TP.HCM: Bạn hãy đo cảm biến nhiệt PT100 cắm trong bồn chứa. Đợt trước bồn tôi bị bám 1 lớp váng dầu bôi trơn dày 2mm bao quanh đầu dò khiến nó tản nhiệt kém và đọc sai cao hơn thực tế 3.5°C! Rút ra lau cồn là hết báo ngay.',
        stepByStepFix: [
          'Tắt nguồn Chiller',
          'Rút que cảm biến nhiệt độ PT100 góc trái bồn tuần hoàn',
          'Vệ sinh bằng dung dịch tẩy dầu công nghiệp và cồn Isopropyl',
        ],
        upvotes: 9,
        isAccepted: false,
        createdAt: '4 giờ trước',
      },
    ],
  },
  {
    id: 'post-03',
    title: 'Kinh nghiệm kéo dài tuổi thọ cụm ống kẹp Guide Kim Cương Fanuc α-C600iB lên gấp 2.5 lần',
    targetModel: 'Fanuc Robocut α-C600iB',
    brand: 'Fanuc',
    subsystem: 'AUTO_THREADING',
    errorCode: 'TIPS-901',
    symptomDescription:
      'Chia sẻ cẩm nang bảo trì định kỳ cho anh em vận hành máy Fanuc: giải pháp chống mòn vẹt lỗ xỏ kim cương và chống kẹt cơ cấu cắt dây nhiệt (Annealing wire cutter).',
    attemptedSteps: [
      'Đo độ mòn bằng dưỡng quang học sau mỗi 500 giờ',
      'Ứng dụng ngâm tẩy rửa siêu âm dung dịch axit axetic loãng 5%',
    ],
    anonymized: true,
    plantScope: 'ALL_FACTORIES',
    originPlant: 'Nhà Máy 3 - TP.HCM',
    authorId: 'tech-04',
    authorName: 'Vũ Đức Thắng',
    authorRole: 'KTV Chuyên Sâu EDM',
    authorBadge: 'Cây Sáng Kiến Vàng',
    isAnonymousAuthor: false,
    status: 'STANDARDIZED_SOP',
    verificationBadge: 'OEM_OFFICIAL',
    createdAt: '3 ngày trước',
    updatedAt: '1 ngày trước',
    likesCount: 38,
    answersCount: 4,
    viewCount: 320,
    tags: ['Diamond Guide', 'Fanuc', 'Kéo Dài Tuổi Thọ', 'AWT', 'Bảo Trì'],
    aiSummary:
      'Quy trình bảo dưỡng dự phòng cấp cao giúp giữ chuẩn định tâm dây trong phạm vi ±1.5µm, giảm tỷ lệ xỏ dây trượt (threading failure) từ 8% xuống dưới 0.4%.',
    lifecycle: {
      stage: 5,
      stageName: 'Đã phát hành SOP chính thức',
      submittedAt: '3 ngày trước',
      expertReviewedBy: 'Trần Minh Tuấn',
      sopStandardizedDraft: 'SOP-FANUC-AWT-GUIDE-300H',
      directorApprovedBy: 'Lê Đức Trọng',
      directorApprovedAt: '2 ngày trước',
      publishedAt: '2 ngày trước',
    },
    answers: [],
  },
];

const EXPERTS_ROSTER: ExpertProfile[] = [
  {
    id: 'exp-01',
    name: 'Nguyễn Văn Hùng',
    role: 'Kỹ sư Trưởng Hệ Thống (Master Specialist)',
    plant: 'Nhà Máy 1 - Bắc Ninh',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    specialties: ['Makino U6/EDAF3', 'Nguồn Xung Cao Tần', 'Gia Công Siêu Chính Xác'],
    verifiedSolutionsCount: 34,
    reputationScore: 1480,
    badges: [
      { id: 'b1', name: 'Bậc Thầy Makino', icon: '👑', description: 'Đã xử lý trên 100 ca máy xung & cắt dây Makino' },
      { id: 'b2', name: 'Thẩm Định Viên SOP', icon: '📜', description: 'Phê chuẩn 25 quy trình SOP chuẩn liên nhà máy' },
    ],
    recentContributions: [
      'Giải pháp giảm đứt dây góc bo R0.2mm',
      'Căn chỉnh laser trục Z Makino EDAF3',
    ],
  },
  {
    id: 'exp-02',
    name: 'Phạm Quốc Huy',
    role: 'Chuyên Gia Kỹ Thuật Sodick & Fanuc',
    plant: 'Nhà Máy 2 - Hà Nội',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    specialties: ['Sodick ALC600G', 'Động Cơ Tuyến Tính Linear Motor', 'Hệ Thống Lạnh Chiller'],
    verifiedSolutionsCount: 28,
    reputationScore: 1220,
    badges: [
      { id: 'b3', name: 'Chuyên Gia Sodick', icon: '⚡', description: 'Hiệu chỉnh thành công 40 hệ thống tuyến tính' },
      { id: 'b4', name: 'Cứu Tinh Sự Cố', icon: '🛡️', description: 'Khắc phục sự cố khẩn cấp dưới 20 phút' },
    ],
    recentContributions: [
      'Khắc phục cảnh báo áp suất bồn ALC600G',
      'Xử lý trôi nhiệt cảm biến Chiller',
    ],
  },
  {
    id: 'exp-03',
    name: 'Lê Hoàng Nam',
    role: 'KTV Trưởng Cắt Dây Hiện Trường',
    plant: 'Nhà Máy 1 - Bắc Ninh',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    specialties: ['Gia Công Phôi Dày 100mm+', 'Xỏ Dây Tự Động AWT', 'Tối Ưu Dây Cắt'],
    verifiedSolutionsCount: 19,
    reputationScore: 940,
    badges: [
      { id: 'b5', name: 'Cứu Tinh Dây EDM', icon: '🧵', description: 'Tối ưu độ bền dây đồng và giảm hao phí 18%' },
    ],
    recentContributions: ['Kinh nghiệm cắt thép tôi SKD11 góc hẹp'],
  },
  {
    id: 'exp-04',
    name: 'Vũ Đức Thắng',
    role: 'KTV Tự Động Hóa & Điện CNC',
    plant: 'Nhà Máy 3 - TP.HCM',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    specialties: ['Fanuc Robocut', 'Mitsubishi EDM', 'Cảm Biến Đo Quang Học'],
    verifiedSolutionsCount: 16,
    reputationScore: 810,
    badges: [
      { id: 'b6', name: 'Cây Sáng Kiến Vàng', icon: '💡', description: 'Đóng góp 12 mẹo bảo trì tiết kiệm chi phí' },
    ],
    recentContributions: ['Kéo dài tuổi thọ Guide kim cương Fanuc'],
  },
];

export const CrossFactoryCommunityView: React.FC<CrossFactoryCommunityViewProps> = ({
  currentPlant,
  viewportMode,
  onApplyKnowledgeToRepair,
}) => {
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [activeTab, setActiveTab] = useState<'FEED' | 'EXPERTS' | 'STANDARDIZED_KNOWLEDGE'>('FEED');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>('ALL');
  const [selectedBadge, setSelectedBadge] = useState<string>('ALL');
  const [selectedPlantScope, setSelectedPlantScope] = useState<string>('ALL');

  // Create Question Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBrand, setNewBrand] = useState<'Makino' | 'Sodick' | 'Fanuc' | 'Mitsubishi' | 'Chmer' | 'General'>('Makino');
  const [newModel, setNewModel] = useState('Makino U6 H.E.A.T');
  const [newSubsystem, setNewSubsystem] = useState<CommunitySubsystem>('WIRE_FEED');
  const [newErrorCode, setNewErrorCode] = useState('');
  const [newSymptom, setNewSymptom] = useState('');
  const [newAttemptedSteps, setNewAttemptedSteps] = useState('');
  const [newPlantScope, setNewPlantScope] = useState<'ALL_FACTORIES' | 'LOCAL_PLANT'>('ALL_FACTORIES');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymizationActive, setAnonymizationActive] = useState(true);

  // New Answer State inside active thread
  const [replyText, setReplyText] = useState('');
  const [replySteps, setReplySteps] = useState('');
  const [replyParts, setReplyParts] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.symptomDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.errorCode && post.errorCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        post.targetModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchBrand = selectedBrand === 'ALL' || post.brand === selectedBrand;
      const matchSubsystem = selectedSubsystem === 'ALL' || post.subsystem === selectedSubsystem;
      const matchBadge = selectedBadge === 'ALL' || post.verificationBadge === selectedBadge;
      const matchPlant = selectedPlantScope === 'ALL' || post.originPlant.includes(selectedPlantScope);

      return matchSearch && matchBrand && matchSubsystem && matchBadge && matchPlant;
    });
  }, [posts, searchQuery, selectedBrand, selectedSubsystem, selectedBadge, selectedPlantScope]);

  // Anonymization Sanitizer Preview
  const sanitizedSymptomPreview = useMemo(() => {
    if (!anonymizationActive) return newSymptom;
    // Replace typical proprietary patterns: Serial numbers, customer names, drawing codes
    return newSymptom
      .replace(/\b(SN|Ser|Serial|No)[\s:-]*[A-Z0-9-]{5,}\b/gi, '[SERIAL ĐÃ ẨN DANH]')
      .replace(/\b(Apple|Samsung|Foxconn|Toyota|Honda|Sony|Canon)\b/gi, '[ĐỐI TÁC OEM]')
      .replace(/\b(DWG|Drawing|Khuon)[\s:-]*[A-Z0-9_-]{4,}\b/gi, '[MÃ BẢN VẼ BẢO MẬT]');
  }, [newSymptom, anonymizationActive]);

  // Upvote Post
  const handleLikePost = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playBeep();
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p))
    );
    showToast('Đã ghi nhận tương tác hữu ích!');
  };

  // Upvote Answer
  const handleUpvoteAnswer = (answerId: string) => {
    if (!selectedPost) return;
    soundManager.playBeep();
    const updatedAnswers = selectedPost.answers.map((a) =>
      a.id === answerId ? { ...a, upvotes: a.upvotes + 1 } : a
    );
    const updatedPost = { ...selectedPost, answers: updatedAnswers };
    setSelectedPost(updatedPost);
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    showToast('Đã bỏ phiếu cho câu trả lời xuất sắc!');
  };

  // Accept Best Solution
  const handleAcceptBestSolution = (answer: CommunityAnswer) => {
    if (!selectedPost) return;
    soundManager.playSuccessChime();
    const updatedAnswers = selectedPost.answers.map((a) => ({
      ...a,
      isAccepted: a.id === answer.id,
    }));
    const updatedPost: CommunityPost = {
      ...selectedPost,
      bestAnswerId: answer.id,
      status: 'VERIFIED_SOLUTION',
      verificationBadge: 'VERIFIED',
      answers: updatedAnswers,
      lifecycle: selectedPost.lifecycle
        ? {
            ...selectedPost.lifecycle,
            stage: 2,
            stageName: 'Đã giải quyết - Đang thẩm định đưa vào SOP',
            expertReviewedBy: `${answer.authorName} (${answer.authorRole})`,
          }
        : {
            stage: 2,
            stageName: 'Đang thẩm định chuyên gia',
            submittedAt: 'Vừa xong',
            expertReviewedBy: answer.authorName,
          },
    };
    setSelectedPost(updatedPost);
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    showToast(`Đã chọn câu trả lời của "${answer.authorName}" làm GIẢI PHÁP TỐI ƯU!`);
  };

  // Submit Answer
  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !replyText.trim()) return;

    soundManager.playSuccessChime();
    const newAnswer: CommunityAnswer = {
      id: `ans-${Date.now()}`,
      postId: selectedPost.id,
      authorId: 'curr-user',
      authorName: 'Trần Minh Tuấn',
      authorRole: 'Leader EQM & Kỹ Sư Tối Ưu',
      authorPlant: currentPlant === 'plant-01' ? 'Nhà Máy 1 - Bắc Ninh' : 'Nhà Máy 2 - Hà Nội',
      authorBadge: 'Người Đóng Góp Tích Cực',
      content: replyText,
      stepByStepFix: replySteps.trim()
        ? replySteps.split('\n').filter((s) => s.trim().length > 0)
        : undefined,
      partsReplaced: replyParts.trim()
        ? replyParts.split(',').map((p) => p.trim())
        : undefined,
      upvotes: 1,
      isAccepted: false,
      createdAt: 'Vừa xong',
    };

    const updatedPost: CommunityPost = {
      ...selectedPost,
      answersCount: selectedPost.answersCount + 1,
      answers: [newAnswer, ...selectedPost.answers],
    };

    setSelectedPost(updatedPost);
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    setReplyText('');
    setReplySteps('');
    setReplyParts('');
    showToast('Đã gửi câu trả lời chia sẻ tri thức tới kỹ thuật viên toàn mạng lưới!');
  };

  // Submit New Question (COM-02)
  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSymptom.trim()) return;

    soundManager.playSuccessChime();
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      title: newTitle.trim(),
      targetModel: newModel,
      brand: newBrand,
      subsystem: newSubsystem,
      errorCode: newErrorCode.trim() || undefined,
      symptomDescription: anonymizationActive ? sanitizedSymptomPreview : newSymptom.trim(),
      attemptedSteps: newAttemptedSteps.trim()
        ? newAttemptedSteps.split('\n').filter((s) => s.trim().length > 0)
        : ['Đã kiểm tra sơ bộ nguồn điện và áp suất xối'],
      anonymized: anonymizationActive,
      plantScope: newPlantScope,
      originPlant: currentPlant === 'plant-01' ? 'Nhà Máy 1 - Bắc Ninh' : 'Nhà Máy 2 - Hà Nội',
      authorId: 'user-self',
      authorName: isAnonymous ? 'Kỹ Thuật Viên Ẩn Danh' : 'Trần Minh Tuấn',
      authorRole: 'Leader EQM',
      authorBadge: isAnonymous ? undefined : 'Thành Viên Tích Cực',
      isAnonymousAuthor: isAnonymous,
      status: 'OPEN',
      verificationBadge: 'IN_DISCUSSION',
      createdAt: 'Vừa xong',
      updatedAt: 'Vừa xong',
      likesCount: 1,
      answersCount: 0,
      viewCount: 1,
      tags: [newBrand, newModel.split(' ')[0], newSubsystem],
      aiSummary: 'Hệ thống đã tự động kích hoạt bộ lọc bảo mật và gửi thông báo tới các chuyên gia phù hợp.',
      lifecycle: {
        stage: 1,
        stageName: 'Đề xuất mới',
        submittedAt: 'Vừa xong',
      },
      answers: [],
    };

    setPosts([newPost, ...posts]);
    setShowCreateModal(false);
    setNewTitle('');
    setNewErrorCode('');
    setNewSymptom('');
    setNewAttemptedSteps('');
    showToast('Đã đăng câu hỏi thành công! Trợ lý AI đang quét đối chiếu tiền lệ...');
    setSelectedPost(newPost);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-xl animate-bounce">
          <CheckCircle2 className="h-5 w-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hero Banner: Cross-Factory Hub */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 border border-indigo-400/40 px-3 py-1 text-xs font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              <span>Mạng Lưới Tri Thức Kỹ Thuật Viên EDM Liên Nhà Máy (3 Cơ Sở)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Cộng Đồng Kỹ Thuật Viên EDM SmartGuard</span>
              <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-xs font-mono font-bold text-purple-300 border border-purple-500/30">
                COM-01 → COM-06
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              Hệ thống kết nối trực tiếp KTV & Quản đốc giữa <strong>Nhà Máy 1 (Bắc Ninh)</strong>,{' '}
              <strong>Nhà Máy 2 (Hà Nội)</strong> và <strong>Nhà Máy 3 (TP.HCM)</strong>. Tự động ẩn danh hóa bảo mật
              thông tin độc quyền, AI Copilot trợ giúp tóm tắt cảnh báo rủi ro, và quy trình 5 bước chuẩn hóa SOP chính hãng.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                soundManager.playBeep();
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 shadow-lg shadow-indigo-900/30 transition transform active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Đăng Câu Hỏi / Sự Cố Mới</span>
            </button>
          </div>
        </div>

        {/* Community KPI Strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2.5">
            <div className="text-[11px] font-semibold text-slate-400">Ca Sự Cố Đã Thảo Luận</div>
            <div className="text-lg sm:text-xl font-black text-indigo-300">142 <span className="text-xs font-normal text-slate-400">vụ việc</span></div>
          </div>
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2.5">
            <div className="text-[11px] font-semibold text-slate-400">Giải Pháp Đã Kiểm Chứng</div>
            <div className="text-lg sm:text-xl font-black text-emerald-400">89.4% <span className="text-xs font-normal text-slate-400">tỷ lệ OK</span></div>
          </div>
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2.5">
            <div className="text-[11px] font-semibold text-slate-400">SOP Đã Chuẩn Hóa 5 Bước</div>
            <div className="text-lg sm:text-xl font-black text-amber-400">38 <span className="text-xs font-normal text-slate-400">quy trình</span></div>
          </div>
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2.5">
            <div className="text-[11px] font-semibold text-slate-400">Chuyên Gia Liên Nhà Máy</div>
            <div className="text-lg sm:text-xl font-black text-cyan-400">18 <span className="text-xs font-normal text-slate-400">bậc thầy</span></div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('FEED')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'FEED'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Bảng Tin Cộng Đồng (COM-01)</span>
            <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-mono">
              {filteredPosts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EXPERTS')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'EXPERTS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Award className="h-4 w-4 text-amber-400" />
            <span>Hồ Sơ Chuyên Gia & Bảng Vàng (COM-04)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STANDARDIZED_KNOWLEDGE')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === 'STANDARDIZED_KNOWLEDGE'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="h-4 w-4 text-emerald-400" />
            <span>Kho Tri Thức 5 Bước (COM-05/06)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BẢNG TIN CỘNG ĐỒNG & THẢO LUẬN (COM-01 & COM-03)                   */}
      {/* ========================================================================= */}
      {activeTab === 'FEED' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Filter Sidebar & Search */}
          <div className="lg:col-span-4 space-y-4">
            {/* Search Box */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Search className="h-4 w-4 text-indigo-400" />
                <span>Tìm Kiếm Bài Viết / Mã Lỗi / Hiện Tượng</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="VD: E-102, đứt dây, Sodick, Chiller..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Brand Filter */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <label className="text-[11px] font-semibold text-slate-400">Hãng Thiết Bị EDM:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['ALL', 'Makino', 'Sodick', 'Fanuc', 'Mitsubishi', 'Chmer'].map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setSelectedBrand(brand)}
                      className={`rounded-lg px-2 py-1.5 text-[11px] font-bold text-center transition ${
                        selectedBrand === brand
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {brand === 'ALL' ? 'Tất cả' : brand}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subsystem Filter */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <label className="text-[11px] font-semibold text-slate-400">Hệ Thống Con:</label>
                <select
                  value={selectedSubsystem}
                  onChange={(e) => setSelectedSubsystem(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">Tất cả hệ thống con</option>
                  <option value="WIRE_FEED">Kéo dây & Con lăn dẫn hướng</option>
                  <option value="DIELECTRIC">Tuần hoàn lọc ion & Áp xối</option>
                  <option value="GENERATOR_SPARK">Nguồn xung cao tần & Board mạch</option>
                  <option value="CNC_AXIS">Trục tọa độ X/Y/U/V/Z</option>
                  <option value="WATER_CHILLER">Máy làm lạnh nước Chiller</option>
                  <option value="AUTO_THREADING">Xỏ dây tự động AWT</option>
                </select>
              </div>

              {/* Verification Badge Filter */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <label className="text-[11px] font-semibold text-slate-400">Trạng Thái Xác Minh:</label>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'ALL', label: 'Tất cả trạng thái' },
                    { id: 'VERIFIED', label: '✓ Đã kiểm chứng (Verified)', color: 'text-emerald-400' },
                    { id: 'IN_DISCUSSION', label: '💬 Đang thảo luận', color: 'text-blue-400' },
                    { id: 'OEM_OFFICIAL', label: '⭐ Hướng dẫn chính hãng', color: 'text-amber-400' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedBadge(item.id)}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-left transition ${
                        selectedBadge === item.id
                          ? 'bg-slate-800 text-white font-bold'
                          : 'text-slate-400 hover:bg-slate-950 hover:text-white'
                      }`}
                    >
                      <span className={item.color}>{item.label}</span>
                      {selectedBadge === item.id && <Check className="h-3.5 w-3.5 text-indigo-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plant Scope Filter */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <label className="text-[11px] font-semibold text-slate-400">Nhà Máy Phát Sinh:</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'ALL', label: '3 Nhà máy' },
                    { id: 'Bắc Ninh', label: 'NM1 - Bắc Ninh' },
                    { id: 'Hà Nội', label: 'NM2 - Hà Nội' },
                    { id: 'TP.HCM', label: 'NM3 - TP.HCM' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlantScope(p.id)}
                      className={`rounded-lg px-2 py-1 text-[11px] font-medium transition ${
                        selectedPlantScope === p.id
                          ? 'bg-indigo-600/40 text-indigo-300 border border-indigo-500/50'
                          : 'bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Helper Banner */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <ShieldCheck className="h-4 w-4" />
                <span>Bảo Mật Liên Nhà Máy (Anonymization)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Tất cả bài đăng chia sẻ ra mạng lưới liên nhà máy đều tự động kích hoạt bộ lọc bảo mật:
                xóa số seri máy, mã khách hàng, và dung sai độc quyền.
              </p>
            </div>
          </div>

          {/* Right Column: Posts List or Active Thread Details (COM-03) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedPost ? (
              /* THREAD DETAIL VIEW (COM-03) */
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6 space-y-6">
                {/* Back button & Meta */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <button
                    type="button"
                    onClick={() => setSelectedPost(null)}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180" />
                    <span>Quay lại danh sách câu hỏi</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{selectedPost.createdAt}</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs text-indigo-300 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded-md">
                      <MapPin className="h-3 w-3" />
                      <span>{selectedPost.originPlant}</span>
                    </span>
                  </div>
                </div>

                {/* Question Header */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 text-xs font-mono font-bold">
                      {selectedPost.targetModel}
                    </span>
                    {selectedPost.errorCode && (
                      <span className="rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-1 text-xs font-mono font-bold">
                        {selectedPost.errorCode}
                      </span>
                    )}
                    {selectedPost.verificationBadge === 'VERIFIED' && (
                      <span className="rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Đã Kiểm Chứng Thực Nghiệm</span>
                      </span>
                    )}
                    {selectedPost.anonymized && (
                      <span className="rounded-lg bg-slate-800 text-slate-300 px-2.5 py-1 text-xs font-medium flex items-center gap-1">
                        <Lock className="h-3 w-3 text-amber-400" />
                        <span>Đã Ẩn Danh Dữ Liệu</span>
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-white">{selectedPost.title}</h2>

                  {/* Author line */}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">{selectedPost.authorName}</span>
                    <span>•</span>
                    <span>{selectedPost.authorRole}</span>
                    {selectedPost.authorBadge && (
                      <>
                        <span>•</span>
                        <span className="text-amber-400 font-semibold">{selectedPost.authorBadge}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Symptom & Attempted Steps */}
                <div className="space-y-3 bg-slate-950 rounded-xl p-4 border border-slate-800/80">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                    <span>Hiện Tượng & Bối Cảnh Vận Hành:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                    {selectedPost.symptomDescription}
                  </p>

                  {selectedPost.attemptedSteps && selectedPost.attemptedSteps.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-400">Các Bước Đã Thử Nhưng Chưa Đạt:</div>
                      <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pl-1">
                        {selectedPost.attemptedSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* AI Copilot Knowledge Assistant Box */}
                {selectedPost.aiSummary && (
                  <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                      <Brain className="h-4 w-4 text-purple-400" />
                      <span>AI Copilot Tóm Tắt & Phân Tích Tiền Lệ:</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {selectedPost.aiSummary}
                    </p>
                    {selectedPost.aiSafetyWarnings && (
                      <div className="pt-2 border-t border-indigo-900/40 space-y-1">
                        {selectedPost.aiSafetyWarnings.map((warn, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px] text-amber-300">
                            <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-amber-400" />
                            <span>{warn}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 5-Step Lifecycle Stepper (COM-05) */}
                {selectedPost.lifecycle && (
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <BadgeCheck className="h-4 w-4 text-emerald-400" />
                        <span>Tiến Trình Chuẩn Hóa Tri Thức 5 Bước (COM-05):</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded">
                        Giai đoạn {selectedPost.lifecycle.stage}/5: {selectedPost.lifecycle.stageName}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 text-center">
                      {[
                        { step: 1, label: '1. Đề xuất' },
                        { step: 2, label: '2. Thẩm định' },
                        { step: 3, label: '3. Soạn SOP' },
                        { step: 4, label: '4. Duyệt Giám đốc' },
                        { step: 5, label: '5. Phát hành' },
                      ].map((s) => (
                        <div
                          key={s.step}
                          className={`rounded-lg py-1.5 px-1 text-[10px] font-bold border transition ${
                            (selectedPost.lifecycle?.stage || 1) >= s.step
                              ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-300'
                              : 'bg-slate-900 border-slate-800 text-slate-500'
                          }`}
                        >
                          {s.label}
                        </div>
                      ))}
                    </div>

                    {selectedPost.lifecycle.expertReviewedBy && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1 border-t border-slate-800/60">
                        <span>Thẩm định bởi: <strong className="text-slate-200">{selectedPost.lifecycle.expertReviewedBy}</strong></span>
                        {selectedPost.lifecycle.sopStandardizedDraft && (
                          <span>• Mã SOP: <strong className="text-indigo-400 font-mono">{selectedPost.lifecycle.sopStandardizedDraft}</strong></span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Answers Discussion List */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-indigo-400" />
                      <span>Ý Kiến Đóng Góp & Giải Pháp ({selectedPost.answers.length})</span>
                    </h3>
                  </div>

                  {selectedPost.answers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-500 text-xs">
                      Chưa có câu trả lời nào. Hãy là người đầu tiên chia sẻ giải pháp chuyên môn!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedPost.answers.map((ans) => (
                        <div
                          key={ans.id}
                          className={`rounded-2xl border p-4 sm:p-5 space-y-3 transition ${
                            ans.isAccepted
                              ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/30'
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          {/* Answer Header */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {ans.authorName.charAt(0)}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                  <span>{ans.authorName}</span>
                                  {ans.authorBadge && (
                                    <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded font-normal">
                                      {ans.authorBadge}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {ans.authorRole} • {ans.authorPlant} • {ans.createdAt}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {ans.isAccepted ? (
                                <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 text-xs font-bold flex items-center gap-1">
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Giải Pháp Tối Ưu Được Chọn</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAcceptBestSolution(ans)}
                                  className="rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition"
                                >
                                  Chọn làm Giải Pháp Tối Ưu
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Answer Content */}
                          <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed pl-10">
                            {ans.content}
                          </div>

                          {/* Step by step fix if provided */}
                          {ans.stepByStepFix && ans.stepByStepFix.length > 0 && (
                            <div className="ml-10 rounded-xl bg-slate-900 border border-slate-800 p-3 space-y-1.5">
                              <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                                <CheckSquare className="h-3.5 w-3.5" />
                                <span>Quy Trình Khắc Phục Khuyến Nghị:</span>
                              </div>
                              <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1">
                                {ans.stepByStepFix.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {/* Parts Replaced */}
                          {ans.partsReplaced && ans.partsReplaced.length > 0 && (
                            <div className="ml-10 text-[11px] text-slate-400 flex items-center gap-1.5">
                              <Wrench className="h-3 w-3 text-cyan-400" />
                              <span>Linh kiện / Phụ tùng liên quan:</span>
                              <span className="font-semibold text-cyan-300">
                                {ans.partsReplaced.join(', ')}
                              </span>
                            </div>
                          )}

                          {/* Answer Action footer */}
                          <div className="ml-10 flex items-center justify-between pt-2 border-t border-slate-800/60">
                            <button
                              type="button"
                              onClick={() => handleUpvoteAnswer(ans.id)}
                              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-300 transition"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                              <span>Đồng tình ({ans.upvotes})</span>
                            </button>

                            {onApplyKnowledgeToRepair && (
                              <button
                                type="button"
                                onClick={() => onApplyKnowledgeToRepair(selectedPost)}
                                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                              >
                                <span>Áp dụng vào lệnh bảo trì</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reply Box (COM-03) */}
                <form onSubmit={handleSubmitAnswer} className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Send className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Gửi Ý Kiến / Giải Pháp Kỹ Thuật:</span>
                  </div>

                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Mô tả nguyên nhân và cách khắc phục chi tiết..."
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={replySteps}
                      onChange={(e) => setReplySteps(e.target.value)}
                      placeholder="Các bước tuần tự (cách nhau bởi xuống dòng)..."
                      className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={replyParts}
                      onChange={(e) => setReplyParts(e.target.value)}
                      placeholder="Linh kiện cần thay (VD: Dây OKI 0.25mm, Lõi lọc 3µm)..."
                      className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 shadow-md transition"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Đăng Ý Kiến Chuyên Môn</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* POSTS FEED LIST (COM-01) */
              <div className="space-y-3">
                {filteredPosts.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center space-y-3">
                    <Search className="h-8 w-8 text-slate-600 mx-auto" />
                    <div className="text-sm font-bold text-slate-400">Không tìm thấy bài viết phù hợp</div>
                    <p className="text-xs text-slate-500">
                      Thử điều chỉnh từ khóa tìm kiếm hoặc bấm &quot;Đăng câu hỏi mới&quot; để nhận trợ giúp từ KTV liên nhà máy.
                    </p>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => {
                        soundManager.playBeep();
                        setSelectedPost(post);
                      }}
                      className="group rounded-2xl border border-slate-800 bg-slate-900 hover:border-indigo-500/60 p-4 sm:p-5 transition cursor-pointer shadow-sm hover:shadow-indigo-950/20 space-y-3"
                    >
                      {/* Post Badges Strip */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 text-[11px] font-mono font-bold">
                            {post.brand} • {post.targetModel}
                          </span>
                          {post.errorCode && (
                            <span className="rounded-md bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 text-[11px] font-mono font-bold">
                              {post.errorCode}
                            </span>
                          )}
                          {post.verificationBadge === 'VERIFIED' && (
                            <span className="rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Đã kiểm chứng</span>
                            </span>
                          )}
                          {post.verificationBadge === 'OEM_OFFICIAL' && (
                            <span className="rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              <span>Chính hãng OEM</span>
                            </span>
                          )}
                          {post.anonymized && (
                            <span className="rounded-md bg-slate-800 text-slate-400 px-2 py-0.5 text-[10px] flex items-center gap-1">
                              <Lock className="h-2.5 w-2.5 text-amber-400" />
                              <span>Đã ẩn danh</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 text-indigo-400">
                            <MapPin className="h-3 w-3" />
                            <span>{post.originPlant}</span>
                          </span>
                          <span>•</span>
                          <span>{post.createdAt}</span>
                        </div>
                      </div>

                      {/* Post Title */}
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition line-clamp-2">
                        {post.title}
                      </h3>

                      {/* Snippet */}
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {post.symptomDescription}
                      </p>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs text-slate-400 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-300">{post.authorName}</span>
                          <span>({post.authorRole})</span>
                        </div>

                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={(e) => handleLikePost(post.id, e)}
                            className="flex items-center gap-1 hover:text-indigo-300 transition"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            <span>{post.likesCount}</span>
                          </button>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                            <span>{post.answersCount} phản hồi</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                            <span>{post.viewCount}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HỒ SƠ CHUYÊN GIA & BẢNG VINH DANH (COM-04)                          */}
      {/* ========================================================================= */}
      {activeTab === 'EXPERTS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {EXPERTS_ROSTER.map((exp, rank) => (
              <div
                key={exp.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4 hover:border-amber-500/50 transition relative overflow-hidden"
              >
                {rank === 0 && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                    <span>👑 TOP 1 CHUYÊN GIA LIÊN NHÀ MÁY</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <img
                    src={exp.avatar}
                    alt={exp.name}
                    className="h-14 w-14 rounded-2xl object-cover border-2 border-amber-400/60 shadow-md"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white">{exp.name}</h3>
                    <div className="text-[11px] text-amber-400 font-medium">{exp.role}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-indigo-400" />
                      <span>{exp.plant}</span>
                    </div>
                  </div>
                </div>

                {/* Score & Solutions */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 rounded-xl p-2.5 text-center border border-slate-800">
                  <div>
                    <div className="text-[10px] text-slate-400">Điểm Uy Tín</div>
                    <div className="text-base font-black text-amber-400">{exp.reputationScore}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">Giải Pháp Đã Duyệt</div>
                    <div className="text-base font-black text-emerald-400">{exp.verifiedSolutionsCount}</div>
                  </div>
                </div>

                {/* Badges */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400">Huy Hiệu Chuyên Môn:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {exp.badges.map((b) => (
                      <span
                        key={b.id}
                        title={b.description}
                        className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2 py-1 text-[11px] font-medium text-amber-300 flex items-center gap-1"
                      >
                        <span>{b.icon}</span>
                        <span>{b.name}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Specialties */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                  <div className="text-[11px] font-semibold text-slate-400">Lĩnh Vực Thế Mạnh:</div>
                  <div className="flex flex-wrap gap-1">
                    {exp.specialties.map((s, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-mono"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: KHO TRI THỨC 5 BƯỚC & SOP CHÍNH THỨC (COM-05 & COM-06)            */}
      {/* ========================================================================= */}
      {activeTab === 'STANDARDIZED_KNOWLEDGE' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <span>Kho Tri Thức SOP Đã Qua 5 Bước Kiểm Duyệt Liên Nhà Máy</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Mỗi tài liệu SOP dưới đây đã vượt qua thực nghiệm tại hiện trường, thẩm định chuyên môn,
                  chuẩn hóa mẫu và có chữ ký điện tử của Quản đốc Nhà máy.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {posts
                .filter((p) => p.status === 'STANDARDIZED_SOP')
                .map((post) => (
                  <div
                    key={post.id}
                    className="rounded-2xl border border-emerald-500/40 bg-slate-950 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-xs font-mono font-bold">
                        {post.lifecycle?.sopStandardizedDraft || 'SOP-STANDARDIZED'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        Phê duyệt: {post.lifecycle?.directorApprovedBy}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{post.title}</h3>
                    <p className="text-xs text-slate-300 line-clamp-3">{post.symptomDescription}</p>

                    <div className="rounded-xl bg-slate-900 p-3 border border-slate-800 text-xs text-slate-300 space-y-1">
                      <div className="text-[11px] font-bold text-amber-400">Ý Kiến Thẩm Định:</div>
                      <p className="text-[11px] text-slate-300 italic">
                        &quot;{post.lifecycle?.expertReviewNotes || 'Quy trình đã được chuẩn hóa đạt tiêu chuẩn OEM.'}&quot;
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <span className="text-slate-400">Áp dụng: <strong>42 lần</strong> (Thành công 97.6%)</span>
                      <button
                        type="button"
                        onClick={() => setSelectedPost(post)}
                        className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                      >
                        <span>Xem chi tiết SOP</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ĐĂNG CÂU HỎI & BỘ LỌC ẨN DANH (COM-02)                             */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Đăng Câu Hỏi / Yêu Cầu Hỗ Trợ Đa Nhà Máy</h3>
                  <div className="text-[11px] text-slate-400">Hỗ trợ tự động ẩn danh hóa thông tin độc quyền (COM-02)</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Tiêu đề ngắn gọn mô tả sự cố:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="VD: Makino U6 đứt dây khi gia công góc R0.2mm..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              {/* Machine Model & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Hãng sản xuất:</label>
                  <select
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Makino">Makino</option>
                    <option value="Sodick">Sodick</option>
                    <option value="Fanuc">Fanuc</option>
                    <option value="Mitsubishi">Mitsubishi</option>
                    <option value="Chmer">Chmer</option>
                    <option value="General">Hãng khác / Chung</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Dòng máy cụ thể:</label>
                  <input
                    type="text"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder="VD: Makino U6, ALC600G..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Mã lỗi hiển thị (nếu có):</label>
                  <input
                    type="text"
                    value={newErrorCode}
                    onChange={(e) => setNewErrorCode(e.target.value)}
                    placeholder="VD: E-102, ERR-1143..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Subsystem & Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Hệ thống con liên quan:</label>
                  <select
                    value={newSubsystem}
                    onChange={(e) => setNewSubsystem(e.target.value as CommunitySubsystem)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="WIRE_FEED">Kéo dây & Con lăn dẫn hướng</option>
                    <option value="DIELECTRIC">Tuần hoàn nước ion & Áp xối</option>
                    <option value="GENERATOR_SPARK">Nguồn xung cao tần & Bo mạch</option>
                    <option value="CNC_AXIS">Trục tọa độ X/Y/U/V/Z</option>
                    <option value="WATER_CHILLER">Máy làm lạnh Chiller</option>
                    <option value="AUTO_THREADING">Xỏ dây tự động AWT</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Phạm vi chia sẻ:</label>
                  <select
                    value={newPlantScope}
                    onChange={(e) => setNewPlantScope(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL_FACTORIES">Toàn bộ 3 Nhà máy (Khuyến nghị)</option>
                    <option value="LOCAL_PLANT">Chỉ nội bộ Nhà máy hiện tại</option>
                  </select>
                </div>
              </div>

              {/* Symptom Description with Anonymizer toggle */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Mô tả chi tiết hiện tượng:</label>
                  <button
                    type="button"
                    onClick={() => setAnonymizationActive(!anonymizationActive)}
                    className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded transition ${
                      anonymizationActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {anonymizationActive ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                    <span>{anonymizationActive ? 'Đang Bật Bộ Lọc Ẩn Danh' : 'Tắt Bộ Lọc'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={newSymptom}
                  onChange={(e) => setNewSymptom(e.target.value)}
                  placeholder="Mô tả hiện tượng, loại vật liệu phôi, độ dày, dung môi, thời điểm phát sinh..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
                {anonymizationActive && newSymptom && (
                  <div className="text-[11px] text-amber-400/90 bg-amber-950/20 rounded-lg p-2 border border-amber-800/40">
                    <strong>Bản xem trước sau lọc bảo mật:</strong> &quot;{sanitizedSymptomPreview}&quot;
                  </div>
                )}
              </div>

              {/* Attempted Steps */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Các bước đã thử nghiệm trước đó:</label>
                <textarea
                  rows={2}
                  value={newAttemptedSteps}
                  onChange={(e) => setNewAttemptedSteps(e.target.value)}
                  placeholder="Mỗi bước 1 dòng: VD: Thay cuộn dây, vệ sinh béc xối, đổi chế độ DCC..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Anonymous author checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="anonCheck"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="anonCheck" className="text-xs text-slate-300 cursor-pointer select-none">
                  Ẩn danh tên tôi khi hiển thị công khai trên bảng tin cộng đồng (Chỉ Leader thấy tên thật)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs px-5 py-2.5 shadow-lg shadow-indigo-900/30 transition"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Xác Nhận & Đăng Câu Hỏi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
