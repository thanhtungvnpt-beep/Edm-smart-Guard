import React, { useState } from 'react';
import {
  Brain,
  CheckCircle2,
  Filter,
  Lightbulb,
  Search,
  Sparkles,
  User,
  Wrench,
  Zap,
} from 'lucide-react';
import { AILearning } from '../types';

interface AILearningsTabProps {
  learnings: AILearning[];
}

export const AILearningsTab: React.FC<AILearningsTabProps> = ({ learnings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('ALL');

  const models = ['ALL', ...Array.from(new Set(learnings.map((l) => l.machineModel)))];

  const filtered = learnings.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.errorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.humanSolution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.aiSynthesizedRule.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModel = selectedModel === 'ALL' || l.machineModel === selectedModel;
    return matchesSearch && matchesModel;
  });

  return (
    <div className="space-y-6">
      {/* Hero Banner: Human-AI Collaborative Learning */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/40 bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-slate-950 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/40">
                <Brain className="h-5 w-5" />
              </span>
              <span className="rounded bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 text-xs font-mono font-bold text-purple-300">
                ACTIVE LEARNING GRAPH
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Bộ Não Tri Thức AI: Học Tập Từ Kinh Nghiệm Kỹ Thuật Viên
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Mỗi khi kỹ thuật viên khắc phục xong một ca máy, kinh nghiệm thực chiến tại hiện trường sẽ được AI ghi nhớ và đúc kết thành quy tắc xử lý ưu tiên. Lần sau nếu gặp lỗi tương tự, AI sẽ đề xuất ngay phương pháp thực tế đã được con người kiểm chứng!
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 font-mono">
            <div className="rounded-2xl border border-purple-500/30 bg-purple-900/30 p-4 text-center">
              <span className="text-2xl sm:text-3xl font-bold text-purple-300 block">
                {learnings.length}
              </span>
              <span className="text-[11px] text-slate-400">Bài học đã nạp</span>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-900/30 p-4 text-center">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-300 block">
                {learnings.reduce((acc, l) => acc + l.timesAppliedSuccessfully, 0)}
              </span>
              <span className="text-[11px] text-slate-400">Lần áp dụng thành công</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bài học theo mã lỗi, tên phụ tùng, mẹo xử lý..."
            className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full sm:w-auto rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m === 'ALL' ? 'Tất cả dòng máy' : m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Learnings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 hover:border-purple-500/40 hover:bg-slate-900/90 transition shadow-lg"
          >
            <div>
              {/* Badge & Model */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-red-500/20 border border-red-500/40 px-2 py-0.5 font-mono font-bold text-red-400">
                    {item.errorCode}
                  </span>
                  <span className="font-mono text-slate-300 text-[11px] truncate max-w-[180px]">
                    {item.machineModel}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Áp dụng: {item.timesAppliedSuccessfully} lần</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="mt-3 text-base font-bold text-white leading-snug">
                {item.title}
              </h3>

              {/* Problem Observed */}
              <p className="mt-2 text-xs text-slate-400 italic">
                "{item.problemStatement}"
              </p>

              {/* Human Solution */}
              <div className="mt-3 rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-1">
                  <User className="h-3.5 w-3.5 text-amber-400" />
                  <span>Kinh nghiệm con người ({item.discoveredBy}):</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  {item.humanSolution}
                </p>
              </div>

              {/* AI Synthesized Rule */}
              <div className="mt-3 rounded-xl bg-purple-950/30 border border-purple-500/30 p-3 text-xs">
                <div className="flex items-center gap-1.5 text-purple-300 font-semibold mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Quy tắc AI đúc kết được:</span>
                </div>
                <p className="text-purple-200 font-medium leading-relaxed">
                  {item.aiSynthesizedRule}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Đóng góp: {item.discoveredBy.split('(')[0]}</span>
              <span>Ghi nhận: {item.learnedAt}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
