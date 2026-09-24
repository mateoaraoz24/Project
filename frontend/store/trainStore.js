// store/trainStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useTrainStore = create(
  persist(
    (set, get) => ({
      activeSession: null,
      startSession: (routineId, name, exercisesFromRoutine) => {
        set({
          activeSession: {
            routineId,
            name,
            startedAt: new Date().toISOString(),
            exercises: exercisesFromRoutine.map((ex) => ({
              exercise_id: ex.exercise_id,
              name: ex.name,
              target_sets: ex.target_sets,
              sets: [],
            })),
          },
        });
      },

      addSet: (exerciseIndex, weight, reps) => {
        set((state) => {
          const exercises = [...state.activeSession.exercises];
          const exercise = exercises[exerciseIndex];
          const setNumber = exercise.sets.length + 1;
          exercise.sets = [
            ...exercise.sets,
            { set_number: setNumber, set_type: "normal", weight, reps, rpe: null },
          ];
          return { activeSession: { ...state.activeSession, exercises } };
        });
      },

      removeSet: (exerciseIndex, setIndex) => {
        set((state) => {
          const exercises = [...state.activeSession.exercises];
          exercises[exerciseIndex].sets = exercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
          return { activeSession: { ...state.activeSession, exercises } };
        });
      },

      clearSession: () => set({ activeSession: null }),
    }),
    {
      name: "active-workout-session",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);