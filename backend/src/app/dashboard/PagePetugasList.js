'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import s from './page.module.css';

const LIMIT = 10;

function mkSort(col, dir, rows) {
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

function SortHdr({ label, col, sortCol, sortDir, onSort, left }) {
  const active = sortCol === col;
  return (
    <span className={`${s.sortCol}${left ? ' ' + s.hLeft : ''}`} onClick={() => onSort(col)}>
      {label}
      <span className={s.sortArrow} style={{ opacity: active ? 1 : 0.3 }}>
        {active && sortDir === 'desc' ? '▼' : '▲'}
      </span>
    </span>
  );
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return <div className={s.catToast}><span className={s.catToastIco}>✓</span>{msg}</div>;
}

function fmtLastSeen(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function PetugasForm({ initial, isEdit, onSubmit, submitting, err }) {
  const [form, setForm] = useState(initial);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  return (
    <form className={s.catModalForm} onSubmit={e => { e.preventDefault(); onSubmit(form); }}>
      <label className={s.catFormLabel}>Nama Petugas</label>
      <input className={s.catFormInput} value={form.nama} onChange={e => set('nama', e.target.value)} placeholder="Nama petugas..." />
      <label className={s.catFormLabel}>Status</label>
      <select className={s.catFormSelect} value={String(form.is_active)} onChange={e => set('is_active', parseInt(e.target.value))}>
        <option value="1">Aktif</option>
        <option value="0">Tidak Aktif</option>
      </select>
      {err && <span className={s.catFormErr}>{err}</span>}
      <button className={s.catFormSubmit} type="submit" disabled={submitting}>
        {submitting ? 'Menyimpan…' : isEdit ? 'OK' : 'SUBMIT'}
      </button>
    </form>
  );
}

function AddPetugasModal({ onClose, onSaved }) {
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  async function handleSubmit(form) {
    if (!form.nama || form.nama.length < 2) { setErr('Nama min 2 karakter'); return; }
    setSubmitting(true); setErr('');
    try {
      const res = await fetch('/internal/api/petugas-list', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: form.nama, is_active: form.is_active }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(`${data.error || 'Gagal simpan'} (HTTP ${res.status})`); return; }
      onSaved(); onClose();
    } catch(e) { setErr(`Network error: ${e.message}`); }
    finally { setSubmitting(false); }
  }
  return (
    <div className={s.catModalOverlay}>
      <div className={s.catModal}>
        <div className={s.catModalHead}>
          <span className={s.catModalTitle}>+ PETUGAS</span>
          <button className={s.catModalClose} type="button" onClick={onClose}>✕</button>
        </div>
        <PetugasForm initial={{ nama: '', is_active: 1 }} isEdit={false} onSubmit={handleSubmit} submitting={submitting} err={err} />
      </div>
    </div>
  );
}

function EditPetugasModal({ row, onClose, onSaved }) {
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  async function handleSubmit(form) {
    if (!form.nama || form.nama.length < 2) { setErr('Nama min 2 karakter'); return; }
    setSubmitting(true); setErr('');
    try {
      const res = await fetch('/internal/api/petugas-list', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, nama: form.nama, is_active: form.is_active }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(`${data.error || 'Gagal simpan'} (HTTP ${res.status})`); return; }
      onSaved(); onClose();
    } catch(e) { setErr(`Network error: ${e.message}`); }
    finally { setSubmitting(false); }
  }
  return (
    <div className={s.catModalOverlay}>
      <div className={s.catModal}>
        <div className={s.catModalHead}>
          <span className={s.catModalTitle}>✎ EDIT PETUGAS</span>
          <button className={s.catModalClose} type="button" onClick={onClose}>✕</button>
        </div>
        <PetugasForm initial={{ nama: row.nama ?? '', is_active: parseInt(row.is_active ?? 1) }} isEdit={true} onSubmit={handleSubmit} submitting={submitting} err={err} />
      </div>
    </div>
  );
}

