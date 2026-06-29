import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminStats, adminUsers, adminPolls, adminPromote, adminDelete, adminShare } from '../../api/authApi';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('ditto_user') || 'null');
  const [tab, setTab]         = useState('stats');
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [polls, setPollsData] = useState([]);
  const [loading, setLoad]    = useState(false);
  const [shareModal, setSM]   = useState(null);
  const [shareEmail, setSE]   = useState('');
  const [msg, setMsg]         = useState('');

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { navigate('/login'); return; }
    loadTab('stats');
  }, []);

  const loadTab = async t => {
    setLoad(true); setMsg('');
    try {
      if (t === 'stats') setStats(await adminStats());
      if (t === 'users') setUsers(await adminUsers());
      if (t === 'polls') setPollsData(await adminPolls());
    } catch { setMsg('Failed to load. Make sure backend is running.'); }
    setLoad(false);
  };

  const doTab = t => { setTab(t); loadTab(t); };
  const promote = async id => { if (!window.confirm('Promote to admin?')) return; try { await adminPromote(id); setMsg('✓ Promoted'); loadTab('users'); } catch { setMsg('Failed.'); } };
  const delPoll = async id => { if (!window.confirm('Delete this poll?')) return; try { await adminDelete(id); setMsg('✓ Deleted'); loadTab('polls'); } catch { setMsg('Failed.'); } };
  const doShare = async () => { try { await adminShare(shareModal, shareEmail); setMsg('✓ Shared to '+shareEmail); setSM(null); } catch { setMsg('Share failed.'); } };
  const logout  = () => { localStorage.removeItem('ditto_user'); localStorage.removeItem('ditto_token'); navigate('/'); window.location.reload(); };

  return (
    <div style={s.layout}>
      <div style={s.sidebar}>
        <div style={s.sbLogo}>D</div>
        <div style={s.sbT}>Admin Panel</div>
        <div style={s.sbS}>Ditto</div>
        <div style={s.sbDiv} />
        {[['stats','📊 Stats'],['users','👥 Users'],['polls','🗳 Polls']].map(([t,l]) => (
          <button key={t} style={{...s.sbItem, ...(tab===t?s.sbOn:{})}} onClick={() => doTab(t)}>{l}</button>
        ))}
        <div style={{flex:1}} />
        <div style={s.sbDiv} />
        <button style={s.sbItem} onClick={() => navigate('/dashboard')}>← Dashboard</button>
        <button style={s.sbItem} onClick={logout}>Sign out</button>
      </div>
      <div style={s.main}>
        {msg && <div style={s.msgBanner}>{msg}</div>}
        {loading && <p style={{color:'#9896b8',fontSize:13}}>Loading…</p>}

        {tab === 'stats' && stats && (
          <div>
            <div style={s.hdrT}>Dashboard overview</div>
            <div style={s.metrics}>
              {[['Total users',stats.totalUsers,'#7c6fef'],['Total polls',stats.totalPolls,'#1db97e'],['Total votes',stats.totalVotes?.toLocaleString(),'#4a9eff'],['Aadhaar polls',stats.verifiedPolls,'#f5a623'],['Admins',stats.adminCount,'#e24b4a']].map(([l,v,c]) => (
                <div key={l} style={s.metric}><div style={{...s.mVal,color:c}}>{v}</div><div style={s.mLbl}>{l}</div></div>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div>
            <div style={s.hdrT}>All users ({users.length})</div>
            <table style={s.tbl}>
              <thead><tr>{['Name','Email','Role','Verified','Polls','Joined','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={s.td}><strong style={{color:'#e8e8f0'}}>{u.name}</strong></td>
                    <td style={s.td}><span style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{u.email}</span></td>
                    <td style={s.td}><span style={{...s.chip, background: u.role==='ADMIN'?'rgba(124,111,239,0.15)':'rgba(29,185,126,0.15)', color: u.role==='ADMIN'?'#b0aaff':'#1db97e'}}>{u.role}</span></td>
                    <td style={s.td}><span style={{color: u.emailVerified?'#1db97e':'#e24b4a',fontWeight:600}}>{u.emailVerified?'✓':'✗'}</span></td>
                    <td style={s.td}>{u.pollCount}</td>
                    <td style={s.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td style={s.td}>{u.role !== 'ADMIN' && <button style={s.tblBtn} onClick={() => promote(u.id)}>Promote</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'polls' && (
          <div>
            <div style={s.hdrT}>All polls ({polls.length})</div>
            <table style={s.tbl}>
              <thead><tr>{['Question','Owner','Votes','Aadhaar','Status','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
              <tbody>
                {polls.map(p => (
                  <tr key={p.id}>
                    <td style={{...s.td,maxWidth:200,lineHeight:1.3}}><strong style={{color:'#e8e8f0',fontSize:12}}>{p.question}</strong></td>
                    <td style={s.td}><div style={{fontSize:12}}>{p.ownerName}</div><div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:'#6b698a'}}>{p.ownerEmail}</div></td>
                    <td style={s.td}>{p.totalVotes}</td>
                    <td style={s.td}><span style={{color: p.aadhaarRequired?'#1db97e':'#6b698a',fontWeight:600}}>{p.aadhaarRequired?'✓':'✗'}</span></td>
                    <td style={s.td}><span style={{...s.chip, background: p.expired?'rgba(245,166,35,0.12)':'rgba(29,185,126,0.15)', color: p.expired?'#f5a623':'#1db97e'}}>{p.expired?'Closed':'Live'}</span></td>
                    <td style={s.td}>
                      <div style={{display:'flex',gap:6}}>
                        <button style={{...s.tblBtn,background:'rgba(74,158,255,0.15)',color:'#4a9eff'}} onClick={() => { setSM(p.id); setSE(''); }}>Share</button>
                        <button style={{...s.tblBtn,background:'rgba(226,75,74,0.15)',color:'#e24b4a'}} onClick={() => delPoll(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {shareModal && (
        <div style={s.overlay} onClick={() => setSM(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.mHdr}><span style={s.mT}>Share poll via email</span><button style={s.mClose} onClick={() => setSM(null)}>✕</button></div>
            <p style={s.mS}>Send a poll invitation to any email address.</p>
            <input style={s.mInp} type="email" value={shareEmail} onChange={e => setSE(e.target.value)} placeholder="recipient@example.com"/>
            <div style={{display:'flex',gap:9,marginTop:14}}>
              <button style={s.mSend} onClick={doShare}>Send</button>
              <button style={s.mCancel} onClick={() => setSM(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const s = {
  layout:    { display:'flex', minHeight:'calc(100vh - 54px)' },
  sidebar:   { width:195, background:'#16213e', borderRight:'1px solid rgba(255,255,255,0.08)', padding:'18px 10px', display:'flex', flexDirection:'column', gap:3, flexShrink:0 },
  sbLogo:    { width:32, height:32, background:'#5b4fe9', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13, fontWeight:700, marginBottom:7 },
  sbT:       { fontSize:13, fontWeight:600, color:'#e8e8f0', marginBottom:1 },
  sbS:       { fontSize:11, color:'#6b698a', marginBottom:7 },
  sbDiv:     { height:1, background:'rgba(255,255,255,0.08)', margin:'7px 0' },
  sbItem:    { padding:'9px 11px', borderRadius:8, background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:12, textAlign:'left', cursor:'pointer', fontFamily:'inherit', transition:'.15s', width:'100%' },
  sbOn:      { background:'rgba(124,111,239,0.2)', color:'#b0aaff' },
  main:      { flex:1, padding:26, overflowX:'auto' },
  hdrT:      { fontSize:18, fontWeight:700, color:'#e8e8f0', marginBottom:18 },
  metrics:   { display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:22 },
  metric:    { background:'#252540', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'13px', textAlign:'center' },
  mVal:      { fontSize:26, fontWeight:700 },
  mLbl:      { fontSize:10, color:'#6b698a', marginTop:3 },
  msgBanner: { background:'rgba(29,185,126,0.15)', border:'1px solid rgba(29,185,126,0.25)', borderRadius:9, padding:'9px 13px', fontSize:13, color:'#1db97e', marginBottom:16 },
  tbl:       { width:'100%', borderCollapse:'collapse', background:'#252540', borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', fontSize:12 },
  th:        { padding:'10px 13px', textAlign:'left', background:'#5b4fe9', color:'#fff', fontWeight:600, fontSize:11 },
  td:        { padding:'10px 13px', borderBottom:'1px solid rgba(255,255,255,0.05)', color:'#9896b8', verticalAlign:'middle' },
  chip:      { fontSize:11, padding:'2px 9px', borderRadius:20, fontWeight:500 },
  tblBtn:    { padding:'4px 10px', border:'none', borderRadius:6, fontSize:11, cursor:'pointer', fontWeight:500, fontFamily:'inherit', background:'rgba(124,111,239,0.15)', color:'#b0aaff' },
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 },
  modal:     { background:'#252540', border:'1px solid rgba(255,255,255,0.14)', borderRadius:14, padding:'24px', maxWidth:360, width:'100%' },
  mHdr:      { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 },
  mT:        { fontSize:16, fontWeight:700, color:'#e8e8f0' },
  mClose:    { background:'none', border:'none', fontSize:17, color:'#6b698a', cursor:'pointer' },
  mS:        { fontSize:13, color:'#9896b8', marginBottom:14, lineHeight:1.5 },
  mInp:      { width:'100%', padding:'11px 13px', border:'1px solid rgba(255,255,255,0.14)', borderRadius:9, fontSize:14, color:'#e8e8f0', background:'#1e1e38', outline:'none', fontFamily:'inherit', boxSizing:'border-box' },
  mSend:     { padding:'10px 20px', background:'#5b4fe9', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  mCancel:   { padding:'10px 16px', background:'#1e1e38', color:'#9896b8', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:'inherit' },
};
