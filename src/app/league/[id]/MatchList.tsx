"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCatalogTeamByName } from "@/lib/teamCatalog";
import Image from "next/image";
import { subscribeLeagueUpdates } from "@/lib/leagueLiveSync";

interface MatchItem {
  id: string;
  matchDay: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}

interface TeamItem {
  id: string;
  name: string;
  points?: number;
  goalsFor?: number;
  goalsAgainst?: number;
}

export default function MatchList({ leagueId, initialMatches, teams }: { leagueId: string, initialMatches: MatchItem[], teams: TeamItem[] }) {
  const [matches, setMatches] = useState(initialMatches);
  const router = useRouter();

  // Refresh data when the tab regains focus so scores stay up-to-date
  const refresh = useCallback(() => router.refresh(), [router]);

  useEffect(() => {
    // Update local state when initialMatches prop changes (after a server refresh)
    setMatches(initialMatches);
  }, [initialMatches]);

  useEffect(() => {
    window.addEventListener("focus", refresh);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    const unsubscribe = subscribeLeagueUpdates(leagueId, refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
      unsubscribe();
    };
  }, [leagueId, refresh]);

  // Group matches by MatchDay
  const matchDays = matches.reduce((acc, match) => {
    if (!acc[match.matchDay]) acc[match.matchDay] = [];
    acc[match.matchDay].push(match);
    return acc;
  }, {} as Record<number, MatchItem[]>);

  const getTeamName = (id: string) => teams.find(t => t.id === id)?.name || "Unknown";
  const TeamLabel = ({ teamId, align }: { teamId: string; align: "left" | "right" }) => {
    const teamName = getTeamName(teamId);
    const catalogTeam = getCatalogTeamByName(teamName);
    return (
      <div style={{ flex: 1, minWidth: 0, textAlign: align, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: align === "right" ? "flex-end" : "flex-start", gap: "8px" }}>
        {align === "left" && catalogTeam && (
          <Image src={catalogTeam.icon} alt={`${teamName} icon`} width={22} height={22} style={{ borderRadius: "7px", border: "1px solid var(--border)" }} unoptimized />
        )}
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{teamName}</span>
        {align === "right" && catalogTeam && (
          <Image src={catalogTeam.icon} alt={`${teamName} icon`} width={22} height={22} style={{ borderRadius: "7px", border: "1px solid var(--border)" }} unoptimized />
        )}
      </div>
    );
  };

  const regularMatchDays = Object.keys(matchDays)
    .filter(d => Number(d) < 99)
    .sort((a, b) => Number(a) - Number(b));
  const semiFinals = matchDays[99] || [];
  const grandFinal = matchDays[100] || [];
  const rankedTeams = [...teams].sort((a, b) => {
    const ptsA = a.points ?? 0;
    const ptsB = b.points ?? 0;
    if (ptsB !== ptsA) return ptsB - ptsA;
    const gdA = (a.goalsFor ?? 0) - (a.goalsAgainst ?? 0);
    const gdB = (b.goalsFor ?? 0) - (b.goalsAgainst ?? 0);
    if (gdB !== gdA) return gdB - gdA;
    return (b.goalsFor ?? 0) - (a.goalsFor ?? 0);
  });
  const topFour = rankedTeams.slice(0, 4);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Regular Matches */}
      {regularMatchDays.map(day => (
        <div key={day} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--accent)' }}>Matchday {day}</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {matchDays[Number(day)].map((m: MatchItem) => (
              <div key={m.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', alignItems: 'center', background: 'var(--surface-hover)', padding: '12px 16px', borderRadius: '8px', gap: '12px' }}>
                <TeamLabel teamId={m.homeTeamId} align="right" />
                
                <div style={{ margin: '0 16px', background: 'var(--background)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.9rem', fontWeight: 700, border: '1px solid var(--border)', minWidth: '70px', textAlign: 'center', position: 'relative' }}>
                  {m.status === "SCHEDULED" ? "VS" : `${m.homeScore ?? 0} - ${m.awayScore ?? 0}`}
                  {m.status === "IN_PROGRESS" && (
                    <span style={{ position: 'absolute', top: '-24px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 800, animation: 'pulse 1.5s infinite' }}>LIVE</span>
                  )}
                </div>
                
                <TeamLabel teamId={m.awayTeamId} align="left" />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Knockout Bracket (Map) */}
      {(semiFinals.length > 0 || grandFinal.length > 0) && (
        <div style={{ marginTop: '24px', padding: '24px', background: 'linear-gradient(145deg, rgba(34,211,238,0.05) 0%, rgba(0,0,0,0) 100%)', borderRadius: '16px', border: '1px solid var(--accent-hover)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '32px', color: 'var(--accent)' }}>Championship Bracket</h2>
          
          <div className="knockout-grid">
            {/* Semis */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', flex: 1 }}>
               <h4 style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '-24px' }}>Semi-Finals</h4>
               {semiFinals.map((m: MatchItem) => (
                  <div key={m.id} className="glass-panel" style={{ padding: '16px', textAlign: 'center', position: 'relative' }}>
                    <div style={{ fontWeight: 600, paddingBottom: '8px', borderBottom: '1px dashed var(--border)', marginBottom: '8px' }}>{getTeamName(m.homeTeamId)} <span style={{ color: 'var(--accent)' }}>{m.status !== "SCHEDULED" && m.homeScore}</span></div>
                    <div style={{ fontWeight: 600 }}>{getTeamName(m.awayTeamId)} <span style={{ color: 'var(--accent)' }}>{m.status !== "SCHEDULED" && m.awayScore}</span></div>
                    {m.status === "IN_PROGRESS" && <div style={{ color: 'var(--danger)', fontSize: '0.7rem', fontWeight: 800, position: 'absolute', top: '4px', right: '8px' }}>LIVE</div>}
                  </div>
               ))}
            </div>

            {/* Path connector representation */}
            <div style={{ flex: '0.2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--border)' }}>
               ━━━<br/>━━━
            </div>

            {/* Final */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
               <h4 style={{ color: 'var(--warning)', textAlign: 'center' }}>Grand Final</h4>
               {grandFinal.map((m: MatchItem) => (
                  <div key={m.id} className="glass-panel" style={{ padding: '24px 16px', textAlign: 'center', border: '2px solid var(--warning)', position: 'relative' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', paddingBottom: '8px', borderBottom: '1px dashed var(--border)', marginBottom: '8px' }}>{getTeamName(m.homeTeamId)} <span style={{ color: 'var(--warning)' }}>{m.status !== "SCHEDULED" && m.homeScore}</span></div>
                    <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{getTeamName(m.awayTeamId)} <span style={{ color: 'var(--warning)' }}>{m.status !== "SCHEDULED" && m.awayScore}</span></div>
                    {m.status === "IN_PROGRESS" && <div style={{ color: 'var(--danger)', fontSize: '0.7rem', fontWeight: 800, position: 'absolute', top: '4px', right: '8px' }}>LIVE</div>}
                  </div>
               ))}
               {grandFinal.length === 0 && (
                 <div className="glass-panel" style={{ padding: '24px 16px', textAlign: 'center', border: '1px dashed var(--border)', color: 'var(--text-secondary)' }}>
                    TBD vs TBD
                 </div>
               )}
            </div>
          </div>

          {topFour.length === 4 && (
            <div style={{ marginTop: "28px" }}>
              <h4 style={{ color: "var(--text-secondary)", textAlign: "center", marginBottom: "14px" }}>
                Knockout Path Diagram
              </h4>
              <div className="knockout-path">
                <div className="glass-panel path-col">
                  <p className="path-col-title">League Top 4</p>
                  {topFour.map((team, idx) => {
                    const catalogTeam = getCatalogTeamByName(team.name);
                    return (
                      <div key={team.id} className="path-team">
                        <span style={{ width: "22px", opacity: 0.8 }}>{idx + 1}.</span>
                        {catalogTeam && <Image src={catalogTeam.icon} alt={`${team.name} icon`} width={20} height={20} style={{ borderRadius: "6px" }} unoptimized />}
                        <span>{team.name}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="path-arrow">→</div>
                <div className="glass-panel path-col">
                  <p className="path-col-title">Semi-Finals</p>
                  <div className="path-team">1st vs 4th</div>
                  <div className="path-team">2nd vs 3rd</div>
                </div>
                <div className="path-arrow">→</div>
                <div className="glass-panel path-col">
                  <p className="path-col-title">Grand Final</p>
                  <div className="path-team">Winner SF1</div>
                  <div className="path-team">Winner SF2</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
