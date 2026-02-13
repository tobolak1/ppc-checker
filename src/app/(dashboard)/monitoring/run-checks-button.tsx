"use client";

import { useState } from "react";

export function RunChecksButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function handleRun() {
    setLoading(true);
    setResult("");
    const res = await fetch("/api/checks/run", { method: "POST" });
    const data = await res.json();
    setResult(data.message || data.error || "Done");
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      {result && <span className="text-sm text-gray-500">{result}</span>}
      <button
        onClick={handleRun}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Running..." : "Run Checks"}
      </button>
    </div>
  );
}
