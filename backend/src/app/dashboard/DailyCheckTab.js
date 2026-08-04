'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import s from './page.module.css';

const LIMIT = 10;

function fmtWib(dt) {
  if (!dt) return '—';
  try {
    const d = new Date(dt.includes('+') || dt.includes('Z') ? dt : dt + '+07:00');
    return d.toLocaleString('id-ID', { timeZone:'Asia/Jakarta', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch { return dt; }
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
  const [userFilter,  setUserFilter]  = useState(''); // '' | 'ME' | 'GA'
  const [sortCol,     setSortCol]     = useState(null);
  const [sortDir,     setSortDir]     = useState('asc');
  const lastHash = useRef('');

  const fetchData = useCallback(async (p) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: p, limit: LIMIT });
      if (outletFilter)  qs.set('outlet_id', outletFilter);
      if (userFilter)    qs.set('user_name', userFilter);
      if (search.trim()) qs.set('search', search.trim());
      const r = await fetch(`/internal/api/daily-laporan?${qs}`);
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

  // derive TYPE from outlet_id prefix in tasks keys (c=GA, e=ME) — use outlet name prefix fallback
  const getType = (row) => row._type || '—';

  return (
    <div className={s.dcWrap}>
      {/* controls */}
      <div className={s.dcHeadBar}>
        <div className={s.dcHeadLeft}>
          <select value={outletFilter} onChange={e=>{setOutletFilter(e.target.value);}} className={s.filtSelect}>
            <option value="">Semua Outlet</option>
            {outletList.map(o=><option key={o.id} value={o.id}>{o.nama}</option>)}
          </select>
          <div className={s.filt}>
            {['','ME','GA'].map(v=>(
              <button key={v} className={`${s.chip}${userFilter===v?' '+s.on:''}`} onClick={()=>{setUserFilter(v);setPage(1);}}>
                {v===''?'Semua':v}
              </button>
            ))}
          </div>
          <div className={s.searchWrap}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={s.searchIco}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Cari outlet / petugas / user…" value={search} className={s.searchInput}
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

        {loading  && <div className={s.empty}>Memuat…</div>}
        {!loading && rows.length === 0 && <div className={s.empty}><b>Tidak ada data</b></div>}

        {!loading && sorted.map((row, idx) => (
          <div key={row.id} className={`${s.lgRow} ${s.dcLgRow}`}>
            <span className={s.lgRowNo}>{total - ((page-1)*LIMIT) - idx}</span>
            <div className={s.colTyp}>
              <span className={`${s.typ} ${row.user_name === 'GA' ? s.typGa : s.typMe}`}>{row.user_name || '—'}</span>
            </div>
            <span className={s.dcCell}>{row.outlet_nama || '—'}</span>
            <span className={s.dcCell}>{row.petugas_nama || '—'}</span>
            <span className={`${s.dcCell} ${s.dcNormal}`}>{row.normal_count}</span>
            <span className={`${s.dcCell} ${s.dcMasalah}`}>{row.masalah_count}</span>
            <span className={`${s.dcCell} ${s.dcProses}`}>{row.proses_count}</span>
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
    </div>
  );
}
