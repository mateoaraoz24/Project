import { create } from "zustand";

export const useFoodStore = create((set, get) => ({
  foods: [],

  setFoods: (originalItems) => {
    const mapped = originalItems.map((item) => {
      const currentGrams = item.grams || 100;
      return {
        ...item,
        base_kcal: item.calories / currentGrams,
        base_protein: item.protein / currentGrams,
        base_carbs: item.carbs / currentGrams,
        base_fat: item.fat / currentGrams,
        grams: currentGrams,
      };
    });
    set({ foods: mapped });
  },

  updateFoodGrams: (index, numericalGrams) => {
    set((state) => {
      if (index < 0 || index >= state.foods.length) return state;
      const updated = [...state.foods];
      const food = updated[index];
      updated[index] = {
        ...food,
        grams: numericalGrams,
        calories: Math.round(food.base_kcal * numericalGrams),
        protein: parseFloat((food.base_protein * numericalGrams).toFixed(1)),
        carbs: parseFloat((food.base_carbs * numericalGrams).toFixed(1)),
        fat: parseFloat((food.base_fat * numericalGrams).toFixed(1)),
      };
      return { foods: updated };
    });
  },

  deleteFood: (index) => {
    set((state) => ({
      foods: state.foods.filter((_, i) => i !== index),
    }));
  },

  addFood: (searchItem) => {
    const grams = 100; 
    let newIndex;
    set((state) => {
      newIndex = state.foods.length;
      return {
        foods: [
          ...state.foods,
          {
            food_id: searchItem.food_id,
            display_name: searchItem.food_name,
            base_kcal: (searchItem.calories_per_100g || 0) / 100,
            base_protein: (searchItem.protein_per_100g || 0) / 100,
            base_carbs: (searchItem.carbs_per_100g || 0) / 100,
            base_fat: (searchItem.fat_per_100g || 0) / 100,
            grams,
            calories: Math.round(
              (searchItem.calories_per_100g || 0) * (grams / 100)
            ),
            protein: parseFloat(
              (((searchItem.protein_per_100g || 0) * grams) / 100).toFixed(1)
            ),
            carbs: parseFloat(
              (((searchItem.carbs_per_100g || 0) * grams) / 100).toFixed(1)
            ),
            fat: parseFloat(
              (((searchItem.fat_per_100g || 0) * grams) / 100).toFixed(1)
            ),
          },
        ],
      };
    });
    return newIndex;
  },

  resetFoods: () => set({ foods: [] }),
}));
