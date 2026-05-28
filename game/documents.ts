export interface DocumentPage {
  heading?: string;
  body?: string;
  table?: { headers: string[]; rows: string[][] };
  highlight?: { label: string; value: string; note?: string; color?: string };
  chart?: { type: "bar"; labels: string[]; values: number[]; alert?: string };
}

export interface DocumentItem {
  id: string;
  type: "document" | "slides" | "dashboard";
  title: string;
  subtitle?: string;
  pages: DocumentPage[];
}

export const DOCUMENTS: Record<string, DocumentItem> = {
  validation_report: {
    id: "validation_report",
    type: "document",
    title: "Model Validation Report",
    subtitle: "Draft v2.4 — Asterion Labs Internal",
    pages: [
      {
        heading: "Executive Summary",
        body: "This report summarises the performance evaluation of the Client Demo Model v2.4 prior to the Q4 enterprise presentation. Results are preliminary and subject to final data pipeline verification.",
      },
      {
        table: {
          headers: ["Metric", "Previous", "Current", "Change", "Status"],
          rows: [
            ["Validation Accuracy", "82.1%", "94.2%", "+12.1pp", "⚠ REVIEW"],
            ["F1 Score", "0.81", "0.91", "+0.10", "—"],
            ["AUC-ROC", "0.88", "0.93", "+0.05", "OK"],
            ["Data Rows", "12,000", "12,000", "—", "OK"],
            ["Duplicate IDs", "0", "1,460", "+1,460", "❌ FLAGGED"],
          ],
        },
      },
      {
        highlight: {
          label: "Critical Note",
          value: "Dedupe pending — do not use in prod",
          note: "Flagged by Data Engineering on 2026-05-26. Duplicate row removal has NOT been applied to the validation set used in this report. The +12.1pp accuracy improvement should be treated as UNVERIFIED until dedupe pipeline is re-run.",
          color: "#ef4444",
        },
      },
    ],
  },

  demo_slides: {
    id: "demo_slides",
    type: "slides",
    title: "Asterion Labs — AI Credit Risk Model",
    subtitle: "Q4 2026 Enterprise Client Briefing • CONFIDENTIAL",
    pages: [
      {
        heading: "Performance vs. Industry Benchmark",
        table: {
          headers: ["Metric", "Q3 2026", "Q4 2026", "Industry Avg", "Δ vs Benchmark"],
          rows: [
            ["Validation Accuracy", "82.1%", "94.2%", "78.4%", "+15.8pp"],
            ["F1 Score (weighted)", "0.811", "0.912", "0.791", "+0.121"],
            ["AUC-ROC", "0.882", "0.931", "0.851", "+0.080"],
            ["False Positive Rate", "4.2%", "2.1%", "6.8%", "−4.7pp"],
            ["Avg Inference Latency", "18ms", "11ms", "—", "< 12ms SLA ✓"],
          ],
        },
      },
      {
        heading: "Accuracy Trajectory — 2026",
        chart: {
          type: "bar",
          labels: ["Q1", "Q2", "Q3", "Q4*"],
          values: [74, 79, 82, 94],
          alert: "* Q4 figure pending final engineering sign-off (T. Marsh) — internal use only",
        },
      },
      {
        heading: "Deployment Readiness & Client Value",
        body: "Integration confirmed with client data lake (REST API, OAuth 2.0).\nLive deployment target: Q1 2027 — subject to final validation sign-off.\n\nKey differentiators over incumbent vendor:\n• +15.8pp accuracy on client holdout set\n• Real-time scoring < 12ms (vs. 340ms batch incumbent)\n• Built-in model drift detection with auto-retrain trigger\n• Full SOC 2 Type II audit trail — regulatory ready",
      },
      {
        highlight: {
          label: "⚠  INTERNAL — DO NOT DISTRIBUTE TO CLIENT",
          value: "Q4 accuracy (94.2%) is NOT cleared for external use",
          note: "Data Engineering flagged 1,460 duplicate rows in the validation set used to produce the Q4 figure. Theo Marsh (Engineering Lead) has NOT signed off. Oliver Grant has conditionally approved subject to Theo's clearance. Priya Nair has escalated to Compliance. Present Q3 figures (82.1%) only unless engineering confirms deduplication is resolved before the session.",
          color: "#f59e0b",
        },
      },
    ],
  },

  compliance_memo: {
    id: "compliance_memo",
    type: "document",
    title: "Compliance Risk Memo",
    subtitle: "Priya Nair — Internal Distribution Only",
    pages: [
      {
        heading: "Risk Assessment",
        body: "Presenting unverified model metrics to a prospective enterprise client constitutes a potential misrepresentation risk under Section 4 of our Client Data Integrity Policy.",
      },
      {
        table: {
          headers: ["Risk", "Severity", "Owner", "Status"],
          rows: [
            ["Unverified accuracy metric", "HIGH", "Theo Marsh", "Open"],
            ["Client-facing presentation", "MEDIUM", "Oliver Grant", "Proceeding"],
            ["Duplicate data not remediated", "HIGH", "Data Eng.", "In progress"],
          ],
        },
      },
      {
        highlight: {
          label: "Recommendation",
          value: "Delay or caveat the accuracy section",
          note: "All parties presenting must acknowledge this memo. Document the decision either way.",
          color: "#10b981",
        },
      },
    ],
  },
};
