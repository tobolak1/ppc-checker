import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, T } from "@/db";
import type { User } from "@/db/types";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data: existing } = await db
    .from(T.users)
    .select("id")
    .eq("email", email)
    .single();
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const { data: user, error } = await db
    .from(T.users)
    .insert({ name, email, password: hashed })
    .select("id, name, email")
    .single<Pick<User, "id" | "name" | "email">>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(user, { status: 201 });
}
