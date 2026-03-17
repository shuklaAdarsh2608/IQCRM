"use client";

import { useState, useRef, useEffect } from "react";

/**
 * Enhanced dropdown select with consistent, polished UI.
 * @param {Object} props
 * @param {Array<{value: string|number, label: string}>} props.options
 * @param {string|number} props.value
 * @param {function(string|number)} props.onChange
 * @param {string} [props.placeholder]
 * @param {boolean} [props.disabled]
 * @param {string} [props.className]
 * @param {string} [props.label]
 */
export function Select({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className = "",
  label
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selected = options.find((o) => String(o.value) === String(value));
  const display = selected ? selected.label : placeholder;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`
          flex w-full min-w-[140px] items-center justify-between gap-2 rounded-xl border bg-white px-4 py-2.5 text-left text-sm
          transition-all duration-200
          ${disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500"
            : "cursor-pointer border-slate-200 text-slate-800 hover:border-orange-200 hover:bg-orange-50/50 focus:outline-none focus:ring-2 focus:ring-orange-400/60 focus:ring-offset-1 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-orange-500/50 dark:hover:bg-orange-500/10 dark:focus:ring-offset-slate-900"
          }
          ${open ? "border-orange-300 bg-orange-50/50 ring-2 ring-orange-400/20 dark:border-orange-500/50 dark:bg-orange-500/10 dark:ring-orange-400/30" : ""}
        `}
      >
        <span className="truncate">{display}</span>
        <span
          className={`
            shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-500
            ${open ? "rotate-180" : ""}
          `}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          className="
            absolute left-0 top-full z-50 mt-1.5 max-h-56 min-w-full overflow-auto rounded-xl border border-slate-200
            bg-white py-1 shadow-lg shadow-slate-200/50
            dark:border-slate-600 dark:bg-slate-900 dark:shadow-slate-800/50
          "
          style={{ minWidth: "var(--select-width, 100%)" }}
        >
          {options.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">No options</div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`
                    w-full px-4 py-2.5 text-left text-sm transition-colors
                    first:rounded-t-[10px] last:rounded-b-[10px]
                    ${isSelected
                      ? "bg-orange-100 text-orange-800 font-medium dark:bg-orange-500/20 dark:text-orange-300"
                      : "text-slate-700 hover:bg-slate-50 active:bg-orange-50 dark:text-slate-200 dark:hover:bg-slate-800 dark:active:bg-orange-500/10"
                    }
                  `}
                >
                  {opt.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
