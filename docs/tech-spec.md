# 技术规范

## 技术栈

- **前端**: 纯 HTML5 + CSS3 + Vanilla JavaScript (ES6+)
- **数据**: 内嵌 JSON 数据集
- **部署**: 无服务器，静态文件

## 文件结构

```
NBA猜球员/
├── index.html          # 主文件（HTML + CSS + JS + Data）
├── docs/
│   ├── requirements.md # 开发需求
│   ├── tech-spec.md    # 技术规范（本文件）
│   ├── design-spec.md  # 设计规范
│   └── execution-plan.md # 执行步骤
├── devlog/
│   └── YYYY-MM-DD.md   # 每日开发日志
└── CLAUDE.md           # Claude 工作指引
```

## 数据结构

```javascript
const PLAYERS = [{
  id: 0,                    // 唯一索引
  name: "LeBron James",     // 全名
  team: "LAL",              // 球队缩写
  conf: "West",             // 分区
  div: "Pacific",           // 赛区
  pos: ["SF", "PF"],        // 位置数组（主位置在前）
  ht: "6-9",                // 显示用身高字符串
  htInches: 81,             // 身高（英寸，用于比对）
  age: 40,                  // 年龄
  jersey: "23",             // 球衣号码（字符串，可能有前导零或 "N/A"）
  formerTeams: ["CLE","MIA"], // 曾效力球队缩写
  headshot: ""              // 剪影/头像 URL（可为空）
}, ...];
```

## 核心算法

### 日期种子哈希
```javascript
function getDailyIndex(totalPlayers) {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth()+1)*100 + d.getDate();
  return ((seed * 2654435761) >>> 0) % totalPlayers;
}
```

### 属性比对伪代码
```
compare(guessAttr, answerAttr, column):
  case Team:
    same → GREEN, in formerTeams → YELLOW, else → BLACK
  case Conf:
    same → GREEN, else → BLACK
  case Div:
    same → GREEN, else → BLACK
  case Pos:
    arrays equal → GREEN, intersection non-empty → YELLOW, else → BLACK
  case Ht / Age / Jersey:
    diff = 0 → GREEN
    diff ≤ 2 → YELLOW + arrow
    diff > 2 → BLACK + arrow (if numeric)
```

### LocalStorage 键名
- `nbaGameState` — JSON: `{ date, mysteryId, guesses[], gameOver, won }`

## 性能指标

- 数据集大小：500 人以内
- 搜索过滤：O(n) 遍历，足够快
- 首次渲染：< 100ms（纯静态，无网络请求）
