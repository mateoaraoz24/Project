import { create } from "zustand";

export const useRoutineStore = create((set) => ({
  routineName: "",
  exercises: [],

  setRoutineName: (name) => set({ routineName: name }),

  addExercises: (newExercises) => {
    set((state) => {
      const existingIds = new Set(state.exercises.map((e) => e.exercise_id));
      const toAdd = newExercises
        .filter((e) => !existingIds.has(e.id))
        .map((e) => ({
          exercise_id: e.id,
          name: e.name,
          muscle_group: e.muscle_group,
          equipment: e.equipment,
          target_sets: 3,
          rest_seconds: 90,
          notes: null,
        }));
      return { exercises: [...state.exercises, ...toAdd] };
    });
  },

  updateTargetSets: (index, sets) => {
    set((state) => {
      const updated = [...state.exercises];
      updated[index] = { ...updated[index], target_sets: sets };
      return { exercises: updated };
    });
  },

  removeExercise: (index) => {
    set((state) => ({
      exercises: state.exercises.filter((_, i) => i !== index),
    }));
  },

  setFullRoutine: (name, exercisesFromApi) => {
    set({
      routineName: name,
      exercises: exercisesFromApi.map((ex) => ({
        exercise_id: ex.exercise_id,
        name: ex.name,
        muscle_group: ex.muscle_group,
        equipment: ex.equipment,
        target_sets: ex.target_sets,
        rest_seconds: ex.rest_seconds ?? 90,
        notes: ex.notes,
      })),
    });
  },
  updateRestSeconds: (index, seconds) => {
    set((state) => {
      const updated = [...state.exercises];
      updated[index] = { ...updated[index], rest_seconds: seconds };
      return { exercises: updated };
    });
  },

  resetRoutine: () => set({ routineName: "", exercises: [] }),
}));