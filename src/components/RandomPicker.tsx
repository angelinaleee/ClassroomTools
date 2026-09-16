import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  RotateCcw, 
  History, 
  Check, 
  AlertCircle, 
  Volume2, 
  Layers, 
  Shuffle, 
  UserPlus,
  Flame,
  Award,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Student, DrawMode } from '../types';
import { playTickSound, playFanfareSound, playPopSound } from '../utils/audio';

interface RandomPickerProps {
  students: Student[];
  onNavigateToRoster: () => void;
  onLoadSample: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  onNavigateToRoster,
  onLoadSample,
}) => {
  const [drawMode, setDrawMode] = useState<DrawMode>('unique');
  const [drawnIds, setDrawnIds] = useState<string[]>([]);
  const [historyList, setHistoryList] = useState<{ student: Student; timestamp: Date }[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [displayName, setDisplayName] = useState<string>('等待抽籤');
  const [displayNumber, setDisplayNumber] = useState<string | undefined>(undefined);
  const [currentWinner, setCurrentWinner] = useState<Student | null>(null);
  const [rollSpeed, setRollSpeed] = useState<'normal' | 'fast' | 'slow'>('normal');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Available students in current draw pool
  const availablePool = drawMode === 'unique'
    ? students.filter(s => !drawnIds.includes(s.id))
    : students;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Trigger Confetti
  const fireConfetti = useCallback(() => {
    try {
      const end = Date.now() + 1000;
      const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0.1, y: 0.7 },
          colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 0.9, y: 0.7 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch {
      // Confetti fallback
    }
  }, []);

  // Execute Roll
  const startDraw = useCallback(() => {
    if (isRolling || students.length === 0) return;

    if (drawMode === 'unique' && availablePool.length === 0) {
      alert('所有學生皆已被抽出！請重置抽籤名單或切換為可重複抽取模式。');
      return;
    }

    setIsRolling(true);
    setCurrentWinner(null);

    // Pick a final winner from the available pool ahead of time
    const finalWinner = availablePool[Math.floor(Math.random() * availablePool.length)];

    // Rolling animation parameters
    const duration = rollSpeed === 'fast' ? 1400 : rollSpeed === 'slow' ? 4200 : 2600;
    const startTime = Date.now();

    let currentInterval = 40;
    let lastTickTime = startTime;

    const rollStep = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Deceleration curve: easeOutQuad / easeOutCubic
      // currentInterval grows as progress increases
      currentInterval = 40 + Math.pow(progress, 2.5) * 380;

      if (now - lastTickTime >= currentInterval) {
        lastTickTime = now;
        // Pick a random display student from all students for visual rolling
        const randomStudent = students[Math.floor(Math.random() * students.length)];
        setDisplayName(randomStudent.name);
        setDisplayNumber(randomStudent.number);

        // Calculate pitch modulation (higher pitch at start, lower/deeper as it slows)
        const pitch = 1.3 - progress * 0.5;
        playTickSound(pitch);
      }

      if (progress < 1) {
        timerRef.current = setTimeout(rollStep, 16);
      } else {
        // Roll finished!
        setDisplayName(finalWinner.name);
        setDisplayNumber(finalWinner.number);
        setCurrentWinner(finalWinner);
        setIsRolling(false);

        // Sound and confetti
        playFanfareSound();
        fireConfetti();

        // Record history
        setHistoryList(prev => [{ student: finalWinner, timestamp: new Date() }, ...prev]);

        // If unique mode, record drawn ID
        if (drawMode === 'unique') {
          setDrawnIds(prev => [...prev, finalWinner.id]);
        }
      }
    };

    rollStep();
  }, [isRolling, students, drawMode, availablePool, rollSpeed, fireConfetti]);

  // Keyboard shortcut: Space to start draw
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isRolling && students.length > 0) {
        // Only trigger if active element is not an input/textarea
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          startDraw();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRolling, students.length, startDraw]);

  // Reset unique pool
  const handleResetPool = () => {
    setDrawnIds([]);
    setCurrentWinner(null);
    setDisplayName('等待抽籤');
    setDisplayNumber(undefined);
    playPopSound();
  };

  // Put a student back into pool
  const handlePutBack = (studentId: string) => {
    setDrawnIds(prev => prev.filter(id => id !== studentId));
    playPopSound();
  };

  // If no students
  if (students.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">名單中尚未加入學生</h2>
          <p className="text-sm text-slate-600 mb-6">
            抽籤前需要先建立學生名單。您可以直接載入示範名單，或前往名單管理手動輸入或上傳 CSV。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onLoadSample}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>載入 24 位示範名單</span>
            </button>
            <button
              onClick={onNavigateToRoster}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>前往匯入名單</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Top Settings Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Draw Mode Switcher */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            抽籤模式：
          </span>
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              id="mode-unique-btn"
              onClick={() => {
                setDrawMode('unique');
                playPopSound();
              }}
              className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                drawMode === 'unique'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              不重複抽取
            </button>
            <button
              id="mode-repeatable-btn"
              onClick={() => {
                setDrawMode('repeatable');
                playPopSound();
              }}
              className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                drawMode === 'repeatable'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              可重複抽取
            </button>
          </div>
        </div>

        {/* Speed and Reset Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-600">
            <span className="font-medium mr-1.5">滾動時間：</span>
            <select
              value={rollSpeed}
              onChange={(e) => setRollSpeed(e.target.value as 'normal' | 'fast' | 'slow')}
              className="bg-transparent font-semibold text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="fast">快速 (1.5秒)</option>
              <option value="normal">標準 (2.6秒)</option>
              <option value="slow">刺激 (4.2秒)</option>
            </select>
          </div>

          {drawMode === 'unique' && drawnIds.length > 0 && (
            <button
              id="reset-draw-pool-btn"
              onClick={handleResetPool}
              disabled={isRolling}
              title="重置已抽籤名單，讓所有人重新具備抽籤資格"
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>重置抽籤池</span>
            </button>
          )}

          <button
            onClick={() => setShowHistoryModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5" />
            <span>抽籤紀錄 ({historyList.length})</span>
          </button>
        </div>
      </div>

      {/* Mode Status Pill / Remaining Info */}
      <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm px-1 text-slate-600">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${drawMode === 'unique' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span className="font-medium">
            {drawMode === 'unique' ? (
              <>
                模式：<strong className="text-slate-900">不重複抽取</strong>（已抽中學生暫時移出名單）
              </>
            ) : (
              <>
                模式：<strong className="text-slate-900">可重複抽取</strong>（每次抽籤全員皆有可能中選）
              </>
            )}
          </span>
        </div>

        {drawMode === 'unique' && (
          <div className="flex items-center gap-2 font-medium">
            <span>剩餘抽籤人數：</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {availablePool.length} / {students.length} 人
            </span>
          </div>
        )}
      </div>

      {/* Centerpiece Stage: Big Interactive Roll Box */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 rounded-3xl border border-indigo-900/50 p-6 sm:p-12 text-center text-white shadow-xl min-h-[380px] sm:min-h-[440px] flex flex-col items-center justify-center">
        {/* Subtle background glow effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.25),transparent_70%)] pointer-events-none" />

        {/* Status Tag */}
        <div className="relative mb-6">
          {isRolling ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              緊張抽籤中...
            </span>
          ) : currentWinner ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              🎉 幸運中選者出爐！
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-300 border border-white/10">
              點擊按鈕或按鍵盤「空白鍵」開始
            </span>
          )}
        </div>

        {/* Central Display Card with Rolling Animation */}
        <div className="relative w-full max-w-xl mx-auto my-auto py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={isRolling ? displayName : (currentWinner ? currentWinner.id : 'idle')}
              initial={{ scale: 0.85, opacity: 0.7, y: isRolling ? -10 : 0 }}
              animate={{ 
                scale: currentWinner ? [1, 1.12, 1] : 1, 
                opacity: 1, 
                y: 0 
              }}
              transition={{ 
                type: 'spring', 
                stiffness: currentWinner ? 300 : 400, 
                damping: 20 
              }}
              className={`p-6 sm:p-10 rounded-2xl transition-all ${
                currentWinner
                  ? 'bg-gradient-to-b from-indigo-500/20 to-purple-600/20 border-2 border-indigo-400/80 shadow-[0_0_50px_rgba(99,102,241,0.4)]'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {displayNumber && (
                <div className="inline-block px-3 py-1 rounded-lg bg-indigo-500/30 text-indigo-200 text-xs sm:text-sm font-bold tracking-wider mb-2">
                  座號 {displayNumber}
                </div>
              )}
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-sm select-none">
                {displayName}
              </h1>
              {currentWinner && (
                <p className="mt-3 text-xs sm:text-sm text-indigo-200 font-medium animate-bounce">
                  恭喜中籤！✨ 請準備發言或上台
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Large Action Buttons */}
        <div className="relative z-10 mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            id="start-draw-btn"
            onClick={startDraw}
            disabled={isRolling || (drawMode === 'unique' && availablePool.length === 0)}
            className={`w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl font-bold text-base sm:text-lg shadow-lg transition-all flex items-center justify-center gap-3 ${
              isRolling || (drawMode === 'unique' && availablePool.length === 0)
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-indigo-500/30 hover:scale-105 active:scale-95'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>
              {isRolling
                ? '抽籤進行中...'
                : drawMode === 'unique' && availablePool.length === 0
                ? '已全部抽完'
                : currentWinner
                ? '再抽下一位學生'
                : '開始隨機抽籤'}
            </span>
          </button>

          {drawMode === 'unique' && availablePool.length === 0 && (
            <button
              onClick={handleResetPool}
              className="px-5 py-3.5 rounded-2xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>重新開始抽籤</span>
            </button>
          )}
        </div>

        {/* Keyboard Hint */}
        <p className="relative mt-4 text-[11px] text-slate-400">
          💡 課堂提示：直接按下 <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">Space 空白鍵</kbd> 即可隨時抽籤
        </p>
      </div>

      {/* Non-repeat Mode Pool Status Visualizer */}
      {drawMode === 'unique' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>未抽籤池（剩餘 {availablePool.length} 人）</span>
            </h3>
            {drawnIds.length > 0 && (
              <span className="text-xs text-slate-500">
                已抽出 {drawnIds.length} 人，點擊姓名可將學生「放回」名單
              </span>
            )}
          </div>

          {/* Quick chips of available students */}
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {students.map(s => {
              const isDrawn = drawnIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (isDrawn) handlePutBack(s.id);
                  }}
                  title={isDrawn ? '已抽過（點擊放回抽籤池）' : '未抽中'}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                    isDrawn
                      ? 'bg-slate-100 text-slate-400 border-slate-200 line-through hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 hover:no-underline'
                      : 'bg-indigo-50/50 text-indigo-800 border-indigo-100 hover:border-indigo-300'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 font-mono">{s.number || ''}</span>
                  <span>{s.name}</span>
                  {isDrawn && <RotateCcw className="w-2.5 h-2.5 ml-0.5 text-indigo-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* History Modal / Drawer */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  抽籤歷史紀錄 ({historyList.length})
                </h3>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
              {historyList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  尚未進行抽籤
                </div>
              ) : (
                historyList.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                        {historyList.length - idx}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900">{item.student.name}</span>
                        {item.student.number && (
                          <span className="ml-2 text-xs text-slate-500">座號 {item.student.number}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            {historyList.length > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <button
                  onClick={() => {
                    const text = historyList
                      .map((h, i) => `${historyList.length - i}. ${h.student.name} (${h.student.number || ''})`)
                      .join('\n');
                    navigator.clipboard.writeText(text);
                    alert('已複製抽籤紀錄至剪貼簿！');
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  複製紀錄清單
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('確定要清空抽籤歷史紀錄嗎？')) {
                      setHistoryList([]);
                    }
                  }}
                  className="text-xs font-medium text-rose-600 hover:text-rose-800"
                >
                  清空紀錄
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
