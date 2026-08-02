import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { vpnApi } from '../api'

function Sidebar({ page, setPage }) {
  const navigate = useNavigate()
  function logout() {
    localStorage.removeItem('vpn_token')
    localStorage.removeItem('vpn_user')
    navigate('/')
  }
  const links = [
    { id: 'dashboard', label: '📊 数据概览' },
    { id: 'users', label: '👥 用户管理' },
    { id: 'nodes', label: '🌐 节点管理' },
    { id: 'orders', label: '🧾 订单管理' },
    { id: 'plans', label: '💳 套餐管理' },
    { id: 'downloads', label: '📥 下载管理' },
  ]
  return (
    <div className="sidebar">
      <div className="sidebar-logo">🛡️ 管理后台</div>
      {links.map(l => (
        <div key={l.id} className={`sidebar-link ${page === l.id ? 'active' : ''}`}
          onClick={() => setPage(l.id)}>{l.label}</div>
      ))}
      <div className="sidebar-bottom">
        <div className="sidebar-link" onClick={() => navigate('/dashboard')}>👤 用户后台</div>
        <div className="sidebar-link" onClick={() => navigate('/')}>🏠 返回首页</div>
        <div className="sidebar-link" onClick={logout} style={{ color: 'var(--red)' }}>🚪 退出</div>
      </div>
    </div>
  )
}

function DashboardPage() {
  const [stats, setStats] = useState({})
  useEffect(() => { vpnApi.adminDashboard().then(setStats).catch(() => {}) }, [])
  return (
    <div>
      <div className="page-header">
        <div className="page-title">📊 数据概览</div>
        <div className="page-sub">平台运营数据总览</div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">👥</div>
          <div className="stat-card-num">{stats.total_users || 0}</div>
          <div className="stat-card-label">注册用户</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🧾</div>
          <div className="stat-card-num">{stats.total_orders || 0}</div>
          <div className="stat-card-label">总订单数</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">✅</div>
          <div className="stat-card-num" style={{ color: 'var(--green)' }}>{stats.paid_orders || 0}</div>
          <div className="stat-card-label">已支付订单</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">💰</div>
          <div className="stat-card-num" style={{ color: 'var(--accent2)' }}>¥{stats.revenue || 0}</div>
          <div className="stat-card-label">总收入 (CNY)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🌐</div>
          <div className="stat-card-num">{stats.online_nodes || 0}/{stats.total_nodes || 0}</div>
          <div className="stat-card-label">在线节点</div>
        </div>
      </div>
    </div>
  )
}

