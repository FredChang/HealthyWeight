# 體重飲食管理 (HealthyWeight)

> **手機／瀏覽器請直接開啟：** https://fredchang.github.io/HealthyWeight/web/  
> （推送最新版後，首頁 https://fredchang.github.io/HealthyWeight/ 也會自動導向管理頁）

個人化體重與飲食管理應用，支援身體素質代謝精算（BMR / TDEE / BMI）、6 大主流飲食管理方法（168 斷食、186 斷食、211 哈佛餐盤、5:2 輕斷食、減醣低碳、高蛋白增肌減脂）、預定施行時間減重曲線預測，以及多種台灣外食／超商／自煮減脂套餐與自由配餐計算機。

| 平台 | 使用方式 |
|------|----------|
| **Windows** | 用 Visual Studio 開啟 `HealthyWeight.sln` 建置執行（WPF 桌面版） |
| **iPhone / Android / 電腦瀏覽器** | 透過瀏覽器開啟網頁版，可「加到主畫面」像 App 一樣使用 |

## 核心功能

`web/` 資料夾為行動裝置與跨平台瀏覽器用的網頁版（PWA），功能包含：

1. **身體素質與代謝計算**：
   - 輸入性別、年齡、身高、目前體重、目標體重、體脂率（選填）與日常活動量
   - 自動精算 **BMI 體位**、**BMR 基礎代謝率**（支援 Mifflin-St Jeor 與 Katch-McArdle 雙公式）、**TDEE 每日總消耗熱量**、**每日建議攝取熱量**與**每日建議飲水量**
2. **6 大飲食管理方法選擇**：
   - 🔥 **168 間歇性斷食**（含 12:00–20:00、10:00–18:00、09:00–17:00 等進食時間窗與 24 小時作息時間軸）
   - ⚡ **186 進階間歇斷食**
   - 🥗 **211 哈佛健康餐盤**（2 菜 : 1 肉 : 1 飯，三餐正常吃不挨餓）
   - 📅 **5:2 週期輕斷食**（一週 5 天正常吃、2 天 600 kcal 輕斷食）
   - 🥑 **減醣低碳飲食**
   - 💪 **高蛋白增肌減脂**
3. **預定施行時間與減重數值預測**：
   - 自由設定施行週數（1 ~ 36 週）與執行強度（溫和 / 標準 / 積極，內建安全代謝底線保護）
   - 計算**預計可減重公斤數**、**達成體重**、**預計減少腰圍**、**三大營養素 (蛋白質/碳水/脂肪) 建議克數**
   - 繪製 **SVG 階段性體重下降預測趨勢圖** 與 **逐週里程碑明細表**
4. **多種飲食套餐選擇與自由混搭**：
   - 內建多套台灣常見飲食場景套餐（🏪 超商 7-11/全家外食族、🍱 自助餐便當與滷味、🍳 氣炸鍋/電鍋自煮、🌱 蔬食高纖、📅 5:2 輕斷食日專用）
   - 依個人目標熱量自動提供**個人化份量增減建議**与**一鍵複製採買清單**
   - 內建 **🔧 自由混搭一日餐盤計算機** 與 **📊 每日體重與飲食打卡紀錄**（儲存於瀏覽器本機）

### 本機預覽

在專案根目錄執行：

```powershell
Copy-Item diet-plans.json web\diet-plans.json -Force
cd web
python -m http.server 8080
```

電腦瀏覽器開啟 `http://localhost:8080`；手機與電腦連同一 Wi‑Fi 時，用手機瀏覽器開啟 `http://<你的電腦IP>:8080`。

### 上傳 GitHub 並讓手機／網頁使用

1. **建立 GitHub 倉庫**（例如名稱 `HealthyWeight`）。

2. **在本機初始化並推送**：

```powershell
cd I:\2026_0826\HealthyWeight
Copy-Item diet-plans.json web\diet-plans.json -Force
git init
git add .
git commit -m "Initial commit: HealthyWeight diet and weight management app"
git branch -M main
git remote add origin https://github.com/FredChang/HealthyWeight.git
git push -u origin main
```

3. **啟用 GitHub Pages**
   - 進入 GitHub 倉庫 → **Settings** → **Pages**
   - **Build and deployment** → Source 選 **GitHub Actions**
   - 推送 `main` 分支後，`.github/workflows/deploy-pages.yml` 會自動部署

4. **手機／電腦開啟網址**

```
https://fredchang.github.io/HealthyWeight/web/
```

5. **加到主畫面（像 App 一樣使用）**
   - **iPhone（Safari）**：分享 → **加入主畫面**
   - **Android（Chrome）**：⋮ 選單 → **安裝應用程式** 或 **加到主畫面**

### 更新套餐資料庫後

修改根目錄的 `diet-plans.json` 後，同步到網頁版再推送：

```powershell
Copy-Item diet-plans.json web\diet-plans.json -Force
git add diet-plans.json web/diet-plans.json
git commit -m "Update diet plans"
git push
```

GitHub Actions 部署時也會自動從根目錄複製 `diet-plans.json` 到 `web/`。

## Windows 桌面版建置

- 需求：Visual Studio 2019+、.NET Framework 4.8.1
- 開啟 `HealthyWeight.sln` → 建置 → 執行
- 發行：`bin\Release\HealthyWeight.exe`（需一併包含 `diet-plans.json`）

## 專案結構

```
HealthyWeight/
├── web/                 # 手機／瀏覽器版 PWA（GitHub Pages 部署來源）
├── diet-plans.json      # 飲食管理方法與套餐資料庫（桌面版與網頁版共用）
├── HealthyWeight.sln    # Windows WPF 桌面版方案
└── .github/workflows/   # 自動部署 GitHub Pages
```
