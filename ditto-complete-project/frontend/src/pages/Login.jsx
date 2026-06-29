import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';

export default function Login() {
  const navigate = useNavigate();
  const [email, setE]   = useState('');
  const [pass, setP]    = useState('');
  const [loading, setL] = useState(false);
  const [error, setErr] = useState('');

  const submit = async e => {
    e.preventDefault(); setErr(''); setL(true);
    try {
      const data = await login(email, pass);
      localStorage.setItem('ditto_token', data.token);
      localStorage.setItem('ditto_user', JSON.stringify(data));
      navigate(data.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) { setErr(err.response?.data?.error || 'Invalid email or password.'); }
    finally { setL(false); }
  };

  return (
    <div style={s.bg}>
      <div style={s.card}>
        <div style={s.logo}>D</div>
        <h1 style={s.t}>Welcome back</h1>
        <p style={s.sub}>Sign in to your Ditto account</p>
        {error && <div style={s.err}>{error}</div>}
        <form onSubmit={submit}>
          <label style={s.lbl}>Email</label>
          <input style={s.inp} type="email" placeholder="you@example.com" value={email} onChange={e => setE(e.target.value)} required />
          <label style={s.lbl}>Password</label>
          <input style={s.inp} type="password" placeholder="Your password" value={pass} onChange={e => setP(e.target.value)} required />
          <div style={{textAlign:'right',marginTop:5}}><span style={s.link}>Forgot password?</span></div>
          <button style={{...s.btn, opacity: loading ? 0.6 : 1}} type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in →'}</button>
        </form>
        <div style={s.demo}><strong style={{color:'#e8e8f0'}}>Demo accounts:</strong><br/>Admin: admin@ditto.app / Admin@1234<br/>User: priya@demo.com / demo1234</div>
        <p style={s.foot}>New to Ditto? <span style={s.link} onClick={() => navigate('/register')}>Create account</span></p>
      </div>
    </div>
  );
}
const s = {
  bg:   { minHeight:'calc(100vh - 54px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'28px 22px', background:'#1a1a2e' },
  card: { background:'#252540', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'34px 30px', maxWidth:400, width:'100%' },
  logo: { width:40, height:40, background:'#5b4fe9', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18, fontWeight:700, marginBottom:16 },
  t:    { fontSize:21, fontWeight:700, color:'#e8e8f0', marginBottom:4 },
  sub:  { fontSize:13, color:'#9896b8', marginBottom:20 },
  lbl:  { display:'block', fontSize:12, fontWeight:500, color:'#9896b8', marginBottom:5, marginTop:13 },
  inp:  { width:'100%', padding:'11px 13px', border:'1px solid rgba(255,255,255,0.14)', borderRadius:9, fontSize:14, color:'#e8e8f0', background:'#1e1e38', outline:'none', boxSizing:'border-box', fontFamily:'inherit' },
  btn:  { width:'100%', padding:13, background:'#5b4fe9', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:16, fontFamily:'inherit' },
  err:  { background:'rgba(226,75,74,0.15)', color:'#e24b4a', borderRadius:9, padding:'9px 13px', fontSize:13, marginBottom:14 },
  demo: { background:'#1e1e38', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'11px 13px', fontSize:12, color:'#9896b8', marginTop:13, lineHeight:1.7 },
  foot: { textAlign:'center', marginTop:16, fontSize:13, color:'#9896b8' },
  link: { color:'#7c6fef', cursor:'pointer', fontWeight:500 },
};
