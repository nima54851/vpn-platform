import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { vpnApi } from '../api'

const NAV_LINKS = [
  { label: '功能', href: '#features' },
  { label: '线路节点', href: '#nodes' },
  { label: '定价', href: '/pricing' },
  { label: '下载', href: '#download' },
]

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  )
}

function NodeCard({ node }) {
  const loadColor = node.load_percent < 40 ? '#10b981' : node.load_percent < 70 ? '#f59e0b' : '#ef4444'
  return (
    <div className="node-card">
      <div className="node-header">
        <span className="node-name">{node.name}</span>
        <span className="node-flag">{node.flag || '🌐'}</span>
      </div>
      <div className="node-info">
        <span>⚡ 速度 {node.speed}</span>
        <span>📡 {node.protocol?.toUpperCase()}</span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: loadColor }}>
          <span>负载 {node.load_percent}%</span>
          <span className={`badge ${node.online ? 'badge-green' : 'badge-red'}`}>
            {node.online ? '在线' : '离线'}
          </span>
        </div>
        <div className="load-bar">
          <div className="load-fill" style={{ width: `${node.load_percent}%` }} />
        </div>
      </div>
    </div>
  )
}

function DlCard({ dl }) {
  const icons = { windows: '🪟', android: '📱', ios: '🍎', mac: '💻' }
  return (
    <div className="dl-card" onClick={() => window.open(dl.url, '_blank')}>
      <div className="dl-icon">{icons[dl.platform] || '📦'}</div>
      <div className="dl-name">{dl.platform === 'windows' ? 'Windows' : dl.platform === 'android' ? 'Android' : dl.platform === 'ios' ? 'iOS' : 'macOS'}</div>
      <div className="dl-version">v{dl.version}</div>
      {dl.size_mb && <div className="dl-size">{dl.size_mb} MB</div>}
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('vpn_token')
  const [plans, setPlans] = useState([])
  const [nodes, setNodes] = useState([])
  const [downloads, setDownloads] = useState([])

  useEffect(() => {
    vpnApi.plans().then(setPlans).catch(() => {})
    vpnApi.nodes().then(setNodes).catch(() => {})
    vpnApi.downloads().then(setDownloads).catch(() => {})
  }, [])

  return (
    <div>
      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo">🛡️ 赛盾VPN</div>
          <ul className="nav-links">
            {NAV_LINKS.map(l => (
              <li key={l.label}><a href={l.href}>{l.label}</a></li>
            ))}
          </ul>
          <div className="nav-actions">
            {isLoggedIn ? (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>我的后台</button>
            ) : (
              <>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>登录</button>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>注册</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-emoji">🛡️</div>
        <h1>安全畅游<span>全球网络</span></h1>
        <p>银行级加密，零日志政策，全球高速专线，一键连接。支持所有主流设备，终身免费试用。</p>
        <div className="hero-btns">
          <button className="btn btn-primary btn-lg" onClick={() => document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' })}>
            🚀 立即下载
          </button>
          <button className="btn btn-outline btn-lg" onClick={() => navigate('/pricing')}>
            💳 查看套餐
          </button>
        </div>
        <div className="stats">
          <div className="stat"><div className="stat-num">38,562</div><div className="stat-label">活跃用户</div></div>
          <div className="stat"><div className="stat-num">50+</div><div className="stat-label">高速节点</div></div>
          <div className="stat"><div className="stat-num">99.9%</div><div className="stat-label">在线率</div></div>
          <div className="stat"><div className="stat-num">24/7</div><div className="stat-label">技术支持</div></div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="container">
          <h2 className="section-title">为什么选择赛盾？</h2>
          <p className="section-sub">安全、稳定、高速，一站式网络加速解决方案</p>
          <div className="features-grid">
            <FeatureCard icon="🔐" title="银行级加密" desc="AES-256-GCM 军事级加密，全程保护你的数据安全，零日志政策。"/>
            <FeatureCard icon="⚡" title="全球高速线路" desc="50+ 节点覆盖 30+ 国家，10Gbps 专线，智能路由自动选优。"/>
            <FeatureCard icon="📱" title="全平台支持" desc="Windows / macOS / iOS / Android / Linux，一个账号多设备同时在线。"/>
            <FeatureCard icon="🎮" title="游戏加速" desc="专为游戏优化的低延迟线路，Steam / PS / Switch 畅玩无阻。"/>
            <FeatureCard icon="📺" title="4K流媒体" desc="解锁 Netflix / YouTube / Disney+ 等全球主流平台 4K 资源。"/>
            <FeatureCard icon="💬" title="7×24客服" desc="专属客服团队，随时解答问题，会员优先响应通道。"/>
          </div>
        </div>
      </section>

      {/* NODES */}
      <section className="section" id="nodes" style={{ background: 'var(--bg2)' }}>
        <div className="container">
          <h2 className="section-title">全球高速节点</h2>
          <p className="section-sub">智能负载均衡，始终为你连接最优线路</p>
          <div className="nodes-grid">
            {nodes.length > 0 ? nodes.map(n => <NodeCard key={n.id} node={n} />) : (
              <>
                {[
                  { name: '🇺🇸 美国-洛杉矶', flag: '🇺🇸', speed: '10Gbps', load: 35, proto: 'VLESS', online: true },
                  { name: '🇯🇵 日本-东京', flag: '🇯🇵', speed: '10Gbps', load: 52, proto: 'VLESS', online: true },
                  { name: '🇭🇰 香港-优化', flag: '🇭🇰', speed: '5Gbps', load: 18, proto: 'VLESS', online: true },
                  { name: '🇸🇬 新加坡', flag: '🇸🇬', speed: '10Gbps', load: 41, proto: 'VLESS', online: true },
                  { name: '🇰🇷 韩国-首尔', flag: '🇰🇷', speed: '5Gbps', load: 27, proto: 'VLESS', online: true },
                  { name: '🇬🇧 英国-伦敦', flag: '🇬🇧', speed: '3Gbps', load: 60, proto: 'VLESS', online: true },
                ].map((n, i) => <NodeCard key={i} node={{ ...n, id: i, protocol: n.proto, load_percent: n.load, online: n.online }} />)}
              </>
            )}
          </div>
        </div>
      </section>

      {/* DOWNLOAD */}
      <section className="section" id="download">
        <div className="container">
          <h2 className="section-title">免费下载</h2>
          <p className="section-sub">支持 Windows / macOS / iOS / Android</p>
          <div className="download-grid">
            {downloads.length > 0 ? downloads.map(d => <DlCard key={d.id} dl={d} />) : (
              <>
                <div className="dl-card" onClick={() => alert('下载链接配置中，请联系客服')}>
                  <div className="dl-icon">🪟</div><div className="dl-name">Windows</div><div className="dl-version">v2.1.0</div><div className="dl-size">28.5 MB</div>
                </div>
                <div className="dl-card" onClick={() => alert('下载链接配置中，请联系客服')}>
                  <div className="dl-icon">📱</div><div className="dl-name">Android</div><div className="dl-version">v2.1.0</div><div className="dl-size">18.2 MB</div>
                </div>
                <div className="dl-card" onClick={() => alert('下载链接配置中，请联系客服')}>
                  <div className="dl-icon">🍎</div><div className="dl-name">iOS</div><div className="dl-version">v2.1.0</div><div className="dl-size">22.1 MB</div>
                </div>
                <div className="dl-card" onClick={() => alert('下载链接配置中，请联系客服')}>
                  <div className="dl-icon">💻</div><div className="dl-name">macOS</div><div className="dl-version">v2.1.0</div><div className="dl-size">35.7 MB</div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '40px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
        <div style={{ marginBottom: 12 }}>
          <Link to="/login" style={{ marginRight: 24 }}>登录</Link>
          <Link to="/register" style={{ marginRight: 24 }}>注册</Link>
          {isLoggedIn && <Link to="/dashboard">用户后台</Link>}
        </div>
        <p>© 2025 赛盾VPN · 保护隐私，安全上网 · 沪ICP备XXXXXXXX号</p>
      </footer>
    </div>
  )
}
