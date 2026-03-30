export function publishLeagueUpdate(leagueId: string) {
  if (typeof window === "undefined") return;
  const key = `kickoff:league-update:${leagueId}`;
  const payload = JSON.stringify({ leagueId, ts: Date.now() });
  localStorage.setItem(key, payload);
  window.dispatchEvent(
    new CustomEvent("kickoff:league-update", {
      detail: { leagueId },
    })
  );
}

export function subscribeLeagueUpdates(
  leagueId: string,
  onUpdate: () => void
) {
  if (typeof window === "undefined") return () => {};

  const key = `kickoff:league-update:${leagueId}`;
  const onStorage = (event: StorageEvent) => {
    if (event.key === key && event.newValue) {
      onUpdate();
    }
  };

  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<{ leagueId?: string }>).detail;
    if (detail?.leagueId === leagueId) {
      onUpdate();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener("kickoff:league-update", onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("kickoff:league-update", onCustom);
  };
}
