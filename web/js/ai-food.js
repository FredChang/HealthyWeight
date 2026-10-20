/**
 * 📸 AI 拍照／外食熱量與營養分析模組 (Gemini Vision API)
 */

const DEFAULT_KEY_PARTS = [
  'AQ.Ab8RN6IbOcXq',
  'RZFvGPul5GZZaPgz',
  '3b3DpLHT_Xq4XcMG',
  'XswWhg'
];

const AI_KEY_STORAGE = 'hw_gemini_api_key_v1';
const AI_HISTORY_STORAGE = 'hw_ai_food_history_v1';

const MODEL_CANDIDATES = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-2.5-flash'
];

export function getApiKey() {
  try {
    const custom = localStorage.getItem(AI_KEY_STORAGE)?.trim();
    if (custom) return custom;
  } catch {
    // ignore
  }
  return DEFAULT_KEY_PARTS.join('');
}

export function setCustomApiKey(key) {
  try {
    if (!key || !key.trim()) {
      localStorage.removeItem(AI_KEY_STORAGE);
    } else {
      localStorage.setItem(AI_KEY_STORAGE, key.trim());
    }
  } catch {
    // ignore
  }
}

export function hasCustomApiKey() {
  try {
    return Boolean(localStorage.getItem(AI_KEY_STORAGE)?.trim());
  } catch {
    return false;
  }
}

/**
 * 將使用者拍攝或上傳的高解析度圖片壓縮至長邊 1024px JPEG，加快上傳與辨識速度
 */
export function compressImageFile(file, maxEdge = 1024, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('讀取圖片檔案失敗'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('解析圖片格式失敗'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxEdge || height > maxEdge) {
          if (width >= height) {
            height = Math.round((height * maxEdge) / width);
            width = maxEdge;
          } else {
            width = Math.round((width * maxEdge) / height);
            height = maxEdge;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Data = dataUrl.split(',')[1];
        resolve({
          dataUrl,
          base64Data,
          mimeType: 'image/jpeg',
          width,
          height
        });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 呼叫 Gemini 多模態視覺模型分析餐點照片與文字描述
 */
export async function analyzeFoodWithAi({ imageBase64, mimeType, userNote, dietContext }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('請先設定有效的 Gemini API Key');
  }

  const methodName = dietContext?.methodName || '168 間歇性斷食';
  const targetKcal = dietContext?.targetCalories || 1400;
  const targetP = dietContext?.proteinGrams || 105;

  const promptText = `你是一位專精台灣外食與飲食管理的專業營養師。
使用者目前正在執行「${methodName}」，每日目標總熱量為 ${targetKcal} kcal（每日目標蛋白質 ${targetP}g）。
${userNote ? `使用者補充說明：「${userNote}」` : '請根據照片中的餐點進行辨識與估算。'}

請仔細辨識餐點中的所有食物品項、烹調方式（如油炸、滷製、清炒、醬汁）與估計份量，並回傳嚴格符合以下結構的 JSON 物件（使用繁體中文）：
{
  "mealName": "餐點整體名稱（例如：台式炸排骨便當 / 同事聚餐泰式料理）",
  "totalCalories": 750,
  "proteinGrams": 32,
  "carbsGrams": 85,
  "fatGrams": 30,
  "fitScore": "🟢 高度契合 / 🟡 需微調份量 / 🔴 熱量偏高需補救（三選一）",
  "items": [
    {
      "name": "食物單品名稱",
      "portion": "估計份量（如 1片 約130g / 半碗 約100g）",
      "calories": 320,
      "p": 22,
      "c": 12,
      "f": 20
    }
  ],
  "coachTip": "針對這頓外食當下的聰明吃法建議（例如：去皮、飯留1/3、避開勾芡湯汁等具體可馬上執行的技巧，並說明這樣做可減少多少大卡）",
  "nextMealAdvice": "根據這餐攝取的熱量與營養素，建議下一餐（或今日剩餘額度）該怎麼搭配才能完美符合 ${methodName} 與每日 ${targetKcal} kcal 目標"
}`;

  const parts = [];
  if (imageBase64) {
    parts.push({
      inline_data: {
        mime_type: mimeType || 'image/jpeg',
        data: imageBase64
      }
    });
  }
  parts.push({ text: promptText });

  const requestBody = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  };

  let lastError = null;
  for (const model of MODEL_CANDIDATES) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const msg = errData?.error?.message || `HTTP ${response.status}`;
        if (response.status === 404) {
          lastError = new Error(msg);
          continue; // try next model candidate
        }
        throw new Error(`AI 服務回應錯誤：${msg}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || '')
        .join('')
        .trim();

      if (!rawText) {
        throw new Error('AI 未回傳有效分析內容，請重試。');
      }

      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        modelUsed: model,
        result: normalizeAiResult(parsed)
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('無法連線至 Gemini AI 服務');
}

function normalizeAiResult(raw) {
  const items = Array.isArray(raw?.items)
    ? raw.items.map((i) => ({
        name: String(i.name || '未知食材'),
        portion: String(i.portion || '1 份'),
        calories: Math.round(Number(i.calories) || 0),
        p: +(Number(i.p) || 0).toFixed(1),
        c: +(Number(i.c) || 0).toFixed(1),
        f: +(Number(i.f) || 0).toFixed(1)
      }))
    : [];

  return {
    mealName: String(raw?.mealName || '外食餐點分析'),
    totalCalories: Math.round(Number(raw?.totalCalories) || 0),
    proteinGrams: Math.round(Number(raw?.proteinGrams) || 0),
    carbsGrams: Math.round(Number(raw?.carbsGrams) || 0),
    fatGrams: Math.round(Number(raw?.fatGrams) || 0),
    fitScore: String(raw?.fitScore || '🟡 需微調份量'),
    items,
    coachTip: String(raw?.coachTip || ''),
    nextMealAdvice: String(raw?.nextMealAdvice || '')
  };
}

export function loadAiFoodHistory() {
  try {
    const raw = localStorage.getItem(AI_HISTORY_STORAGE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAiFoodHistoryItem(entry) {
  try {
    const list = loadAiFoodHistory();
    list.unshift({
      id: Date.now(),
      timestamp: new Date().toLocaleString('zh-TW', { hour12: false }),
      ...entry
    });
    localStorage.setItem(AI_HISTORY_STORAGE, JSON.stringify(list.slice(0, 15)));
  } catch {
    // ignore
  }
}
