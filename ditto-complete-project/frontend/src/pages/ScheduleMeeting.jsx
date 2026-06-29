import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const TIMES  = [];
for (let h = 0; h < 24; h++) for (let m of [0,30]) TIMES.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);

function pad(n){ return String(n).padStart(2,'0'); }
function toKey(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }

function Calendar({ year, month, selected, onToggle, onPrev, onNext }) {
  const days   = new Date(year, month+1, 0).getDate();
  const first  = new Date(year, month, 1).getDay();
  const today  = new Date(); today.setHours(0,0,0,0);
  const cells  = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  return (
    <div style={s.cal}>
      <div style={s.calHdr}>
        <button style={s.calNav} onClick={onPrev}>‹</button>
        <span style={s.calM}>{MONTHS[month]} {year}</span>
        <button style={s.calNav} onClick={onNext}>›</button>
      </div>
      <div style={s.calGrid}>
        {DAYS.map(d => <div key={d} style={s.calDay}>{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key  = toKey(year, month, d);
          const dt   = new Date(year, month, d); dt.setHours(0,0,0,0);
          const past = dt < today;
          const sel  = selected.includes(key);
          const now  = dt.getTime() === today.getTime();
          return <div key={key} style={{...s.calCell, background: sel?'#5b4fe9':'transparent', color: past?'#6b698a':sel?'#fff':now?'#7c6fef':'#e8e8f0', border: now&&!sel?'1.5px solid #7c6fef':'1.5px solid transparent', opacity: past?0.4:1, cursor: past?'not-allowed':'pointer', fontWeight: sel||now?600:400 }} onClick={() => !past && onToggle(key)}>{d}</div>;
        })}
      </div>
    </div>
  );
}

