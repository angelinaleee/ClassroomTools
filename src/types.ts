export interface Student {
  id: string;
  name: string;
  number?: string;
  notes?: string;
}

export type DrawMode = 'unique' | 'repeatable'; // unique = 不重複, repeatable = 可重複

export interface DrawRecord {
  id: string;
  studentName: string;
  timestamp: number;
}

export interface GroupResult {
  id: string;
  name: string;
  color: string;
  members: Student[];
  leaderId?: string;
}

export type GroupMethod = 'byMembersPerGroup' | 'byGroupCount';
export type RemainderStrategy = 'distribute' | 'newGroup'; // distribute = 平均分配至現有組別, newGroup = 餘數獨立成組
