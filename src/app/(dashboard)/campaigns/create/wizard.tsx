"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
}

const CAMPAIGN_TYPES = [
  { value: "SHOPPING", label: "Shopping (Standard)", platform: "GOOGLE_ADS" },
  { value: "PMAX", label: "Performance Max", platform: "GOOGLE_ADS" },
  { value: "SEARCH", label: "Search", platform: "GOOGLE_ADS" },
  { value: "SEARCH_DSA", label: "Search (DSA)", platform: "GOOGLE_ADS" },
  { value: "SKLIK_PRODUCT", label: "Produktove kampane", platform: "SKLIK" },
  { value: "SKLIK_TEXT", label: "Textove kampane", platform: "SKLIK" },
];

const SEGMENTATION_OPTIONS = [
  { value: "category", label: "By Category" },
  { value: "brand", label: "By Brand" },
  { value: "priceRange", label: "By Price Range" },
  { value: "customLabel", label: "By Custom Label" },
];

export function CampaignWizard({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    projectId: projects[0]?.id || "",
    name: "",
    campaignType: "SHOPPING",
    platform: "GOOGLE_ADS",
    segmentation: "category",
    budget: "",
    biddingStrategy: "MAXIMIZE_CLICKS",
    headlines: ["", "", ""],
    descriptions: ["", ""],
  });

  function updateForm(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-set platform based on campaign type
      if (field === "campaignType") {
        const ct = CAMPAIGN_TYPES.find((t) => t.value === value);
        if (ct) next.platform = ct.platform;
      }
      return next;
    });
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/campaigns/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: form.projectId,
          name: form.name,
          campaignType: form.campaignType,
          platform: form.platform,
          segmentation: [{ type: form.segmentation, field: form.segmentation }],
          adTemplates: [{
            headlines: form.headlines.filter(Boolean),
            descriptions: form.descriptions.filter(Boolean),
          }],
          budget: form.budget ? parseFloat(form.budget) : undefined,
          biddingStrategy: form.biddingStrategy,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create template");
      }

      router.push("/campaigns");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-2 flex-1 rounded ${s <= step ? "bg-blue-600" : "bg-gray-200"}`} />
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {/* Step 1: Basic info */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">1. Campaign Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select value={form.projectId} onChange={(e) => updateForm("projectId", e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm">
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
            <input value={form.name} onChange={(e) => updateForm("name", e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. Shopping - Electronics" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
            <select value={form.campaignType} onChange={(e) => updateForm("campaignType", e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm">
              {CAMPAIGN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label} ({t.platform})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Budget</label>
              <input type="number" value={form.budget} onChange={(e) => updateForm("budget", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. 500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bidding Strategy</label>
              <select value={form.biddingStrategy} onChange={(e) => updateForm("biddingStrategy", e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm">
                <option value="MAXIMIZE_CLICKS">Maximize Clicks</option>
                <option value="MAXIMIZE_CONVERSIONS">Maximize Conversions</option>
                <option value="TARGET_CPA">Target CPA</option>
                <option value="TARGET_ROAS">Target ROAS</option>
                <option value="MANUAL_CPC">Manual CPC</option>
              </select>
            </div>
          </div>
          <button onClick={() => setStep(2)} disabled={!form.name}
            className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
            Next
          </button>
        </div>
      )}

      {/* Step 2: Segmentation */}
      {step === 2 && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">2. Product Segmentation</h2>
          <p className="text-sm text-gray-500">Choose how to split products into ad groups.</p>
          <div className="grid grid-cols-2 gap-3">
            {SEGMENTATION_OPTIONS.map((opt) => (
              <button key={opt.value}
                onClick={() => updateForm("segmentation", opt.value)}
                className={`p-4 rounded-lg border text-left text-sm ${
                  form.segmentation === opt.value ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                }`}>
                <span className="font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-6 py-2 rounded-md text-sm border hover:bg-gray-50">Back</button>
            <button onClick={() => setStep(3)} className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm hover:bg-blue-700">Next</button>
          </div>
        </div>
      )}

      {/* Step 3: Ad Templates */}
      {step === 3 && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">3. Ad Templates</h2>
          <p className="text-sm text-gray-500">
            Use placeholders: {"{product_name}"}, {"{brand}"}, {"{price}"}, {"{category}"}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Headlines (max 30 chars each)</label>
            {form.headlines.map((h, i) => (
              <input key={i} value={h}
                onChange={(e) => {
                  const next = [...form.headlines];
                  next[i] = e.target.value;
                  setForm((prev) => ({ ...prev, headlines: next }));
                }}
                className="w-full border rounded-md px-3 py-2 text-sm mb-2"
                placeholder={`Headline ${i + 1} — e.g. {product_name} | {brand}`}
                maxLength={30} />
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Descriptions (max 90 chars each)</label>
            {form.descriptions.map((d, i) => (
              <textarea key={i} value={d}
                onChange={(e) => {
                  const next = [...form.descriptions];
                  next[i] = e.target.value;
                  setForm((prev) => ({ ...prev, descriptions: next }));
                }}
                className="w-full border rounded-md px-3 py-2 text-sm mb-2"
                placeholder={`Description ${i + 1}`}
                maxLength={90} rows={2} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-6 py-2 rounded-md text-sm border hover:bg-gray-50">Back</button>
            <button onClick={handleSubmit} disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Creating..." : "Create Campaign Template"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
