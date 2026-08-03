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
    <span
      className={`${s.sortCol}${left ? ' ' + s.hLeft : ''}`}
      onClick={() => onSort(col)}
    >
      {label}
      <span className={s.sortArrow} style={{ opacity: active ? 1 : 0.3 }}>
        {active && sortDir === 'desc' ? '▼' : '▲'}
      </span>
    </span>
  );
}

function AddCatalogModal({ onClose, onSaved }) {
  const [kategoriList, setKategoriList] = useState([]);
  const [userList,     setUserList]     = useState([]);
  const [slaList,      setSlaList]      = useState([]);
  const [form, setForm] = useState({
    kategori_id: '', user_id: '', gejala_id: '', gejala: '', level: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  // load dropdowns
  useEffect(() => {
    fetch('/internal/api/katalog-form?type=kategori').then(r => r.json()).then(setKategoriList);
    fetch('/internal/api/katalog-form?type=users').then(r => r.json()).then(d =>
      setUserList(Array.isArray(d) ? d.filter(u => ['ME','GA'].includes(u.name?.toUpperCase())) : d)
    );
    fetch('/internal/api/katalog-form?type=sla').then(r => r.json()).then(setSlaList);
  }, []);

  // auto gejala_id when kategori changes
  useEffect(() => {
    if (!form.kategori_id) { setForm(f => ({ ...f, gejala_id: '' })); return; }
    fetch(`/internal/api/katalog-form?type=next-id&kategori_id=${form.kategori_id}`)
      .then(r => r.json())
      .then(d => setForm(f => ({ ...f, gejala_id: d.next_id ?? '' })));
  }, [form.kategori_id]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.kategori_id || !form.user_id || !form.gejala_id || !form.gejala || !form.level) {
      setErr('Semua field wajib diisi'); return;
    }
    setSubmitting(true); setErr('');
    const res = await fetch('/internal/api/katalog-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kategori_id: parseInt(form.kategori_id),
        user_id:     parseInt(form.user_id),
        gejala_id:   form.gejala_id,
        gejala:      form.gejala,
        level:       parseInt(form.level),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setErr(data.error || 'Gagal simpan'); return; }
    onSaved();
    onClose();
  }

  return (
    <div className={s.catModalOverlay} onClick={onClose}>
      <div className={s.catModal} onClick={e => e.stopPropagation()}>
        <div className={s.catModalHead}>
          <span className={s.catModalTitle}>+ CATALOG</span>
          <button className={s.catModalClose} onClick={onClose}>✕</button>
        </div>
        <form className={s.catModalForm} onSubmit={handleSubmit}>
          <label className={s.catFormLabel}>Pilih Kategori</label>
          <select className={s.catFormSelect} value={form.kategori_id}
            onChange={e => setForm(f => ({ ...f, kategori_id: e.target.value }))}>
            <option value="">— pilih kategori —</option>
            {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
          </select>

          <label className={s.catFormLabel}>Pilih Type</label>
          <select className={s.catFormSelect} value={form.user_id}
            onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}>
            <option value="">— pilih type —</option>
            {userList.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>

          <label className={s.catFormLabel}>Gejala ID</label>
          <input className={s.catFormInput} value={form.gejala_id} readOnly placeholder="Otomatis terisi..." />

          <label className={s.catFormLabel}>Gejala</label>
          <textarea className={s.catFormTextarea} value={form.gejala}
            onChange={e => setForm(f => ({ ...f, gejala: e.target.value }))}
            placeholder="Deskripsi gejala..." rows={3} />

          <label className={s.catFormLabel}>Pilih SLA Level</label>
          <select className={s.catFormSelect} value={form.level}
            onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
            <option value="">— pilih SLA —</option>
            {slaList.map(sl => (
              <option key={sl.kode} value={sl.kode}>{sl.kode} · {sl.max_hours}j — {sl.nama}</option>
            ))}
          </select>

          {err && <span className={s.catFormErr}>{err}</span>}

          <button className={s.catFormSubmit} type="submit" disabled={submitting}>
            {submitting ? 'Menyimpan…' : 'SUBMIT'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PageCatalog() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage]       = useState(1);
  const [q, setQ]             = useState('');
  const [showModal, setShowModal] = useState(false);
  const lastHash              = useRef('');
  const timer                 = useRef(null);

  const fetchData = useCallback(async (silent = false) => {
    try {
      const res = await fetch('/internal/api/catalog', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('bad response');
      const hash = data.map(r => r.id + ':' + r.updated_at).join('|');
      if (hash !== lastHash.current) {
        lastHash.current = hash;
        setRows(data);
        if (!silent) setPage(1);
      }
      if (!silent) setLoading(false);
    } catch (e) {
      setError(e.message);
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    timer.current = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(timer.current);
  }, [fetchData]);

  function onSort(col) {
    if (sortCol === col) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortCol(null); setSortDir('asc'); }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }

  const filtered   = rows.filter(r => !q || [r.kategori_nama, r.gejala_id, r.gejala, r.contoh]
    .some(v => v?.toLowerCase().includes(q.toLowerCase())));
  const sorted     = mkSort(sortCol, sortDir, filtered);
  const total      = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const pageRows   = sorted.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div className={s.wrap}>
      <div className={s.eyebrow}><span className={s.n}>01</span> List Kendala</div>

      {/* ledger head */}
      <div className={s.ledgerHead}>
        <div className={s.catHeadBar}>
          <div className={s.catHeadLeft}>
            <button className={s.catAddBtn} onClick={() => setShowModal(true)}>+ CATALOG</button>
            <div className={s.searchWrap}>
              <span className={s.searchIco}>⌕</span>
              <input
                className={s.searchInput}
                placeholder="Search.."
                value={q}
                onChange={e => { setQ(e.target.value); setPage(1); }}
              />
              {q && <button className={s.searchClear} onClick={() => { setQ(''); setPage(1); }}>✕</button>}
            </div>
          </div>
          <span className={s.catPageInfo}>{total} data · halaman {page}/{totalPages}</span>
        </div>
      </div>

      {/* table */}
      <div className={s.ledger}>
        <div className={`${s.lgRow} ${s.h} ${s.catLgRow}`}>
          <span className={s.catNo}>NO</span>
          <SortHdr label="KATEGORI"  col="kategori_nama" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
          <SortHdr label="TYPE"      col="user_name"     sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
          <SortHdr label="GEJALA ID" col="gejala_id"     sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
          <SortHdr label="GEJALA"    col="gejala"        sortCol={sortCol} sortDir={sortDir} onSort={onSort} left />
          <SortHdr label="SLA"       col="sla_hours"     sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
          <span className={s.catContoh}>CONTOH</span>
        </div>

        {loading && <div className={s.empty}>Memuat…</div>}
        {error   && <div className={s.empty}>Error: {error}</div>}
        {!loading && !error && pageRows.length === 0 && (
          <div className={s.empty}><b>Tidak ada data</b></div>
        )}

        {!loading && !error && pageRows.map((row, i) => (
          <div key={row.id} className={`${s.lgRow} ${s.catLgRow}`}>
            <span className={s.catNo}>{(page - 1) * LIMIT + i + 1}</span>
            <span className={s.catKat}>{row.kategori_nama || '—'}</span>
            <span className={s.catType}>
              <span className={`${s.typ} ${row.user_name?.toLowerCase().includes('me') ? s.typMe : s.typGa}`}>
                {row.user_name || '—'}
              </span>
            </span>
            <span className={s.catId}>{row.gejala_id || '—'}</span>
            <span className={s.catGejala}>{row.gejala || '—'}</span>
            <span className={s.catSla}>
              {row.sla_nama
                ? <span className={`${s.typ} ${s.catSlaBadge}`}>L{row.level} · {row.sla_hours}j</span>
                : '—'}
            </span>
            <span className={s.catContoh}>{row.contoh || '—'}</span>
          </div>
        ))}
      </div>

      {/* pagination */}
      {totalPages > 1 && (
        <div className={s.pagination}>
          <button className={s.pgBtn} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className={s.catPageInfo}>{page} / {totalPages}</span>
          <button className={s.pgBtn} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}

      <div className={s.siteFoot}>Matoa Group · Sistem Internal Maintenance · {new Date().getFullYear()}</div>

      {showModal && (
        <AddCatalogModal
          onClose={() => setShowModal(false)}
          onSaved={() => { lastHash.current = ''; fetchData(); }}
        />
      )}
    </div>
  );
}
