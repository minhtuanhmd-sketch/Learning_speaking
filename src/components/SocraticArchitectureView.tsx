import React, { useState } from 'react';
import { HelpCircle, ArrowRight, Code2 } from 'lucide-react';
import { SentencePattern } from '../types/sla';

interface SocraticArchitectureViewProps {
  mode: 'pedagogy' | 'architecture';
  activePattern: SentencePattern;
  onReturnToStudio: () => void;
}

export const SocraticArchitectureView: React.FC<SocraticArchitectureViewProps> = ({
  mode,
  activePattern,
  onReturnToStudio,
}) => {
  const [selectedExperiment, setSelectedExperiment] = useState<number>(0);
  const sampleSentenceJson = JSON.stringify(activePattern.sentences[0], null, 2);

  const thoughtExperiments = [
    {
      question:
        'Câu hỏi Socratic #1: Nếu học viên phát âm từ "right" (/raɪt/) hoàn toàn chuẩn xác, nhưng Web Speech API lại trả về từ đồng âm "write" do xác suất mô hình ngôn ngữ (Language Model prior), thuật toán Levenshtein thuần túy sẽ phạt học viên 40% điểm từ đó. Bạn sẽ giải quyết nghịch lý này ở tầng kiến trúc nào?',
      professorAnalysis:
        'Giải pháp Kiến trúc: Không bao giờ chạy khoảng cách chỉnh sửa (Levenshtein) trực tiếp trên chuỗi chữ viết (orthographic strings) chưa chuẩn hóa. Trong `src/utils/phoneticScoring.ts`, chúng ta xây dựng lớp đối chiếu từ đồng âm (`HOMOPHONE_GROUPS`) và chuẩn hóa từ viết tắt (`CONTRACTION_MAP`: "I\'m" ↔ "I am"). Khi nâng cấp lên quy mô lớn, ta chuyển từ Orthographic Levenshtein sang Phonemic Edit Distance trên chuỗi IPA (ví dụ: dùng từ điển CMU Pronouncing Dictionary ánh xạ cả "right" và "write" về cùng vector âm vị `/r aɪ t/`).',
    },
    {
      question:
        'Câu hỏi Socratic #2: Tại sao chúng ta thiết kế lộ trình khóa tuần tự (Sequential Mastery Gate: hoàn thành 3 mẫu câu A2 mới mở khóa B1, hoàn thành B1 mới mở khóa B2) thay vì để người mới học nhảy ngay vào cấu trúc đảo ngữ B2?',
      professorAnalysis:
        'Giải pháp Sư phạm & Kỹ thuật: Theo Lý thuyết Khả năng Xử lý (Processability Theory — Pienemann, 1998) và Giả thuyết Đầu vào Cộng 1 (i+1 — Krashen), não bộ người học ngôn ngữ thứ hai chỉ có thể tự động hóa cấu trúc bậc cao (như đảo ngữ B2 "Not only does...") khi đã giải phóng được dung lượng bộ nhớ làm việc ở các cấu trúc mệnh đề cơ sở (A2) và đóng khung diễn ngôn (B1). Cơ chế Sequential Mastery Gate trong `src/utils/progressionLogic.ts` đảm bảo học viên xây dựng nền tảng 60 câu A2 vững chắc trước khi tiến lên 60 câu B1 và 60 câu B2.',
    },
    {
      question:
        'Câu hỏi Socratic #3: Khi mở rộng từ Web Speech API trên trình duyệt sang Gemini Multimodal Audio API (`/api/evaluate-speech`), làm thế nào để tối ưu hóa độ trễ (latency) và chi phí token mà vẫn giữ được phản hồi thời gian thực dưới 300ms?',
      professorAnalysis:
        'Giải pháp Kiến trúc Lai (Hybrid Dual-Tier Scoring Pipeline): Tầng 1 (Edge/Browser - 0ms cost): Sử dụng Web Speech API + thuật toán phát hiện giao thoa L1 cục bộ để tô màu từ (Xanh/Vàng/Đỏ) ngay tức thì sau khi học viên dứt lời. Tầng 2 (Asynchronous Server-Side Gemini 2.5 Flash Native Audio): Chỉ gửi gói âm thanh PCM 16kHz nén của những câu có điểm < 80% hoặc khi học viên bấm "Phân tích Khẩu hình Chuyên sâu" lên endpoint `/api/gemini-phonetic-coach` để phân tích ngữ điệu (suprasegmental prosody), trọng âm từ (lexical stress) và nối âm.',
    },
  ];

  if (mode === 'pedagogy') {
    return (
      <div className="space-y-8">
        <div className="p-6 bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              Nền Tảng Ngôn Ngữ Học Ứng Dụng · Second Language Acquisition (SLA)
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-serif-display">
              Giải Phẫu Nguyên Lý Đệ Nhất (First-Principles SLA Breakdown)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
              Cơ sở lý thuyết chuyển hóa từ Tâm lý học Nhận thức và Ngữ âm học Đối chiếu Anh – Việt thành kiến trúc phần mềm LexiSpeak VN (9 mẫu câu · 180 biến thể ngữ cảnh từ A2 đến B2).
            </p>
          </div>
          <button
            type="button"
            onClick={onReturnToStudio}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0284C7] dark:bg-sky-600 rounded-lg hover:bg-[#0369A1] dark:hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0"
          >
            <span>Quay Lại Phòng Luyện Nói</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="p-6 bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-mono font-semibold text-[#0284C7] dark:text-sky-400">
              01. PATTERN DRILL AUTOMATIZATION
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif-display">
              Tự Động Hóa Khung Cú Pháp Qua 20 Biến Thể
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Dựa trên <strong>Lý thuyết Thụ đắc Kỹ năng (Skill Acquisition Theory — DeKeyser, 2007)</strong>, người học ngoại ngữ chuyển từ <em>Tri thức Khai báo (Declarative Knowledge)</em> sang <em>Tri thức Thủ tục (Procedural Knowledge)</em> thông qua việc lặp lại có biến đổi ngữ cảnh.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Việc giữ cố định khung mẫu câu (ví dụ: <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{activePattern.formula}</code>) và thay đổi 20 ngữ cảnh thực tế giúp hình thành đường dẫn thần kinh tự động, loại bỏ thói quen dịch từng từ.
            </p>
          </article>

          <article className="p-6 bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-mono font-semibold text-[#059669] dark:text-emerald-400">
              02. SEQUENTIAL MASTERY (A2 → B1 → B2)
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif-display">
              Thụ Đắc Tuần Tự Theo Khả Năng Xử Lý
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Theo <strong>Processability Theory (Pienemann, 1998)</strong>, người học cần hoàn thiện các cấu trúc giao tiếp thiết yếu ở trình độ <strong>A2 (3 mẫu câu · 60 câu)</strong> trước khi nâng cấp lên cấu trúc đóng khung lập luận <strong>B1 (3 mẫu câu · 60 câu)</strong> và cấu trúc đảo ngữ / câu chẻ học thuật <strong>B2 (3 mẫu câu · 60 câu)</strong>.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Lộ trình tuần tự kết hợp <strong>Contextual Cloze Gate</strong> khóa phần luyện nói cho đến khi học viên chủ động điền đúng từ mục tiêu dựa trên gợi ý tiếng Việt, từ loại (POS) và phiên âm IPA.
            </p>
          </article>

          <article className="p-6 bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-mono font-semibold text-[#D97706] dark:text-amber-400">
              03. VIETNAMESE L1 PHONETIC TRANSFER
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif-display">
              Sửa Lỗi Giao Thoa Ngữ Âm Tiếng Việt (L1)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Tiếng Việt là ngôn ngữ đơn âm tiết (monosyllabic), nhịp âm tiết (syllable-timed), không có cụm phụ âm (consonant clusters như <code className="font-mono text-xs">/str/, /spl/, /ks/, /ts/</code>) và các phụ âm cuối đều là âm khép không bật hơi.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Do đó, hệ thống phân tách rõ màu <strong>Vàng (Minor / L1 Interference)</strong> cho các lỗi rơi âm cuối (<code className="font-mono text-xs">-s, -ed, -st, -ing → -in</code>) kèm hướng dẫn khẩu hình cụ thể.
            </p>
          </article>
        </div>

        {/* Cognitive Load Theory UI Mapping Table */}
        <div className="p-6 bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif-display mb-4">
            Ánh Xạ Lý Thuyết Tải Nhận Thức (Cognitive Load Theory — Sweller) Vào Thiết Kế Giao Diện Ban Đêm
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3 pr-4">Loại Tải Nhận Thức</th>
                  <th className="py-3 px-4">Bản Chất Tâm Lý Học</th>
                  <th className="py-3 pl-4">Quyết Định Kiến Trúc Giao Diện (UI/UX Implementation)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300">
                <tr>
                  <td className="py-3.5 pr-4 font-semibold text-slate-900 dark:text-white">
                    Intrinsic Load (Tải Nội Tại)
                  </td>
                  <td className="py-3.5 px-4">
                    Độ khó tự nhiên của ngữ pháp và âm vị ở từng cấp độ CEFR (A2 → B1 → B2).
                  </td>
                  <td className="py-3.5 pl-4">
                    Chia tách mỗi câu thành 2 bước tuần tự (Bước 1: Điền từ Cloze → Bước 2: Phát âm) và mở khóa tuần tự từ A2 lên B1, B2.
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-4 font-semibold text-slate-900 dark:text-white">
                    Extraneous Load (Tải Ngoại Lai)
                  </td>
                  <td className="py-3.5 px-4">
                    Mỏi mắt thị giác khi học ban đêm hoặc bị che khuất chữ do cắt dòng.
                  </td>
                  <td className="py-3.5 pl-4">
                    Chế độ Ban Đêm (Dark Slate `#0B1120` & `#0F172A`) giảm ánh sáng xanh, mở rộng toàn bộ hộp câu và thanh danh sách để người học đọc trọn vẹn câu.
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 pr-4 font-semibold text-slate-900 dark:text-white">
                    Germane Load (Tải Kiến Tạo)
                  </td>
                  <td className="py-3.5 px-4">
                    Nỗ lực trí tuệ dành cho việc xây dựng sơ đồ tư duy (schema) bền vững.
                  </td>
                  <td className="py-3.5 pl-4">
                    Cung cấp nút nghe đối chiếu 1.0x vs. 0.8x và hộp chẩn đoán khẩu hình tiếng Việt ngay khi học viên nhấn vào từng từ màu Vàng/Đỏ.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="p-6 bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Kiến Trúc Phần Mềm EdTech & Đối Thoại Socratic
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white font-serif-display">
            Đánh Đổi Kỹ Thuật (Trade-offs), JSON Schema & Phản Tư Socratic
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
            Phân tích chuyên sâu về giới hạn của Web Speech API, thiết kế lược đồ dữ liệu và chiến lược mở rộng sang Gemini Multimodal Audio API.
          </p>
        </div>
        <button
          type="button"
          onClick={onReturnToStudio}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0284C7] dark:bg-sky-600 rounded-lg hover:bg-[#0369A1] dark:hover:bg-sky-500 transition-colors whitespace-nowrap shrink-0"
        >
          <span>Quay Lại Phòng Luyện Nói</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Web Speech API vs. Multimodal LLM Audio Evaluation Comparison */}
      <div className="p-6 bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif-display mb-4">
          So Sánh Kiến Trúc: Browser Web Speech API + Phonetic Heuristics vs. Gemini Multimodal Audio API
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 pr-4">Tiêu Chí Kỹ Thuật</th>
                <th className="py-3 px-4">Web Speech API + Levenshtein/L1 Rules (Client-Side)</th>
                <th className="py-3 pl-4">Gemini 2.5 Flash Native Audio API (Server-Side Multimodal)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-slate-900 dark:text-white">
                  Độ trễ phản hồi (Latency)
                </td>
                <td className="py-3.5 px-4 font-mono text-xs text-[#059669] dark:text-emerald-400">
                  ~80ms – 250ms (Tức thì trên trình duyệt)
                </td>
                <td className="py-3.5 pl-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                  ~800ms – 1,800ms (Truyền tải mạng + Suy luận âm thanh)
                </td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-slate-900 dark:text-white">
                  Độ phân giải ngữ âm (Granularity)
                </td>
                <td className="py-3.5 px-4">
                  Mức từ vựng (Orthographic token). Dễ bị "sửa lưng tự động" (Language Model Hallucination) khi học viên đọc sai nhẹ nhưng nằm trong ngữ cảnh.
                </td>
                <td className="py-3.5 pl-4">
                  Mức âm vị & siêu đoạn tính (Phoneme, trọng âm từ, ngữ điệu lên xuống, độ bật hơi âm cuối /t/, /d/, /k/).
                </td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-slate-900 dark:text-white">
                  Xử lý từ đồng âm (Homophones)
                </td>
                <td className="py-3.5 px-4">
                  Cần bảng ánh xạ từ đồng âm (<code className="font-mono text-xs">HOMOPHONE_GROUPS</code>) để tránh phạt oan khi ASR trả về "write" thay vì "right".
                </td>
                <td className="py-3.5 pl-4">
                  Truyền trực tiếp câu mục tiêu (Prompt Context) nên mô hình đối chiếu trực tiếp sóng âm với âm vị kỳ vọng.
                </td>
              </tr>
              <tr>
                <td className="py-3.5 pr-4 font-semibold text-slate-900 dark:text-white">
                  Chi phí vận hành (Unit Economics)
                </td>
                <td className="py-3.5 px-4 font-mono text-xs text-[#059669] dark:text-emerald-400">
                  $0.00 / 1,000 lượt luyện câu
                </td>
                <td className="py-3.5 pl-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                  Tính theo Audio Input Tokens (Tối ưu khi dùng cho bước Chẩn đoán Sâu)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Socratic Thought Experiments & Live JSON Schema */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 p-6 bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0284C7] dark:text-sky-400">
            <HelpCircle className="w-4 h-4" />
            <span>ĐỐI THOẠI SOCRATIC & BÀI TOÁN KIẾN TRÚC</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white font-serif-display">
            3 Thử Thách Tư Duy Dành Cho Kiến Trúc Sư EdTech
          </h3>

          <div className="flex flex-wrap gap-2 pt-1">
            {thoughtExperiments.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedExperiment(idx)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  selectedExperiment === idx
                    ? 'bg-slate-900 dark:bg-sky-600 text-white border-slate-900 dark:border-sky-500'
                    : 'bg-slate-50 dark:bg-[#151F32] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Bài Toán Socratic #{idx + 1}
              </button>
            ))}
          </div>

          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#151F32] border border-slate-200 dark:border-slate-800 space-y-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
              {thoughtExperiments[selectedExperiment].question}
            </p>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {thoughtExperiments[selectedExperiment].professorAnalysis}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 p-6 bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Code2 className="w-4 h-4 text-[#0284C7] dark:text-sky-400" />
              <span>Lược Đồ Dữ Liệu JSON Thực Tế (SentenceVariation Schema)</span>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              TypeScript Strict
            </span>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900 dark:bg-[#080D1A] border border-slate-800 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed">
            {sampleSentenceJson}
          </pre>
        </div>
      </div>
    </div>
  );
};
