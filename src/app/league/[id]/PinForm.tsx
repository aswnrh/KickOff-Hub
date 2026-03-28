"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { verifyLeaguePin } from "../../actions/auth";
import { useToast } from "@/components/Toast";

export default function PinForm({ leagueId, leagueName }: { leagueId: string, leagueName: string }) {
  const { showToast } = useToast();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await verifyLeaguePin(leagueId, pin);
      if (res?.error) {
        setError(res.error);
        showToast(res.error, "error");
        setLoading(false);
      }
    } catch {
      setError("Failed to verify PIN");
      showToast("Failed to verify PIN", "error");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ padding: '40px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: 'var(--accent)' }}>
          <Lock size={48} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Security Check</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          {leagueName} is a protected league. Enter the 4-digit PIN to access.
        </p>

        <form onSubmit={handleVerify}>
          <input
            type="password"
            className="input-base"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.5rem', marginBottom: '16px' }}
            placeholder="••••"
            maxLength={4}
            pattern="\d{4}"
            required
            autoFocus
          />
          {error && (
            <div style={{ color: 'var(--danger)', marginBottom: '16px', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? "Unlocking..." : "Enter League"}
          </button>
        </form>
      </div>
    </div>
  );
}
