'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import s from './page.module.css';

const LIMIT = 10;

function fmtWib(dt) {
  if (!dt) return '—';
  try {
    const d = new Date(dt.includes('+') || dt.includes('Z') ? dt : dt + '+07:00');
    return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch { return dt; }
}

export default function DailyCheckTab({ outletList = [] }) {
  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [outletFilter, setOutletFilter] = useState('');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [toast,      setToast]      = useState('');
  const lastHash = useRef('');

  const fetchData = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: p, limit: LIMIT });
      if (outletFilter) qs.set('outlet_id', outletFilter);
      if (search.trim()) qs.set('search', search.trim());
      if (dateFrom) qs.set('date_from', dateFrom);
      if (dateTo)   qs.set('date_to',   dateTo);
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
  }, [page, outletFilter, search, dateFrom, dateTo]);

  useEffect(() => { fetchData(1); setPage(1); }, [outletFilter, search, dateFrom, dateTo]);
  useEffect(() => { fetchData(page); }, [page]);

  const COLS = ['NO','OUTLET','PETUGAS','NORMAL','MASALAH','PROSES','TOTAL','TANGGAL'];

  return (
    <div className={s.dcWrap}>
      {/* head controls */}
      <div className={s.dcHeadBar}>
        <div className={s.dcHeadLeft}>
          {/* outlet filter */}
          <select value={outletFilter} onChange={e=>{setOutletFilter(e.target.value);setPage(1);}} className={s.filtSelect}>
            <option value="">Semua Outlet</option>
            {outletList.map(o=><option key={o.id} value={o.id}>{o.nama}</option>)}
          </select>
          {/* date range */}
          <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1);}} className={s.filtSelect} title="Dari tanggal"/>
          <input type="date" value={dateTo}   onChange={e=>{setDateTo(e.target.value);setPage(1);}}   className={s.filtSelect} title="Sampai tanggal"/>
          {/* search */}
          <div className={s.searchWrap}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={s.searchIco}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Cari petugas…" value={search} className={s.searchInput}
              onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
            {search&&<button onClick={()=>{setSearch('');setPage(1);}} className={s.searchClear}>✕</button>}
          </div>
        </div>
        <div className={s.dcHeadRight}>
          <button className={s.refreshBtn} onClick={()=>{ lastHash.current=''; fetchData(page); setToast('Data Refreshed'); }}>⟳ Refresh Data</button>
          <span className={s.catPageInfo}>{total} data · halaman {page}/{totalPages}</span>
        </div>
      </div>

      {/* table header */}
      <div className={`${s.ledger} ${s.dcLedger}`}>
        <div className={`${s.lgRow} ${s.lgHead} ${s.dcLgRow}`}>
          {COLS.map(c=><span key={c} className={s.sortCol}>{c}</span>)}
        </div>

        {loading && <div className={s.empty}>Memuat…</div>}
        {!loading && rows.length === 0 && <div className={s.empty}><b>Tidak ada data</b></div>}

        {!loading && rows.map((row, idx) => (
          <div key={row.id} className={`${s.lgRow} ${s.dcLgRow}`}>
            <span className={s.lgRowNo}>{total - ((page-1)*LIMIT) - idx}</span>
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
        <div className={s.pgRow}>
          <button className={s.pgBtn} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
          {Array.from({length: totalPages}, (_,i)=>i+1).filter(p=> Math.abs(p-page)<=2 || p===1 || p===totalPages).reduce((acc,p,i,arr)=>{
            if(i>0&&p-arr[i-1]>1) acc.push(<span key={'e'+p} className={s.pgEllipsis}>…</span>);
            acc.push(<button key={p} className={`${s.pgBtn}${page===p?' '+s.pgActive:''}`} onClick={()=>setPage(p)}>{p}</button>);
            return acc;
          },[])}
          <button className={s.pgBtn} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
        </div>
      )}

      {toast && <div className={s.toastWrap} onAnimationEnd={()=>setToast('')}>
        <div className={s.toast}>✓ {toast}</div>
      </div>}
    </div>
  );
}
