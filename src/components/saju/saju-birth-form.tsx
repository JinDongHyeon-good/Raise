"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const selectClass = `${inputClass} flex cursor-pointer items-center justify-between gap-2 pr-9 text-left`;

function range(start: number, end: number) {
  const arr: number[] = [];
  for (let i = start; i <= end; i += 1) arr.push(i);
  return arr;
}

type SelectOption = { value: string; label: string };

function Select({
  value,
  onChange,
  options,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onOutsideClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onOutsideClick);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onOutsideClick);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.querySelector('[data-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={selectClass}
      >
        <span className={selected ? "" : "text-[var(--piclick-ink-muted)]"}>
          {selected ? selected.label : placeholder}
        </span>
      </button>
      <ChevronDown
        className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--piclick-ink-muted)] transition-transform ${
          open ? "rotate-180" : ""
        }`}
        strokeWidth={1.75}
        aria-hidden
      />
      {open ? (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute left-0 top-full z-20 mt-1.5 max-h-56 w-full min-w-[5rem] overflow-y-auto rounded-xl border border-[var(--piclick-line)] bg-white p-1 shadow-lg shadow-black/10"
        >
          {options.map((o) => {
            const isSelected = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-selected={isSelected}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? "bg-[var(--piclick-green)]/10 font-semibold text-[var(--piclick-green-deep)]"
                      : "text-[var(--piclick-ink)] hover:bg-[var(--piclick-beige)]"
                  }`}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
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

  const genderOptions = useMemo<SelectOption[]>(
    () => [
      { value: "unknown", label: t("unknown") },
      { value: "male", label: t("male") },
      { value: "female", label: t("female") },
    ],
    [t],
  );
  const yearOptions = useMemo<SelectOption[]>(() => years.map((y) => ({ value: String(y), label: String(y) })), [years]);
  const monthOptions = useMemo<SelectOption[]>(() => months.map((m) => ({ value: String(m), label: String(m) })), [months]);
  const dayOptions = useMemo<SelectOption[]>(() => days.map((d) => ({ value: String(d), label: String(d) })), [days]);
  const hourOptions = useMemo<SelectOption[]>(
    () => hours.map((h) => ({ value: String(h), label: `${String(h).padStart(2, "0")}${t("hourUnit")}` })),
    [hours, t],
  );
  const minuteOptions = useMemo<SelectOption[]>(
    () => minutes.map((m) => ({ value: String(m), label: `${String(m).padStart(2, "0")}${t("minuteUnit")}` })),
    [minutes, t],
  );

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
          <Select
            value={value.gender}
            onChange={(v) => set("gender", v as BirthValue["gender"])}
            options={genderOptions}
          />
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
          <Select value={value.year} onChange={(v) => set("year", v)} options={yearOptions} placeholder={t("yearUnit")} />
          <Select value={value.month} onChange={(v) => set("month", v)} options={monthOptions} placeholder={t("monthUnit")} />
          <Select value={value.day} onChange={(v) => set("day", v)} options={dayOptions} placeholder={t("dayUnit")} />
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
            <Select value={value.hour} onChange={(v) => set("hour", v)} options={hourOptions} placeholder={t("hourUnit")} />
            <Select value={value.minute} onChange={(v) => set("minute", v)} options={minuteOptions} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
