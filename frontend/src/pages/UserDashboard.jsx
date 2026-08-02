import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { vpnApi } from '../api'

function Sidebar({ page, setPage }) {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('vpn_user') || '{}')
  const isAdmin = !!user.is_admin

  function logout() {
    localStorage.removeItem('vpn_token')
    localStorage.removeItem('vpn_user')
    navigate('/')
  }

  const links = [
    { id: 'home', label: '📊 概览', icon: '📊' },
    { id: 'nodes', label: '🌐 线路节点', icon: '🌐' },
    { id: 'orders', label: '🧾 我的订单', icon: '🧾' },
    { id: 'downloads', label: '📥 下载客户端', icon: '📥' },
  ]
  if (isAdmin) links.push({ id: 'admin', label: '⚙️ 管理后台', icon: '⚙️' })

  return (
    <div className="sidebar">
      <div className="sidebar-logo">🛡️ 赛盾VPN</div>
      {links.map(l => (
        <div key={l.id} className={`sidebar-link ${page === l.id ? 'active' : ''}`}
          onClick={() => { if (l.id === 'admin') navigate('/admin'); else setPage(l.id) }}>
          {l.label}
        </div>
      ))}
      <div className="sidebar-bottom">
        <div className="sidebar-link" onClick={() => navigate('/')}>🏠 返回首页</div>
        <div className="sidebar-link" onClick={logout} style={{ color: 'var(--red)' }}>🚪 退出登录</div>
      </div>
    </div>
  )
}

function TrafficBar({ used, limit }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)' }}>
        <span>{used} MB</span><span>{limit} MB</span>
      </div>
      <div className="traffic-bar">
        <div className={`traffic-fill ${pct > 80 ? 'warn' : ''}`} style={{ width: `${pct}%` }} />
      </div>
      <div style={{ fontSize: 12, color: pct > 80 ? 'var(--red)' : 'var(--green)', marginTop: 4 }}>
        已用 {pct.toFixed(1)}%
      </div>
    </div>
  )
}

function HomePage({ user, setUser }) {
  const [orders, setOrders] = useState([])
  useEffect(() => {
    vpnApi.me().then(setUser).catch(() => {})
    vpnApi.orders().then(setOrders).catch(() => {})
  }, [])
  const paidOrders = orders.filter(o => o.status === 'paid')
  const expires = user.expires_at ? new Date(user.expires_at) : null
  const daysLeft = expires ? Math.max(0, Math.ceil((expires - Date.now()) / 86400000)) : 0

  return (
    <div>
      <div className="page-header">
        <div className="page-title">👋 你好，{user.username || '用户'}</div>
        <div className="page-sub">这里是您的账户概览</div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon">🏷️</div>
          <div className="stat-card-num" style={{ color: user.plan === 'free' ? 'var(--yellow)' : 'var(--green)' }}>{user.plan || 'free'}</div>
          <div className="stat-card-label">当前套餐</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">⏰</div>
          <div className="stat-card-num" style={{ color: daysLeft < 3 ? 'var(--red)' : 'var(--accent2)' }}>{daysLeft}</div>
          <div className="stat-card-label">剩余天数</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🧾</div>
          <div className="stat-card-num">{paidOrders.length}</div>
          <div className="stat-card-label">已购订单</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📡</div>
          <div className="stat-card-num" style={{ color: 'var(--green)' }}>50+</div>
          <div className="stat-card-label">可用节点</div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📊 流量使用</div>
        <TrafficBar used={user.traffic_used_mb || 0} limit={user.traffic_limit_mb || 5120} />
      </div>
      {user.plan === 'free' && (
        <div className="card" style={{ borderColor: 'var(--accent)', background: 'rgba(59,130,246,0.06)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>🚀 升级套餐，解锁全部功能</div>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16 }}>免费版仅 7 天试用期，节点有限。升级月卡/季卡/年卡，享受全部高速节点和无限流量。</p>
          <Link to="/pricing"><button className="btn btn-primary">查看套餐</button></Link>
        </div>
      )}
    </div>
  )
}

function NodesPage({ user }) {
  const [nodes, setNodes] = useState([])
  useEffect(() => { vpnApi.nodes().then(setNodes).catch(() => {}) }, [])

  return (
    <div>
      <div className="page-header">
        <div className="page-title">🌐 线路节点</div>
        <div className="page-sub">选择最优节点，一键连接</div>
      </div>
      <div className="nodes-grid">
        {nodes.map(n => {
          const loadColor = n.load_percent < 40 ? 'var(--green)' : n.load_percent < 70 ? 'var(--yellow)' : 'var(--red)'
          return (
            <div key={n.id} className="node-card">
              <div className="node-header">
                <span className="node-name">{n.name}</span>
                <span className="node-flag">{n.flag}</span>
              </div>
              <div className="node-info">
                <span>⚡ {n.speed}</span>
                <span>📡 {n.protocol?.toUpperCase()}</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: loadColor, fontSize: 12 }}>负载 {n.load_percent}%</span>
                  <span className={`badge ${n.online ? 'badge-green' : 'badge-red'}`}>{n.online ? '在线' : '离线'}</span>
                </div>
                <div className="load-bar">
                  <div className="load-fill" style={{ width: `${n.load_percent}%` }} />
                </div>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 8, width: '100%' }}
                  onClick={() => alert(`节点配置:\nIP: ${n.ip}:${n.port}\n协议: ${n.protocol}\n\n请在客户端中手动添加此节点`)}>
                  连接
                </button>
              </div>
            </div>
          )
        })}
      </div>
      {nodes.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <div style={{ fontSize: 48 }}>🔄</div>
          <p>加载节点中...</p>
        </div>
      )}
    </div>
  )
}

