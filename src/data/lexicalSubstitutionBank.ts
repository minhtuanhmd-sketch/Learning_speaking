import { CEFRLevel, PhoneticFocusNote, SentencePattern, SentenceVariation } from '../types/sla';

export interface LexicalSlotEntry {
  phraseEn: string;
  targetWord: string;
  distractors: [string, string, string];
  partOfSpeech: string;
  ipa: string;
  vietnameseHint: string;
  phraseVi: string;
  contextLabel: string;
  l1Trap: PhoneticFocusNote;
}

/**
 * 20-item rich workplace & daily life lexical substitution bank for A2 patterns
 */
const A2_SLOT_VARIATIONS: LexicalSlotEntry[] = [
  {
    phraseEn: 'procurement and purchasing',
    targetWord: 'procurement',
    distractors: ['procure', 'production', 'promotion'],
    partOfSpeech: 'Noun',
    ipa: '/prəˈkjʊə.mənt/',
    vietnameseHint: 'thu mua / mua sắm vật tư (procurement)',
    phraseVi: 'thu mua và cung ứng vật tư',
    contextLabel: 'Phòng Thu mua (Procurement)',
    l1Trap: {
      phoneme: '/pr/ & /nt/',
      exampleWord: 'procurement',
      vietnameseTrap: 'Nhấn sai trọng âm vào âm đầu và bỏ tổ hợp cuối /nt/.',
      articulationTip: 'Nhấn âm hai /prəˈkjʊə.mənt/ và chạm đầu lưỡi lên lợi ở cuối từ.',
    },
  },
  {
    phraseEn: 'human resources',
    targetWord: 'resources',
    distractors: ['resource', 'research', 'records'],
    partOfSpeech: 'Plural Noun',
    ipa: '/rɪˈzɔː.sɪz/',
    vietnameseHint: 'nguồn nhân lực (human resources)',
    phraseVi: 'nhân sự (HR)',
    contextLabel: 'Phòng Nhân sự (HR)',
    l1Trap: {
      phoneme: '/z/ & /sɪz/',
      exampleWord: 'resources',
      vietnameseTrap: 'Bỏ âm tiết số nhiều /ɪz/ ở cuối từ "resources".',
      articulationTip: 'Đọc đủ 3 âm tiết /rɪˈzɔː.sɪz/ với âm rung /z/ ở cuối.',
    },
  },
  {
    phraseEn: 'warehouse logistics',
    targetWord: 'logistics',
    distractors: ['logistic', 'logical', 'locations'],
    partOfSpeech: 'Noun',
    ipa: '/ləˈdʒɪs.tɪks/',
    vietnameseHint: 'hậu cần / điều phối kho vận (logistics)',
    phraseVi: 'hậu cần kho bãi',
    contextLabel: 'Điều phối Kho vận (Logistics)',
    l1Trap: {
      phoneme: '/dʒ/ & /ks/',
      exampleWord: 'logistics',
      vietnameseTrap: 'Bỏ âm /dʒ/ ở giữa và cụm phụ âm cuối /ks/ của "logistics".',
      articulationTip: 'Nhấn âm hai /ləˈdʒɪs.tɪks/ và xì rõ âm /ks/ ở cuối từ.',
    },
  },
  {
    phraseEn: 'accounting and finance',
    targetWord: 'accounting',
    distractors: ['account', 'accountant', 'accounts'],
    partOfSpeech: 'Noun',
    ipa: '/əˈkaʊn.tɪŋ/',
    vietnameseHint: 'kế toán (accounting and finance)',
    phraseVi: 'kế toán và tài chính',
    contextLabel: 'Phòng Kế toán (Accounting)',
    l1Trap: {
      phoneme: '/aʊ/ & /ŋ/',
      exampleWord: 'accounting',
      vietnameseTrap: 'Nhấn sai trọng âm vào âm đầu và đọc nguyên âm đôi /aʊ/ quá phẳng.',
      articulationTip: 'Lướt nhẹ /ə/, nhấn mạnh vào /ˈkaʊn.tɪŋ/.',
    },
  },
  {
    phraseEn: 'customer support',
    targetWord: 'support',
    distractors: ['supported', 'supporting', 'supporter'],
    partOfSpeech: 'Noun',
    ipa: '/səˈpɔːt/',
    vietnameseHint: 'hỗ trợ / chăm sóc khách hàng (customer support)',
    phraseVi: 'hỗ trợ khách hàng',
    contextLabel: 'Chăm sóc Khách hàng (CS)',
    l1Trap: {
      phoneme: '/p/ & /t/',
      exampleWord: 'support',
      vietnameseTrap: 'Đọc "support" thành "súp-pọt" (nhấn âm đầu) và bỏ âm cuối /t/.',
      articulationTip: 'Nhấn trọng âm vào âm tiết thứ hai /səˈpɔːt/.',
    },
  },
  {
    phraseEn: 'technical maintenance',
    targetWord: 'maintenance',
    distractors: ['maintain', 'maintained', 'maintaining'],
    partOfSpeech: 'Noun',
    ipa: '/ˈmeɪn.tən.əns/',
    vietnameseHint: 'bảo trì kỹ thuật (technical maintenance)',
    phraseVi: 'bảo trì kỹ thuật',
    contextLabel: 'Đội Bảo trì (Maintenance)',
    l1Trap: {
          phoneme: '/eɪ/ & /ns/',
          exampleWord: 'maintenance',
          vietnameseTrap: 'Đọc nhầm "maintenance" thành "mên-tên-nần" theo động từ "maintain".',
          articulationTip: 'Nhấn ngay âm đầu /ˈmeɪn.tən.əns/ và kết thúc bằng âm xát /s/.',
    },
  },
  {
    phraseEn: 'workplace safety',
    targetWord: 'safety',
    distractors: ['safe', 'safely', 'saving'],
    partOfSpeech: 'Noun',
    ipa: '/ˈseɪf.ti/',
    vietnameseHint: 'an toàn lao động (workplace safety)',
    phraseVi: 'an toàn lao động tại nơi làm việc',
    contextLabel: 'An toàn HSE (Safety)',
    l1Trap: {
      phoneme: '/ft/',
      exampleWord: 'safety',
      vietnameseTrap: 'Bỏ âm răng môi /f/ giữa hai âm tiết của từ "safety" (đọc thành "xếp-ti").',
      articulationTip: 'Giữ âm /f/ ở cuối âm tiết đầu trước khi bật /ti/: /ˈseɪf.ti/.',
    },
  },
  {
    phraseEn: 'product development',
    targetWord: 'development',
    distractors: ['develop', 'developed', 'developer'],
    partOfSpeech: 'Noun',
    ipa: '/dɪˈvel.əp.mənt/',
    vietnameseHint: 'phát triển sản phẩm (product development)',
    phraseVi: 'phát triển sản phẩm mới',
    contextLabel: 'Nghiên cứu & Phát triển (R&D)',
    l1Trap: {
      phoneme: '/v/ & /nt/',
      exampleWord: 'development',
      vietnameseTrap: 'Bỏ âm /v/ ở âm tiết thứ hai và âm /t/ ở cuối từ "development".',
      articulationTip: 'Nhấn âm hai /dɪˈvel.əp.mənt/ và khép môi nhẹ ở /-əp-/.',
    },
  },
  {
    phraseEn: 'inventory management',
    targetWord: 'inventory',
    distractors: ['invent', 'invention', 'invoice'],
    partOfSpeech: 'Noun',
    ipa: '/ˈɪn.vən.tər.i/',
    vietnameseHint: 'kiểm kê hàng tồn kho (inventory management)',
    phraseVi: 'quản lý hàng tồn kho',
    contextLabel: 'Kiểm kê Kho (Inventory)',
    l1Trap: {
      phoneme: '/nv/',
      exampleWord: 'inventory',
      vietnameseTrap: 'Nhấn sai trọng âm vào âm tiết thứ hai "-ven-" như động từ "invent".',
      articulationTip: 'Nhấn trọng âm chính ngay vào âm tiết đầu tiên: /ˈɪn.vən.tər.i/.',
    },
  },
  {
    phraseEn: 'shipping documentation',
    targetWord: 'documentation',
    distractors: ['document', 'documented', 'documents'],
    partOfSpeech: 'Uncountable Noun',
    ipa: '/ˌdɒk.jə.menˈteɪ.ʃən/',
    vietnameseHint: 'bộ chứng từ xuất nhập khẩu (shipping documentation)',
    phraseVi: 'hồ sơ chứng từ vận chuyển',
    contextLabel: 'Xuất nhập khẩu (Import/Export)',
    l1Trap: {
      phoneme: '/kj/ & /ʃən/',
      exampleWord: 'documentation',
      vietnameseTrap: 'Đọc thiếu âm bán nguyên âm /j/ sau âm /k/ và đặt sai trọng âm.',
      articulationTip: 'Nhấn phụ ở /ˌdɒk/ và nhấn chính ở âm thứ tư /ˈteɪ/: /ˌdɒk.jə.menˈteɪ.ʃən/.',
    },
  },
  {
    phraseEn: 'quarterly budget',
    targetWord: 'quarterly',
    distractors: ['quarter', 'quarters', 'quality'],
    partOfSpeech: 'Adjective/Adverb',
    ipa: '/ˈkwɔː.təl.i/',
    vietnameseHint: 'hàng quý / theo quý (quarterly budget)',
    phraseVi: 'ngân sách hàng quý',
    contextLabel: 'Kế hoạch Tài chính (Finance)',
    l1Trap: {
      phoneme: '/kw/',
      exampleWord: 'quarterly',
      vietnameseTrap: 'Đọc âm đầu /kw/ giống âm "qu" tiếng Việt mà không tròn môi.',
      articulationTip: 'Tròn môi phát âm /ˈkwɔː.təl.i/ với trọng âm ở âm tiết đầu.',
    },
  },
  {
    phraseEn: 'equipment inspection',
    targetWord: 'inspection',
    distractors: ['inspect', 'inspected', 'inspector'],
    partOfSpeech: 'Noun',
    ipa: '/ɪnˈspek.ʃən/',
    vietnameseHint: 'kiểm định / nghiệm thu thiết bị (equipment inspection)',
    phraseVi: 'kiểm tra và nghiệm thu thiết bị',
    contextLabel: 'Nghiệm thu Kỹ thuật (QC)',
    l1Trap: {
      phoneme: '/sp/ & /kʃ/',
      exampleWord: 'inspection',
      vietnameseTrap: 'Bỏ âm /k/ trước âm /ʃən/ trong từ "inspection".',
      articulationTip: 'Nhấn âm hai /ɪnˈspek.ʃən/ với âm chặn /k/ rõ ràng.',
    },
  },
  {
    phraseEn: 'client presentation',
    targetWord: 'presentation',
    distractors: ['present', 'presented', 'presenter'],
    partOfSpeech: 'Noun',
    ipa: '/ˌprez.ənˈteɪ.ʃən/',
    vietnameseHint: 'bài thuyết trình với khách hàng (client presentation)',
    phraseVi: 'buổi thuyết trình với khách hàng',
    contextLabel: 'Kinh doanh & Dự án (Sales)',
    l1Trap: {
      phoneme: '/z/ & /teɪ/',
      exampleWord: 'presentation',
      vietnameseTrap: 'Đọc chữ "s" trong "presentation" thành /s/ thay vì âm hữu thanh /z/.',
      articulationTip: 'Rung âm /z/ ở âm tiết đầu và nhấn chính ở âm thứ ba: /ˌprez.ənˈteɪ.ʃən/.',
    },
  },
  {
    phraseEn: 'training workshop',
    targetWord: 'workshop',
    distractors: ['workplace', 'workflow', 'workload'],
    partOfSpeech: 'Noun',
    ipa: '/ˈwɜːk.ʃɒp/',
    vietnameseHint: 'buổi hội thảo đào tạo thực hành (training workshop)',
    phraseVi: 'buổi đào tạo chuyên đề',
    contextLabel: 'Đào tạo Nội bộ (L&D)',
    l1Trap: {
      phoneme: '/kʃ/ & /p/',
      exampleWord: 'workshop',
      vietnameseTrap: 'Bỏ âm /k/ giữa từ ghép "work-shop" và âm khép môi /p/ ở cuối.',
      articulationTip: 'Cong lưỡi phát âm /ʃɒp/ và khép hai môi giữ âm /p/ ở cuối từ.',
    },
  },
  {
    phraseEn: 'supplier contract',
    targetWord: 'supplier',
    distractors: ['supply', 'supplied', 'supplies'],
    partOfSpeech: 'Noun',
    ipa: '/səˈplaɪ.ər/',
    vietnameseHint: 'nhà cung cấp (supplier contract)',
    phraseVi: 'hợp đồng nhà cung cấp',
    contextLabel: 'Quản lý Nhà cung cấp (Vendor)',
    l1Trap: {
      phoneme: '/pl/',
      exampleWord: 'supplier',
      vietnameseTrap: 'Đọc thiếu âm /l/ trong cụm phụ âm /pl/ của từ "supplier".',
      articulationTip: 'Nhấn âm hai /səˈplaɪ.ər/ với tổ hợp /pl/ bật rõ.',
    },
  },
  {
    phraseEn: 'production schedule',
    targetWord: 'production',
    distractors: ['produce', 'product', 'productive'],
    partOfSpeech: 'Noun',
    ipa: '/prəˈdʌk.ʃən/',
    vietnameseHint: 'sản xuất / chế tạo (production schedule)',
    phraseVi: 'tiến độ sản xuất tại nhà máy',
    contextLabel: 'Điều độ Sản xuất (Production)',
    l1Trap: {
      phoneme: '/pr/ & /kʃ/',
      exampleWord: 'production',
      vietnameseTrap: 'Đọc âm đầu thành "prô" thay vì âm schwa nhẹ /prə/.',
      articulationTip: 'Lướt nhẹ /prə/ và nhấn mạnh vào âm tiết thứ hai /ˈdʌk.ʃən/.',
    },
  },
  {
    phraseEn: 'office administration',
    targetWord: 'administration',
    distractors: ['administer', 'administrative', 'administrator'],
    partOfSpeech: 'Noun',
    ipa: '/ədˌmɪn.ɪˈstreɪ.ʃən/',
    vietnameseHint: 'hành chính văn phòng (office administration)',
    phraseVi: 'hành chính văn phòng',
    contextLabel: 'Hành chính Tổng hợp (Admin)',
    l1Trap: {
      phoneme: '/str/',
      exampleWord: 'administration',
      vietnameseTrap: 'Nhấn sai trọng âm vào âm tiết thứ hai "-min-" thay vì âm thứ tư "-stra-".',
      articulationTip: 'Nhấn phụ ở /-ˌmɪn-/ và nhấn chính ở /-ˈstreɪ-/: /ədˌmɪn.ɪˈstreɪ.ʃən/.',
    },
  },
  {
    phraseEn: 'delivery confirmation',
    targetWord: 'confirmation',
    distractors: ['confirm', 'confirmed', 'confirming'],
    partOfSpeech: 'Noun',
    ipa: '/ˌkɒn.fəˈmeɪ.ʃən/',
    vietnameseHint: 'xác nhận giao hàng (delivery confirmation)',
    phraseVi: 'xác nhận bàn giao đơn hàng',
    contextLabel: 'Giao nhận Hàng hóa (Delivery)',
    l1Trap: {
      phoneme: '/nf/ & /ʃən/',
      exampleWord: 'confirmation',
      vietnameseTrap: 'Đọc lướt mất âm răng môi /f/ ở âm tiết thứ hai "-fir-".',
      articulationTip: 'Nhấn chính vào âm tiết thứ ba: /ˌkɒn.fəˈmeɪ.ʃən/.',
    },
  },
  {
    phraseEn: 'annual performance review',
    targetWord: 'annual',
    distractors: ['annually', 'manual', 'actual'],
    partOfSpeech: 'Adjective',
    ipa: '/ˈæn.ju.əl/',
    vietnameseHint: 'thường niên / hàng năm (annual performance review)',
    phraseVi: 'kỳ đánh giá năng lực hàng năm',
    contextLabel: 'Đánh giá Định kỳ (Review)',
    l1Trap: {
      phoneme: '/nj/',
      exampleWord: 'annual',
      vietnameseTrap: 'Đọc "annual" thành "an-nu-ồ" mà thiếu âm bán nguyên âm /j/ (/ˈæn.ju.əl/).',
      articulationTip: 'Nối mượt âm mũi /n/ sang /ju.əl/ với trọng âm ở âm đầu.',
    },
  },
];

