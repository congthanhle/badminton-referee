import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
} from "react-native";
import { listenMatches } from "../services/matchService";
import { Match } from "../types/match";
import { Swipeable } from "react-native-gesture-handler";
import { deleteMatch } from "../services/matchService";
import { Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Generate or retrieve device ID
const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  } catch {
    return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};


export default function MatchListScreen({ navigation }: any) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    const unsub = listenMatches(setMatches);
    return unsub;
  }, []);

  useEffect(() => {
    // Load device ID
    getDeviceId().then(setDeviceId);
  }, []);

  const filteredMatches = matches.filter((match) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const allPlayerNames = [
      ...match.teamA.players.map(p => p.name.toLowerCase()),
      ...match.teamB.players.map(p => p.name.toLowerCase()),
    ];
    
    return allPlayerNames.some(name => name.includes(query)) || 
           match.name.toLowerCase().includes(query);
  }).sort((a, b) => {
    // Sort by createdAt descending (newest first)
    const timeA = a.createdAt || 0;
    const timeB = b.createdAt || 0;
    return timeB - timeA;
  });

  const openMatch = (match: Match) => {
    if (match.status === "finished") {
      Alert.alert("⚠️ Trận đấu đã kết thúc", "Trận đấu này đã hoàn thành và không thể tiếp tục.");
      return;
    }

    if (!deviceId) {
      Alert.alert("⚠️ Lỗi", "Đang khởi tạo thiết bị, vui lòng thử lại.");
      return;
    }

    // Check if match is locked by another device
    if (match.activeDeviceId && match.activeDeviceId !== deviceId) {
      // Check if lock is stale (older than 5 minutes)
      const lockAge = Date.now() - (match.lockedAt || 0);
      const fiveMinutes = 5 * 60 * 1000;
      
      if (lockAge < fiveMinutes) {
        Alert.alert(
          "🔒 Trận đấu đang được sử dụng",
          "Trận đấu này đang được sử dụng bởi thiết bị khác. Vui lòng đợi hoặc chọn trận khác."
        );
        return;
      }
    }

    navigation.navigate("SelectInitialServe", {
      match,
      deviceId: deviceId,
    });
  };

  const renderTeams = (match: Match) => {
    const teamA = match.teamA.players
      .map((p) => p.name)
      .filter(Boolean)
      .join(" / ");

    const teamB = match.teamB.players
      .map((p) => p.name)
      .filter(Boolean)
      .join(" / ");

    return (
      <Text style={styles.teams}>
        <Text style={styles.teamA}>
          A: {teamA}
        </Text>
        {"  "}vs{"  "}
        <Text style={styles.teamB}>
          B: {teamB}
        </Text>
      </Text>
    );
  };

  const renderRightActions = (id: string) => (
    <Pressable
      onPress={() =>
        Alert.alert(
          "Xoá trận đấu",
          "Bạn có chắc muốn xoá trận này?",
          [
            { text: "Huỷ", style: "cancel" },
            {
              text: "Xoá",
              style: "destructive",
              onPress: () => deleteMatch(id),
            },
          ]
        )
      }
      style={styles.deleteBtn}
    >
      <Text style={styles.deleteText}>Xoá</Text>
    </Pressable>
  );



  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên VDV hoặc tên trận"
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </Pressable>
        )}
      </View>
      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <Swipeable
            enabled={item.status === "created"}
            renderRightActions={() =>
              item.status === "created"
                ? renderRightActions(item.id)
                : null
            }
          > 
          <Pressable
            onPress={() => openMatch(item)}
            android_ripple={{ color: "#e5e7eb" }}
            style={styles.pressable}
            disabled={item.status === "finished"}
          >
            <View style={[
              styles.card,
              item.status === "finished" && styles.completedCard
            ]}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                {item.activeDeviceId && deviceId && item.activeDeviceId !== deviceId && (
                  <Text style={styles.lockIcon}>🔒</Text>
                )}
              </View>

              {renderTeams(item)}

              <View style={styles.metaRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.type === "single" ? "ĐƠN" : "ĐÔI"}
                  </Text>
                </View>

                <Text style={styles.metaText}>
                  {item.pointsPerSet} điểm / set
                </Text>
              </View>

              {item.status === "finished" && item.finalScore && (
                <View style={styles.finishedContainer}>
                  <Text style={styles.finishedLabel}>🏆 Kết quả:</Text>
                  <Text style={styles.finishedScore}>
                    Đội A: {item.finalScore.A} - Đội B: {item.finalScore.B}
                  </Text>
                  <Text style={styles.winner}>
                    Thắng: Đội {item.winner}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </Swipeable>
          

        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {searchQuery.trim() 
              ? `Không tìm thấy trận đấu nào với "${searchQuery}"`
              : "Chưa có trận đấu"}
          </Text>
        }
      />
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("CreateMatch")}
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    paddingVertical: 4,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 4,
  },
  clearText: {
    fontSize: 18,
    color: "#9ca3af",
    fontWeight: "600",
  },
  pressable: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    overflow: "hidden",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },

  lockIcon: {
    fontSize: 18,
    marginLeft: 8,
  },

  teams: {
    fontSize: 15,
    color: "#374151",
    marginBottom: 8,
  },

  teamA: {
    color: "#1d4ed8",
    fontWeight: "600",
  },

  teamB: {
    color: "#b91c1c",
    fontWeight: "600",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  badge: {
    backgroundColor: "#15803d",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  metaText: {
    fontSize: 14,
    color: "#6b7280",
  },

  empty: {
    textAlign: "center",
    marginTop: 60,
    color: "#6b7280",
    fontSize: 16,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#15803d",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },

  fabText: {
    color: "#fff",
    fontSize: 30,
    marginTop: -2,
  },

  deleteBtn: {
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginTop: 12,
    borderRadius: 12,
  },

  deleteText: {
    color: "#fff",
    fontWeight: "700",
  },

  completedCard: {
    backgroundColor: "#f3f4f6",
    opacity: 0.85,
  },

  finishedContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },

  finishedLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#15803d",
    marginBottom: 4,
  },

  finishedScore: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },

  winner: {
    fontSize: 14,
    fontWeight: "700",
    color: "#15803d",
  },

});
