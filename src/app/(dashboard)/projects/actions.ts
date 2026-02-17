"use server";

import { prisma } from "@/db/prisma";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  if (!name) throw new Error("Name is required");

  await prisma.project.create({
    data: { name, description: description || null },
  });
  revalidatePath("/projects");
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath("/projects");
}
