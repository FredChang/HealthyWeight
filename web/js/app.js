import {
  calculateBmi,
  getBmiCategory,
  calculateWeightPlan,
  evaluateMetabolicCalibration,
  getPortionAdjustmentAdvice,
  formatDateShort
} from './calculator.js?v=1.3.3';
import {
  compressImageFile,
  captureVideoFrame,
  analyzeFoodWithAi,
  setCustomApiKey,
  hasCustomApiKey,
  loadAiFoodHistory,
  saveAiFoodHistoryItem
} from './ai-food.js?v=1.3.3';
import { APP_VERSION } from './version.js?v=1.3.3';

const STORAGE_KEYS = {
  PROFILE: 'hw_user_profile_v1',
  LOGS: 'hw_weight_logs_v1',
  TODAY_MAP: 'hw_today_checkin_map_v1'
};

let dietData = null;
let selectedMethodId = '168';
let selectedWindowId = '12-20';
let selectedCategory = 'recommended';
let highlightedPlanId = null;
let lastCalculation = null;
let customTray = [];
let currentModalShoppingText = '';
let currentAiImages = [];
let lastAiAnalysis = null;
let cameraStream = null;
let cameraFacingMode = 'environment';
let metabolicOffsetKcal = 0;
let dailyExerciseKcal = 0;

const screens = {
  setup: document.getElementById('screen-setup'),
  result: document.getElementById('screen-result'),
  meals: document.getElementById('screen-meals'),
  tracker: document.getElementById('screen-tracker'),
  history: document.getElementById('screen-history')
};

const navTabs = Array.from(document.querySelectorAll('.nav-tab'));

const els = {
  loading: document.getElementById('loading'),
  liveBmiBadge: document.getElementById('live-bmi-badge'),
  inputAge: document.getElementById('input-age'),
  inputHeight: document.getElementById('input-height'),
  inputWeight: document.getElementById('input-weight'),
  inputTargetWeight: document.getElementById('input-target-weight'),
  inputBodyfat: document.getElementById('input-bodyfat'),
  selectActivity: document.getElementById('select-activity'),
  methodCardsGrid: document.getElementById('method-cards-grid'),
  methodDetailTitle: document.getElementById('method-detail-title'),
  methodDetailBadge: document.getElementById('method-detail-badge'),
  methodDetailSummary: document.getElementById('method-detail-summary'),
  selectEatingWindow: document.getElementById('select-eating-window'),
  methodTipsList: document.getElementById('method-tips-list'),
  durationSlider: document.getElementById('duration-slider'),
  durationLabelText: document.getElementById('duration-label-text'),
  durationWeeksBadge: document.getElementById('duration-weeks-badge'),
  durationDateRange: document.getElementById('duration-date-range'),
  calculateBtn: document.getElementById('calculate-btn'),

  // Result screen
  resMethodPill: document.getElementById('res-method-pill'),
  resWeightLoss: document.getElementById('res-weight-loss'),
  resWeightChangeText: document.getElementById('res-weight-change-text'),
  resBmiChange: document.getElementById('res-bmi-change'),
  resWaistChange: document.getElementById('res-waist-change'),
  resGoalEta: document.getElementById('res-goal-eta'),
  resBmr: document.getElementById('res-bmr'),
  resTdee: document.getElementById('res-tdee'),
  resTargetKcal: document.getElementById('res-target-kcal'),
  resDeficitTag: document.getElementById('res-deficit-tag'),
  resWater: document.getElementById('res-water'),
  resWaterCups: document.getElementById('res-water-cups'),
  resSafetyNotice: document.getElementById('res-safety-notice'),
  resCalibrationNotice: document.getElementById('res-calibration-notice'),
  fastingLiveStatus: document.getElementById('fasting-live-status'),
  resWindowDesc: document.getElementById('res-window-desc'),
  timelineBar: document.getElementById('timeline-bar'),
  resMacroRatioText: document.getElementById('res-macro-ratio-text'),
  resMacroP: document.getElementById('res-macro-p'),
  resMacroC: document.getElementById('res-macro-c'),
  resMacroF: document.getElementById('res-macro-f'),
  barMacroP: document.getElementById('bar-macro-p'),
  barMacroC: document.getElementById('bar-macro-c'),
  barMacroF: document.getElementById('bar-macro-f'),
  weightChartContainer: document.getElementById('weight-chart-container'),
  milestoneTbody: document.getElementById('milestone-tbody'),

  // Meals screen & AI analyzer
  aiCameraInput: document.getElementById('ai-camera-input'),
  aiGalleryInput: document.getElementById('ai-gallery-input'),
  aiCameraBtn: document.getElementById('ai-camera-btn'),
  aiGalleryBtn: document.getElementById('ai-gallery-btn'),
  aiCameraLiveWrap: document.getElementById('ai-camera-live-wrap'),
  aiCameraVideo: document.getElementById('ai-camera-video'),
  aiSwitchCamBtn: document.getElementById('ai-switch-cam-btn'),
  aiSnapBtn: document.getElementById('ai-snap-btn'),
  aiCloseCamBtn: document.getElementById('ai-close-cam-btn'),
  aiImagePreviewWrap: document.getElementById('ai-image-preview-wrap'),
  aiImageCountBadge: document.getElementById('ai-image-count-badge'),
  aiImagesGrid: document.getElementById('ai-images-grid'),
  aiRemoveImageBtn: document.getElementById('ai-remove-image-btn'),
  aiFoodNote: document.getElementById('ai-food-note'),
  aiAnalyzeBtn: document.getElementById('ai-analyze-btn'),
  aiLoadingBox: document.getElementById('ai-loading-box'),
  aiLoadingText: document.getElementById('ai-loading-text'),
  aiErrorBox: document.getElementById('ai-error-box'),
  aiResultPanel: document.getElementById('ai-result-panel'),
  aiResFit: document.getElementById('ai-res-fit'),
  aiResTitle: document.getElementById('ai-res-title'),
  aiResKcal: document.getElementById('ai-res-kcal'),
  aiResPct: document.getElementById('ai-res-pct'),
  aiResP: document.getElementById('ai-res-p'),
  aiResC: document.getElementById('ai-res-c'),
  aiResF: document.getElementById('ai-res-f'),
  aiResItems: document.getElementById('ai-res-items'),
  aiResCoachTip: document.getElementById('ai-res-coach-tip'),
  aiResNextMeal: document.getElementById('ai-res-next-meal'),
  aiAddToTrayBtn: document.getElementById('ai-add-to-tray-btn'),
  aiAddToLogBtn: document.getElementById('ai-add-to-log-btn'),
  aiApiKeyInput: document.getElementById('ai-api-key-input'),
  aiSaveKeyBtn: document.getElementById('ai-save-key-btn'),
  aiKeyStatus: document.getElementById('ai-key-status'),
  aiHistoryList: document.getElementById('ai-history-list'),

  mealTargetSummary: document.getElementById('meal-target-summary'),
  mealCategoryFilters: document.getElementById('meal-category-filters'),
  mealPlansList: document.getElementById('meal-plans-list'),
  randomMealBtn: document.getElementById('random-meal-btn'),
  customTotalKcal: document.getElementById('custom-total-kcal'),
  customTargetCompare: document.getElementById('custom-target-compare'),
  customTotalP: document.getElementById('custom-total-p'),
  customTotalC: document.getElementById('custom-total-c'),
  customTotalF: document.getElementById('custom-total-f'),
  customProteinsList: document.getElementById('custom-proteins-list'),
  customCarbsList: document.getElementById('custom-carbs-list'),
  customVeggiesList: document.getElementById('custom-veggies-list'),
  customSelectedTray: document.getElementById('custom-selected-tray'),
  customTrayItems: document.getElementById('custom-tray-items'),
  customAddToLogBtn: document.getElementById('custom-add-to-log-btn'),
  clearCustomMealBtn: document.getElementById('clear-custom-meal-btn'),

  // Screen 4: Today Check-in (今日打卡)
  todayKcalStatus: document.getElementById('today-kcal-status'),
  todayEatenKcal: document.getElementById('today-eaten-kcal'),
  todayRemainingKcal: document.getElementById('today-remaining-kcal'),
  todayRemainingSub: document.getElementById('today-remaining-sub'),
  todayExerciseKcal: document.getElementById('today-exercise-kcal'),
  todayTargetKcal: document.getElementById('today-target-kcal'),
  todayMacroSummary: document.getElementById('today-macro-summary'),
  todayProgressPct: document.getElementById('today-progress-pct'),
  todayKcalBar: document.getElementById('today-kcal-bar'),

  logDate: document.getElementById('log-date'),
  logWeight: document.getElementById('log-weight'),
  weightCompareBadge: document.getElementById('weight-compare-badge'),
  comparePrevLabel: document.getElementById('compare-prev-label'),
  comparePrevWeight: document.getElementById('compare-prev-weight'),
  compareCurrWeight: document.getElementById('compare-curr-weight'),
  compareDiffVal: document.getElementById('compare-diff-val'),
  logExercise: document.getElementById('log-exercise'),
  logStatus: document.getElementById('log-status'),
  logNote: document.getElementById('log-note'),
  addLogBtn: document.getElementById('add-log-btn'),
  todayMealsList: document.getElementById('today-meals-list'),
  goToAiFoodBtn: document.getElementById('go-to-ai-food-btn'),
  manualMealName: document.getElementById('manual-meal-name'),
  manualMealKcal: document.getElementById('manual-meal-kcal'),
  addManualMealBtn: document.getElementById('add-manual-meal-btn'),

  // Screen 5: History & Metabolic Calibration (歷史與校正)
  clearLogsBtn: document.getElementById('clear-logs-btn'),
  trackerStatsSummary: document.getElementById('tracker-stats-summary'),
  trackerLogsList: document.getElementById('tracker-logs-list'),

  calibStatusBadge: document.getElementById('calib-status-badge'),
  calibDays: document.getElementById('calib-days'),
  calibAvgExercise: document.getElementById('calib-avg-exercise'),
  calibExpectedKg: document.getElementById('calib-expected-kg'),
  calibActualKg: document.getElementById('calib-actual-kg'),
  calibAutofillBtn: document.getElementById('calib-autofill-btn'),
  calibResetBtn: document.getElementById('calib-reset-btn'),
  calibApplyBtn: document.getElementById('calib-apply-btn'),
  calibOldTdee: document.getElementById('calib-formula-tdee') || document.getElementById('calib-old-tdee'),
  calibNewTdee: document.getElementById('calib-new-tdee'),
  calibOffsetVal: document.getElementById('calib-offset-val'),
  calibDiagnosisText: document.getElementById('calib-diagnosis-text'),

  // Modal
  shoppingModal: document.getElementById('shopping-modal'),
  modalPlanTitle: document.getElementById('modal-plan-title'),
  modalShoppingList: document.getElementById('modal-shopping-list'),
  copyShoppingBtn: document.getElementById('copy-shopping-btn'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalOkBtn: document.getElementById('modal-ok-btn'),
  appVersion: document.getElementById('app-version')
};

function switchTab(tabName) {
  Object.entries(screens).forEach(([key, el]) => {
    el?.classList.toggle('hidden', key !== tabName);
  });
  navTabs.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getSelectedGender() {
  return document.querySelector('input[name="gender"]:checked')?.value || 'female';
}

function getSelectedIntensity() {
  return document.querySelector('input[name="intensity"]:checked')?.value || 'standard';
}

function getCurrentMethod() {
  return dietData?.methods?.find((m) => m.id === selectedMethodId) || dietData?.methods?.[0];
}

function readProfileFromInputs() {
  const gender = getSelectedGender();
  const age = Math.max(12, Math.min(100, parseFloat(els.inputAge.value) || 30));
  const heightCm = Math.max(120, Math.min(230, parseFloat(els.inputHeight.value) || 162));
  const weightKg = Math.max(30, Math.min(250, parseFloat(els.inputWeight.value) || 64));
  const targetWeightRaw = parseFloat(els.inputTargetWeight.value);
  const targetWeightKg = !isNaN(targetWeightRaw) && targetWeightRaw > 30 ? targetWeightRaw : null;
  const bodyFatRaw = parseFloat(els.inputBodyfat.value);
  const bodyFatPct = !isNaN(bodyFatRaw) && bodyFatRaw >= 5 && bodyFatRaw <= 60 ? bodyFatRaw : null;
  const activityMultiplier = parseFloat(els.selectActivity.value) || 1.375;
  const durationWeeks = parseInt(els.durationSlider.value, 10) || 8;
  const intensity = getSelectedIntensity();

  return {
    gender,
    age,
    heightCm,
    weightKg,
    targetWeightKg,
    bodyFatPct,
    activityMultiplier,
    durationWeeks,
    intensity,
    methodId: selectedMethodId,
    windowId: els.selectEatingWindow.value || selectedWindowId,
    metabolicOffsetKcal,
    dailyExerciseKcal
  };
}

function saveProfileToStorage(profile) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch {
    // ignore storage errors
  }
}

function loadProfileFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.gender) {
      const radio = document.querySelector(`input[name="gender"][value="${saved.gender}"]`);
      if (radio) radio.checked = true;
    }
    if (saved.age) els.inputAge.value = saved.age;
    if (saved.heightCm) els.inputHeight.value = saved.heightCm;
    if (saved.weightKg) els.inputWeight.value = saved.weightKg;
    if (saved.targetWeightKg) els.inputTargetWeight.value = saved.targetWeightKg;
    if (saved.bodyFatPct) els.inputBodyfat.value = saved.bodyFatPct;
    if (saved.activityMultiplier) els.selectActivity.value = String(saved.activityMultiplier);
    if (saved.durationWeeks) els.durationSlider.value = saved.durationWeeks;
    if (saved.intensity) {
      const iRadio = document.querySelector(`input[name="intensity"][value="${saved.intensity}"]`);
      if (iRadio) iRadio.checked = true;
    }
    if (saved.methodId) selectedMethodId = saved.methodId;
    if (saved.windowId) selectedWindowId = saved.windowId;
    if (typeof saved.metabolicOffsetKcal === 'number') metabolicOffsetKcal = saved.metabolicOffsetKcal;
    if (typeof saved.dailyExerciseKcal === 'number') dailyExerciseKcal = saved.dailyExerciseKcal;
  } catch {
    // ignore
  }
}

