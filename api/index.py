import json, os, uuid, hashlib, secrets, datetime
from functools import wraps
from flask import Flask, jsonify, request

app = Flask(__name__)
DB_FILE = '/tmp/vpn_platform_db.json'

# ─── JSON 数据库 ───
def load_db():
    if os.path.exists(DB_FILE):
        with open(DB_FILE) as f:
            return json.load(f)
    return init_db()

def save_db(db):
    with open(DB_FILE, 'w') as f:
        json.dump(db, f, ensure_ascii=False)

def init_db():
    now = datetime.datetime.now().isoformat()
    db = {
        'users': [{
            'id': '705d46ae', 'username': '花百万',
            'email': 'wan_huaw@163.com',
            'password_hash': hashlib.sha256('Lingxi2025!'.encode()).hexdigest(),
            'is_admin': 1, 'plan': 'free', 'expires_at': None,
            'traffic_used_mb': 0, 'traffic_limit_mb': 5120,
            'created_at': now
        }],
        'plans': [
            {'id': 'free', 'name': '免费版', 'price_cny': 0, 'traffic_mb': 5120, 'duration_days': 7, 'features': ['基础节点', '512MB流量', '单设备'], 'active': 1},
            {'id': 'monthly', 'name': '月卡', 'price_cny': 29, 'traffic_mb': 102400, 'duration_days': 30, 'features': ['全部节点', '高速线路', '无限流量', '多设备'], 'active': 1},
            {'id': 'quarterly', 'name': '季卡', 'price_cny': 79, 'traffic_mb': 307200, 'duration_days': 90, 'features': ['全部节点', '高速线路', '无限流量', '多设备', '优先客服'], 'active': 1},
            {'id': 'yearly', 'name': '年卡', 'price_cny': 299, 'traffic_mb': 1228800, 'duration_days': 365, 'features': ['全部节点', '高速专线', '无限流量', '10设备', '专属客服', '优先线路'], 'active': 1},
        ],
        'nodes': [
            {'id': 'us-la', 'name': '🇺🇸 美国-洛杉矶', 'country': '美国', 'flag': '🇺🇸', 'ip': 'us-la.vpnsaidun.com', 'port': 443, 'protocol': 'vless', 'load_percent': 35, 'speed': '10Gbps', 'online': 1},
            {'id': 'jp-ty', 'name': '🇯🇵 日本-东京', 'country': '日本', 'flag': '🇯🇵', 'ip': 'jp-ty.vpnsaidun.com', 'port': 443, 'protocol': 'vless', 'load_percent': 52, 'speed': '10Gbps', 'online': 1},
            {'id': 'hk-sg', 'name': '🇭🇰 香港-优化', 'country': '香港', 'flag': '🇭🇰', 'ip': 'hk-sg.vpnsaidun.com', 'port': 443, 'protocol': 'vless', 'load_percent': 18, 'speed': '5Gbps', 'online': 1},
            {'id': 'sg-1', 'name': '🇸🇬 新加坡', 'country': '新加坡', 'flag': '🇸🇬', 'ip': 'sg-1.vpnsaidun.com', 'port': 443, 'protocol': 'vless', 'load_percent': 41, 'speed': '10Gbps', 'online': 1},
            {'id': 'kr-se', 'name': '🇰🇷 韩国-首尔', 'country': '韩国', 'flag': '🇰🇷', 'ip': 'kr-se.vpnsaidun.com', 'port': 443, 'protocol': 'vless', 'load_percent': 27, 'speed': '5Gbps', 'online': 1},
            {'id': 'uk-lo', 'name': '🇬🇧 英国-伦敦', 'country': '英国', 'flag': '🇬🇧', 'ip': 'uk-lo.vpnsaidun.com', 'port': 443, 'protocol': 'vless', 'load_percent': 60, 'speed': '3Gbps', 'online': 1},
        ],
        'orders': [],
        'downloads': [
            {'id': 'windows', 'platform': 'Windows', 'version': 'v2.1.0', 'url': 'https://cdn.vpnsaidun.com/windows/saidun-v2.1.0.exe', 'size_mb': 28.5, 'changelog': '优化连接速度，修复已知问题'},
            {'id': 'android', 'platform': 'Android', 'version': 'v2.1.0', 'url': 'https://cdn.vpnsaidun.com/android/saidun-v2.1.0.apk', 'size_mb': 18.2, 'changelog': '优化连接速度，修复已知问题'},
            {'id': 'ios', 'platform': 'iOS', 'version': 'v2.1.0', 'url': 'https://cdn.vpnsaidun.com/ios/saidun-v2.1.0.ipa', 'size_mb': 22.1, 'changelog': '优化连接速度，修复已知问题'},
            {'id': 'mac', 'platform': 'macOS', 'version': 'v2.1.0', 'url': 'https://cdn.vpnsaidun.com/mac/saidun-v2.1.0.dmg', 'size_mb': 35.7, 'changelog': '优化连接速度，修复已知问题'},
        ]
    }
    save_db(db)
    return db

