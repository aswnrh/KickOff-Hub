"use client";

import { useTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { addTeams, removeTeam, generateSchedule, verifyAdmin } from "@/app/actions/admin";
import { Trash2, Plus, CalendarRange, Trophy, ListChecks, ShieldCheck, LogIn } from "lucide-react";
import { useToast } from "@/components/Toast";
import StandingsTable from "@/components/StandingsTable";
import MatchAdmin from "./MatchAdmin";
import { TEAM_CATALOG } from "@/lib/teamCatalog";

type Tab = "TEAMS" | "SCORING" | "STANDINGS";
const ADMIN_PIN_REGEX = /^\d{4}$/;

interface Team {
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

interface MatchItem {
  id: string;
  matchDay: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
}

export default function AdminClient({ 
  leagueId, 
  status, 
  teams, 
  matches, 
  isAdminAuthorized 
}: { 
  leagueId: string, 
  status: string, 
  teams: Team[], 
  matches: MatchItem[],
  isAdminAuthorized: boolean 
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>(status === "PENDING" ? "TEAMS" : "SCORING");
  const [adminCode, setAdminCode] = useState("");
  const [authorized, setAuthorized] = useState(isAdminAuthorized);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const availableTeams = TEAM_CATALOG.filter((catalogTeam) => !teams.some((t) => t.name === catalogTeam.name));
  const getTeamIcon = (teamName: string) => TEAM_CATALOG.find((club) => club.name === teamName)?.icon;
  const toggleTeam = (teamName: string) => {
    setSelectedTeams((prev) =>
      prev.includes(teamName) ? prev.filter((name) => name !== teamName) : [...prev, teamName]
    );
  };

  const handleAdd = async (formData: FormData) => {
    formData.append("leagueId", leagueId);
    selectedTeams.forEach((teamName) => formData.append("teamNames", teamName));
    startTransition(async () => {
      const res = await addTeams(formData);
      if (res?.error) showToast(res.error, "error");
      else {
        showToast(`Added ${res.added ?? selectedTeams.length} team(s) successfully!`);
        formRef.current?.reset();
        setSelectedTeams([]);
        router.refresh();
      }
    });
  };

  const handleRemove = async (teamId: string) => {
    startTransition(async () => {
      const res = await removeTeam(teamId, leagueId);
      if (res?.error) showToast(res.error, "error");
      else {
        showToast("Team removed.");
        router.refresh();
      }
    });
  };

  const handleGenerate = async () => {
    if (teams.length < 2) {
      showToast("Needs at least 2 teams to generate schedule.", "error");
      return;
    }
    const confirmed = confirm(`Lock in ${teams.length} teams and generate matches?`);
    if (!confirmed) return;
    
    startTransition(async () => {
      const res = await generateSchedule(leagueId);
      if (res?.error) showToast(res.error, "error");
      else {
        showToast("Schedule generated successfully!");
        setActiveTab("SCORING");
        router.refresh();
      }
    });
  };

  const handleAdminVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedCode = adminCode.trim();
    if (!ADMIN_PIN_REGEX.test(normalizedCode)) {
      showToast("Admin PIN must be 4 digits.", "error");
      return;
    }
    startTransition(async () => {
      const res = await verifyAdmin(leagueId, normalizedCode);
      if (res?.error) showToast(res.error, "error");
      else {
        showToast("Admin access granted!");
        setAuthorized(true);
        router.refresh();
      }
    });
  };

  if (!authorized) {
    return (
      <div style={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '32px', textAlign: 'center' }}>
          <ShieldCheck size={48} style={{ color: 'var(--accent)', marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '8px', fontSize: '1.5rem', fontWeight: 700 }}>Admin Verification</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Enter the admin code to manage this league.</p>
          <form onSubmit={handleAdminVerify}>
            <input 
              type="password" 
              maxLength={4} 
              placeholder="ADMIN PIN" 
              className="input-base" 
              style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.25rem', marginBottom: '16px' }}
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value.replace(/\D/g, ""))}
              required
            />
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isPending}>
              <LogIn size={18} style={{ marginRight: '8px', display: 'inline', verticalAlign: 'middle' }} />
              <span style={{ verticalAlign: 'middle' }}>Verify & Enter</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Tab Navigation */}
      <div className="glass-panel admin-tabs">
        <button 
          onClick={() => setActiveTab("TEAMS")}
          className={`btn-secondary ${activeTab === "TEAMS" ? "" : "opacity-70"}`}
          style={{ padding: '8px 16px', background: activeTab === "TEAMS" ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none' }}
        >
          <Plus size={16} style={{ display: 'inline', marginRight: '6px' }} /> Teams
        </button>
        <button 
          onClick={() => setActiveTab("SCORING")}
          className={`btn-secondary ${activeTab === "SCORING" ? "" : "opacity-70"}`}
          disabled={status === "PENDING"}
          style={{ padding: '8px 16px', background: activeTab === "SCORING" ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none' }}
        >
          <ListChecks size={16} style={{ display: 'inline', marginRight: '6px' }} /> Scores
        </button>
        <button 
          onClick={() => setActiveTab("STANDINGS")}
          className={`btn-secondary ${activeTab === "STANDINGS" ? "" : "opacity-70"}`}
          style={{ padding: '8px 16px', background: activeTab === "STANDINGS" ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none' }}
        >
          <Trophy size={16} style={{ display: 'inline', marginRight: '6px' }} /> Standings
        </button>
      </div>

      <div style={{ animation: 'fade-in 0.3s ease-out' }}>
        {activeTab === "TEAMS" && (
          <div>
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
              <div className="admin-teams-header">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Registered Teams ({teams.length}/14)</h2>
                {status === "PENDING" && (
                   <button 
                   onClick={handleGenerate} 
                   className="btn-primary" 
                   disabled={isPending || teams.length < 2}
                   style={{ background: 'linear-gradient(135deg, var(--accent) 0%, #0369a1 100%)', border: 'none' }}
                 >
                   <CalendarRange size={16} style={{ display: 'inline', marginRight: '6px' }} />
                   Generate Schedule
                 </button>
                )}
              </div>
              
              <div className="admin-teams-grid">
                {teams.map((t) => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-hover)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "10px" }}>
                      {getTeamIcon(t.name) && (
                        <Image
                          src={getTeamIcon(t.name) as string}
                          alt={`${t.name} icon`}
                          width={26}
                          height={26}
                          style={{ borderRadius: "8px", border: "1px solid var(--border)" }}
                          unoptimized
                        />
                      )}
                      {t.name}
                    </span>
                    {status === "PENDING" && (
                      <button onClick={() => handleRemove(t.id)} style={{ color: 'var(--danger)', opacity: 0.7, background: 'none', border: 'none', cursor: 'pointer' }} disabled={isPending}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {status === "PENDING" && teams.length < 14 && (
                <form action={handleAdd} ref={formRef} style={{ display: 'grid', gap: '10px' }}>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    Choose from 30+ famous clubs.
                  </p>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem" }}>
                    Multi-select works from dropdown and from club cards below.
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: "8px" }}>
                    <select
                      className="input-base"
                      multiple
                      value={selectedTeams}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions).map((option) => option.value);
                        setSelectedTeams(values);
                      }}
                      disabled={isPending || availableTeams.length === 0}
                      style={{ minHeight: "130px" }}
                    >
                      {availableTeams.map((team) => (
                        <option key={team.name} value={team.name}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="btn-primary" disabled={isPending || selectedTeams.length === 0}>
                      Add Selected ({selectedTeams.length})
                    </button>
                  </div>

                  <div className="club-picker-grid">
                    {availableTeams.map((team) => (
                      <button
                        key={team.name}
                        type="button"
                        onClick={() => toggleTeam(team.name)}
                        className="btn-secondary"
                        style={{
                          padding: "8px 10px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          justifyContent: "flex-start",
                          borderColor: selectedTeams.includes(team.name) ? "var(--accent)" : "var(--border)",
                        }}
                      >
                        <Image
                          src={team.icon}
                          alt={`${team.name} icon`}
                          width={24}
                          height={24}
                          style={{ borderRadius: "7px", border: "1px solid var(--border)" }}
                          unoptimized
                        />
                        <span style={{ fontSize: "0.86rem", textAlign: "left" }}>{team.name}</span>
                      </button>
                    ))}
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === "SCORING" && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>Match Control</h2>
            <MatchAdmin leagueId={leagueId} initialMatches={matches} teams={teams} />
          </div>
        )}

        {activeTab === "STANDINGS" && (
          <div>
            <StandingsTable teams={teams} />
          </div>
        )}
      </div>
    </div>
  );
}
