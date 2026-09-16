import { Student } from '../types';

export const SAMPLE_STUDENTS: string[] = [
  '陳冠宇', '林怡君', '黃家豪', '張雅婷',
  '李承翰', '吳若瑄', '劉亭妤', '蔡宗翰',
  '鄭宇翔', '許庭瑋', '楊舒涵', '謝承恩',
  '趙品睿', '曾靖涵', '葉家宏', '賴威廷',
  '周芷萱', '王聖凱', '柯詠晴', '郭子睿',
  '江欣穎', '呂柏翰', '徐念慈', '洪嘉佑'
];

/**
 * Clean up a raw string into a clean student name, stripping numbering prefixes like "1.", "1 - ", "#1"
 */
export function cleanStudentName(rawName: string): { name: string; number?: string } {
  let text = rawName.trim();
  // Strip quotes if wrapped
  if ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'"))) {
    text = text.slice(1, -1).trim();
  }

  // Detect prefixes like "1. ", "01 - ", "1、", "#1 "
  const prefixMatch = text.match(/^(\d{1,3})[\.\-\s、:：號#]+(.+)$/);
  if (prefixMatch) {
    return {
      number: prefixMatch[1],
      name: prefixMatch[2].trim(),
    };
  }

  return { name: text };
}

/**
 * Parse raw text (pasted or from CSV) into a list of Student objects.
 * Handles:
 * - Line separated names
 * - Comma separated names
 * - Tab/Semicolon separated
 * - Standard CSV with header (e.g., "姓名" or "Name", "座號" or "Number")
 */
export function parseStudentsFromText(rawContent: string): Student[] {
  if (!rawContent || !rawContent.trim()) return [];

  const lines = rawContent
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) return [];

  // Check if it's a CSV with header
  const firstLine = lines[0].toLowerCase();
  const hasComma = lines[0].includes(',');
  const hasTab = lines[0].includes('\t');
  const delimiter = hasTab ? '\t' : (hasComma ? ',' : null);

  let startIndex = 0;
  let nameColIdx = 0;
  let numColIdx = -1;

  if (delimiter) {
    const headerCols = lines[0].split(delimiter).map(c => c.replace(/["']/g, '').trim().toLowerCase());
    const isHeader = headerCols.some(h => 
      ['姓名', '名字', '學生', '學生姓名', 'name', 'student', 'student name', '座號', '學號', 'id', 'no', 'number'].includes(h)
    );

    if (isHeader) {
      startIndex = 1;
      const foundNameIdx = headerCols.findIndex(h => 
        ['姓名', '名字', '學生', '學生姓名', 'name', 'student', 'student name'].includes(h)
      );
      if (foundNameIdx !== -1) {
        nameColIdx = foundNameIdx;
      }
      const foundNumIdx = headerCols.findIndex(h => 
        ['座號', '學號', '編號', 'id', 'no', 'number', 'seat'].includes(h)
      );
      if (foundNumIdx !== -1) {
        numColIdx = foundNumIdx;
      }
    }
  }

  const results: Student[] = [];
  const seenNames = new Set<string>();

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    if (delimiter && (hasComma || hasTab)) {
      const parts = line.split(delimiter).map(p => p.replace(/["']/g, '').trim());
      const rawName = parts[nameColIdx] || parts[0];
      const rawNum = numColIdx !== -1 ? parts[numColIdx] : undefined;

      if (rawName) {
        const { name, number: extractedNum } = cleanStudentName(rawName);
        if (name) {
          results.push({
            id: `std_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${i}`,
            name,
            number: rawNum || extractedNum || String(results.length + 1).padStart(2, '0')
          });
        }
      }
    } else {
      // Could be comma-delimited within one line, or newline delimited
      const subItems = line.split(/[,，、]/).map(item => item.trim()).filter(Boolean);
      for (const item of subItems) {
        const { name, number: extractedNum } = cleanStudentName(item);
        if (name) {
          results.push({
            id: `std_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${results.length}`,
            name,
            number: extractedNum || String(results.length + 1).padStart(2, '0')
          });
        }
      }
    }
  }

  return results;
}
