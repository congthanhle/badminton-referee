import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Match, CourtSide, TeamKey } from "../types/match";
import { lockMatch } from "../services/matchService";

export default function SelectInitialServeScreen({ route, navigation }: any) {
  const match: Match = route.params?.match;
  const deviceId: string = route.params?.deviceId;

  if (!match) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>❌ Không có dữ liệu trận đấu</Text>
      </View>
    );
  }

  const [servingTeam, setServingTeam] = useState<TeamKey>("A");
  const [receivingTeam, setReceivingTeam] = useState<TeamKey>("B");

  // chọn người phát/nhận cho đội A/B
  const teamPlayers = (teamKey: TeamKey) =>
    teamKey === "A" ? match.teamA.players : match.teamB.players;

  const [servingPlayer, setServingPlayer] = useState(
    teamPlayers(servingTeam)[0]?.name ?? ""
  );
  const [receivingPlayer, setReceivingPlayer] = useState(
    teamPlayers(receivingTeam)[0]?.name ?? ""
  );

  const startMatch = async () => {
    // Lock the match for this device
    if (match.id && deviceId) {
      await lockMatch(match.id, deviceId);
    }

    navigation.replace("ScoreBoard", {
      match,
      deviceId,
      initialServing: {
        team: servingTeam,
        player: servingPlayer,
        receivingTeam,
        receivingPlayer,
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Chọn người phát / nhận đầu tiên</Text>

      <Text style={styles.label}>Đội phát</Text>
      <View style={styles.row}>
        <Option label="Đội A" active={servingTeam === "A"} onPress={() => {
          setServingTeam("A");
          setReceivingTeam("B");
          setServingPlayer(teamPlayers("A")[0]?.name ?? "");
          setReceivingPlayer(teamPlayers("B")[0]?.name ?? "");
        }} />
        <Option label="Đội B" active={servingTeam === "B"} onPress={() => {
          setServingTeam("B");
          setReceivingTeam("A");
          setServingPlayer(teamPlayers("B")[0]?.name ?? "");
          setReceivingPlayer(teamPlayers("A")[0]?.name ?? "");
        }} />
      </View>

      <Text style={styles.label}>Người phát</Text>
      {teamPlayers(servingTeam).map(p => (
        <Option key={p.name} label={p.name} active={servingPlayer === p.name} onPress={() => setServingPlayer(p.name)} />
      ))}

      <Text style={styles.label}>Đội nhận</Text>
      <Text>{receivingTeam === "A" ? "Đội A" : "Đội B"}</Text>

      <Text style={styles.label}>Người nhận</Text>
      {teamPlayers(receivingTeam).map(p => (
        <Option key={p.name} label={p.name} active={receivingPlayer === p.name} onPress={() => setReceivingPlayer(p.name)} />
      ))}

      <Pressable style={styles.startBtn} onPress={startMatch}>
        <Text style={styles.startText}>BẮT ĐẦU TRẬN ĐẤU</Text>
      </Pressable>
    </ScrollView>
  );
}

function Option({ label, active, onPress }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, active && styles.optionActive]}
    >
      <Text style={active && { color: "#fff", fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  label: { marginTop: 20, fontSize: 16, fontWeight: "600" },
  row: { flexDirection: "row", gap: 12, marginTop: 10 },
  option: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 8,
  },
  optionActive: {
    backgroundColor: "#15803d",
    borderColor: "#15803d",
  },
  startBtn: {
    marginTop: 30,
    backgroundColor: "#15803d",
    padding: 18,
    borderRadius: 14,
  },
  startText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});
