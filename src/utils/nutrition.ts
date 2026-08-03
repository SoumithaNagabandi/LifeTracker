import type { DietProfile, MealFood, MealLog, Nutrients } from '../types';

export interface FoodReference {
  id: string;
  name: string;
  servingLabel: string;
  nutrients: Nutrients;
}

export const EMPTY_NUTRIENTS: Nutrients = {
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
  vitaminB12Mcg: 0,
  vitaminDMcg: 0,
  ironMg: 0,
};

// Approximate values per listed serving, compiled from common USDA reference values.
// Brand, recipe and portion size can change these numbers substantially.
export const FOOD_CATALOG: FoodReference[] = [
  {
    id: 'rice-cooked',
    name: 'Cooked white rice',
    servingLabel: '1 cup (158 g)',
    nutrients: { calories: 205, proteinG: 4.3, carbsG: 44.5, fatG: 0.4, fiberG: 0.6, vitaminB12Mcg: 0, vitaminDMcg: 0, ironMg: 1.9 },
  },
  {
    id: 'roti',
    name: 'Whole-wheat roti',
    servingLabel: '1 medium (40 g)',
    nutrients: { calories: 120, proteinG: 3.5, carbsG: 22, fatG: 2.7, fiberG: 3, vitaminB12Mcg: 0, vitaminDMcg: 0, ironMg: 1.2 },
  },
  {
    id: 'dal',
    name: 'Cooked dal',
    servingLabel: '1 cup (200 g)',
    nutrients: { calories: 230, proteinG: 14, carbsG: 40, fatG: 2, fiberG: 15, vitaminB12Mcg: 0, vitaminDMcg: 0, ironMg: 4.5 },
  },
  {
    id: 'chickpeas',
    name: 'Cooked chickpeas',
    servingLabel: '1 cup (164 g)',
    nutrients: { calories: 269, proteinG: 14.5, carbsG: 45, fatG: 4.3, fiberG: 12.5, vitaminB12Mcg: 0, vitaminDMcg: 0, ironMg: 4.7 },
  },
  {
    id: 'paneer',
    name: 'Paneer',
    servingLabel: '100 g',
    nutrients: { calories: 265, proteinG: 18.3, carbsG: 1.2, fatG: 20.8, fiberG: 0, vitaminB12Mcg: 1.1, vitaminDMcg: 0.5, ironMg: 0.2 },
  },
  {
    id: 'egg',
    name: 'Boiled egg',
    servingLabel: '1 large',
    nutrients: { calories: 78, proteinG: 6.3, carbsG: 0.6, fatG: 5.3, fiberG: 0, vitaminB12Mcg: 0.6, vitaminDMcg: 1.1, ironMg: 0.9 },
  },
  {
    id: 'chicken-breast',
    name: 'Cooked chicken breast',
    servingLabel: '100 g',
    nutrients: { calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6, fiberG: 0, vitaminB12Mcg: 0.3, vitaminDMcg: 0.1, ironMg: 1 },
  },
  {
    id: 'salmon',
    name: 'Cooked salmon',
    servingLabel: '100 g',
    nutrients: { calories: 206, proteinG: 22, carbsG: 0, fatG: 12, fiberG: 0, vitaminB12Mcg: 3.2, vitaminDMcg: 13, ironMg: 0.3 },
  },
  {
    id: 'milk',
    name: 'Milk',
    servingLabel: '1 cup (244 ml)',
    nutrients: { calories: 122, proteinG: 8.1, carbsG: 12, fatG: 4.8, fiberG: 0, vitaminB12Mcg: 1.3, vitaminDMcg: 2.9, ironMg: 0.1 },
  },
  {
    id: 'yogurt',
    name: 'Plain yogurt',
    servingLabel: '1 cup (245 g)',
    nutrients: { calories: 149, proteinG: 8.5, carbsG: 11.4, fatG: 8, fiberG: 0, vitaminB12Mcg: 0.9, vitaminDMcg: 0.2, ironMg: 0.1 },
  },
  {
    id: 'oats',
    name: 'Cooked oatmeal',
    servingLabel: '1 cup (234 g)',
    nutrients: { calories: 166, proteinG: 5.9, carbsG: 28, fatG: 3.6, fiberG: 4, vitaminB12Mcg: 0, vitaminDMcg: 0, ironMg: 2.1 },
  },
  {
    id: 'banana',
    name: 'Banana',
    servingLabel: '1 medium',
    nutrients: { calories: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4, fiberG: 3.1, vitaminB12Mcg: 0, vitaminDMcg: 0, ironMg: 0.3 },
  },
  {
    id: 'apple',
    name: 'Apple',
    servingLabel: '1 medium',
    nutrients: { calories: 95, proteinG: 0.5, carbsG: 25, fatG: 0.3, fiberG: 4.4, vitaminB12Mcg: 0, vitaminDMcg: 0, ironMg: 0.2 },
  },
  {
    id: 'spinach',
    name: 'Cooked spinach',
    servingLabel: '1 cup (180 g)',
    nutrients: { calories: 41, proteinG: 5.4, carbsG: 6.8, fatG: 0.5, fiberG: 4.3, vitaminB12Mcg: 0, vitaminDMcg: 0, ironMg: 6.4 },
  },
  {
    id: 'mixed-vegetables',
    name: 'Mixed cooked vegetables',
    servingLabel: '1 cup',
    nutrients: { calories: 120, proteinG: 5, carbsG: 24, fatG: 1, fiberG: 7, vitaminB12Mcg: 0, vitaminDMcg: 0, ironMg: 2 },
  },
  {
    id: 'almonds',
    name: 'Almonds',
    servingLabel: '28 g (23 nuts)',
    nutrients: { calories: 164, proteinG: 6, carbsG: 6.1, fatG: 14.2, fiberG: 3.5, vitaminB12Mcg: 0, vitaminDMcg: 0, ironMg: 1.1 },
  },
];