/**
 * 19-item workplace & professional collaboration expansion bank for B1 patterns
 */
const B1_SLOT_VARIATIONS: LexicalSlotEntry[] = [
  {
    phraseEn: 'cross-functional coordination',
    targetWord: 'coordination',
    distractors: ['coordinate', 'coordinated', 'coordinating'],
    partOfSpeech: 'Noun',
    ipa: '/kəʊˌɔː.dɪˈneɪ.ʃən/',
    vietnameseHint: 'sự phối hợp liên phòng ban (cross-functional coordination)',
    phraseVi: 'việc phối hợp chặt chẽ liên phòng ban',
    contextLabel: 'Phối hợp Liên phòng ban',
    l1Trap: {
      phoneme: '/kəʊˌɔː/',
      exampleWord: 'coordination',
      vietnameseTrap: 'Đọc gộp hai nguyên âm đầu của "coordination" và nhấn sai trọng âm.',
      articulationTip: 'Nhấn trọng âm chính vào âm tiết thứ tư: /kəʊˌɔː.dɪˈneɪ.ʃən/.',
    },
  },
  {
    phraseEn: 'preventive maintenance schedules',
    targetWord: 'preventive',
    distractors: ['prevent', 'prevention', 'prevented'],
    partOfSpeech: 'Adjective',
    ipa: '/prɪˈven.tɪv/',
    vietnameseHint: 'mang tính phòng ngừa trước (preventive maintenance)',
    phraseVi: 'lịch bảo trì phòng ngừa định kỳ',
    contextLabel: 'Quản lý Kỹ thuật & Bảo trì',
    l1Trap: {
      phoneme: '/pr/ & /tɪv/',
      exampleWord: 'preventive',
      vietnameseTrap: 'Bỏ âm răng môi /v/ ở cuối tính từ "preventive".',
      articulationTip: 'Nhấn âm hai /prɪˈven.tɪv/ và chạm nhẹ răng trên vào môi dưới ở cuối từ.',
    },
  },
  {
    phraseEn: 'strict quality assurance standards',
    targetWord: 'assurance',
    distractors: ['assure', 'assured', 'insurance'],
    partOfSpeech: 'Noun',
    ipa: '/əˈʃɔː.rəns/',
    vietnameseHint: 'đảm bảo chất lượng (quality assurance)',
    phraseVi: 'các tiêu chuẩn đảm bảo chất lượng nghiêm ngặt',
    contextLabel: 'Đảm bảo Chất lượng (QA/QC)',
    l1Trap: {
      phoneme: '/ʃ/ & /ns/',
      exampleWord: 'assurance',
      vietnameseTrap: 'Đọc âm giữa của "assurance" thành /s/ thay vì âm cong lưỡi /ʃ/.',
      articulationTip: 'Cong lưỡi ở âm tiết thứ hai /əˈʃɔː.rəns/ và xì nhẹ /s/ ở cuối.',
    },
  },
  {
    phraseEn: 'transparent communication channels',
    targetWord: 'transparent',
    distractors: ['transparency', 'transfer', 'transport'],
    partOfSpeech: 'Adjective',
    ipa: '/trænsˈpær.ənt/',
    vietnameseHint: 'minh bạch / rõ ràng (transparent communication)',
    phraseVi: 'kênh thông tin trao đổi minh bạch',
    contextLabel: 'Văn hóa Giao tiếp Dự án',
    l1Trap: {
      phoneme: '/tr/ & /nt/',
      exampleWord: 'transparent',
      vietnameseTrap: 'Bỏ âm /s/ ở giữa "trans-parent" và tổ hợp /nt/ ở cuối từ.',
      articulationTip: 'Nhấn âm hai /trænsˈpær.ənt/ và bật nhẹ âm /t/ cuối từ.',
    },
  },
  {
    phraseEn: 'manpower allocation on site',
    targetWord: 'manpower',
    distractors: ['management', 'manual', 'manufacturing'],
    partOfSpeech: 'Uncountable Noun',
    ipa: '/ˈmænˌpaʊ.ər/',
    vietnameseHint: 'nguồn nhân lực thi công (manpower allocation)',
    phraseVi: 'việc bố trí nhân lực ngoài công trường',
    contextLabel: 'Điều phối Công trường (Site)',
    l1Trap: {
      phoneme: '/æ/ & /aʊ/',
      exampleWord: 'manpower',
      vietnameseTrap: 'Đọc nguyên âm đôi /aʊ/ trong "-power" thành âm đơn.',
      articulationTip: 'Nhấn âm đầu /ˈmænˌpaʊ.ər/ và mở rộng khẩu hình ở phần /-paʊ.ər/.',
    },
  },
  {
    phraseEn: 'technical specification updates',
    targetWord: 'specification',
    distractors: ['specific', 'specify', 'specifically'],
    partOfSpeech: 'Noun',
    ipa: '/ˌspes.ɪ.fɪˈkeɪ.ʃən/',
    vietnameseHint: 'thông số kỹ thuật chi tiết (technical specification)',
    phraseVi: 'các cập nhật về thông số kỹ thuật',
    contextLabel: 'Hồ sơ Kỹ thuật (Specs)',
    l1Trap: {
      phoneme: '/sp/ & /keɪ/',
      exampleWord: 'specification',
      vietnameseTrap: 'Nhấn sai trọng âm của từ 5 âm tiết "specification".',
      articulationTip: 'Nhấn phụ ở /ˌspes/ và nhấn chính ở âm thứ tư /ˈkeɪ/: /ˌspes.ɪ.fɪˈkeɪ.ʃən/.',
    },
  },
  {
    phraseEn: 'subcontractor mobilization progress',
    targetWord: 'mobilization',
    distractors: ['mobilize', 'mobile', 'mobility'],
    partOfSpeech: 'Noun',
    ipa: '/ˌməʊ.bɪ.laɪˈzeɪ.ʃən/',
    vietnameseHint: 'việc huy động lực lượng (mobilization progress)',
    phraseVi: 'tiến độ huy động nhà thầu phụ',
    contextLabel: 'Quản lý Nhà thầu (Subcontractors)',
    l1Trap: {
      phoneme: '/z/ & /ʃən/',
      exampleWord: 'mobilization',
      vietnameseTrap: 'Đọc rời rạc và bỏ âm rung /z/ ở âm tiết thứ tư "-za-".',
      articulationTip: 'Nhấn chính vào âm tiết thứ tư /ˌməʊ.bɪ.laɪˈzeɪ.ʃən/.',
    },
  },
  {
    phraseEn: 'material lead-time constraints',
    targetWord: 'constraints',
    distractors: ['constraint', 'constrain', 'construct'],
    partOfSpeech: 'Plural Noun',
    ipa: '/kənˈstreɪnts/',
    vietnameseHint: 'những giới hạn / ràng buộc (lead-time constraints)',
    phraseVi: 'các giới hạn về thời gian cung ứng vật tư',
    contextLabel: 'Chuỗi Cung ứng (Supply Chain)',
    l1Trap: {
      phoneme: '/str/ & /nts/',
      exampleWord: 'constraints',
      vietnameseTrap: 'Bỏ tổ hợp phụ âm cuối /nts/ của từ "constraints".',
      articulationTip: 'Nhấn âm hai /kənˈstreɪnts/ và xì rõ âm /ts/ ở cuối.',
    },
  },
  {
    phraseEn: 'onboarding training procedures',
    targetWord: 'procedures',
    distractors: ['procedure', 'proceed', 'process'],
    partOfSpeech: 'Plural Noun',
    ipa: '/prəˈsiː.dʒəz/',
    vietnameseHint: 'các quy trình thực hiện (training procedures)',
    phraseVi: 'quy trình đào tạo hội nhập nhân sự mới',
    contextLabel: 'Tuyển dụng & Hội nhập (HR)',
    l1Trap: {
      phoneme: '/dʒ/ & /z/',
      exampleWord: 'procedures',
      vietnameseTrap: 'Đọc âm "-dure" thành "đua" thay vì âm tắc xát /dʒəz/.',
      articulationTip: 'Nhấn âm hai /prəˈsiː.dʒəz/ và rung âm /z/ ở cuối.',
    },
  },
  {
    phraseEn: 'software integration testing',
    targetWord: 'integration',
    distractors: ['integrate', 'integrated', 'integrity'],
    partOfSpeech: 'Noun',
    ipa: '/ˌɪn.tɪˈɡreɪ.ʃən/',
    vietnameseHint: 'việc tích hợp hệ thống (software integration)',
    phraseVi: 'kiểm thử tích hợp phần mềm',
    contextLabel: 'Công nghệ & Hệ thống (IT)',
    l1Trap: {
      phoneme: '/ɡr/',
      exampleWord: 'integration',
      vietnameseTrap: 'Bỏ âm /r/ trong cụm /ɡr/ ở âm tiết thứ ba "-gra-".',
      articulationTip: 'Nhấn chính vào âm tiết thứ ba: /ˌɪn.tɪˈɡreɪ.ʃən/.',
    },
  },
  {
    phraseEn: 'budgetary approval workflows',
    targetWord: 'budgetary',
    distractors: ['budget', 'budgets', 'budgeted'],
    partOfSpeech: 'Adjective',
    ipa: '/ˈbʌdʒ.ɪ.tər.i/',
    vietnameseHint: 'thuộc về ngân sách (budgetary approval)',
    phraseVi: 'luồng phê duyệt ngân sách',
    contextLabel: 'Kiểm soát Ngân sách',
    l1Trap: {
      phoneme: '/dʒ/',
      exampleWord: 'budgetary',
      vietnameseTrap: 'Nhấn sai trọng âm vào âm tiết thứ ba thay vì âm đầu.',
      articulationTip: 'Nhấn ngay âm tiết đầu tiên: /ˈbʌdʒ.ɪ.tər.i/.',
    },
  },
  {
    phraseEn: 'safety compliance inspections',
    targetWord: 'compliance',
    distractors: ['comply', 'compliant', 'complied'],
    partOfSpeech: 'Uncountable Noun',
    ipa: '/kəmˈplaɪ.əns/',
    vietnameseHint: 'sự tuân thủ quy định (safety compliance)',
    phraseVi: 'các đợt thanh tra tuân thủ an toàn',
    contextLabel: 'Tuân thủ An toàn (HSE)',
    l1Trap: {
      phoneme: '/pl/ & /ns/',
      exampleWord: 'compliance',
      vietnameseTrap: 'Bỏ âm xát cuối /s/ trong danh từ "compliance".',
      articulationTip: 'Nhấn âm hai /kəmˈplaɪ.əns/ và giữ rõ âm /s/ ở cuối.',
    },
  },
  {
    phraseEn: 'client feedback implementation',
    targetWord: 'implementation',
    distractors: ['implement', 'implemented', 'implementing'],
    partOfSpeech: 'Noun',
    ipa: '/ˌɪm.plɪ.menˈteɪ.ʃən/',
    vietnameseHint: 'việc triển khai thực thi (implementation)',
    phraseVi: 'việc triển khai các góp ý của khách hàng',
    contextLabel: 'Quản trị Khách hàng',
    l1Trap: {
      phoneme: '/pl/ & /teɪ/',
      exampleWord: 'implementation',
      vietnameseTrap: 'Đọc sai nhịp trọng âm của từ 5 âm tiết "implementation".',
      articulationTip: 'Nhấn phụ ở /ˌɪm/ và nhấn chính ở âm thứ tư /ˈteɪ/: /ˌɪm.plɪ.menˈteɪ.ʃən/.',
    },
  },
  {
    phraseEn: 'emergency contingency plans',
    targetWord: 'emergency',
    distractors: ['emerge', 'emerging', 'emergencies'],
    partOfSpeech: 'Noun Adjunct',
    ipa: '/ɪˈmɜː.dʒən.si/',
    vietnameseHint: 'khẩn cấp / ứng phó sự cố (emergency contingency)',
    phraseVi: 'phương án dự phòng khẩn cấp',
    contextLabel: 'Xử lý Sự cố Khẩn cấp',
    l1Trap: {
      phoneme: '/ɜː/ & /dʒ/',
      exampleWord: 'emergency',
      vietnameseTrap: 'Nhấn sai trọng âm vào âm đầu và đọc thiếu âm /dʒ/.',
      articulationTip: 'Nhấn âm tiết thứ hai /ɪˈmɜː.dʒən.si/.',
    },
  },
  {
    phraseEn: 'vendor evaluation criteria',
    targetWord: 'criteria',
    distractors: ['criterion', 'critical', 'criticism'],
    partOfSpeech: 'Plural Noun',
    ipa: '/kraɪˈtɪə.ri.ə/',
    vietnameseHint: 'các tiêu chí đánh giá (evaluation criteria)',
    phraseVi: 'bộ tiêu chí đánh giá nhà cung cấp',
    contextLabel: 'Đấu thầu & Mua sắm',
    l1Trap: {
      phoneme: '/kr/ & /tɪə/',
      exampleWord: 'criteria',
      vietnameseTrap: 'Đọc âm đầu "cri-" thành "cri" thay vì nguyên âm đôi /kraɪ/.',
      articulationTip: 'Phát âm rõ /kraɪˈtɪə.ri.ə/ với trọng âm ở âm tiết thứ hai.',
    },
  },
  {
    phraseEn: 'fabrication yard productivity',
    targetWord: 'fabrication',
    distractors: ['fabricate', 'fabricated', 'factory'],
    partOfSpeech: 'Noun',
    ipa: '/ˌfæb.rɪˈkeɪ.ʃən/',
    vietnameseHint: 'chế tạo cơ khí / kết cấu (fabrication yard)',
    phraseVi: 'năng suất tại bãi chế tạo',
    contextLabel: 'Chế tạo & Công trường',
    l1Trap: {
      phoneme: '/br/',
      exampleWord: 'fabrication',
      vietnameseTrap: 'Bỏ âm /r/ trong tổ hợp /br/ ở âm tiết thứ hai.',
      articulationTip: 'Nhấn chính vào âm tiết thứ ba: /ˌfæb.rɪˈkeɪ.ʃən/.',
    },
  },
  {
    phraseEn: 'overtime compensation policies',
    targetWord: 'compensation',
    distractors: ['compensate', 'compensated', 'competition'],
    partOfSpeech: 'Noun',
    ipa: '/ˌkɒm.penˈseɪ.ʃən/',
    vietnameseHint: 'chế độ đãi ngộ / đền bù làm thêm giờ (compensation)',
    phraseVi: 'chính sách đãi ngộ làm thêm giờ',
    contextLabel: 'Chế độ Phúc lợi (C&B)',
    l1Trap: {
      phoneme: '/mp/ & /seɪ/',
      exampleWord: 'compensation',
      vietnameseTrap: 'Nhầm lẫn giữa "compensation" (đãi ngộ) và "competition" (cạnh tranh).',
      articulationTip: 'Khép môi âm /m/ trước /p/ ở /ˌkɒm.penˈseɪ.ʃən/.',
    },
  },
  {
    phraseEn: 'shipment tracking accuracy',
    targetWord: 'accuracy',
    distractors: ['accurate', 'accurately', 'account'],
    partOfSpeech: 'Uncountable Noun',
    ipa: '/ˈæk.jə.rə.si/',
    vietnameseHint: 'độ chính xác (tracking accuracy)',
    phraseVi: 'độ chính xác khi theo dõi lô hàng',
    contextLabel: 'Vận tải & Giao nhận',
    l1Trap: {
      phoneme: '/kj/',
      exampleWord: 'accuracy',
      vietnameseTrap: 'Nhấn sai trọng âm vào âm hai và bỏ âm /j/ sau âm /k/.',
      articulationTip: 'Nhấn ngay âm tiết đầu tiên: /ˈæk.jə.rə.si/.',
    },
  },
  {
    phraseEn: 'post-project review findings',
    targetWord: 'findings',
    distractors: ['finding', 'find', 'founded'],
    partOfSpeech: 'Plural Noun',
    ipa: '/ˈfaɪn.dɪŋz/',
    vietnameseHint: 'các kết quả / phát hiện rút ra (review findings)',
    phraseVi: 'các kết luận đúc kết sau dự án',
    contextLabel: 'Tổng kết Dự án (Retrospective)',
    l1Trap: {
      phoneme: '/nd/ & /ŋz/',
      exampleWord: 'findings',
      vietnameseTrap: 'Bỏ âm rung số nhiều /z/ sau âm mũi /ŋ/ ở cuối từ "findings".',
      articulationTip: 'Ngân âm /ŋ/ rồi rung nhẹ dây thanh quản tạo âm /z/: /ˈfaɪn.dɪŋz/.',
    },
  },
];

