/**
 * 體重與飲食管理核心計算模組 (BMR / TDEE / 減重預測 / 營養素分配 / 份量換算)
 */

export function calculateBmi(weightKg, heightCm) {
  const hMeter = heightCm / 100;
  if (hMeter <= 0) return 0;
  return +(weightKg / (hMeter * hMeter)).toFixed(1);
}

export function getBmiCategory(bmi) {
  if (bmi < 18.5) return { label: '體重過輕', color: '#0284c7' };
  if (bmi < 24.0) return { label: '健康標準', color: '#059669' };
  if (bmi < 27.0) return { label: '體重過重', color: '#d97706' };
  if (bmi < 30.0) return { label: '輕度肥胖', color: '#ea580c' };
  if (bmi < 35.0) return { label: '中度肥胖', color: '#dc2626' };
  return { label: '重度肥胖', color: '#991b1b' };
}

/**
 * 計算基礎代謝率 BMR (Mifflin-St Jeor 或 Katch-McArdle 公式)
 */
export function calculateBmr({ gender, age, heightCm, weightKg, bodyFatPct }) {
  if (bodyFatPct && bodyFatPct >= 5 && bodyFatPct <= 60) {
    const leanBodyMass = weightKg * (1 - bodyFatPct / 100);
    return Math.round(370 + 21.6 * leanBodyMass);
  }
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

/**
 * 綜合身體素質、飲食管理方法與預定施行週數，計算減重預測與營養目標
 */
export function calculateWeightPlan(profile, method, durationWeeks, intensity = 'standard') {
  const { gender, age, heightCm, weightKg, targetWeightKg, bodyFatPct, activityMultiplier } = profile;

  const bmr = calculateBmr({ gender, age, heightCm, weightKg, bodyFatPct });
  const tdee = Math.round(bmr * activityMultiplier);

  // 依據飲食法預設赤字比例與使用者選擇的強度計算目標熱量赤字
  const intensityMap = {
    gentle: 0.78,
    standard: 1.0,
    aggressive: 1.25
  };
  const intensityFactor = intensityMap[intensity] || 1.0;
  const baseDeficitRatio = (method?.defaultDeficitRatio || 0.2) * intensityFactor;
  let desiredDeficit = Math.round(tdee * baseDeficitRatio);

  // 限制合理每日赤字範圍 (300 ~ 900 kcal)
  if (intensity === 'gentle') desiredDeficit = Math.max(280, Math.min(450, desiredDeficit));
  if (intensity === 'standard') desiredDeficit = Math.max(400, Math.min(680, desiredDeficit));
  if (intensity === 'aggressive') desiredDeficit = Math.max(550, Math.min(880, desiredDeficit));

  // 安全熱量底線：不低於 BMR * 0.92，且女性不低於 1150 kcal、男性不低於 1400 kcal
  const minSafeCalories = Math.max(gender === 'male' ? 1400 : 1150, Math.round(bmr * 0.92));
  let targetCalories = tdee - desiredDeficit;
  let hitSafetyFloor = false;

  if (targetCalories < minSafeCalories) {
    targetCalories = minSafeCalories;
    hitSafetyFloor = true;
  }

  // 若 TDEE 本身偏低，確保至少有溫和赤字 220 kcal（搭配運動與斷食代謝加成）
  const actualDailyDeficit = Math.max(220, tdee - targetCalories);
  const metabolicBonus = method?.metabolicBonus || 1.05;
  const effectiveDailyDeficit = Math.round(actualDailyDeficit * metabolicBonus);

  // 模擬逐週體重變化（考慮首兩週肝醣水分釋放 + 後續隨體重下降之代謝微幅適應）
  const milestones = [];
  const startDate = new Date();
  let currentW = weightKg;

  // 初期肝醣水分消腫效應 (低碳/186/168 較明顯)
  const initialWaterLoss =
    method?.id === 'lowcarb' ? 0.75 :
    method?.id === '186' ? 0.6 :
    method?.id === '168' ? 0.5 : 0.35;

  milestones.push({
    week: 0,
    dateStr: formatDateShort(startDate),
    weight: +weightKg.toFixed(1),
    totalLost: 0,
    bmi: calculateBmi(weightKg, heightCm)
  });

  for (let w = 1; w <= durationWeeks; w++) {
    // 隨體重減輕，基礎消耗微幅下降的適應係數 (保持在 0.82 以上)
    const adaptation = Math.max(0.82, 1 - (w - 1) * 0.007);
    const weeklyFatLossKg = ((effectiveDailyDeficit * 7) / 7700) * adaptation;
    const waterBonus = w === 1 ? initialWaterLoss * 0.7 : w === 2 ? initialWaterLoss * 0.3 : 0;

    currentW = Math.max(38, currentW - (weeklyFatLossKg + waterBonus));
    const weekDate = new Date(startDate.getTime() + w * 7 * 24 * 3600 * 1000);

    milestones.push({
      week: w,
      dateStr: formatDateShort(weekDate),
      weight: +currentW.toFixed(1),
      totalLost: +(weightKg - currentW).toFixed(1),
      bmi: calculateBmi(currentW, heightCm)
    });
  }

  const finalWeight = milestones[milestones.length - 1].weight;
  const totalWeightLoss = +(weightKg - finalWeight).toFixed(1);
  const startBmi = calculateBmi(weightKg, heightCm);
  const endBmi = calculateBmi(finalWeight, heightCm);
  const waistLossCm = +(totalWeightLoss * 0.88).toFixed(1);

  // 計算距離使用者期望目標體重需要幾週
  let weeksToGoal = null;
  if (targetWeightKg && targetWeightKg < weightKg) {
    const neededLoss = weightKg - targetWeightKg;
    const avgWeeklyLoss = totalWeightLoss / Math.max(1, durationWeeks);
    weeksToGoal = Math.max(1, Math.ceil(neededLoss / Math.max(0.25, avgWeeklyLoss)));
  }

  // 三大營養素計算 (蛋白質 4 kcal/g, 碳水 4 kcal/g, 脂肪 9 kcal/g)
  const split = method?.macroSplit || { protein: 0.3, carbs: 0.4, fat: 0.3 };
  const proteinKcal = Math.round(targetCalories * split.protein);
  const carbsKcal = Math.round(targetCalories * split.carbs);
  const fatKcal = Math.max(0, targetCalories - proteinKcal - carbsKcal);

  const macros = {
    proteinGrams: Math.round(proteinKcal / 4),
    proteinKcal,
    proteinPct: Math.round(split.protein * 100),
    carbsGrams: Math.round(carbsKcal / 4),
    carbsKcal,
    carbsPct: Math.round(split.carbs * 100),
    fatGrams: Math.round(fatKcal / 9),
    fatKcal,
    fatPct: Math.round(split.fat * 100)
  };

  // 建議飲水量 (ml)：一般 35ml/kg，高蛋白或低碳 38ml/kg
  const waterPerKg = ['highprotein', 'lowcarb', '186'].includes(method?.id) ? 38 : 35;
  const dailyWaterMl = Math.round((weightKg * waterPerKg) / 50) * 50;

  return {
    bmr,
    tdee,
    targetCalories,
    actualDailyDeficit,
    effectiveDailyDeficit,
    hitSafetyFloor,
    minSafeCalories,
    startWeight: +weightKg.toFixed(1),
    finalWeight,
    totalWeightLoss,
    startBmi,
    endBmi,
    waistLossCm,
    weeksToGoal,
    durationWeeks,
    dailyWaterMl,
    macros,
    milestones
  };
}

/**
 * 根據使用者目標熱量與套餐基準熱量，產生個人化份量調整建議
 */
export function getPortionAdjustmentAdvice(plan, targetCalories, methodId) {
  if (plan.id === 'plan-52-fastday' && methodId === '52') {
    return `📌 <strong>5:2 輕斷食日專用</strong>：每週任選不連續 2 天照此 600 kcal 菜單吃；其餘 5 天正常日請選擇下方約 <strong>${targetCalories} kcal</strong> 的套餐！`;
  }

  const diff = targetCalories - plan.baseCalories;
  if (Math.abs(diff) <= 100) {
    return `✅ <strong>完美契合您的目標熱量 (${targetCalories} kcal)</strong>：請直接依照下方套餐標準份量享用即可！`;
  }

  if (diff > 100) {
    const extraEggs = Math.max(1, Math.round(diff / 150));
    return `💡 <strong>個人化份量加成 (+${diff} kcal)</strong>：您的代謝較高（目標 ${targetCalories} kcal），建議在此套餐基礎上<strong>多加 ${extraEggs} 份優質蛋白（如舒肥雞胸半包、茶葉蛋 ${extraEggs} 顆或無糖豆漿 1 瓶）</strong>，吃飽更能瘦！`;
  }

  const reduceDiff = Math.abs(diff);
  return `💡 <strong>個人化份量微調 (-${reduceDiff} kcal)</strong>：為符合您的目標 ${targetCalories} kcal，建議將套餐中的<strong>澱粉主食（飯／地瓜）減少約 1/3 份，或點心堅果減半</strong>即可精準達標！`;
}

export function formatDateShort(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}
