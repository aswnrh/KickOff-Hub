import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import AdminClient from "./AdminClient";
import Link from "next/link";
import { ArrowLeft, Table2, SquarePen } from "lucide-react";

export default async function AdminDashboard({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  const league = await prisma.league.findUnique({
    where: { id },
    include: { teams: true, matches: true }
  });

  if (!league) return notFound();

  // Protect Admin Route
  const cookieStore = await cookies();
  const isAdminToken = cookieStore.get(`league_admin_${league.id}`)?.value === league.creatorId;
  const isAdminVerified = cookieStore.get(`league_admin_verified_${league.id}`)?.value === "true";
  const isViewerMode = cookieStore.get(`league_viewer_mode_${league.id}`)?.value === "true";
  const isAdmin = isAdminToken && isAdminVerified && !isViewerMode;

  return (
    <div style={{ padding: '2rem 0', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href={`/league/${league.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} /> Back to Viewer Dashboard
        </Link>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>
          Admin Console
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage &quot;{league.name}&quot; limits, teams, and tournament progression.</p>
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

        {league.status !== "PENDING" && isAdmin && (
          <div className="admin-action-row" style={{ marginTop: "14px" }}>
            <Link
              href={`/league/${league.id}`}
              className="btn-secondary"
              style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
            >
              <Table2 size={14} />
              Table View
            </Link>
            <a
              href="#match-control"
              className="btn-secondary"
              style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
            >
              <SquarePen size={14} />
              Edit Scores
            </a>
          </div>
        )}
      </div>

      <AdminClient 
        leagueId={league.id} 
        status={league.status} 
        teams={league.teams}
        matches={league.matches}
        isAdminAuthorized={isAdmin}
      />
    </div>
  );
}
