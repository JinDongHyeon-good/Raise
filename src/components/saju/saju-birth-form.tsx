"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

export type BirthValue = {
  name: string;
  gender: "male" | "female" | "unknown";
  calendar: "solar" | "lunar";
  isLeapMonth: boolean;
  year: string;
  month: string;
  day: string;
  timeKnown: boolean;
  hour: string;
  minute: string;
};

export const emptyBirthValue: BirthValue = {
  name: "",
  gender: "unknown",
  calendar: "solar",
  isLeapMonth: false,
  year: "",
  month: "",
  day: "",
  timeKnown: true,
  hour: "",
  minute: "0",
};

const inputClass =
  "w-full rounded-xl border border-[var(--piclick-line)] bg-white px-3.5 py-2.5 text-sm font-medium text-[var(--piclick-ink)] outline-none transition hover:border-[var(--piclick-green)]/40 focus:border-[var(--piclick-green)] focus:ring-2 focus:ring-[var(--piclick-green)]/15";

const selectClass = `${inputClass} appearance-none cursor-pointer pr-9`;

function range(start: number, end: number) {
  const arr: number[] = [];
  for (let i = start; i <= end; i += 1) arr.push(i);
  return arr;
}

function Select({
  value,
  onChange,
  className = "",
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative ${className}`}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--piclick-ink-muted)]"
        strokeWidth={1.75}
        aria-hidden
      />
    </div>
  );
}

export function SajuBirthForm({
  value,
  onChange,
}: {
  value: BirthValue;
  onChange: (next: BirthValue) => void;
}) {
  const t = useTranslations("sajuApp.form");
  const set = <K extends keyof BirthValue>(key: K, v: BirthValue[K]) => onChange({ ...value, [key]: v });

  const currentYear = 2025;
  const years = useMemo(() => range(1930, currentYear).reverse(), []);
  const months = useMemo(() => range(1, 12), []);
  const days = useMemo(() => range(1, 31), []);
  const hours = useMemo(() => range(0, 23), []);
  const minutes = useMemo(() => range(0, 59), []);

  return (
    <div className="space-y-4">
      {/* 이름 + 성별 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[var(--piclick-ink-muted)]">{t("name")}</span>
          <input
            type="text"
            value={value.name}
            maxLength={40}
            placeholder={t("namePlaceholder")}
            onChange={(e) => set("name", e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[var(--piclick-ink-muted)]">{t("gender")}</span>
          <Select value={value.gender} onChange={(v) => set("gender", v as BirthValue["gender"])}>
            <option value="unknown">{t("unknown")}</option>
            <option value="male">{t("male")}</option>
            <option value="female">{t("female")}</option>
          </Select>
        </label>
      </div>

      {/* 달력 유형 */}
      <div>
        <span className="mb-1.5 block text-xs font-medium text-[var(--piclick-ink-muted)]">{t("calendar")}</span>
        <div className="flex flex-wrap items-center gap-2">
          {(["solar", "lunar"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set("calendar", c)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                value.calendar === c
                  ? "border-[var(--piclick-green)] bg-[var(--piclick-green)] text-white"
                  : "border-[var(--piclick-line)] bg-white text-[var(--piclick-ink-muted)] hover:border-[var(--piclick-green)]/40"
              }`}
            >
              {t(c)}
            </button>
          ))}
          {value.calendar === "lunar" ? (
            <label className="ml-1 inline-flex cursor-pointer items-center gap-1.5 text-sm text-[var(--piclick-ink-muted)]">
              <input
                type="checkbox"
                checked={value.isLeapMonth}
                onChange={(e) => set("isLeapMonth", e.target.checked)}
                className="h-4 w-4 accent-[var(--piclick-green)]"
              />
              {t("leapMonth")}
            </label>
          ) : null}
        </div>
      </div>

      {/* 생년월일 */}
      <div>
        <span className="mb-1.5 block text-xs font-medium text-[var(--piclick-ink-muted)]">{t("birthDate")}</span>
        <div className="grid grid-cols-3 gap-2">
          <Select value={value.year} onChange={(v) => set("year", v)}>
            <option value="">{t("yearUnit")}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
          <Select value={value.month} onChange={(v) => set("month", v)}>
            <option value="">{t("monthUnit")}</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select value={value.day} onChange={(v) => set("day", v)}>
            <option value="">{t("dayUnit")}</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* 태어난 시각 */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-[var(--piclick-ink-muted)]">{t("birthTime")}</span>
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[var(--piclick-ink-muted)]">
            <input
              type="checkbox"
              checked={!value.timeKnown}
              onChange={(e) => set("timeKnown", !e.target.checked)}
              className="h-4 w-4 accent-[var(--piclick-green)]"
            />
            {t("timeUnknown")}
          </label>
        </div>
        {value.timeKnown ? (
          <div className="grid grid-cols-2 gap-2">
            <Select value={value.hour} onChange={(v) => set("hour", v)}>
              <option value="">{t("hourUnit")}</option>
              {hours.map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}
                  {t("hourUnit")}
                </option>
              ))}
            </Select>
            <Select value={value.minute} onChange={(v) => set("minute", v)}>
              {minutes.map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, "0")}
                  {t("minuteUnit")}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>
    </div>
  );
}