function updateLiveBmiBadge() {
  const h = parseFloat(els.inputHeight.value) || 162;
  const w = parseFloat(els.inputWeight.value) || 64;
  const bmi = calculateBmi(w, h);
  const cat = getBmiCategory(bmi);
  els.liveBmiBadge.textContent = `目前 BMI ${bmi} (${cat.label})`;
  els.liveBmiBadge.style.color = cat.color;
}

function updateDurationLabels() {
  const weeks = parseInt(els.durationSlider.value, 10) || 8;
  const days = weeks * 7;
  const months = (weeks / 4).toFixed(1).replace(/\.0$/, '');
  els.durationWeeksBadge.textContent = `${weeks} 週`;
  els.durationLabelText.textContent = `${weeks} 週（共 ${days} 天 ／ 約 ${months} 個月）`;

  const now = new Date();
  const end = new Date(now.getTime() + days * 24 * 3600 * 1000);
  els.durationDateRange.textContent = `${formatDateShort(now)} ~ ${formatDateShort(end)}`;

  document.querySelectorAll('.duration-chip').forEach((chip) => {
    chip.classList.toggle('active', parseInt(chip.dataset.weeks, 10) === weeks);
  });
}

function renderMethodCards() {
  if (!dietData?.methods) return;
  els.methodCardsGrid.innerHTML = '';

  dietData.methods.forEach((m) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `method-card ${m.id === selectedMethodId ? 'active' : ''}`;
    btn.innerHTML = `
      <span class="method-card-badge">${m.badge}</span>
      <div class="method-card-name">${m.shortName}</div>
      <div class="method-card-meta">空腹 ${m.fastingHours}h · 每日 ${m.mealsPerDay} 餐</div>
    `;
    btn.addEventListener('click', () => {
      selectedMethodId = m.id;
      renderMethodCards();
      renderMethodDetail();
      runCalculation(false);
    });
    els.methodCardsGrid.appendChild(btn);
  });
}

function renderMethodDetail() {
  const m = getCurrentMethod();
  if (!m) return;

  els.methodDetailTitle.textContent = m.name;
  els.methodDetailBadge.textContent = m.badge;
  els.methodDetailSummary.textContent = m.summary;

  els.selectEatingWindow.innerHTML = '';
  (m.windows || []).forEach((w) => {
    const opt = document.createElement('option');
    opt.value = w.id;
    opt.textContent = w.label;
    if (w.id === selectedWindowId) opt.selected = true;
    els.selectEatingWindow.appendChild(opt);
  });
  selectedWindowId = els.selectEatingWindow.value;

  els.methodTipsList.innerHTML = (m.tips || [])
    .map((tip) => `<li>${tip}</li>`)
    .join('');
}

function renderTimeline(method, windowObj) {
  els.timelineBar.innerHTML = '';
  const startH = windowObj?.start ?? 12;
  const endH = windowObj?.end ?? 20;
  const currentHour = new Date().getHours();
  let isCurrentlyEating = false;

  for (let h = 0; h < 24; h++) {
    const isEating = h >= startH && h < endH;
    if (h === currentHour) isCurrentlyEating = isEating;

    const cell = document.createElement('div');
    cell.className = `timeline-hour ${isEating ? 'eating' : 'fasting'} ${h === currentHour ? 'now' : ''}`;
    cell.title = `${String(h).padStart(2, '0')}:00 - ${isEating ? '🍽️ 進食窗口' : '💧 空腹燃脂期'}`;
    if (h % 3 === 0) {
      cell.textContent = h;
    }
    els.timelineBar.appendChild(cell);
  }

  els.resWindowDesc.textContent = `${method.name}（${windowObj?.label || ''}）— 綠色為可進食時段，藍色為空腹燃脂時段（可喝水、無糖茶、黑咖啡），紅框為現在時間 (${currentHour}:00)。`;
  els.fastingLiveStatus.textContent = isCurrentlyEating
    ? '🍽️ 現在是進食時段'
    : '🔥 現在是空腹燃脂時段';
}

