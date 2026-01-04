import { MatchFormErrors } from "../types/form";

export function validateMatchForm(input: {
  name: string;
  type: "single" | "double";
  teamA: string[];
  teamB: string[];
  pointsPerSet: number;
  capPoint: number;
}): MatchFormErrors {
  const errors: MatchFormErrors = {};
  const requiredPlayers = input.type === "double" ? 2 : 1;

  if (!input.name.trim()) {
    errors.name = "Vui lòng nhập tên trận đấu";
  }

  if (!input.pointsPerSet || input.pointsPerSet < 1) {
    errors.pointsPerSet = "Điểm thắng set không hợp lệ";
  }

  if (
    !input.capPoint ||
    input.capPoint < input.pointsPerSet
  ) {
    errors.capPoint =
      "Điểm chạm phải ≥ điểm thắng set";
  }

  const teamAValid = input.teamA
    .slice(0, requiredPlayers)
    .every((n) => n.trim());

  if (!teamAValid) {
    errors.teamA = `Vui lòng nhập tên ${requiredPlayers} VĐV cho đội A`;
  }

  const teamBValid = input.teamB
    .slice(0, requiredPlayers)
    .every((n) => n.trim());

  if (!teamBValid) {
    errors.teamB = `Vui lòng nhập tên ${requiredPlayers} VĐV cho đội B`;
  }

  return errors;
}
