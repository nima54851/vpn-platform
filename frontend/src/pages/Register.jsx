import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { vpnApi } from '../api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    if (form.password !== form.confirm) { setErr('两次密码不一致'); return }
    if (form.password.length < 6) { setErr('密码至少6位'); return }
    setLoading(true)
    try {
      await vpnApi.register({ username: form.username, email: form.email, password: form.password })
      navigate('/login')
    } catch (err) {
      setErr(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48 }}>🛡️</div>
          <div className="auth-title">注册赛盾账号</div>
          <div className="auth-sub">免费注册，即刻享受 7 天免费试用</div>
        </div>
        {err && <div className="auth-error">{err}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input className="input" type="text" placeholder="选择一个用户名" required
              value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">邮箱地址</label>
            <input className="input" type="email" placeholder="your@email.com" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input className="input" type="password" placeholder="至少6位" required
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">确认密码</label>
            <input className="input" type="password" placeholder="再次输入密码" required
              value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} type="submit" disabled={loading}>
            {loading ? '注册中...' : '免费注册'}
          </button>
        </form>
        <div className="auth-footer">
          已有账号？<Link to="/login">立即登录</Link>
        </div>
        <div className="auth-footer">
          <Link to="/">返回首页</Link>
        </div>
      </div>
    </div>
  )
}
