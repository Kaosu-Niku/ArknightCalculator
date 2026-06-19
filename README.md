# Arknight Calculator

[![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)](https://react.dev/)
[![Deploy GitHub Pages](https://github.com/Kaosu-Niku/ArknightCalculator/actions/workflows/action_deploy.yml/badge.svg)](https://github.com/Kaosu-Niku/ArknightCalculator/actions/workflows/action_deploy.yml)

明日方舟幹員面板與技能傷害計算器。可依養成階段、敵方數值、模組版本及條件效果，查詢幹員數據、技能 DPS、技能總傷與完整計算明細。

線上版本：[https://Kaosu-Niku.github.io/ArknightCalculator](https://Kaosu-Niku.github.io/ArknightCalculator)

## 主要功能

- 支援精英零、精英一與精英二的初始／滿級養成階段。
- 依星級篩選幹員與技能資料。
- 自訂敵方攻擊、防禦、法術抗性、攻擊速度及技能週期。
- 顯示幹員基礎面板、潛能、信賴、天賦與模組加成。
- 計算技能生效期間的平均 DPS 與技能總傷。
- 支援物理、法術、治療、不攻擊及分支傷害類型轉換。
- 支援彈藥、攻擊段數、額外傷害流、攻擊間隔與多種穿透／減抗效果。
- 顯示無模組與各模組版本，並計入模組屬性、特性與天賦覆蓋。
- 條件成立型效果可切換啟用；機率型效果啟用後按期望值計算。
- 技能表格可自行選擇要顯示的特殊公式欄位。
- 計算紀錄可搜尋特定幹員，查看面板來源、傷害乘區、敵方結算值、攻擊排程與各傷害流。
- 作戰參數、篩選條件、表格欄位與語言設定會保存在瀏覽器中。
- 支援繁體中文與簡體中文切換。

## 計算範圍

計算器以單一目標的理論技能傷害為主，並依遊戲資料中的 blackboard key 與專案 custom 規則解析公式。

由於原始 JSON 對相同 key 沒有完全一致的語意，例如 `atk`、`def` 或 `damage_scale` 可能作用於幹員、敵人、友方或召喚物，因此特殊技能、天賦與模組需要人工規則適配。條件與機率效果只有在已收錄對應規則時才會影響結果。

目前不以技能傷害表計算下列內容：

- 多目標造成的全場總傷。
- 缺少動畫時間或觸發頻率的被動傷害。
- 治療技能的總治療量與 HPS。
- 尚未建立 custom 規則的特殊召喚物、替身或複合機制。

Custom key、公式乘區與人工適配方式請參考 [Custom Key 對照文件](docs/custom-key-reference/00-閱讀順序與重要原則.txt)。

## 本地開發

需求：Node.js 20 與 npm。

```bash
git clone https://github.com/Kaosu-Niku/ArknightCalculator.git
cd ArknightCalculator
npm ci
npm start
```

開發伺服器預設位址：

```text
http://localhost:3000/ArknightCalculator
```

### 執行測試

```bash
npm test -- --watchAll=false
```

### 建置 production 版本

```bash
npm run build
```

建置結果會輸出至 `build/`。

## 自動部署

Push 到 `master` 後，GitHub Actions 會依序執行：

1. `npm ci`
2. `npm test -- --watchAll=false`
3. `npm run build`
4. 部署 `build/` 至 GitHub Pages

也可以在 GitHub Actions 頁面手動執行 workflow。GitHub Repository 的 Pages Source 需設定為 **GitHub Actions**。

## 專案結構

```text
.github/workflows/       GitHub Pages 測試、建置與部署
docs/custom-key-reference/
                         JSON key、公式與 custom 規則文件
public/json/             幹員、技能、職分與模組資料
src/component/           畫面、表格與計算紀錄元件
src/context/             語言狀態
src/model/               面板、技能、天賦、模組與傷害公式
src/model/__tests__/     公式與回歸測試
```

核心規則檔案：

- `src/model/skillEffectRules.js`：技能 custom 規則。
- `src/model/talentEffectRules.js`：天賦 custom 規則。
- `src/model/uniequipTraitRules.js`：分支與模組特性規則。
- `src/model/SkillCalculator.js`：技能傷害流與排程。
- `src/model/DamageFormula.js`：防禦、法抗與單次傷害。
- `src/model/SkillTotalFormula.js`：技能總傷與 DPS。

## 貢獻

歡迎透過 Issue 或 Pull Request 回報：

- 幹員、技能或模組計算結果差異。
- JSON key 的特殊語意與 custom 適配案例。
- UI、效能、測試與文件改善。

提交公式修改時，請附上對應幹員、技能、養成階段、敵方數值與預期結果，並盡可能增加回歸測試。

## 聲明

本專案與《明日方舟》官方無關。遊戲名稱、資料與相關素材之權利歸其權利人所有。
