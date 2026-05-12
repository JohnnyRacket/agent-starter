"use client";

import {
  AlertTriangle,
  ChevronDown,
  GitBranch,
  Hammer,
  Loader2,
  Terminal,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type DetectMode =
  | "tool"
  | "sandbox"
  | "workflow-tool"
  | "workflow-sandbox";

type DetectButtonProps = {
  onDetect: (mode: DetectMode) => void;
  loading: boolean;
  disabled?: boolean;
};

type MenuItem = {
  mode: DetectMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const MENU_ITEMS: MenuItem[] = [
  {
    mode: "tool",
    label: "Tools",
    description: "agent calls tool directly",
    icon: Hammer,
  },
  {
    mode: "sandbox",
    label: "Sandbox",
    description: "agent uses bash in sandbox",
    icon: Terminal,
  },
  {
    mode: "workflow-tool",
    label: "Workflow + Tools",
    description: "workflow agent with direct tool",
    icon: GitBranch,
  },
  {
    mode: "workflow-sandbox",
    label: "Workflow + Sandbox",
    description: "workflow agent with bash sandbox",
    icon: GitBranch,
  },
];

export function DetectButton({
  onDetect,
  loading,
  disabled,
}: DetectButtonProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex">
        <button
          type="button"
          onClick={() => onDetect("tool")}
          disabled={loading || disabled}
          className={cn(
            "inline-flex items-center gap-2 rounded-l-lg px-4 py-2 font-medium text-sm transition-colors",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Detect Anomalies
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          disabled={loading || disabled}
          className={cn(
            "inline-flex items-center rounded-r-lg border-primary-foreground/20 border-l px-2 py-2 transition-colors",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 z-10 mt-1 w-72 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          {MENU_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.mode}
                type="button"
                onClick={() => {
                  onDetect(item.mode);
                  setOpen(false);
                }}
                disabled={loading}
                className={cn(
                  "flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-muted/50",
                  index !== 0 && "border-border border-t",
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4" />
                  <span className="font-medium">{item.label}</span>
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
