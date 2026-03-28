"use client";

import { useTransition, useState } from "react";
import { updateMatchScore } from "@/app/actions/admin";
import { CheckCircle2, Circle } from "lucide-react";
import { useToast } from "@/components/Toast";
import { getCatalogTeamByName } from "@/lib/teamCatalog";
import Image from "next/image";

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
}

export default function MatchAdmin({ leagueId, initialMatches, teams }: { leagueId: string, initialMatches: MatchItem[], teams: TeamItem[] }) {
  const { showToast } = useToast();
  const [matches, setMatches] = useState(initialMatches);
  const [isPending, startTransition] = useTransition();

  const getTeamName = (id: string) => teams.find(t => t.id === id)?.name || "Unknown";
  const TeamLabel = ({ teamId, align }: { teamId: string; align: "left" | "right" }) => {
    const teamName = getTeamName(teamId);
    const catalogTeam = getCatalogTeamByName(teamName);
    return (
      <div style={{ flex: 1, minWidth: 0, textAlign: align, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: align === "right" ? "flex-end" : "flex-start", gap: "8px" }}>
        {align === "left" && catalogTeam && (
          <Image src={catalogTeam.icon} alt={`${teamName} icon`} width={24} height={24} style={{ borderRadius: "7px", border: "1px solid var(--border)" }} unoptimized />
        )}
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{teamName}</span>
        {align === "right" && catalogTeam && (
          <Image src={catalogTeam.icon} alt={`${teamName} icon`} width={24} height={24} style={{ borderRadius: "7px", border: "1px solid var(--border)" }} unoptimized />
        )}
      </div>
    );
  };

  const handleUpdate = (matchId: string, homeScore: number, awayScore: number, status: string) => {
    startTransition(async () => {
      const res = await updateMatchScore(matchId, leagueId, homeScore, awayScore, status);
      if (res?.success) {
        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, homeScore, awayScore, status } : m));
        if (status === "FINISHED") showToast("Match finished and standings updated.");
        else showToast("Score updated.");
      } else if (res?.error) {
        showToast(res.error, "error");
      }
    });
  };

  const matchDays = matches.reduce((acc, match) => {
    if (!acc[match.matchDay]) acc[match.matchDay] = [];
    acc[match.matchDay].push(match);
    return acc;
  }, {} as Record<number, MatchItem[]>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {Object.keys(matchDays).sort((a,b) => Number(a)-Number(b)).map(day => (
        <div key={day} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--accent)' }}>
            {Number(day) === 99 ? "Semi-Finals" : Number(day) === 100 ? "Grand Final" : `Matchday ${day}`}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {matchDays[Number(day)].map((m: MatchItem) => (
              <div key={m.id} style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface-hover)', padding: '16px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <TeamLabel teamId={m.homeTeamId} align="right" />
                  
                  <div style={{ margin: '0 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      defaultValue={m.homeScore ?? 0} 
                      className="input-base" 
                      style={{ width: '60px', textAlign: 'center', padding: '8px' }}
                      id={`home-${m.id}`}
                      disabled={m.status === "FINISHED"}
                    />
                    <span style={{ fontWeight: 800 }}>-</span>
                    <input 
                      type="number" 
                      defaultValue={m.awayScore ?? 0} 
                      className="input-base" 
                      style={{ width: '60px', textAlign: 'center', padding: '8px' }}
                      id={`away-${m.id}`}
                      disabled={m.status === "FINISHED"}
                    />
                  </div>
                  
                  <TeamLabel teamId={m.awayTeamId} align="left" />
                </div>

                {m.status !== "FINISHED" && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '16px' }}>
                    {m.status === "SCHEDULED" ? (
                      <button 
                        onClick={() => {
                           const hs = parseInt((document.getElementById(`home-${m.id}`) as HTMLInputElement).value || "0");
                           const as = parseInt((document.getElementById(`away-${m.id}`) as HTMLInputElement).value || "0");
                           handleUpdate(m.id, hs, as, "IN_PROGRESS");
                        }}
                        className="btn-secondary" 
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                        disabled={isPending}
                      >
                        <Circle size={14} style={{ display: 'inline', marginRight: '4px' }} /> Start Match
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => {
                             const hs = parseInt((document.getElementById(`home-${m.id}`) as HTMLInputElement).value || "0");
                             const as = parseInt((document.getElementById(`away-${m.id}`) as HTMLInputElement).value || "0");
                             handleUpdate(m.id, hs, as, "IN_PROGRESS");
                          }}
                          className="btn-secondary" 
                          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                          disabled={isPending}
                        >
                          Update Score
                        </button>
                        <button 
                          onClick={() => {
                             const hs = parseInt((document.getElementById(`home-${m.id}`) as HTMLInputElement).value || "0");
                             const as = parseInt((document.getElementById(`away-${m.id}`) as HTMLInputElement).value || "0");
                             if(confirm("Are you sure? This finalises points.")) {
                               handleUpdate(m.id, hs, as, "FINISHED");
                             }
                          }}
                          className="btn-primary" 
                          style={{ background: 'var(--success)', padding: '8px 16px', fontSize: '0.85rem', color: 'white' }}
                          disabled={isPending}
                        >
                          <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '4px' }} /> End Match
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
