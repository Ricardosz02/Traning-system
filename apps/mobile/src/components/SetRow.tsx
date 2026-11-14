import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWorkoutStore, WorkoutSet } from "../store/workoutStore";
import { useSettingsStore } from "../store/settingsStore";
import { useThemeStore } from "../store/themeStore";
import { colors } from "../theme/colors";

interface SetRowProps {
  exerciseId: string;
  item: WorkoutSet;
  index: number;
}

const KG_TO_LBS = 2.20462;

export const SetRow = ({ exerciseId, item, index }: SetRowProps) => {
  const updateSet = useWorkoutStore((state) => state.updateSet);
  const { weightUnit } = useSettingsStore();

  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const handleChange = (field: keyof WorkoutSet, value: string) => {
    const formattedValue = value.replace(",", ".");
    let parsedValue = formattedValue === "" ? 0 : parseFloat(formattedValue);

    if (!isNaN(parsedValue)) {
      if (field === "weight" && weightUnit === "lbs") {
        parsedValue = parsedValue / KG_TO_LBS;
      }

      const finalValue =
        field === "weight" ? Math.round(parsedValue * 100) / 100 : parsedValue;

      updateSet(exerciseId, item.id, field, finalValue);
    }
  };

  const toggleComplete = () => {
    updateSet(exerciseId, item.id, "completed", !item.completed);
  };

  let displayWeight = "";
  if (item.weight > 0) {
    const weightToShow =
      weightUnit === "lbs" ? item.weight * KG_TO_LBS : item.weight;

    displayWeight = (Math.round(weightToShow * 10) / 10).toString();
  }

  const inputStyle = [
    styles.input,
    {
      backgroundColor: isDarkMode ? "#2c2c2e" : "#f1f5f9",
      color: item.completed ? (isDarkMode ? "#a1a1aa" : "#94a3b8") : theme.text,
      borderColor: isDarkMode ? "#3a3a3c" : "#e2e8f0",
    },
  ];

  const rpeInputStyle = [
    styles.input,
    {
      backgroundColor: isDarkMode ? "#1e3a8a" : "#e0f2fe",
      color: item.completed
        ? isDarkMode
          ? "#60a5fa"
          : "#7dd3fc"
        : isDarkMode
          ? "#93c5fd"
          : "#0369a1",
      fontWeight: "bold" as const,
      borderColor: isDarkMode ? "#1e3a8a" : "#bae6fd",
    },
  ];

  const timeInputStyle = [
    styles.input,
    {
      backgroundColor: isDarkMode ? "#451a03" : "#fef3c7",
      color: item.completed
        ? isDarkMode
          ? "#fbbf24"
          : "#fcd34d"
        : isDarkMode
          ? "#fde68a"
          : "#92400e",
      fontWeight: "bold" as const,
      borderColor: isDarkMode ? "#451a03" : "#fde68a",
    },
  ];

  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: theme.border },
        item.completed && {
          backgroundColor: isDarkMode ? "rgba(34, 197, 94, 0.15)" : "#f0fdf4",
        },
      ]}
    >
      <Text style={[styles.setNumber, { color: theme.textMuted }]}>
        {index + 1}
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={inputStyle}
          keyboardType="numeric"
          value={displayWeight}
          onChangeText={(text) => handleChange("weight", text)}
          placeholder={weightUnit}
          placeholderTextColor={isDarkMode ? "#6b7280" : "#94a3b8"}
          editable={!item.completed}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={inputStyle}
          keyboardType="numeric"
          value={item.reps === 0 ? "" : item.reps.toString()}
          onChangeText={(text) => handleChange("reps", text)}
          placeholder="powt."
          placeholderTextColor={isDarkMode ? "#6b7280" : "#94a3b8"}
          editable={!item.completed}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={rpeInputStyle}
          keyboardType="numeric"
          value={item.rpe === 0 ? "" : item.rpe.toString()}
          onChangeText={(text) => handleChange("rpe", text)}
          placeholder="RPE"
          placeholderTextColor={isDarkMode ? "#60a5fa" : "#7dd3fc"}
          maxLength={4}
          editable={!item.completed}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={timeInputStyle}
          keyboardType="numeric"
          value={!item.rpe ? "" : item.rpe.toString()}
          onChangeText={(text) => handleChange("restTime", text)}
          placeholder="sek"
          placeholderTextColor={isDarkMode ? "#fbbf24" : "#fcd34d"}
          maxLength={4}
          editable={!item.completed}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.checkButton,
          { backgroundColor: isDarkMode ? "#3f3f46" : "#f1f5f9" },
          item.completed && { backgroundColor: "#22c55e" },
        ]}
        onPress={toggleComplete}
      >
        <Ionicons
          name="checkmark"
          size={20}
          color={item.completed ? "#fff" : isDarkMode ? "#71717a" : "#cbd5e1"}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  setNumber: {
    width: 25,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    textAlign: "center",
    fontSize: 14,
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
});
