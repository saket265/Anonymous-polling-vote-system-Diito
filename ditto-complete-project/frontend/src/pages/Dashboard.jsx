import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPolls } from '../api/pollApi';
import { sharePoll } from '../api/authApi';

export default function Dashboard() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('ditto_user') || 'null');
  const [polls, setPolls]       = useState([]);
  const [loading, setLoad]      = useState(true);
  const [shareModal, setShare]  = useState(null);
  const [shareEmail, setSEmail] = useState('');
  const [shareMsg, setSMsg]     = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    getMyPolls().then(setPolls).catch(() => {}).finally(() => setLoad(false));
  }, []);

  const isExp = p => p.expiresAt && new Date(p.expiresAt) < new Date();
  const total = p => (p.options || []).reduce((s, o) => s + (o.voteCount || 0), 0);
  const logout = () => { localStorage.removeItem('ditto_user'); localStorage.removeItem('ditto_token'); navigate('/'); window.location.reload(); };

  const doShare = async () => {
    if (!shareEmail) return;
    try { await sharePoll(shareModal, shareEmail); setSMsg('✓ Invitation sent to ' + shareEmail); setSEmail(''); }
    catch { setSMsg('Failed. Check backend email config.'); }
  };

  return (
    <div style={s.layout}>
      <div style={s.sidebar}>
        <div style={s.sbLogo}>D</div>
        <div style={s.sbT}>Dashboard</div>
        <div style={s.sbS}>{user?.name}</div>
        <div style={s.sbDiv} />
        <button style={s.sbItem} className="sb-on">🗳 My polls</button>
        <button style={s.sbItem} onClick={() => navigate('/create')}>+ Create poll</button>
        <button style={s.sbItem} onClick={() => navigate('/schedule')}>📅 Meetings</button>
        <div style={{flex:1}} />
        <div style={s.sbDiv} />
        {user?.role === 'ADMIN' && <button style={s.sbItem} onClick={() => navigate('/admin')}>🛡 Admin panel</button>}
        <button style={s.sbItem} onClick={logout}>← Sign out</button>
      </div>
      <div style={s.main}>
        <div style={s.hdr}><div style={s.hdrT}>My polls</div><button style={s.newBtn} onClick={() => navigate('/create')}>+ New poll</button></div>
        {!user?.emailVerified && <div style={s.verifyBanner}>⚠ Please verify your email to unlock all features.</div>}
        {loading && <p style={{color:'#9896b8',fontSize:13}}>Loading your polls…</p>}
        {!loading && polls.length === 0 && <div style={s.empty}>No polls yet. <span style={s.link} onClick={() => navigate('/create')}>Create your first poll</span></div>}
        {polls.map(p => (
          <div key={p.id} style={s.card}>
            <div style={s.cardTop}>
              <div style={{display:'flex',gap:7}}>
                <span style={{...s.chip, background: isExp(p)?'rgba(245,166,35,0.12)':'rgba(29,185,126,0.15)', color: isExp(p)?'#f5a623':'#1db97e'}}>{isExp(p)?'Closed':'● Live'}</span>
                {p.aadhaarRequired && <span style={{...s.chip, background:'rgba(124,111,239,0.15)', color:'#b0aaff'}}>🛡 Aadhaar</span>}
              </div>
              <span style={{fontSize:11,color:'#6b698a'}}>{total(p)} votes</span>
            </div>
            <div style={s.q}>{p.question}</div>
            <div style={s.opts}>{(p.options||[]).slice(0,4).map(o => <span key={o.id} style={s.optChip}>{o.text}</span>)}{(p.options||[]).length > 4 && <span style={s.optChip}>+{(p.options||[]).length - 4}</span>}</div>
            <div style={s.actions}>
              <button style={s.viewBtn} onClick={() => navigate('/poll/'+p.id)}>View results</button>
              <button style={s.shareBtn2} onClick={() => { setShare(p.id); setSMsg(''); setSEmail(''); }}>Share via email</button>
            </div>
            <div style={s.linkRow}>
              <span style={s.linkTxt}>ditto.app/poll/{p.id}</span>
              <button style={s.copyBtn} onClick={() => { navigator.clipboard.writeText(window.location.origin+'/poll/'+p.id); }}>Copy</button>
            </div>
          </div>
        ))}
      </div>

      {shareModal && (
        <div style={s.overlay} onClick={() => setShare(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.mHdr}><div style={s.mT}>Share poll via email</div><button style={s.mClose} onClick={() => setShare(null)}>✕</button></div>
            <p style={s.mS}>Recipient will get an invitation email with the poll link and Aadhaar instructions.</p>
            <label style={s.mLbl}>Recipient email</label>
            <input style={s.mInp} type="email" value={shareEmail} onChange={e => setSEmail(e.target.value)} placeholder="friend@example.com" />
            {shareMsg && <p style={{fontSize:12,marginTop:7,color: shareMsg.startsWith('✓') ? '#1db97e' : '#e24b4a'}}>{shareMsg}</p>}
            <div style={{display:'flex',gap:9,marginTop:14}}>
              <button style={s.mSend} onClick={doShare}>Send invitation</button>
              <button style={s.mCancel} onClick={() => setShare(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const s = {
  layout:        { display:'flex', minHeight:'calc(100vh - 54px)' },
  sidebar:       { width:195, background:'#16213e', borderRight:'1px solid rgba(255,255,255,0.08)', padding:'18px 10px', display:'flex', flexDirection:'column', gap:3, flexShrink:0 },
  sbLogo:        { width:32, height:32, background:'#5b4fe9', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13, fontWeight:700, marginBottom:7 },
  sbT:           { fontSize:13, fontWeight:600, color:'#e8e8f0', marginBottom:1 },
  sbS:           { fontSize:11, color:'#6b698a', marginBottom:7 },
  sbDiv:         { height:1, background:'rgba(255,255,255,0.08)', margin:'7px 0' },
  sbItem:        { padding:'9px 11px', borderRadius:8, background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:12, textAlign:'left', cursor:'pointer', fontFamily:'inherit', transition:'.15s' },
  main:          { flex:1, padding:26 },
  hdr:           { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:10 },
  hdrT:          { fontSize:18, fontWeight:700, color:'#e8e8f0' },
  newBtn:        { background:'#5b4fe9', color:'#fff', border:'none', borderRadius:9, padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer' },
  verifyBanner:  { background:'rgba(245,166,35,0.12)', border:'1px solid rgba(245,166,35,0.25)', borderRadius:9, padding:'9px 13px', fontSize:13, color:'#f5a623', marginBottom:16 },
  empty:         { textAlign:'center', padding:40, color:'#9896b8', fontSize:13 },
  link:          { color:'#7c6fef', cursor:'pointer', fontWeight:500 },
  card:          { background:'#252540', border:'1px solid rgba(255,255,255,0.08)', borderRadius:13, padding:'17px 19px', marginBottom:10 },
  cardTop:       { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:9 },
  chip:          { fontSize:11, padding:'2px 9px', borderRadius:20, fontWeight:500 },
  q:             { fontSize:14, fontWeight:500, color:'#e8e8f0', marginBottom:9, lineHeight:1.35 },
  opts:          { display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 },
  optChip:       { fontSize:11, padding:'3px 9px', borderRadius:20, background:'rgba(124,111,239,0.12)', color:'#b0aaff', border:'1px solid rgba(124,111,239,0.2)' },
  actions:       { display:'flex', gap:8, marginBottom:10 },
  viewBtn:       { padding:'7px 15px', background:'#5b4fe9', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer' },
  shareBtn2:     { padding:'7px 15px', background:'rgba(124,111,239,0.15)', color:'#b0aaff', border:'1px solid rgba(124,111,239,0.2)', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer' },
  linkRow:       { display:'flex', alignItems:'center', gap:8, background:'#1e1e38', borderRadius:8, padding:'8px 11px' },
  linkTxt:       { flex:1, fontSize:11, color:'#9896b8', fontFamily:"'DM Mono',monospace", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  copyBtn:       { fontSize:11, padding:'4px 10px', background:'#252540', border:'1px solid rgba(255,255,255,0.14)', borderRadius:6, color:'#9896b8', cursor:'pointer' },
  overlay:       { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 },
  modal:         { background:'#252540', border:'1px solid rgba(255,255,255,0.14)', borderRadius:14, padding:'26px 24px', maxWidth:380, width:'100%' },
  mHdr:          { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 },
  mT:            { fontSize:17, fontWeight:700, color:'#e8e8f0' },
  mClose:        { background:'none', border:'none', fontSize:17, color:'#6b698a', cursor:'pointer' },
  mS:            { fontSize:13, color:'#9896b8', marginBottom:15, lineHeight:1.55 },
  mLbl:          { display:'block', fontSize:12, fontWeight:500, color:'#9896b8', marginBottom:5 },
  mInp:          { width:'100%', padding:'11px 13px', border:'1px solid rgba(255,255,255,0.14)', borderRadius:9, fontSize:14, color:'#e8e8f0', background:'#1e1e38', outline:'none', fontFamily:'inherit', boxSizing:'border-box' },
  mSend:         { padding:'10px 20px', background:'#5b4fe9', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  mCancel:       { padding:'10px 16px', background:'#1e1e38', color:'#9896b8', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, fontSize:13, cursor:'pointer', fontFamily:'inherit' },
};
