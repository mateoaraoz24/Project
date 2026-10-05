// store/trainStore.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useTrainStore = create(
  persist(
    (set, get) => ({
      activeSession: null,
      startSession: (routineId, name, exercisesWithPrevious) => {
        set({
          activeSession: {
            routineId,
            name,
            startedAt: new Date().toISOString(),
            exercises: exercisesWithPrevious.map((ex) => {
              const rows = Array.from({ length: ex.target_sets }).map(
                (_, i) => ({
                  weight: ex.previousSets?.[i]?.weight?.toString() ?? "",
                  reps: ex.previousSets?.[i]?.reps?.toString() ?? "",
                  confirmed: false
                })
              );
              return {
                exercise_id: ex.exercise_id,
                name: ex.name,
                target_sets: ex.target_sets,
                rest_seconds: ex.rest_seconds ?? 90,
                rows,
              };
            }),
          },
        });
      },
      toggleRowConfirmed: (exerciseIndex, rowIndex) => {
        set((state) => {
          const exercises = [...state.activeSession.exercises];
          const rows = [...exercises[exerciseIndex].rows];
          rows[rowIndex] = { ...rows[rowIndex], confirmed: !rows[rowIndex].confirmed };
          exercises[exerciseIndex] = { ...exercises[exerciseIndex], rows };
          return { activeSession: { ...state.activeSession, exercises } };
        });
      },
      updateSetField: (exerciseIndex, rowIndex, field, value) => {
        set((state) => {
          const exercises = [...state.activeSession.exercises];
          const rows = [...exercises[exerciseIndex].rows];
          rows[rowIndex] = { ...rows[rowIndex], [field]: value }; 
          exercises[exerciseIndex] = { ...exercises[exerciseIndex], rows };
          return { activeSession: { ...state.activeSession, exercises } };
        });
      },

      addSet: (exerciseIndex, weight, reps) => {
        set((state) => {
          const exercises = [...state.activeSession.exercises];
          const exercise = exercises[exerciseIndex];
          const setNumber = exercise.sets.length + 1;
          exercise.sets = [
            ...exercise.sets,
            {
              set_number: setNumber,
              set_type: "normal",
              weight,
              reps,
              rpe: null,
            },
          ];
          return { activeSession: { ...state.activeSession, exercises } };
        });
      },
      addRow: (exerciseIndex) => {
        set((state) => {
          const exercises = [...state.activeSession.exercises];
          exercises[exerciseIndex].rows = [
            ...exercises[exerciseIndex].rows,
            { weight: "", reps: "", confirmed: false},
          ];
          return { activeSession: { ...state.activeSession, exercises } };
        });
      },

      removeRow: (exerciseIndex, rowIndex) => {
        set((state) => {
          const exercises = [...state.activeSession.exercises];
          exercises[exerciseIndex].rows = exercises[exerciseIndex].rows.filter(
            (_, i) => i !== rowIndex
          );
          return { activeSession: { ...state.activeSession, exercises } };
        });
      },

      clearSession: () => set({ activeSession: null }),
    }),
    {
      name: "active-workout-session",
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      migrate: (persistedState, version) => {
        if (persistedState?.activeSession?.exercises?.some((ex) => !ex.rows)) {
          return { activeSession: null };
        }
        return persistedState;
      },
    }
  )
);
