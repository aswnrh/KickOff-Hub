"use client";

import { Trophy } from "lucide-react";
import { getCatalogTeamByName } from "@/lib/teamCatalog";
import Image from "next/image";

export interface TeamStats {
  id: string;
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
}

export default function StandingsTable({ teams }: { teams: TeamStats[] }) {
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.goalsFor - a.goalsAgainst;
    const gdB = b.goalsFor - b.goalsAgainst;
    if (gdB !== gdA) return gdB - gdA;
    return b.goalsFor - a.goalsFor;
  });

  return (
    <div className="glass-panel" style={{ padding: '0', overflowX: 'auto' }}>
      <table className="standings-table">
        <thead>
          <tr>
            <th style={{ width: '40px' }}>#</th>
            <th style={{ textAlign: 'left' }}>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GF</th>
            <th>GA</th>
            <th>GD</th>
            <th style={{ color: 'var(--accent)' }}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {sortedTeams.map((team, idx) => {
            const gd = team.goalsFor - team.goalsAgainst;
            const top4 = idx < 4;
            const catalogTeam = getCatalogTeamByName(team.name);
            return (
              <tr key={team.id} className={top4 ? "top-four" : ""}>
                <td style={{ textAlign: 'center', opacity: 0.7 }}>{idx + 1}</td>
                <td style={{ textAlign: 'left', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {idx === 0 && <Trophy size={14} style={{ color: 'var(--accent)' }} />}
                    {catalogTeam && (
                      <Image
                        src={catalogTeam.icon}
                        alt={`${team.name} icon`}
                        width={20}
                        height={20}
                        style={{ borderRadius: "6px", border: "1px solid var(--border)" }}
                        unoptimized
                      />
                    )}
                    {team.name}
                  </div>
                </td>
                <td>{team.played}</td>
                <td style={{ color: 'var(--success)' }}>{team.wins}</td>
                <td>{team.draws}</td>
                <td style={{ color: 'var(--danger)' }}>{team.losses}</td>
                <td>{team.goalsFor}</td>
                <td>{team.goalsAgainst}</td>
                <td style={{ fontWeight: 500, color: gd > 0 ? 'var(--success)' : gd < 0 ? 'var(--danger)' : 'inherit' }}>
                  {gd > 0 ? `+${gd}` : gd}
                </td>
                <td style={{ fontWeight: 800, color: 'var(--accent)' }}>{team.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
