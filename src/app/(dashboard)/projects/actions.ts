"use server";

import { db, T } from "@/db";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  if (!name) throw new Error("Name is required");

  await db.from(T.projects).insert({ name, description: description || null });
  revalidatePath("/projects");
}

export async function deleteProject(id: string) {
  await db.from(T.projects).delete().eq("id", id);
  revalidatePath("/projects");
}
