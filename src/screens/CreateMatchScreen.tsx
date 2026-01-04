import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { createMatch } from "../services/matchService";
import { MatchFormErrors, FormState } from "../types/form";
import { validateMatchForm } from "../utils/validateMatch";

export default function CreateMatchScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [teamA, setTeamA] = useState(["", ""]);
  const [teamB, setTeamB] = useState(["", ""]);
  const [type, setType] = useState<"single" | "double">("single");
  const [points, setPoints] = useState("21");
  const [cap, setCap] = useState("30");
  const [errors, setErrors] = useState<MatchFormErrors>({});
  const [loading, setLoading] = useState(false);

  const isDouble = type === "double";

  /* =====================
     VALIDATE FORM
  ===================== */
  const validate = (next?: Partial<FormState>) => {
    const formData: FormState = {
      name,
      type,
      teamA,
      teamB,
      pointsPerSet: Number(points),
      capPoint: Number(cap),
      ...next,
    };

    const errs = validateMatchForm(formData);
    setErrors(errs);
    return errs;
  };

  const isFormValid = Object.keys(errors).length === 0;

  const submit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await createMatch({
        name,
        type,
        teamA,
        teamB,
        pointsPerSet: Number(points),
        capPoint: Number(cap),
      });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Tên trận đấu</Text>
      <TextInput
        style={[styles.input, errors.name && styles.inputError]}
        placeholder="VD: Chung kết đôi nam"
        value={name}
        onChangeText={(v) => {
          setName(v);
          validate({ name: v });
        }}
      />
      <ErrorText text={errors.name} />
      <Text style={styles.label}>Đội A</Text>
      <TextInput
        style={[styles.input, errors.teamA && styles.inputError]}
        placeholder="VĐV A1"
        value={teamA[0]}
        onChangeText={(v) => {
          const next = [v, teamA[1]];
          setTeamA(next);
          validate({ teamA: next });
        }}
      />
      {isDouble && (
        <TextInput
          style={[styles.input, errors.teamA && styles.inputError]}
          placeholder="VĐV A2"
          value={teamA[1]}
          onChangeText={(v) => {
            const next = [teamA[0], v];
            setTeamA(next);
            validate({ teamA: next });
          }}
        />
      )}
      <ErrorText text={errors.teamA} />

      <Text style={styles.label}>Đội B</Text>
      <TextInput
        style={[styles.input, errors.teamB && styles.inputError]}
        placeholder="VĐV B1"
        value={teamB[0]}
        onChangeText={(v) => {
          const next = [v, teamB[1]];
          setTeamB(next);
          validate({ teamB: next });
        }}
      />
      {isDouble && (
        <TextInput
          style={[styles.input, errors.teamB && styles.inputError]}
          placeholder="VĐV B2"
          value={teamB[1]}
          onChangeText={(v) => {
            const next = [teamB[0], v];
            setTeamB(next);
            validate({ teamB: next });
          }}
        />
      )}
      <ErrorText text={errors.teamB} />
      <Text style={styles.label}>Loại trận</Text>
      <View style={styles.row}>
        <OptionButton
          label="Đánh đơn"
          active={type === "single"}
          onPress={() => {
            setType("single");
            validate({ type: "single" });
          }}
        />
        <OptionButton
          label="Đánh đôi"
          active={type === "double"}
          onPress={() => {
            setType("double");
            validate({ type: "double" });
          }}
        />
      </View>
      <Text style={styles.label}>Điểm thắng set</Text>
      <TextInput
        style={[
          styles.input,
          errors.pointsPerSet && styles.inputError,
        ]}
        keyboardType="numeric"
        value={points}
        onChangeText={(v) => {
          setPoints(v);
          validate({ pointsPerSet: Number(v) });
        }}
      />
      <ErrorText text={errors.pointsPerSet} />
      <Text style={styles.label}>Điểm chạm</Text>
      <TextInput
        style={[
          styles.input,
          errors.capPoint && styles.inputError,
        ]}
        keyboardType="numeric"
        value={cap}
        onChangeText={(v) => {
          setCap(v);
          validate({ capPoint: Number(v) });
        }}
      />
      <ErrorText text={errors.capPoint} />
      <Pressable
        disabled={!isFormValid || loading}
        onPress={submit}
        style={[
          styles.submit,
          (!isFormValid || loading) && styles.submitDisabled,
        ]}
      >
        <Text style={styles.submitText}>TẠO TRẬN ĐẤU</Text>
      </Pressable>
    </ScrollView>

    {loading && (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#15803d" />
        <Text style={styles.loadingText}>Đang tạo trận đấu...</Text>
      </View>
    )}
  </>
  );
}

function ErrorText({ text }: { text?: string }) {
  if (!text) return null;
  return <Text style={styles.error}>{text}</Text>;
}

function OptionButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        active && styles.optionActive,
      ]}
    >
      <Text
        style={[
          styles.optionText,
          active && styles.optionTextActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingInline: 20,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  inputError: {
    borderColor: "red",
  },
  error: {
    color: "red",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  option: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#aaa",
    alignItems: "center",
  },
  optionActive: {
    backgroundColor: "#15803d",
    borderColor: "#15803d",
  },
  optionText: {
    fontSize: 16,
  },
  optionTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  submit: {
    backgroundColor: "#15803d",
    padding: 16,
    borderRadius: 10,
    marginTop: 30,
  },
  submitDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    fontWeight: "700",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
});
