"""
VPN Platform Backend - FastAPI
用户管理 / 套餐管理 / 节点管理 / 订单系统 / API 下载链接
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import sqlite3
import hashlib
import secrets
import uuid
import os
import json

app = FastAPI(title="赛盾VPN API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.environ.get("DB_PATH", "/data/vpn.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        plan TEXT DEFAULT 'free',
        expires_at TEXT,
        traffic_used_mb INTEGER DEFAULT 0,
        traffic_limit_mb INTEGER DEFAULT 5120,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price_cny REAL NOT NULL,
        price_usd REAL,
        traffic_mb INTEGER NOT NULL,
        duration_days INTEGER NOT NULL,
        features TEXT,
        sort_order INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        country TEXT NOT NULL,
        flag TEXT,
        ip TEXT NOT NULL,
        port INTEGER DEFAULT 443,
        protocol TEXT DEFAULT 'vless',
        load_percent INTEGER DEFAULT 0,
        speed TEXT DEFAULT '1Gbps',
        online INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        plan_id TEXT NOT NULL,
        amount_cny REAL NOT NULL,
        amount_usd REAL,
        status TEXT DEFAULT 'pending',
        pay_method TEXT,
        trade_no TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        paid_at TEXT
    );

    CREATE TABLE IF NOT EXISTS download_links (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        version TEXT NOT NULL,
        url TEXT NOT NULL,
        size_mb REAL,
        changelog TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        key TEXT UNIQUE NOT NULL,
        name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT
    );
    """)
    
    # 插入默认套餐
    cur.execute("SELECT COUNT(*) FROM plans").fetchone()[0] or cur.executemany(
        "INSERT INTO plans VALUES (?,?,?,?,?,?,?,?,?)",
        [
            (str(uuid.uuid4())[:8], "免费版", 0, 0, 5120, 7, json.dumps(["1个节点","基础速度","有限流量"]), 1, 1),
            (str(uuid.uuid4())[:8], "月卡", 29, 4, 102400, 30, json.dumps(["全部节点","高速线路","无限流量","多设备"]), 2, 1),
            (str(uuid.uuid4())[:8], "季卡", 79, 11, 307200, 90, json.dumps(["全部节点","高速线路","无限流量","多设备","优先客服"]), 3, 1),
            (str(uuid.uuid4())[:8], "年卡", 299, 41, 1228800, 365, json.dumps(["全部节点","高速专线","无限流量","10设备","专属客服","优先线路"]), 4, 1),
        ]
    )
    
    # 插入默认节点
    cur.execute("SELECT COUNT(*) FROM nodes").fetchone()[0] or cur.executemany(
        "INSERT INTO nodes (id, name, country, flag, ip, port, protocol, load_percent, speed, online) VALUES (?,?,?,?,?,?,?,?,?,?)",
        [
            (str(uuid.uuid4())[:8], "🇺🇸 美国-洛杉矶", "美国", "🇺🇸", "us-la.vpnsaidun.com", 443, "vless", 35, "10Gbps", 1),
            (str(uuid.uuid4())[:8], "🇯🇵 日本-东京", "日本", "🇯🇵", "jp-ty.vpnsaidun.com", 443, "vless", 52, "10Gbps", 1),
            (str(uuid.uuid4())[:8], "🇭🇰 香港-优化", "香港", "🇭🇰", "hk-sg.vpnsaidun.com", 443, "vless", 18, "5Gbps", 1),
            (str(uuid.uuid4())[:8], "🇸🇬 新加坡", "新加坡", "🇸🇬", "sg-1.vpnsaidun.com", 443, "vless", 41, "10Gbps", 1),
            (str(uuid.uuid4())[:8], "🇰🇷 韩国-首尔", "韩国", "🇰🇷", "kr-se.vpnsaidun.com", 443, "vless", 27, "5Gbps", 1),
            (str(uuid.uuid4())[:8], "🇬🇧 英国-伦敦", "英国", "🇬🇧", "uk-lo.vpnsaidun.com", 443, "vless", 60, "3Gbps", 1),
        ]
    )
    
    # 插入下载链接
    cur.execute("SELECT COUNT(*) FROM download_links").fetchone()[0] or cur.executemany(
        "INSERT INTO download_links (id, platform, version, url, size_mb, changelog, active) VALUES (?,?,?,?,?,?,?)",
        [
            (str(uuid.uuid4())[:8], "windows", "v2.1.0", "https://cdn.vpnsaidun.com/windows/saidun-v2.1.0.exe", 28.5, "优化连接速度，修复已知问题", 1),
            (str(uuid.uuid4())[:8], "android", "v2.1.0", "https://cdn.vpnsaidun.com/android/saidun-v2.1.0.apk", 18.2, "优化连接速度，修复已知问题", 1),
            (str(uuid.uuid4())[:8], "ios", "v2.1.0", "https://cdn.vpnsaidun.com/ios/saidun-v2.1.0.ipa", 22.1, "优化连接速度，修复已知问题", 1),
            (str(uuid.uuid4())[:8], "mac", "v2.1.0", "https://cdn.vpnsaidun.com/mac/saidun-v2.1.0.dmg", 35.7, "优化连接速度，修复已知问题", 1),
        ]
    )
    
    conn.commit()
    conn.close()
    print("✅ 数据库初始化完成")

