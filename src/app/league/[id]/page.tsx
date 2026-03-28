import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import MatchList from "./MatchList";
import Link from "next/link";
import { UserCheck, Crown } from "lucide-react";
import { notFound } from "next/navigation";
import StandingsTable from "@/components/StandingsTable";

export default async function LeagueDashboard({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      teams: {
        orderBy: [
          { points: "desc" },
          { goalsFor: "desc" },
          { goalsAgainst: "asc" },
          { name: "asc" }
        ]
      },
      matches: {
        orderBy: [{ matchDay: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  if (!league) {
    return notFound();
  }

  const cookieStore = await cookies();
  const isAdminToken = cookieStore.get(`league_admin_${league.id}`)?.value === league.creatorId;
  const isAdminVerified = cookieStore.get(`league_admin_verified_${league.id}`)?.value === "true";
  const isViewerMode = cookieStore.get(`league_viewer_mode_${league.id}`)?.value === "true";
  const isAdmin = isAdminToken && isAdminVerified && !isViewerMode;

  // Calculate generic scoreboard details, etc.
  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>
            {league.name}
          </h1>
          {league.description && (
            <p style={{ color: 'var(--text-secondary)' }}>{league.description}</p>
          )}
          <div
            className="glass-panel"
            style={{
              marginTop: "14px",
              padding: "10px 12px",
              borderRadius: "12px",
              display: "grid",
              gap: "4px",
              maxWidth: "520px",
            }}
          >
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              League Code: <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{league.id}</span>
            </p>
            {isAdmin && (
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Admin PIN: <span style={{ color: "var(--accent)", fontWeight: 800 }}>{league.adminCode}</span>
              </p>
            )}
          </div>
        </div>
        
        {isAdmin && (
          <Link href={`/league/${league.id}/admin`} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crown size={16} color="var(--accent)" />
            Manage League
          </Link>
        )}
      </div>

      <div className="league-layout-grid">
        {/* League Table Area */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Standings</h2>
          {league.teams.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <UserCheck size={32} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>No teams have been seeded yet.</p>
              {isAdmin && <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>Head to the Admin dashboard to seed teams and generate your matches!</p>}
            </div>
          ) : (
            <StandingsTable teams={league.teams} />
          )}
        </div>

        {/* Live Matches Area / Recent */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>Matches</h2>
          {league.matches.length === 0 ? (
             <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>Schedule not generated yet.</p>
          ) : (
            <div>
              <MatchList leagueId={league.id} initialMatches={league.matches} teams={league.teams} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
