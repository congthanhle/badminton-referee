import { Team } from "./team";

export type CourtSide = "left" | "right";
export type TeamKey = "A" | "B";

export type Score = {
  teamA: number;
  teamB: number;
};

export type MatchStatus = "created" | "playing" | "finished";

export type Match = {
  finalScore: { A: number; B: number } | null;
  id: string;
  name: string;
  type: "single" | "double";
  teamA: Team;
  teamB: Team;
  pointsPerSet: number;
  capPoint: number;
  winner?: "A" | "B";
  status: MatchStatus;
  createdAt?: number;
  completedAt?: number;
  activeDeviceId?: string | null;
  lockedAt?: number | null;
};
