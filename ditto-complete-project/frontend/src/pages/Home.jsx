import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPolls } from '../api/pollApi';

export default function Home() {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  useEffect(() => { getAllPolls().then(setPolls).catch(() => {}); }, []);
  const isExp = p => p.expiresAt && new Date(p.expiresAt) < new Date();
  const total = p => (p.options || []).reduce((s, o) => s + (o.voteCount || 0), 0);
  return (
    <div>
      <div style={s.hero}>
        <div style={s.badge}>🛡 India's first Aadhaar-verified polling platform</div>
        <h1 style={s.h1}>One person. One vote. <span style={{color:'#7c6fef'}}>Always.</span></h1>
        <p style={s.sub}>Create polls in seconds. Share anywhere. Every vote is Aadhaar-verified — making cheating technically impossible while keeping voters 100% anonymous.</p>
        <div style={s.btns}>
          <button style={s.btnP} onClick={() => navigate('/create')}>✦ Create verified poll</button>
          <button style={s.btnS} onClick={() => navigate('/poll/demo-poll-3')}>👁 See live example</button>
        </div>
      </div>
      <div style={s.feats}>
        {[['🪪','Aadhaar verified','OTP confirms real identity. No duplicate votes.','rgba(124,111,239,0.15)'],
          ['🔒','Zero PII stored','Only SHA-256 hash. Your Aadhaar never saved.','rgba(29,185,126,0.15)'],
          ['📊','Live results','Pie, bar, doughnut charts update in real time.','rgba(74,158,255,0.15)'],
          ['⚡','Instant setup','Create and share a poll in 30 seconds.','rgba(245,166,35,0.12)'],
          ['🤖','CAPTCHA protected','reCAPTCHA blocks bots on creation.','rgba(226,75,74,0.15)'],
          ['📅','Schedule meetings','Calendar-based time polls for teams.','rgba(124,111,239,0.15)'],
        ].map(([ic,t,d,bg]) => (
          <div key={t} style={s.feat}>
            <div style={{...s.featIc, background:bg}}>{ic}</div>
            <div style={s.featT}>{t}</div>
            <div style={s.featD}>{d}</div>
          </div>
        ))}
      </div>
      <div style={s.sect}>
        <div style={s.sectHdr}><span style={{fontSize:14,fontWeight:600}}>🔥 Trending polls</span></div>
        {polls.length === 0 && <div style={{textAlign:'center',padding:32,color:'#6b698a',fontSize:13}}>No polls yet. <span style={{color:'#7c6fef',cursor:'pointer'}} onClick={() => navigate('/create')}>Create the first one!</span></div>}
        {polls.map(p => (
          <div key={p.id} style={s.pollRow} onClick={() => navigate('/poll/' + p.id)}>
            <div style={{flex:1,minWidth:0}}>
              <div style={s.pollQ}>{p.question}</div>
              <div style={s.pollMeta}>
                <span style={{...s.chip, background: isExp(p)?'rgba(245,166,35,0.12)':'rgba(29,185,126,0.15)', color: isExp(p)?'#f5a623':'#1db97e'}}>{isExp(p)?'Closed':'● Live'}</span>
                <span style={{...s.chip, background:'rgba(124,111,239,0.15)', color:'#b0aaff'}}>🛡 Aadhaar</span>
                <span style={{fontSize:11,color:'#6b698a'}}>{total(p)} votes</span>
                <span style={{fontSize:11,color:'#6b698a'}}>{(p.options||[]).length} options</span>
              </div>
            </div>
            <span style={{fontSize:18,color:'#6b698a'}}>›</span>
          </div>
        ))}
      </div>
    </div>
  );
}
const s = {
  hero:    { maxWidth:660, margin:'0 auto', textAlign:'center', padding:'60px 24px 44px' },
  badge:   { display:'inline-flex', alignItems:'center', gap:6, background:'rgba(124,111,239,0.15)', color:'#b0aaff', fontSize:12, fontWeight:500, padding:'5px 14px', borderRadius:20, border:'1px solid rgba(124,111,239,0.3)', marginBottom:18 },
  h1:      { fontSize:38, fontWeight:700, lineHeight:1.15, marginBottom:12, letterSpacing:-0.5, color:'#e8e8f0' },
  sub:     { fontSize:15, color:'#9896b8', maxWidth:460, margin:'0 auto 28px', lineHeight:1.7 },
  btns:    { display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:44 },
  btnP:    { background:'#5b4fe9', color:'#fff', border:'none', borderRadius:11, padding:'13px 28px', fontSize:14, fontWeight:600, cursor:'pointer' },
  btnS:    { background:'#252540', border:'1px solid rgba(255,255,255,0.14)', borderRadius:11, padding:'13px 24px', fontSize:14, color:'#e8e8f0', cursor:'pointer' },
  feats:   { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, maxWidth:700, margin:'0 auto 44px', padding:'0 24px' },
  feat:    { background:'#252540', border:'1px solid rgba(255,255,255,0.08)', borderRadius:13, padding:'20px 16px', textAlign:'center' },
  featIc:  { width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:20 },
  featT:   { fontSize:13, fontWeight:600, marginBottom:4, color:'#e8e8f0' },
  featD:   { fontSize:12, color:'#9896b8', lineHeight:1.5 },
  sect:    { maxWidth:700, margin:'0 auto', padding:'0 24px 48px' },
  sectHdr: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 },
  pollRow: { background:'#252540', border:'1px solid rgba(255,255,255,0.08)', borderRadius:13, padding:'14px 17px', cursor:'pointer', marginBottom:9, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 },
  pollQ:   { fontSize:14, fontWeight:500, marginBottom:5, lineHeight:1.3, color:'#e8e8f0' },
  pollMeta:{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' },
  chip:    { fontSize:11, padding:'2px 9px', borderRadius:20, fontWeight:500 },
};
