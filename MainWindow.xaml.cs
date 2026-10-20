using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows;
using System.Windows.Controls;

namespace HealthyWeight
{
    public partial class MainWindow : Window
    {
        private Dictionary<string, object> _dietData;
        private bool _isLoaded = false;

        public class MealPlanViewModel
        {
            public string Header { get; set; }
            public string Advice { get; set; }
            public string Body { get; set; }
        }

        public MainWindow()
        {
            InitializeComponent();
            LoadDatabase();
            _isLoaded = true;
            Recalculate();
        }

        private void LoadDatabase()
        {
            try
            {
                string path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "diet-plans.json");
                if (!File.Exists(path))
                {
                    path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"..\..\diet-plans.json");
                }
                if (File.Exists(path))
                {
                    string json = File.ReadAllText(path, Encoding.UTF8);
                    var serializer = new JavaScriptSerializer();
                    _dietData = serializer.Deserialize<Dictionary<string, object>>(json);

                    var methods = _dietData["methods"] as ArrayList;
                    if (methods != null)
                    {
                        foreach (Dictionary<string, object> m in methods)
                        {
                            var item = new ComboBoxItem
                            {
                                Content = $"{m["name"]} ({m["badge"]})",
                                Tag = m
                            };
                            MethodCombo.Items.Add(item);
                        }
                        if (MethodCombo.Items.Count > 0)
                            MethodCombo.SelectedIndex = 0;
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("載入 diet-plans.json 失敗: " + ex.Message);
            }
        }

        private void Input_Changed(object sender, RoutedEventArgs e)
        {
            if (_isLoaded) Recalculate();
        }

        private void Method_Changed(object sender, SelectionChangedEventArgs e)
        {
            if (_isLoaded) Recalculate();
        }

        private void CalcButton_Click(object sender, RoutedEventArgs e)
        {
            Recalculate();
        }

