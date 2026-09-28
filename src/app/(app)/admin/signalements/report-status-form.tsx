"use client";

import { useState, useTransition } from "react";
import { updateReportStatus } from "./actions";

const STATUSES = [
  { value: "open", label: "Ouvert" },
  { value: "fixed", label: "Corrigé" },
  { value: "rejected", label: "Rejeté" },
] as const;

export function ReportStatusForm({ reportId, status }: { reportId: string; status: "open" | "fixed" | "rejected" }) {
  const [current, setCurrent] = useState(status);
  const [pending, startTransition] = useTransition();

  function change(next: (typeof STATUSES)[number]["value"]) {
    setCurrent(next);
    startTransition(async () => {
      const result = await updateReportStatus(reportId, next);
      if (result.status === "error") setCurrent(status);
    });
  }

  return (
    <label className="text-sm">
      <span className="sr-only">Statut du signalement</span>
      <select
        value={current}
        onChange={(e) => change(e.target.value as (typeof STATUSES)[number]["value"])}
        disabled={pending}
        className="field h-9 w-auto px-2"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}
