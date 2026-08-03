import { useEffect, useMemo, useRef, useState } from 'react';
import type { MealFood, MealLog, Nutrients } from '../types';
import type { TrackerStore } from '../store/useTrackerStore';
import { toDateKey, uid } from '../utils/dates';
import {
  EMPTY_NUTRIENTS,
  FOOD_CATALOG,
  GENERAL_DAILY_TARGETS,
  bmiLabel,
  calculateBmi,
  dayTotal,
  estimateDailyCalories,
  mealTotal,
  scaleNutrients,
} from '../utils/nutrition';
import { deleteMealImage, getMealImage, saveMealImage } from '../utils/imageStorage';

interface DietTrackerProps {
  store: TrackerStore;
}

const NUTRIENT_FIELDS: {
  key: keyof Nutrients;
  label: string;
  unit: string;
  decimals?: number;
}[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'proteinG', label: 'Protein', unit: 'g', decimals: 1 },
  { key: 'carbsG', label: 'Carbs', unit: 'g', decimals: 1 },
  { key: 'fatG', label: 'Fat', unit: 'g', decimals: 1 },
  { key: 'fiberG', label: 'Fiber', unit: 'g', decimals: 1 },
  { key: 'vitaminB12Mcg', label: 'Vitamin B12', unit: 'mcg', decimals: 2 },
  { key: 'vitaminDMcg', label: 'Vitamin D', unit: 'mcg', decimals: 1 },
  { key: 'ironMg', label: 'Iron', unit: 'mg', decimals: 1 },
];

function numeric(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : undefined;
}

function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please select an image file.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Image must be smaller than 12 MB.');

  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read this image.'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode this image.'));
    img.src = source;
  });

  const maxSide = 720;
  const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * ratio));
  canvas.height = Math.max(1, Math.round(image.height * ratio));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image processing is unavailable.');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.72);
}

function NutrientSummary({
  totals,
  calorieTarget,
}: {
  totals: Nutrients;
  calorieTarget: number;
}) {
  const targets = { ...GENERAL_DAILY_TARGETS, calories: calorieTarget };

  return (
    <div className="nutrition-grid">
      {NUTRIENT_FIELDS.map(({ key, label, unit, decimals }) => {
        const value = totals[key];
        const target = targets[key];
        const percent = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
        return (
          <article className="nutrition-stat" key={key}>
            <div className="nutrition-stat-top">
              <span>{label}</span>
              <strong>
                {formatNumber(value, decimals)} <small>{unit}</small>
              </strong>
            </div>
            <div className="nutrition-bar" aria-label={`${percent}% of general daily reference`}>
              <span style={{ width: `${percent}%` }} />
            </div>
            <small>
              {percent}% of {formatNumber(target, decimals)} {unit}
            </small>
          </article>
        );
      })}
    </div>
  );
}