function DeletePetugasModal({ row, onClose, onConfirm }) {
  return (
    <div className={s.catModalOverlay}>
      <div className={`${s.catModal} ${s.catModalSm}`}>
        <div className={s.catDelTitle}>Ingin menghapus petugas ini?</div>
        <div className={s.catDelSub}>{row.nama}</div>
        <div className={s.catDelBtns}>
          <button className={`${s.catFormSubmit} ${s.catDelBtn}`} onClick={onConfirm}>DELETE</button>
          <button className={`${s.catFormSubmit} ${s.catCancelBtn}`} onClick={onClose}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

export default function PagePetugasList() {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [sortCol, setSortCol]     = useState(null);
  const [sortDir, setSortDir]     = useState('asc');
  const [page, setPage]           = useState(1);
  const [q, setQ]                 = useState('');
  const [showAdd, setShowAdd]     = useState(false);
  const [editRow, setEditRow]     = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [toast, setToast]         = useState('');
  const lastHash                  = useRef('');

  const fetchData = useCallback(async (silent = false) => {
    try {
      const res = await fetch('/internal/api/petugas-list', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('bad response');
      const hash = data.map(r => r.id + ':' + r.nama + ':' + r.is_active + ':' + r.last_seen).join('|');
      if (hash !== lastHash.current) { lastHash.current = hash; setRows(data); if (!silent) setPage(1); }
      if (!silent) setLoading(false);
    } catch (e) { setError(e.message); if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDeleteConfirm() {
    if (!deleteRow) return;
    try {
      const res = await fetch(`/internal/api/petugas-list?id=${deleteRow.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { alert(`Gagal hapus: ${data.error || ''} (HTTP ${res.status})`); return; }
      lastHash.current = ''; fetchData();
      setToast('Petugas Berhasil Dihapus');
    } catch(e) { alert(`Network error: ${e.message}`); }
    finally { setDeleteRow(null); }
  }

  function onSort(col) {
    if (sortCol === col) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortCol(null); setSortDir('asc'); }
    } else { setSortCol(col); setSortDir('asc'); }
  }

  const filtered   = rows.filter(r => !q || [r.nama, r.is_active ? 'aktif' : 'tidak aktif'].some(v => String(v)?.toLowerCase().includes(q.toLowerCase())));
  const sorted     = mkSort(sortCol, sortDir, filtered);
  const total      = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const pageRows   = sorted.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div className={`${s.wrap} ${s.katWrap}`}>
      <div className={s.eyebrow}><span className={s.n}>01</span> List Petugas</div>

      <div className={s.ledgerHead}>
        <div className={s.catHeadBar}>
          <div className={s.catHeadLeft}>
            <button className={s.catAddBtn} onClick={() => setShowAdd(true)}>+ PETUGAS</button>
            <div className={s.searchWrap}>
              <span className={s.searchIco}>⌕</span>
              <input className={s.searchInput} placeholder="Search.." value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
              {q && <button className={s.searchClear} onClick={() => { setQ(''); setPage(1); }}>✕</button>}
            </div>
          </div>
          <div className={s.catHeadRight}>
            <button className={s.refreshBtn} onClick={() => { lastHash.current = ''; fetchData(); setToast('Data Refreshed'); }}>⟳ Refresh Data</button>
            <span className={s.catPageInfo}>{total} data · halaman {page}/{totalPages}</span>
          </div>
        </div>
      </div>

      <div className={`${s.ledger} ${s.petugasLedger}`}>
        <div className={`${s.lgRow} ${s.h} ${s.petugasLgRow}`}>
          <span className={s.catNo}>NO</span>
          <SortHdr label="NAMA" col="nama" sortCol={sortCol} sortDir={sortDir} onSort={onSort} left />
          <SortHdr label="STATUS" col="is_active" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
          <SortHdr label="AKTIFITAS TERAKHIR" col="last_seen" sortCol={sortCol} sortDir={sortDir} onSort={onSort} left />
          <span className={s.catAction}>ACTION</span>
        </div>

        {loading && <div className={s.empty}>Memuat…</div>}
        {error   && <div className={s.empty}>Error: {error}</div>}
        {!loading && !error && pageRows.length === 0 && <div className={s.empty}><b>Tidak ada data</b></div>}

        {!loading && !error && pageRows.map((row, i) => (
          <div key={row.id} className={`${s.lgRow} ${s.petugasLgRow}`}>
            <span className={s.catNo}>{(page - 1) * LIMIT + i + 1}</span>
            <span className={s.catGejala}>{row.nama || '—'}</span>
            <span className={s.catType}>
              <span className={`${s.typ} ${parseInt(row.is_active) === 1 ? s.typActive : s.typInactive}`}>
                {parseInt(row.is_active) === 1 ? 'Aktif' : 'Tidak Aktif'}
              </span>
            </span>
            <span className={s.catGejala}>{fmtLastSeen(row.last_seen)}</span>
            <span className={s.catAction}>
              <button className={s.catActBtn} title="Edit" onClick={() => setEditRow(row)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button className={`${s.catActBtn} ${s.catActDel}`} title="Hapus" onClick={() => setDeleteRow(row)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </span>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className={s.pagination}>
          <button className={s.pgBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className={s.catPageInfo}>{page} / {totalPages}</span>
          <button className={s.pgBtn} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      {showAdd   && <AddPetugasModal    onClose={() => setShowAdd(false)}   onSaved={() => { lastHash.current = ''; fetchData(); setToast('Petugas Berhasil Ditambahkan'); }} />}
      {editRow   && <EditPetugasModal   row={editRow}  onClose={() => setEditRow(null)}   onSaved={() => { lastHash.current = ''; fetchData(); setToast('Petugas Berhasil Diubah'); }} />}
      {deleteRow && <DeletePetugasModal row={deleteRow} onClose={() => setDeleteRow(null)} onConfirm={handleDeleteConfirm} />}
      {toast     && <Toast msg={toast} onDone={() => setToast('')} />}
    </div>
  );
}
