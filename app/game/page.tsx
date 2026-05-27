"use client";
import dynamic from "next/dynamic";

const IncidentGame = dynamic(() => import("@/IncidentGame"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-[#050508] flex items-center justify-center">
      <div className="text-slate-600 text-sm font-mono">Initialising…</div>
    </div>
  ),
});

export default function GamePage() {
  return <IncidentGame />;
}
