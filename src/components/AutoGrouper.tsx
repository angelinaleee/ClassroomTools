import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Shuffle, 
  Copy, 
  Check, 
  Download, 
  Crown, 
  Printer, 
  ArrowRightLeft, 
  Sparkles, 
  HelpCircle,
  Sliders,
  Share2
} from 'lucide-react';
import { Student, GroupResult, GroupMethod, RemainderStrategy } from '../types';
import { playFanfareSound, playPopSound } from '../utils/audio';

interface AutoGrouperProps {
  students: Student[];
  onNavigateToRoster: () => void;
  onLoadSample: () => void;
}

const GROUP_PALETTES = [
  { border: 'border-indigo-200', bg: 'bg-indigo-50/40', badge: 'bg-indigo-600 text-white', accent: 'text-indigo-700' },
  { border: 'border-emerald-200', bg: 'bg-emerald-50/40', badge: 'bg-emerald-600 text-white', accent: 'text-emerald-700' },
  { border: 'border-amber-200', bg: 'bg-amber-50/40', badge: 'bg-amber-600 text-white', accent: 'text-amber-700' },
  { border: 'border-rose-200', bg: 'bg-rose-50/40', badge: 'bg-rose-600 text-white', accent: 'text-rose-700' },
  { border: 'border-sky-200', bg: 'bg-sky-50/40', badge: 'bg-sky-600 text-white', accent: 'text-sky-700' },
  { border: 'border-purple-200', bg: 'bg-purple-50/40', badge: 'bg-purple-600 text-white', accent: 'text-purple-700' },
  { border: 'border-teal-200', bg: 'bg-teal-50/40', badge: 'bg-teal-600 text-white', accent: 'text-teal-700' },
  { border: 'border-orange-200', bg: 'bg-orange-50/40', badge: 'bg-orange-600 text-white', accent: 'text-orange-700' },
  { border: 'border-fuchsia-200', bg: 'bg-fuchsia-50/40', badge: 'bg-fuchsia-600 text-white', accent: 'text-fuchsia-700' },
  { border: 'border-blue-200', bg: 'bg-blue-50/40', badge: 'bg-blue-600 text-white', accent: 'text-blue-700' },
];

