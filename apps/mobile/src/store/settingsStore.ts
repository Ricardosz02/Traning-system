import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
  weightUnit: "kg" | "lbs";
  setWeightUnit: (unit: "kg" | "lbs") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      weightUnit: "kg",
      setWeightUnit: (unit) => set({ weightUnit: unit }),
    }),
    {
      name: "app-settings",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