init_db()

# ─── 密码工具 ───────────────────────────
def hash_pw(pw: str) -> str:
    return hashlib.sha256((pw + "saidun_salt_v1").encode()).hexdigest()

def gen_token() -> str:
    return secrets.token_urlsafe(32)

# ─── Pydantic 模型 ───────────────────────
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class OrderCreate(BaseModel):
    plan_id: str
    pay_method: str = "alipay"

class NodeCreate(BaseModel):
    name: str
    country: str
    flag: str
    ip: str
    port: int = 443
    protocol: str = "vless"

class DownloadLinkUpdate(BaseModel):
    platform: str
    version: str
    url: str
    size_mb: float
    changelog: str = ""

class PlanUpdate(BaseModel):
    name: str
    price_cny: float
    price_usd: float
    traffic_mb: int
    duration_days: int
    features: List[str]

# ─── 认证中间件 ───────────────────────────
def get_current_user(token: str = None):
    if not token:
        return None
    conn = get_db()
    cur = conn.cursor()
    row = cur.execute(
        "SELECT * FROM users WHERE id=(SELECT user_id FROM api_keys WHERE key=?) AND is_admin=0",
        (token,)
    ).fetchone()
    conn.close()
    if not row:
        return None
    return dict(row)

def get_current_admin(token: str = None):
    if not token:
        return None
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM users WHERE id=(SELECT user_id FROM api_keys WHERE key=?) AND is_admin=1",
        (token,)
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return dict(row)

# ─── 公开 API ─────────────────────────────
@app.get("/api/status")
def status():
    return {"status": "ok", "service": "vpn-platform", "version": "1.0.0"}

@app.get("/api/plans")
def list_plans():
    conn = get_db()
    rows = conn.execute("SELECT * FROM plans WHERE active=1 ORDER BY sort_order").fetchall()
    conn.close()
    return [{"id": r["id"], "name": r["name"], "price_cny": r["price_cny"],
             "price_usd": r["price_usd"], "traffic_mb": r["traffic_mb"],
             "duration_days": r["duration_days"], "features": json.loads(r["features"] or "[]")}
            for r in rows]

@app.get("/api/nodes")
def list_nodes():
    conn = get_db()
    rows = conn.execute("SELECT * FROM nodes WHERE online=1 ORDER BY load_percent").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/downloads")
def list_downloads():
    conn = get_db()
    rows = conn.execute("SELECT * FROM download_links WHERE active=1").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/auth/register")
def register(data: UserRegister):
    conn = get_db()
    cur = conn.cursor()
    exists = cur.execute("SELECT id FROM users WHERE email=? OR username=?",
                          (data.email, data.username)).fetchone()
    if exists:
        conn.close()
        raise HTTPException(status_code=400, detail="用户名或邮箱已存在")
    
    uid = str(uuid.uuid4())[:8]
    cur.execute(
        "INSERT INTO users (id, username, email, password_hash, plan, traffic_limit_mb, expires_at) VALUES (?,?,?,?,?,?,?)",
        (uid, data.username, data.email, hash_pw(data.password), "free", 5120,
         (datetime.now() + timedelta(days=7)).isoformat())
    )
    conn.commit()
    conn.close()
    return {"success": True, "user_id": uid, "message": "注册成功"}

@app.post("/api/auth/login")
def login(data: UserLogin):
    conn = get_db()
    cur = conn.cursor()
    user = cur.execute(
        "SELECT * FROM users WHERE email=?", (data.email,)
    ).fetchone()
    if not user or user["password_hash"] != hash_pw(data.password):
        conn.close()
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    
    token = gen_token()
    cur.execute("INSERT INTO api_keys (id, user_id, key) VALUES (?,?,?)",
                (str(uuid.uuid4())[:8], user["id"], token))
    conn.commit()
    conn.close()
    return {
        "token": token,
        "user": {"id": user["id"], "username": user["username"],
                 "email": user["email"], "plan": user["plan"],
                 "traffic_used_mb": user["traffic_used_mb"],
                 "traffic_limit_mb": user["traffic_limit_mb"],
                 "expires_at": user["expires_at"]}
    }