db = load_db()

# ─── 工具函数 ───
def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def jwt_token(user):
    payload = f"{user['id']}:{user['email']}:{secrets.token_hex(16)}"
    import base64
    return base64.b64encode(payload.encode()).decode()

def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'detail': '未登录'}), 401
        db = load_db()
        try:
            import base64
            payload = base64.b64decode(token.encode()).decode()
            uid = payload.split(':')[0]
            user = next((u for u in db['users'] if u['id'] == uid), None)
            if not user:
                return jsonify({'detail': '用户不存在'}), 401
            request.current_user = user
            request.db = db
        except:
            return jsonify({'detail': 'Token无效'}), 401
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not getattr(request, 'current_user', None) or not request.current_user.get('is_admin'):
            return jsonify({'detail': '需要管理员权限'}), 403
        return f(*args, **kwargs)
    return decorated

# ─── 公开 API ───
@app.route('/api/status')
def status(): return jsonify({'status': 'ok', 'service': 'vpn-platform', 'version': '1.0.0'})

@app.route('/api/plans')
def plans(): return jsonify([p for p in load_db()['plans'] if p.get('active', 1)])

@app.route('/api/nodes')
def nodes(): return jsonify(load_db()['nodes'])

@app.route('/api/downloads')
def downloads(): return jsonify(load_db()['downloads'])

# ─── 认证 ───
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    db = load_db()
    if any(u['email'] == data['email'] for u in db['users']):
        return jsonify({'detail': '邮箱已注册'}), 400
    user = {
        'id': uuid.uuid4().hex[:8],
        'username': data.get('username', data['email'].split('@')[0]),
        'email': data['email'],
        'password_hash': hash_pw(data['password']),
        'is_admin': 0, 'plan': 'free',
        'expires_at': (datetime.datetime.now() + datetime.timedelta(days=7)).isoformat(),
        'traffic_used_mb': 0, 'traffic_limit_mb': 5120,
        'created_at': datetime.datetime.now().isoformat()
    }
    db['users'].append(user)
    save_db(db)
    return jsonify({'success': True, 'user_id': user['id'], 'token': jwt_token(user)})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    db = load_db()
    user = next((u for u in db['users'] if u['email'] == data['email']), None)
    if not user or user['password_hash'] != hash_pw(data['password']):
        return jsonify({'detail': '邮箱或密码错误'}), 401
    return jsonify({'success': True, 'token': jwt_token(user), 'user': {
        'id': user['id'], 'username': user['username'], 'email': user['email'],
        'plan': user['plan'], 'is_admin': user.get('is_admin', 0),
        'traffic_used_mb': user['traffic_used_mb'], 'traffic_limit_mb': user['traffic_limit_mb'],
        'expires_at': user.get('expires_at')
    }})

# ─── 用户 API ───
@app.route('/api/user/me')
@auth_required
def me():
    u = request.current_user
    return jsonify({'id': u['id'], 'username': u['username'], 'email': u['email'],
        'plan': u['plan'], 'is_admin': u.get('is_admin', 0),
        'traffic_used_mb': u['traffic_used_mb'], 'traffic_limit_mb': u['traffic_limit_mb'],
        'expires_at': u.get('expires_at')})

@app.route('/api/user/orders')
@auth_required
def user_orders():
    uid = request.current_user['id']
    orders = [o for o in request.db['orders'] if o['user_id'] == uid]
    return jsonify(orders)