/**
 * 19-item executive negotiation, governance & strategy expansion bank for B2 patterns
 */
const B2_SLOT_VARIATIONS: LexicalSlotEntry[] = [
  {
    phraseEn: 'long-term operational sustainability',
    targetWord: 'sustainability',
    distractors: ['sustainable', 'sustain', 'sustained'],
    partOfSpeech: 'Uncountable Noun',
    ipa: '/səˌsteɪ.nəˈbɪl.ə.ti/',
    vietnameseHint: 'tính bền vững (operational sustainability)',
    phraseVi: 'tính bền vững trong vận hành dài hạn',
    contextLabel: 'Chiến lược Vận hành (Operations)',
    l1Trap: {
      phoneme: '/st/ & /bɪl/',
      exampleWord: 'sustainability',
      vietnameseTrap: 'Đọc thiếu âm /s/ ở giữa cụm "-stain-" và đặt sai trọng âm.',
      articulationTip: 'Nhấn phụ ở /-ˌsteɪ-/ và nhấn chính ở /-ˈbɪl-/: /səˌsteɪ.nəˈbɪl.ə.ti/.',
    },
  },
  {
    phraseEn: 'cross-border supply chain resilience',
    targetWord: 'resilience',
    distractors: ['resilient', 'resistance', 'reliance'],
    partOfSpeech: 'Uncountable Noun',
    ipa: '/rɪˈzɪl.i.əns/',
    vietnameseHint: 'khả năng chống chịu và phục hồi (supply chain resilience)',
    phraseVi: 'khả năng thích ứng của chuỗi cung ứng xuyên biên giới',
    contextLabel: 'Quản trị Chuỗi cung ứng',
    l1Trap: {
      phoneme: '/z/ & /ns/',
      exampleWord: 'resilience',
      vietnameseTrap: 'Đọc chữ "s" trong "resilience" thành /s/ thay vì âm hữu thanh /z/.',
      articulationTip: 'Nhấn âm hai /rɪˈzɪl.i.əns/ và kết thúc bằng âm xát /s/.',
    },
  },
  {
    phraseEn: 'capital expenditure optimization',
    targetWord: 'expenditure',
    distractors: ['expensive', 'expand', 'expansion'],
    partOfSpeech: 'Noun',
    ipa: '/ɪkˈspen.dɪ.tʃər/',
    vietnameseHint: 'chi phí đầu tư vốn (capital expenditure - CAPEX)',
    phraseVi: 'tối ưu hóa chi phí đầu tư vốn (CAPEX)',
    contextLabel: 'Hoạch định Tài chính (CAPEX)',
    l1Trap: {
      phoneme: '/ksp/ & /tʃər/',
      exampleWord: 'expenditure',
      vietnameseTrap: 'Bỏ âm /k/ ở âm tiết đầu và đọc "-ture" thành "tua".',
      articulationTip: 'Nhấn âm hai /ɪkˈspen.dɪ.tʃər/ với âm tắc xát /tʃ/ rõ ràng.',
    },
  },
  {
    phraseEn: 'contractual penalty clauses',
    targetWord: 'contractual',
    distractors: ['contract', 'contractor', 'contraction'],
    partOfSpeech: 'Adjective',
    ipa: '/kənˈtræk.tʃu.əl/',
    vietnameseHint: 'thuộc về hợp đồng (contractual penalty clauses)',
    phraseVi: 'các điều khoản chế tài trong hợp đồng',
    contextLabel: 'Đàm phán Pháp lý & Hợp đồng',
    l1Trap: {
      phoneme: '/ktʃ/',
      exampleWord: 'contractual',
      vietnameseTrap: 'Bỏ âm /k/ trước âm /tʃu.əl/ trong tính từ "contractual".',
      articulationTip: 'Nhấn âm hai /kənˈtræk.tʃu.əl/ và giữ nhịp mượt ở 4 âm tiết.',
    },
  },
  {
    phraseEn: 'quarterly revenue projections',
    targetWord: 'projections',
    distractors: ['projection', 'project', 'projected'],
    partOfSpeech: 'Plural Noun',
    ipa: '/prəˈdʒek.ʃənz/',
    vietnameseHint: 'các dự phóng / dự báo số liệu (revenue projections)',
    phraseVi: 'các dự phóng doanh thu hàng quý',
    contextLabel: 'Báo cáo Ban Giám đốc',
    l1Trap: {
      phoneme: '/dʒ/ & /nz/',
      exampleWord: 'projections',
      vietnameseTrap: 'Nhấn trọng âm vào âm đầu giống danh từ "project".',
      articulationTip: 'Với "projections", nhấn trọng âm vào âm tiết thứ hai: /prəˈdʒek.ʃənz/.',
    },
  },
  {
    phraseEn: 'workforce retention initiatives',
    targetWord: 'retention',
    distractors: ['retain', 'retained', 'attention'],
    partOfSpeech: 'Uncountable Noun',
    ipa: '/rɪˈten.ʃən/',
    vietnameseHint: 'việc giữ chân nhân tài (workforce retention)',
    phraseVi: 'các sáng kiến giữ chân đội ngũ nhân sự chủ chốt',
    contextLabel: 'Chiến lược Nhân sự (HR Strategy)',
    l1Trap: {
      phoneme: '/ten/ & /ʃən/',
      exampleWord: 'retention',
      vietnameseTrap: 'Đọc âm đầu thành "ri-tên-sần" thay vì nguyên âm /e/ (/rɪˈten.ʃən/).',
      articulationTip: 'Nhấn rõ âm tiết thứ hai /ˈten/ và cong lưỡi ở /ʃən/.',
    },
  },
  {
    phraseEn: 'regulatory compliance audits',
    targetWord: 'regulatory',
    distractors: ['regulate', 'regulation', 'regular'],
    partOfSpeech: 'Adjective',
    ipa: '/ˈreɡ.jə.lə.tər.i/',
    vietnameseHint: 'thuộc về quy chế / pháp quy (regulatory compliance)',
    phraseVi: 'các kỳ kiểm toán tuân thủ pháp quy',
    contextLabel: 'Kiểm toán & Pháp chế',
    l1Trap: {
      phoneme: '/ɡj/',
      exampleWord: 'regulatory',
      vietnameseTrap: 'Nhấn sai trọng âm vào âm tiết thứ ba "-la-" như danh từ "regulation".',
      articulationTip: 'Tính từ "regulatory" nhấn trọng âm ngay ở âm tiết đầu: /ˈreɡ.jə.lə.tər.i/.',
    },
  },
  {
    phraseEn: 'turnkey project deliverables',
    targetWord: 'deliverables',
    distractors: ['deliverable', 'delivery', 'deliver'],
    partOfSpeech: 'Plural Noun',
    ipa: '/dɪˈlɪv.ər.ə.bəlz/',
    vietnameseHint: 'các hạng mục bàn giao (project deliverables)',
    phraseVi: 'các hạng mục bàn giao của dự án chìa khóa trao tay',
    contextLabel: 'Quản trị Dự án EPC',
    l1Trap: {
      phoneme: '/v/ & /bəlz/',
      exampleWord: 'deliverables',
      vietnameseTrap: 'Bỏ âm số nhiều /z/ sau âm /l/ ở cuối từ "deliverables".',
      articulationTip: 'Nhấn âm hai /dɪˈlɪv.ər.ə.bəlz/ và rung nhẹ âm /z/ ở cuối.',
    },
  },
  {
    phraseEn: 'stakeholder alignment sessions',
    targetWord: 'alignment',
    distractors: ['align', 'aligned', 'aligning'],
    partOfSpeech: 'Uncountable Noun',
    ipa: '/əˈlaɪn.mənt/',
    vietnameseHint: 'sự đồng thuận / thống nhất định hướng (stakeholder alignment)',
    phraseVi: 'các phiên họp thống nhất định hướng giữa các bên liên quan',
    contextLabel: 'Quản lý Các bên liên quan',
    l1Trap: {
      phoneme: '/nm/ & /nt/',
      exampleWord: 'alignment',
      vietnameseTrap: 'Phát âm nhầm chữ "g" câm trong "alignment" và bỏ âm cuối /t/.',
      articulationTip: 'Chữ "g" hoàn toàn câm: đọc mượt /əˈlaɪn.mənt/.',
    },
  },
  {
    phraseEn: 'quality control bottlenecks',
    targetWord: 'bottlenecks',
    distractors: ['bottleneck', 'barriers', 'obstacles'],
    partOfSpeech: 'Plural Noun',
    ipa: '/ˈbɒt.əl.neks/',
    vietnameseHint: 'các điểm nghẽn (quality control bottlenecks)',
    phraseVi: 'các điểm nghẽn trong khâu kiểm soát chất lượng',
    contextLabel: 'Tối ưu Quy trình Sản xuất',
    l1Trap: {
      phoneme: '/ks/',
      exampleWord: 'bottlenecks',
      vietnameseTrap: 'Bỏ tổ hợp phụ âm cuối /ks/ của danh từ số nhiều "bottlenecks".',
      articulationTip: 'Nhấn âm đầu /ˈbɒt.əl.neks/ và xì rõ cụm /ks/ ở cuối.',
    },
  },
  {
    phraseEn: 'automated data analytics',
    targetWord: 'analytics',
    distractors: ['analysis', 'analyze', 'analytical'],
    partOfSpeech: 'Noun',
    ipa: '/ˌæn.əˈlɪt.ɪks/',
    vietnameseHint: 'phân tích dữ liệu chuyên sâu (data analytics)',
    phraseVi: 'hệ thống phân tích dữ liệu tự động',
    contextLabel: 'Chuyển đổi Số (Digital)',
    l1Trap: {
      phoneme: '/ks/',
      exampleWord: 'analytics',
      vietnameseTrap: 'Nhầm trọng âm của "analytics" (/ˌæn.əˈlɪt.ɪks/) với "analysis" (/əˈnæl.ə.sɪs/).',
      articulationTip: 'Nhấn trọng âm chính vào âm tiết thứ ba /-ˈlɪt-/ và bật âm /ks/ ở cuối.',
    },
  },
  {
    phraseEn: 'preventative risk mitigation',
    targetWord: 'mitigation',
    distractors: ['mitigate', 'mitigated', 'migration'],
    partOfSpeech: 'Uncountable Noun',
    ipa: '/ˌmɪt.ɪˈɡeɪ.ʃən/',
    vietnameseHint: 'việc giảm thiểu rủi ro (risk mitigation)',
    phraseVi: 'các biện pháp giảm thiểu rủi ro từ sớm',
    contextLabel: 'Quản trị Rủi ro (Risk Management)',
    l1Trap: {
      phoneme: '/ɡeɪ/',
      exampleWord: 'mitigation',
      vietnameseTrap: 'Nhầm lẫn giữa "mitigation" (giảm thiểu rủi ro) và "migration" (di trú/chuyển đổi).',
      articulationTip: 'Đọc đủ 4 âm tiết /ˌmɪt.ɪˈɡeɪ.ʃən/ với trọng âm chính ở âm thứ ba.',
    },
  },
  {
    phraseEn: 'bilateral commercial agreements',
    targetWord: 'commercial',
    distractors: ['commerce', 'commercially', 'commission'],
    partOfSpeech: 'Adjective',
    ipa: '/kəˈmɜː.ʃəl/',
    vietnameseHint: 'thuộc về thương mại (commercial agreements)',
    phraseVi: 'các thỏa thuận thương mại song phương',
    contextLabel: 'Đàm phán Thương mại',
    l1Trap: {
      phoneme: '/ɜː/ & /ʃəl/',
      exampleWord: 'commercial',
      vietnameseTrap: 'Đọc âm đầu thành "côm-" thay vì âm schwa nhẹ /kə/ và thiếu âm cong lưỡi /ʃ/.',
      articulationTip: 'Nhấn âm hai /kəˈmɜː.ʃəl/ và nâng đầu lưỡi ở cuối từ.',
    },
  },
  {
    phraseEn: 'high-priority fabrication milestones',
    targetWord: 'milestones',
    distractors: ['milestone', 'deadlines', 'schedules'],
    partOfSpeech: 'Plural Noun',
    ipa: '/ˈmaɪl.stəʊnz/',
    vietnameseHint: 'các cột mốc tiến độ trọng yếu (fabrication milestones)',
    phraseVi: 'các cột mốc chế tạo có độ ưu tiên cao',
    contextLabel: 'Điều hành Dự án Trọng điểm',
    l1Trap: {
      phoneme: '/l/ & /nz/',
      exampleWord: 'milestones',
      vietnameseTrap: 'Bỏ âm /l/ ở giữa từ ghép và âm rung /z/ ở cuối.',
      articulationTip: 'Giữ âm /l/ ở /ˈmaɪl/ rồi chuyển sang /stəʊnz/.',
    },
  },
  {
    phraseEn: 'post-handover warranty obligations',
    targetWord: 'obligations',
    distractors: ['obligation', 'obligate', 'obligatory'],
    partOfSpeech: 'Plural Noun',
    ipa: '/ˌɒb.lɪˈɡeɪ.ʃənz/',
    vietnameseHint: 'các nghĩa vụ cam kết (warranty obligations)',
    phraseVi: 'nghĩa vụ bảo hành sau bàn giao',
    contextLabel: 'Hậu mãi & Bảo hành Dự án',
    l1Trap: {
      phoneme: '/bl/ & /nz/',
      exampleWord: 'obligations',
      vietnameseTrap: 'Bỏ âm rung số nhiều /z/ ở cuối danh từ "obligations".',
      articulationTip: 'Nhấn chính vào âm thứ ba /ˌɒb.lɪˈɡeɪ.ʃənz/ và rung âm /z/ ở cuối.',
    },
  },
  {
    phraseEn: 'resource reallocation proposals',
    targetWord: 'proposals',
    distractors: ['proposal', 'propose', 'purpose'],
    partOfSpeech: 'Plural Noun',
    ipa: '/prəˈpəʊ.zəlz/',
    vietnameseHint: 'các đề xuất / phương án trình duyệt (proposals)',
    phraseVi: 'các đề xuất phân bổ lại nguồn lực',
    contextLabel: 'Trình duyệt Ban Giám đốc',
    l1Trap: {
      phoneme: '/zəlz/',
      exampleWord: 'proposals',
      vietnameseTrap: 'Nhầm lẫn giữa "proposals" (/prəˈpəʊ.zəlz/) và "purposes" (/ˈpɜː.pə.sɪz/).',
      articulationTip: 'Nhấn âm hai với nguyên âm đôi /əʊ/ và kết thúc bằng cụm hữu thanh /zəlz/.',
    },
  },
  {
    phraseEn: 'subcontractor performance benchmarks',
    targetWord: 'benchmarks',
    distractors: ['benchmark', 'standards', 'targets'],
    partOfSpeech: 'Plural Noun',
    ipa: '/ˈbentʃ.mɑːks/',
    vietnameseHint: 'các mốc chuẩn đối chiếu (performance benchmarks)',
    phraseVi: 'các tiêu chuẩn đo lường năng lực nhà thầu phụ',
    contextLabel: 'Đánh giá Nhà thầu',
    l1Trap: {
      phoneme: '/tʃ/ & /ks/',
      exampleWord: 'benchmarks',
      vietnameseTrap: 'Bỏ âm /tʃ/ ở giữa từ ghép "bench-marks" và cụm /ks/ ở cuối.',
      articulationTip: 'Bật rõ /ˈbentʃ.mɑːks/ với hai trọng âm phụ - chính rõ nét.',
    },
  },
  {
    phraseEn: 'procurement cost-reduction targets',
    targetWord: 'targets',
    distractors: ['target', 'targeted', 'targeting'],
    partOfSpeech: 'Plural Noun',
    ipa: '/ˈtɑː.ɡɪts/',
    vietnameseHint: 'các chỉ tiêu / mục tiêu (cost-reduction targets)',
    phraseVi: 'chỉ tiêu cắt giảm chi phí mua sắm',
    contextLabel: 'Tối ưu Chi phí (Cost Control)',
    l1Trap: {
      phoneme: '/ɡ/ & /ts/',
      exampleWord: 'targets',
      vietnameseTrap: 'Đọc chữ "g" trong "targets" thành /dʒ/ thay vì âm tắc /ɡ/ và bỏ /ts/.',
      articulationTip: 'Phát âm rõ âm /ɡ/ cứng: /ˈtɑː.ɡɪts/.',
    },
  },
  {
    phraseEn: 'seamless interdepartmental execution',
    targetWord: 'execution',
    distractors: ['execute', 'executive', 'executed'],
    partOfSpeech: 'Uncountable Noun',
    ipa: '/ˌek.sɪˈkjuː.ʃən/',
    vietnameseHint: 'việc triển khai thực thi (seamless execution)',
    phraseVi: 'việc triển khai nhịp nhàng giữa các bộ phận',
    contextLabel: 'Điều hành Chiến lược',
    l1Trap: {
      phoneme: '/ks/ & /kjuː/',
      exampleWord: 'execution',
      vietnameseTrap: 'Bỏ âm /ks/ ở đầu và âm bán nguyên âm /j/ trong "-cu-".',
      articulationTip: 'Nhấn trọng âm chính vào âm tiết thứ ba: /ˌek.sɪˈkjuː.ʃən/.',
    },
  },
];

