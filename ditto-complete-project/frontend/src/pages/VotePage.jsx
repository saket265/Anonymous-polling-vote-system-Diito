import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chart } from 'chart.js/auto';
import { getPoll, castVote, exportPollResults, getParticipants, exportParticipantsCSV } from '../api/pollApi';

const COLORS = ['#7c6fef','#e24b4a','#f5a623','#1db97e','#4a9eff','#e06fa0','#c87941','#5dade2'];

export default function VotePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('ditto_user') || 'null');
  const [poll, setPoll]         = useState(null);
  const [loading, setLoad]      = useState(true);
  const [selected, setSel]      = useState(null);
  const [voting, setVoting]     = useState(false);
  const [voted, setVoted]       = useState(false);
  const [error, setErr]         = useState('');
  const [liveOn, setLiveOn]     = useState(true);
  const [chartType, setChart]   = useState('pie');
  const [showShare, setShare]   = useState(false);
  const [showDot, setDot]       = useState(false);
  const [copied, setCopied]     = useState(false);
  const [participants, setParticipants] = useState([]);
  const chartRef  = useRef(null);
  const chartInst = useRef(null);
  const liveTimer = useRef(null);

  const load = useCallback(() => getPoll(id).then(data => {
    setPoll(data);
    setVoted(data.alreadyVoted);
    if (data.trackParticipation && user && data.ownerId === user.userId) {
      getParticipants(id).then(setParticipants).catch(e => console.error(e));
    }
  }).catch(() => setErr('Poll not found.')), [id, user]);

  useEffect(() => { load().finally(() => setLoad(false)); return () => clearInterval(liveTimer.current); }, [load]);

  useEffect(() => {
    if (poll && (voted || poll.expired || poll.resultsPublic)) {
      const t = setTimeout(() => buildChart(), 1000);
      return () => clearTimeout(t);
    }
  }, [poll, chartType, voted]);

  useEffect(() => {
    if (liveOn && (voted || poll?.expired)) { liveTimer.current = setInterval(load, 4000); }
    else clearInterval(liveTimer.current);
    return () => clearInterval(liveTimer.current);
  }, [liveOn, voted, poll?.expired, load]);

  const buildChart = () => {
    if (!chartRef.current || !poll) return;
    if (chartInst.current) { chartInst.current.destroy(); chartInst.current = null; }
    const total = poll.totalVotes || 0;
    chartInst.current = new Chart(chartRef.current, {
      type: chartType,
      data: { labels: poll.options.map(o => o.text), datasets: [{ data: poll.options.map(o => o.voteCount || 0), backgroundColor: COLORS.slice(0, poll.options.length), borderWidth: chartType !== 'bar' ? 2 : 0, borderColor: '#1a1a2e', borderRadius: chartType === 'bar' ? 4 : 0 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => { const v = chartType === 'bar' ? ctx.parsed.y : ctx.parsed; return ` ${v} votes (${total > 0 ? Math.round(v/total*100) : 0}%)`; } } } } }
    });
  };

  const pct = v => poll?.totalVotes > 0 ? Math.round(v / poll.totalVotes * 100) : 0;
  const max = poll ? Math.max(...poll.options.map(o => o.voteCount || 0)) : 0;
  const showRes = voted || poll?.expired || poll?.resultsPublic;

  const submit = async () => {
    if (!selected) return;
    setVoting(true); setErr('');
    try { await castVote(id, selected); await load(); setVoted(true); }
    catch (e) { setErr(e.response?.data?.error || 'Vote failed.'); }
    finally { setVoting(false); }
  };

  const copyLink = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const pollUrl  = `ditto.app/poll/${id}`;

  // ── Export helpers ────────────────────────────────────────
  const exportCSV = () => {
    if (!poll) return;
    const rows = [
      ['Option', 'Votes', 'Percentage'],
      ...poll.options.map(o => [o.text, o.voteCount || 0, pct(o.voteCount || 0) + '%']),
      [],
      ['Total Votes', poll.totalVotes],
      ['Poll', poll.question],
      ['Status', poll.expired ? 'Closed' : 'Active'],
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `poll-${id}-results.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  const exportExcel = () => {
    if (!poll) return;
    // TSV that Excel opens natively
    const rows = [
      ['Option', 'Votes', 'Percentage'],
      ...poll.options.map(o => [o.text, o.voteCount || 0, pct(o.voteCount || 0) + '%']),
      [],
      ['Total Votes', poll.totalVotes, ''],
      ['Poll Question', poll.question, ''],
      ['Status', poll.expired ? 'Closed' : 'Active', ''],
      ['Exported', new Date().toLocaleString('en-IN'), ''],
    ];
    const tsv = rows.map(r => r.join('\t')).join('\n');
    const blob = new Blob([tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `poll-${id}-results.xls`; a.click(); URL.revokeObjectURL(a.href);
  };

  const exportPDF = () => {
    if (!poll) return;
    const total = poll.totalVotes || 0;
    const rows = poll.options.map(o => {
      const v = o.voteCount || 0;
      const p = total > 0 ? Math.round(v / total * 100) : 0;
      return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${o.text}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${v}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${p}%</td></tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><title>Poll Results</title><style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#111}h1{font-size:20px;margin-bottom:4px}p{color:#666;font-size:13px;margin:2px 0}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#5b4fe9;color:#fff;padding:10px 12px;text-align:left}td{color:#333}tfoot td{font-weight:bold;background:#f3f4f6}</style></head><body><h1>${poll.question}</h1><p>Total votes: ${total} &nbsp;|&nbsp; Status: ${poll.expired ? 'Closed' : 'Active'} &nbsp;|&nbsp; Exported: ${new Date().toLocaleString('en-IN')}</p><table><thead><tr><th>Option</th><th style="text-align:center">Votes</th><th style="text-align:center">%</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><td>Total</td><td style="text-align:center">${total}</td><td style="text-align:center">100%</td></tr></tfoot></table></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html); w.document.close();
    w.onload = () => { w.focus(); w.print(); };
  };

  const downloadDetailedVoterData = async () => {
    if (!poll) return;
    try {
      const csvData = await exportPollResults(id);
      const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `poll-${id}-detailed-votes.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to download voter data. Make sure you are logged in as the creator of this poll.');
    }
  };

  const downloadParticipationData = async () => {
    if (!poll) return;
    try {
      const csvData = await exportParticipantsCSV(id);
      const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `poll-${id}-participants-list.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to download participation data.');
    }
  };

  if (loading) return <div style={s.center}>Loading poll…</div>;
  if (error && !poll) return <div style={{...s.center,color:'#e24b4a'}}>{error}</div>;
  if (!poll) return null;

  return (
    <div style={s.page}>
      <div style={s.grid}>
        <div>
          <div style={s.pollCard}>
            <div style={s.topBar} />
            <div style={s.inner}>
              <div style={s.metaRow}>
                <div style={s.by}>by <strong>{poll.ownerName || 'Anonymous'}</strong> · <span style={{color:'#6b698a'}}>{new Date(poll.createdAt).toLocaleDateString('en-IN')}</span></div>
                <div style={{display:'flex',gap:6,position:'relative'}}>
                  <button style={s.actBtn} onClick={() => setShare(true)}>↗ Share</button>
                  <div style={{position:'relative'}}>
                    <button style={s.actBtn} onClick={() => setDot(!showDot)}>⋯</button>
                    {showDot && (
                      <div style={s.dotMenu}>
                        <div style={s.dotItem} onClick={() => { copyLink(); setDot(false); }}>🔗 Copy link</div>
                        <div style={s.dotItem} onClick={() => { setShare(true); setDot(false); }}>✉ Share via email</div>
                        <div style={s.dotItem} onClick={() => { window.print(); setDot(false); }}>🖨 Print results</div>
                        <div style={s.dotItem} onClick={() => { alert('Embed: <iframe src="' + window.location.href + '"></iframe>'); setDot(false); }}>📋 Embed poll</div>
                        <div style={{...s.dotItem,color:'#e24b4a',borderBottom:'none'}} onClick={() => { alert('Reported. We will review within 24h.'); setDot(false); }}>🚩 Report poll</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div style={s.pollQ}>{poll.question}</div>
              <div style={s.pollSub}>
                <span>{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
                <span style={s.sep} />
                <span>🛡 Aadhaar verified</span>
                {poll.expiresAt && <><span style={s.sep} /><span>⏰ {poll.expired ? 'Expired' : 'Active'}</span></>}
              </div>
              {voted && <div style={s.votedBanner}>✓ You voted on this poll</div>}
              {error && <div style={s.errBanner}>{error}</div>}
              <div>
                {poll.options.map((opt, i) => {
                  const p = pct(opt.voteCount || 0);
                  const isLead = (opt.voteCount || 0) === max && max > 0 && showRes;
                  const isSel  = selected === opt.id || (voted && poll.alreadyVotedOptionId === opt.id);
                  return (
                    <div key={opt.id} style={s.optItem} onClick={() => !showRes && !poll.expired && setSel(opt.id)}>
                      <div style={s.oiTop}>
                        <div style={s.oiLeft}>
                          <div style={{...s.radio, ...(isSel ? {background:COLORS[i],borderColor:COLORS[i]} : {})}}><div style={s.radioDot} /></div>
                          <span style={{fontSize:14,fontWeight:500,color:'#e8e8f0'}}>{opt.text}</span>
                          {isLead && <span style={s.leadBadge}>Leading</span>}
                        </div>
                        {showRes && <div style={s.oiRight}>{p.toFixed(2)}% ({opt.voteCount || 0} vote{opt.voteCount !== 1 ? 's' : ''})</div>}
                      </div>
                      <div style={s.barTrack}><div style={{...s.barFill, width: showRes ? `${p}%` : '0%', background: COLORS[i % COLORS.length]}} /></div>
                    </div>
                  );
                })}
              </div>
              <hr style={s.divider} />
              <div style={s.footer}>
                <div style={s.footStat}>Total votes: {poll.totalVotes}</div>
                <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
                  {!voted && !poll.expired && <button style={{...s.submitBtn, opacity: !selected || voting ? 0.4 : 1}} disabled={!selected || voting} onClick={submit}>{voting ? 'Submitting…' : 'Submit vote'}</button>}
                  <button style={s.liveBtn} onClick={() => setLiveOn(!liveOn)}>
                    <div style={{...s.liveDot, animation: liveOn ? 'pulse 1.5s infinite' : 'none', background: liveOn ? '#1db97e' : '#666'}} />
                    {liveOn ? 'Live results' : 'Paused'}
                  </button>
                  <button style={s.backBtn} onClick={() => navigate('/')}>← Back</button>
                  <button style={s.shareBtn} onClick={() => setShare(true)}>↗ Share</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={s.sideCard}>
            <div style={s.sideT}>SHARE THIS POLL</div>
            <div style={s.shareLinkRow}>
              <div style={s.shareUrl}>{pollUrl}</div>
              <button style={{...s.copyBtn, background: copied ? '#1db97e' : '#5b4fe9'}} onClick={copyLink}>{copied ? '✓ Copied!' : 'Copy'}</button>
            </div>
            <div style={s.socRow}>
              <button style={s.socBtn} onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Vote: ' + poll.question)}`)}>🐦 Twitter</button>
              <button style={s.socBtn} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Vote here: ' + window.location.href)}`)}>💬 WhatsApp</button>
              <button style={s.socBtn} onClick={() => window.location.href = `mailto:?subject=${encodeURIComponent('Vote: ' + poll.question)}&body=${encodeURIComponent('Please vote: ' + window.location.href)}`}>✉ Email</button>
            </div>
          </div>
          <div style={s.sideCard}>
            <div style={s.sideT}>STATISTICS</div>
            <div style={s.statGrid}>
              <div style={s.statItem}><div style={s.statV}>{poll.totalVotes}</div><div style={s.statL}>Total votes</div></div>
              <div style={s.statItem}><div style={s.statV}>{poll.options.length}</div><div style={s.statL}>Options</div></div>
              <div style={s.statItem}><div style={s.statV}>{pct(max)}%</div><div style={s.statL}>Leading</div></div>
              <div style={s.statItem}><div style={s.statV}>{poll.expired ? 'Closed' : 'Active'}</div><div style={s.statL}>Status</div></div>
            </div>
          </div>
          {showRes && (
            <div style={s.sideCard}>
              <div style={s.sideT}>BREAKDOWN CHART</div>
              <div style={{display:'flex',gap:4,marginBottom:11}}>
                {['pie','bar','doughnut'].map(t => (
                  <button key={t} style={{...s.chartTab, ...(chartType===t?{background:'#5b4fe9',color:'#fff'}:{})}} onClick={() => setChart(t)}>{t.charAt(0).toUpperCase()+t.slice(1)}</button>
                ))}
              </div>
              <div style={{position:'relative',width:'100%',height:175}}><canvas ref={chartRef} role="img" aria-label="Vote breakdown chart" /></div>
              <div style={{marginTop:11}}>
                {poll.options.map((o, i) => (
                  <div key={o.id} style={s.legRow}>
                    <div style={{...s.legSq, background:COLORS[i%COLORS.length]}} />
                    <span style={{flex:1,fontSize:11,color:'#9896b8'}}>{o.text}</span>
                    <span style={{fontSize:11,fontWeight:600,color:'#e8e8f0'}}>{pct(o.voteCount||0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {user && poll && poll.ownerId === user.userId && (
            <div style={s.sideCard}>
              <div style={s.sideT}>CREATOR TOOLS</div>
              <button style={{width:'100%', padding:'9px 12px', background:'#5b4fe9', color:'#fff', border:'none', borderRadius:9, fontSize:12, fontWeight:600, cursor:'pointer', display:'block', marginBottom: poll.trackParticipation ? 8 : 0}} onClick={downloadDetailedVoterData}>
                📥 Download Voter Options (CSV)
              </button>
              {poll.trackParticipation && (
                <>
                  <div style={{height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 0'}} />
                  <div style={{...s.sideT, marginTop: 4}}>PARTICIPATION TRACKER ({participants.length} voted)</div>
                  {participants.length === 0 ? (
                    <p style={{fontSize:11, color:'#6b698a', margin:'6px 0'}}>No votes tracked yet.</p>
                  ) : (
                    <div style={{maxHeight: 180, overflowY: 'auto', margin: '8px 0', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 6, background: '#1e1e38'}}>
                      {participants.map((p, idx) => (
                        <div key={idx} style={{display:'flex', flexDirection:'column', padding:'4px 2px', borderBottom: idx < participants.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'}}>
                          <div style={{fontSize: 11, fontWeight: 600, color: '#1db97e'}}>✓ {p.name}</div>
                          <div style={{fontSize: 9, color: '#6b698a', wordBreak: 'break-all'}}>{p.email}</div>
                          <div style={{fontSize: 8, color: '#9896b8', alignSelf: 'flex-end'}}>{new Date(p.votedAt).toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button style={{width:'100%', padding:'9px 12px', background:'#1db97e', color:'#fff', border:'none', borderRadius:9, fontSize:12, fontWeight:600, cursor:'pointer', display:'block', marginTop: 8}} onClick={downloadParticipationData}>
                    📥 Download Voters List (CSV)
                  </button>
                </>
              )}
            </div>
          )}
          <div style={s.sideCard}>
            <div style={s.sideT}>EXPORT RESULTS</div>
            <div style={{display:'flex',gap:6}}>
              <button style={s.expBtn} onClick={exportExcel}>📊 Excel</button>
              <button style={s.expBtn} onClick={exportCSV}>📄 CSV</button>
              <button style={s.expBtn} onClick={exportPDF}>🖨 PDF</button>
            </div>
          </div>
        </div>
      </div>

      {showShare && (
        <div style={s.modalOv} onClick={() => setShare(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={s.modalHdr}><div style={s.modalT}>Share this poll</div><button style={s.modalClose} onClick={() => setShare(false)}>✕</button></div>
            <div style={s.modalS}>Share the link anywhere — anyone with it can vote after Aadhaar verification</div>
            <div style={s.shareLinkRow}>
              <div style={s.shareUrl}>{pollUrl}</div>
              <button style={{...s.copyBtn, background: copied ? '#1db97e' : '#5b4fe9'}} onClick={copyLink}>{copied ? '✓ Copied!' : 'Copy'}</button>
            </div>
            <div style={s.socRow}>
              <button style={{...s.socBtn,flex:1,padding:'9px 4px'}} onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('Vote: '+poll.question)}`)}>🐦 Twitter</button>
              <button style={{...s.socBtn,flex:1,padding:'9px 4px'}} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Vote here: '+window.location.href)}`)}>💬 WhatsApp</button>
              <button style={{...s.socBtn,flex:1,padding:'9px 4px'}} onClick={() => window.location.href=`mailto:?subject=${encodeURIComponent('Vote: '+poll.question)}&body=${encodeURIComponent('Please vote: '+window.location.href)}`}>✉ Email</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}

const s = {
  page:       { maxWidth:920, margin:'0 auto', padding:'24px 22px' },
  grid:       { display:'grid', gridTemplateColumns:'1fr 290px', gap:18, alignItems:'start' },
  center:     { textAlign:'center', padding:60, color:'#9896b8' },
  pollCard:   { background:'#252540', border:'1px solid rgba(255,255,255,0.08)', borderRadius:15, overflow:'hidden', marginBottom:13 },
  topBar:     { height:4, background:'linear-gradient(90deg,#5b4fe9,#9c8ffd)' },
  inner:      { padding:22 },
  metaRow:    { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:13 },
  by:         { fontSize:12, color:'#9896b8' },
  actBtn:     { fontSize:12, padding:'5px 10px', border:'1px solid rgba(255,255,255,0.14)', borderRadius:7, background:'#1e1e38', color:'#9896b8', cursor:'pointer' },
  dotMenu:    { position:'absolute', right:0, top:'110%', background:'#252540', border:'1px solid rgba(255,255,255,0.14)', borderRadius:11, boxShadow:'0 8px 32px rgba(0,0,0,.4)', zIndex:200, minWidth:175, overflow:'hidden' },
  dotItem:    { padding:'10px 14px', fontSize:13, color:'#e8e8f0', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'block' },
  pollQ:      { fontSize:20, fontWeight:700, marginBottom:7, lineHeight:1.35, color:'#e8e8f0' },
  pollSub:    { fontSize:12, color:'#6b698a', marginBottom:18, display:'flex', alignItems:'center', gap:0, flexWrap:'wrap' },
  sep:        { width:3, height:3, borderRadius:'50%', background:'#6b698a', display:'inline-block', margin:'0 7px', verticalAlign:'middle' },
  votedBanner:{ display:'flex', alignItems:'center', gap:7, background:'rgba(29,185,126,0.15)', border:'1px solid rgba(29,185,126,0.25)', borderRadius:10, padding:'10px 13px', fontSize:13, color:'#1db97e', fontWeight:500, marginBottom:13 },
  errBanner:  { background:'rgba(226,75,74,0.15)', color:'#e24b4a', borderRadius:9, padding:'9px 13px', fontSize:13, marginBottom:13 },
  optItem:    { marginBottom:11, cursor:'pointer' },
  oiTop:      { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 },
  oiLeft:     { display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:500 },
  radio:      { width:19, height:19, borderRadius:'50%', border:'1.5px solid rgba(255,255,255,0.14)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', transition:'.15s' },
  radioDot:   { width:8, height:8, borderRadius:'50%', background:'#fff' },
  leadBadge:  { fontSize:10, background:'rgba(124,111,239,0.2)', color:'#b0aaff', padding:'2px 7px', borderRadius:20, fontWeight:600, border:'1px solid rgba(124,111,239,0.3)' },
  oiRight:    { fontSize:12, color:'#9896b8', whiteSpace:'nowrap' },
  barTrack:   { height:8, background:'rgba(255,255,255,0.06)', borderRadius:5, overflow:'hidden' },
  barFill:    { height:'100%', borderRadius:5, transition:'width .75s cubic-bezier(.4,0,.2,1)' },
  divider:    { border:'none', borderTop:'1px solid rgba(255,255,255,0.08)', margin:'15px 0' },
  footer:     { display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' },
  footStat:   { fontSize:12, color:'#6b698a' },
  submitBtn:  { padding:'7px 16px', background:'#5b4fe9', color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' },
  liveBtn:    { display:'flex', alignItems:'center', gap:5, padding:'7px 12px', background:'rgba(29,185,126,0.15)', color:'#1db97e', border:'1px solid rgba(29,185,126,0.3)', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer' },
  liveDot:    { width:7, height:7, borderRadius:'50%' },
  backBtn:    { padding:'7px 12px', border:'1px solid rgba(255,255,255,0.14)', borderRadius:8, background:'none', fontSize:12, color:'#9896b8', cursor:'pointer' },
  shareBtn:   { padding:'7px 13px', background:'#5b4fe9', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer' },
  sideCard:   { background:'#252540', border:'1px solid rgba(255,255,255,0.08)', borderRadius:13, padding:16, marginBottom:12 },
  sideT:      { fontSize:10, fontWeight:600, letterSpacing:'.09em', color:'#6b698a', marginBottom:12 },
  shareLinkRow:{ display:'flex', gap:7, marginBottom:10 },
  shareUrl:   { flex:1, fontSize:11, color:'#9896b8', background:'#1e1e38', border:'1px solid rgba(255,255,255,0.08)', borderRadius:7, padding:'8px 10px', fontFamily:"'DM Mono',monospace", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  copyBtn:    { padding:'8px 12px', color:'#fff', border:'none', borderRadius:7, fontSize:12, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap', transition:'background .2s' },
  socRow:     { display:'flex', gap:6 },
  socBtn:     { flex:1, padding:'7px 3px', border:'1px solid rgba(255,255,255,0.14)', borderRadius:7, fontSize:11, background:'none', color:'#9896b8', cursor:'pointer', textAlign:'center' },
  statGrid:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:7 },
  statItem:   { background:'#1e1e38', borderRadius:9, padding:'10px 11px' },
  statV:      { fontSize:20, fontWeight:700, color:'#e8e8f0' },
  statL:      { fontSize:10, color:'#6b698a', marginTop:2 },
  chartTab:   { fontSize:12, padding:'5px 10px', borderRadius:7, border:'none', background:'none', color:'#9896b8', cursor:'pointer' },
  legRow:     { display:'flex', alignItems:'center', gap:6, marginBottom:5 },
  legSq:      { width:9, height:9, borderRadius:3, flexShrink:0 },
  expBtn:     { flex:1, padding:'7px 3px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:9, fontSize:11, background:'none', color:'#9896b8', cursor:'pointer' },
  modalOv:    { position:'fixed', inset:0, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20, backdropFilter:'blur(4px)' },
  modalBox:   { background:'#252540', border:'1px solid rgba(255,255,255,0.14)', borderRadius:16, padding:28, maxWidth:410, width:'100%' },
  modalHdr:   { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 },
  modalT:     { fontSize:17, fontWeight:700, color:'#e8e8f0' },
  modalClose: { background:'none', border:'none', fontSize:18, color:'#6b698a', cursor:'pointer', lineHeight:1 },
  modalS:     { fontSize:13, color:'#9896b8', marginBottom:15, lineHeight:1.55 },
};
