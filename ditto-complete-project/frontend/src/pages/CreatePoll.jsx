import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPoll } from '../api/pollApi';

const COLORS = ['#7c6fef','#e24b4a','#f5a623','#1db97e','#4a9eff','#e06fa0','#c87941','#5dade2'];
const EXPIRY = [{l:'Never',v:0},{l:'1 hour',v:1},{l:'24 hours',v:24},{l:'3 days',v:72},{l:'7 days',v:168}];

export default function CreatePoll() {
  const navigate = useNavigate();
  const [question, setQ]   = useState('');
  const [options, setOpts] = useState(['','','']);
  const [expiry, setExp]   = useState(24);
  const [aadhaar, setAad]  = useState(true);
  const [multi, setMulti]  = useState(false);
  const [vis, setVis]      = useState('after');
  const [captcha, setCap]  = useState(false);
  const [loading, setLoad] = useState(false);
  const [error, setErr]    = useState('');

  const [ipCheck, setIpCheck] = useState(false);
  const [trackParticipation, setTrackParticipation] = useState(false);

  const addOpt = () => { if (options.length < 10) setOpts([...options, '']); };
  const rmOpt  = i => { if (options.length > 2) setOpts(options.filter((_,j) => j !== i)); };
  const setOpt = (i, v) => { const n = [...options]; n[i] = v; setOpts(n); };

  const submit = async () => {
    if (!question.trim()) { setErr('Please enter a question.'); return; }
    const filled = options.map(o => o.trim()).filter(Boolean);
    if (filled.length < 2) { setErr('Please add at least 2 options.'); return; }
    if (!captcha) { setErr('Please check the CAPTCHA box.'); return; }
    setLoad(true); setErr('');
    try {
      const poll = await createPoll(question.trim(), filled, expiry || null, ipCheck, trackParticipation);
      navigate('/poll/' + poll.id);
    } catch (e) { setErr(e.response?.data?.error || 'Failed to create poll.'); }
    finally { setLoad(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.grid}>
        <div>
          <div style={s.hdr}><h2 style={s.title}>Create a new poll</h2><p style={s.sub}>Set up your question, options and settings — share the link anywhere</p></div>
          {error && <div style={s.err}>{error}</div>}

          <div style={s.card}>
            <span style={s.lbl}>📝 YOUR QUESTION</span>
            <textarea style={s.qta} rows={2} maxLength={500} placeholder="Ask anything…" value={question} onChange={e => { setQ(e.target.value); setErr(''); }} />
            <div style={s.cc}>{question.length} / 500</div>
          </div>

          <div style={s.card}>
            <span style={s.lbl}>📋 POLL TYPE</span>
            <div style={s.typeGrid}>
              {[['⊙','Single choice','Pick one answer only'],['☑','Multiple choice','Pick one or more'],['↕','Ranking','Drag to rank options'],['✎','Open-ended','Free text answers']].map(([ic,nm,ds], i) => (
                <div key={nm} style={{...s.typeOpt, ...(i===0?s.typeSelStyle:{})}} onClick={e => { document.querySelectorAll('[data-type]').forEach(el => el.setAttribute('data-sel','0')); e.currentTarget.setAttribute('data-sel','1'); }}>
                  <div style={s.typeIc}>{ic}</div>
                  <div style={s.typeNm}>{nm}</div>
                  <div style={s.typeDs}>{ds}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={s.card}>
            <span style={s.lbl}>📌 ANSWER OPTIONS (2–10)</span>
            {options.map((o, i) => (
              <div key={i} style={s.optRow}>
                <span style={s.drag}>⠿</span>
                <div style={{...s.dot, background: COLORS[i % COLORS.length]}} />
                <input style={s.optInp} value={o} placeholder={`Option ${i+1}`} maxLength={200} onChange={e => setOpt(i, e.target.value)} />
                {options.length > 2 && <button style={s.optRm} onClick={() => rmOpt(i)}>✕</button>}
              </div>
            ))}
            {options.length < 10 && <button style={s.addOpt} onClick={addOpt}>+ Add option</button>}
          </div>

          <div style={s.card}>
            <span style={s.lbl}>⚙ SETTINGS</span>
            {[
              ['Anonymous voting','Hide voter identities',true,null],
              ['Allow multiple selections','Voters can pick more than one',multi,() => setMulti(!multi)],
              ['Block duplicate IP votes','Prevent multiple votes from the same Wi-Fi/IP',ipCheck,() => setIpCheck(!ipCheck)],
              ['Track who has voted','See which registered users have voted (vote choices stay anonymous)',trackParticipation,() => setTrackParticipation(!trackParticipation)],
            ].map(([t,d,val,fn]) => (
              <div key={t} style={s.srow}>
                <div><div style={s.srt}>{t}</div><div style={s.srs}>{d}</div></div>
                <div style={{...s.tog, background: val ? '#5b4fe9' : '#6b698a', cursor: fn ? 'pointer' : 'not-allowed'}} onClick={fn || undefined}>
                  <div style={{...s.togK, left: val ? 19 : 3}} />
                </div>
              </div>
            ))}
            <div style={s.srow}>
              <div><div style={s.srt}>Poll deadline</div><div style={s.srs}>Auto-close after</div></div>
              <select style={s.sel} value={expiry} onChange={e => setExp(Number(e.target.value))}>
                {EXPIRY.map(e => <option key={e.v} value={e.v}>{e.l}</option>)}
              </select>
            </div>
            <div style={s.srow}>
              <div><div style={s.srt}>Results visibility</div><div style={s.srs}>When voters can see results</div></div>
              <select style={s.sel} value={vis} onChange={e => setVis(e.target.value)}>
                <option value="after">After voting</option>
                <option value="always">Always visible</option>
              </select>
            </div>
            <div style={s.capWrap}>
              <div style={{...s.capCb, background: captcha ? '#5b4fe9' : 'transparent', borderColor: captcha ? '#5b4fe9' : 'rgba(255,255,255,0.14)', color: captcha ? '#fff' : 'transparent'}} onClick={() => setCap(!captcha)} role="checkbox" aria-checked={captcha}>✓</div>
              <span style={{fontSize:13,color:'#9896b8'}}>I'm not a robot</span>
              <div style={{marginLeft:'auto',textAlign:'center'}}>
                <div style={s.capBox}>rC</div>
                <div style={{fontSize:8,color:'#6b698a'}}>reCAPTCHA</div>
              </div>
            </div>
          </div>

          <div style={s.aadBox}>
            <div style={s.aadHdr}><div style={s.aadIc}>🪪</div><div><div style={s.aadT}>Aadhaar verification — anti-cheat</div><div style={s.aadS}>Unique to Ditto</div></div></div>
            <div style={s.srow}>
              <div><div style={{...s.srt,color:'#b0aaff'}}>Require Aadhaar OTP to vote</div><div style={s.srs}>One person, one vote — guaranteed</div></div>
              <div style={{...s.tog, background: aadhaar ? '#5b4fe9' : '#6b698a', cursor:'pointer'}} onClick={() => setAad(!aadhaar)}>
                <div style={{...s.togK, left: aadhaar ? 19 : 3}} />
              </div>
            </div>
            <div style={s.aadDesc}>🔒 Aadhaar number is SHA-256 hashed immediately. Only the hash is stored. Your actual number is never saved.</div>
          </div>

          <button style={{...s.createBtn, opacity: loading ? 0.6 : 1}} onClick={submit} disabled={loading}>
            {loading ? 'Creating poll…' : '✦ Create poll & get link →'}
          </button>
        </div>

        <div>
          <div style={s.prevCard}>
            <div style={s.prevLbl}>LIVE PREVIEW</div>
            <div style={s.prevQ}>{question || 'Your question will appear here…'}</div>
            {options.filter(o => o.trim()).map((o, i) => (
              <div key={i} style={s.prevOpt}>
                <div style={{...s.prevRadio, ...(i===0?{background:'#5b4fe9',borderColor:'#5b4fe9'}:{})}} />
                <span style={{fontSize:13,color:'#e8e8f0'}}>{o}</span>
              </div>
            ))}
            <div style={s.prevMeta}>🛡 Aadhaar verified · 🔒 Anonymous · 🤖 CAPTCHA<br/>⏰ Closes in {EXPIRY.find(e=>e.v===expiry)?.l || 'Never'}</div>
          </div>
          <div style={s.howCard}>
            <div style={s.prevLbl}>HOW IT WORKS</div>
            {[['Enter question and answer options','#5b4fe9'],['Customize deadline, visibility and Aadhaar setting','#5b4fe9'],['Get a unique link — share on WhatsApp, email, social media','#5b4fe9'],['Watch live pie/bar/doughnut charts update in real time','#1db97e']].map(([t,bg],i) => (
              <div key={i} style={s.howStep}><div style={{...s.howNum,background:bg}}>{i+1}</div><div style={s.howTxt}>{t}</div></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:      { maxWidth:900, margin:'0 auto', padding:'28px 22px' },
  grid:      { display:'grid', gridTemplateColumns:'1fr 295px', gap:18, alignItems:'start' },
  hdr:       { marginBottom:20 },
  title:     { fontSize:22, fontWeight:700, color:'#e8e8f0', marginBottom:4 },
  sub:       { fontSize:13, color:'#9896b8' },
  err:       { background:'rgba(226,75,74,0.15)', border:'1px solid rgba(226,75,74,0.3)', borderRadius:9, padding:'10px 13px', fontSize:13, color:'#e24b4a', marginBottom:12 },
  card:      { background:'#252540', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:'18px 20px', marginBottom:12 },
  lbl:       { fontSize:10, fontWeight:600, letterSpacing:'.09em', color:'#6b698a', marginBottom:10, display:'block' },
  qta:       { width:'100%', background:'transparent', border:'none', outline:'none', color:'#e8e8f0', fontSize:17, fontWeight:500, resize:'vertical', lineHeight:1.4, fontFamily:'inherit', minHeight:60 },
  cc:        { fontSize:11, color:'#6b698a', textAlign:'right', marginTop:5 },
  typeGrid:  { display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 },
  typeOpt:   { border:'1.5px solid rgba(255,255,255,0.14)', borderRadius:10, padding:12, cursor:'pointer' },
  typeSelStyle: { borderColor:'#5b4fe9', background:'rgba(124,111,239,0.15)' },
  typeIc:    { fontSize:18, marginBottom:5, display:'block', color:'#9896b8' },
  typeNm:    { fontSize:12, fontWeight:500, color:'#e8e8f0' },
  typeDs:    { fontSize:10, color:'#9896b8', marginTop:2 },
  optRow:    { display:'flex', alignItems:'center', gap:8, background:'#1e1e38', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'8px 11px', marginBottom:7 },
  drag:      { fontSize:14, color:'#6b698a', cursor:'grab' },
  dot:       { width:10, height:10, borderRadius:'50%', flexShrink:0 },
  optInp:    { flex:1, border:'none', outline:'none', background:'transparent', fontSize:13, color:'#e8e8f0', fontFamily:'inherit' },
  optRm:     { background:'none', border:'none', color:'#6b698a', fontSize:14, cursor:'pointer', padding:0 },
  addOpt:    { width:'100%', padding:9, border:'1.5px dashed rgba(255,255,255,0.14)', borderRadius:9, background:'none', color:'#9896b8', fontSize:12, cursor:'pointer', fontFamily:'inherit' },
  srow:      { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 13px', background:'#1e1e38', borderRadius:9, marginBottom:7, border:'1px solid rgba(255,255,255,0.08)' },
  srt:       { fontSize:13, fontWeight:500, color:'#e8e8f0' },
  srs:       { fontSize:11, color:'#6b698a', marginTop:2 },
  tog:       { width:38, height:21, borderRadius:11, position:'relative', flexShrink:0, transition:'background .2s' },
  togK:      { position:'absolute', width:15, height:15, borderRadius:'50%', background:'#fff', top:3, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.3)' },
  sel:       { background:'#252540', border:'1px solid rgba(255,255,255,0.14)', borderRadius:7, padding:'5px 8px', fontSize:12, color:'#e8e8f0', outline:'none' },
  capWrap:   { display:'flex', alignItems:'center', gap:10, border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, padding:'10px 12px', background:'#1e1e38', marginTop:10 },
  capCb:     { width:20, height:20, borderRadius:5, border:'1.5px solid rgba(255,255,255,0.14)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, flexShrink:0, transition:'.15s' },
  capBox:    { width:28, height:28, background:'#4a90e2', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:10, fontWeight:700, margin:'0 auto 2px' },
  aadBox:    { background:'rgba(124,111,239,0.1)', border:'1px solid rgba(124,111,239,0.3)', borderRadius:14, padding:'17px 19px', marginBottom:12 },
  aadHdr:    { display:'flex', alignItems:'center', gap:10, marginBottom:11 },
  aadIc:     { width:34, height:34, background:'#5b4fe9', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:16, flexShrink:0 },
  aadT:      { fontSize:13, fontWeight:600, color:'#b0aaff' },
  aadS:      { fontSize:11, color:'#9896b8', marginTop:1 },
  aadDesc:   { fontSize:11, color:'#9896b8', lineHeight:1.55 },
  createBtn: { width:'100%', padding:14, background:'#5b4fe9', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  prevCard:  { background:'#252540', border:'1px solid rgba(255,255,255,0.08)', borderRadius:13, padding:17, marginBottom:12, position:'sticky', top:66 },
  prevLbl:   { fontSize:10, fontWeight:600, letterSpacing:'.09em', color:'#6b698a', marginBottom:11 },
  prevQ:     { fontSize:14, fontWeight:500, minHeight:32, marginBottom:11, lineHeight:1.4, color:'#e8e8f0' },
  prevOpt:   { display:'flex', alignItems:'center', gap:8, padding:'8px 11px', border:'1.5px solid rgba(255,255,255,0.14)', borderRadius:9, fontSize:13, marginBottom:6 },
  prevRadio: { width:14, height:14, borderRadius:'50%', border:'1.5px solid rgba(255,255,255,0.14)', flexShrink:0 },
  prevMeta:  { fontSize:10, color:'#6b698a', marginTop:11, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.08)', lineHeight:1.8 },
  howCard:   { background:'#252540', border:'1px solid rgba(255,255,255,0.08)', borderRadius:13, padding:17 },
  howStep:   { display:'flex', gap:8, alignItems:'flex-start', marginBottom:10 },
  howNum:    { width:21, height:21, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0, marginTop:1 },
  howTxt:    { fontSize:12, color:'#9896b8', lineHeight:1.5 },
};