export const AutoGrouper: React.FC<AutoGrouperProps> = ({
  students,
  onNavigateToRoster,
  onLoadSample,
}) => {
  const [groupMethod, setGroupMethod] = useState<GroupMethod>('byMembersPerGroup');
  const [membersPerGroup, setMembersPerGroup] = useState<number>(4);
  const [groupCount, setGroupCount] = useState<number>(4);
  const [remainderStrategy, setRemainderStrategy] = useState<RemainderStrategy>('distribute');
  const [assignLeader, setAssignLeader] = useState<boolean>(true);

  const [groups, setGroups] = useState<GroupResult[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [movingStudent, setMovingStudent] = useState<{ student: Student; fromGroupId: string } | null>(null);

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array: Student[]): Student[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  };

  // Perform grouping logic
  const handleGenerateGroups = () => {
    if (students.length === 0) return;

    setIsShuffling(true);
    playPopSound();

    setTimeout(() => {
      const shuffled = shuffleArray(students);
      const total = shuffled.length;
      let calculatedGroupCount = 1;

      if (groupMethod === 'byMembersPerGroup') {
        const size = Math.max(1, membersPerGroup);
        calculatedGroupCount = Math.ceil(total / size);
      } else {
        calculatedGroupCount = Math.max(1, Math.min(groupCount, total));
      }

      // Initialize groups
      const newGroups: GroupResult[] = [];
      const numGroups = calculatedGroupCount;

      for (let i = 0; i < numGroups; i++) {
        const palette = GROUP_PALETTES[i % GROUP_PALETTES.length];
        newGroups.push({
          id: `group_${i + 1}`,
          name: `第 ${i + 1} 組`,
          color: palette.border,
          members: [],
        });
      }

      if (groupMethod === 'byMembersPerGroup') {
        const targetSize = membersPerGroup;
        if (remainderStrategy === 'newGroup') {
          // Chunk sequentially
          let groupIdx = 0;
          for (let i = 0; i < total; i += targetSize) {
            const chunk = shuffled.slice(i, i + targetSize);
            if (newGroups[groupIdx]) {
              newGroups[groupIdx].members = chunk;
              groupIdx++;
            }
          }
        } else {
          // Distribute remainder evenly among groups
          const baseGroupsCount = Math.floor(total / targetSize) || 1;
          const actualGroups: GroupResult[] = [];
          for (let i = 0; i < baseGroupsCount; i++) {
            actualGroups.push({
              id: `group_${i + 1}`,
              name: `第 ${i + 1} 組`,
              color: GROUP_PALETTES[i % GROUP_PALETTES.length].border,
              members: [],
            });
          }

          // Round-robin distribution
          shuffled.forEach((student, idx) => {
            const gIdx = idx % baseGroupsCount;
            actualGroups[gIdx].members.push(student);
          });

          // Assign leaders
          if (assignLeader) {
            actualGroups.forEach(g => {
              if (g.members.length > 0) {
                g.leaderId = g.members[0].id;
              }
            });
          }

          setGroups(actualGroups);
          setIsShuffling(false);
          return;
        }
      } else {
        // By Group Count: round-robin distribution
        shuffled.forEach((student, idx) => {
          const gIdx = idx % numGroups;
          newGroups[gIdx].members.push(student);
        });
      }

      // Assign leaders if enabled
      if (assignLeader) {
        newGroups.forEach(g => {
          if (g.members.length > 0) {
            g.leaderId = g.members[0].id;
          }
        });
      }

      setGroups(newGroups.filter(g => g.members.length > 0));
      setIsShuffling(false);
    }, 300);
  };

  // Initial group generation when students are loaded and no groups yet
  useEffect(() => {
    if (students.length > 0 && groups.length === 0) {
      handleGenerateGroups();
    }
  }, [students.length]);

  // Toggle leader of a group
  const handleSetLeader = (groupId: string, studentId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          leaderId: g.leaderId === studentId ? undefined : studentId,
        };
      }
      return g;
    }));
    playPopSound();
  };

  // Move student to another group
  const handleMoveStudent = (targetGroupId: string) => {
    if (!movingStudent) return;
    if (movingStudent.fromGroupId === targetGroupId) {
      setMovingStudent(null);
      return;
    }

    setGroups(prev => {
      const updated = prev.map(g => {
        if (g.id === movingStudent.fromGroupId) {
          return {
            ...g,
            members: g.members.filter(m => m.id !== movingStudent.student.id),
            leaderId: g.leaderId === movingStudent.student.id ? undefined : g.leaderId,
          };
        }
        if (g.id === targetGroupId) {
          return {
            ...g,
            members: [...g.members, movingStudent.student],
          };
        }
        return g;
      });
      return updated;
    });

    setMovingStudent(null);
    playPopSound();
  };

  // Format group result text for clipboard
  const formattedGroupText = useMemo(() => {
    if (groups.length === 0) return '';
    const dateStr = new Date().toLocaleDateString();
    let text = `📋【課堂分組名單 - ${dateStr}】\n全班人數：${students.length} 人，共分成 ${groups.length} 組\n\n`;

    groups.forEach((g) => {
      const membersText = g.members
        .map(m => {
          const isLeader = g.leaderId === m.id;
          const num = m.number ? `(${m.number}號)` : '';
          return `${m.name}${num}${isLeader ? ' ★組長' : ''}`;
        })
        .join('、');
      text += `${g.name} (${g.members.length}人)：\n${membersText}\n\n`;
    });

    return text.trim();
  }, [groups, students.length]);

  // Copy to clipboard
  const handleCopy = () => {
    if (!formattedGroupText) return;
    navigator.clipboard.writeText(formattedGroupText);
    setCopied(true);
    playPopSound();
    setTimeout(() => setCopied(false), 2500);
  };

  // Download as text file
  const handleDownloadTxt = () => {
    if (!formattedGroupText) return;
    const blob = new Blob([formattedGroupText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `課堂分組名單_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  // Empty state
  if (students.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs max-w-lg mx-auto">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">名單中尚未加入學生</h2>
          <p className="text-sm text-slate-600 mb-6">
            自動分組需要至少有 2 位學生。您可以直接載入示範名單快速體驗。
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
              <span>前往匯入名單</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Moving Student Notification Banner */}
      {movingStudent && (
        <div className="sticky top-20 z-40 bg-indigo-600 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ArrowRightLeft className="w-4 h-4 animate-spin" />
            <span>
              正在調整學生「<strong>{movingStudent.student.name}</strong>」：請點擊目標小組以移動！
            </span>
          </div>
          <button
            onClick={() => setMovingStudent(null)}
            className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            取消移動
          </button>
        </div>
      )}

      {/* Control Panel: Parameters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>智慧自動分組設定</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              班級共有 <strong className="text-indigo-600 font-bold">{students.length}</strong> 位學生，支援每組人數或固定組數分配。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="generate-groups-btn"
              onClick={handleGenerateGroups}
              disabled={isShuffling}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
              <span>{groups.length > 0 ? '重新隨機打散分組' : '開始自動分組'}</span>
            </button>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Method: By Person or By Group Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              分組方式
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setGroupMethod('byMembersPerGroup')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  groupMethod === 'byMembersPerGroup'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                依每組人數
              </button>
              <button
                type="button"
                onClick={() => setGroupMethod('byGroupCount')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  groupMethod === 'byGroupCount'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                依總組數
              </button>
            </div>
          </div>

          {/* Number selector */}
          {groupMethod === 'byMembersPerGroup' ? (
            <div className="space-y-1.5">
              <label htmlFor="members-per-group-input" className="text-xs font-semibold text-slate-700 flex justify-between">
                <span>每組人數</span>
                <span className="text-indigo-600 font-bold">{membersPerGroup} 人/組</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="members-per-group-input"
                  type="range"
                  min="2"
                  max={Math.max(2, Math.min(12, students.length))}
                  value={membersPerGroup}
                  onChange={(e) => setMembersPerGroup(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <select
                  value={membersPerGroup}
                  onChange={(e) => setMembersPerGroup(Number(e.target.value))}
                  className="px-2 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg outline-hidden"
                >
                  {[2, 3, 4, 5, 6, 7, 8].filter(n => n <= students.length).map(num => (
                    <option key={num} value={num}>{num} 人</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="group-count-input" className="text-xs font-semibold text-slate-700 flex justify-between">
                <span>預計總組數</span>
                <span className="text-indigo-600 font-bold">{groupCount} 組</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="group-count-input"
                  type="range"
                  min="2"
                  max={Math.max(2, Math.min(10, students.length))}
                  value={groupCount}
                  onChange={(e) => setGroupCount(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <select
                  value={groupCount}
                  onChange={(e) => setGroupCount(Number(e.target.value))}
                  className="px-2 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg outline-hidden"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].filter(n => n <= students.length).map(num => (
                    <option key={num} value={num}>{num} 組</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Remainder strategy (if by members per group) */}
          {groupMethod === 'byMembersPerGroup' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                人數不均時餘數處理
              </label>
              <select
                value={remainderStrategy}
                onChange={(e) => setRemainderStrategy(e.target.value as RemainderStrategy)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium outline-hidden"
              >
                <option value="distribute">平均分配至各組（避免落單）</option>
                <option value="newGroup">餘數獨立成最後一組</option>
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                分配邏輯
              </label>
              <div className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
                均勻平衡各組人數
              </div>
            </div>
          )}

          {/* Leader switch */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="text-xs font-semibold text-slate-700">
              小組幹部
            </label>
            <button
              type="button"
              onClick={() => setAssignLeader(!assignLeader)}
              className={`w-full py-1.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                assignLeader
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Crown className={`w-3.5 h-3.5 ${assignLeader ? 'text-amber-600 fill-amber-500' : 'text-slate-400'}`} />
                <span>隨機指定組長</span>
              </span>
              <span className="text-[11px] font-bold">
                {assignLeader ? '已開啟' : '未開啟'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Export & Actions Toolbar */}
      {groups.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">
              分組成果預覽
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              共分成 {groups.length} 組
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="copy-group-result-btn"
              onClick={handleCopy}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                copied
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已複製結果！' : '一鍵複製文字'}</span>
            </button>
            <button
              onClick={handleDownloadTxt}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下載 TXT</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>列印 / 匯出</span>
            </button>
          </div>
        </div>
      )}

      {/* Visualized Group Cards Grid */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          請點擊「開始自動分組」產生分組名單
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {groups.map((group, groupIdx) => {
              const palette = GROUP_PALETTES[groupIdx % GROUP_PALETTES.length];
              const isMovingTarget = movingStudent && movingStudent.fromGroupId !== group.id;

              return (
                <motion.div
                  key={group.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    if (isMovingTarget) handleMoveStudent(group.id);
                  }}
                  className={`rounded-2xl border bg-white p-4 shadow-xs flex flex-col transition-all relative ${
                    palette.border
                  } ${
                    isMovingTarget
                      ? 'ring-2 ring-indigo-500 ring-offset-2 cursor-pointer hover:bg-indigo-50/20'
                      : ''
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${palette.badge}`}>
                        {group.name}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {group.members.length} 人
                      </span>
                    </div>

                    {isMovingTarget && (
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full animate-pulse">
                        點此移入本組 ↵
                      </span>
                    )}
                  </div>

                  {/* Member Tags */}
                  <div className="flex-1 space-y-2">
                    {group.members.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 italic">
                        尚無成員
                      </div>
                    ) : (
                      group.members.map((member) => {
                        const isLeader = group.leaderId === member.id;
                        const isCurrentlyBeingMoved = movingStudent?.student.id === member.id;

                        return (
                          <div
                            key={member.id}
                            className={`group flex items-center justify-between p-2 rounded-xl text-sm transition-all border ${
                              isCurrentlyBeingMoved
                                ? 'bg-indigo-100 border-indigo-300 text-indigo-900'
                                : isLeader
                                ? 'bg-amber-50/80 border-amber-200 text-amber-950 font-semibold'
                                : 'bg-slate-50/80 border-slate-200/60 hover:bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-white text-slate-600 text-[11px] font-mono font-bold flex items-center justify-center border border-slate-200/80 flex-shrink-0">
                                {member.number || '•'}
                              </span>
                              <span className="truncate">{member.name}</span>
                              {isLeader && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-200/80 text-amber-800">
                                  <Crown className="w-2.5 h-2.5 fill-amber-700" />
                                  組長
                                </span>
                              )}
                            </div>

                            {/* Quick action buttons for member */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetLeader(group.id, member.id);
                                }}
                                title={isLeader ? '取消組長' : '設為組長'}
                                className={`p-1 rounded-md transition-colors ${
                                  isLeader
                                    ? 'text-amber-600 hover:bg-amber-100'
                                    : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                                }`}
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMovingStudent({ student: member, fromGroupId: group.id });
                                }}
                                title="移至其他組別"
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Card Footer Hint */}
                  <div className="mt-3 pt-2 text-[10px] text-slate-400 border-t border-slate-100 flex items-center justify-between">
                    <span>點擊 👑 可指派/更換組長</span>
                    <span>點擊 ⇄ 可換組</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Classroom Guide / Tips */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 text-xs text-slate-600 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">老師實用技巧：</strong>
          自動分組後，若有需要避開或特定搭檔的情況，可直接點擊學生右側的「⇄」圖示，再點擊目標小組完成成員互換；若點擊「一鍵複製文字」，可直接將整理好的分組名單貼在教學簡報、LINE 班級群組或 Google Classroom。
        </div>
      </div>
    </div>
  );
};
