# Arknight Calculator (明日方舟数据计算器)

![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap)

> **说明**: 本项目是基于 **Kaosu-Niku** 大佬的原作网站进行维护、重构与功能改进的版本。

基于 React 构建的明日方舟数值计算器，专为 **四星队** 及 **低配攻略**（精一1级/精一满级）流派设计。支持自定义敌人数据，快速计算我方与敌方的 DPS、生存能力等关键数据，助力关卡攻略。

## ✨ 功能特性

*   **流派针对优化**: 专门针对以下流派的数据模型进行优化：
    *   精一 1 级四星队
    *   精一满级四星队
    *   常规四星队
*   **自定义战斗模拟**: 支持输入自定义的敌人属性（HP、攻击、防御、法抗等），模拟真实战斗环境。
*   **多维数据展示**:
    *   **干员数据**: 包含基础面板属性、天赋加成。
    *   **技能数据**: 详细的攻击技能与防御技能数值计算。
    *   **DPS 分析**: 自动计算理论 DPS 及总伤害，支持敌我双方数据对比。
*   **模组支持**: 完整包含模组（Uniequip）带来的属性提升与特性变化。
*   **多语言界面**: 内置简体中文与繁体中文，支持一键切换。
*   **响应式设计**: 完美适配桌面端与移动端访问。
*   **[NEW] 可视化计算日志**: 
    *   新增侧边栏日志面板，无需打开控制台即可查看详细计算过程。
    *   支持**搜索干员**，快速定位目标。
    *   提供一键清空和实时日志计数功能。

## 🚀 在线预览

访问 GitHub Pages 进行在线体验：
[https://Light-milk-tea.github.io/ArknightCalculator-Kaosu-Niku/](https://Light-milk-tea.github.io/ArknightCalculator-Kaosu-Niku/)

> **注意**: 如果页面无法访问，可能是 GitHub Pages 尚未部署完成，请稍候再试。

## 🛠️ 本地运行

如果你想在本地运行或开发本项目，请按照以下步骤操作：

### 1. 环境准备
确保你的环境中已安装 [Node.js](https://nodejs.org/) (建议 v16 或更高版本)。

### 2. 克隆仓库
```bash
git clone https://github.com/Light-milk-tea/ArknightCalculator-Kaosu-Niku.git
cd ArknightCalculator-Kaosu-Niku
```

### 3. 安装依赖
```bash
npm install
```

### 4. 启动开发服务器
```bash
npm start
```
启动后，浏览器将自动打开 [http://localhost:3000](http://localhost:3000) 访问应用。

### 5. 构建生产版本
```bash
npm run build
```
构建产物将输出到 `build` 目录，可用于部署。

## 📂 项目结构

```
src/
├── component/          # UI 组件
│   ├── LogPanel.js     # [新增] 日志展示面板
│   ├── Header.js       # 顶部导航栏
│   └── ...
├── context/            # React Context (语言状态管理)
├── model/              # 核心计算逻辑
│   ├── LogManager.js   # [新增] 日志管理模块
│   ├── BasicCalculator.js   # 基础数值
│   ├── SkillCalculator.js   # 技能计算
│   ├── TalentsCalculator.js # 天赋计算
│   └── UniequipCalculator.js # 模组计算
└── App.js              # 主应用入口
```

## 🤝 贡献

欢迎提交 Issue 或 Pull Request 来改进这个计算器！无论是增加新干员数据、修复 Bug 还是优化算法，都非常欢迎。

## 👤 作者与致谢

*   **原作者**: Kaosu-Niku
*   **维护与改进**: Light-milk-tea

---
*本项目与《明日方舟》官方无关，所有游戏素材版权归鹰角网络所有。*