function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    vpnApi.adminUsers().then(u => { setUsers(u); setLoading(false) }).catch(() => setLoading(false))
  }, [])
  async function setAdmin(uid) {
    if (!confirm('确认将此用户设为管理员？')) return
    await vpnApi.setAdmin(uid)
    vpnApi.adminUsers().then(setUsers).catch(() => {})
  }
  async function deleteUser(uid) {
    if (!confirm('确认删除此用户？')) return
    await vpnApi.deleteUser(uid)
    setUsers(users.filter(u => u.id !== uid))
  }
  return (
    <div>
      <div className="page-header">
        <div className="page-title">👥 用户管理</div>
        <div className="page-sub">共 {users.length} 位注册用户</div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>ID</th><th>用户名</th><th>邮箱</th><th>套餐</th><th>流量</th><th>到期日</th><th>注册时间</th><th>操作</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32 }}>加载中...</td></tr>
             : users.map(u => (
              <tr key={u.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{u.id}</td>
                <td style={{ fontWeight: 600 }}>{u.username}</td>
                <td style={{ fontSize: 13, color: 'var(--text2)' }}>{u.email}</td>
                <td><span className={`badge ${u.plan === 'free' ? 'badge-yellow' : 'badge-green'}`}>{u.plan}</span></td>
                <td style={{ fontSize: 13 }}>{u.traffic_used_mb || 0} / {u.traffic_limit_mb || 0} MB</td>
                <td style={{ fontSize: 13, color: 'var(--text2)' }}>{u.expires_at ? new Date(u.expires_at).toLocaleDateString('zh-CN') : '-'}</td>
                <td style={{ fontSize: 13, color: 'var(--muted)' }}>{new Date(u.created_at).toLocaleDateString('zh-CN')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!u.is_admin && <button className="btn btn-outline btn-sm" onClick={() => setAdmin(u.id)}>设管理</button>}
                    {!u.is_admin && <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>删除</button>}
                    {u.is_admin && <span className="badge badge-blue">管理员</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function NodesAdminPage() {
  const [nodes, setNodes] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', country: '', flag: '', ip: '', port: 443, protocol: 'vless' })
  useEffect(() => { vpnApi.adminNodes().then(setNodes).catch(() => {}) }, [])
  async function addNode() {
    if (!form.name || !form.ip) return alert('请填写节点名称和IP')
    await vpnApi.addNode(form)
    vpnApi.adminNodes().then(setNodes).catch(() => {})
    setShowAdd(false)
    setForm({ name: '', country: '', flag: '', ip: '', port: 443, protocol: 'vless' })
  }
  async function deleteNode(nid) {
    if (!confirm('确认删除此节点？')) return
    await vpnApi.deleteNode(nid)
    setNodes(nodes.filter(n => n.id !== nid))
  }
  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="page-title">🌐 节点管理</div>
            <div className="page-sub">共 {nodes.length} 个节点</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ 添加节点</button>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>ID</th><th>名称</th><th>国家</th><th>IP:端口</th><th>协议</th><th>负载</th><th>速度</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            {nodes.map(n => (
              <tr key={n.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{n.id}</td>
                <td>{n.flag} {n.name}</td>
                <td>{n.country}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{n.ip}:{n.port}</td>
                <td>{n.protocol?.toUpperCase()}</td>
                <td>
                  <div className="load-bar" style={{ width: 60 }}>
                    <div className="load-fill" style={{ width: `${n.load_percent}%` }} />
                  </div>
                  <span style={{ fontSize: 12 }}>{n.load_percent}%</span>
                </td>
                <td>{n.speed}</td>
                <td><span className={`badge ${n.online ? 'badge-green' : 'badge-red'}`}>{n.online ? '在线' : '离线'}</span></td>
                <td><button className="btn btn-danger btn-sm" onClick={() => deleteNode(n.id)}>删除</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">+ 添加新节点</div>
            {[
              { label: '节点名称', key: 'name', placeholder: '🇺🇸 美国-洛杉矶' },
              { label: '国家', key: 'country', placeholder: '美国' },
              { label: '国旗emoji', key: 'flag', placeholder: '🇺🇸' },
              { label: '服务器IP', key: 'ip', placeholder: 'us-la.vpnsaidun.com' },
              { label: '端口', key: 'port', type: 'number' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                <input className="input" placeholder={f.placeholder} type={f.type || 'text'}
                  value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">协议</label>
              <select className="input" value={form.protocol} onChange={e => setForm({ ...form, protocol: e.target.value })}>
                <option value="vless">VLESS</option><option value="vmess">VMess</option><option value="trojan">Trojan</option><option value="ss">Shadowsocks</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowAdd(false)}>取消</button>
              <button className="btn btn-primary" onClick={addNode}>确认添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OrdersAdminPage() {
  const [orders, setOrders] = useState([])
  useEffect(() => { vpnApi.adminOrders().then(setOrders).catch(() => {}) }, [])
  const statusMap = { pending: ['待支付', 'badge-yellow'], paid: ['已支付', 'badge-green'], cancelled: ['已取消', 'badge-red'] }
  return (
    <div>
      <div className="page-header">
        <div className="page-title">🧾 订单管理</div>
        <div className="page-sub">共 {orders.length} 条订单</div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>订单号</th><th>用户</th><th>套餐</th><th>金额</th><th>支付方式</th><th>状态</th><th>下单时间</th><th>支付时间</th></tr></thead>
          <tbody>
            {orders.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>暂无订单</td></tr>
             : orders.map(o => {
               const [s, cls] = statusMap[o.status] || [o.status, 'badge-blue']
               return (
                 <tr key={o.id}>
                   <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{o.id}</td>
                   <td style={{ fontWeight: 600 }}>{o.username || '-'}</td>
                   <td>{o.plan_name || '-'}</td>
                   <td style={{ color: 'var(--green)', fontWeight: 600 }}>¥{o.amount_cny}</td>
                   <td>{o.pay_method || '-'}</td>
                   <td><span className={`badge ${cls}`}>{s}</span></td>
                   <td style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(o.created_at).toLocaleString('zh-CN')}</td>
                   <td style={{ fontSize: 12, color: 'var(--muted)' }}>{o.paid_at ? new Date(o.paid_at).toLocaleString('zh-CN') : '-'}</td>
                 </tr>
               )
             })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PlansAdminPage() {
  const [plans, setPlans] = useState([])
  useEffect(() => { vpnApi.adminPlans().then(setPlans).catch(() => {}) }, [])
  return (
    <div>
      <div className="page-header">
        <div className="page-title">💳 套餐管理</div>
        <div className="page-sub">当前套餐列表（套餐编辑需直接修改数据库）</div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>ID</th><th>名称</th><th>价格 (CNY)</th><th>价格 (USD)</th><th>流量</th><th>时长</th><th>状态</th></tr></thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{p.id}</td>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td style={{ color: 'var(--green)', fontWeight: 600 }}>¥{p.price_cny}</td>
                <td>${p.price_usd || 0}</td>
                <td>{p.traffic_mb/1024} GB</td>
                <td>{p.duration_days} 天</td>
                <td><span className={`badge ${p.active ? 'badge-green' : 'badge-red'}`}>{p.active ? '启用' : '禁用'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DownloadsAdminPage() {
  const [downloads, setDownloads] = useState([])
  const [form, setForm] = useState({ platform: 'windows', version: 'v2.1.0', url: '', size_mb: 0, changelog: '' })
  useEffect(() => { vpnApi.downloads().then(setDownloads).catch(() => {}) }, [])
  async function update() {
    if (!form.url) return alert('请填写下载链接')
    await vpnApi.updateDownload(form)
    vpnApi.downloads().then(setDownloads).catch(() => {})
    alert('更新成功')
  }
  const icons = { windows: '🪟', android: '📱', ios: '🍎', mac: '💻' }
  return (
    <div>
      <div className="page-header">
        <div className="page-title">📥 下载链接管理</div>
        <div className="page-sub">更新各平台的客户端下载地址</div>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 20 }}>更新下载链接</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">平台</label>
            <select className="input" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
              <option value="windows">Windows</option><option value="android">Android</option>
              <option value="ios">iOS</option><option value="mac">macOS</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">版本号</label>
            <input className="input" placeholder="v2.1.0" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} />
          </div>
          <div className="form-group" style={{ gridColumn: '1/-1' }}>
            <label className="form-label">下载链接</label>
            <input className="input" placeholder="https://cdn.example.com/saidun-v2.1.0.exe" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">文件大小 (MB)</label>
            <input className="input" type="number" placeholder="28.5" value={form.size_mb} onChange={e => setForm({ ...form, size_mb: parseFloat(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="form-label">更新日志</label>
            <input className="input" placeholder="优化连接速度" value={form.changelog} onChange={e => setForm({ ...form, changelog: e.target.value })} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={update} style={{ marginTop: 16 }}>💾 保存更新</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>平台</th><th>版本</th><th>大小</th><th>更新日志</th><th>链接</th></tr></thead>
          <tbody>
            {downloads.map(d => (
              <tr key={d.id}>
                <td>{icons[d.platform]} {d.platform}</td>
                <td>{d.version}</td>
                <td>{d.size_mb} MB</td>
                <td style={{ fontSize: 13, color: 'var(--text2)' }}>{d.changelog || '-'}</td>
                <td style={{ fontSize: 12, fontFamily: 'monospace', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.url}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [page, setPage] = useState('dashboard')
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('vpn_user') || '{}')
    if (!localStorage.getItem('vpn_token') || !user.is_admin) navigate('/')
  }, [])

  return (
    <div className="dashboard-layout">
      <Sidebar page={page} setPage={setPage} />
      <main className="main-content">
        {page === 'dashboard' && <DashboardPage />}
        {page === 'users' && <UsersPage />}
        {page === 'nodes' && <NodesAdminPage />}
        {page === 'orders' && <OrdersAdminPage />}
        {page === 'plans' && <PlansAdminPage />}
        {page === 'downloads' && <DownloadsAdminPage />}
      </main>
    </div>
  )
}
