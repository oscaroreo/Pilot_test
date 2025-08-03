# Pilot 研究系统

支持随机化推文顺序和Note A/B盲测的用户研究系统。

## 🚀 核心功能

- **限量随机分配**: 每个参与者评价20个随机选择的推文
- **均匀分布算法**: 确保每个题目在多用户间获得大致相等的评价次数
- **Note A/B盲测**: 随机分配Community Note和LLM Note为Note A/B，用户无法识别
- **完整数据收集**: 自动保存所有用户响应和时间戳
- **会话管理**: 独立的用户会话追踪

## 📦 快速启动

### 1. 安装后端依赖
```bash
npm run install-backend
# 或者
cd backend && npm install
```

### 2. 启动服务器
```bash
npm start                    # 使用根目录启动脚本
# 或者
npm run backend             # 生产模式
npm run backend-dev         # 开发模式（自动重启）
```

### 3. 开始研究
访问 `http://localhost:3000/introduction.html`

## 📊 数据存储格式

数据保存为JSON文件：`results/session_[ID]_[姓名].json`

### 包含内容：
```json
{
  "participantName": "参与者姓名",
  "sessionId": "会话ID",
  "startTime": "开始时间",
  "completionTime": "完成时间",
  "totalItemsAssigned": 20,
  "sessionSummary": {
    "evaluatedPosts": 20,
    "startTime": "开始时间"
  },
  "userResponses": {
    "1": {
      "postIndex": 1,
      "noteMapping": "community_first",
      "communityNote": {
        "helpfulness": "helpful",
        "details": {
          "source_quality": "4",
          "clarity": "5",
          "coverage": "3",
          "context": "4",
          "impartiality": "5"
        }
      },
      "llmNote": {
        "helpfulness": "somewhat helpful",
        "details": {
          "source_quality": "3",
          "clarity": "4",
          "coverage": "4",
          "context": "3",
          "impartiality": "4"
        }
      },
      "comparison": "community_note",
      "timestamp": "2024-01-01T10:05:00.000Z"
    }
  }
}
```

## 🎲 随机化机制

1. **题目选择**: 均匀分布算法确保每个题目被分配次数平衡
   - 优先选择被分配次数较少的题目
   - 同等次数的题目随机选择
   - 每用户限制20个题目
2. **推文顺序**: Fisher-Yates算法随机排序
3. **Note分配**: 每个推文随机决定哪个是Note A/B
   - Community Note可能是Note A或Note B  
   - LLM Note可能是Note A或Note B
   - 用户无法知道真实的笔记类型

## 📈 分布效果

以59个总题目为例：
- **10个用户**: 每题平均3.39次评价，平衡度1（3-4次）
- **20个用户**: 每题平均6.78次评价，平衡度1（6-7次）
- **30个用户**: 每题平均10.17次评价，平衡度1（10-11次）
- **50个用户**: 每题平均16.95次评价，平衡度1（16-17次）

## 📁 文件结构

```
Pilot_test/
├── README.md           # 项目说明文档
├── package.json        # 根项目配置
├── start.js           # 启动脚本
├── frontend/          # 前端文件
│   ├── introduction.html    # 介绍页面
│   ├── index.html          # 主评估页面  
│   ├── completion.html     # 完成页面
│   ├── script.js           # 主要JavaScript逻辑
│   ├── intro-script.js     # 介绍页面脚本
│   ├── style.css           # 主页面样式
│   ├── intro-style.css     # 介绍页面样式
│   └── completion-style.css # 完成页面样式
└── backend/           # 后端文件
    ├── server.js           # 后端服务器
    ├── package.json        # 后端依赖配置
    ├── data/
    │   ├── pilot_1_1.json  # 原始数据
    │   └── img/            # 推文图片
    └── results/            # 自动生成的结果文件夹
        └── session_*.json  # 用户会话结果
```

## 🔧 API接口

- `POST /api/start-session` - 创建新会话
- `GET /api/session/:id/data` - 获取会话数据
- `POST /api/session/:id/submit` - 提交最终结果
- `GET /api/stats` - 服务器统计（包含题目分配平衡度）
- `GET /api/health` - 健康检查

## ⚠️ 重要说明

- **用户名唯一性**: 每个参与者姓名只能使用一次
- **数据精简**: 保存的结果文件不包含原始推文内容，仅保留用户评价数据
- **服务器重启**: 会清除内存中的活动会话，但已完成的结果永久保存
- **盲测机制**: 每个用户的Note A/B分配完全随机且独立
- **数据追踪**: 系统自动记录真实的笔记类型便于数据分析

---

**技术栈**: Node.js + Express.js + 原生JavaScript