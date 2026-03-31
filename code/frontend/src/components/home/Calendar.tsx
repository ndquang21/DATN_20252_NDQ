import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CalendarProps = {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
};

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseDateStr(dateStr: string): { y: number; m: number; d: number } {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return { y, m: mo - 1, d };
}

function todayParts() {
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
}

export default function Calendar({
  selectedDate,
  onSelectDate,
}: CalendarProps) {
  const initial = parseDateStr(selectedDate);
  const [viewYear, setViewYear] = useState(initial.y);
  const [viewMonth, setViewMonth] = useState(initial.m);

  const today = todayParts();
  const todayStr = toDateStr(today.y, today.m, today.d);  useEffect(() => {
    const { y, m } = parseDateStr(selectedDate);
    setViewYear(y);
    setViewMonth(m);
  }, [selectedDate]);

  const monthLabel = `Tháng ${viewMonth + 1}, ${viewYear}`;

  const cells = useMemo(() => {
    const firstDow = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const result: Array<{ type: "empty" } | { type: "day"; day: number }> = [];

    for (let i = 0; i < firstDow; i++) {
      result.push({ type: "empty" });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      result.push({ type: "day", day });
    }

    return result;
  }, [viewYear, viewMonth]);

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToday() {
    onSelectDate(todayStr);
  }

  return (
    <div className="bg-white rounded-2xl border border-outline-variant p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-display font-extrabold text-lg text-on-surface">
            Lịch
          </h3>
          <p className="text-xs font-semibold text-on-surface-variant mt-0.5">
            {monthLabel}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={goPrevMonth}
            aria-label="Tháng trước"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-on-surface-variant cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="text-[11px] font-bold text-primary px-2.5 py-1 rounded-lg hover:bg-primary/10 cursor-pointer transition-colors"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={goNextMonth}
            aria-label="Tháng sau"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-on-surface-variant cursor-pointer transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-center text-[10px] font-bold uppercase text-on-surface-variant py-1"
          >
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (cell.type === "empty") {
            return <div key={`e-${idx}`} className="aspect-square" />;
          }

          const dateStr = toDateStr(viewYear, viewMonth, cell.day);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-display font-bold transition-all cursor-pointer ${
                isSelected
                  ? "bg-primary text-white shadow-sm"
                  : isToday
                    ? "ring-2 ring-primary ring-inset text-primary bg-primary/5 hover:bg-primary/10"
                    : "text-on-surface hover:bg-surface-container-low"
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>


    </div>
  );
}