export default function ScheduleMeeting() {
  const navigate = useNavigate();
  const now = new Date();
  const [step, setStep]   = useState(0);
  const [title, setTitle] = useState('');
  const [y, setY]         = useState(now.getFullYear());
  const [m, setM]         = useState(now.getMonth());
  const [dates, setDates] = useState([]);
  const [slots, setSlots] = useState({});
  const [copied, setCopied] = useState(false);
  const [error, setErr]   = useState('');
  const meetId = React.useRef('mtg-' + Date.now());

  const toggleDate = key => {
    if (dates.includes(key)) { setDates(d => d.filter(k => k !== key)); setSlots(s => { const n={...s}; delete n[key]; return n; }); }
    else { setDates(d => [...d, key].sort()); setSlots(s => ({...s, [key]: [{start:'09:00',end:'10:30'}]})); }
  };
  const addSlot = key => { const last = slots[key]?.slice(-1)[0]; setSlots(s => ({...s, [key]: [...(s[key]||[]), {start: last?.end||'10:00', end:'11:30'}]})); };
  const rmSlot  = (key, i) => { const upd = (slots[key]||[]).filter((_,j)=>j!==i); if (!upd.length) { setDates(d=>d.filter(k=>k!==key)); setSlots(s=>{const n={...s};delete n[key];return n;}); } else setSlots(s=>({...s,[key]:upd})); };
  const chgSlot = (key, i, f, v) => setSlots(s => ({...s, [key]: s[key].map((sl,j) => j===i ? {...sl,[f]:v} : sl)}));

  const prevM = () => { if(m===0){setM(11);setY(y=>y-1);}else setM(m=>m-1); };
  const nextM = () => { if(m===11){setM(0);setY(y=>y+1);}else setM(m=>m+1); };

  const goNext = () => {
    if (step===0) { if(!title.trim()){setErr('Please enter a meeting title.');return;} if(!dates.length){setErr('Please select at least one date.');return;} setErr(''); setStep(1); }
    else if (step===1) setStep(2);
  };

  const sorted = [...dates].sort();
  const url = `https://ditto.app/meeting/${meetId.current}`;
  const stepLabels = ['Meeting details','Dates & times','Share'];

  return (
    <div style={s.wrap}>
      <div style={{textAlign:'center',marginBottom:22}}>
        <h2 style={{fontSize:22,fontWeight:700,color:'#e8e8f0',marginBottom:4}}>Schedule a Meeting</h2>
        <p style={{fontSize:13,color:'#9896b8'}}>{['Complete the below fields to create your poll.','Select dates and add time slots.','Your meeting poll is ready to share!'][step]}</p>
      </div>
      <div style={s.stepBar}>
        {stepLabels.map((l,i) => (<React.Fragment key={l}>
          {i > 0 && <div style={{...s.stepLine, background: i<=step?'#5b4fe9':'rgba(255,255,255,0.08)'}} />}
          <div style={s.stepItem}>
            <div style={{...s.stepCircle, background: i<=step?'#5b4fe9':'#1e1e38', color: i<=step?'#fff':'#6b698a', border: `1.5px solid ${i<=step?'#5b4fe9':'rgba(255,255,255,0.14)'}`}}>{i<step?'✓':i+1}</div>
            <span style={{fontSize:12,color:i===step?'#e8e8f0':'#6b698a',fontWeight:i===step?600:400}}>{l}</span>
          </div>
        </React.Fragment>))}
      </div>

      <div style={s.card}>
        <div style={s.yellowBar} />
        <div style={s.cardInner}>
          {error && <div style={s.err}>{error}</div>}

          {step===0 && (<>
            <div style={s.fgrp}><label style={s.lbl}>Title</label><input style={s.inp} value={title} onChange={e=>{setTitle(e.target.value);setErr('');}} placeholder="Type your question here"/></div>
            <div style={s.calRow}>
              <Calendar year={y} month={m} selected={dates} onToggle={toggleDate} onPrev={prevM} onNext={nextM}/>
              <div style={s.datesPanel}>
  {dates.length === 0 ? (
    <div style={s.datesEmpty}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#e8e8f0' }}>Dates &amp; Times</div>
      <div style={{ fontSize: 12, color: '#6b698a', lineHeight: 1.6 }}>Click on a date in the calendar to get started</div>
    </div>
  ) : (
    <>
      {sorted.map(k => {
        const p = k.split('-');
        return (
          <div key={k} style={s.dateChip}>
            <span>{MONTHS[+p[1] - 1].slice(0, 3)} {+p[2]}, {p[0]}</span>
            <button style={s.chipRm} onClick={() => toggleDate(k)}>X</button>
          </div>
        );
      })}
    </>
  )}
</div>
            </div>
            <div style={s.ftrRow}>
              <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:12,color:'#9896b8'}}>Automatic timezones</span><button style={s.tzBtn}>Change</button></div>
              <button style={s.bigBtn} onClick={goNext}>{dates.length>0?'Continue →':'Create poll'}</button>
            </div>
          </>)}

          {step===1 && (<>
            <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:22}}>
              <div><Calendar year={y} month={m} selected={dates} onToggle={toggleDate} onPrev={prevM} onNext={nextM}/></div>
              <div>
                {sorted.length===0 && <div style={{fontSize:13,color:'#6b698a',padding:'20px 0'}}>Select dates from the calendar.</div>}
                {sorted.map(key=>{
                  const p=key.split('-'); const sl=slots[key]||[];
                  return <div key={key} style={s.slotGroup}>
                    <div style={s.slotBadge}><div style={{fontSize:10,fontWeight:600,textTransform:'uppercase'}}>{MONTHS[+p[1]-1].slice(0,3)}</div><div style={{fontSize:20,fontWeight:700,lineHeight:1.1}}>{+p[2]}</div></div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:11,color:'#6b698a',marginBottom:7}}>{MONTHS[+p[1]-1]} {+p[2]}, {p[0]}</div>
                      {sl.map((slot,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:7}}>
                        <span style={{fontSize:10,color:'#6b698a',width:50,flexShrink:0}}>Start - End</span>
                        <select style={s.tSel} value={slot.start} onChange={e=>chgSlot(key,i,'start',e.target.value)}>{TIMES.map(t=><option key={t}>{t}</option>)}</select>
                        <span style={{fontSize:13,color:'#6b698a'}}>–</span>
                        <select style={s.tSel} value={slot.end} onChange={e=>chgSlot(key,i,'end',e.target.value)}>{TIMES.map(t=><option key={t}>{t}</option>)}</select>
                        <button style={{background:'none',border:'none',color:'#6b698a',cursor:'pointer',fontSize:15,padding:0}} onClick={()=>rmSlot(key,i)}>✕</button>
                      </div>)}
                      <button style={{background:'none',border:'none',color:'#7c6fef',fontSize:13,cursor:'pointer',padding:0}} onClick={()=>addSlot(key)}>+ Add times</button>
                    </div>
                  </div>;
                })}
              </div>
            </div>
            <div style={s.ftrRow}>
              <button style={s.backBtn} onClick={()=>setStep(0)}>← Back</button>
              <button style={s.bigBtn} onClick={goNext}>Continue →</button>
            </div>
          </>)}

          {step===2 && (<div style={{textAlign:'center'}}>
            <div style={{fontSize:42,marginBottom:12}}>📅</div>
            <h3 style={{fontSize:20,fontWeight:700,color:'#e8e8f0',marginBottom:6}}>Your meeting poll is live!</h3>
            <p style={{fontSize:13,color:'#9896b8',marginBottom:20,lineHeight:1.6}}>Share the link. Participants click the dates & times that work for them.</p>
            <div style={s.summary}>
              <div style={{fontSize:15,fontWeight:600,color:'#e8e8f0',marginBottom:10}}>{title}</div>
              {sorted.map(k=>{const p=k.split('-');const sl=slots[k]||[];return<div key={k} style={{display:'flex',alignItems:'flex-start',gap:9,marginBottom:7}}><span style={{background:'#5b4fe9',color:'#fff',borderRadius:7,padding:'3px 10px',fontSize:12,fontWeight:600,flexShrink:0}}>{MONTHS[+p[1]-1].slice(0,3)} {+p[2]}</span><div style={{display:'flex',flexWrap:'wrap',gap:5}}>{sl.map((sl2,i)=><span key={i} style={{background:'rgba(124,111,239,0.15)',color:'#b0aaff',borderRadius:6,padding:'3px 9px',fontSize:12,border:'1px solid rgba(124,111,239,0.25)'}}>{sl2.start} – {sl2.end}</span>)}</div></div>;})}
            </div>
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              <div style={s.shareUrl2}>{url}</div>
              <button style={{...s.bigBtn,width:'auto',padding:'10px 16px',background:copied?'#1db97e':'#5b4fe9'}} onClick={()=>{navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),2000)}}>{copied?'✓ Copied!':'Copy link'}</button>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:20}}>
              {[['🐦 Twitter',`https://twitter.com/intent/tweet?text=${encodeURIComponent('Schedule: '+url)}`],['💬 WhatsApp',`https://wa.me/?text=${encodeURIComponent('Let\'s find a time: '+url)}`]].map(([l,href])=><button key={l} style={s.socBtn} onClick={()=>window.open(href)}>{l}</button>)}
              <button style={s.socBtn} onClick={()=>window.location.href=`mailto:?subject=Meeting&body=Schedule here: ${url}`}>✉ Email</button>
            </div>
            <div style={{display:'flex',gap:12,justifyContent:'center'}}>
              <button style={s.backBtn} onClick={()=>setStep(1)}>← Edit times</button>
              <button style={s.bigBtn} onClick={()=>navigate('/')}>Go to home →</button>
            </div>
          </div>)}
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap:       { maxWidth:700, margin:'0 auto', padding:'28px 22px' },
  stepBar:    { display:'flex', alignItems:'center', justifyContent:'center', marginBottom:22, gap:0 },
  stepItem:   { display:'flex', alignItems:'center', gap:7 },
  stepCircle: { width:27, height:27, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, flexShrink:0 },
  stepLine:   { width:44, height:2, margin:'0 7px' },
  card:       { background:'#252540', border:'1px solid rgba(255,255,255,0.08)', borderRadius:13, overflow:'hidden' },
  yellowBar:  { height:4, background:'#f5a623' },
  cardInner:  { padding:'26px 28px' },
  err:        { background:'rgba(226,75,74,0.15)', color:'#e24b4a', borderRadius:8, padding:'9px 12px', fontSize:13, marginBottom:12 },
  fgrp:       { marginBottom:18 },
  lbl:        { display:'block', fontSize:13, fontWeight:600, color:'#e8e8f0', marginBottom:7 },
  inp:        { width:'100%', padding:'12px 14px', border:'1.5px solid #5b4fe9', borderRadius:8, fontSize:15, color:'#e8e8f0', background:'#1e1e38', outline:'none', fontFamily:'inherit', boxSizing:'border-box' },
  calRow:     { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18 },
  cal:        { border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'13px 14px', background:'#1e1e38' },
  calHdr:     { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 },
  calM:       { fontSize:13, fontWeight:600, color:'#e8e8f0' },
  calNav:     { background:'none', border:'none', fontSize:18, color:'#9896b8', cursor:'pointer', padding:'0 5px', lineHeight:1 },
  calGrid:    { display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 },
  calDay:     { fontSize:10, fontWeight:600, color:'#6b698a', textAlign:'center', padding:'4px 0', letterSpacing:'.05em' },
  calCell:    { fontSize:12, textAlign:'center', padding:'6px 2px', borderRadius:'50%', cursor:'pointer', userSelect:'none' },
  datesPanel: { border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:13, background:'#1e1e38', minHeight:180 },
  datesEmpty: { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', minHeight:150, textAlign:'center' },
  dateChip:   { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', background:'rgba(124,111,239,0.15)', borderRadius:7, marginBottom:6, fontSize:13, color:'#b0aaff', fontWeight:500, border:'1px solid rgba(124,111,239,0.2)' },
  chipRm:     { background:'none', border:'none', color:'#6b698a', cursor:'pointer', fontSize:13 },
  ftrRow:     { display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:16, marginTop:16 },
  tzBtn:      { fontSize:12, padding:'4px 10px', border:'1px solid rgba(255,255,255,0.14)', borderRadius:6, background:'none', color:'#9896b8', cursor:'pointer' },
  bigBtn:     { background:'#5b4fe9', color:'#fff', border:'none', borderRadius:10, padding:'12px 26px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'background .2s' },
  backBtn:    { background:'none', border:'1px solid rgba(255,255,255,0.14)', color:'#9896b8', borderRadius:10, padding:'12px 20px', fontSize:13, cursor:'pointer', fontFamily:'inherit' },
  slotGroup:  { display:'flex', gap:12, marginBottom:16, paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,0.06)' },
  slotBadge:  { width:44, flexShrink:0, background:'#5b4fe9', borderRadius:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'8px 0', color:'#fff' },
  tSel:       { background:'#1e1e38', border:'1px solid rgba(255,255,255,0.14)', borderRadius:7, padding:'6px 8px', fontSize:13, color:'#e8e8f0', outline:'none', cursor:'pointer' },
  summary:    { background:'#1e1e38', border:'1px solid rgba(255,255,255,0.08)', borderRadius:11, padding:'16px 17px', marginBottom:18, textAlign:'left' },
  shareUrl2:  { flex:1, fontSize:12, color:'#9896b8', background:'#1e1e38', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'10px 12px', fontFamily:"'DM Mono',monospace", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'left' },
  socBtn:     { flex:1, padding:'10px 4px', border:'1px solid rgba(255,255,255,0.14)', borderRadius:9, fontSize:12, background:'none', color:'#9896b8', cursor:'pointer', textAlign:'center' },
};
