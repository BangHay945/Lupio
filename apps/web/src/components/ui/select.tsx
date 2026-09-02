"use client";

import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function CustomSelect({
  value,
  defaultValue,
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  className,
  triggerClassName,
}: CustomSelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentValue = value !== undefined ? value : internalValue;
  const selectedOption = options.find((o) => o.value === currentValue);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSelect = (val: string) => {
    if (value === undefined) {
      setInternalValue(val);
    }
    if (onChange) {
      onChange(val);
    }
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={cn(
          "group flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-zinc-900/90 px-3.5 text-xs text-foreground transition-all duration-200 hover:border-slate-300 dark:hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
          open && "border-emerald-500/50 ring-2 ring-emerald-500/20",
          disabled && "cursor-not-allowed opacity-50",
          triggerClassName
        )}
      >
        <span className={cn("truncate font-medium transition-colors", !selectedOption && "text-muted-foreground")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 dark:text-zinc-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 shrink-0 transition-all duration-200",
            open && "rotate-180 text-emerald-500 dark:text-emerald-400"
          )}
        />
      </button>

      {/* Floating Glassmorphic Dropdown Panel */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 max-h-64 w-full min-w-[200px] overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-zinc-950 p-1.5 shadow-xl dark:shadow-2xl shadow-black/10 dark:shadow-black/80 backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-150">
          {options.length === 0 ? (
            <div className="py-3 text-center text-xs text-muted-foreground">
              No options available
            </div>
          ) : (
            <div className="space-y-1">
              {options.map((opt) => {
                const isSelected = opt.value === currentValue;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "group relative flex w-full cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all duration-150 border",
                      isSelected
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold"
                        : "border-transparent bg-transparent text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-950 dark:hover:text-white"
                    )}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate transition-colors">{opt.label}</span>
                      {opt.description && (
                        <span className="text-[10px] text-muted-foreground font-normal truncate mt-0.5">
                          {opt.description}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
