# Codex Handoff

這份文件給新的 Codex 對話快速接手用，目標是降低上下文消耗。
新對話優先讀本文件；只有要修改 custom 或公式時，再按需讀 `docs/custom-key-reference/`。

## 低流量工作方式

- 先讀本文件，不要回顧舊聊天紀錄。
- 問題若只是判斷或討論，先不要跑工具。
- 工具搜尋優先精準檔案與 `rg`，避免全專案掃描。
- 小改動只跑相關測試；公式、資料流或 workflow 變更才跑完整測試與 build。
- 不要貼大段 diff 或長輸出，只回報結論、檔案與驗證結果。
- custom 新增後才同步更新 `05-Custom適配案例總覽.txt`。

## 專案概況

這是明日方舟幹員技能傷害計算器，核心資料來自 `public/json`。
上游熱資料來源是 `Kengxxiao/ArknightsGameData`，本專案另有同步資料 workflow。

主要計算流程：

1. 讀取 `character_table.json`、`skill_table.json`、`uniequip_table.json`、`battle_equip_table.json`。
2. 建立幹員面板、潛能、天賦、模組與技能列。
3. 由 custom 規則把不一致的 JSON blackboard key 映射成公式標準欄位。
4. 用 `SkillCalculator`、`DamageFormula`、`SkillTotalFormula` 算單次傷害、DPS 與技能總傷。

## 重要檔案

- 技能公式欄位：`src/model/SkillEffectResolver.js`
- 技能 custom：`src/model/skillEffectRules.js`
- 技能排除與 rule 建立：`src/model/SkillCustomCalculator.js`
- 天賦 custom：`src/model/talentEffectRules.js`
- 模組與分支規則：`src/model/uniequipTraitRules.js`
- 傷害乘區整合：`src/model/SkillCalculator.js`
- 單次傷害公式：`src/model/DamageFormula.js`
- 總傷與 DPS：`src/model/SkillTotalFormula.js`
- 表格欄位：`src/component/tableColumns/attackSkillColumns.js`
- 計算紀錄：`src/model/CalculationReport.js`
- custom 文件：`docs/custom-key-reference/`

## Custom 文件索引

- `00-閱讀順序與重要原則.txt`：custom 原則與相關程式位置。
- `01-技能Key與公式對照.txt`：技能 key 對公式欄位。
- `02-天賦Key與公式對照.txt`：天賦 key 對公式欄位。
- `03-模組與分支Key對照.txt`：模組與分支規則。
- `04-Custom規則撰寫範本.txt`：新增 custom 的寫法。
- `05-Custom適配案例總覽.txt`：已完成 custom 案例，新增 custom 後要同步。
- `06-全量稽核待人工判斷.txt`：仍待人工決策或公式能力的 backlog。

## 核心決策

- JSON key 語意不穩定，同名 key 不能全域套用。
- 原始 key 存在且值為 `0` 是合法資料，不能用 truthy 判斷當成不存在。
- custom 排序依 `character_table.json` 讀取順序；同幹員技能依 skills 陣列順序。
- 條件效果關閉：條件/機率效果不觸發。
- 條件效果開啟：必定條件視為全程觸發；機率效果以期望值計算。
- 逐漸提升、多次釋放、疊層效果通常取最高或穩定階段。
- 召喚物、替身、自動裝置獨立行動的傷害通常不併入幹員技能總傷。
- 敵方行為觸發的反擊通常不計入；例外需由使用者明確決策。
- 元素損傷/元素傷害目前不與物理、法術、真實傷害混算。

## 已完成的重要能力

- 技能/天賦/模組 custom 中間層。
- 技能欄位可選顯示，並恢復技能 DPS 欄。
- 條件與機率效果開關，含表格標記。
- 計算紀錄可顯示面板、天賦、潛能、模組、技能傷害流與公式明細。
- 作戰參數與計算設定使用 localStorage 保存，敵方技能除外。
- 繁簡切換已做基本穩定性檢查。
- GitHub Pages deploy workflow 與 game data sync workflow。
- `ADJUST_duration`：對技能有效持續時間做固定秒數加減；小满「乡音沉沉」使用 `-5`。
- 狀態切換技能以「切換前/切換後」兩列輸出。
- Snapshot 測試已移除，測試改為語意斷言。

## 目前待處理重點

優先看 `docs/custom-key-reference/06-全量稽核待人工判斷.txt`。

目前仍保留的主要方向：

- 澄闪「澄净闪耀」：浮游單元各自獨立疊層，暫緩。
- 缄默德克萨斯「阵雨连绵」：需要每條傷害流獨立段數，但目前使用者判斷暫緩。
- 琳琅诗怀雅「千金一掷」：關閉時金幣傷害取決於手動關閉時機，暫緩。
- 丰川祥子與 FEVER 類機制：暫緩。
- 天賦固定 DOT、以敵防為基準附傷、元素損傷：需要新公式能力。

已掃到但暫緩的「每條傷害流獨立段數」候選：

- 缄默德克萨斯「阵雨连绵」
- 缄默德克萨斯「剑雨滂沱」
- 新约能天使「使命必达！」
- 赤刃明霄陈「赤霄·天喟」

## 常用驗證

在本地 Codex 環境若 `npm` 不在 PATH，可使用 bundled Node：

```powershell
$node='C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node .\node_modules\react-scripts\bin\react-scripts.js test --watchAll=false --runInBand
$env:CI='true'; & $node .\node_modules\react-scripts\bin\react-scripts.js build
```

custom 相關：

```powershell
$node='C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node scripts/sort-custom-rules.mjs --check
& $node scripts/generate-custom-docs.mjs --check
& $node scripts/audit-custom-coverage.mjs --summary
```

一般 GitHub 或使用者環境可用：

```bash
npm test -- --watchAll=false --runInBand
npm run build
npm run custom:sort:check
npm run custom:docs:check
npm run custom:audit -- --summary
```

## 給新對話的建議提示

可以直接貼：

> 請先閱讀 `docs/codex-handoff.md`，低流量模式接手。除非必要，不要掃全專案；先針對我接下來提出的問題讀相關檔案。

