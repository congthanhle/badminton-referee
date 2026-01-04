import { useState, useRef, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Match, TeamKey } from "../types/match";
import { addPoint, ServingState } from "../utils/scoreLogic";
import { updateMatchResult, unlockMatch } from "../services/matchService";

export default function ScoreBoardScreen({ route }: any) {
  type HistoryItem = {
    score: { A: number; B: number };
    serving: ServingState;
  };
  const { match, initialServing, deviceId } = route.params;
  const navigation = useNavigation();

  useEffect(() => {
    // Cleanup: unlock match when leaving screen
    return () => {
      if (match.id && deviceId) {
        unlockMatch(match.id).catch(console.error);
      }
    };
  }, [match.id, deviceId]);

  if (!match || !initialServing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>❌ Thiếu dữ liệu trận đấu</Text>
      </View>
    );
  }

  const [score, setScore] = useState({ A: 0, B: 0 });
  const [serving, setServing] = useState(initialServing);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const isProcessing = useRef(false);
  const processingTimeout = useRef<NodeJS.Timeout | null>(null);

  const resetProcessing = () => {
    if (processingTimeout.current) {
      clearTimeout(processingTimeout.current);
    }
    isProcessing.current = false;
  };

  const onAdd = (team: TeamKey) => {
    // Prevent double tap
    if (isProcessing.current) return;
    isProcessing.current = true;

    // Reset after 200ms
    processingTimeout.current = setTimeout(() => {
      isProcessing.current = false;
    }, 200);

    setHistory([...history, { score: { ...score }, serving: { ...serving } }]);
    
    const teamAPlayers = match.teamA.players.map((p: any) => p.name);
    const teamBPlayers = match.teamB.players.map((p: any) => p.name);
    
    const result = addPoint(team, score, serving, teamAPlayers, teamBPlayers);
    setScore(result.score);
    setServing(result.serving);

    // Check for winner
    const newScore = result.score;
    const { pointsPerSet, capPoint } = match;
    
    // Check if either team reached capPoint
    if (newScore.A >= capPoint || newScore.B >= capPoint) {
      resetProcessing(); // Reset before showing alert
      const winnerTeam: TeamKey = newScore.A >= capPoint ? "A" : "B";
      const winnerName = winnerTeam === "A" ? "Đội A" : "Đội B";
      Alert.alert(
        "🏆 Chiến thắng!", 
        `${winnerName} đã thắng với tỷ số ${newScore.A}-${newScore.B}!`,
        [
          {
            text: "Hoàn tác điểm",
            onPress: () => onUndo(),
            style: "cancel"
          },
          {
            text: "OK",
            onPress: async () => {
              if (match.id) {
                setLoading(true);
                try {
                  await updateMatchResult(match.id, winnerTeam, newScore);
                  setLoading(false);
                  Alert.alert(
                    "✅ Đã lưu", 
                    "Kết quả đã được lưu vào Firebase!",
                    [
                      {
                        text: "OK",
                        onPress: () => navigation.navigate("MatchList" as never)
                      }
                    ]
                  );
                } catch (error) {
                  setLoading(false);
                  Alert.alert("❌ Lỗi", "Không thể lưu kết quả. Vui lòng thử lại.");
                }
              }
            },
          }
        ]
      );
      return;
    }

    if (newScore.A >= pointsPerSet || newScore.B >= pointsPerSet) {
      const lead = Math.abs(newScore.A - newScore.B);
      if (lead >= 2) {
        resetProcessing(); // Reset before showing alert
        const winnerTeam: TeamKey = newScore.A > newScore.B ? "A" : "B";
        const winnerName = winnerTeam === "A" ? "Đội A" : "Đội B";
        Alert.alert(
          "🏆 Chiến thắng!", 
          `${winnerName} đã thắng với tỷ số ${newScore.A}-${newScore.B}!`,
          [
            {
              text: "Hoàn tác điểm",
              onPress: () => onUndo(),
              style: "cancel"
            },
            {
              text: "OK",
              onPress: async () => {
                if (match.id) {
                  setLoading(true);
                  try {
                    await updateMatchResult(match.id, winnerTeam, newScore);
                    setLoading(false);
                    Alert.alert(
                      "✅ Đã lưu", 
                      "Kết quả đã được lưu!",
                      [
                        {
                          text: "OK",
                          onPress: () => navigation.navigate("MatchList" as never)
                        }
                      ]
                    );
                  } catch (error) {
                    setLoading(false);
                    Alert.alert("❌ Lỗi", "Không thể lưu kết quả. Vui lòng thử lại.");
                  }
                }
              },
            }
          ]
        );
      }
    }
  };

  const onUndo = () => {
    if (history.length === 0) return;
    resetProcessing(); // Reset when undoing
    
    const lastState = history[history.length - 1];
    setScore(lastState.score);
    setServing(lastState.serving);
    setHistory(history.slice(0, -1));
  };


  const renderTeamPlayers = (teamKey: TeamKey) => {
    const team = teamKey === "A" ? match.teamA : match.teamB;

    return team.players.map((p: any) => {
      const isServingPlayer = p.name === serving.player;
      const isReceivingPlayer = p.name === serving.receivingPlayer;

      return (
        <View
          key={p.name}
          style={[
            styles.playerBox,
            isServingPlayer
              ? { backgroundColor: "#15803d", borderWidth: 0 }
              : isReceivingPlayer
              ? { backgroundColor: "#fff", borderColor: "#15803d", borderWidth: 2 }
              : { backgroundColor: "#f9fafb", borderColor: "#e5e7eb", borderWidth: 1 },
          ]}
        >
          <Text
            style={[
              styles.playerText,
              isServingPlayer ? { color: "#fff", fontWeight: "700" } : {},
            ]}
          >
            {p.name}
          </Text>
        </View>
      );
    });
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{match.name}</Text>

      <View style={styles.scoreRow}>
      <ScoreBlock
        label="ĐỘI A"
        score={score.A}
        onAdd={() => onAdd("A")}
        renderPlayers={() => renderTeamPlayers("A")}
        isServing={serving.team === "A"}
      />
      <ScoreBlock
        label="ĐỘI B"
        score={score.B}
        onAdd={() => onAdd("B")}
        renderPlayers={() => renderTeamPlayers("B")}
        isServing={serving.team === "B"}
      />
      </View>

      <Pressable onPress={onUndo} style={styles.undoBtn} disabled={history.length === 0}>
        <Text style={styles.undoText}>↶ Hoàn tác</Text>
      </Pressable>
    </ScrollView>

    {loading && (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#15803d" />
        <Text style={styles.loadingText}>Đang lưu kết quả...</Text>
      </View>
    )}
    </>
  );
}

function ScoreBlock({ label, score, onAdd, renderPlayers, isServing }: any) {
  return (
    <View style={styles.block}>
      <Text style={styles.team}>{label}</Text>

      {renderPlayers?.()}

      <Pressable
        style={[
          styles.scoreBtn,
          isServing
            ? { backgroundColor: "#15803d" }
            : { backgroundColor: "#fff", borderWidth: 2, borderColor: "#15803d" },
        ]}
        onPress={onAdd}
      >
        <Text style={[styles.scoreText, !isServing && { color: "#15803d" }]}>{score}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
  block: { flex: 1, alignItems: "center" },
  team: { fontSize: 16, marginBottom: 8 },
  playerBox: {
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
    minWidth: 80,
    alignItems: "center",
  },
  playerText: { fontSize: 14 },
  scoreBtn: {
    width: 140,
    height: 200,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },
  scoreText: { fontSize: 48, fontWeight: "800", color: "#fff" },
  undoBtn: {
    marginTop: 120,
    padding: 16,
    backgroundColor: "#dc2626",
    borderRadius: 10,
    alignItems: "center",
  },
  undoText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});