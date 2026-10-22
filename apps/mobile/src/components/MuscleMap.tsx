import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, G } from "react-native-svg";

interface MuscleMapProps {
  activeMuscles: string[];
}

export const MuscleMap = ({ activeMuscles }: MuscleMapProps) => {
  const isActive = (muscleName: string) => activeMuscles.includes(muscleName);

  const getColor = (muscleName: string) =>
    isActive(muscleName) ? "#ef4444" : "#e2e8f0";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zaangażowane partie mięśniowe</Text>

      <View style={styles.mapContainer}>
        <View style={styles.figure}>
          <Text style={styles.figureLabel}>Przód</Text>
          <Svg width="120" height="200" viewBox="0 0 100 200">
            <G>
              <Circle cx="50" cy="20" r="12" fill="#cbd5e1" />

              <Path
                d="M 25 35 Q 50 25 75 35 L 80 45 L 20 45 Z"
                fill={getColor("shoulders")}
              />

              <Path
                d="M 32 47 L 68 47 L 63 65 L 37 65 Z"
                fill={getColor("chest")}
              />

              <Path
                d="M 38 67 L 62 67 L 55 95 L 45 95 Z"
                fill={getColor("abs")}
              />

              <Path
                d="M 18 47 L 28 47 L 23 85 L 13 85 Z"
                fill={getColor("biceps")}
              />
              <Path
                d="M 72 47 L 82 47 L 87 85 L 77 85 Z"
                fill={getColor("biceps")}
              />

              <Path d="M 35 97 L 65 97 L 60 105 L 40 105 Z" fill="#cbd5e1" />

              <Path
                d="M 35 107 L 48 107 L 44 180 L 32 180 Z"
                fill={getColor("legs")}
              />
              <Path
                d="M 52 107 L 65 107 L 68 180 L 56 180 Z"
                fill={getColor("legs")}
              />
            </G>
          </Svg>
        </View>

        <View style={styles.figure}>
          <Text style={styles.figureLabel}>Tył</Text>
          <Svg width="120" height="200" viewBox="0 0 100 200">
            <G>
              <Circle cx="50" cy="20" r="12" fill="#cbd5e1" />

              <Path
                d="M 25 35 Q 50 25 75 35 L 80 45 L 20 45 Z"
                fill={getColor("shoulders")}
              />

              <Path
                d="M 32 47 L 68 47 L 55 95 L 45 95 Z"
                fill={getColor("back")}
              />

              <Path
                d="M 18 47 L 28 47 L 23 85 L 13 85 Z"
                fill={getColor("triceps")}
              />
              <Path
                d="M 72 47 L 82 47 L 87 85 L 77 85 Z"
                fill={getColor("triceps")}
              />

              <Path
                d="M 32 97 L 68 97 L 72 115 L 28 115 Z"
                fill={getColor("glutes")}
              />

              <Path
                d="M 30 117 L 47 117 L 43 180 L 28 180 Z"
                fill={getColor("legs")}
              />
              <Path
                d="M 53 117 L 70 117 L 72 180 L 57 180 Z"
                fill={getColor("legs")}
              />
            </G>
          </Svg>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6c757d",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 15,
  },
  mapContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  figure: {
    alignItems: "center",
  },
  figureLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#adb5bd",
    marginBottom: 5,
  },
});
