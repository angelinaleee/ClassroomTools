import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Maximize, Minimize, Users, Sparkles } from 'lucide-react';
import { isAudioMuted, toggleAudioMute } from '../utils/audio';

interface HeaderProps {
  studentCount: number;
  activeTab: 'picker' | 'grouper' | 'roster';
  setActiveTab: (tab: 'picker' | 'grouper' | 'roster') => void;
}

export const Header: React.FC<HeaderProps> = ({
  studentCount,
  activeTab,
  setActiveTab,
}) => {
  const [muted, setMuted] = useState(isAudioMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleSound = () => {
    const isNowMuted = !muted;
    toggleAudioMute(isNowMuted);
    setMuted(isNowMuted);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 flex-shrink-0">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  課堂抽籤與自動分組小工具
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  教師教學助手
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                動畫抽籤・音效增趣・自訂重複・智慧名單分組
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              id="nav-tab-picker"
              onClick={() => setActiveTab('picker')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'picker'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>隨機抽籤</span>
            </button>
            <button
              id="nav-tab-grouper"
              onClick={() => setActiveTab('grouper')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'grouper'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>自動分組</span>
            </button>
            <button
              id="nav-tab-roster"
              onClick={() => setActiveTab('roster')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'roster'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>學生名單</span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                studentCount > 0
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {studentCount}
              </span>
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              id="toggle-sound-btn"
              onClick={handleToggleSound}
              title={muted ? '開啟音效' : '靜音'}
              className={`p-2 sm:p-2.5 rounded-lg border transition-colors ${
                muted
                  ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {muted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button
              id="toggle-fullscreen-btn"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? '結束全螢幕' : '全螢幕投影 (適合電子白板/投影機)'}
              className="p-2 sm:p-2.5 rounded-lg border bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
