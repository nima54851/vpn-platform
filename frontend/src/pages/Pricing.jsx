import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { vpnApi } from '../api'

export default function Pricing() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const isLoggedIn = !!localStorage.getItem('vpn_token')

  useEffect(() => {
    vpnApi.plans().then(setPlans).catch(() => {})
  }, [])

  return (
    <div>
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/" className="nav-logo">🛡️ 赛盾VPN</Link>
          <div className="nav-actions">
            {isLoggedIn
              ? <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>我的后台</button>
              : <><button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>登录</button>
                 <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')}>注册</button></>
            }
          </div>
        </div>
      </nav>
      <div style={{ paddingTop: 80 }}>
        <section className="section">
          <div className="container">
            <h2 className="section-title">选择你的套餐</h2>
            <p className="section-sub">所有套餐均支持全平台设备，一次购买多端通用</p>
            <div className="pricing-grid">
              {plans.length > 0 ? plans.map((p, i) => (
                <div key={p.id} className={`plan-card ${i === 1 ? 'featured' : ''}`}>
                  {i === 1 && <div className="plan-popular">最受欢迎</div>}
                  <div className="plan-name">{p.name}</div>
                  <div className="plan-price">
                    {p.price_cny === 0 ? '免费' : <>¥{p.price_cny}<span>/{p.duration_days}天</span></>}
                  </div>
                  <div className="plan-period">
                    {p.traffic_mb >= 1024000 ? `${(p.traffic_mb/1024000).toFixed(0)}TB` : `${p.traffic_mb/1024}GB`} 流量 · {p.duration_days}天
                  </div>
                  <ul className="plan-features">
                    {(p.features || []).map(f => <li key={f}>{f}</li>)}
                  </ul>
                  {isLoggedIn
                    ? <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/dashboard')}>前往购买</button>
                    : <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/register')}>免费注册</button>
                  }
                </div>
              )) : (
                <>
                  {[{ name: '免费版', price: 0, period: '永久', traffic: '5GB', feat: ['1个节点','基础速度','有限流量'], hot: false },
                   { name: '月卡', price: 29, period: '30天', traffic: '100GB', feat: ['全部节点','高速线路','无限流量','多设备'], hot: true },
                   { name: '季卡', price: 79, period: '90天', traffic: '300GB', feat: ['全部节点','高速线路','无限流量','多设备','优先客服'], hot: false },
                   { name: '年卡', price: 299, period: '365天', traffic: '1.2TB', feat: ['全部节点','高速专线','无限流量','10设备','专属客服','优先线路'], hot: false }
                  ].map((p, i) => (
                    <div key={p.name} className={`plan-card ${p.hot ? 'featured' : ''}`}>
                      {p.hot && <div className="plan-popular">最受欢迎</div>}
                      <div className="plan-name">{p.name}</div>
                      <div className="plan-price">¥{p.price}<span>/{p.period}</span></div>
                      <div className="plan-period">{p.traffic} 流量</div>
                      <ul className="plan-features">{p.feat.map(f => <li key={f}>{f}</li>)}</ul>
                      {isLoggedIn
                        ? <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/dashboard')}>前往购买</button>
                        : <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/register')}>免费注册</button>
                      }
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
