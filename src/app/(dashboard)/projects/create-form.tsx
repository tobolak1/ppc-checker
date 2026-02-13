"use client";

import { createProject } from "./actions";
import { useState } from "react";

export function CreateProjectForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">
        + New Project
      </button>
    );
  }

  return (
    <form action={createProject} className="bg-white rounded-lg shadow p-4 space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
        <input name="name" required className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. Acme s.r.o." />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input name="description" className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Optional description" />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700">Create</button>
        <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-md text-sm border hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  );
}