@app.route('/api/orders', methods=['POST'])
@auth_required
def create_order():
    data = request.json
    plan = next((p for p in request.db['plans'] if p['id'] == data['plan_id']), None)
    if not plan:
        return jsonify({'detail': '套餐不存在'}), 404
    order = {
        'id': uuid.uuid4().hex[:8],
        'user_id': request.current_user['id'],
        'plan_id': plan['id'], 'plan_name': plan['name'],
        'amount': plan['price_cny'],
        'status': 'pending',
        'created_at': datetime.datetime.now().isoformat()
    }
    request.db['orders'].append(order)
    save_db(request.db)
    return jsonify({'success': True, 'order_id': order['id'], 'qr_url': f'/api/pay/{order["id"]}/qr'})

@app.route('/api/pay/<order_id>/qr')
def pay_qr(order_id):
    return jsonify({'qr_url': f'https://pay.vpnsaidun.com/qr/{order_id}', 'amount': 0.01})

@app.route('/api/pay/<order_id>/mock-complete', methods=['POST'])
@auth_required
def mock_pay(order_id):
    db = request.db
    order = next((o for o in db['orders'] if o['id'] == order_id and o['user_id'] == request.current_user['id']), None)
    if not order:
        return jsonify({'detail': '订单不存在'}), 404
    order['status'] = 'paid'
    plan = next((p for p in db['plans'] if p['id'] == order['plan_id']), None)
    if plan:
        user = next(u for u in db['users'] if u['id'] == request.current_user['id'])
        user['plan'] = plan['id']
        user['traffic_limit_mb'] = plan['traffic_mb']
        exp = datetime.datetime.fromisoformat(user.get('expires_at', datetime.datetime.now().isoformat()))
        if exp < datetime.datetime.now():
            exp = datetime.datetime.now()
        user['expires_at'] = (exp + datetime.timedelta(days=plan['duration_days'])).isoformat()
    save_db(db)
    return jsonify({'success': True})

# ─── 管理 API ───
@app.route('/api/admin/dashboard')
@auth_required
@admin_required
def admin_dashboard():
    db = request.db
    return jsonify({
        'total_users': len(db['users']),
        'total_orders': len(db['orders']),
        'paid_orders': len([o for o in db['orders'] if o['status'] == 'paid']),
        'total_revenue': sum(o['amount'] for o in db['orders'] if o['status'] == 'paid')
    })

@app.route('/api/admin/users')
@auth_required
@admin_required
def admin_users():
    return jsonify([{'id': u['id'], 'username': u['username'], 'email': u['email'],
        'plan': u['plan'], 'is_admin': u.get('is_admin', 0), 'created_at': u.get('created_at')}
        for u in request.db['users']])

@app.route('/api/admin/users/<uid>/set-admin', methods=['POST'])
@auth_required
@admin_required
def set_admin(uid):
    db = request.db
    user = next((u for u in db['users'] if u['id'] == uid), None)
    if not user: return jsonify({'detail': '用户不存在'}), 404
    user['is_admin'] = 1
    save_db(db)
    return jsonify({'success': True})

@app.route('/api/admin/orders')
@auth_required
@admin_required
def admin_orders():
    return jsonify(request.db['orders'])

@app.route('/api/admin/nodes', methods=['GET', 'POST'])
@auth_required
@admin_required
def admin_nodes():
    db = request.db
    if request.method == 'GET':
        return jsonify(db['nodes'])
    node = request.json
    node['id'] = node.get('id', uuid.uuid4().hex[:8])
    db['nodes'].append(node)
    save_db(db)
    return jsonify({'success': True})

@app.route('/api/admin/nodes/<nid>', methods=['DELETE'])
@auth_required
@admin_required
def delete_node(nid):
    db = request.db
    db['nodes'] = [n for n in db['nodes'] if n['id'] != nid]
    save_db(db)
    return jsonify({'success': True})

@app.route('/api/admin/plans')
@auth_required
@admin_required
def admin_plans():
    return jsonify(request.db['plans'])

@app.route('/api/admin/downloads')
@auth_required
@admin_required
def admin_downloads():
    return jsonify(request.db['downloads'])

@app.route('/api/admin/downloads', methods=['POST'])
@auth_required
@admin_required
def add_download():
    dl = request.json
    dl['id'] = dl.get('id', uuid.uuid4().hex[:8])
    request.db['downloads'].append(dl)
    save_db(request.db)
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8000)))
