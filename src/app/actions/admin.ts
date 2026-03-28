"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getCatalogTeamByName } from "@/lib/teamCatalog";

// Check Authorization Reusable Method
async function checkAdmin(leagueId: string) {
  const league = await prisma.league.findUnique({ where: { id: leagueId } });
  if (!league) return null;
  
  const cookieStore = await cookies();
  const token = cookieStore.get(`league_admin_${league.id}`)?.value;
  const verified = cookieStore.get(`league_admin_verified_${league.id}`)?.value === "true";
  
  if (token !== league.creatorId || !verified) {
    return null;
  }
  return league;
}

export async function addTeam(formData: FormData) {
  const leagueId = formData.get("leagueId") as string;
  const name = ((formData.get("name") as string) || "").trim();

  const league = await checkAdmin(leagueId);
  if (!league) return { error: "Unauthorized" };
  
  if (league.status !== "PENDING") {
    return { error: "Cannot add teams once league has started." };
  }

  const teamCount = await prisma.team.count({ where: { leagueId } });
  if (teamCount >= 14) {
    return { error: "Maximum of 14 teams allowed." };
  }

  if (!name || !getCatalogTeamByName(name)) {
    return { error: "Please choose a valid team from the club catalog." };
  }

  const duplicate = await prisma.team.findFirst({
    where: { leagueId, name },
    select: { id: true },
  });
  if (duplicate) {
    return { error: "This team is already added in the league." };
  }

  await prisma.team.create({
    data: { name, leagueId }
  });

  revalidatePath(`/league/${leagueId}/admin`);
  return { success: true };
}

export async function addTeams(formData: FormData) {
  const leagueId = formData.get("leagueId") as string;
  const requestedNames = formData
    .getAll("teamNames")
    .map((value) => String(value).trim())
    .filter(Boolean);

  const league = await checkAdmin(leagueId);
  if (!league) return { error: "Unauthorized" };

  if (league.status !== "PENDING") {
    return { error: "Cannot add teams once league has started." };
  }

  if (requestedNames.length === 0) {
    return { error: "Select at least one team to add." };
  }

  const uniqueRequested = Array.from(new Set(requestedNames));
  const invalid = uniqueRequested.find((name) => !getCatalogTeamByName(name));
  if (invalid) {
    return { error: `Invalid team selected: ${invalid}` };
  }

  const currentTeams = await prisma.team.findMany({
    where: { leagueId },
    select: { name: true },
  });
  const existingNames = new Set(currentTeams.map((team) => team.name));
  const toCreate = uniqueRequested.filter((name) => !existingNames.has(name));

  if (toCreate.length === 0) {
    return { error: "All selected teams are already added." };
  }

  const totalAfter = currentTeams.length + toCreate.length;
  if (totalAfter > 14) {
    return { error: `You can add only ${14 - currentTeams.length} more team(s).` };
  }

  await prisma.team.createMany({
    data: toCreate.map((name) => ({ leagueId, name })),
  });

  revalidatePath(`/league/${leagueId}/admin`);
  return { success: true, added: toCreate.length };
}

export async function removeTeam(teamId: string, leagueId: string) {
  const league = await checkAdmin(leagueId);
  if (!league) return { error: "Unauthorized" };

  if (league.status !== "PENDING") {
    return { error: "Cannot remove teams once league has started." };
  }

  await prisma.team.delete({
    where: { id: teamId }
  });

  revalidatePath(`/league/${leagueId}/admin`);
  return { success: true };
}

