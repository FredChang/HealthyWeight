import {
  calculateBmi,
  getBmiCategory,
  calculateWeightPlan,
  getPortionAdjustmentAdvice,
  formatDateShort
} from './calculator.js';
import {
  compressImageFile,
  captureVideoFrame,
  analyzeFoodWithAi,
  setCustomApiKey,
  hasCustomApiKey,
  loadAiFoodHistory,
  saveAiFoodHistoryItem
} from './ai-food.js?v=1.1.5';
import { APP_VERSION } from './version.js?v=1.1.5';

const STORAGE_KEYS = {
  PROFILE: 'hw_user_profile_v1',
  LOGS: 'hw_weight_logs_v1'
};

let dietData = null;
let selectedMethodId = '168';
let selectedWindowId = '12-20';
let selectedCategory = 'recommended';
let highlightedPlanId = null;
let lastCalculation = null;
let customTray = [];
let currentModalShoppingText = '';
let currentAiImage = null;
let lastAiAnalysis = null;
let cameraStream = null;
let cameraFacingMode = 'environment';

const screens = {
  setup: document.getElementById('screen-setup'),
  result: document.getElementById('screen-result'),
  meals: document.getElementById('screen-meals'),
  tracker: document.getElementById('screen-tracker')
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
  aiImagePreview: document.getElementById('ai-image-preview'),
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
  clearCustomMealBtn: document.getElementById('clear-custom-meal-btn'),

  // Tracker screen
  logDate: document.getElementById('log-date'),
  logWeight: document.getElementById('log-weight'),
  logStatus: document.getElementById('log-status'),
  logNote: document.getElementById('log-note'),
  addLogBtn: document.getElementById('add-log-btn'),
  clearLogsBtn: document.getElementById('clear-logs-btn'),
  trackerStatsSummary: document.getElementById('tracker-stats-summary'),
  trackerLogsList: document.getElementById('tracker-logs-list'),

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
    windowId: els.selectEatingWindow.value || selectedWindowId
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

  // 更新套餐頁面資訊
  renderMealPlans();
  updateCustomMealSummary();

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
        (m) => `
        <div class="meal-slot-box">
          <div class="meal-slot-header">
            <span class="meal-slot-time">${m.slot}</span>
            <span class="meal-slot-kcal">🔥 ${m.calories} kcal · P:${m.protein}g / C:${m.carbs}g / F:${m.fat}g</span>
          </div>
          <div class="meal-slot-title">${m.title}</div>
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
          ✍️ 選用此套餐打卡
        </button>
      </div>
    `;

    card.querySelector('.btn-open-shopping')?.addEventListener('click', () => {
      openShoppingModal(plan);
    });

    card.querySelector('.btn-apply-log')?.addEventListener('click', () => {
      els.logNote.value = `執行【${method.shortName}】搭配：${plan.name}`;
      if (!els.logWeight.value) {
        els.logWeight.value = els.inputWeight.value;
      }
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

/* ==================== 📸 AI 拍照算卡路里與外食分析 ==================== */
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
    els.aiImagePreviewWrap?.classList.add('hidden');
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
  stopLiveCamera();
  currentAiImage = captured;
  if (els.aiImagePreview) {
    els.aiImagePreview.src = captured.dataUrl;
  }
  els.aiImagePreviewWrap?.classList.remove('hidden');
  runAiFoodAnalysis();
}

async function handleAiImageSelect(file) {
  if (!file) return;
  stopLiveCamera();
  els.aiErrorBox?.classList.add('hidden');
  try {
    const compressed = await compressImageFile(file);
    currentAiImage = compressed;
    if (els.aiImagePreview) {
      els.aiImagePreview.src = compressed.dataUrl;
    }
    els.aiImagePreviewWrap?.classList.remove('hidden');
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
  const userNote = els.aiFoodNote?.value.trim() || '';
  if (!currentAiImage && !userNote) {
    if (els.aiErrorBox) {
      els.aiErrorBox.textContent = '📸 請先「開啟相機拍照／選取餐點照片」，或在文字框輸入外食菜色（例如：排骨便當飯吃一半）！';
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
      imageBase64: currentAiImage?.base64Data || null,
      mimeType: currentAiImage?.mimeType || 'image/jpeg',
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

/* ==================== 每日體重與飲食打卡系統 ==================== */
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

function renderTrackerLogs() {
  const logs = loadLogs();
  els.trackerLogsList.innerHTML = '';

  if (logs.length === 0) {
    els.trackerStatsSummary.innerHTML = `<span class="pool-text">尚無打卡紀錄。現在就輸入今日體重開始第一筆紀錄吧！</span>`;
    return;
  }

  const latest = logs[0];
  const oldest = logs[logs.length - 1];
  const diff = +(latest.weight - oldest.weight).toFixed(1);
  const diffText = diff <= 0 ? `${diff} kg` : `+${diff} kg`;

  els.trackerStatsSummary.innerHTML = `
    <span class="status-badge">累計打卡：${logs.length} 天</span>
    <span class="status-badge">最新體重：${latest.weight} kg</span>
    <span class="status-badge">期間變化：${diffText}</span>
  `;

  logs.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'tracker-log-item';
    row.innerHTML = `
      <div>
        <strong>${item.date}</strong> · <span class="highlight-num">${item.weight} kg</span>
        <span class="plan-tag" style="margin-left:6px">${item.status}</span>
        ${item.note ? `<div class="pool-text" style="margin-top:4px">${item.note}</div>` : ''}
      </div>
      <button type="button" class="btn-ghost" data-del-idx="${idx}">刪除</button>
    `;
    row.querySelector('[data-del-idx]')?.addEventListener('click', () => {
      const updated = loadLogs();
      updated.splice(idx, 1);
      saveLogs(updated);
      renderTrackerLogs();
    });
    els.trackerLogsList.appendChild(row);
  });
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
    const file = e.target.files?.[0];
    if (file) handleAiImageSelect(file);
  });

  els.aiGalleryInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleAiImageSelect(file);
  });

  els.aiRemoveImageBtn?.addEventListener('click', () => {
    currentAiImage = null;
    if (els.aiCameraInput) els.aiCameraInput.value = '';
    if (els.aiGalleryInput) els.aiGalleryInput.value = '';
    els.aiImagePreviewWrap?.classList.add('hidden');
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

  els.aiAddToLogBtn?.addEventListener('click', () => {
    if (!lastAiAnalysis) return;
    els.logNote.value = `📸 AI 外食分析：${lastAiAnalysis.mealName} (${lastAiAnalysis.totalCalories} kcal · P:${lastAiAnalysis.proteinGrams}g C:${lastAiAnalysis.carbsGrams}g F:${lastAiAnalysis.fatGrams}g)`;
    if (!els.logWeight.value) {
      els.logWeight.value = els.inputWeight.value;
    }
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

  // 體重打卡
  const todayIso = new Date().toISOString().slice(0, 10);
  if (els.logDate) els.logDate.value = todayIso;

  els.addLogBtn?.addEventListener('click', () => {
    const date = els.logDate.value || todayIso;
    const weight = parseFloat(els.logWeight.value || els.inputWeight.value);
    if (isNaN(weight) || weight < 30 || weight > 250) {
      alert('請輸入有效的體重數值 (kg)');
      return;
    }
    const status = els.logStatus.value;
    const note = els.logNote.value.trim();

    const logs = loadLogs();
    logs.unshift({ date, weight: +weight.toFixed(1), status, note });
    saveLogs(logs);
    els.logNote.value = '';
    renderTrackerLogs();
  });

  els.clearLogsBtn?.addEventListener('click', () => {
    if (confirm('確定要清除所有歷史打卡紀錄嗎？')) {
      saveLogs([]);
      renderTrackerLogs();
    }
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
      .register('./sw.js?v=1.1.5', { updateViaCache: 'none' })
      .then((reg) => reg.update().catch(() => {}))
      .catch(() => {});
  }

  loadProfileFromStorage();
  updateLiveBmiBadge();
  updateDurationLabels();
  bindEvents();
  renderTrackerLogs();
  renderAiHistoryList();

  try {
    els.loading?.classList.remove('hidden');
    dietData = await loadDietDatabase();
    renderMethodCards();
    renderMethodDetail();
    initCustomMealBuilder();
    runCalculation(false);
    if (els.logWeight && !els.logWeight.value) {
      els.logWeight.value = els.inputWeight.value;
    }
  } catch (err) {
    console.error(err);
  } finally {
    els.loading?.classList.add('hidden');
  }
}

init();
