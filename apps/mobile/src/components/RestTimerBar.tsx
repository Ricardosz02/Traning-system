import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWorkoutStore } from "../store/workoutStore";
import { useThemeStore } from "../store/themeStore";
import { colors } from "../theme/colors";

export const RestTimerBar = () => {
  const { activeTimerEndTime, stopTimer, addTimeToTimer } = useWorkoutStore();
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  useEffect(() => {
    if (!activeTimerEndTime) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const difference = Math.floor((activeTimerEndTime - now) / 1000);

      if (difference <= 0) {
        stopTimer();
        setTimeLeft(0);
      } else {
        setTimeLeft(difference);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [activeTimerEndTime, stopTimer]);

  if (!activeTimerEndTime || timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? theme.surface : theme.primary,
          borderColor: isDarkMode ? theme.border : "rgba(0,0,0,0.1)",
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.timeAdjustBtn,
          {
            backgroundColor: isDarkMode
              ? theme.border
              : "rgba(255,255,255,0.2)",
          },
        ]}
        onPress={() => addTimeToTimer(-30)}
      >
        <Text
          style={[
            styles.timeAdjustText,
            { color: isDarkMode ? theme.text : theme.primaryText },
          ]}
        >
          -30s
        </Text>
      </TouchableOpacity>

      <View style={styles.centerBlock}>
        <Ionicons
          name="timer-outline"
          size={20}
          color={isDarkMode ? theme.text : theme.primaryText}
          style={styles.icon}
        />
        <Text
          style={[
            styles.timerText,
            { color: isDarkMode ? theme.text : theme.primaryText },
          ]}
        >
          {formattedTime}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.timeAdjustBtn,
          {
            backgroundColor: isDarkMode
              ? theme.border
              : "rgba(255,255,255,0.2)",
          },
        ]}
        onPress={() => addTimeToTimer(30)}
      >
        <Text
          style={[
            styles.timeAdjustText,
            { color: isDarkMode ? theme.text : theme.primaryText },
          ]}
        >
          +30s
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeBtn} onPress={stopTimer}>
        <Ionicons
          name="close"
          size={24}
          color={isDarkMode ? theme.text : theme.primaryText}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  timeAdjustBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  timeAdjustText: { fontWeight: "bold" },
  centerBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: { marginRight: 5 },
  timerText: {
    fontSize: 22,
    fontWeight: "bold",
    fontVariant: ["tabular-nums"],
  },
  closeBtn: {
    padding: 4,
    marginLeft: 10,
  },
});