function OrdersPage({ user, setUser }) {
  const [orders, setOrders] = useState([])
  const [plans, setPlans] = useState([])
  const [showBuy, setShowBuy] = useState(false)
  const [paying, setPaying] = useState(null)
  useEffect(() => {
    vpnApi.orders().then(setOrders).catch(() => {})
    vpnApi.plans().then(setPlans).catch(() => {})
  }, [])

  async function buyPlan(plan) {
    setPaying(plan.id)
    try {
      const order = await vpnApi.createOrder({ plan_id: plan.id })
      const qr = await vpnApi.payQr(order.order_id)
      if (confirm(`订单 #${order.order_id}\n金额：¥${order.amount_cny}\n\n确认支付？（模拟支付）`)) {
        await vpnApi.mockPay(order.order_id)
        alert('✅ 支付成功！套餐已激活')
        vpnApi.me().then(setUser).catch(() => {})
        vpnApi.orders().then(setOrders).catch(() => {})
      }
    } catch (e) {
      alert('下单失败：' + e.message)
    } finally {
      setPaying(null)
      setShowBuy(false)
    }
  }

  const statusMap = { pending: ['待支付', 'badge-yellow'], paid: ['已支付', 'badge-green'], cancelled: ['已取消', 'badge-red'] }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="page-title">🧾 我的订单</div>
            <div className="page-sub">查看和管理你的购买记录</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowBuy(true)}>🛒 购买套餐</button>
        </div>
      </div>
      <div className="table-wrap card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead><tr><th>订单号</th><th>套餐</th><th>金额</th><th>支付方式</th><th>状态</th><th>时间</th></tr></thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 32 }}>暂无订单记录</td></tr>
            ) : orders.map(o => {
              const [s, cls] = statusMap[o.status] || [o.status, 'badge-blue']
              return (
                <tr key={o.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>#{o.id}</td>
                  <td>{o.plan_name || o.plan_id}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>¥{o.amount_cny}</td>
                  <td>{o.pay_method || '-'}</td>
                  <td><span className={`badge ${cls}`}>{s}</span></td>
                  <td style={{ fontSize: 13, color: 'var(--muted)' }}>{new Date(o.created_at).toLocaleString('zh-CN')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Buy Modal */}
      {showBuy && (
        <div className="modal-overlay" onClick={() => setShowBuy(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🛒 选择套餐</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {plans.map(p => (
                <div key={p.id} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius2)', padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>{p.duration_days}天 · {p.traffic_mb/1024}GB 流量</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent2)' }}>¥{p.price_cny}</div>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 4 }}
                      onClick={() => buyPlan(p)} disabled={paying === p.id}>
                      {paying === p.id ? '处理中...' : '购买'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowBuy(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DownloadsPage() {
  const [downloads, setDownloads] = useState([])
  useEffect(() => { vpnApi.downloads().then(setDownloads).catch(() => {}) }, [])
  const icons = { windows: '🪟', android: '📱', ios: '🍎', mac: '💻' }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">📥 下载客户端</div>
        <div className="page-sub">选择你的设备平台，下载最新版本</div>
      </div>
      <div className="download-grid" style={{ maxWidth: '100%' }}>
        {downloads.length > 0 ? downloads.map(d => (
          <div key={d.id} className="dl-card" onClick={() => window.open(d.url, '_blank')}>
            <div className="dl-icon">{icons[d.platform] || '📦'}</div>
            <div className="dl-name">{d.platform === 'windows' ? 'Windows' : d.platform === 'android' ? 'Android' : d.platform === 'ios' ? 'iOS' : 'macOS'}</div>
            <div className="dl-version">v{d.version}</div>
            {d.size_mb && <div className="dl-size">{d.size_mb} MB</div>}
            {d.changelog && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8 }}>{d.changelog}</div>}
          </div>
        )) : [
          { platform: 'windows', name: 'Windows', version: 'v2.1.0', size: '28.5 MB', url: '#' },
          { platform: 'android', name: 'Android', version: 'v2.1.0', size: '18.2 MB', url: '#' },
          { platform: 'ios', name: 'iOS', version: 'v2.1.0', size: '22.1 MB', url: '#' },
          { platform: 'mac', name: 'macOS', version: 'v2.1.0', size: '35.7 MB', url: '#' },
        ].map(d => (
          <div key={d.platform} className="dl-card" onClick={() => alert('客户端下载链接配置中，请稍候')}>
            <div className="dl-icon">{icons[d.platform]}</div>
            <div className="dl-name">{d.name}</div>
            <div className="dl-version">{d.version}</div>
            <div className="dl-size">{d.size}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function UserDashboard() {
  const navigate = useNavigate()
  const [page, setPage] = useState('home')
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('vpn_user') || '{}'))

  useEffect(() => {
    if (!localStorage.getItem('vpn_token')) {
      navigate('/login')
    } else {
      vpnApi.me().then(u => {
        setUser(u)
        localStorage.setItem('vpn_user', JSON.stringify(u))
      }).catch(() => {
        localStorage.removeItem('vpn_token')
        localStorage.removeItem('vpn_user')
        navigate('/login')
      })
    }
  }, [])

  return (
    <div className="dashboard-layout">
      <Sidebar page={page} setPage={setPage} />
      <main className="main-content">
        {page === 'home' && <HomePage user={user} setUser={setUser} />}
        {page === 'nodes' && <NodesPage user={user} />}
        {page === 'orders' && <OrdersPage user={user} setUser={setUser} />}
        {page === 'downloads' && <DownloadsPage />}
      </main>
    </div>
  )
}
