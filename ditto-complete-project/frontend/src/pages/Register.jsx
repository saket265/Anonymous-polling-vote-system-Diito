import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/authApi';

export default function Register() {
  const navigate = useNavigate();
  const [form, setF]    = useState({ name:'', email:'', password:'' });
  const [loading, setL] = useState(false);
  const [error, setE]   = useState('');
  const [done, setDone] = useState(false);
  const chg = e => setF({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault(); setE(''); setL(true);
    try {
      const data = await register(form.name, form.email, form.password);
      localStorage.setItem('ditto_token', data.token);
      localStorage.setItem('ditto_user', JSON.stringify(data));
      setDone(true);
    } catch (err) { setE(err.response?.data?.error || 'Registration failed.'); }
    finally { setL(false); }
  };

  if (done) return (
    <div style={s.bg}>
      <div style={s.card}>
        <div style={s.circle}>✓</div>
        <h2 style={s.t}>Check your inbox!</h2>
        <p style={s.sub}>We sent a verification link to <strong>{form.email}</strong>. Click it to activate your account.</p>
        <div style={s.steps}>
          {['Open Gmail (check Spam/Promotions too)','Find email from noreply@ditto.app — "Verify your Ditto account"','Click the "Verify my email" button','Login and start creating polls!'].map((st,i) => (
            <div key={i} style={s.step}><div style={s.stepN}>{i+1}</div><div style={{fontSize:12,color:'#9896b8'}}>{st}</div></div>
          ))}
        </div>
        <div style={s.note}>⚠ Email not received? Check the backend console output for the verification link (for testing).</div>
        <button style={s.btn} onClick={() => navigate('/')}>Go to home →</button>
      </div>
    </div>
  );

  return (
    <div style={s.bg}>
      <div style={s.card}>
        <div style={s.logo}>D</div>
        <h1 style={s.t}>Create your account</h1>
        <p style={s.sub}>Join Ditto — India's Aadhaar-verified polling platform</p>
        {error && <div style={s.err}>{error}</div>}
        <form onSubmit={submit}>
          <label style={s.lbl}>Full name</label>
          <input style={s.inp} name="name" placeholder="Rahul Sharma" value={form.name} onChange={chg} required />
          <label style={s.lbl}>Email address</label>
          <input style={s.inp} type="email" name="email" placeholder="you@example.com" value={form.email} onChange={chg} required />
          <label style={s.lbl}>Password</label>
          <input style={s.inp} type="password" name="password" placeholder="Min. 8 characters" value={form.password} onChange={chg} required minLength={8} />
          <div style={s.note}>📧 A verification email will be sent after registration.</div>
          <button style={{...s.btn, opacity: loading ? 0.6 : 1}} type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Create account →'}</button>
        </form>
        <p style={s.foot}>Already have an account? <span style={s.link} onClick={() => navigate('/login')}>Sign in</span></p>
      </div>
    </div>
  );
}
const s = {
  bg:     { minHeight:'calc(100vh - 54px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'28px 22px', background:'#1a1a2e' },
  card:   { background:'#252540', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:'34px 30px', maxWidth:400, width:'100%' },
  logo:   { width:40, height:40, background:'#5b4fe9', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:18, fontWeight:700, marginBottom:16 },
  t:      { fontSize:21, fontWeight:700, color:'#e8e8f0', marginBottom:4 },
  sub:    { fontSize:13, color:'#9896b8', marginBottom:20, lineHeight:1.5 },
  lbl:    { display:'block', fontSize:12, fontWeight:500, color:'#9896b8', marginBottom:5, marginTop:13 },
  inp:    { width:'100%', padding:'11px 13px', border:'1px solid rgba(255,255,255,0.14)', borderRadius:9, fontSize:14, color:'#e8e8f0', background:'#1e1e38', outline:'none', boxSizing:'border-box', fontFamily:'inherit' },
  note:   { background:'rgba(124,111,239,0.12)', border:'1px solid rgba(124,111,239,0.2)', borderRadius:9, padding:'10px 13px', fontSize:12, color:'#b0aaff', marginTop:13, lineHeight:1.6 },
  btn:    { width:'100%', padding:13, background:'#5b4fe9', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:16, fontFamily:'inherit' },
  err:    { background:'rgba(226,75,74,0.15)', color:'#e24b4a', borderRadius:9, padding:'9px 13px', fontSize:13, marginBottom:14 },
  foot:   { textAlign:'center', marginTop:16, fontSize:13, color:'#9896b8' },
  link:   { color:'#7c6fef', cursor:'pointer', fontWeight:500 },
  circle: { width:54, height:54, background:'#5b4fe9', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:22, margin:'0 auto 14px' },
  steps:  { background:'#1e1e38', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'14px 16px', textAlign:'left', marginTop:16 },
  step:   { display:'flex', gap:9, marginBottom:9, fontSize:12, color:'#9896b8' },
  stepN:  { width:20, height:20, borderRadius:'50%', background:'#5b4fe9', color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 },
};