@app.get("/api/user/me")
def me(authorization: str = None):
    token = authorization.replace("Bearer ", "") if authorization else None
    user = get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="未登录")
    return {
        "id": user["id"], "username": user["username"],
        "email": user["email"], "plan": user["plan"],
        "traffic_used_mb": user["traffic_used_mb"],
        "traffic_limit_mb": user["traffic_limit_mb"],
        "expires_at": user["expires_at"],
        "is_admin": bool(user["is_admin"])
    }

@app.post("/api/orders")
def create_order(data: OrderCreate, authorization: str = None):
    token = authorization.replace("Bearer ", "") if authorization else None
    user = get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="请先登录")
    
    conn = get_db()
    plan = conn.execute("SELECT * FROM plans WHERE id=?", (data.plan_id,)).fetchone()
    if not plan:
        conn.close()
        raise HTTPException(status_code=404, detail="套餐不存在")
    
    order_id = str(uuid.uuid4())[:12]
    conn.execute(
        "INSERT INTO orders (id, user_id, plan_id, amount_cny, amount_usd, status, pay_method) VALUES (?,?,?,?,?,?,?)",
        (order_id, user["id"], data.plan_id, plan["price_cny"], plan["price_usd"], "pending", data.pay_method)
    )
    conn.commit()
    conn.close()
    return {
        "order_id": order_id,
        "amount_cny": plan["price_cny"],
        "amount_usd": plan["price_usd"],
        "qr_url": f"/api/pay/{order_id}/qr"
    }

@app.get("/api/pay/{order_id}/qr")
def get_pay_qr(order_id: str):
    conn = get_db()
    order = conn.execute("SELECT * FROM orders WHERE id=?", (order_id,)).fetchone()
    conn.close()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return {
        "order_id": order_id,
        "amount": order["amount_cny"],
        "qr_image": f"/static/qr/{order_id}.png",
        "mock_pay_url": f"/api/pay/{order_id}/mock-complete"
    }

@app.post("/api/pay/{order_id}/mock-complete")
def mock_pay(order_id: str, authorization: str = None):
    token = authorization.replace("Bearer ", "") if authorization else None
    user = get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="未登录")
    
    conn = get_db()
    order = conn.execute("SELECT * FROM orders WHERE id=? AND user_id=?", (order_id, user["id"])).fetchone()
    if not order:
        conn.close()
        raise HTTPException(status_code=404, detail="订单不存在")
    
    if order["status"] == "paid":
        conn.close()
        return {"success": True, "message": "已完成支付"}
    
    plan = conn.execute("SELECT * FROM plans WHERE id=?", (order["plan_id"],)).fetchone()
    expires = datetime.fromisoformat(user["expires_at"]) if user["expires_at"] else datetime.now()
    new_expires = max(expires, datetime.now()) + timedelta(days=plan["duration_days"])
    
    conn.execute("UPDATE orders SET status='paid', paid_at=? WHERE id=?", (datetime.now().isoformat(), order_id))
    conn.execute("UPDATE users SET plan=?, expires_at=?, traffic_limit_mb=? WHERE id=?",
                 (plan["name"], new_expires.isoformat(), plan["traffic_mb"], user["id"]))
    conn.commit()
    conn.close()
    return {"success": True, "message": "支付成功！套餐已激活"}