function renderWeightSvgChart(milestones, targetWeightKg) {
  if (!milestones || milestones.length < 2) return;
  const width = 660;
  const height = 210;
  const padL = 44;
  const padR = 24;
  const padT = 24;
  const padB = 34;

  const weights = milestones.map((m) => m.weight);
  if (targetWeightKg) weights.push(targetWeightKg);
  const maxW = Math.ceil(Math.max(...weights) + 1);
  const minW = Math.floor(Math.min(...weights) - 1);
  const rangeW = Math.max(2, maxW - minW);

  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const points = milestones.map((m, i) => {
    const x = padL + (i / (milestones.length - 1)) * plotW;
    const y = padT + ((maxW - m.weight) / rangeW) * plotH;
    return { x, y, ...m };
  });

  const polylinePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPoints = `${points[0].x.toFixed(1)},${padT + plotH} ${polylinePoints} ${points[points.length - 1].x.toFixed(1)},${padT + plotH}`;

  let targetLineSvg = '';
  if (targetWeightKg && targetWeightKg >= minW && targetWeightKg <= maxW) {
    const ty = padT + ((maxW - targetWeightKg) / rangeW) * plotH;
    targetLineSvg = `
      <line x1="${padL}" y1="${ty.toFixed(1)}" x2="${width - padR}" y2="${ty.toFixed(1)}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5,4" />
      <text x="${width - padR - 4}" y="${(ty - 5).toFixed(1)}" text-anchor="end" fill="#d97706" font-size="11" font-weight="bold">目標 ${targetWeightKg}kg</text>
    `;
  }

  // 取最多 7 個標籤點避免擁擠
  const step = Math.max(1, Math.ceil((points.length - 1) / 6));
  const dotsSvg = points
    .filter((_, idx) => idx === 0 || idx === points.length - 1 || idx % step === 0)
    .map(
      (p) => `
      <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5" fill="#059669" stroke="#ffffff" stroke-width="2" />
      <text x="${p.x.toFixed(1)}" y="${(p.y - 9).toFixed(1)}" text-anchor="middle" fill="#065f46" font-size="11" font-weight="bold">${p.weight}kg</text>
      <text x="${p.x.toFixed(1)}" y="${height - 10}" text-anchor="middle" fill="#64748b" font-size="11">第${p.week}週</text>
    `
    )
    .join('');

  els.weightChartContainer.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="auto" role="img" aria-label="體重下降預測趨勢圖">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#10b981" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="#10b981" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="#cbd5e1" stroke-width="1"/>
      <line x1="${padL}" y1="${padT + plotH}" x2="${width - padR}" y2="${padT + plotH}" stroke="#cbd5e1" stroke-width="1"/>
      ${targetLineSvg}
      <polygon points="${areaPoints}" fill="url(#chartGrad)" />
      <polyline fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${polylinePoints}" />
      ${dotsSvg}
    </svg>
  `;
}

function runCalculation(navigateToResult = false) {
  if (!dietData) return;
  const profile = readProfileFromInputs();
  saveProfileToStorage(profile);

  const method = getCurrentMethod();
  const windowObj = (method.windows || []).find((w) => w.id === profile.windowId) || method.windows?.[0];
  const calc = calculateWeightPlan(profile, method, profile.durationWeeks, profile.intensity);
  lastCalculation = { profile, method, windowObj, calc };

  // 更新結果畫面
  els.resMethodPill.textContent = `${method.name} · 預定施行 ${profile.durationWeeks} 週`;
  els.resWeightLoss.textContent = `-${calc.totalWeightLoss} kg`;
  els.resWeightChangeText.textContent = `${calc.startWeight} kg ➔ ${calc.finalWeight} kg`;

  const startCat = getBmiCategory(calc.startBmi);
  const endCat = getBmiCategory(calc.endBmi);
  els.resBmiChange.textContent = `${calc.startBmi} (${startCat.label}) ➔ ${calc.endBmi} (${endCat.label})`;
  els.resWaistChange.textContent = `約 -${calc.waistLossCm} cm`;

  if (profile.targetWeightKg && profile.targetWeightKg < profile.weightKg) {
    if (calc.finalWeight <= profile.targetWeightKg) {
      els.resGoalEta.textContent = `🎉 預計於期程內達成 ${profile.targetWeightKg} kg！`;
    } else {
      els.resGoalEta.textContent = `約需 ${calc.weeksToGoal} 週達標 (${profile.targetWeightKg} kg)`;
    }
  } else {
    els.resGoalEta.textContent = `預計減去 ${(calc.totalWeightLoss / profile.weightKg * 100).toFixed(1)}% 體重`;
  }

  els.resBmr.textContent = calc.bmr.toLocaleString();
  els.resTdee.textContent = calc.tdee.toLocaleString();
  els.resTargetKcal.textContent = calc.targetCalories.toLocaleString();
  els.resDeficitTag.textContent = `每日赤字 -${calc.actualDailyDeficit} kcal`;
  els.resWater.textContent = calc.dailyWaterMl.toLocaleString();
  els.resWaterCups.textContent = `ml / 日 (約 ${Math.round(calc.dailyWaterMl / 300)} 杯 300ml)`;

  if (calc.hitSafetyFloor) {
    els.resSafetyNotice.classList.remove('hidden');
    els.resSafetyNotice.innerHTML = `🛡️ <strong>安全代謝保護機制已啟動</strong>：為避免基礎代謝受損、掉髮或肌肉流失，系統已將您的每日最低建議熱量鎖定在安全底線 <strong>${calc.minSafeCalories} kcal</strong>（不低於基礎代謝 BMR 的 92%），搭配 ${method.shortName} 的胰島素調控與日常活動依然能穩定減脂！`;
  } else {
    els.resSafetyNotice.classList.add('hidden');
  }

  if (els.resCalibrationNotice) {
    if (calc.metabolicOffsetKcal !== 0 || calc.dailyExerciseKcal > 0) {
      els.resCalibrationNotice.classList.remove('hidden');
      const offsetStr =
        calc.metabolicOffsetKcal > 0
          ? `+${calc.metabolicOffsetKcal} kcal/日`
          : `${calc.metabolicOffsetKcal} kcal/日`;
      const exStr =
        calc.dailyExerciseKcal > 0
          ? ` · 運動消耗加成 <strong>+${calc.dailyExerciseKcal} kcal/日</strong>`
          : '';
      els.resCalibrationNotice.innerHTML = `🧠 <strong>已套用實測代謝動態校正 (Adaptive TDEE)</strong>：理論公式 TDEE 為 <strong>${calc.formulaTdee} kcal</strong>，經實測代謝修正 (<strong>${offsetStr}</strong>)${exStr} 後，目前每日總消耗 TDEE 為 <strong>${calc.tdee} kcal</strong>，每日建議攝取已精準校正為 <strong>${calc.targetCalories} kcal</strong>。`;
    } else {
      els.resCalibrationNotice.classList.add('hidden');
    }
  }

  renderTimeline(method, windowObj);

  // Macros
  const { macros } = calc;
  els.resMacroRatioText.textContent = `P ${macros.proteinPct}% / C ${macros.carbsPct}% / F ${macros.fatPct}%`;
  els.resMacroP.textContent = `${macros.proteinGrams} g (${macros.proteinKcal} kcal)`;
  els.resMacroC.textContent = `${macros.carbsGrams} g (${macros.carbsKcal} kcal)`;
  els.resMacroF.textContent = `${macros.fatGrams} g (${macros.fatKcal} kcal)`;
  els.barMacroP.style.width = `${macros.proteinPct}%`;
  els.barMacroC.style.width = `${macros.carbsPct}%`;
  els.barMacroF.style.width = `${macros.fatPct}%`;

  // Chart & table
  renderWeightSvgChart(calc.milestones, profile.targetWeightKg);
  els.milestoneTbody.innerHTML = calc.milestones
    .map(
      (m) => `
      <tr>
        <td><strong>${m.week === 0 ? '起點' : `第 ${m.week} 週`}</strong></td>
        <td>${m.dateStr}</td>
        <td><strong>${m.weight} kg</strong></td>
        <td style="color:#059669;font-weight:700">${m.totalLost === 0 ? '—' : `-${m.totalLost} kg`}</td>
        <td>${m.bmi}</td>
      </tr>
    `
    )
    .join('');

  // 更新套餐頁面資訊、今日打卡看板與代謝校正預覽
  renderMealPlans();
  updateCustomMealSummary();
  renderTodayCheckinDashboard();
  updateCalibrationPreview();

  if (navigateToResult) {
    switchTab('result');
  }
}

function getFilteredMealPlans() {
  if (!dietData?.mealPlans) return [];
  const methodId = selectedMethodId;
  return dietData.mealPlans.filter((plan) => {
    if (selectedCategory === 'recommended') {
      return plan.suitableMethods.includes(methodId);
    }
    if (selectedCategory === 'all') return true;
    return plan.category === selectedCategory;
  });
}

function renderMealPlans() {
  if (!dietData || !lastCalculation) return;
  const { calc, method } = lastCalculation;

  els.mealTargetSummary.innerHTML = `依據您的每日目標攝取 <strong>${calc.targetCalories} kcal</strong>（蛋白質 <strong>${calc.macros.proteinGrams}g</strong>）與 <strong>${method.name}</strong>，為您推薦以下一日套餐：`;

  const plans = getFilteredMealPlans();
  els.mealPlansList.innerHTML = '';

  if (plans.length === 0) {
    els.mealPlansList.innerHTML = `<div class="card"><p class="pool-text">此分類暫無對應套餐，請點選「全部套餐」查看。</p></div>`;
    return;
  }

  plans.forEach((plan) => {
    const card = document.createElement('div');
    const isHighlighted = plan.id === highlightedPlanId;
    card.className = `meal-plan-card ${isHighlighted ? 'highlighted-plan' : ''}`;
    const adviceHtml = getPortionAdjustmentAdvice(plan, calc.targetCalories, method.id);

    const tagsHtml = (plan.tags || [])
      .map((t) => `<span class="plan-tag">${t}</span>`)
      .join('');

    const mealsHtml = (plan.meals || [])
      .map(
        (m, mIdx) => `
        <div class="meal-slot-box">
          <div class="meal-slot-header">
            <span class="meal-slot-time">${m.slot}</span>
            <span class="meal-slot-kcal">🔥 ${m.calories} kcal · P:${m.protein}g / C:${m.carbs}g / F:${m.fat}g</span>
          </div>
          <div class="meal-slot-title" style="display:flex;justify-content:space-between;align-items:center;gap:8px">
            <span>${m.title}</span>
            <button type="button" class="btn-ghost btn-log-single-meal" data-meal-idx="${mIdx}" style="font-size:0.76rem;color:#059669">➕ 單餐打卡</button>
          </div>
          <ul class="meal-items-ul">
            ${m.items.map((item) => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `
      )
      .join('');

    card.innerHTML = `
      <div class="plan-top-row">
        <div>
          <h3 class="plan-title">${plan.name}</h3>
          <div class="plan-tags">${tagsHtml}</div>
        </div>
        <div class="plan-kcal-badge">
          <span class="plan-kcal-num">基準 ${plan.baseCalories} kcal</span>
          <span class="plan-macro-sub">P:${plan.macros.protein}g · C:${plan.macros.carbs}g · F:${plan.macros.fat}g</span>
        </div>
      </div>

      <div class="portion-advice-banner">${adviceHtml}</div>

      <div class="meals-timeline">${mealsHtml}</div>

      <div class="plan-actions-row">
        <button type="button" class="btn-secondary btn-open-shopping" data-plan-id="${plan.id}">
          🛒 採買與外食準備清單
        </button>
        <button type="button" class="btn-primary btn-apply-log" data-plan-name="${plan.name}">
          ✅ 選用此套餐打卡
        </button>
      </div>
    `;

    card.querySelector('.btn-open-shopping')?.addEventListener('click', () => {
      openShoppingModal(plan);
    });

    card.querySelectorAll('.btn-log-single-meal').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.mealIdx, 10);
        const m = plan.meals?.[idx];
        if (!m) return;
        addMealToTodayCheckin({
          name: `🍽️ ${m.title}`,
          kcal: m.calories,
          p: m.protein,
          c: m.carbs,
          f: m.fat
        });
        switchTab('tracker');
      });
    });

    card.querySelector('.btn-apply-log')?.addEventListener('click', () => {
      addMealToTodayCheckin({
        name: `🍱 【${method.shortName}】${plan.name}`,
        kcal: plan.baseCalories,
        p: plan.macros.protein,
        c: plan.macros.carbs,
        f: plan.macros.fat
      });
      switchTab('tracker');
    });

    els.mealPlansList.appendChild(card);
  });
}

function openShoppingModal(plan) {
  els.modalPlanTitle.textContent = `🛒 ${plan.name} — 準備清單`;
  const items = plan.shoppingList || [];
  els.modalShoppingList.innerHTML = items
    .map(
      (item) => `
      <li>
        <label>
          <input type="checkbox" />
          <span>${item}</span>
        </label>
      </li>
    `
    )
    .join('');

  currentModalShoppingText = `【${plan.name} 採買清單】\n` + items.map((i) => `☐ ${i}`).join('\n');
  els.shoppingModal.classList.remove('hidden');
}

function initCustomMealBuilder() {
  const foods = dietData?.customFoods;
  if (!foods) return;

  const renderGroup = (container, list) => {
    container.innerHTML = '';
    (list || []).forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'food-add-btn';
      btn.innerHTML = `
        <strong>+ ${item.name}</strong>
        <small>${item.kcal} kcal · P:${item.p}g C:${item.c}g F:${item.f}g</small>
      `;
      btn.addEventListener('click', () => {
        customTray.push({ ...item });
        updateCustomMealSummary();
      });
      container.appendChild(btn);
    });
  };

  renderGroup(els.customProteinsList, foods.proteins);
  renderGroup(els.customCarbsList, foods.carbs);
  renderGroup(els.customVeggiesList, foods.veggiesAndFats);
}

function updateCustomMealSummary() {
  const totals = customTray.reduce(
    (acc, item) => {
      acc.kcal += item.kcal;
      acc.p += item.p;
      acc.c += item.c;
      acc.f += item.f;
      return acc;
    },
    { kcal: 0, p: 0, c: 0, f: 0 }
  );

  const targetKcal = lastCalculation?.calc?.targetCalories || 1400;
  els.customTotalKcal.textContent = Math.round(totals.kcal);
  els.customTargetCompare.textContent = ` / 目標 ${targetKcal} kcal (${Math.round((totals.kcal / targetKcal) * 100)}%)`;
  els.customTotalP.textContent = `蛋白質 ${totals.p.toFixed(0)}g`;
  els.customTotalC.textContent = `碳水 ${totals.c.toFixed(0)}g`;
  els.customTotalF.textContent = `脂肪 ${totals.f.toFixed(0)}g`;

  if (customTray.length === 0) {
    els.customSelectedTray.classList.add('hidden');
  } else {
    els.customSelectedTray.classList.remove('hidden');
    els.customTrayItems.innerHTML = '';
    customTray.forEach((item, idx) => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'tray-pill';
      pill.textContent = `${item.name} (${item.kcal}kcal) ✕`;
      pill.addEventListener('click', () => {
        customTray.splice(idx, 1);
        updateCustomMealSummary();
      });
      els.customTrayItems.appendChild(pill);
    });
  }
}

/* ==================== 📸 AI 拍照算卡路里與外食分析（支援多張連拍與多選） ==================== */
function stopLiveCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }
  if (els.aiCameraVideo) {
    els.aiCameraVideo.srcObject = null;
  }
  els.aiCameraLiveWrap?.classList.add('hidden');
}

function renderAiImagesPreview() {
  if (!els.aiImagePreviewWrap || !els.aiImagesGrid) return;

  const count = currentAiImages.length;
  if (els.aiSnapBtn) {
    els.aiSnapBtn.textContent = count > 0 ? `📸 再拍一張 (已拍 ${count} 張)` : '📸 拍照加入';
  }

  if (count === 0) {
    els.aiImagePreviewWrap.classList.add('hidden');
    els.aiImagesGrid.innerHTML = '';
    return;
  }

  els.aiImagePreviewWrap.classList.remove('hidden');
  if (els.aiImageCountBadge) {
    els.aiImageCountBadge.textContent = `已選擇 ${count} 張餐點照片（可繼續拍照或選照片疊加）`;
  }

  els.aiImagesGrid.innerHTML = '';
  currentAiImages.forEach((imgObj, idx) => {
    const card = document.createElement('div');
    card.className = 'ai-thumb-card';
    card.innerHTML = `
      <img src="${imgObj.dataUrl}" alt="餐點照片 ${idx + 1}" />
      <span class="ai-thumb-index">#${idx + 1}</span>
      <button type="button" class="ai-thumb-remove-btn" title="移除這張照片" data-rm-img="${idx}">✕</button>
    `;
    card.querySelector('[data-rm-img]')?.addEventListener('click', () => {
      currentAiImages.splice(idx, 1);
      renderAiImagesPreview();
    });
    els.aiImagesGrid.appendChild(card);
  });
}

async function openLiveCamera() {
  els.aiErrorBox?.classList.add('hidden');
  stopLiveCamera();

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    els.aiCameraInput?.click();
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: cameraFacingMode },
        width: { ideal: 1280 },
        height: { ideal: 960 }
      },
      audio: false
    });
    if (els.aiCameraVideo) {
      els.aiCameraVideo.srcObject = cameraStream;
      await els.aiCameraVideo.play().catch(() => {});
    }
    renderAiImagesPreview();
    els.aiCameraLiveWrap?.classList.remove('hidden');
  } catch (err) {
    // 若使用者裝置不支援或拒絕權限，退回原生相機 input
    els.aiCameraInput?.click();
  }
}

async function switchLiveCamera() {
  cameraFacingMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
  await openLiveCamera();
}

function snapLiveCameraPhoto() {
  if (!els.aiCameraVideo || !cameraStream) return;
  const captured = captureVideoFrame(els.aiCameraVideo);
  currentAiImages.push({
    id: `cam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...captured
  });
  renderAiImagesPreview();
}

