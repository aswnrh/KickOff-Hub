"use client";

import { useState } from "react";
import { createLeague } from "../actions/league";
import styles from "./page.module.css";
import { useToast } from "@/components/Toast";

export default function CreateLeague() {
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const result = await createLeague(formData);
      if (result?.error) {
        setError(result.error);
        showToast(result.error, "error");
        setLoading(false);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      showToast("An unexpected error occurred. Please try again.", "error");
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.card}`}>
        <h1 className={styles.title}>Kick-Off</h1>
        <p className={styles.subtitle}>Initialize a new tournament. A 4-digit admin PIN is auto-generated.</p>

        <form action={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>League Name</label>
            <input 
              type="text" 
              name="name" 
              id="name" 
              className="input-base" 
              placeholder="e.g. Sunday Super League" 
              required
              maxLength={50}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>Description (Optional)</label>
            <textarea 
              name="description" 
              id="description" 
              className="input-base" 
              placeholder="A brief description of rules or stakes..."
              rows={3}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', marginTop: '16px' }}
            disabled={loading}
          >
            {loading ? "Initializing..." : "Create League"}
          </button>
        </form>
      </div>
    </div>
  );
}
