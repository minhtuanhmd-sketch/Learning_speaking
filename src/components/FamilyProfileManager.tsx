import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, CEFRLevel } from '../types/sla';
import {
  Check,
  UserPlus,
  Users,
  Sparkles,
  Edit2,
  Award,
  Volume2,
  Download,
  Upload,
  Database,
  ShieldCheck,
  Copy,
  FileJson,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { iOSHardwareManager, IOSHardwareSnapshot } from '../utils/iOSHardwareManager';

interface FamilyProfileManagerProps {
  profiles: UserProfile[];
  activeProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onAddProfile: (name: string, avatar: string, relation: string, targetLevel: CEFRLevel) => void;
  onUpdateProfile: (profileId: string, updates: Partial<UserProfile>) => void;
  getProfileStats: (profileId: string) => {
    completedSentences: number;
    speakingCount: number;
    averageScore: number;
    masteredCount: number;
  };
  onExportBackupJson?: () => Promise<string>;
  onImportBackupJson?: (rawJson: string) => Promise<{ ok: boolean; messageVi: string }>;
}

const AVATAR_OPTIONS = ['👨‍💼', '👩‍💼', '🧑‍🎓', '👧', '👦', '🧑‍🏫', '👨‍💻', '👩‍🔬', '🌟'];

export const FamilyProfileManager: React.FC<FamilyProfileManagerProps> = ({
  profiles,
  activeProfileId,
  onSelectProfile,
  onAddProfile,
  onUpdateProfile,
  getProfileStats,
  onExportBackupJson,
  onImportBackupJson,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newAvatar, setNewAvatar] = useState('👨‍💼');
  const [newRelation, setNewRelation] = useState('Thành viên gia đình');
  const [newLevel, setNewLevel] = useState<CEFRLevel>('A2');

  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Export / Import JSON state
  const [backupJsonPreview, setBackupJsonPreview] = useState<string>('');
  const [importJsonInput, setImportJsonInput] = useState<string>('');
  const [showPasteBox, setShowPasteBox] = useState<boolean>(false);
  const [backupStatus, setBackupStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [hwState, setHwState] = useState<IOSHardwareSnapshot>(() =>
    iOSHardwareManager.getSnapshot()
  );

  useEffect(() => {
    return iOSHardwareManager.subscribe(setHwState);
  }, []);

  const handleStartEdit = (p: UserProfile) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditAvatar(p.avatar);
  };

  const handleSaveEdit = (pId: string) => {
    if (!editName.trim()) return;
    onUpdateProfile(pId, {
      name: editName.trim(),
      avatar: editAvatar,
    });
    setEditingId(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddProfile(newName.trim(), newAvatar, newRelation, newLevel);
    setNewName('');
    setIsAdding(false);
  };

  const handleExportDownload = async () => {
    if (!onExportBackupJson) return;
    try {
      const jsonStr = await onExportBackupJson();
      setBackupJsonPreview(jsonStr);

      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateTag = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `lexispeak-backup-${dateTag}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupStatus({
        type: 'success',
        text: `Đã xuất bản sao lưu JSON đầy đủ (${profiles.length} hồ sơ gia đình & toàn bộ tiến độ IndexedDB).`,
      });
    } catch {
      setBackupStatus({
        type: 'error',
        text: 'Không thể tạo bản sao lưu JSON. Vui lòng thử lại.',
      });
    }
  };

  const handleCopyJson = async () => {
    if (!onExportBackupJson) return;
    try {
      const jsonStr = await onExportBackupJson();
      setBackupJsonPreview(jsonStr);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(jsonStr);
      }
      setBackupStatus({
        type: 'success',
        text: 'Đã sao chép chuỗi JSON sao lưu vào bộ nhớ tạm (Clipboard).',
      });
    } catch {
      setBackupStatus({
        type: 'error',
        text: 'Không thể sao chép tự động. Bạn có thể copy trực tiếp trong khung JSON bên dưới.',
      });
    }
  };

  const handleFileUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportBackupJson) return;

    try {
      const text = await file.text();
      const res = await onImportBackupJson(text);
      setBackupStatus({
        type: res.ok ? 'success' : 'error',
        text: res.messageVi,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {
      setBackupStatus({
        type: 'error',
        text: 'Không thể đọc file JSON đã chọn.',
      });
    }
  };

  const handlePasteImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onImportBackupJson || !importJsonInput.trim()) return;
    const res = await onImportBackupJson(importJsonInput.trim());
    setBackupStatus({
      type: res.ok ? 'success' : 'error',
      text: res.messageVi,
    });
    if (res.ok) {
      setImportJsonInput('');
      setShowPasteBox(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 overflow-y-auto ios-scroll pb-safe">
      <div className="max-w-4xl mx-auto w-full space-y-5 pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] dark:text-sky-400">
              <Users className="w-4 h-4" />
              <span>Hồ Sơ Gia Đình (Offline IndexedDB · Không Cần Tài Khoản / Mật Khẩu)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white font-serif-display mt-0.5">
              Hồ Sơ Học Tập Của Tôi, Vợ & Con
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Dữ liệu được lưu bền vững trên iPhone thông qua IndexedDB (`lexispeak_webkit_db`) kết hợp đồng bộ tự động.
            </p>
          </div>

          {!isAdding && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#0284C7] dark:bg-sky-600 rounded-xl hover:bg-[#0369A1] transition-colors shadow-xs touch-target self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm Thành Viên Mới</span>
            </button>
          )}
        </div>

        {/* Add Form */}
        {isAdding && (
          <form
            onSubmit={handleCreateSubmit}
            className="p-5 rounded-2xl bg-white dark:bg-[#151F32] border border-sky-300 dark:border-sky-500/50 shadow-md space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Thêm Thành Viên Mới Vào Gia Đình
              </h3>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
              >
                Hủy bỏ
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên hiển thị:
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ví dụ: Bé Bắp, Mẹ, v.v."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vai trò / Mối quan hệ:
                </label>
                <input
                  type="text"
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value)}
                  placeholder="Ví dụ: Con gái lớn, Ba, v.v."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Chọn biểu tượng đại diện:
              </label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setNewAvatar(av)}
                    className={`w-11 h-11 text-xl rounded-xl border flex items-center justify-center transition-all ${
                      newAvatar === av
                        ? 'border-[#0284C7] bg-sky-50 dark:bg-sky-950/80 scale-110 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120]'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-white bg-[#0284C7] dark:bg-sky-600 rounded-xl hover:bg-[#0369A1] shadow-xs"
              >
                Tạo Hồ Sơ Học Tập
              </button>
            </div>
          </form>
        )}

        {/* Member Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profiles.map((p) => {
            const isActive = p.id === activeProfileId;
            const isEditing = editingId === p.id;
            const stats = getProfileStats(p.id);

            return (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 gpu-layer ${
                  isActive
                    ? 'bg-white dark:bg-[#0F172A] border-[#0284C7] dark:border-sky-400 ring-2 ring-[#0284C7]/20 dark:ring-sky-400/20 shadow-md'
                    : 'bg-white/80 dark:bg-[#111827] border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Profile Top */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 text-2xl rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/80 flex items-center justify-center shrink-0">
                        {p.avatar}
                      </div>
                      <div>
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="px-2 py-1 text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white max-w-[120px]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(p.id)}
                              className="p-1.5 text-xs text-white bg-emerald-600 rounded-md"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">
                              {p.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(p)}
                              aria-label={`Đổi tên ${p.name}`}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {p.roleDescription}
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 rounded-full border border-emerald-300 dark:border-emerald-700/60">
                        <Check className="w-3 h-3" />
                        <span>Đang Học</span>
                      </span>
                    )}
                  </div>

                  {/* Individual Metrics */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#151F32] border border-slate-100 dark:border-slate-800/80 text-xs">
                    <div>
                      <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Volume2 className="w-3 h-3 text-[#0284C7] dark:text-sky-400" />
                        <span>Đã luyện nói:</span>
                      </div>
                      <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                        {stats.speakingCount} câu
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-500" />
                        <span>Điểm trung bình:</span>
                      </div>
                      <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                        {stats.averageScore > 0 ? `${stats.averageScore}%` : 'Chưa có'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Switch Button */}
                <button
                  type="button"
                  onClick={() => onSelectProfile(p.id)}
                  disabled={isActive}
                  className={`w-full py-3 px-4 text-xs font-semibold rounded-xl transition-all touch-target flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default'
                      : 'bg-[#0284C7] dark:bg-sky-600 text-white hover:bg-[#0369A1] shadow-xs'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Hồ Sơ Đang Hoạt Động</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Chọn Học Với Hồ Sơ {p.name}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* ZERO-BACKEND INDEXEDDB & EXPORT / IMPORT DATA (JSON) PANEL */}
        <section
          aria-labelledby="indexeddb-backup-heading"
          className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 space-y-4"
          data-testid="json-backup-panel"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#059669] dark:text-emerald-400">
                <Database className="w-4 h-4" />
                <span>IndexedDB Zero-Backend Persistence (`lexispeak_webkit_db`)</span>
              </div>
              <h3
                id="indexeddb-backup-heading"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-serif-display mt-0.5"
              >
                Sao Lưu & Khôi Phục Dữ Liệu Gia Đình (Export / Import Data JSON)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bảo vệ 100% tiến độ học tập của Tôi, Vợ & Con khỏi cơ chế tự xóa bộ nhớ tạm của iOS Safari. Xuất file `.json` để lưu trữ vào Tệp (iCloud Drive) hoặc chuyển sang iPhone khác.
              </p>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 shrink-0 self-start">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>IndexedDB + Cache-First SW Active</span>
            </div>
          </div>

          {/* Action Buttons: Export JSON File, Copy JSON, Upload JSON File, Paste JSON */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#0284C7] dark:bg-sky-600 text-white hover:bg-[#0369A1] transition-colors touch-target shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Xuất Dữ Liệu (Export JSON)</span>
            </button>

            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#151F32] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors touch-target"
            >
              <Copy className="w-4 h-4 text-[#0284C7] dark:text-sky-400" />
              <span>Sao Chép Chuỗi JSON</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUploadChange}
              className="hidden"
              id="json-backup-file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#059669] text-white hover:bg-emerald-700 transition-colors touch-target shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Nhập File Sao Lưu (Import JSON)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPasteBox((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#151F32] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors touch-target"
            >
              <FileJson className="w-4 h-4 text-amber-500" />
              <span>{showPasteBox ? 'Ẩn Khung Dán JSON' : 'Dán Chuỗi JSON Trực Tiếp'}</span>
            </button>
          </div>

          {/* Status Feedback Banner */}
          {backupStatus && (
            <div
              role="status"
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                backupStatus.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-rose-950/60 border-red-300 dark:border-rose-800 text-red-900 dark:text-rose-200'
              }`}
            >
              {backupStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#059669] dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#DC2626] dark:text-rose-400 shrink-0" />
              )}
              <span>{backupStatus.text}</span>
            </div>
          )}

          {/* Optional Paste JSON Import Form */}
          {showPasteBox && (
            <form
              onSubmit={handlePasteImportSubmit}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#151F32] border border-slate-200 dark:border-slate-800 space-y-2.5"
            >
              <label
                htmlFor="paste-json-textarea"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Dán nội dung JSON sao lưu vào đây để khôi phục dữ liệu:
              </label>
              <textarea
                id="paste-json-textarea"
                rows={4}
                value={importJsonInput}
                onChange={(e) => setImportJsonInput(e.target.value)}
                placeholder='{"schemaVersion":1,"appName":"LexiSpeak VN","profiles":[...]}'
                className="w-full p-2.5 text-xs font-mono rounded-lg bg-white dark:bg-[#0B1120] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasteBox(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={!importJsonInput.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#059669] text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  Xác Nhận Khôi Phục JSON
                </button>
              </div>
            </form>
          )}

          {/* Optional Preview of Exported JSON */}
          {backupJsonPreview && (
            <details className="text-xs rounded-xl bg-slate-50 dark:bg-[#151F32] border border-slate-200 dark:border-slate-800 p-3">
              <summary className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                Xem nội dung chuỗi JSON vừa xuất ({backupJsonPreview.length} bytes)
              </summary>
              <pre className="mt-2 p-2.5 rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 overflow-x-auto font-mono text-[11px] max-h-40 selectable-text">
                {backupJsonPreview}
              </pre>
            </details>
          )}

          {/* Live iOS Hardware & Media Lifecycle Summary Row */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              iOSHardwareManager: WebAudio{' '}
              <strong className="text-slate-700 dark:text-slate-200">
                {hwState.audioUnlocked ? 'Unlocked' : 'Auto-Unlock on Touch'}
              </strong>{' '}
              · Persistent Mic{' '}
              <strong className="text-slate-700 dark:text-slate-200">
                {hwState.micStreamReady ? 'Connected' : 'Standby'}
              </strong>{' '}
              · Screen WakeLock{' '}
              <strong className="text-slate-700 dark:text-slate-200">
                {hwState.wakeLockActive ? 'Active' : 'Managed'}
              </strong>
            </span>
            <span className="font-mono">botkeep.xyz · Standalone iOS PWA</span>
          </div>
        </section>
      </div>
    </div>
  );
};
