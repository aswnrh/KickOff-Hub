"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function generateAlphaCode(length: number) {
  let code = "";
  for (let i = 0; i < length; i++) {
    const byte = crypto.randomBytes(1)[0] ?? 0;
    code += ALPHABET[byte % ALPHABET.length];
  }
  return code;
}

function generateAdminPin() {
  const pin = crypto.randomInt(0, 10000);
  return pin.toString().padStart(4, "0");
}

async function generateUniqueLeagueCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateAlphaCode(6);
    const existing = await prisma.league.findUnique({
      where: { id: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error("Failed to generate unique league code");
}

export async function createLeague(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name || name.trim() === "") {
    return { error: "League name is required" };
  }

  let leagueId: string;
  try {
    // Create random admin token
    const creatorId = crypto.randomBytes(16).toString("hex");
    const leagueCode = await generateUniqueLeagueCode();
    const adminCode = generateAdminPin();

    // Create League
    const league = await prisma.league.create({
      data: {
        id: leagueCode,
        name: name.trim(),
        description: description?.trim() || null,
        isProtected: false,
        pinHash: null,
        adminCode,
        creatorId,
      },
    });
    leagueId = league.id;

    // First creator becomes admin immediately.
    const cookieStore = await cookies();
    cookieStore.set(`league_admin_${league.id}`, creatorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    cookieStore.set(`league_admin_verified_${league.id}`, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

  } catch (error) {
    console.error("createLeague failed", error);
    return { error: "Could not create league right now. Please try again." };
  }

  redirect(`/league/${leagueId}/admin`);
}
