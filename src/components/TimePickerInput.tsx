import { useMemo } from "react";

interface TimePickerInputProps {
  value: string; // "HH:MM" 24-hour format or ""
  onChange: (value: string) => void;
  label?: string;
}

function parse24to12(value: string): {
  hour12: number;
  minute: number;
  period: "AM" | "PM";
} {
  if (!value) return { hour12: 12, minute: 0, period: "AM" };

  const [h, m] = value.split(":").map(Number);
  const minute = m ?? 0;

  if (h === 0) return { hour12: 12, minute, period: "AM" };
  if (h === 12) return { hour12: 12, minute, period: "PM" };
  if (h > 12) return { hour12: h - 12, minute, period: "PM" };
  return { hour12: h, minute, period: "AM" };
}

function to24(hour12: number, minute: number, period: "AM" | "PM"): string {
  let h = hour12;
  if (period === "AM" && h === 12) h = 0;
  else if (period === "PM" && h !== 12) h += 12;

  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// Round minute to nearest 5-min increment for display
function snapMinute(m: number): number {
  return Math.round(m / 5) * 5 === 60 ? 55 : Math.round(m / 5) * 5;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export default function TimePickerInput({
  value,
  onChange,
  label,
}: TimePickerInputProps) {
  const { hour12, minute, period } = useMemo(() => {
    const parsed = parse24to12(value);
    return { ...parsed, minute: snapMinute(parsed.minute) };
  }, [value]);

  const handleHourChange = (newHour: number) => {
    onChange(to24(newHour, minute, period));
  };

  const handleMinuteChange = (newMinute: number) => {
    onChange(to24(hour12, newMinute, period));
  };

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    if (newPeriod !== period) {
      onChange(to24(hour12, minute, newPeriod));
    }
  };

  const selectClass =
    "px-2 py-2.5 rounded-lg border border-border bg-canvas text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer appearance-none";

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-text mb-2">
          {label}
        </label>
      )}
      <div className="flex flex-col gap-2">
        {/* Hour : Minute row */}
        <div className="flex items-center gap-1.5">
          <select
            value={hour12}
            onChange={(e) => handleHourChange(Number(e.target.value))}
            className={`${selectClass} flex-1 min-w-0`}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>

          <span className="text-text font-medium text-sm select-none">:</span>

          <select
            value={minute}
            onChange={(e) => handleMinuteChange(Number(e.target.value))}
            className={`${selectClass} flex-1 min-w-0`}
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>

        {/* AM/PM toggle row */}
        <div className="flex rounded-lg border border-border overflow-hidden w-full">
          <button
            type="button"
            onClick={() => handlePeriodChange("AM")}
            className={`flex-1 py-1.5 text-xs font-semibold transition-all ${
              period === "AM"
                ? "bg-primary text-white"
                : "bg-canvas text-text-muted hover:bg-accent/30"
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange("PM")}
            className={`flex-1 py-1.5 text-xs font-semibold transition-all ${
              period === "PM"
                ? "bg-primary text-white"
                : "bg-canvas text-text-muted hover:bg-accent/30"
            }`}
          >
            PM
          </button>
        </div>
      </div>
    </div>
  );
}

/** Returns default time_in (now) and time_out (now + 8h) in "HH:MM" format */
export function getDefaultTimes(): { timeIn: string; timeOut: string } {
  const now = new Date();
  const h = now.getHours();
  const m = snapMinute(now.getMinutes());

  const timeIn = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  const outDate = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const oh = outDate.getHours();
  const om = snapMinute(outDate.getMinutes());
  const timeOut = `${String(oh).padStart(2, "0")}:${String(om).padStart(2, "0")}`;

  return { timeIn, timeOut };
}
