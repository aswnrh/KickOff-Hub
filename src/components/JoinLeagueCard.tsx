"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users } from "lucide-react";
import { verifyAdmin } from "@/app/actions/admin";
import { enterLeagueAsViewer } from "@/app/actions/auth";
import { useToast } from "@/components/Toast";
import styles from "@/app/page.module.css";

type JoinMode = "viewer" | "admin";
const LEAGUE_CODE_REGEX = /^[A-Z]{6}$/;
const ADMIN_PIN_REGEX = /^\d{4}$/;
const STORAGE_JOIN_MODE = "kickoff:join-mode";
const STORAGE_LEAGUE_CODE = "kickoff:last-league-code";

export default function JoinLeagueCard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [joinMode, setJoinMode] = useState<JoinMode>(() => {
    if (typeof window === "undefined") return "viewer";
    const savedMode = localStorage.getItem(STORAGE_JOIN_MODE);
    return savedMode === "admin" ? "admin" : "viewer";
  });
  const [leagueId, setLeagueId] = useState(() => {
    if (typeof window === "undefined") return "";
    const savedLeagueCode = localStorage.getItem(STORAGE_LEAGUE_CODE);
    return savedLeagueCode ? savedLeagueCode.toUpperCase().slice(0, 6) : "";
  });
  const [adminCode, setAdminCode] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_JOIN_MODE, joinMode);
  }, [joinMode]);

  useEffect(() => {
    if (leagueId) {
      localStorage.setItem(STORAGE_LEAGUE_CODE, leagueId.toUpperCase().slice(0, 6));
    } else {
      localStorage.removeItem(STORAGE_LEAGUE_CODE);
    }
  }, [leagueId]);

  const handleViewerJoin = () => {
    const trimmedLeagueId = leagueId.trim().toUpperCase();
    if (!trimmedLeagueId) {
      showToast("Enter a league code first.", "error");
      return;
    }
    if (!LEAGUE_CODE_REGEX.test(trimmedLeagueId)) {
      showToast("League code must be 6 letters (A-Z).", "error");
      return;
    }
    startTransition(async () => {
      const result = await enterLeagueAsViewer(trimmedLeagueId);
      if (result?.error) {
        showToast(result.error, "error");
        return;
      }
      router.push(`/league/${trimmedLeagueId}`);
      router.refresh();
    });
  };

  const handleAdminJoin = () => {
    const trimmedLeagueId = leagueId.trim().toUpperCase();
    const trimmedAdminCode = adminCode.trim();
    if (!trimmedLeagueId) {
      showToast("Enter a league code first.", "error");
      return;
    }
    if (!LEAGUE_CODE_REGEX.test(trimmedLeagueId)) {
      showToast("League code must be 6 letters (A-Z).", "error");
      return;
    }
    if (!trimmedAdminCode) {
      showToast("Enter the admin PIN to continue.", "error");
      return;
    }
    if (!ADMIN_PIN_REGEX.test(trimmedAdminCode)) {
      showToast("Admin PIN must be 4 digits.", "error");
      return;
    }

    startTransition(async () => {
      const result = await verifyAdmin(trimmedLeagueId, trimmedAdminCode);
      if (result?.error) {
        showToast(result.error, "error");
        return;
      }
      showToast("Admin verified. Redirecting to console.");
      router.push(`/league/${trimmedLeagueId}/admin`);
      router.refresh();
    });
  };

  return (
    <div className={`glass-panel ${styles.actionCard}`}>
      <div className={styles.iconWrapper}>
        <Users size={28} />
      </div>
      <h2 className={styles.cardTitle}>Join League</h2>
      <p className={styles.cardDesc}>
        Viewers join with league code. Admins join with league code and 4-digit admin PIN.
      </p>

      <div style={{ display: "flex", width: "100%", marginBottom: "12px", gap: "8px" }}>
        <button
          type="button"
          onClick={() => setJoinMode("viewer")}
          className="btn-secondary"
          style={{
            flex: 1,
            padding: "10px 14px",
            borderColor: joinMode === "viewer" ? "var(--accent)" : undefined,
          }}
        >
          <Users size={14} style={{ display: "inline", marginRight: "6px" }} />
          Viewer
        </button>
        <button
          type="button"
          onClick={() => setJoinMode("admin")}
          className="btn-secondary"
          style={{
            flex: 1,
            padding: "10px 14px",
            borderColor: joinMode === "admin" ? "var(--accent)" : undefined,
          }}
        >
          <Shield size={14} style={{ display: "inline", marginRight: "6px" }} />
          Admin
        </button>
      </div>

      <div style={{ display: "grid", gap: "8px", width: "100%" }}>
        <input
          type="text"
          placeholder="League Code"
          className="input-base"
          value={leagueId}
          onChange={(e) => setLeagueId(e.target.value.toUpperCase())}
          maxLength={6}
          disabled={isPending}
        />

        {joinMode === "admin" && (
          <input
            type="password"
            placeholder="Admin PIN (4 digits)"
            className="input-base"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value.replace(/\D/g, ""))}
            maxLength={4}
            disabled={isPending}
          />
        )}

        <button
          type="button"
          className="btn-primary"
          onClick={joinMode === "admin" ? handleAdminJoin : handleViewerJoin}
          disabled={isPending}
          style={{ width: "100%" }}
        >
          {isPending ? "Verifying..." : joinMode === "admin" ? "Enter as Admin" : "Enter League"}
        </button>
      </div>
    </div>
  );
}
