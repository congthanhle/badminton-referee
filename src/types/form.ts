export interface MatchFormErrors {
  name?: string;
  pointsPerSet?: string;
  capPoint?: string;
  teamA?: string;
  teamB?: string;
}

export interface FormState {
  name: string;
  type: "single" | "double";
  teamA: string[];
  teamB: string[];
  pointsPerSet: number;
  capPoint: number;
}

