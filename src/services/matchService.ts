import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "./firebase";
import { Match } from "../types/match";

export function listenMatches(
  callback: (matches: Match[]) => void
) {
  return onSnapshot(collection(db, "matches"), (snap) => {
    const data: Match[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Match, "id">),
    }));
    callback(data);
  });
}

export async function createMatch(input: {
  name: string;
  type: "single" | "double";
  teamA: string[];
  teamB: string[];
  pointsPerSet: number;
  capPoint: number;
}) {
  const matchRef = await addDoc(collection(db, "matches"), {
    name: input.name,
    type: input.type,

    teamA: {
      players: input.teamA
        .filter(Boolean)
        .map((n) => ({ name: n })),
    },
    teamB: {
      players: input.teamB
        .filter(Boolean)
        .map((n) => ({ name: n })),
    },

    pointsPerSet: input.pointsPerSet,
    capPoint: input.capPoint,

    currentSet: 1,
    status: "created",
    createdAt: Date.now(),
  });

  await setDoc(
    doc(db, "matches", matchRef.id, "score", "current"),
    { teamA: 0, teamB: 0 }
  );

  await setDoc(
    doc(db, "matches", matchRef.id, "serveState", "current"),
    { servingTeam: "teamA" }
  );

  return matchRef.id;
}


export async function deleteMatch(matchId: string) {
  await deleteDoc(doc(db, "matches", matchId));
}

export async function updateMatchResult(
  matchId: string,
  winner: "A" | "B",
  finalScore: { A: number; B: number }
) {
  await setDoc(
    doc(db, "matches", matchId),
    {
      status: "finished",
      winner: winner,
      finalScore: finalScore,
      completedAt: Date.now(),
      activeDeviceId: null,
      lockedAt: null,
    },
    { merge: true }
  );
}

export async function lockMatch(matchId: string, deviceId: string) {
  await setDoc(
    doc(db, "matches", matchId),
    {
      activeDeviceId: deviceId,
      lockedAt: Date.now(),
    },
    { merge: true }
  );
}

export async function unlockMatch(matchId: string) {
  await setDoc(
    doc(db, "matches", matchId),
    {
      activeDeviceId: null,
      lockedAt: null,
    },
    { merge: true }
  );
}