export async function generateSchedule(leagueId: string) {
  try {
    const league = await checkAdmin(leagueId);
    if (!league) return { error: "Unauthorized" };

    if (league.status !== "PENDING") {
      return { error: "League is already active or completed." };
    }

    const existingMatchCount = await prisma.match.count({ where: { leagueId } });
    if (existingMatchCount > 0) {
      return { error: "Schedule already exists for this league." };
    }

    const teamsQuery = await prisma.team.findMany({
      where: { leagueId },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });

    if (teamsQuery.length < 2) {
      return { error: "You need at least 2 teams to generate a schedule." };
    }

    // Circle method for round-robin fixtures
    const rotatingTeams = [...teamsQuery];
    if (rotatingTeams.length % 2 !== 0) {
      rotatingTeams.push({ id: "BYE" });
    }

    const numTeams = rotatingTeams.length;
    const numDays = numTeams - 1;
    const halfSize = numTeams / 2;
    const matchesToCreate: Prisma.MatchCreateManyInput[] = [];

    for (let matchDay = 1; matchDay <= numDays; matchDay++) {
      for (let i = 0; i < halfSize; i++) {
        const home = rotatingTeams[i];
        const away = rotatingTeams[numTeams - 1 - i];

        if (home.id !== "BYE" && away.id !== "BYE") {
          matchesToCreate.push({
            leagueId,
            matchDay,
            homeTeamId: home.id,
            awayTeamId: away.id,
            status: "SCHEDULED",
            isKnockout: false,
          });
        }
      }

      const lastElement = rotatingTeams.pop();
      if (lastElement) {
        rotatingTeams.splice(1, 0, lastElement);
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.match.createMany({ data: matchesToCreate });
      await tx.league.update({
        where: { id: leagueId },
        data: { status: "ACTIVE" },
      });
    });

    revalidatePath(`/league/${leagueId}`);
    revalidatePath(`/league/${leagueId}/admin`);

    return { success: true };
  } catch (error) {
    console.error("generateSchedule failed", error);
    return { error: "Failed to generate schedule. Please try again." };
  }
}

