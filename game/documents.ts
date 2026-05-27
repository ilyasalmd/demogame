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
    title: "Q4 Client Demo",
    subtitle: "Performance & ROI Overview — CONFIDENTIAL",
    pages: [
      {
        heading: "Headline Performance",
        chart: {
          type: "bar",
          labels: ["Q1", "Q2", "Q3", "Q4 (Proj)"],
          values: [74, 79, 82, 94],
          alert: "Q4 figure uses unverified validation set. See internal note.",
        },
      },
      {
        heading: "Key Claims to Client",
        body: "• Model accuracy improved 12pp in Q4\n• Validation on 12,000 independent test cases\n• Ready for live deployment Q1 2027\n• 94.2% accuracy benchmark vs industry standard 78%",
      },
      {
        highlight: {
          label: "Internal Note (NOT for client)",
          value: "Validate before presenting 94.2% figure",
          note: "Oliver has approved showing Q4 figure pending Theo's sign-off. Theo has NOT signed off. Priya has flagged for compliance review.",
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
