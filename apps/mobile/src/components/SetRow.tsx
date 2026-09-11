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

interface SetRowProps {
  exerciseId: string;
  item: WorkoutSet;
  index: number;
}

const KG_TO_LBS = 2.20462;

export const SetRow = ({ exerciseId, item, index }: SetRowProps) => {
  const updateSet = useWorkoutStore((state) => state.updateSet);
  const { weightUnit } = useSettingsStore();

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

  return (
    <View style={[styles.row, item.completed && styles.rowCompleted]}>
      <Text style={styles.setNumber}>{index + 1}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={displayWeight}
          onChangeText={(text) => handleChange("weight", text)}
          placeholder={weightUnit}
          editable={!item.completed}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={item.reps === 0 ? "" : item.reps.toString()}
          onChangeText={(text) => handleChange("reps", text)}
          placeholder="powt."
          editable={!item.completed}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, styles.rpeInput]}
          keyboardType="numeric"
          value={item.rpe === 0 ? "" : item.rpe.toString()}
          onChangeText={(text) => handleChange("rpe", text)}
          placeholder="RPE"
          maxLength={4}
          editable={!item.completed}
        />
      </View>

      <TouchableOpacity
        style={[styles.checkButton, item.completed && styles.checkButtonActive]}
        onPress={toggleComplete}
      >
        <Ionicons
          name="checkmark"
          size={20}
          color={item.completed ? "#fff" : "#ccc"}
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
    borderBottomColor: "#eee",
  },
  rowCompleted: {
    backgroundColor: "#f0fdf4",
  },
  setNumber: {
    width: 25,
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    textAlign: "center",
  },
  inputContainer: {
    flex: 1,
    marginHorizontal: 5,
  },
  input: {
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    textAlign: "center",
    fontSize: 16,
    color: "#333",
  },
  rpeInput: {
    backgroundColor: "#e0f2fe",
    fontWeight: "bold",
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  checkButtonActive: {
    backgroundColor: "#22c55e",
  },
});
