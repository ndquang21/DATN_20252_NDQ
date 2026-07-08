// Chuyển chuỗi "YYYY-MM-DD" thành Date (theo UTC).
export function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

// Chuyển Date thành chuỗi "YYYY-MM-DD".
export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
