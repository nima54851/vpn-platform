# 赛盾VPN平台 🛡️

完整的前后端 VPN 产品平台，支持用户注册/登录、套餐购买、节点管理、管理员后台。

## 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | React + Vite + React Router |
| 后端 | FastAPI (Python) |
| 数据库 | SQLite |
| 部署 | Docker / Railway / GitHub Pages |

## 快速开始

### 本地开发

```bash
# 后端
cd backend
pip install -r requirements.txt
python main.py
# 访问 http://localhost:8000

# 前端
cd frontend
npm install
npm run dev
# 访问 http://localhost:5173
```

### Docker 部署

```bash
docker build -t vpn-platform .
docker run -p 8000:8000 -v $(pwd)/data:/data vpn-platform
```

## 功能

### 用户端
- 🏠 着陆页（功能介绍、节点展示、定价）
- 📋 用户注册 / 登录
- 📊 个人后台（账户概览、流量查询）
- 🌐 节点列表（负载状态、一键连接）
- 🧾 订单管理（购买套餐、支付）
- 📥 客户端下载

### 管理员端
- 📊 数据仪表盘（用户、订单、收入）
- 👥 用户管理（设管理员、删除用户）
- 🌐 节点管理（添加、删除节点）
- 🧾 订单查看
- 💳 套餐管理
- 📥 下载链接管理

## 默认管理员账号

部署后，数据库会自动初始化。  
第一个注册的用户需手动设置管理员权限（通过数据库）：

```sql
UPDATE users SET is_admin=1 WHERE email='your@email.com';
```

## 接口文档

启动后端后访问：`http://localhost:8000/docs`（FastAPI 自动文档）

## 项目结构

```
vpn-platform/
├── backend/
│   ├── main.py          # FastAPI 主应用
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/       # Landing/UserDashboard/AdminDashboard
│   │   ├── api.js       # API 调用封装
│   │   └── index.css    # 全局样式
│   ├── vite.config.js
│   └── package.json
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 许可证

MIT License
