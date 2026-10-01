import { HistoryEntry } from '../types';

export interface DayGroup {
  dateKey: string; // YYYY-MM-DD
  displayLabel: string; // 'Hoje', 'Ontem', or 'segunda-feira, 28 de setembro de 2026'
  rawDate: Date;
  entries: HistoryEntry[];
}

/**
 * Format a Date object to Portuguese day label:
 * - If today -> "Hoje"
 * - If yesterday -> "Ontem"
 * - Otherwise -> "segunda-feira, 28 de setembro de 2026"
 */
export function formatDayLabel(date: Date): string {
  const now = new Date();
  
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return 'Hoje';

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Ontem';

  // Format e.g. "segunda-feira, 28 de setembro de 2026"
  const formatted = date.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return formatted;
}

/**
 * Groups history entries by day and sorts by time descending within each day.
 */
export function groupHistoryByDays(entries: HistoryEntry[]): DayGroup[] {
  const groupsMap = new Map<string, DayGroup>();

  entries.forEach((entry) => {
    let dateObj: Date;
    if (entry.timestamp) {
      dateObj = new Date(entry.timestamp);
    } else {
      // Parse DD/MM/YYYY
      const parts = entry.formattedDate.split('/');
      if (parts.length === 3) {
        dateObj = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      } else {
        dateObj = new Date();
      }
    }

    if (isNaN(dateObj.getTime())) {
      dateObj = new Date();
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    if (!groupsMap.has(dateKey)) {
      groupsMap.set(dateKey, {
        dateKey,
        displayLabel: formatDayLabel(dateObj),
        rawDate: dateObj,
        entries: [],
      });
    }

    groupsMap.get(dateKey)!.entries.push(entry);
  });

  // Sort groups by date descending
  const sortedGroups = Array.from(groupsMap.values()).sort(
    (a, b) => b.rawDate.getTime() - a.rawDate.getTime()
  );

  // Sort entries within each day by time descending (e.g. 21:55 before 18:09 before 08:21)
  sortedGroups.forEach((group) => {
    group.entries.sort((a, b) => {
      const timeA = a.formattedTime || '00:00';
      const timeB = b.formattedTime || '00:00';
      return timeB.localeCompare(timeA);
    });
  });

  return sortedGroups;
}
