import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MatchListScreen from "../screens/MatchListScreen";
import SelectInitialServeScreen from "../screens/SelectInitialServeScreen";
import ScoreBoardScreen from "../screens/ScoreBoardScreen";
import CreateMatchScreen from "../screens/CreateMatchScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="MatchList">
      <Stack.Screen
        name="MatchList"
        component={MatchListScreen}
        options={{ title: "Danh sách trận đấu" }}
      />
      <Stack.Screen
        name="CreateMatch"
        component={CreateMatchScreen}
        options={{ title: "Tạo trận đấu" }}
      />
      <Stack.Screen
        name="SelectInitialServe"
        component={SelectInitialServeScreen}
        options={{ title: "Chọn người phát đầu tiên" }}
      />
      <Stack.Screen
        name="ScoreBoard"
        component={ScoreBoardScreen}
        options={{ title: "Chấm điểm" }}
      />
    </Stack.Navigator>
  );
}