const THEMATIC_GROUP_TITLES: Record<CEFRLevel, Record<number, string>> = {
  A2: {
    1: '1. Chào hỏi, Giới thiệu & Làm quen (Mẫu 1 – 10)',
    2: '2. Hỏi thông tin & Xác nhận cơ bản (Mẫu 11 – 20)',
    3: '3. Nhờ hỗ trợ & Đề nghị tại văn phòng (Mẫu 21 – 30)',
    4: '4. Lịch hẹn, Điện thoại & Email cơ bản (Mẫu 31 – 40)',
    5: '5. Báo cáo trạng thái công việc & Thời gian (Mẫu 41 – 50)',
    6: '6. Giao tiếp xã hội & Đời sống thực tế (Mẫu 51 – 60)',
  },
  B1: {
    1: '1. Nêu quan điểm, Đồng tình & Phản biện lịch sự (Mẫu 1 – 10)',
    2: '2. Họp hành & Thảo luận nhóm (Mẫu 11 – 20)',
    3: '3. Tuyển dụng, Phỏng vấn & Nhân sự (Mẫu 21 – 30)',
    4: '4. Giải quyết vấn đề & Xử lý sự cố phát sinh (Mẫu 31 – 40)',
    5: '5. Giao tiếp qua Email & Phối hợp liên phòng ban (Mẫu 41 – 50)',
    6: '6. Giao tiếp xã hội mở rộng & Chia sẻ kinh nghiệm (Mẫu 51 – 60)',
  },
  B2: {
    1: '1. Điều hành cuộc họp & Thuyết trình chuyên nghiệp (Mẫu 1 – 10)',
    2: '2. Đàm phán & Thương lượng (Mẫu 11 – 20)',
    3: '3. Đánh giá năng lực, Phản hồi & Quản trị Nhân sự (Mẫu 21 – 30)',
    4: '4. Quản lý dự án, Tiến độ & Báo cáo cấp trên (Mẫu 31 – 40)',
    5: '5. Xử lý khủng hoảng, Từ chối khéo léo & Ngoại giao (Mẫu 41 – 50)',
    6: '6. Thảo luận chiến lược & Phân tích chuyên sâu (Mẫu 51 – 60)',
  },
};