async function handleAiImagesSelect(fileList) {
  const files = Array.from(fileList || []).filter((f) => f && f.type.startsWith('image/'));
  if (files.length === 0) return;
  stopLiveCamera();
  els.aiErrorBox?.classList.add('hidden');
  try {
    const compressedList = await Promise.all(files.map((file) => compressImageFile(file)));
    compressedList.forEach((compressed) => {
      currentAiImages.push({
        id: `gal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...compressed
      });
    });
    renderAiImagesPreview();
  } catch (err) {
    if (els.aiErrorBox) {
      els.aiErrorBox.textContent = `⚠️ 讀取照片失敗：${err.message}`;
      els.aiErrorBox.classList.remove('hidden');
    }
  }
}

function renderAiAnalysisResult(analysis) {
  if (!analysis) return;
  lastAiAnalysis = analysis;

  const targetKcal = lastCalculation?.calc?.targetCalories || 1400;
  const pct = Math.round((analysis.totalCalories / targetKcal) * 100);

  els.aiResFit.textContent = analysis.fitScore || '🟡 需微調份量';
  els.aiResTitle.textContent = analysis.mealName;
  els.aiResKcal.textContent = `約 ${analysis.totalCalories} kcal`;
  els.aiResPct.textContent = `佔今日目標 (${targetKcal} kcal) 的 ${pct}%`;
  els.aiResP.textContent = `${analysis.proteinGrams} g`;
  els.aiResC.textContent = `${analysis.carbsGrams} g`;
  els.aiResF.textContent = `${analysis.fatGrams} g`;

  els.aiResItems.innerHTML = (analysis.items || [])
    .map(
      (item) => `
      <div class="ai-item-row">
        <div>
          <strong>${item.name}</strong>
          <span class="pool-text">（${item.portion}）</span>
        </div>
        <div style="text-align:right;white-space:nowrap">
          <strong style="color:#059669">${item.calories} kcal</strong>
          <div class="pool-text" style="font-size:0.74rem">P:${item.p}g C:${item.c}g F:${item.f}g</div>
        </div>
      </div>
    `
    )
    .join('');

  els.aiResCoachTip.textContent = analysis.coachTip || '細嚼慢嚥，先吃蔬菜與蛋白質再吃澱粉。';
  els.aiResNextMeal.textContent = analysis.nextMealAdvice || '下一餐請以低脂高蛋白與蔬菜為主。';
  els.aiResultPanel?.classList.remove('hidden');
}

function renderAiHistoryList() {
  if (!els.aiHistoryList) return;
  const list = loadAiFoodHistory();
  if (list.length === 0) {
    els.aiHistoryList.innerHTML = `<span class="pool-text">尚無外食分析紀錄。</span>`;
    return;
  }

  els.aiHistoryList.innerHTML = '';
  list.forEach((entry) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ai-history-btn';
    btn.innerHTML = `
      <div>
        <strong>${entry.mealName}</strong>
        <span class="pool-text" style="margin-left:6px">${entry.timestamp}</span>
      </div>
      <strong style="color:#059669">${entry.totalCalories} kcal (P:${entry.proteinGrams}g)</strong>
    `;
    btn.addEventListener('click', () => {
      renderAiAnalysisResult(entry);
      els.aiResultPanel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    els.aiHistoryList.appendChild(btn);
  });
}

async function runAiFoodAnalysis() {
  stopLiveCamera();
  const userNote = els.aiFoodNote?.value.trim() || '';
  if (currentAiImages.length === 0 && !userNote) {
    if (els.aiErrorBox) {
      els.aiErrorBox.textContent = '📸 請先「開啟相機拍照／選取餐點照片（可多張）」，或在文字框輸入外食菜色！';
      els.aiErrorBox.classList.remove('hidden');
    }
    return;
  }

  els.aiErrorBox?.classList.add('hidden');
  els.aiLoadingBox?.classList.remove('hidden');
  if (els.aiAnalyzeBtn) els.aiAnalyzeBtn.disabled = true;

  try {
    const method = getCurrentMethod();
    const targetCalories = lastCalculation?.calc?.targetCalories || 1400;
    const proteinGrams = lastCalculation?.calc?.macros?.proteinGrams || 105;

    const { result } = await analyzeFoodWithAi({
      images: currentAiImages,
      userNote,
      dietContext: {
        methodName: method?.name || '168 間歇性斷食',
        targetCalories,
        proteinGrams
      }
    });

    renderAiAnalysisResult(result);
    saveAiFoodHistoryItem(result);
    renderAiHistoryList();
  } catch (err) {
    if (els.aiErrorBox) {
      els.aiErrorBox.textContent = `⚠️ AI 分析失敗：${err.message}`;
      els.aiErrorBox.classList.remove('hidden');
    }
  } finally {
    els.aiLoadingBox?.classList.add('hidden');
    if (els.aiAnalyzeBtn) els.aiAnalyzeBtn.disabled = false;
  }
}

/* ==================== 畫面 4：今日打卡（熱量結算、已吃/剩餘/運動、今日體重與昨日比較） ==================== */
function getTodayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCurrentCheckinDate() {
  return els.logDate?.value || getTodayIso();
}

function loadTodayMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TODAY_MAP);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTodayMap(map) {
  try {
    localStorage.setItem(STORAGE_KEYS.TODAY_MAP, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function getCheckinEntryForDate(dateStr) {
  const map = loadTodayMap();
  if (!map[dateStr]) {
    map[dateStr] = {
      date: dateStr,
      weight: null,
      exerciseKcal: 0,
      status: '✅ 完美達標',
      note: '',
      meals: []
    };
  }
  return map[dateStr];
}

function saveCheckinEntryForDate(dateStr, entry) {
  const map = loadTodayMap();
  map[dateStr] = entry;
  saveTodayMap(map);
}

function addMealToTodayCheckin({ name, kcal, p = 0, c = 0, f = 0 }) {
  const dateStr = getCurrentCheckinDate();
  const entry = getCheckinEntryForDate(dateStr);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  entry.meals.push({
    id: `meal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    kcal: Math.round(Number(kcal) || 0),
    p: Math.round(Number(p) || 0),
    c: Math.round(Number(c) || 0),
    f: Math.round(Number(f) || 0),
    time: timeStr
  });

  saveCheckinEntryForDate(dateStr, entry);
  syncCheckinDateToHistoryLogs(dateStr, false);
  renderTodayCheckinDashboard();
  renderTrackerLogs();
}

function getPreviousWeightBaseline(currentDateStr) {
  const logs = loadLogs();
  // 尋找日期早於目前打卡日的第一筆歷史紀錄（若同一天有多筆則跳過今天）
  const prevLog = logs.find((item) => item.date < currentDateStr && item.weight);
  if (prevLog) {
    return { weight: Number(prevLog.weight), label: `昨日／前次 (${prevLog.date})` };
  }
  const otherLog = logs.find((item) => item.date !== currentDateStr && item.weight);
  if (otherLog) {
    return { weight: Number(otherLog.weight), label: `前次紀錄 (${otherLog.date})` };
  }
  const initW = parseFloat(els.inputWeight?.value) || 64.0;
  return { weight: initW, label: '初始設定體重' };
}

function updateWeightComparisonUI() {
  if (!els.comparePrevWeight) return;
  const dateStr = getCurrentCheckinDate();
  const prev = getPreviousWeightBaseline(dateStr);
  const rawCurr = parseFloat(els.logWeight?.value);
  const currW = !isNaN(rawCurr) && rawCurr >= 30 ? rawCurr : prev.weight;
  const diff = +(currW - prev.weight).toFixed(1);

  if (els.comparePrevLabel) els.comparePrevLabel.textContent = prev.label;
  els.comparePrevWeight.textContent = `${prev.weight.toFixed(1)} kg`;
  els.compareCurrWeight.textContent = `${currW.toFixed(1)} kg`;

  if (diff < 0) {
    els.compareDiffVal.textContent = `📉 ${diff.toFixed(1)} kg (比昨日下降！)`;
    els.compareDiffVal.style.color = '#059669';
    if (els.weightCompareBadge) {
      els.weightCompareBadge.textContent = `📉 比前次瘦 ${Math.abs(diff).toFixed(1)} kg`;
      els.weightCompareBadge.style.color = '#059669';
    }
  } else if (diff > 0) {
    els.compareDiffVal.textContent = `📈 +${diff.toFixed(1)} kg (比昨日微升)`;
    els.compareDiffVal.style.color = '#d97706';
    if (els.weightCompareBadge) {
      els.weightCompareBadge.textContent = `📈 比前次 +${diff.toFixed(1)} kg`;
      els.weightCompareBadge.style.color = '#d97706';
    }
  } else {
    els.compareDiffVal.textContent = '➖ 持平 0.0 kg';
    els.compareDiffVal.style.color = '#475569';
    if (els.weightCompareBadge) {
      els.weightCompareBadge.textContent = '⚖️ 與前次持平';
      els.weightCompareBadge.style.color = '#475569';
    }
  }
}

function renderTodayCheckinDashboard() {
  if (!els.todayEatenKcal) return;
  const dateStr = getCurrentCheckinDate();
  const entry = getCheckinEntryForDate(dateStr);

  const targetKcal = lastCalculation?.calc?.targetCalories || 1380;
  const exerciseKcal = Math.max(0, Number(entry.exerciseKcal) || 0);
  const totals = (entry.meals || []).reduce(
    (acc, m) => {
      acc.kcal += Number(m.kcal) || 0;
      acc.p += Number(m.p) || 0;
      acc.c += Number(m.c) || 0;
      acc.f += Number(m.f) || 0;
      return acc;
    },
    { kcal: 0, p: 0, c: 0, f: 0 }
  );

  const eatenKcal = Math.round(totals.kcal);
  const totalBudget = targetKcal + exerciseKcal;
  const remainingKcal = totalBudget - eatenKcal;

  els.todayEatenKcal.textContent = eatenKcal.toLocaleString();
  els.todayExerciseKcal.textContent = `+${exerciseKcal.toLocaleString()}`;
  els.todayTargetKcal.textContent = targetKcal.toLocaleString();

  if (remainingKcal >= 0) {
    els.todayRemainingKcal.textContent = remainingKcal.toLocaleString();
    els.todayRemainingKcal.classList.add('highlight');
    els.todayRemainingKcal.classList.remove('over-limit');
    if (els.todayRemainingSub) els.todayRemainingSub.textContent = 'kcal (今日還可攝取)';
    if (els.todayKcalStatus) {
      els.todayKcalStatus.textContent =
        eatenKcal === 0 ? '🍽️ 尚未記錄今日飲食' : `🟢 還可攝取 ${remainingKcal} kcal`;
      els.todayKcalStatus.style.color = '#047857';
    }
  } else {
    els.todayRemainingKcal.textContent = `超標 ${Math.abs(remainingKcal).toLocaleString()}`;
    els.todayRemainingKcal.classList.remove('highlight');
    els.todayRemainingKcal.classList.add('over-limit');
    if (els.todayRemainingSub) els.todayRemainingSub.textContent = 'kcal (建議多走動消耗)';
    if (els.todayKcalStatus) {
      els.todayKcalStatus.textContent = `🔴 已超標 ${Math.abs(remainingKcal)} kcal`;
      els.todayKcalStatus.style.color = '#dc2626';
    }
  }

  const pct = totalBudget > 0 ? Math.min(100, Math.round((eatenKcal / totalBudget) * 100)) : 0;
  if (els.todayMacroSummary) {
    els.todayMacroSummary.textContent = `今日累計營養素：蛋白質 ${Math.round(totals.p)}g · 碳水 ${Math.round(totals.c)}g · 脂肪 ${Math.round(totals.f)}g`;
  }
  if (els.todayProgressPct) {
    els.todayProgressPct.textContent = `已吃 ${eatenKcal} / 可吃配額 ${totalBudget} kcal (${pct}%)`;
  }
  if (els.todayKcalBar) {
    els.todayKcalBar.style.width = `${pct}%`;
    els.todayKcalBar.style.background = remainingKcal >= 0 ? '#10b981' : '#ef4444';
  }

  // 同步運動輸入框與體重欄位
  if (els.logExercise && document.activeElement !== els.logExercise) {
    els.logExercise.value = String(exerciseKcal);
  }
  if (els.logWeight && document.activeElement !== els.logWeight) {
    if (entry.weight) {
      els.logWeight.value = entry.weight;
    } else if (!els.logWeight.value) {
      els.logWeight.value = els.inputWeight?.value || '64.0';
    }
  }
  if (els.logStatus && entry.status) els.logStatus.value = entry.status;
  if (els.logNote && document.activeElement !== els.logNote) {
    els.logNote.value = entry.note || '';
  }

  updateWeightComparisonUI();

  // 渲染今日已打卡飲食明細
  if (els.todayMealsList) {
    if (!entry.meals || entry.meals.length === 0) {
      els.todayMealsList.innerHTML = `<div class="pool-text" style="padding:10px 4px">今日尚無飲食打卡。您可以到「3. 飲食套餐」拍餐點照片或點選套餐按「打卡」，或由下方手動補登！</div>`;
    } else {
      els.todayMealsList.innerHTML = '';
      entry.meals.forEach((m, idx) => {
        const row = document.createElement('div');
        row.className = 'today-meal-row';
        row.innerHTML = `
          <div>
            <strong>${m.name}</strong>
            <span class="pool-text" style="margin-left:6px">${m.time || ''}</span>
            <div class="pool-text" style="font-size:0.76rem;margin-top:2px">P:${m.p || 0}g · C:${m.c || 0}g · F:${m.f || 0}g</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;white-space:nowrap">
            <strong style="color:#059669">${m.kcal} kcal</strong>
            <button type="button" class="btn-ghost" data-del-meal="${idx}" style="padding:4px 8px;font-size:0.78rem">移除</button>
          </div>
        `;
        row.querySelector('[data-del-meal]')?.addEventListener('click', () => {
          entry.meals.splice(idx, 1);
          saveCheckinEntryForDate(dateStr, entry);
          syncCheckinDateToHistoryLogs(dateStr, false);
          renderTodayCheckinDashboard();
          renderTrackerLogs();
        });
        els.todayMealsList.appendChild(row);
      });
    }
  }
}

/* ==================== 畫面 5：歷史打卡紀錄與實測代謝能力動態校正 ==================== */
function loadLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLogs(logs) {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch {
    // ignore
  }
}

function syncCheckinDateToHistoryLogs(dateStr, requireValidWeight = false) {
  const entry = getCheckinEntryForDate(dateStr);
  const rawWeight = parseFloat(els.logWeight?.value || entry.weight || els.inputWeight?.value);
  if (requireValidWeight && (isNaN(rawWeight) || rawWeight < 30 || rawWeight > 250)) {
    alert('請輸入有效的今日體重數值 (kg)');
    return false;
  }

  const weight = !isNaN(rawWeight) && rawWeight >= 30 ? +rawWeight.toFixed(1) : +(parseFloat(els.inputWeight?.value) || 64.0).toFixed(1);
  const exerciseKcal = Math.max(0, parseInt(els.logExercise?.value ?? entry.exerciseKcal, 10) || 0);
  const status = els.logStatus?.value || entry.status || '✅ 完美達標';
  const note = els.logNote?.value.trim() ?? entry.note ?? '';

  entry.weight = weight;
  entry.exerciseKcal = exerciseKcal;
  entry.status = status;
  entry.note = note;
  saveCheckinEntryForDate(dateStr, entry);

  const eatenKcal = Math.round((entry.meals || []).reduce((s, m) => s + (Number(m.kcal) || 0), 0));
  const targetKcal = lastCalculation?.calc?.targetCalories || 1380;
  const remainingKcal = targetKcal + exerciseKcal - eatenKcal;
  const mealNames = (entry.meals || []).map((m) => `${m.name}(${m.kcal}卡)`).join('、');

  const prev = getPreviousWeightBaseline(dateStr);
  const weightDiff = +(weight - prev.weight).toFixed(1);

  const logs = loadLogs();
  const existingIdx = logs.findIndex((item) => item.date === dateStr);
  const logRecord = {
    date: dateStr,
    weight,
    weightDiff,
    eatenKcal,
    exerciseKcal,
    remainingKcal,
    mealsSummary: mealNames,
    status,
    note
  };

  if (existingIdx >= 0) {
    logs[existingIdx] = logRecord;
  } else {
    logs.unshift(logRecord);
    logs.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }
  saveLogs(logs);
  return true;
}

function renderTrackerLogs() {
  if (!els.trackerLogsList) return;
  const logs = loadLogs();
  els.trackerLogsList.innerHTML = '';

  if (logs.length === 0) {
    els.trackerStatsSummary.innerHTML = `<span class="pool-text">尚無歷史打卡紀錄。請在「4. 今日打卡」記錄您的飲食、運動或今日體重！</span>`;
    return;
  }

  const latest = logs[0];
  const oldest = logs[logs.length - 1];
  const diff = +(latest.weight - oldest.weight).toFixed(1);
  const diffText = diff <= 0 ? `${diff} kg` : `+${diff} kg`;
  const totalExercise = logs.reduce((acc, item) => acc + (Number(item.exerciseKcal) || 0), 0);
  const avgExercise = Math.round(totalExercise / logs.length);

  els.trackerStatsSummary.innerHTML = `
    <span class="status-badge">累計打卡：${logs.length} 天</span>
    <span class="status-badge">最新體重：${latest.weight} kg</span>
    <span class="status-badge">總體重變化：${diffText}</span>
    <span class="status-badge">期間運動消耗：🔥 ${totalExercise} kcal (日均 ${avgExercise} kcal)</span>
  `;

  logs.forEach((item, idx) => {
    const exKcal = Number(item.exerciseKcal) || 0;
    const eatenKcal = Number(item.eatenKcal) || 0;
    const wDiff = typeof item.weightDiff === 'number' ? item.weightDiff : null;
    const wDiffBadge =
      wDiff !== null
        ? `<span class="plan-tag" style="margin-left:6px;background:${wDiff <= 0 ? '#dcfce7' : '#fef3c7'};color:${wDiff <= 0 ? '#166534' : '#92400e'}">${wDiff <= 0 ? `📉 ${wDiff}kg` : `📈 +${wDiff}kg`}</span>`
        : '';

    const row = document.createElement('div');
    row.className = 'tracker-log-item';
    row.innerHTML = `
      <div>
        <div>
          <strong>${item.date}</strong> · <span class="highlight-num">${item.weight} kg</span>
          ${wDiffBadge}
          <span class="plan-tag" style="margin-left:6px">${item.status}</span>
        </div>
        <div style="margin-top:4px;font-size:0.82rem;color:#334155">
          🍽️ 已吃 <strong>${eatenKcal} kcal</strong> · 🏃 運動消耗 <strong>${exKcal} kcal</strong>
          ${typeof item.remainingKcal === 'number' ? ` · ✨ 剩餘配額 <strong>${item.remainingKcal} kcal</strong>` : ''}
        </div>
        ${item.mealsSummary ? `<div class="pool-text" style="margin-top:3px">🍱 飲食明細：${item.mealsSummary}</div>` : ''}
        ${item.note ? `<div class="pool-text" style="margin-top:2px">📝 備註：${item.note}</div>` : ''}
      </div>
      <button type="button" class="btn-ghost" data-del-idx="${idx}">刪除</button>
    `;
    row.querySelector('[data-del-idx]')?.addEventListener('click', () => {
      const updated = loadLogs();
      updated.splice(idx, 1);
      saveLogs(updated);
      renderTrackerLogs();
      updateWeightComparisonUI();
    });
    els.trackerLogsList.appendChild(row);
  });
}

function updateCalibrationPreview() {
  if (!els.calibOldTdee) return;
  const formulaTdee = lastCalculation?.calc?.formulaTdee || 1800;
  const days = Math.max(3, Math.min(90, parseInt(els.calibDays?.value, 10) || 7));
  const avgExerciseKcal = Math.max(0, parseInt(els.calibAvgExercise?.value, 10) || 0);
  const expectedChangeKg = parseFloat(els.calibExpectedKg?.value);
  const actualChangeKg = parseFloat(els.calibActualKg?.value);

  const evalRes = evaluateMetabolicCalibration({
    days,
    expectedChangeKg: isNaN(expectedChangeKg) ? -1.0 : expectedChangeKg,
    actualChangeKg: isNaN(actualChangeKg) ? 0.5 : actualChangeKg,
    avgExerciseKcal,
    formulaTdee
  });

  els.calibOldTdee.textContent = `${formulaTdee} kcal`;
  els.calibNewTdee.textContent = `${evalRes.calibratedTdee} kcal`;
  const offsetSign = evalRes.recommendedOffsetKcal > 0 ? '+' : '';
  els.calibOffsetVal.textContent = `${offsetSign}${evalRes.recommendedOffsetKcal} kcal/日`;
  els.calibOffsetVal.style.color =
    evalRes.recommendedOffsetKcal < 0 ? '#dc2626' : evalRes.recommendedOffsetKcal > 0 ? '#059669' : '#1e293b';

  if (els.calibStatusBadge) {
    if (metabolicOffsetKcal !== 0 || dailyExerciseKcal > 0) {
      const curSign = metabolicOffsetKcal > 0 ? '+' : '';
      els.calibStatusBadge.textContent = `已校正 (${curSign}${metabolicOffsetKcal} kcal)`;
      els.calibStatusBadge.style.color = '#6d28d9';
    } else {
      els.calibStatusBadge.textContent = '目前使用標準公式';
      els.calibStatusBadge.style.color = '';
    }
  }

  let diagHtml = '';
  if (evalRes.weightGapKg > 0.2) {
    diagHtml = `💡 <strong>代謝能力診斷報告</strong>：您在 ${days} 天內的實際體重比原預期高出 <strong>+${evalRes.weightGapKg} kg</strong>（加上日均運動消耗 <strong>${avgExerciseKcal} kcal</strong> 後，推算真實每日熱量落差達 <strong>${evalRes.rawDailyGapKcal} kcal</strong>）。<br/>這代表原公式高估了您的基礎代謝，或短期內有外食隱藏油脂與鈉水滯留（已自動濾除短期水分干擾係數 ${Math.round(evalRes.dampingFactor * 100)}%）。系統建議將您的基礎代謝能力下修 <strong>${evalRes.recommendedOffsetKcal} kcal/日</strong>（校正後真實 TDEE 為 <strong>${evalRes.calibratedTdee} kcal</strong>），點擊下方按鈕即可重新精算每日目標熱量與後續減重曲線！`;
  } else if (evalRes.weightGapKg < -0.2) {
    diagHtml = `🔥 <strong>代謝能力診斷報告</strong>：太棒了！您在 ${days} 天內的減重進度比預期多減了 <strong>${Math.abs(evalRes.weightGapKg)} kg</strong>！這顯示您的真實代謝能力與日常活動消耗比公式預估更高。系統建議將您的代謝能力上調 <strong>+${evalRes.recommendedOffsetKcal} kcal/日</strong>（校正後真實 TDEE 為 <strong>${evalRes.calibratedTdee} kcal</strong>），讓飲食更有彈性且不易復胖！`;
  } else {
    diagHtml = `✅ <strong>代謝能力診斷報告</strong>：您的實際體重變化與理論公式預測非常吻合（誤差僅 ${evalRes.weightGapKg} kg），代表目前的代謝計算非常精準！若您有固定運動習慣（日均 ${avgExerciseKcal} kcal），也可點擊下方套用將運動消耗納入每日熱量配額。`;
  }
  if (els.calibDiagnosisText) {
    els.calibDiagnosisText.innerHTML = diagHtml;
  }

  return evalRes;
}

function autofillCalibrationFromLogs() {
  const logs = loadLogs();
  if (logs.length === 0) {
    alert('目前尚無歷史打卡紀錄！您可直接手動輸入上方欄位（例如：執行 7 天、預計 -1.0 kg、實際 +0.5 kg），或先在「4. 今日打卡」儲存體重。');
    return;
  }

  const latest = logs[0];
  const oldest = logs[logs.length - 1];
  const d1 = new Date(oldest.date);
  const d2 = new Date(latest.date);
  const diffDays = Math.max(3, Math.round(Math.abs(d2 - d1) / (1000 * 3600 * 24)) || logs.length);

  const startW = logs.length >= 2 ? oldest.weight : parseFloat(els.inputWeight.value) || latest.weight;
  const actualDiffKg = +(latest.weight - startW).toFixed(1);
  const totalEx = logs.reduce((acc, item) => acc + (Number(item.exerciseKcal) || 0), 0);
  const avgEx = Math.round(totalEx / logs.length);

  // 依據目前計畫推算該天數原本預計減少的公斤數
  const weeklyLoss =
    lastCalculation?.calc?.milestones?.[1]?.totalLost ||
    +(lastCalculation?.calc?.totalWeightLoss / (lastCalculation?.profile?.durationWeeks || 8) || 0.6).toFixed(2);
  const expectedDiffKg = +(-weeklyLoss * (diffDays / 7)).toFixed(1);

  if (els.calibDays) els.calibDays.value = diffDays;
  if (els.calibAvgExercise) els.calibAvgExercise.value = avgEx;
  if (els.calibExpectedKg) els.calibExpectedKg.value = expectedDiffKg;
  if (els.calibActualKg) els.calibActualKg.value = actualDiffKg;

  updateCalibrationPreview();
}

function bindEvents() {
  // 導覽切換
  navTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab !== 'meals') stopLiveCamera();
      if ((tab === 'result' || tab === 'meals') && !lastCalculation) {
        runCalculation(false);
      }
      if (tab === 'tracker') {
        renderTodayCheckinDashboard();
      }
      if (tab === 'history') {
        renderTrackerLogs();
        updateCalibrationPreview();
      }
      switchTab(tab);
    });
  });

  // AI 拍照與外食分析事件綁定
  els.aiCameraBtn?.addEventListener('click', () => openLiveCamera());
  els.aiSwitchCamBtn?.addEventListener('click', () => switchLiveCamera());
  els.aiSnapBtn?.addEventListener('click', () => snapLiveCameraPhoto());
  els.aiCloseCamBtn?.addEventListener('click', () => stopLiveCamera());
  els.aiGalleryBtn?.addEventListener('click', () => {
    stopLiveCamera();
    els.aiGalleryInput?.click();
  });

  els.aiCameraInput?.addEventListener('change', (e) => {
    if (e.target.files?.length) {
      handleAiImagesSelect(e.target.files);
    }
    e.target.value = '';
  });

  els.aiGalleryInput?.addEventListener('change', (e) => {
    if (e.target.files?.length) {
      handleAiImagesSelect(e.target.files);
    }
    e.target.value = '';
  });

  els.aiRemoveImageBtn?.addEventListener('click', () => {
    currentAiImages = [];
    if (els.aiCameraInput) els.aiCameraInput.value = '';
    if (els.aiGalleryInput) els.aiGalleryInput.value = '';
    renderAiImagesPreview();
  });

  document.querySelectorAll('.ai-quick-note').forEach((chip) => {
    chip.addEventListener('click', () => {
      if (els.aiFoodNote) {
        els.aiFoodNote.value = chip.dataset.note || '';
      }
      runAiFoodAnalysis();
    });
  });

  els.aiAnalyzeBtn?.addEventListener('click', () => {
    runAiFoodAnalysis();
  });

  els.aiAddToTrayBtn?.addEventListener('click', () => {
    if (!lastAiAnalysis) return;
    customTray.push({
      id: `ai-${Date.now()}`,
      name: `📸 ${lastAiAnalysis.mealName}`,
      kcal: lastAiAnalysis.totalCalories,
      p: lastAiAnalysis.proteinGrams,
      c: lastAiAnalysis.carbsGrams,
      f: lastAiAnalysis.fatGrams
    });
    updateCustomMealSummary();
    els.customSelectedTray?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // 拍完餐點或文字分析後按「✅ 打卡記錄這餐熱量」-> 自動寫入今日已吃熱量並切換到「4. 今日打卡」
  els.aiAddToLogBtn?.addEventListener('click', () => {
    if (!lastAiAnalysis) return;
    addMealToTodayCheckin({
      name: `📸 ${lastAiAnalysis.mealName}`,
      kcal: lastAiAnalysis.totalCalories,
      p: lastAiAnalysis.proteinGrams,
      c: lastAiAnalysis.carbsGrams,
      f: lastAiAnalysis.fatGrams
    });
    switchTab('tracker');
  });

  // 自訂自由混搭餐盤按「✅ 將此混搭餐盤打卡至今日已吃熱量」
  els.customAddToLogBtn?.addEventListener('click', () => {
    if (customTray.length === 0) return;
    const totals = customTray.reduce(
      (acc, item) => {
        acc.kcal += item.kcal;
        acc.p += item.p;
        acc.c += item.c;
        acc.f += item.f;
        return acc;
      },
      { kcal: 0, p: 0, c: 0, f: 0 }
    );
    const names = customTray.map((i) => i.name).join('＋');
    addMealToTodayCheckin({
      name: `🥗 自選混搭：${names}`,
      kcal: totals.kcal,
      p: totals.p,
      c: totals.c,
      f: totals.f
    });
    customTray = [];
    updateCustomMealSummary();
    switchTab('tracker');
  });

  els.aiSaveKeyBtn?.addEventListener('click', () => {
    const keyVal = els.aiApiKeyInput?.value.trim() || '';
    setCustomApiKey(keyVal);
    if (els.aiKeyStatus) {
      els.aiKeyStatus.textContent = hasCustomApiKey()
        ? '✅ 已儲存並啟用您自訂的 Gemini API Key！'
        : '✅ 已恢復使用系統內建預設 API Key！';
    }
    if (els.aiApiKeyInput) els.aiApiKeyInput.value = '';
  });

  // 即時更新 BMI 與計算
  [els.inputAge, els.inputHeight, els.inputWeight, els.inputTargetWeight, els.inputBodyfat, els.selectActivity].forEach((input) => {
    input?.addEventListener('input', () => {
      updateLiveBmiBadge();
    });
  });

  document.querySelectorAll('input[name="gender"], input[name="intensity"]').forEach((r) => {
    r.addEventListener('change', () => runCalculation(false));
  });

  els.selectEatingWindow?.addEventListener('change', () => {
    selectedWindowId = els.selectEatingWindow.value;
    runCalculation(false);
  });

  els.durationSlider?.addEventListener('input', () => {
    updateDurationLabels();
  });

  document.querySelectorAll('.duration-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      els.durationSlider.value = chip.dataset.weeks;
      updateDurationLabels();
      runCalculation(false);
    });
  });

  els.calculateBtn?.addEventListener('click', () => {
    runCalculation(true);
  });

  document.getElementById('edit-profile-btn')?.addEventListener('click', () => switchTab('setup'));
  document.getElementById('back-to-setup-btn')?.addEventListener('click', () => switchTab('setup'));
  document.getElementById('go-to-meals-btn')?.addEventListener('click', () => switchTab('meals'));
  document.getElementById('go-to-history-btn')?.addEventListener('click', () => {
    renderTrackerLogs();
    updateCalibrationPreview();
    switchTab('history');
  });
  document.getElementById('back-to-tracker-btn')?.addEventListener('click', () => {
    renderTodayCheckinDashboard();
    switchTab('tracker');
  });
  els.goToAiFoodBtn?.addEventListener('click', () => switchTab('meals'));

  // 套餐分類篩選
  els.mealCategoryFilters?.querySelectorAll('.cat-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      selectedCategory = chip.dataset.cat;
      els.mealCategoryFilters.querySelectorAll('.cat-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      renderMealPlans();
    });
  });

  // 隨機換一組套餐
  els.randomMealBtn?.addEventListener('click', () => {
    const plans = getFilteredMealPlans();
    if (plans.length === 0) return;
    const picked = plans[Math.floor(Math.random() * plans.length)];
    highlightedPlanId = picked.id;
    renderMealPlans();
    const highlightedEl = document.querySelector('.meal-plan-card.highlighted-plan');
    highlightedEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  els.clearCustomMealBtn?.addEventListener('click', () => {
    customTray = [];
    updateCustomMealSummary();
  });

  // Modal 關閉與複製
  const closeModal = () => els.shoppingModal.classList.add('hidden');
  els.modalCloseBtn?.addEventListener('click', closeModal);
  els.modalOkBtn?.addEventListener('click', closeModal);
  els.copyShoppingBtn?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentModalShoppingText);
      els.copyShoppingBtn.textContent = '✅ 已複製到剪貼簿！';
      setTimeout(() => {
        els.copyShoppingBtn.textContent = '📋 複製採買清單文字';
      }, 1800);
    } catch {
      alert(currentModalShoppingText);
    }
  });

  // ==================== 畫面 4：今日打卡事件綁定 ====================
  const todayIso = getTodayIso();
  if (els.logDate) els.logDate.value = todayIso;

  els.logDate?.addEventListener('change', () => {
    renderTodayCheckinDashboard();
  });

  els.logWeight?.addEventListener('input', () => {
    const dateStr = getCurrentCheckinDate();
    const entry = getCheckinEntryForDate(dateStr);
    const val = parseFloat(els.logWeight.value);
    if (!isNaN(val) && val >= 30) {
      entry.weight = +val.toFixed(1);
      saveCheckinEntryForDate(dateStr, entry);
    }
    updateWeightComparisonUI();
  });

  // 手動補登一筆今日飲食
  els.addManualMealBtn?.addEventListener('click', () => {
    const name = els.manualMealName?.value.trim() || '手動補登餐點';
    const kcal = parseInt(els.manualMealKcal?.value, 10);
    if (isNaN(kcal) || kcal <= 0) {
      alert('請輸入有效的食物熱量 (kcal)');
      return;
    }
    addMealToTodayCheckin({ name: `🍽️ ${name}`, kcal });
    if (els.manualMealName) els.manualMealName.value = '';
    if (els.manualMealKcal) els.manualMealKcal.value = '';
  });

  // 運動消耗快速累加按鈕與輸入框
  document.querySelectorAll('.ex-quick-btn').forEach((chip) => {
    chip.addEventListener('click', () => {
      if (!els.logExercise) return;
      const dateStr = getCurrentCheckinDate();
      const entry = getCheckinEntryForDate(dateStr);
      const addKcal = parseInt(chip.dataset.kcal, 10) || 0;
      const nextVal = addKcal === 0 ? 0 : (parseInt(els.logExercise.value, 10) || 0) + addKcal;
      els.logExercise.value = String(nextVal);
      entry.exerciseKcal = nextVal;
      saveCheckinEntryForDate(dateStr, entry);
      syncCheckinDateToHistoryLogs(dateStr, false);
      renderTodayCheckinDashboard();
      renderTrackerLogs();
    });
  });

  els.logExercise?.addEventListener('input', () => {
    const dateStr = getCurrentCheckinDate();
    const entry = getCheckinEntryForDate(dateStr);
    entry.exerciseKcal = Math.max(0, parseInt(els.logExercise.value, 10) || 0);
    saveCheckinEntryForDate(dateStr, entry);
    renderTodayCheckinDashboard();
  });

  els.addLogBtn?.addEventListener('click', () => {
    const dateStr = getCurrentCheckinDate();
    const ok = syncCheckinDateToHistoryLogs(dateStr, true);
    if (!ok) return;
    renderTodayCheckinDashboard();
    renderTrackerLogs();
    const origText = els.addLogBtn.textContent;
    els.addLogBtn.textContent = '✅ 已成功儲存今日打卡結算！';
    setTimeout(() => {
      els.addLogBtn.textContent = origText;
    }, 1800);
  });

  els.clearLogsBtn?.addEventListener('click', () => {
    if (confirm('確定要清除所有歷史打卡紀錄嗎？')) {
      saveLogs([]);
      renderTrackerLogs();
      updateWeightComparisonUI();
    }
  });

  // ==================== 畫面 5：實測代謝能力動態校正 (Adaptive TDEE) ====================
  [els.calibDays, els.calibAvgExercise, els.calibExpectedKg, els.calibActualKg].forEach((input) => {
    input?.addEventListener('input', () => {
      updateCalibrationPreview();
    });
  });

  els.calibAutofillBtn?.addEventListener('click', () => {
    autofillCalibrationFromLogs();
  });

  els.calibResetBtn?.addEventListener('click', () => {
    metabolicOffsetKcal = 0;
    dailyExerciseKcal = 0;
    runCalculation(false);
    updateCalibrationPreview();
  });

  els.calibApplyBtn?.addEventListener('click', () => {
    const evalRes = updateCalibrationPreview();
    if (!evalRes) return;
    metabolicOffsetKcal = evalRes.recommendedOffsetKcal;
    dailyExerciseKcal = Math.max(0, parseInt(els.calibAvgExercise?.value, 10) || 0);

    // 若使用者實際體重有增減，同步更新目前體重起點讓後續預測更準確
    const actualChange = parseFloat(els.calibActualKg?.value);
    const logs = loadLogs();
    if (logs.length > 0 && logs[0].weight) {
      els.inputWeight.value = logs[0].weight;
    } else if (!isNaN(actualChange) && actualChange !== 0) {
      const curW = parseFloat(els.inputWeight.value) || 64;
      els.inputWeight.value = +(curW + actualChange).toFixed(1);
    }

    updateLiveBmiBadge();
    runCalculation(true);
  });
}

