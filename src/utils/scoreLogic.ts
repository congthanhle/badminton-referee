import { CourtSide, TeamKey } from "../types/match";

export type ScoreState = {
  A: number;
  B: number;
};

export type ServingState = {
  team: TeamKey;
  player: string;
  receivingTeam: TeamKey;
  receivingPlayer: string;
  teamARight?: string; 
  teamBRight?: string;
};

export function addPoint(
  scoringTeam: TeamKey,
  score: ScoreState,
  serving: ServingState,
  teamAPlayers: string[],
  teamBPlayers: string[]
): { score: ScoreState; serving: ServingState } {
  const newScore: ScoreState = {
    ...score,
    [scoringTeam]: score[scoringTeam] + 1,
  };

  const isDouble = teamAPlayers.length > 1 && teamBPlayers.length > 1;

  // Create a copy to avoid mutating input
  const currentServing = { ...serving };

  // Initialize court positions for doubles on first call
  if (isDouble && !currentServing.teamARight) {
    // Determine who is on right court based on current serve
    if (currentServing.team === "A") {
      // Team A serving: if score is even, server is on right
      currentServing.teamARight = score.A % 2 === 0 ? currentServing.player : teamAPlayers.find(p => p !== currentServing.player)!;
    } else {
      // Team A receiving: receiver is diagonally opposite to server
      // If B's score is even, B serves from right, so A receives on left (A's right is the partner)
      currentServing.teamARight = score.B % 2 === 0 
        ? teamAPlayers.find(p => p !== currentServing.receivingPlayer)!
        : currentServing.receivingPlayer;
    }
  }
  
  if (isDouble && !currentServing.teamBRight) {
    if (currentServing.team === "B") {
      currentServing.teamBRight = score.B % 2 === 0 ? currentServing.player : teamBPlayers.find(p => p !== currentServing.player)!;
    } else {
      currentServing.teamBRight = score.A % 2 === 0 
        ? teamBPlayers.find(p => p !== currentServing.receivingPlayer)!
        : currentServing.receivingPlayer;
    }
  }

  // CASE 1: Serving team wins the point
  if (scoringTeam === currentServing.team) {
    if (!isDouble) {
      // Singles: same server, same receiver
      return {
        score: newScore,
        serving: currentServing,
      };
    }

    // Doubles: serving team scores
    // Rule: ONLY serving team swaps positions, receiving team stays
    const newServing = { ...currentServing };
    
    // Swap ONLY serving team's positions
    if (currentServing.team === "A") {
      const currentARight = newServing.teamARight!;
      newServing.teamARight = teamAPlayers.find(p => p !== currentARight)!;
    } else {
      const currentBRight = newServing.teamBRight!;
      newServing.teamBRight = teamBPlayers.find(p => p !== currentBRight)!;
    }
    
    // Server stays the same player
    newServing.player = currentServing.player;
    
    // Determine where the server is NOW (after swap)
    const servingTeamRight = currentServing.team === "A" ? newServing.teamARight! : newServing.teamBRight!;
    const serverIsOnRight = newServing.player === servingTeamRight;
    
    // Receiver is diagonally opposite to server's actual position
    const receiverOnLeft = serverIsOnRight;
    const receivingTeamRight = currentServing.receivingTeam === "A" ? newServing.teamARight! : newServing.teamBRight!;
    const receivingTeamPlayers = currentServing.receivingTeam === "A" ? teamAPlayers : teamBPlayers;
    newServing.receivingPlayer = receiverOnLeft 
      ? receivingTeamPlayers.find(p => p !== receivingTeamRight)!
      : receivingTeamRight;
    
    return {
      score: newScore,
      serving: newServing,
    };
  }

  // CASE 2: Receiving team wins the point - service changes
  if (!isDouble) {
    // Singles: receiver becomes server
    return {
      score: newScore,
      serving: {
        team: scoringTeam,
        player: currentServing.receivingPlayer,
        receivingTeam: currentServing.team,
        receivingPlayer: currentServing.player,
      },
    };
  }

  // Doubles: receiving team wins and gains serve
  // Rule: The RECEIVER becomes the server from their current position
  // No position swaps
  const newServer = currentServing.receivingPlayer;
  
  // Determine new receiver: diagonally opposite to the new server
  const newServingScore = newScore[scoringTeam];
  const shouldServeFromRight = newServingScore % 2 === 0;
  
  // Determine where the new server is positioned
  const newServingTeamRight = scoringTeam === "A" ? currentServing.teamARight! : currentServing.teamBRight!;
  const newServerIsOnRight = newServer === newServingTeamRight;
  
  // Server should be on right if score is even, left if odd
  // If they're in the wrong position, it means we need to determine based on actual position
  // Actually, they stay where they are and serve from there
  
  // Receiver is diagonally opposite
  const receiverShouldBeOnLeft = newServerIsOnRight;
  const newReceivingTeamRight = currentServing.team === "A" ? currentServing.teamARight! : currentServing.teamBRight!;
  const newReceivingTeamPlayers = currentServing.team === "A" ? teamAPlayers : teamBPlayers;
  const newReceiver = receiverShouldBeOnLeft
    ? newReceivingTeamPlayers.find(p => p !== newReceivingTeamRight)!
    : newReceivingTeamRight;

  return {
    score: newScore,
    serving: {
      team: scoringTeam,
      player: newServer,
      receivingTeam: currentServing.team,
      receivingPlayer: newReceiver,
      teamARight: currentServing.teamARight,
      teamBRight: currentServing.teamBRight,
    },
  };
}


