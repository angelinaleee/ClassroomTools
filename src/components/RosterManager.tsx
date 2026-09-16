import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Trash2, 
  Plus, 
  Search, 
  Sparkles, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck,
  RotateCcw
} from 'lucide-react';
import { Student } from '../types';
import { parseStudentsFromText, SAMPLE_STUDENTS } from '../utils/csvParser';
import { playPopSound } from '../utils/audio';

interface RosterManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  onNavigateToPicker: () => void;
  onNavigateToGrouper: () => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  students,
  onUpdateStudents,
  onNavigateToPicker,
  onNavigateToGrouper,
}) => {
  const [importMode, setImportMode] = useState<'csv' | 'paste'>('csv');
  const [pastedText, setPastedText] = useState('');
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Handle CSV / Text file upload
  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseStudentsFromText(text);
        if (parsed.length === 0) {
          showFeedback('error', '未在檔案中找到有效的學生姓名，請確認檔案格式！');
          return;
        }
        onUpdateStudents(parsed);
        playPopSound();
        showFeedback('success', `成功從「${file.name}」匯入 ${parsed.length} 位學生名單！`);
      } catch (err) {
        showFeedback('error', '讀取檔案失敗，請檢查格式是否正確。');
      }
    };
    reader.onerror = () => {
      showFeedback('error', '讀取檔案時發生錯誤');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Handle Pasted Text Submission
  const handleApplyPastedText = () => {
    if (!pastedText.trim()) {
      showFeedback('error', '請先輸入或貼上學生姓名名單！');
      return;
    }
    const parsed = parseStudentsFromText(pastedText);
    if (parsed.length === 0) {
      showFeedback('error', '未解析出學生姓名，請檢查文字內容！');
      return;
    }
    onUpdateStudents(parsed);
    playPopSound();
    showFeedback('success', `已成功解析並匯入 ${parsed.length} 位學生名單！`);
    setPastedText('');
  };

  // Load sample demo roster
  const handleLoadSample = () => {
    const demo = SAMPLE_STUDENTS.map((name, idx) => ({
      id: `std_demo_${idx + 1}`,
      name,
      number: String(idx + 1).padStart(2, '0'),
    }));
    onUpdateStudents(demo);
    playPopSound();
    showFeedback('success', `已載入 24 位學生示範名單，現在可以直接開始抽籤或分組！`);
  };

  // Add single student manually
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    const newStudent: Student = {
      id: `std_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: trimmedName,
      number: newNumber.trim() || String(students.length + 1).padStart(2, '0'),
    };

    onUpdateStudents([...students, newStudent]);
    setNewName('');
    setNewNumber('');
    playPopSound();
    showFeedback('success', `已新增學生「${trimmedName}」！`);
  };

  // Remove single student
  const handleRemoveStudent = (id: string, name: string) => {
    const updated = students.filter(s => s.id !== id);
    onUpdateStudents(updated);
    showFeedback('success', `已移除「${name}」`);
  };

  // Clear all
  const handleClearAll = () => {
    if (window.confirm(`確定要清空全部 ${students.length} 位學生名單嗎？`)) {
      onUpdateStudents([]);
      showFeedback('success', '已清空名單');
    }
  };

  // Export current roster as CSV
  const handleExportCSV = () => {
    if (students.length === 0) return;
    const header = '座號,姓名\n';
    const rows = students.map(s => `"${s.number || ''}","${s.name}"`).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `學生名單_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered students
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.number && s.number.includes(searchQuery))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-8">
      {/* Feedback Toast */}
      {feedback && (
        <div 
          className={`flex items-center gap-2 p-4 rounded-xl text-sm font-medium border shadow-xs transition-all ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Hero Welcome / Actions Bar */}
      <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white border border-indigo-100 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            <span>學生名單來源與設定</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            您可以上傳 Excel 匯出的 CSV 檔案、直接貼上姓名名單，或點擊下方按鈕載入示範名單快速體驗。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="load-sample-roster-btn"
            onClick={handleLoadSample}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>載入 24 位示範名單</span>
          </button>
          {students.length > 0 && (
            <button
              id="clear-all-roster-btn"
              onClick={handleClearAll}
              className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-sm font-medium border border-slate-200 hover:border-rose-200 rounded-xl transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>清空名單</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Upload/Paste on Left, Current List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Import Controls */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Tab switch for import mode */}
            <div className="flex border-b border-slate-200 bg-slate-50/60 p-1.5">
              <button
                id="tab-import-csv"
                onClick={() => setImportMode('csv')}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  importMode === 'csv'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>上傳 CSV 檔案</span>
              </button>
              <button
                id="tab-import-paste"
                onClick={() => setImportMode('paste')}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  importMode === 'paste'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>貼上學生姓名</span>
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {importMode === 'csv' ? (
                <div className="space-y-4">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-50/80 scale-[0.99]'
                        : 'border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                        e.target.value = '';
                      }}
                    />
                    <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      點擊選取檔案 或 將 CSV 拖曳至此
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      支援 .csv、.txt 格式（自動辨識「姓名」、「座號」等欄位）
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/70 text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-700">📌 CSV 格式提示：</p>
                    <p>• 可包含欄位標題，如：<code>座號,姓名</code> 或直接單欄每行一個姓名</p>
                    <p>• 從 Excel 另存為「CSV (逗號分隔)」即可直接在此上傳</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="paste-names-area" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      請在下方輸入或貼上學生名單：
                    </label>
                    <textarea
                      id="paste-names-area"
                      rows={8}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder={`一行一個學生姓名，例如：\n王小明\n李小華\n張雅婷\n\n或以逗號隔開：\n陳冠宇, 林怡君, 黃家豪\n\n亦支援帶座號格式：\n01 王小明\n02 李小華`}
                      className="w-full text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPastedText('')}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      清空輸入框
                    </button>
                    <button
                      id="apply-pasted-names-btn"
                      onClick={handleApplyPastedText}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>解析並加入名單</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Manual Add Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>手動新增個別學生</span>
            </h3>
            <form onSubmit={handleAddSingleStudent} className="flex gap-2">
              <input
                type="text"
                id="input-new-student-number"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                placeholder="座號 (選填)"
                className="w-24 text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
              />
              <input
                type="text"
                id="input-new-student-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="學生姓名 (必填)"
                className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
              />
              <button
                type="submit"
                id="submit-add-student-btn"
                disabled={!newName.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-all"
              >
                新增
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Roster List Preview & Stats */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 flex flex-col h-full min-h-[480px]">
            {/* Header with Search and Count */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  當前班級名單
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  共 {students.length} 位
                </span>
              </div>

              {students.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    title="匯出為 CSV"
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Search Bar */}
            {students.length > 0 && (
              <div className="relative my-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋姓名或座號..."
                  className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
                />
              </div>
            )}

            {/* Students List Container */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 mt-2 max-h-[380px]">
              {students.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <UserCheck className="w-12 h-12 text-slate-300 mb-2 stroke-[1.5]" />
                  <p className="text-sm font-medium text-slate-600">目前尚無學生名單</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    請從左側上傳 CSV、貼上姓名名單，或點擊上方「載入 24 位示範名單」立即體驗！
                  </p>
                  <button
                    onClick={handleLoadSample}
                    className="mt-4 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    一鍵載入示範名單
                  </button>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  查無符合「{searchQuery}」的學生
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredStudents.map((s, index) => (
                    <div
                      key={s.id}
                      className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {s.number || String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="text-sm font-semibold text-slate-800 truncate">
                          {s.name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(s.id, s.name)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="移除學生"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick action bar to jump to features */}
            {students.length > 0 && (
              <div className="pt-4 mt-auto border-t border-slate-200 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  名單已準備就緒，隨時可進行抽籤或分組
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={onNavigateToPicker}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>前往隨機抽籤</span>
                  </button>
                  <button
                    onClick={onNavigateToGrouper}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span>前往自動分組</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
