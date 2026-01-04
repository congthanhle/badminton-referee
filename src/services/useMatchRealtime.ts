import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export function useMatchRealtime(matchId: string) {
  const [score, setScore] = useState({ teamA: 0, teamB: 0 });
  const [servingTeam, setServingTeam] = useState("teamA");

  useEffect(() => {
    const unsubScore = onSnapshot(
      doc(db, "matches", matchId, "score"),
      (snap) => snap.exists() && setScore(snap.data() as any)
    );

    const unsubServe = onSnapshot(
      doc(db, "matches", matchId, "serveState"),
      (snap) => snap.exists() && setServingTeam(snap.data().servingTeam)
    );

    return () => {
      unsubScore();
      unsubServe();
    };
  }, [matchId]);

  return { score, servingTeam };
}