/**
 * Contextual connectors to expand fixed patterns (those without [...]) into 19 natural workplace/life variations
 * while preserving the exact core sentence structure at the beginning!
 */
function buildExpandedVariationFromSlot(
  seed: SentenceVariation,
  cefrLevel: CEFRLevel,
  slotEntry: LexicalSlotEntry,
  variationIndex: number // 2 to 20
): SentenceVariation {
  const baseTemplate = seed.patternTemplate;
  let fullSentence = '';
  let clozeTemplate = '';
  let vietnameseTranslation = '';

  const baseViClean = seed.vietnameseTranslation.replace(/\s*\[.*?\]\s*$/g, '').trim();

  if (baseTemplate && baseTemplate.includes('[...]')) {
    // Replace [...] with the new lexical slot phrase!
    // If there are multiple [...], replace the first with phraseEn and any subsequent with a natural workplace anchor
    let occurrence = 0;
    fullSentence = baseTemplate.replace(/\[\.\.\.\]/g, () => {
      occurrence += 1;
      if (occurrence === 1) return slotEntry.phraseEn;
      return 'our main facility';
    });

    // Replace targetWord inside fullSentence with ___ for the Cloze exercise
    const escapedTarget = slotEntry.targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedTarget}\\b`, 'i');
    if (regex.test(fullSentence)) {
      clozeTemplate = fullSentence.replace(regex, '___');
    } else {
      clozeTemplate = fullSentence.replace(slotEntry.targetWord, '___');
    }

    vietnameseTranslation = `${baseViClean} — Biến thể #${variationIndex}: áp dụng cho "${slotEntry.phraseVi}" (${slotEntry.contextLabel}).`;
  } else {
    // Expand a fixed canonical sentence by pairing it with a realistic workplace/daily-life clause using slotEntry.phraseEn
    const cleanSeed = seed.fullSentence.trim();
    const endsWithQuestion = cleanSeed.endsWith('?');
    const endsWithExclamation = cleanSeed.endsWith('!');
    const stem = cleanSeed.replace(/[.?!]+$/, '');

    if (endsWithQuestion) {
      fullSentence = `${stem} regarding ${slotEntry.phraseEn}?`;
    } else if (endsWithExclamation) {
      fullSentence = `${stem} after completing ${slotEntry.phraseEn}!`;
    } else {
      fullSentence = `${stem} for ${slotEntry.phraseEn}.`;
    }

    const escapedTarget = slotEntry.targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedTarget}\\b`, 'i');
    if (regex.test(fullSentence)) {
      clozeTemplate = fullSentence.replace(regex, '___');
    } else {
      clozeTemplate = fullSentence.replace(slotEntry.targetWord, '___');
    }

    vietnameseTranslation = `${baseViClean} (Mở rộng ngữ cảnh #${variationIndex} về ${slotEntry.phraseVi} — ${slotEntry.contextLabel}).`;
  }

  return {
    id: `${seed.id}-v${variationIndex}`,
    index: variationIndex,
    levelSentenceNumber: seed.levelSentenceNumber,
    patternTemplate: seed.patternTemplate || seed.fullSentence,
    fullSentence,
    clozeTemplate,
    targetWord: slotEntry.targetWord,
    distractors: [...slotEntry.distractors],
    partOfSpeech: slotEntry.partOfSpeech,
    ipa: slotEntry.ipa,
    vietnameseHint: slotEntry.vietnameseHint,
    vietnameseTranslation,
    pragmaticContext: `${slotEntry.contextLabel} · Biến thể ${variationIndex}/20 (${cefrLevel})`,
    l1PhoneticTrap: slotEntry.l1Trap,
  };
}