export function scaleNutrients(nutrients: Nutrients, servings: number): Nutrients {
  return Object.fromEntries(
    Object.entries(nutrients).map(([key, value]) => [key, Number((value * servings).toFixed(2))])
  ) as unknown as Nutrients;
}

export function addNutrients(items: Nutrients[]): Nutrients {
  return items.reduce(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      proteinG: sum.proteinG + item.proteinG,
      carbsG: sum.carbsG + item.carbsG,
      fatG: sum.fatG + item.fatG,
      fiberG: sum.fiberG + item.fiberG,
      vitaminB12Mcg: sum.vitaminB12Mcg + item.vitaminB12Mcg,
      vitaminDMcg: sum.vitaminDMcg + item.vitaminDMcg,
      ironMg: sum.ironMg + item.ironMg,
    }),
    { ...EMPTY_NUTRIENTS }
  );
}

export function mealTotal(foods: MealFood[]): Nutrients {
  return addNutrients(foods.map((food) => scaleNutrients(food.nutrients, food.servings)));
}

export function dayTotal(logs: MealLog[], date: string): Nutrients {
  return addNutrients(
    logs.filter((log) => log.date === date).map((log) => mealTotal(log.foods))
  );
}

export function calculateBmi(profile: DietProfile): number | null {
  if (!profile.heightCm || !profile.weightKg || profile.heightCm <= 0 || profile.weightKg <= 0) {
    return null;
  }
  const meters = profile.heightCm / 100;
  return profile.weightKg / (meters * meters);
}

export function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Below standard range';
  if (bmi < 25) return 'Standard range';
  if (bmi < 30) return 'Above standard range';
  return 'High range';
}

export function estimateDailyCalories(profile: DietProfile): number | null {
  if (!profile.weightKg || profile.weightKg <= 0) return null;
  // A broad maintenance estimate when age, sex and activity are unavailable.
  return Math.round(profile.weightKg * 30);
}

export const GENERAL_DAILY_TARGETS: Nutrients = {
  calories: 2000,
  proteinG: 50,
  carbsG: 275,
  fatG: 78,
  fiberG: 28,
  vitaminB12Mcg: 2.4,
  vitaminDMcg: 15,
  ironMg: 18,
};

