import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { vpnApi } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)
    try {
      const res = await vpnApi.login(form)
      localStorage.setItem('vpn_token', res.token)
      localStorage.setItem('vpn_user', JSON.stringify(res.user))
      navigate(res.user.is_admin ? '/admin' : '/dashboard')
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
          <div className="auth-title">登录赛盾</div>
          <div className="auth-sub">欢迎回来！继续你的安全上网之旅</div>
        </div>
        {err && <div className="auth-error">{err}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">邮箱地址</label>
            <input className="input" type="email" placeholder="your@email.com" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input className="input" type="password" placeholder="••••••••" required
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} type="submit" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <div className="auth-footer">
          还没有账号？<Link to="/register">立即注册</Link>
        </div>
        <div className="auth-footer">
          <Link to="/">返回首页</Link>
        </div>
      </div>
    </div>
  )
}
