import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RandomPicker } from './components/RandomPicker';
import { AutoGrouper } from './components/AutoGrouper';
import { RosterManager } from './components/RosterManager';
import { Student } from './types';
import { SAMPLE_STUDENTS } from './utils/csvParser';

const STORAGE_KEY = 'classroom_students_v1';

export default function App() {
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    // Default to realistic initial class list so the app is instantly ready to try
    return SAMPLE_STUDENTS.map((name, idx) => ({
      id: `std_init_${idx + 1}`,
      name,
      number: String(idx + 1).padStart(2, '0'),
    }));
  });

  const [activeTab, setActiveTab] = useState<'picker' | 'grouper' | 'roster'>('picker');

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch {
      // ignore
    }
  }, [students]);

  // Load sample names
  const handleLoadSample = () => {
    const demo = SAMPLE_STUDENTS.map((name, idx) => ({
      id: `std_demo_${Date.now()}_${idx + 1}`,
      name,
      number: String(idx + 1).padStart(2, '0'),
    }));
    setStudents(demo);
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans">
      <Header
        studentCount={students.length}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
            onLoadSample={handleLoadSample}
          />
        )}

        {activeTab === 'grouper' && (
          <AutoGrouper
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
            onLoadSample={handleLoadSample}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            onUpdateStudents={setStudents}
            onNavigateToPicker={() => setActiveTab('picker')}
            onNavigateToGrouper={() => setActiveTab('grouper')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>課堂隨機抽籤與自動分組小工具・專為老師課堂活動與互動設計</span>
          <span>支援 CSV 匯入・音效動畫・公平隨機・視覺化分組</span>
        </div>
      </footer>
    </div>
  );
}