async function loadDietDatabase() {
  const candidates = ['./diet-plans.json', '../diet-plans.json'];
  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // try next
    }
  }
  throw new Error('無法載入 diet-plans.json');
}

async function init() {
  const cleanVer = String(APP_VERSION).split(' ')[0];
  const headerVer = document.getElementById('header-version');
  if (headerVer) {
    headerVer.textContent = `v${cleanVer}`;
  }
  if (els.appVersion) {
    els.appVersion.textContent = `版本 v${cleanVer}`;
  }

  if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
    navigator.serviceWorker
      .register('./sw.js?v=1.3.3', { updateViaCache: 'none' })
      .then((reg) => reg.update().catch(() => {}))
      .catch(() => {});
  }

  loadProfileFromStorage();
  updateLiveBmiBadge();
  updateDurationLabels();
  bindEvents();
  renderTodayCheckinDashboard();
  renderTrackerLogs();
  renderAiHistoryList();

  try {
    els.loading?.classList.remove('hidden');
    dietData = await loadDietDatabase();
    renderMethodCards();
    renderMethodDetail();
    initCustomMealBuilder();
    runCalculation(false);
    renderTodayCheckinDashboard();
  } catch (err) {
    console.error(err);
  } finally {
    els.loading?.classList.add('hidden');
  }
}

init();
