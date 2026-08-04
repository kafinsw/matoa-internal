'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import s from './page.module.css';

const LIMIT = 10;
const PHP_BASE = '/internal/api/daily-laporan';

function fmtWib(dt) {
  if (!dt) return '—';
  try {
    const d = new Date(dt.includes('+') || dt.includes('Z') ? dt : dt + '+07:00');
    return d.toLocaleString('id-ID', { timeZone:'Asia/Jakarta', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch { return dt; }
}

const STATUS_COLOR = { Normal:'#4caf7d', Bermasalah:'#e5674f', 'Dalam Proses':'#f5a623' };

function DcDetailModal({ id, onClose }) {
  const [data, setData] = useState(null);
  const [err,  setErr]  = useState(null);
  const [zoom, setZoom] = useState(null); // zoomed photo src

  useEffect(() => {
    fetch(`${PHP_BASE}?id=${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setErr(d.error); else setData(d); })
      .catch(e => setErr(e.message));
  }, [id]);

  const tasks = data?.tasks ?? {};
  const taskEntries = Object.entries(tasks);

  return (
    <>
      {/* overlay */}
      <div onClick={onClose} style={{
        position:'fixed',inset:0,background:'rgba(0,0,0,.72)',zIndex:1000,
      }}/>
      {/* panel */}
      <div style={{
        position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
        background:'#141517',border:'1px solid #26272b',borderRadius:16,
        width:'min(92vw,680px)',maxHeight:'85vh',overflowY:'auto',
        zIndex:1001,padding:'24px 20px',display:'flex',flexDirection:'column',gap:16,
      }}>
        {/* header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:'#f4f4f5'}}>{data?.outlet_nama ?? '...'}</div>
            <div style={{fontSize:11,color:'#8b8d93',marginTop:2,fontFamily:'monospace',textTransform:'uppercase',letterSpacing:1}}>
              {data?.user_type} · {data?.user_name} · {fmtWib(data?.created_at)}
            </div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'#8b8d93',fontSize:20,cursor:'pointer',lineHeight:1}}>✕</button>
        </div>

        {/* summary bar */}
        {data && (
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[
              { label:'Normal',    val: taskEntries.filter(([,t])=>t.status==='Normal').length,       color:'#4caf7d' },
              { label:'Masalah',   val: taskEntries.filter(([,t])=>t.status==='Bermasalah').length,   color:'#e5674f' },
              { label:'Proses',    val: taskEntries.filter(([,t])=>t.status==='Dalam Proses').length, color:'#f5a623' },
              { label:'Total',     val: taskEntries.length,                                            color:'#8b8d93' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{background:'#0f1012',border:'1px solid #26272b',borderRadius:8,padding:'6px 12px',textAlign:'center'}}>
                <div style={{fontSize:18,fontWeight:700,color}}>{val}</div>
                <div style={{fontSize:10,color:'#8b8d93',textTransform:'uppercase',letterSpacing:1}}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {err && <div style={{color:'#e5674f',fontSize:13}}>{err}</div>}
        {!data && !err && <div style={{color:'#8b8d93',fontSize:13}}>Memuat...</div>}

        {/* task cards */}
        {taskEntries.map(([kode, task]) => (
          <div key={kode} style={{
            background:'#0f1012',border:`1px solid #26272b`,borderRadius:12,
            borderLeft:`3px solid ${STATUS_COLOR[task.status] ?? '#26272b'}`,
            padding:'12px 14px',display:'flex',flexDirection:'column',gap:8,
          }}>
            {/* task header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:13,fontWeight:600,color:'#f4f4f5'}}>
                {kode}{task.nama ? <span style={{color:'#8b8d93',fontWeight:400}}> · {task.nama}</span> : ''}
              </div>
              <div style={{
                fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:6,
                background: task.status==='Normal' ? '#0f2a1a' : task.status==='Bermasalah' ? '#2a1411' : '#2a1f0a',
                color: STATUS_COLOR[task.status] ?? '#8b8d93',
              }}>{task.status ?? '—'}</div>
            </div>
            {/* note */}
            <div style={{fontSize:12,color: task.note ? '#a9abb0' : '#5e6066'}}>
              <span style={{color:'#8b8d93',fontFamily:'monospace',fontSize:10,textTransform:'uppercase',letterSpacing:1}}>Note: </span>
              {task.note || '—'}
            </div>
            {/* photos */}
            {(task.photos?.length > 0) && (
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
                {task.photos.map((src, i) => {
                  const imgSrc = src.startsWith('data:') || src.startsWith('http') ? src : `/php-api/uploads/${src.replace(/^uploads\//, '')}`;
                  return (
                    <img key={i} src={imgSrc} alt="" onClick={() => setZoom(imgSrc)}
                      style={{width:72,height:72,objectFit:'cover',borderRadius:8,cursor:'zoom-in',border:'1px solid #26272b'}}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* zoom overlay */}
      {zoom && (
        <div onClick={() => setZoom(null)} style={{
          position:'fixed',inset:0,background:'rgba(0,0,0,.92)',zIndex:1100,
          display:'flex',alignItems:'center',justifyContent:'center',cursor:'zoom-out',
        }}>
          <img src={zoom} alt="" style={{maxWidth:'95vw',maxHeight:'90vh',objectFit:'contain',borderRadius:8}}/>
        </div>
      )}
    </>
  );
}

const COLS = [
  { key:'no',           label:'NO'      },
  { key:'type',         label:'TYPE'    },
  { key:'outlet_nama',  label:'OUTLET'  },
  { key:'petugas_nama', label:'PETUGAS' },
  { key:'normal_count', label:'NORMAL'  },
  { key:'masalah_count',label:'MASALAH' },
  { key:'proses_count', label:'PROSES'  },
  { key:'total_items',  label:'TOTAL'   },
  { key:'created_at',   label:'TANGGAL' },
];

export default function DailyCheckTab({ outletList = [] }) {
  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [total,       setTotal]       = useState(0);
  const [totalPages,  setTotalPages]  = useState(1);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState('');
  const [outletFilter,setOutletFilter]= useState('');
  const [userFilter,  setUserFilter]  = useState('');
  const [sortCol,     setSortCol]     = useState(null);
  const [sortDir,     setSortDir]     = useState('asc');
  const [dcOutletList,setDcOutletList]= useState([]);
  const [detailId,    setDetailId]    = useState(null);
  const lastHash = useRef('');

  useEffect(() => {
    fetch(`${PHP_BASE}?outlets_only=1`)
      .then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setDcOutletList(d); }).catch(()=>{});
  }, []);

  const fetchData = useCallback(async (p) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: p, limit: LIMIT });
      if (outletFilter)  qs.set('outlet_id', outletFilter);
      if (userFilter)    qs.set('user_name', userFilter);
      if (search.trim()) qs.set('search', search.trim());
      const r = await fetch(`${PHP_BASE}?${qs}`);
      const d = await r.json();
      const hash = JSON.stringify(d);
      if (hash !== lastHash.current) {
        lastHash.current = hash;
        setRows(d.data || []);
        setTotal(d.pagination?.total || 0);
        setTotalPages(d.pagination?.pages || 1);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [outletFilter, userFilter, search]);

  useEffect(() => { setPage(1); fetchData(1); }, [outletFilter, userFilter, search]);
  useEffect(() => { fetchData(page); }, [page, fetchData]);

  const sorted = [...rows].sort((a, b) => {
    if (!sortCol || sortCol === 'no') return 0;
    const va = a[sortCol] ?? '';
    const vb = b[sortCol] ?? '';
    const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb), 'id');
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (key) => {
    if (key === 'no') return;
    if (sortCol === key) {
      if (sortDir === 'desc') { setSortCol(null); setSortDir('asc'); }
      else setSortDir('desc');
    } else { setSortCol(key); setSortDir('asc'); }
  };

  return (
    <div className={s.dcWrap}>
      {/* controls */}
      <div className={s.dcHeadBar}>
        <div className={s.dcHeadLeft}>
          <div className={s.filt}>
            {['','ME','GA'].map(v=>(
              <button key={v} className={`${s.chip}${userFilter===v?' '+s.on:''}`} onClick={()=>{setUserFilter(v);setPage(1);}}>
                {v===''?'Semua':v}
              </button>
            ))}
          </div>
          <select value={outletFilter} onChange={e=>{setOutletFilter(e.target.value);setPage(1);}} className={s.filtSelect}>
            <option value="">Semua Outlet</option>
            {dcOutletList.map(o=><option key={o.id} value={o.id}>{o.nama}</option>)}
          </select>
          <div className={s.searchWrap}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={s.searchIco}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search..." value={search} className={s.searchInput}
              onChange={e=>setSearch(e.target.value)}/>
            {search&&<button onClick={()=>setSearch('')} className={s.searchClear}>✕</button>}
          </div>
        </div>
        <div className={s.dcHeadRight}>
          <button className={s.refreshBtn} onClick={()=>{ lastHash.current=''; fetchData(page); }}>⟳ Refresh</button>
          <span className={s.catPageInfo}>{total} data · hal {page}/{totalPages}</span>
        </div>
      </div>

      {/* ledger */}
      <div className={`${s.ledger} ${s.dcLedger}`}>
        {/* header */}
        <div className={`${s.lgRow} ${s.lgHead} ${s.dcLgRow} ${s.h}`}>
          {COLS.map(c => {
            const active = sortCol === c.key;
            return (
              <span key={c.key} className={s.sortCol}
                onClick={() => toggleSort(c.key)}
                style={{ cursor: c.key === 'no' ? 'default' : 'pointer' }}>
                {c.label}
                {c.key !== 'no' && (
                  <span className={s.sortArrow} style={{ opacity: active ? 1 : 0.3 }}>
                    {active && sortDir === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </span>
            );
          })}
        </div>
        {/* rows */}
        {loading && <div className={s.dcCell} style={{padding:'16px',color:'#8b8d93'}}>Memuat...</div>}
        {!loading && sorted.map((row, idx) => (
          <div key={row.id} className={`${s.lgRow} ${s.dcLgRow}`}>
            <span className={s.dcCell}>{(page-1)*LIMIT+idx+1}</span>
            <span className={s.dcCell}>
              <span className={`${s.typeBadge} ${row.user_name==='GA'?s.typeGA:s.typeME}`}>{row.user_name ?? '—'}</span>
            </span>
            <span className={s.dcCell}>
              <button onClick={() => setDetailId(row.id)} className={s.outletBtn}>{row.outlet_nama}</button>
            </span>
            <span className={s.dcCell}>{row.petugas_nama}</span>
            <span className={`${s.dcCell} ${row.normal_count  > 0 ? s.dcNormal  : s.dcZero}`}>{row.normal_count}</span>
            <span className={`${s.dcCell} ${row.masalah_count > 0 ? s.dcMasalah : s.dcZero}`}>{row.masalah_count}</span>
            <span className={`${s.dcCell} ${row.proses_count  > 0 ? s.dcProses  : s.dcZero}`}>{row.proses_count}</span>
            <span className={s.dcCell}>{row.total_items}</span>
            <span className={s.dcCell}>{fmtWib(row.created_at)}</span>
          </div>
        ))}
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className={s.pagination}>
          <button className={s.pgBtn} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
          {Array.from({length:totalPages},(_,i)=>i+1)
            .filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1)
            .map((p,i,arr)=>(
              <span key={p}>
                {i>0&&arr[i-1]!==p-1&&<span className={s.pgDot}>…</span>}
                <button className={`${s.pgBtn}${p===page?' '+s.pgActive:''}`} onClick={()=>setPage(p)}>{p}</button>
              </span>
            ))}
          <button className={s.pgBtn} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
        </div>
      )}

      {/* detail modal */}
      {detailId && <DcDetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
