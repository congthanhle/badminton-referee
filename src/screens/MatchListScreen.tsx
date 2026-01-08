import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
} from "react-native";
import { listenMatches } from "../services/matchService";
import { Match } from "../types/match";
import { Swipeable } from "react-native-gesture-handler";
import { deleteMatch } from "../services/matchService";
import { Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

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

    if (match.activeDeviceId && match.activeDeviceId !== deviceId) {
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
    const isFinished = match.status === "finished";
    const isTeamAWinner = isFinished && match.winner === "A";
    const isTeamBWinner = isFinished && match.winner === "B";
    
    return (
      <View className="my-2">
        <View className="flex-row border-b border-gray-300 pb-1 mb-2">
          <Text className={`flex-1 font-bold text-center ${isTeamAWinner ? "text-red-500" : "text-gray-700"}`}>
            Đội A {match.status === "finished" && match.finalScore ? `(${match.finalScore.A})` : ""}
          </Text>
          <Text className={`flex-1 font-bold text-center ${isTeamBWinner ? "text-red-500" : "text-gray-700"}`}>
            Đội B {match.status === "finished" && match.finalScore ? `(${match.finalScore.B})` : ""}
          </Text>
        </View>
        
        {Array.from({ length: Math.max(match.teamA.players.length, match.teamB.players.length) }).map((_, index) => (
          <View key={index} className="flex-row py-1.5 border-b border-gray-100">
            <View className="flex-1 px-2">
              <Text className={`font-semibold text-center ${isTeamAWinner ? "text-red-500" : ""}`}>
                {match.teamA.players[index]?.name || "-"}
              </Text>
            </View>
            <View className="flex-1 px-2">
              <Text className={`font-semibold text-center ${isTeamBWinner ? "text-red-500" : ""}`}>
                {match.teamB.players[index]?.name || "-"}
              </Text>
            </View>
          </View>
        ))}
      </View>
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
      className="bg-red-600 justify-center items-center w-20 mt-3 rounded-xl h-full"
    >
      <Text className="text-white font-bold"><FontAwesome6 name="trash-can" size={24} color="white" /></Text>
    </Pressable>
  );



  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row items-center bg-white mx-4 mt-3 mb-1 px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
        <Text className="text-lg mr-2">🔍</Text>
        <TextInput
          className="flex-1 text-base text-gray-700 py-1"
          placeholder="Tìm kiếm theo tên VDV hoặc tên trận"
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} className="p-1 ml-1">
            <Text className="text-lg text-gray-400 font-semibold">✕</Text>
          </Pressable>
        )}
      </View>
      <FlatList
        data={filteredMatches}
        keyExtractor={(item: Match) => item.id}
        contentContainerClassName="pb-30"
        renderItem={({ item }: { item: Match }) => {
          const isLocked = item.activeDeviceId && item.activeDeviceId !== deviceId;
          const canDelete = item.status === "created" && !isLocked;
          
          return (
          <Swipeable
            enabled={canDelete}
            renderRightActions={() =>
              canDelete
                ? renderRightActions(item.id)
                : null
            }
          > 
          <Pressable
            onPress={() => openMatch(item)}
            android_ripple={{ color: "#e5e7eb" }}
            className="mx-4 mt-3 rounded-xl overflow-hidden"
            disabled={item.status === "finished"}
          >
            <View className={`bg-white p-4 rounded-xl border border-gray-200 ${item.status === "finished" ? "bg-gray-100 opacity-85" : ""}`}>
              <View className="items-center mb-1.5 relative">
                <Text className="font-semibold text-[16px] text-green-700 mb-4">{item.name}</Text>
                {item.activeDeviceId && deviceId && item.activeDeviceId !== deviceId && (
                  <Feather name="lock" size={24} color="red"/>
                )}
              </View>
              {renderTeams(item)}
              <View className="flex-row items-center gap-2.5 mt-4">
                <View className="bg-green-700 px-2.5 py-1 rounded-full">
                  <Text className="text-white text-xs font-bold">
                    {item.type === "single" ? "ĐƠN" : "ĐÔI"}
                  </Text>
                </View>

                <Text className="text-sm text-gray-500">
                  {item.pointsPerSet} điểm / set
                </Text>
              </View>
            </View>
          </Pressable>
        </Swipeable>
          );
        }}
        ListEmptyComponent={
          <Text className="text-center mt-15 text-gray-500 text-base">
            {searchQuery.trim() 
              ? `Không tìm thấy trận đấu nào với "${searchQuery}"`
              : "Chưa có trận đấu"}
          </Text>
        }
      />
      <Pressable
        className="absolute right-5 bottom-7 bg-green-700 w-[32px] h-[32px] rounded-full items-center justify-center shadow-lg"
        onPress={() => navigation.navigate("CreateMatch")}
      >
        <Text className="text-white text-3xl -mt-0.5">＋</Text>
      </Pressable>
    </View>
  );
}