        private void OpenWebButton_Click(object sender, RoutedEventArgs e)
        {
            string webIndex = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"..\..\web\index.html"));
            if (!File.Exists(webIndex))
            {
                webIndex = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, @"web\index.html"));
            }
            if (File.Exists(webIndex))
            {
                Process.Start(new ProcessStartInfo(webIndex) { UseShellExecute = true });
            }
            else
            {
                MessageBox.Show("找不到 web/index.html，請確認檔案路徑。");
            }
        }

        private void Recalculate()
        {
            if (!_isLoaded || _dietData == null) return;

            bool isMale = MaleRadio.IsChecked == true;
            double age = double.TryParse(AgeBox.Text, out double a) ? Math.Max(12, Math.Min(100, a)) : 30;
            double height = double.TryParse(HeightBox.Text, out double h) ? Math.Max(120, Math.Min(230, h)) : 162;
            double weight = double.TryParse(WeightBox.Text, out double w) ? Math.Max(30, Math.Min(250, w)) : 64;
            int weeks = (int)Math.Round(WeeksSlider.Value);
            DurationLabel.Text = $"預定施行時間：{weeks} 週 ({weeks * 7} 天)";

            double activity = 1.375;
            if (ActivityCombo.SelectedItem is ComboBoxItem actItem && actItem.Tag != null)
            {
                double.TryParse(actItem.Tag.ToString(), out activity);
            }

            var selectedMethodItem = MethodCombo.SelectedItem as ComboBoxItem;
            var method = selectedMethodItem?.Tag as Dictionary<string, object>;
            if (method == null) return;

            string methodId = method["id"].ToString();
            string methodName = method["name"].ToString();
            MethodDescText.Text = method["summary"].ToString();

            double bmr = 10 * weight + 6.25 * height - 5 * age + (isMale ? 5 : -161);
            double tdee = bmr * activity;
            double deficitRatio = Convert.ToDouble(method["defaultDeficitRatio"]);
            double bonus = Convert.ToDouble(method["metabolicBonus"]);

            double desiredDeficit = Math.Max(380, Math.Min(700, tdee * deficitRatio));
            double minSafe = Math.Max(isMale ? 1400 : 1150, bmr * 0.92);
            double targetKcal = Math.Max(minSafe, tdee - desiredDeficit);
            double effectiveDeficit = Math.Max(220, tdee - targetKcal) * bonus;

            double currentW = weight;
            double waterBonus = methodId == "lowcarb" ? 0.7 : methodId == "168" ? 0.5 : 0.35;
            for (int i = 1; i <= weeks; i++)
            {
                double adapt = Math.Max(0.82, 1.0 - (i - 1) * 0.007);
                double loss = ((effectiveDeficit * 7.0) / 7700.0) * adapt + (i == 1 ? waterBonus * 0.7 : i == 2 ? waterBonus * 0.3 : 0);
                currentW = Math.Max(38, currentW - loss);
            }

            double totalLost = Math.Round(weight - currentW, 1);
            double finalW = Math.Round(currentW, 1);
            double startBmi = Math.Round(weight / Math.Pow(height / 100.0, 2), 1);
            double endBmi = Math.Round(finalW / Math.Pow(height / 100.0, 2), 1);

            HeroTitleText.Text = $"{methodName} · 預定施行 {weeks} 週";
            HeroLossText.Text = $"-{totalLost:0.0} kg";
            HeroWeightRangeText.Text = $"{weight:0.0} kg ➔ {finalW:0.0} kg (BMI {startBmi:0.0} ➔ {endBmi:0.0})";

            var split = method["macroSplit"] as Dictionary<string, object>;
            int pG = (int)Math.Round((targetKcal * Convert.ToDouble(split["protein"])) / 4.0);
            int cG = (int)Math.Round((targetKcal * Convert.ToDouble(split["carbs"])) / 4.0);
            int fG = (int)Math.Round((targetKcal * Convert.ToDouble(split["fat"])) / 9.0);

            StatBmrTdeeText.Text = $"BMR: {Math.Round(bmr)} kcal | TDEE: {Math.Round(tdee)} kcal";
            StatTargetKcalText.Text = $"🎯 建議每日攝取: {Math.Round(targetKcal)} kcal";
            StatMacrosText.Text = $"🥩 P: {pG}g | 🍠 C: {cG}g | 🥑 F: {fG}g";
            StatWaterText.Text = $"💧 建議每日飲水: {Math.Round(weight * 35 / 50) * 50} ml";

            // 載入對應套餐
            var plans = _dietData["mealPlans"] as ArrayList;
            var vmList = new List<MealPlanViewModel>();
            if (plans != null)
            {
                foreach (Dictionary<string, object> p in plans)
                {
                    int baseKcal = Convert.ToInt32(p["baseCalories"]);
                    int diff = (int)Math.Round(targetKcal) - baseKcal;
                    string advice = Math.Abs(diff) <= 100
                        ? $"✅ 完美契合您的目標熱量 ({Math.Round(targetKcal)} kcal)，可直接照下方標準份量享用！"
                        : diff > 100
                            ? $"💡 個人化份量加成 (+{diff} kcal)：建議多加 1 份茶葉蛋或無糖豆漿補足蛋白質！"
                            : $"💡 個人化份量微調 ({diff} kcal)：建議將套餐中的飯/地瓜減少約 1/3 份即可達標！";

                    var sb = new StringBuilder();
                    var meals = p["meals"] as ArrayList;
                    if (meals != null)
                    {
                        foreach (Dictionary<string, object> m in meals)
                        {
                            sb.AppendLine($"【{m["slot"]}】{m["title"]} ({m["calories"]} kcal)");
                            var items = m["items"] as ArrayList;
                            if (items != null)
                            {
                                foreach (var item in items)
                                    sb.AppendLine($"  • {item}");
                            }
                        }
                    }

                    vmList.Add(new MealPlanViewModel
                    {
                        Header = $"{p["name"]} （基準 {baseKcal} kcal）",
                        Advice = advice,
                        Body = sb.ToString().TrimEnd()
                    });
                }
            }
            MealsItemsControl.ItemsSource = vmList;
        }
    }
}
