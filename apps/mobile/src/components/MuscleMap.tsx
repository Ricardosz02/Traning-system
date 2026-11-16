import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Ellipse, G } from "react-native-svg";
import { useThemeStore } from "../store/themeStore";
import { colors } from "../theme/colors";

export type MapMuscleRegion =
  | "chest"
  | "shoulders"
  | "traps"
  | "lats"
  | "back"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

export const MAP_REGION_LABELS: Record<MapMuscleRegion, string> = {
  chest: "Klatka piersiowa",
  shoulders: "Barki",
  traps: "Kaptury / Góra pleców",
  lats: "Najszersze grzbietu",
  back: "Prostowniki / Dół pleców",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Przedramiona",
  abs: "Brzuch i core",
  quads: "Czworogłowe ud",
  hamstrings: "Dwugłowe ud",
  glutes: "Pośladki",
  calves: "Łydki",
};

export const DB_MUSCLE_TO_REGION: Record<string, MapMuscleRegion> = {
  CHEST: "chest",
  chest: "chest",
  klatka: "chest",

  BACK_LATS: "lats",
  lats: "lats",
  plecy: "lats",

  BACK_TRAPS: "traps",
  traps: "traps",

  BACK_ERECTORS: "back",
  back: "back",
  lower_back: "back",

  SHOULDERS_FRONT: "shoulders",
  SHOULDERS_MID: "shoulders",
  SHOULDERS_REAR: "shoulders",
  shoulders: "shoulders",
  delts: "shoulders",
  barki: "shoulders",

  BICEPS: "biceps",
  biceps: "biceps",

  TRICEPS: "triceps",
  triceps: "triceps",

  FOREARMS: "forearms",
  forearms: "forearms",
  przedramiona: "forearms",

  ABS_RECTUS: "abs",
  ABS_OBLIQUES: "abs",
  ABS_TRANSVERSE: "abs",
  abs: "abs",
  core: "abs",
  abdominals: "abs",
  brzuch: "abs",

  QUADS: "quads",
  quads: "quads",
  legs: "quads",
  nogi: "quads",

  HAMSTRINGS: "hamstrings",
  hamstrings: "hamstrings",

  GLUTES: "glutes",
  glutes: "glutes",
  pośladki: "glutes",

  CALVES: "calves",
  calves: "calves",
};

interface MuscleMapProps {
  activeMuscles?: string[];
  muscleLoad?: Partial<Record<MapMuscleRegion, number>>;
  selectedRegion?: MapMuscleRegion | null;
  onSelectRegion?: (region: MapMuscleRegion) => void;
  hideTitle?: boolean;
}

const MUSCLE_GROUP_ALIASES: Record<string, string[]> = {
  shoulders: [
    "shoulders",
    "delts",
    "barki",
    "shoulders_front",
    "shoulders_mid",
    "shoulders_rear",
  ],
  chest: ["chest", "klatka"],
  abs: [
    "abs",
    "core",
    "abdominals",
    "brzuch",
    "abs_rectus",
    "abs_obliques",
    "abs_transverse",
  ],
  biceps: ["biceps"],
  triceps: ["triceps"],
  forearms: ["forearms", "przedramiona"],
  legs: ["legs", "quads", "hamstrings", "calves", "nogi"],
  quads: ["legs", "quads", "nogi"],
  hamstrings: ["legs", "hamstrings", "nogi"],
  calves: ["legs", "calves", "nogi"],
  back: ["back", "lats", "traps", "lower_back", "plecy", "back_erectors"],
  lats: ["back", "lats", "plecy", "back_lats"],
  traps: ["back", "traps", "plecy", "back_traps"],
  glutes: ["glutes", "pośladki"],
};

const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
};

