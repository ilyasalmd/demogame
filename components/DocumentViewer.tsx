"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { useEffect } from "react";
import type { DocumentItem, DocumentPage } from "@/game/documents";

export type { DocumentItem, DocumentPage };
export { DOCUMENTS } from "@/game/documents";

export function DocumentViewer() {
  const { activeDocument, closeDocument } = useGameStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDocument?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeDocument]);

  return (
    <AnimatePresence>
      {activeDocument && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.85)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeDocument}
        >
          <motion.div
            className="relative max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col rounded-2xl"
            style={{
              background: activeDocument.type === "slides" ? "#0a0a1e" : "#f8f7f0",
              border: activeDocument.type === "slides"
                ? "1px solid rgba(99,102,241,0.3)"
                : "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
            }}
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-start justify-between px-6 py-4 flex-shrink-0"
              style={{
                background: activeDocument.type === "slides" ? "#0d0d28" : "#f0ece0",
                borderBottom: activeDocument.type === "slides"
                  ? "1px solid rgba(99,102,241,0.2)"
                  : "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded uppercase tracking-wider"
                    style={{
                      background: activeDocument.type === "slides" ? "rgba(99,102,241,0.2)" : "rgba(0,0,0,0.08)",
                      color: activeDocument.type === "slides" ? "#818cf8" : "#666",
                    }}
                  >
                    {activeDocument.type === "slides" ? "PRESENTATION" : "DOCUMENT"}
                  </span>
                  <span className="text-xs" style={{ color: activeDocument.type === "slides" ? "#475569" : "#999" }}>
                    CONFIDENTIAL
                  </span>
                </div>
                <h2
                  className="text-lg font-bold"
                  style={{ color: activeDocument.type === "slides" ? "white" : "#1a1a1a" }}
                >
                  {activeDocument.title}
                </h2>
                {activeDocument.subtitle && (
                  <p className="text-xs mt-0.5" style={{ color: activeDocument.type === "slides" ? "#64748b" : "#888" }}>
                    {activeDocument.subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={closeDocument}
                className="text-2xl cursor-pointer transition-opacity hover:opacity-70 ml-4"
                style={{ color: activeDocument.type === "slides" ? "#475569" : "#666" }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {activeDocument.pages.map((page, i) => (
                <PageContent key={i} page={page} isDark={activeDocument.type === "slides"} />
              ))}
            </div>

            {/* Footer */}
            <div
              className="px-6 py-3 flex items-center justify-between flex-shrink-0 text-xs font-mono"
              style={{
                borderTop: activeDocument.type === "slides"
                  ? "1px solid rgba(99,102,241,0.15)"
                  : "1px solid rgba(0,0,0,0.08)",
                color: "#64748b",
                background: activeDocument.type === "slides" ? "#0d0d28" : "#f0ece0",
              }}
            >
              <span>ASTERION LABS — INTERNAL USE ONLY</span>
              <span>ESC to close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PageContent({ page, isDark }: { page: DocumentPage; isDark: boolean }) {
  const textColor = isDark ? "#cbd5e1" : "#1a1a1a";
  const mutedColor = isDark ? "#64748b" : "#888";
  const headingColor = isDark ? "white" : "#111";

  return (
    <div className="space-y-3">
      {page.heading && (
        <h3 className="font-semibold text-base" style={{ color: headingColor }}>
          {page.heading}
        </h3>
      )}
      {page.body && (
        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: textColor }}>
          {page.body}
        </p>
      )}
      {page.table && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                {page.table.headers.map((h, i) => (
                  <th
                    key={i}
                    className="text-left py-2 px-3 font-mono"
                    style={{
                      background: isDark ? "rgba(99,102,241,0.15)" : "rgba(0,0,0,0.06)",
                      color: isDark ? "#818cf8" : "#555",
                      borderBottom: `1px solid ${isDark ? "rgba(99,102,241,0.2)" : "rgba(0,0,0,0.1)"}`,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {page.table.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="py-2 px-3 text-xs"
                      style={{
                        color: cell.includes("❌") ? "#ef4444"
                          : cell.includes("⚠") ? "#f59e0b"
                          : textColor,
                        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"}`,
                        fontWeight: ci === 0 ? 500 : 400,
                        fontFamily: ci > 0 ? "monospace" : "inherit",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {page.highlight && (
        <div
          className="rounded-xl px-4 py-3"
          style={{
            background: `${page.highlight.color}12`,
            border: `1px solid ${page.highlight.color}35`,
          }}
        >
          <p className="text-xs font-mono mb-1" style={{ color: page.highlight.color }}>
            {page.highlight.label}
          </p>
          <p className="font-semibold text-sm mb-1" style={{ color: isDark ? "white" : "#1a1a1a" }}>
            {page.highlight.value}
          </p>
          {page.highlight.note && (
            <p className="text-xs leading-relaxed" style={{ color: mutedColor }}>
              {page.highlight.note}
            </p>
          )}
        </div>
      )}
      {page.chart && (
        <BarChart chart={page.chart} isDark={isDark} />
      )}
    </div>
  );
}

function BarChart({
  chart,
  isDark,
}: {
  chart: NonNullable<DocumentPage["chart"]>;
  isDark: boolean;
}) {
  const max = Math.max(...chart.values);
  const barColor = isDark ? "#6366f1" : "#4f46e5";

  return (
    <div>
      <div className="flex items-end gap-2 h-32 mb-2">
        {chart.labels.map((label, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
            <span
              className="text-xs font-mono font-bold"
              style={{ color: chart.values[i] === max ? "#ef4444" : (isDark ? "#94a3b8" : "#555") }}
            >
              {chart.values[i]}%
            </span>
            <div
              className="w-full rounded-t transition-all"
              style={{
                height: `${(chart.values[i] / 100) * 90}%`,
                background: chart.values[i] === max
                  ? "rgba(239,68,68,0.6)"
                  : `${barColor}60`,
                border: `1px solid ${chart.values[i] === max ? "rgba(239,68,68,0.8)" : `${barColor}80`}`,
              }}
            />
            <span className="text-xs" style={{ color: isDark ? "#64748b" : "#999" }}>{label}</span>
          </div>
        ))}
      </div>
      {chart.alert && (
        <p className="text-xs font-mono text-amber-400 mt-1">⚠ {chart.alert}</p>
      )}
    </div>
  );
}
