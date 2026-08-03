'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import s from './page.module.css';

const SORT_COLS = ['no', 'kategori', 'type', 'gejala_id', 'sla', 'contoh'];

function sortData(rows, col, dir) {
  if (!col || !dir) return rows;
  return [...rows].sort((a, b) => {
    let av = a[col] ?? '', bv = b[col] ?? '';
    if (typeof av === 'string') av = av.toLowerCase();
    if (typeof bv === 'string') bv = bv.toLowerCase();
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

export default function PageCatalog() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [sortCol, setSortCol] = useState('gejala_id');
  const [sortDir, setSortDir] = useState('asc');
  const lastUpdated           = useRef(null);
  const timerRef              = useRef(null);

  const fetchData = useCallback(async (silent = false) => {
    try {
      const res = await fetch('/api/catalog', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // realtime: hanya update jika ada data baru (cek updated_at terbaru)
      const newest = data.reduce((mx, r) => r.updated_at > mx ? r.updated_at : mx, '');
      if (newest !== lastUpdated.current) {
        lastUpdated.current = newest;
        setRows(data);
      }
      if (!silent) setLoading(false);
    } catch (e) {
      setError(e.message);
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    timerRef.current = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(timerRef.current);
  }, [fetchData]);

  function handleSort(col) {
    if (sortCol === col) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortCol(null); setSortDir(null); }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }

  function chevron(col) {
    if (sortCol !== col) return <span className={s.sortChev}>⇅</span>;
    return <span className={s.sortChevActive}>{sortDir === 'asc' ? '▲' : '▼'}</span>;
  }

  const sorted = sortData(rows, sortCol, sortDir);

  return (
    <div className={s.wrap}>
      <div className={s.eyebrow}><span className={s.n}>01</span> List Kendala</div>

      {loading && <div className={s.nodata}>Memuat…</div>}
      {error   && <div className={s.nodata} style={{color:'var(--err)'}}>Error: {error}</div>}

      {!loading && !error && (
        <div className={s.dtTableWrap}>
          <table className={s.catTable}>
            <thead>
              <tr className={s.catHead}>
                <th className={s.catTh} onClick={()=>handleSort('no')}>NO {chevron('no')}</th>
                <th className={s.catTh} onClick={()=>handleSort('kategori')}>KATEGORI {chevron('kategori')}</th>
                <th className={s.catTh} onClick={()=>handleSort('type')}>TYPE {chevron('type')}</th>
                <th className={s.catTh} onClick={()=>handleSort('gejala_id')}>GEJALA ID {chevron('gejala_id')}</th>
                <th className={s.catTh} onClick={()=>handleSort('sla')}>SLA {chevron('sla')}</th>
                <th className={s.catTh}>CONTOH</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? s.catRow : s.catRowAlt}>
                  <td className={s.catTd}>{i + 1}</td>
                  <td className={s.catTd}>{row.kategori_nama || '—'}</td>
                  <td className={s.catTd}>{row.user_name || '—'}</td>
                  <td className={`${s.catTd} ${s.catMono}`}>{row.gejala_id || '—'}</td>
                  <td className={s.catTd}>
                    {row.sla_nama
                      ? <span className={s.slaTag}>{row.sla_nama} ({row.sla_hours}h)</span>
                      : '—'}
                  </td>
                  <td className={s.catTd}>{row.contoh || '—'}</td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr><td colSpan={6} className={s.catEmpty}>Tidak ada data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className={s.siteFoot}>Matoa Group · Sistem Internal Maintenance · {new Date().getFullYear()}</div>
    </div>
  );
}