export function DietTracker({ store }: DietTrackerProps) {
  const profile = store.state.dietProfile;
  const today = toDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [mealType, setMealType] = useState<MealLog['mealType']>('breakfast');
  const [notes, setNotes] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string>();
  const [imageError, setImageError] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState(FOOD_CATALOG[0].id);
  const [servings, setServings] = useState(1);
  const [foods, setFoods] = useState<MealFood[]>([]);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customServing, setCustomServing] = useState('1 serving');
  const [customNutrients, setCustomNutrients] = useState<Nutrients>({ ...EMPTY_NUTRIENTS });
  const [mealImages, setMealImages] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const bmi = calculateBmi(profile);
  const estimatedCalories = estimateDailyCalories(profile);
  const calorieTarget = estimatedCalories ?? GENERAL_DAILY_TARGETS.calories;
  const selectedDayTotals = useMemo(
    () => dayTotal(store.state.mealLogs, selectedDate),
    [selectedDate, store.state.mealLogs]
  );
  const draftTotal = useMemo(() => mealTotal(foods), [foods]);
  const selectedDayMeals = useMemo(
    () =>
      store.state.mealLogs
        .filter((meal) => meal.date === selectedDate)
        .slice()
        .reverse(),
    [selectedDate, store.state.mealLogs]
  );

  useEffect(() => {
    let cancelled = false;
    const missingIds = selectedDayMeals
      .map((meal) => meal.imageId)
      .filter((id): id is string => typeof id === 'string')
      .filter((id) => !mealImages[id]);

    if (missingIds.length === 0) return;
    void Promise.all(
      missingIds.map(async (id) => [id, await getMealImage(id)] as const)
    ).then((entries) => {
      if (cancelled) return;
      setMealImages((current) => {
        const next = { ...current };
        for (const [id, dataUrl] of entries) {
          if (dataUrl) next[id] = dataUrl;
        }
        return next;
      });
    }).catch(() => {
      // A missing or blocked image database should not prevent meal data from rendering.
    });

    return () => {
      cancelled = true;
    };
  }, [mealImages, selectedDayMeals]);

  const setProfileNumber = (
    key: keyof typeof profile,
    value: string
  ) => store.updateDietProfile({ [key]: numeric(value) });

  const addCatalogFood = () => {
    const reference = FOOD_CATALOG.find((food) => food.id === selectedFoodId);
    if (!reference || servings <= 0) return;
    setFoods((current) => [
      ...current,
      {
        id: uid(),
        foodId: reference.id,
        name: reference.name,
        servings,
        servingLabel: reference.servingLabel,
        nutrients: reference.nutrients,
      },
    ]);
  };

  const addCustomFood = () => {
    if (!customName.trim()) return;
    setFoods((current) => [
      ...current,
      {
        id: uid(),
        name: customName.trim(),
        servings: 1,
        servingLabel: customServing.trim() || '1 serving',
        nutrients: customNutrients,
      },
    ]);
    setCustomName('');
    setCustomServing('1 serving');
    setCustomNutrients({ ...EMPTY_NUTRIENTS });
    setShowCustom(false);
  };

  const saveMeal = async () => {
    if (foods.length === 0) return;
    const mealId = uid();
    let imageId: string | undefined;
    if (imageDataUrl) {
      try {
        imageId = mealId;
        await saveMealImage(imageId, imageDataUrl);
        setMealImages((current) => ({ ...current, [imageId as string]: imageDataUrl }));
      } catch (error) {
        setImageError(
          error instanceof Error ? error.message : 'Could not save the meal photo.'
        );
        return;
      }
    }

    store.addMealLog({
      id: mealId,
      date: selectedDate,
      mealType,
      notes: notes.trim(),
      foods,
      imageId,
    });
    setFoods([]);
    setNotes('');
    setImageDataUrl(undefined);
    if (fileRef.current) fileRef.current.value = '';
  };

  const onImage = async (file?: File) => {
    setImageError('');
    if (!file) return;
    try {
      setImageDataUrl(await compressImage(file));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Could not process this image.');
    }
  };

  return (
    <div className="diet-tracker">
      <header className="panel-hero">
        <span className="panel-icon">🥗</span>
        <div>
          <h2>Diet tracker</h2>
          <p>Log meals, portions, calories, macros and key vitamins.</p>
        </div>
      </header>

      <section className="diet-card diet-profile-card">
        <div className="diet-card-heading">
          <div>
            <h3>Your health profile</h3>
            <p>Height and weight support BMI and a broad calorie estimate.</p>
          </div>
          {bmi !== null && (
            <div className="bmi-pill">
              <strong>{bmi.toFixed(1)}</strong>
              <span>BMI · {bmiLabel(bmi)}</span>
            </div>
          )}
        </div>

        <div className="diet-form-grid profile-grid">
          <label>
            Height <span>cm</span>
            <input
              type="number"
              min="50"
              max="260"
              value={profile.heightCm ?? ''}
              onChange={(event) => setProfileNumber('heightCm', event.target.value)}
              placeholder="165"
            />
          </label>
          <label>
            Weight <span>kg</span>
            <input
              type="number"
              min="20"
              max="500"
              step="0.1"
              value={profile.weightKg ?? ''}
              onChange={(event) => setProfileNumber('weightKg', event.target.value)}
              placeholder="65"
            />
          </label>
        </div>

        <div className="calorie-estimate">
          <span>Broad maintenance estimate</span>
          <strong>{estimatedCalories ? `${estimatedCalories} kcal/day` : 'Add your weight'}</strong>
          <small>Uses weight × 30. Age, sex, goals and activity are needed for a personal target.</small>
        </div>

        <details className="lab-details">
          <summary>Optional blood-test values</summary>
          <div className="diet-form-grid lab-grid">
            <label>
              Vitamin B12 <span>pg/mL</span>
              <input
                type="number"
                min="0"
                value={profile.vitaminB12PgMl ?? ''}
                onChange={(event) => setProfileNumber('vitaminB12PgMl', event.target.value)}
              />
            </label>
            <label>
              Vitamin D <span>ng/mL</span>
              <input
                type="number"
                min="0"
                value={profile.vitaminDNgMl ?? ''}
                onChange={(event) => setProfileNumber('vitaminDNgMl', event.target.value)}
              />
            </label>
            <label>
              Iron <span>mcg/dL</span>
              <input
                type="number"
                min="0"
                value={profile.ironMcgDl ?? ''}
                onChange={(event) => setProfileNumber('ironMcgDl', event.target.value)}
              />
            </label>
            <label>
              Hemoglobin <span>g/dL</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={profile.hemoglobinGDl ?? ''}
                onChange={(event) => setProfileNumber('hemoglobinGDl', event.target.value)}
              />
            </label>
          </div>
          <p className="medical-note">
            These values are stored for reference only. Lab ranges depend on age, sex, pregnancy,
            test method and clinical history—use your laboratory report and clinician for
            interpretation.
          </p>
        </details>
      </section>

      <section className="diet-card">
        <div className="diet-card-heading">
          <div>
            <h3>Daily nutrition</h3>
            <p>Totals from meals logged for the selected day.</p>
          </div>
          <input
            className="diet-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </div>
        <NutrientSummary totals={selectedDayTotals} calorieTarget={calorieTarget} />
        <p className="nutrition-disclaimer">
          Vitamin and calorie values are estimates. Recipes, brands and actual portions can differ.
        </p>
      </section>

      <section className="diet-card meal-builder">
        <div className="diet-card-heading">
          <div>
            <h3>Log a meal</h3>
            <p>Attach a photo, then select the foods and portions shown in it.</p>
          </div>
          <select value={mealType} onChange={(event) => setMealType(event.target.value as MealLog['mealType'])}>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </select>
        </div>

        <div className="photo-upload">
          {imageDataUrl ? (
            <div className="meal-photo-preview">
              <img src={imageDataUrl} alt="Meal preview" />
              <button type="button" className="btn soft" onClick={() => setImageDataUrl(undefined)}>
                Remove photo
              </button>
            </div>
          ) : (
            <label className="photo-drop">
              <span>📷</span>
              <strong>Upload meal photo</strong>
              <small>JPG, PNG or phone camera · compressed before saving</small>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(event) => void onImage(event.target.files?.[0])}
              />
            </label>
          )}
          {imageError && <p className="form-error">{imageError}</p>}
          <p className="photo-honesty">
            Photo recognition is not enabled in this offline app. The photo is a visual record;
            calculations use the foods and servings you add below.
          </p>
        </div>

        <div className="food-picker">
          <label>
            Food
            <select value={selectedFoodId} onChange={(event) => setSelectedFoodId(event.target.value)}>
              {FOOD_CATALOG.map((food) => (
                <option value={food.id} key={food.id}>
                  {food.name} — {food.servingLabel}
                </option>
              ))}
            </select>
          </label>
          <label>
            Servings
            <input
              type="number"
              min="0.1"
              max="20"
              step="0.25"
              value={servings}
              onChange={(event) => setServings(Math.max(0.1, Number(event.target.value) || 1))}
            />
          </label>
          <button type="button" className="btn primary" onClick={addCatalogFood}>
            + Add food
          </button>
        </div>

        <button type="button" className="btn ghost custom-food-toggle" onClick={() => setShowCustom((value) => !value)}>
          {showCustom ? 'Hide custom food' : '+ Food not listed? Enter label values'}
        </button>

        {showCustom && (
          <div className="custom-food-form">
            <div className="diet-form-grid">
              <label>
                Food name
                <input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Packaged food" />
              </label>
              <label>
                Serving description
                <input value={customServing} onChange={(event) => setCustomServing(event.target.value)} />
              </label>
            </div>
            <div className="custom-nutrient-grid">
              {NUTRIENT_FIELDS.map(({ key, label, unit }) => (
                <label key={key}>
                  {label} <span>{unit}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={customNutrients[key] || ''}
                    onChange={(event) =>
                      setCustomNutrients((current) => ({
                        ...current,
                        [key]: Number(event.target.value) || 0,
                      }))
                    }
                  />
                </label>
              ))}
            </div>
            <button type="button" className="btn soft" disabled={!customName.trim()} onClick={addCustomFood}>
              Add custom food
            </button>
          </div>
        )}

        {foods.length > 0 && (
          <div className="draft-meal">
            <h4>Meal items</h4>
            {foods.map((food) => {
              const total = scaleNutrients(food.nutrients, food.servings);
              return (
                <div className="draft-food-row" key={food.id}>
                  <div>
                    <strong>{food.name}</strong>
                    <small>
                      {food.servings} × {food.servingLabel}
                    </small>
                  </div>
                  <span>{formatNumber(total.calories)} kcal</span>
                  <button
                    type="button"
                    className="icon-btn danger tiny"
                    aria-label={`Remove ${food.name}`}
                    onClick={() => setFoods((current) => current.filter((item) => item.id !== food.id))}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <div className="draft-total">
              <span>Meal total</span>
              <strong>{formatNumber(draftTotal.calories)} kcal</strong>
              <span>{formatNumber(draftTotal.proteinG, 1)} g protein</span>
            </div>
          </div>
        )}

        <textarea
          className="meal-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Meal notes (optional)"
          rows={2}
        />
        <button type="button" className="btn primary save-meal" disabled={foods.length === 0} onClick={() => void saveMeal()}>
          Save {mealType}
        </button>
      </section>

      <section className="diet-card">
        <div className="diet-card-heading">
          <div>
            <h3>Meals for {selectedDate}</h3>
            <p>{selectedDayMeals.length} meal{selectedDayMeals.length === 1 ? '' : 's'} logged</p>
          </div>
        </div>
        {selectedDayMeals.length === 0 ? (
          <p className="empty-hint">No meals logged for this date.</p>
        ) : (
          <div className="meal-history">
            {selectedDayMeals.map((meal) => {
              const total = mealTotal(meal.foods);
              const storedImage = meal.imageId ? mealImages[meal.imageId] : undefined;
              const displayImage = storedImage ?? meal.imageDataUrl;
              return (
                <article className="meal-history-card" key={meal.id}>
                  {displayImage && <img src={displayImage} alt={`${meal.mealType} record`} />}
                  <div className="meal-history-content">
                    <div className="meal-history-title">
                      <strong>{meal.mealType}</strong>
                      <span>{formatNumber(total.calories)} kcal</span>
                    </div>
                    <p>{meal.foods.map((food) => food.name).join(', ')}</p>
                    <div className="meal-mini-macros">
                      <span>P {formatNumber(total.proteinG, 1)}g</span>
                      <span>C {formatNumber(total.carbsG, 1)}g</span>
                      <span>F {formatNumber(total.fatG, 1)}g</span>
                      <span>Fiber {formatNumber(total.fiberG, 1)}g</span>
                    </div>
                    {meal.notes && <small>{meal.notes}</small>}
                  </div>
                  <button
                    type="button"
                    className="icon-btn danger"
                    aria-label={`Delete ${meal.mealType}`}
                    onClick={() => {
                      if (meal.imageId) {
                        void deleteMealImage(meal.imageId).catch(() => undefined);
                        setMealImages((current) => {
                          const next = { ...current };
                          delete next[meal.imageId as string];
                          return next;
                        });
                      }
                      store.deleteMealLog(meal.id);
                    }}
                  >
                    ×
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

