"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function enterLeagueAsViewer(leagueId: string) {
  const normalizedLeagueId = leagueId.trim().toUpperCase();
  const league = await prisma.league.findUnique({
    where: { id: normalizedLeagueId },
    select: { id: true },
  });

  if (!league) {
    return { error: "League not found" };
  }

  const cookieStore = await cookies();
  // Entering through viewer input should not keep admin privileges for this league.
  cookieStore.delete(`league_admin_${league.id}`);
  cookieStore.delete(`league_admin_verified_${league.id}`);
  cookieStore.set(`league_viewer_mode_${league.id}`, "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  });

  return { success: true, leagueId: league.id };
}

export async function verifyLeaguePin(leagueId: string, pin: string) {
  const league = await prisma.league.findUnique({
    where: { id: leagueId },
  });

  if (!league || !league.isProtected) {
    return { error: "Invalid league" };
  }

  const pinHash = crypto.createHash("sha256").update(pin).digest("hex");
  if (pinHash !== league.pinHash) {
    return { error: "Incorrect PIN" };
  }

  const cookieStore = await cookies();
  cookieStore.set(`league_viewer_${league.id}`, "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  redirect(`/league/${league.id}`);
}