export const MuscleMap = ({
  activeMuscles = [],
  muscleLoad,
  selectedRegion,
  onSelectRegion,
  hideTitle = false,
}: MuscleMapProps) => {
  const { isDarkMode } = useThemeStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const inactiveColor = isDarkMode ? "#3f4756" : "#cbd5e1";
  const neutralColor = isDarkMode ? "#262b34" : "#e2e8f0";
  const strokeColor = isDarkMode ? theme.surface : "#ffffff";
  const selectedStrokeColor = isDarkMode ? "#ffffff" : "#0f172a";

  const isHeatmapMode = muscleLoad !== undefined;

  const maxSets = isHeatmapMode
    ? Math.max(1, ...Object.values(muscleLoad || {}).map((v) => v || 0))
    : 1;

  const normalizedActive = new Set(
    activeMuscles.map((m) => m.toLowerCase().trim()),
  );

  const isActive = (muscleKey: string) => {
    if (normalizedActive.has(muscleKey)) return true;
    const aliases = MUSCLE_GROUP_ALIASES[muscleKey] || [];
    return aliases.some((alias) => normalizedActive.has(alias));
  };

  const getColor = (region: MapMuscleRegion) => {
    if (isHeatmapMode) {
      const sets = muscleLoad?.[region] || 0;
      if (sets <= 0) return inactiveColor;
      const ratio = sets / maxSets;
      const alpha = 0.35 + ratio * 0.65;
      return hexToRgba(theme.primary, alpha);
    }
    return isActive(region) ? "#ef4444" : inactiveColor;
  };

  const getStroke = (region: MapMuscleRegion) =>
    selectedRegion === region ? selectedStrokeColor : strokeColor;

  const getStrokeWidth = (region: MapMuscleRegion) =>
    selectedRegion === region ? 2.6 : 1.6;

  const handlePress = (region: MapMuscleRegion) => {
    if (onSelectRegion) {
      onSelectRegion(region);
    }
  };

  return (
    <View
      style={[
        styles.container,
        !hideTitle && {
          marginTop: 20,
          paddingTop: 20,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        },
      ]}
    >
      {!hideTitle && (
        <Text style={[styles.title, { color: theme.textMuted }]}>
          Zaangażowane partie mięśniowe
        </Text>
      )}

      <View style={styles.mapContainer}>
        <View style={styles.figure}>
          <Text style={[styles.figureLabel, { color: theme.textMuted }]}>
            Przód
          </Text>
          <Svg width="145" height="275" viewBox="0 0 220 420">
            <G fill={neutralColor} stroke={strokeColor} strokeWidth={1.6}>
              <Ellipse cx="110" cy="30" rx="16" ry="20" />
              <Path d="M 101 50 L 119 50 L 122 64 L 98 64 Z" />
              <Path d="M 93 182 L 110 194 L 127 182 L 110 214 Z" />
              <Path d="M 73 290 L 95 292 L 93 310 L 72 310 Z" />
              <Path d="M 147 290 L 125 292 L 127 310 L 148 310 Z" />
              <Path d="M 46 210 L 56 212 L 53 233 Q 45 233 44 224 Z" />
              <Path d="M 174 210 L 164 212 L 167 233 Q 175 233 176 224 Z" />
              <Path d="M 76 390 L 88 390 L 90 409 Q 75 413 69 405 Z" />
              <Path d="M 144 390 L 132 390 L 130 409 Q 145 413 151 405 Z" />
            </G>

            {/* Kaptury */}
            <G
              fill={getColor("traps")}
              stroke={getStroke("traps")}
              strokeWidth={getStrokeWidth("traps")}
              onPress={() => handlePress("traps")}
            >
              <Path d="M 98 64 L 76 74 L 94 74 Z" />
              <Path d="M 122 64 L 144 74 L 126 74 Z" />
            </G>

            {/* Klatka piersiowa */}
            <G
              fill={getColor("chest")}
              stroke={getStroke("chest")}
              strokeWidth={getStrokeWidth("chest")}
              onPress={() => handlePress("chest")}
            >
              <Path d="M 75 76 L 108 76 L 108 112 Q 87 115 73 104 Z" />
              <Path d="M 112 76 L 145 76 L 147 104 Q 133 115 112 112 Z" />
            </G>

            {/* Barki */}
            <G
              fill={getColor("shoulders")}
              stroke={getStroke("shoulders")}
              strokeWidth={getStrokeWidth("shoulders")}
              onPress={() => handlePress("shoulders")}
            >
              <Path d="M 72 76 Q 55 80 56 105 Q 64 111 71 103 Z" />
              <Path d="M 148 76 Q 165 80 164 105 Q 156 111 149 103 Z" />
            </G>

            {/* Biceps */}
            <G
              fill={getColor("biceps")}
              stroke={getStroke("biceps")}
              strokeWidth={getStrokeWidth("biceps")}
              onPress={() => handlePress("biceps")}
            >
              <Path d="M 56 108 Q 49 130 55 150 Q 64 153 70 146 Q 72 126 70 108 Z" />
              <Path d="M 164 108 Q 171 130 165 150 Q 156 153 150 146 Q 148 126 150 108 Z" />
            </G>

            {/* Przedramiona */}
            <G
              fill={getColor("forearms")}
              stroke={getStroke("forearms")}
              strokeWidth={getStrokeWidth("forearms")}
              onPress={() => handlePress("forearms")}
            >
              <Path d="M 54 154 Q 45 180 47 206 L 56 208 Q 64 182 68 154 Z" />
              <Path d="M 166 154 Q 175 180 173 206 L 164 208 Q 156 182 152 154 Z" />
            </G>

            {/* Brzuch */}
            <G
              fill={getColor("abs")}
              stroke={getStroke("abs")}
              strokeWidth={getStrokeWidth("abs")}
              onPress={() => handlePress("abs")}
            >
              <Path d="M 94 116 L 108 116 L 108 134 L 93 134 Z" />
              <Path d="M 112 116 L 126 116 L 127 134 L 112 134 Z" />
              <Path d="M 93 137 L 108 137 L 108 155 L 94 155 Z" />
              <Path d="M 112 137 L 127 137 L 126 155 L 112 155 Z" />
              <Path d="M 95 158 L 108 158 L 108 185 L 99 178 Z" />
              <Path d="M 112 158 L 125 158 L 121 178 L 112 185 Z" />
              <Path d="M 74 110 Q 83 116 90 116 L 91 174 Q 77 162 74 110 Z" />
              <Path d="M 146 110 Q 137 116 130 116 L 129 174 Q 143 162 146 110 Z" />
            </G>

            {/* Czworogłowe ud */}
            <G
              fill={getColor("quads")}
              stroke={getStroke("quads")}
              strokeWidth={getStrokeWidth("quads")}
              onPress={() => handlePress("quads")}
            >
              <Path d="M 73 184 Q 82 192 86 204 L 80 284 Q 72 282 70 268 Q 64 226 73 184 Z" />
              <Path d="M 88 194 Q 98 202 106 214 L 96 286 Q 88 290 82 284 Z" />
              <Path d="M 147 184 Q 138 192 134 204 L 140 284 Q 148 282 150 268 Q 156 226 147 184 Z" />
              <Path d="M 132 194 Q 122 202 114 214 L 124 286 Q 132 290 138 284 Z" />
            </G>

            {/* Łydki */}
            <G
              fill={getColor("calves")}
              stroke={getStroke("calves")}
              strokeWidth={getStrokeWidth("calves")}
              onPress={() => handlePress("calves")}
            >
              <Path d="M 72 314 L 93 314 Q 97 352 88 386 L 76 386 Q 67 352 72 314 Z" />
              <Path d="M 148 314 L 127 314 Q 123 352 132 386 L 144 386 Q 153 352 148 314 Z" />
            </G>
          </Svg>
        </View>

        <View style={styles.figure}>
          <Text style={[styles.figureLabel, { color: theme.textMuted }]}>
            Tył
          </Text>
          <Svg width="145" height="275" viewBox="0 0 220 420">
            <G fill={neutralColor} stroke={strokeColor} strokeWidth={1.6}>
              <Ellipse cx="110" cy="30" rx="16" ry="20" />
              <Path d="M 101 50 L 119 50 L 122 64 L 98 64 Z" />
              <Path d="M 73 290 L 95 292 L 93 310 L 72 310 Z" />
              <Path d="M 147 290 L 125 292 L 127 310 L 148 310 Z" />
              <Path d="M 46 210 L 56 212 L 53 233 Q 45 233 44 224 Z" />
              <Path d="M 174 210 L 164 212 L 167 233 Q 175 233 176 224 Z" />
              <Path d="M 76 390 L 88 390 L 90 409 Q 75 413 69 405 Z" />
              <Path d="M 144 390 L 132 390 L 130 409 Q 145 413 151 405 Z" />
            </G>

            {/* Kaptury */}
            <G
              fill={getColor("traps")}
              stroke={getStroke("traps")}
              strokeWidth={getStrokeWidth("traps")}
              onPress={() => handlePress("traps")}
            >
              <Path d="M 98 64 L 110 64 L 110 118 L 77 76 Z" />
              <Path d="M 122 64 L 110 64 L 110 118 L 143 76 Z" />
            </G>

            {/* Barki */}
            <G
              fill={getColor("shoulders")}
              stroke={getStroke("shoulders")}
              strokeWidth={getStrokeWidth("shoulders")}
              onPress={() => handlePress("shoulders")}
            >
              <Path d="M 73 76 Q 55 80 56 105 Q 64 111 72 103 Z" />
              <Path d="M 147 76 Q 165 80 164 105 Q 156 111 148 103 Z" />
            </G>

            {/* Najszersze grzbietu */}
            <G
              fill={getColor("lats")}
              stroke={getStroke("lats")}
              strokeWidth={getStrokeWidth("lats")}
              onPress={() => handlePress("lats")}
            >
              <Path d="M 74 82 L 108 121 L 107 165 L 82 169 Q 73 132 74 82 Z" />
              <Path d="M 146 82 L 112 121 L 113 165 L 138 169 Q 147 132 146 82 Z" />
            </G>

            {/* Prostowniki / Dół pleców */}
            <G
              fill={getColor("back")}
              stroke={getStroke("back")}
              strokeWidth={getStrokeWidth("back")}
              onPress={() => handlePress("back")}
            >
              <Path d="M 84 172 L 108 168 L 108 192 L 87 186 Z" />
              <Path d="M 136 172 L 112 168 L 112 192 L 133 186 Z" />
            </G>

            {/* Triceps */}
            <G
              fill={getColor("triceps")}
              stroke={getStroke("triceps")}
              strokeWidth={getStrokeWidth("triceps")}
              onPress={() => handlePress("triceps")}
            >
              <Path d="M 56 108 Q 49 130 55 150 Q 64 153 70 146 Q 72 126 70 108 Z" />
              <Path d="M 164 108 Q 171 130 165 150 Q 156 153 150 146 Q 148 126 150 108 Z" />
            </G>

            {/* Przedramiona */}
            <G
              fill={getColor("forearms")}
              stroke={getStroke("forearms")}
              strokeWidth={getStrokeWidth("forearms")}
              onPress={() => handlePress("forearms")}
            >
              <Path d="M 54 154 Q 45 180 47 206 L 56 208 Q 64 182 68 154 Z" />
              <Path d="M 166 154 Q 175 180 173 206 L 164 208 Q 156 182 152 154 Z" />
            </G>

            {/* Pośladki */}
            <G
              fill={getColor("glutes")}
              stroke={getStroke("glutes")}
              strokeWidth={getStrokeWidth("glutes")}
              onPress={() => handlePress("glutes")}
            >
              <Path d="M 84 190 L 108 196 L 108 232 Q 81 236 73 216 Q 73 198 84 190 Z" />
              <Path d="M 136 190 L 112 196 L 112 232 Q 139 236 147 216 Q 147 198 136 190 Z" />
            </G>

            {/* Dwugłowe ud */}
            <G
              fill={getColor("hamstrings")}
              stroke={getStroke("hamstrings")}
              strokeWidth={getStrokeWidth("hamstrings")}
              onPress={() => handlePress("hamstrings")}
            >
              <Path d="M 73 222 Q 87 238 107 236 L 96 288 L 72 288 Q 65 254 73 222 Z" />
              <Path d="M 147 222 Q 133 238 113 236 L 124 288 L 148 288 Q 155 254 147 222 Z" />
            </G>

            {/* Łydki */}
            <G
              fill={getColor("calves")}
              stroke={getStroke("calves")}
              strokeWidth={getStrokeWidth("calves")}
              onPress={() => handlePress("calves")}
            >
              <Path d="M 72 314 L 93 314 Q 98 346 88 386 L 76 386 Q 66 346 72 314 Z" />
              <Path d="M 148 314 L 127 314 Q 122 346 132 386 L 144 386 Q 154 346 148 314 Z" />
            </G>
          </Svg>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  title: {
    fontSize: 14,
    fontWeight: "bold",
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
    marginBottom: 5,
  },
});