@app.get("/api/user/orders")
def my_orders(authorization: str = None):
    token = authorization.replace("Bearer ", "") if authorization else None
    user = get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="未登录")
    
    conn = get_db()
    rows = conn.execute(
        "SELECT o.*, p.name as plan_name FROM orders o LEFT JOIN plans p ON o.plan_id=p.id WHERE o.user_id=? ORDER BY o.created_at DESC",
        (user["id"],)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

# ─── 管理员 API ────────────────────────────
@app.get("/api/admin/dashboard")
def admin_dashboard(authorization: str = None):
    try:
        admin = get_current_admin(authorization.replace("Bearer ", "") if authorization else None)
    except HTTPException:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    
    conn = get_db()
    total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    total_orders = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
    paid_orders = conn.execute("SELECT COUNT(*) FROM orders WHERE status='paid'").fetchone()[0]
    revenue = conn.execute("SELECT COALESCE(SUM(amount_cny),0) FROM orders WHERE status='paid'").fetchone()[0]
    total_nodes = conn.execute("SELECT COUNT(*) FROM nodes").fetchone()[0]
    online_nodes = conn.execute("SELECT COUNT(*) FROM nodes WHERE online=1").fetchone()[0]
    conn.close()
    return {
        "total_users": total_users, "total_orders": total_orders,
        "paid_orders": paid_orders, "revenue_cny": revenue,
        "total_nodes": total_nodes, "online_nodes": online_nodes
    }

@app.get("/api/admin/users")
def admin_users(authorization: str = None):
    try:
        admin = get_current_admin(authorization.replace("Bearer ", "") if authorization else None)
    except HTTPException:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    conn = get_db()
    rows = conn.execute("SELECT id, username, email, plan, traffic_used_mb, traffic_limit_mb, expires_at, created_at, is_admin FROM users ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/admin/users/{uid}/set-admin")
def set_admin(uid: str, authorization: str = None):
    try:
        admin = get_current_admin(authorization.replace("Bearer ", "") if authorization else None)
    except HTTPException:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    conn = get_db()
    conn.execute("UPDATE users SET is_admin=1 WHERE id=?", (uid,))
    conn.commit()
    conn.close()
    return {"success": True}

@app.delete("/api/admin/users/{uid}")
def delete_user(uid: str, authorization: str = None):
    try:
        admin = get_current_admin(authorization.replace("Bearer ", "") if authorization else None)
    except HTTPException:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    conn = get_db()
    conn.execute("DELETE FROM users WHERE id=? AND is_admin=0", (uid,))
    conn.commit()
    conn.close()
    return {"success": True}

@app.get("/api/admin/nodes")
def admin_nodes(authorization: str = None):
    try:
        admin = get_current_admin(authorization.replace("Bearer ", "") if authorization else None)
    except HTTPException:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    conn = get_db()
    rows = conn.execute("SELECT * FROM nodes ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/admin/nodes")
def add_node(data: NodeCreate, authorization: str = None):
    try:
        admin = get_current_admin(authorization.replace("Bearer ", "") if authorization else None)
    except HTTPException:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    nid = str(uuid.uuid4())[:8]
    conn = get_db()
    conn.execute(
        "INSERT INTO nodes (id, name, country, flag, ip, port, protocol) VALUES (?,?,?,?,?,?,?)",
        (nid, data.name, data.country, data.flag, data.ip, data.port, data.protocol)
    )
    conn.commit()
    conn.close()
    return {"success": True, "id": nid}

@app.delete("/api/admin/nodes/{nid}")
def delete_node(nid: str, authorization: str = None):
    try:
        admin = get_current_admin(authorization.replace("Bearer ", "") if authorization else None)
    except HTTPException:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    conn = get_db()
    conn.execute("DELETE FROM nodes WHERE id=?", (nid,))
    conn.commit()
    conn.close()
    return {"success": True}

@app.get("/api/admin/orders")
def admin_orders(authorization: str = None):
    try:
        admin = get_current_admin(authorization.replace("Bearer ", "") if authorization else None)
    except HTTPException:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    conn = get_db()
    rows = conn.execute(
        "SELECT o.*, u.username, p.name as plan_name FROM orders o LEFT JOIN users u ON o.user_id=u.id LEFT JOIN plans p ON o.plan_id=p.id ORDER BY o.created_at DESC LIMIT 200"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/admin/plans")
def admin_plans(authorization: str = None):
    try:
        admin = get_current_admin(authorization.replace("Bearer ", "") if authorization else None)
    except HTTPException:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    conn = get_db()
    rows = conn.execute("SELECT * FROM plans ORDER BY sort_order").fetchall()
    conn.close()
    return [{"id": r["id"], "name": r["name"], "price_cny": r["price_cny"],
             "price_usd": r["price_usd"], "traffic_mb": r["traffic_mb"],
             "duration_days": r["duration_days"],
             "features": json.loads(r["features"] or "[]"),
             "active": r["active"]} for r in rows]

@app.post("/api/admin/downloads")
def update_download(data: DownloadLinkUpdate, authorization: str = None):
    try:
        admin = get_current_admin(authorization.replace("Bearer ", "") if authorization else None)
    except HTTPException:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    conn = get_db()
    cur = conn.cursor()
    existing = cur.execute("SELECT id FROM download_links WHERE platform=?", (data.platform,)).fetchone()
    if existing:
        cur.execute("UPDATE download_links SET version=?, url=?, size_mb=?, changelog=? WHERE platform=?",
                    (data.version, data.url, data.size_mb, data.changelog, data.platform))
    else:
        cur.execute("INSERT INTO download_links (id, platform, version, url, size_mb, changelog) VALUES (?,?,?,?,?,?)",
                    (str(uuid.uuid4())[:8], data.platform, data.version, data.url, data.size_mb, data.changelog))
    conn.commit()
    conn.close()
    return {"success": True}

# ─── 健康检查 & 启动 ──────────────────────
@app.get("/health")
def health():
    return {"ok": True, "time": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
