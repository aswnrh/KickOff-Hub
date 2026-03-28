import Link from "next/link";
import { Trophy } from "lucide-react";
import styles from "./page.module.css";
import JoinLeagueCard from "@/components/JoinLeagueCard";

export default function Home() {
  return (
    <div className={styles.hero}>
      <div className={styles.glow} />
      
      <h1 className={styles.title}>
        Organize Like <br />
        <span className="gradient-text">A Professional.</span>
      </h1>
      
      <p className={styles.subtitle}>
        KickOff-Hub brings real-time scoreboards, dynamic match drawing, and secure tracking to your local football leagues.
      </p>

      <div className={styles.cardContainer}>
        {/* Create League */}
        <div className={`glass-panel ${styles.actionCard}`}>
          <div className={styles.iconWrapper}>
            <Trophy size={28} />
          </div>
          <h2 className={styles.cardTitle}>Host a League</h2>
          <p className={styles.cardDesc}>Set up matches, control scoreboards, and manage your tournament to the finals.</p>
          <Link href="/create" className="btn-primary" style={{width: '100%'}}>
            Create League
          </Link>
        </div>

        {/* Join League */}
        <JoinLeagueCard />
      </div>
    </div>
  );
}