export async function verifyAdmin(leagueId: string, code: string) {
  const normalizedLeagueId = leagueId.trim().toUpperCase();
  const normalizedCode = code.trim();
  if (!/^\d{4}$/.test(normalizedCode)) {
    return { error: "Admin PIN must be 4 digits." };
  }

  const league = await prisma.league.findUnique({ where: { id: normalizedLeagueId } });
  if (!league) return { error: "League not found" };

  if (league.adminCode === normalizedCode) {
    const cookieStore = await cookies();
    cookieStore.delete(`league_viewer_mode_${league.id}`);
    cookieStore.set(`league_admin_${league.id}`, league.creatorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    cookieStore.set(`league_admin_verified_${league.id}`, "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return { success: true };
  }
  return { error: "Invalid Admin PIN" };
}

async function recalculateStandings(leagueId: string) {
  const matches = await prisma.match.findMany({
    where: { leagueId, status: "FINISHED", isKnockout: false }
  });

  const teams = await prisma.team.findMany({ where: { leagueId } });
  
  // Reset all stats
  const stats: Record<
    string,
    { played: number; wins: number; draws: number; losses: number; p: number; gf: number; ga: number }
  > = {};
  teams.forEach(t => {
    stats[t.id] = { played:0, wins:0, draws:0, losses:0, p:0, gf:0, ga:0 };
  });

  matches.forEach(m => {
    if (m.homeScore === null || m.awayScore === null) return;
    
    stats[m.homeTeamId].played++;
    stats[m.awayTeamId].played++;
    stats[m.homeTeamId].gf += m.homeScore;
    stats[m.homeTeamId].ga += m.awayScore;
    stats[m.awayTeamId].gf += m.awayScore;
    stats[m.awayTeamId].ga += m.homeScore;

    if (m.homeScore > m.awayScore) {
      stats[m.homeTeamId].wins++;
      stats[m.homeTeamId].p += 3;
      stats[m.awayTeamId].losses++;
    } else if (m.homeScore === m.awayScore) {
      stats[m.homeTeamId].draws++;
      stats[m.homeTeamId].p += 1;
      stats[m.awayTeamId].draws++;
      stats[m.awayTeamId].p += 1;
    } else {
      stats[m.awayTeamId].wins++;
      stats[m.awayTeamId].p += 3;
      stats[m.homeTeamId].losses++;
    }
  });

  // Update teams in bulk transaction
  await prisma.$transaction(
    Object.keys(stats).map(id => 
      prisma.team.update({
        where: { id },
        data: {
          played: stats[id].played,
          wins: stats[id].wins,
          draws: stats[id].draws,
          losses: stats[id].losses,
          points: stats[id].p,
          goalsFor: stats[id].gf,
          goalsAgainst: stats[id].ga
        }
      })
    )
  );
}

function getWinnerFromMatch(match: { homeTeamId: string; awayTeamId: string; homeScore: number | null; awayScore: number | null }) {
  if (match.homeScore === null || match.awayScore === null) return null;
  if (match.homeScore === match.awayScore) return null;
  return match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
}

export async function updateMatchScore(matchId: string, leagueId: string, homeScore: number, awayScore: number, status: string) {
  const league = await checkAdmin(leagueId);
  if (!league) return { error: "Unauthorized" };

  const targetMatch = await prisma.match.findUnique({
    where: { id: matchId },
    select: { isKnockout: true },
  });
  if (!targetMatch) return { error: "Match not found" };

  if (targetMatch.isKnockout && status === "FINISHED" && homeScore === awayScore) {
    return { error: "Knockout matches cannot end in a draw. Enter a winner score." };
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { homeScore, awayScore, status }
  });

  // Trigger recalculation
  await recalculateStandings(leagueId);

  // Knockout progression and completion logic
  if (status === "FINISHED") {
    const l = await prisma.league.findUnique({ where: { id: leagueId } });
    
    if (l?.status === "ACTIVE") {
      const pendingRegular = await prisma.match.count({
        where: { leagueId, isKnockout: false, status: { not: "FINISHED" } },
      });

      if (pendingRegular === 0) {
        const topTeams = await prisma.team.findMany({
          where: { leagueId },
          orderBy: [ { points: "desc" }, { goalsFor: "desc" }, { goalsAgainst: "asc" }, { name: "asc" } ],
          take: 4
        });

        if (topTeams.length === 4) {
          await prisma.$transaction([
            prisma.match.create({ data: { leagueId, matchDay: 99, homeTeamId: topTeams[0].id, awayTeamId: topTeams[3].id, isKnockout: true } }),
            prisma.match.create({ data: { leagueId, matchDay: 99, homeTeamId: topTeams[1].id, awayTeamId: topTeams[2].id, isKnockout: true } }),
            prisma.league.update({ where: { id: leagueId }, data: { status: "KNOCKOUTS" } })
          ]);
        }
      }
    }

    if (l?.status === "KNOCKOUTS") {
      const semis = await prisma.match.findMany({
        where: { leagueId, isKnockout: true, matchDay: 99 },
        orderBy: { createdAt: "asc" },
      });
      const finalMatch = await prisma.match.findFirst({
        where: { leagueId, isKnockout: true, matchDay: 100 },
      });

      const semisFinished = semis.length === 2 && semis.every((m) => m.status === "FINISHED");
      if (semisFinished && !finalMatch) {
        const winner1 = getWinnerFromMatch(semis[0]);
        const winner2 = getWinnerFromMatch(semis[1]);
        if (winner1 && winner2) {
          await prisma.match.create({
            data: {
              leagueId,
              matchDay: 100,
              homeTeamId: winner1,
              awayTeamId: winner2,
              status: "SCHEDULED",
              isKnockout: true,
            },
          });
        }
      }

      if (finalMatch && finalMatch.status === "FINISHED") {
        await prisma.league.update({
          where: { id: leagueId },
          data: { status: "COMPLETED" },
        });
      }
    }
  }

  revalidatePath(`/league/${leagueId}`);
  revalidatePath(`/league/${leagueId}/admin`);
  return { success: true };
}
