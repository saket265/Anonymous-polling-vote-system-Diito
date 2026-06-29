import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = JSON.parse(localStorage.getItem('ditto_user') || 'null');
  const logout = () => { localStorage.removeItem('ditto_user'); localStorage.removeItem('ditto_token'); navigate('/'); window.location.reload(); };
  const lk = p => ({ ...s.link, ...(pathname === p ? s.linkOn : {}) });
  return (
    <nav style={s.nav}>
      <Link to="/" style={s.brand}><div style={s.logo}>D</div><span style={s.name}>Ditto</span><span style={s.badge}>✦ Aadhaar Verified</span></Link>
      <div style={s.links}>
        <Link to="/create"   style={lk('/create')}>Create poll</Link>
        <Link to="/poll/demo-poll-3" style={lk('/poll/demo-poll-3')}>Live results</Link>
        <Link to="/schedule" style={lk('/schedule')}>Schedule meeting</Link>
      </div>
      <div style={s.right}>
        {user ? (<>
          <span style={s.user}>👤 {user.name?.split(' ')[0]}</span>
          {user.role === 'ADMIN' && <Link to="/admin" style={s.btnO}>Admin</Link>}
          <Link to="/dashboard" style={s.btnO}>Dashboard</Link>
          <button style={s.btnO} onClick={logout}>Sign out</button>
        </>) : (<>
          <Link to="/login"    style={s.btnO}>Login</Link>
          <Link to="/register" style={s.btnP}>Sign up</Link>
        </>)}
      </div>
    </nav>
  );
}
const s = {
  nav:   { background:'#16213e', height:54, display:'flex', alignItems:'center', padding:'0 24px', gap:8, position:'sticky', top:0, zIndex:200, borderBottom:'1px solid rgba(255,255,255,0.08)' },
  brand: { display:'flex', alignItems:'center', gap:9, textDecoration:'none', marginRight:8 },
  logo:  { width:30, height:30, background:'#5b4fe9', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:14, fontWeight:700 },
  name:  { fontSize:16, fontWeight:700, color:'#e8e8f0' },
  badge: { fontSize:10, background:'rgba(124,111,239,0.2)', color:'#b0aaff', padding:'2px 8px', borderRadius:20, fontWeight:500 },
  links: { display:'flex', gap:2, flex:1 },
  link:  { fontSize:13, padding:'6px 12px', borderRadius:7, color:'rgba(255,255,255,0.5)', textDecoration:'none' },
  linkOn:{ fontSize:13, padding:'6px 12px', borderRadius:7, color:'#b0aaff', textDecoration:'none', background:'rgba(124,111,239,0.15)', fontWeight:500 },
  right: { display:'flex', gap:8, alignItems:'center', marginLeft:'auto' },
  user:  { fontSize:12, color:'rgba(255,255,255,0.4)' },
  btnO:  { fontSize:13, padding:'6px 14px', border:'1px solid rgba(255,255,255,0.14)', borderRadius:8, background:'rgba(255,255,255,0.06)', color:'#e8e8f0', textDecoration:'none', cursor:'pointer' },
  btnP:  { fontSize:13, padding:'7px 16px', background:'#5b4fe9', border:'none', borderRadius:8, color:'#fff', fontWeight:600, textDecoration:'none' },
};