/**
 * Promotes the 3 modules (×20 sentences = 60 canonical sentences) of a CEFR level
 * into 60 full SentencePattern objects, each containing 20 contextual variations (1,200 sentences per level).
 */
export function expandLevelTo60PatternsWith20Variations(
  levelModules: SentencePattern[],
  cefrLevel: CEFRLevel
): SentencePattern[] {
  const allSeeds: SentenceVariation[] = levelModules.flatMap((m) => m.sentences);
  const slotBank =
    cefrLevel === 'A2'
      ? A2_SLOT_VARIATIONS
      : cefrLevel === 'B1'
      ? B1_SLOT_VARIATIONS
      : B2_SLOT_VARIATIONS;

  return allSeeds.map((seed, idx) => {
    const patternNum = seed.levelSentenceNumber || idx + 1; // 1 to 60
    const thematicGroupId = Math.min(6, Math.floor((patternNum - 1) / 10) + 1);
    const thematicGroupTitle = THEMATIC_GROUP_TITLES[cefrLevel][thematicGroupId];
    const displayPattern = seed.patternTemplate || seed.fullSentence;
    const cleanMeaningVi = seed.vietnameseTranslation.replace(/\s*\[.*?\]\s*$/g, '').trim();

    // Variation #1 is the canonical sentence itself
    const canonicalVariation: SentenceVariation = {
      ...seed,
      id: `${cefrLevel.toLowerCase()}-pat-${patternNum}-v1`,
      index: 1,
      levelSentenceNumber: patternNum,
      patternTemplate: displayPattern,
      pragmaticContext: `Câu gốc chuẩn #1/20 · ${thematicGroupTitle}`,
    };

    // Variations #2..#20 rotate deterministically based on patternNum so each pattern starts with a different workplace domain
    const expandedVariations: SentenceVariation[] = [];
    for (let v = 2; v <= 20; v++) {
      const bankIdx = (patternNum + v - 2) % slotBank.length;
      const slotEntry = slotBank[bankIdx];
      expandedVariations.push(
        buildExpandedVariationFromSlot(
          {
            ...seed,
            id: `${cefrLevel.toLowerCase()}-pat-${patternNum}`,
          },
          cefrLevel,
          slotEntry,
          v
        )
      );
    }

    return {
      id: `${cefrLevel.toLowerCase()}-pattern-${String(patternNum).padStart(2, '0')}`,
      cefrLevel,
      patternNumberInLevel: patternNum,
      thematicGroupId,
      thematicGroupTitle,
      patternTitle: `Mẫu #${String(patternNum).padStart(2, '0')}: ${displayPattern}`,
      formula: displayPattern,
      vietnameseMeaning: cleanMeaningVi,
      slaRationale:
        cefrLevel === 'A2'
          ? 'Tự động hóa phản xạ giao tiếp cơ bản (A2 Elementary) qua 20 tình huống thay thế từ vựng tại văn phòng, nhà máy và đời sống.'
          : cefrLevel === 'B1'
          ? 'Làm chủ cấu trúc thảo luận, phối hợp liên phòng ban và xử lý sự cố (B1 Intermediate) qua 20 biến thể ngữ cảnh thực chiến.'
          : 'Thuần thục ngôn ngữ điều hành, đàm phán hợp đồng, quản trị dự án và chiến lược cấp cao (B2 Upper-Intermediate) qua 20 biến thể chuyên sâu.',
      pragmaticUsage: `Thuộc nhóm "${thematicGroupTitle}" — Luyện nói 20 biến thể liên hoàn để phản xạ tức thì không cần dịch nhẩm.`,
      l1InterferenceOverview: `${seed.l1PhoneticTrap.vietnameseTrap} (${seed.l1PhoneticTrap.phoneme} — ${seed.l1PhoneticTrap.exampleWord})`,
      sentences: [canonicalVariation, ...expandedVariations],
    };
  });
}
