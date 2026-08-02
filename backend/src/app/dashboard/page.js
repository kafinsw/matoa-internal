'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import s from './page.module.css';

function PhotoViewer({ src, onClose }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(false);
  const ds = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const pinchRef = useRef({ dist: 0, scale: 1 });
  const stateRef = useRef({ scale: 1, pos: { x: 0, y: 0 }, drag: false });
  const vpRef = useRef(null);
  const lastTap = useRef(0);
  const clamp = (v) => Math.min(5, Math.max(0.5, v));

  useEffect(() => { stateRef.current = { scale, pos, drag }; }, [scale, pos, drag]);

  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchStart = (e) => {
      if (e.touches.length === 2) { e.preventDefault(); pinchRef.current = { dist: dist(e.touches), scale: stateRef.current.scale }; }
      else if (e.touches.length === 1) { const t = e.touches[0]; ds.current = { x: t.clientX, y: t.clientY, px: stateRef.current.pos.x, py: stateRef.current.pos.y }; setDrag(true); }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2) { e.preventDefault(); setScale(clamp(pinchRef.current.scale * dist(e.touches) / pinchRef.current.dist)); }
      else if (e.touches.length === 1 && stateRef.current.drag) { const t = e.touches[0]; setPos({ x: ds.current.px + (t.clientX - ds.current.x), y: ds.current.py + (t.clientY - ds.current.y) }); }
    };
    const onWheel = (e) => { e.preventDefault(); setScale((p) => clamp(p + (e.deltaY > 0 ? -0.15 : 0.15))); };
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => { el.removeEventListener('touchstart', onTouchStart); el.removeEventListener('touchmove', onTouchMove); el.removeEventListener('wheel', onWheel); };
  }, []);

  const onDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) { if (stateRef.current.scale > 1) { setScale(1); setPos({ x: 0, y: 0 }); } else setScale(2.5); }
    lastTap.current = now;
  };

  return (
    <div className={s.pvOverlay} onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div ref={vpRef} className={s.pvViewport}
        onClick={onDoubleTap}
        onMouseDown={(e)=>{ if(scale<=1) return; setDrag(true); ds.current={x:e.clientX,y:e.clientY,px:pos.x,py:pos.y}; }}
        onMouseMove={(e)=>{ if(!drag) return; setPos({x:ds.current.px+(e.clientX-ds.current.x),y:ds.current.py+(e.clientY-ds.current.y)}); }}
        onMouseUp={()=>setDrag(false)}
      >
        <img src={src} alt="foto" draggable={false} className={s.pvImg} style={{transform:`translate(${pos.x}px,${pos.y}px) scale(${scale})`,cursor:scale>1?'grab':'zoom-in'}} />
      </div>
      <div className={s.pvControls}>
        <button onClick={(e)=>{e.stopPropagation();setScale(v=>clamp(v+0.3));}} className={s.pvBtn}>＋</button>
        <button onClick={(e)=>{e.stopPropagation();setScale(v=>clamp(v-0.3));}} className={s.pvBtn}>−</button>
        <button onClick={(e)=>{e.stopPropagation();setScale(1);setPos({x:0,y:0});}} className={s.pvBtnSm}>1:1</button>
        <button onClick={onClose} className={s.pvBtn}>✕</button>
      </div>
      <div className={s.pvHint}>{scale>1?`${Math.round(scale*100)}%`:'Ketuk 2x / scroll untuk zoom'}</div>
    </div>
  );
}

const STATIC_BASE = process.env.NEXT_PUBLIC_STATIC_BASE || '/php-api';

// ── WIB helpers (no ICU/toLocaleString) ──────────────────────────────
const ID_MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
function nowWIB() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + d.getTimezoneOffset() + 7 * 60);
  return d;
}
function toYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function toDDMM(d) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}
function toDDMMM(d) {
  return `${String(d.getDate()).padStart(2,'0')} ${ID_MONTHS[d.getMonth()]}`;
}
function toDDMMMYYYY(d) {
  return `${String(d.getDate()).padStart(2,'0')} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function createdToWIB(str) {
  if (!str) return null;
  const d = new Date(str);
  if (isNaN(d)) return null;
  const wib = new Date(d);
  wib.setMinutes(wib.getMinutes() + wib.getTimezoneOffset() + 7 * 60);
  return wib;
}
function getMondayWIB(offsetWeeks = 0) {
  const now = nowWIB();
  const dow = now.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  now.setDate(now.getDate() + diff + offsetWeeks * 7);
  now.setHours(0, 0, 0, 0);
  return now;
}

// ── SLA config ───────────────────────────────────────────────────────
const SLA_HOURS = { L1: 24, L2: 72, L3: 120 };

function slaDeadline(createdAt, level, status, deadlineDate) {
  if (status === 'tunggu_barang' || status === 'barang_diproses') return 'hold';
  if (deadlineDate) return parseWIB(deadlineDate);
  return null;
}

function scheduleStatus(scheduleDate) {
  if (!scheduleDate) return null;
  const now = nowWIB();
  const sch = parseWIB(scheduleDate);
  const schWIB = new Date(sch.getTime() + (sch.getTimezoneOffset() + 420) * 60000);
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const schDay = new Date(schWIB.getFullYear(), schWIB.getMonth(), schWIB.getDate());
  if (schDay < nowDay) return 'overdue';
  if (schDay.getTime() === nowDay.getTime()) return 'today';
  return 'ok';
}

function slaStatus(deadline) {
  if (!deadline) return null;
  const diff = deadline - Date.now();
  if (diff < 0) return 'overdue';
  if (diff < 3600000 * 4) return 'warning';
  return 'ok';
}

function parseWIB(dt) {
  if (!dt) return null;
  if (dt instanceof Date) return dt;
  // append +07:00 only if no tz info present
  const s = dt.replace(' ', 'T');
  return new Date(/[+Z]/.test(s) ? s : s + 'Z');
}

function fmtDatetime(dt) {
  if (!dt) return '—';
  const d = parseWIB(dt);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
  });
}

function fmtDate(dt) {
  if (!dt) return '—';
  const d = parseWIB(dt);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
  });
}

function relTime(ts) {
  const d = Math.floor((Date.now() - parseWIB(ts)) / 86400000);
  if (d < 1) return 'Hari ini';
  if (d === 1) return 'Kemarin';
  if (d < 30) return d + ' hari lalu';
  return Math.floor(d / 30) + ' bulan lalu';
}

// ── TrendChart ────────────────────────────────────────────────────────
function TrendChart({ buckets }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el || !buckets.length) return;
    const W = el.clientWidth || 700, H = 150;
    const maxV = Math.max(1, ...buckets.map(b => Math.max(+b.kendala_me || 0, +b.pekerjaan_ga || 0)));
    const pad = { t: 10, b: 28, l: 20, r: 10 };
    const dw = (W - pad.l - pad.r) / buckets.length;
    const bw = dw * 0.28;
    let svg = '';
    buckets.forEach((b, i) => {
      const x = pad.l + i * dw + dw / 2;
      const meH = ((+b.kendala_me || 0) / maxV) * (H - pad.t - pad.b);
      const gaH = ((+b.pekerjaan_ga || 0) / maxV) * (H - pad.t - pad.b);
      const y0 = H - pad.b;
      svg += `<rect x="${x-bw-1}" y="${y0-meH}" width="${bw}" height="${Math.max(meH,1)}" fill="#f2f2f3" rx="2"/>`;
      svg += `<rect x="${x+1}" y="${y0-gaH}" width="${bw}" height="${Math.max(gaH,1)}" fill="#5a5a61" rx="2"/>`;
      if (i % 3 === 0 && b.date) {
        const d2 = new Date(b.date + 'T00:00:00');
        const wibD = new Date(d2.getTime() + (d2.getTimezoneOffset() + 420) * 60000);
        const lbl = `${String(wibD.getDate()).padStart(2,'0')} ${ID_MONTHS[wibD.getMonth()]}`;
        svg += `<text x="${x}" y="${H-6}" text-anchor="middle" font-size="9" fill="#5a5a61" font-family="JetBrains Mono,monospace">${lbl}</text>`;
      }
    });
    svg += `<line x1="${pad.l}" y1="${H-pad.b}" x2="${W-pad.r}" y2="${H-pad.b}" stroke="#26262b" stroke-width="1"/>`;
    el.innerHTML = svg;
    el.setAttribute('viewBox', `0 0 ${W} ${H}`);
  }, [buckets]);
  return <svg ref={ref} className={s.chart} />;
}

const FILTERS = ['semua','me','ga'];
const FILTER_LABELS = { semua:'SEMUA', me:'ME', ga:'GA' };
const STATUS_LABELS = { dijadwalkan:'Dijadwalkan', sedang_dikerjakan:'Sedang Dikerjakan', selesai_dikerjakan:'Selesai Dikerjakan', terverifikasi:'Terverifikasi', tunggu_barang:'Tunggu Barang', barang_diproses:'Barang Diproses', barang_ready:'Barang Ready', over_sla:'Over SLA' };
const STATUS_BORDER = { selesai_dikerjakan:'#3b82f6', sedang_dikerjakan:'#f97316', tunggu_barang:'#ef4444', barang_diproses:'#ef4444', barang_ready:'#eab308', terverifikasi:'#22c55e' };
const STATUS_OPTIONS = [
  { v:'', l:'Semua Status' },
  { v:'dijadwalkan', l:'Dijadwalkan' },
  { v:'sedang_dikerjakan', l:'Sedang Dikerjakan' },
  { v:'selesai_dikerjakan', l:'Selesai Dikerjakan' },
  { v:'terverifikasi', l:'Terverifikasi' },
  { v:'tunggu_barang', l:'Tunggu Barang' },
  { v:'barang_diproses', l:'Barang Diproses' },
  { v:'barang_ready', l:'Barang Ready' },
  { v:'over_sla', l:'Over SLA' },
];
const RANGE_OPTIONS = [{ v:0,l:'Semua' },{ v:7,l:'7 Hari' },{ v:14,l:'14 Hari' },{ v:30,l:'30 Hari' }];
const LIMIT = 10;

// ── DispatchBoard ─────────────────────────────────────────────────────
const DISPATCH_SLOTS = [
  '08:00 – 10:00','08:00 – 10:00',
  '10:00 – 12:00','10:00 – 12:00',
  '13:00 – 15:00','13:00 – 15:00',
  '15:00 – 17:00','15:00 – 17:00',
];
const DAY_NAMES = ['Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const LV_COLOR  = { L1:'#ef4444', L2:'#f97316', L3:'#eab308' };
const LV_ORD    = { L1:0, L2:1, L3:2 };

function DispatchBoard({ onOpenDetail }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [dispatch, setDispatch]     = useState([]);

  useEffect(() => {
    let cancelled = false;
    function load() {
      const monday  = getMondayWIB(weekOffset);
      const satEnd  = new Date(monday.getTime() + 6 * 86400000 - 1);
      const monMs   = monday.getTime();
      const satMs   = satEnd.getTime();
      fetch('/internal/api/laporan/feed?limit=500&filter=semua')
        .then(r => r.json())
        .then(d => {
          if (cancelled || !d.ok || !Array.isArray(d.data)) return;
          // current month in WIB
          const nowW = nowWIB();
          const curY = nowW.getFullYear();
          const curM = nowW.getMonth(); // 0-indexed
          const filtered = d.data
            .filter(r => {
              if (!r.created_at) return false;
              const w = createdToWIB(r.created_at);
              if (!w) return false;
              // only current month
              return w.getFullYear() === curY && w.getMonth() === curM;
            })
            .sort((a, b) => {
              const lo = (LV_ORD[a.level] ?? 9) - (LV_ORD[b.level] ?? 9);
              if (lo !== 0) return lo;
              // oldest first
              return new Date(a.created_at||0) - new Date(b.created_at||0);
            });
          setDispatch(filtered);
        })
        .catch(() => {});
    }
    load();
    const t = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(t); };
  }, [weekOffset]);

  const monday = getMondayWIB(weekOffset);
  // Mon–Sat (6 days), skip Sunday
  const days = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i); // 0=Mon … 5=Sat
    return d;
  });
  // nav boundary: lock to current WIB month
  const nowW2 = nowWIB();
  const curY2 = nowW2.getFullYear();
  const curM2 = nowW2.getMonth();
  const prevMon = new Date(monday); prevMon.setDate(monday.getDate() - 7);
  const nextMon = new Date(monday); nextMon.setDate(monday.getDate() + 7);
  const canGoPrev = prevMon.getFullYear() === curY2 && prevMon.getMonth() === curM2;
  const canGoNext = nextMon.getFullYear() === curY2 && nextMon.getMonth() === curM2;

  // which week-of-month slot is this? (0=first week, 1=second, ...)
  // count how many full Mon–Sat blocks have passed since start of month
  const monthStart = new Date(monday.getFullYear(), monday.getMonth(), 1);
  // find first Monday of the month
  const firstMon = new Date(monthStart);
  const dow = firstMon.getDay(); // 0=Sun
  const diff = dow === 0 ? 1 : dow === 1 ? 0 : 8 - dow;
  firstMon.setDate(firstMon.getDate() + diff);
  const weekIndex = Math.round((monday - firstMon) / (7 * 86400000));

  // distribute: skip weekIndex*48 items, then fill this week's 48 slots
  const dayKeys = days.map(d => toYMD(d));
  const bySlot  = Array.from({ length: 8 }, () => Array(6).fill(null));
  const skip = weekIndex * 48; // 6 days × 8 slots
  const counters = [0,0,0,0,0,0];
  let assigned = 0;
  for (let i = skip; i < dispatch.length; i++) {
    const r = dispatch[i];
    let placed = false;
    for (let di = 0; di < 6; di++) {
      if (counters[di] < 8) {
        bySlot[counters[di]][di] = r;
        counters[di]++;
        placed = true;
        assigned++;
        break;
      }
    }
    if (!placed) break;
  }

  const sat = days[5];
  const weekLabel = `${toDDMMM(monday)} – ${toDDMMMYYYY(sat)}`;
  const todayKey  = toYMD(nowWIB());

  // format day header: "SENIN (03/08)"
  const dayHeaders = days.map((d, i) => {
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    return `${DAY_NAMES[i]} (${dd}/${mm})`;
  });

  return (
    <div style={{ marginTop:32 }}>
      <div className={s.eyebrow}><span className={s.n}>04</span> Papan Dispatch</div>
      <div className={s.dtNav}>
        <button className={s.dtNavBtn} onClick={() => setWeekOffset(w => w - 1)} disabled={!canGoPrev}>← Minggu Lalu</button>
        <span className={s.dtWeekLabel}>{weekLabel}</span>
        <button className={s.dtNavBtn} onClick={() => setWeekOffset(w => w + 1)} disabled={!canGoNext}>Minggu Depan →</button>
        {weekOffset !== 0 && (
          <button className={s.dtNavBtnSm} onClick={() => setWeekOffset(0)}>Hari Ini</button>
        )}
      </div>

      {/* dispatch table — same ledger style as laporan */}
      <div className={s.ledger} style={{ marginTop: 12 }}>
        {/* header row */}
        <div className={`${s.lgRow} ${s.h} ${s.dtDispRow}`}>
          <span>NO</span>
          <span>WAKTU</span>
          {dayHeaders.map((h, i) => (
            <span key={i} style={{ color: dayKeys[i] === todayKey ? 'var(--ink)' : undefined }}>{h}</span>
          ))}
        </div>
        {/* data rows */}
        {bySlot.map((row, slotIdx) => (
          <div key={slotIdx} className={`${s.lgRow} ${s.dtDispRow}`}>
            <span className={s.lgRowNo}>{slotIdx + 1}</span>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{DISPATCH_SLOTS[slotIdx]}</span>
            {row.map((item, di) => (
              <div key={di} style={{ background: dayKeys[di] === todayKey ? 'var(--panel2)' : undefined, borderRadius: 6, minHeight: 32 }}>
                {item && (
                  <div
                    style={{ borderLeft: `3px solid ${LV_COLOR[item.level] || 'var(--line)'}`, paddingLeft: 6, cursor: 'pointer' }}
                    onClick={() => onOpenDetail && onOpenDetail(item.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <span className={s.typ} style={{ color: LV_COLOR[item.level], background: 'transparent', border: `1px solid ${LV_COLOR[item.level] || 'var(--line)'}`, padding: '2px 5px' }}>{item.level || '—'}</span>
                      <span className={s.lgOut} style={{ fontSize: 12 }}>{item.outlet_kode || item.outlet_nama || '—'}</span>
                    </div>
                    <div className={s.lgKet} style={{ fontSize: 11, marginTop: 2, WebkitLineClamp: 2 }}>{item.keterangan || '—'}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}


const EMPTY = {
  me:{ total:0,pending:0,completed:0,resolution_rate:0,oldest_age_days:0 },
  ga:{ total:0,pending_verify:0,verified:0,tech_count:0 },
  global:{ total:0,attention_needed:0,outlet_count:0,total_outlets:0,avg_per_day:0 },
  by_outlet:[],per_day:[],tech_productivity:[],
};

export default function LaporanDashboard() {
  const [stats, setStats]   = useState(EMPTY);
  const [feed, setFeed]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [range, setRange]   = useState(0);
  const [filt, setFilt]     = useState('semua');
  const [modal, setModal]   = useState(false);
  const [detail, setDetail] = useState(null);   // { laporan, kendala } | null
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false); // controls .show class
  const [lightbox, setLightbox] = useState(null); // url | null
  const [detailTab, setDetailTab] = useState('me');

  const [copied, setCopied] = useState(null);
  const [toast, setToast] = useState(null);
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [overSlaPopup, setOverSlaPopup] = useState(false);
  const [mainTab, setMainTab] = useState('laporan');
  const [statusFilter, setStatusFilter] = useState('');
  const sortedFeed = useMemo(()=>{
    if(!sortCol) return feed;
    return [...feed].sort((a,b)=>{
      let va='',vb='';
      if(sortCol==='outlet') { va=a.outlet_nama||a.outlet_kode||''; vb=b.outlet_nama||b.outlet_kode||''; }
      else if(sortCol==='sla') { va=a.level||''; vb=b.level||''; }
      else if(sortCol==='jadwal') { va=a.schedule_date||''; vb=b.schedule_date||''; }
      else if(sortCol==='selesai') { va=a.updated_at||''; vb=b.updated_at||''; }
      else if(sortCol==='status') { va=a.status||''; vb=b.status||''; }
      else if(sortCol==='type') { va=a.tim_name||''; vb=b.tim_name||''; }
      return sortDir==='asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  },[feed,sortCol,sortDir]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [search, setSearch] = useState('');

  async function handleStatusChange(id, newStatus) {
    try {
      const res = await fetch('/internal/api/laporan/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const d = await res.json();
      if (d.ok) {
        setFeed(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, status_raw: newStatus } : r));
        if (detail?.laporan?.id === id) setDetail(prev => ({ ...prev, laporan: { ...prev.laporan, status: newStatus } }));
        setToast(STATUS_LABELS[newStatus] || newStatus);
        setTimeout(() => setToast(null), 2500);
      } else {
        setToast('Gagal: ' + (d.message || 'error'));
        setTimeout(() => setToast(null), 3000);
      }
    } catch (e) {
      setToast('Koneksi error');
      setTimeout(() => setToast(null), 3000);
    }
  }



  // reset page when filter/range changes
  useEffect(() => { setPage(1); }, [filt, range, statusFilter]);

  // load stats
  useEffect(() => {
    let ac = new AbortController();
    const loadStats = () => fetch(`/internal/api/laporan/stats?days=${range}`, { signal: ac.signal })
      .then(r=>r.json()).then(d=>{ if(d.ok) setStats(d); }).catch(()=>{});
    loadStats();
    const t = setInterval(loadStats, 5000);
    return () => { clearInterval(t); ac.abort(); };
  }, [range]);

  // poll detail silently while modal open
  useEffect(() => {
    if (!detail?.laporan?.id) return;
    const id = detail.laporan.id;
    let ac = new AbortController();
    const t = setInterval(() => {
      fetch(`/internal/api/laporan/detail?id=${id}`, { signal: ac.signal })
        .then(r=>r.json()).then(d=>{ if(d.ok) setDetail(d); }).catch(()=>{});
    }, 5000);
    return () => { clearInterval(t); ac.abort(); };
  }, [detail?.laporan?.id]);

  // load feed (paginated)
  useEffect(() => {
    const apiType = filt==='me'?'me':filt==='ga'?'ga':'';
    let ac = new AbortController();
    const loadFeed = (showLoading) => {
      if(showLoading) setLoading(true);
      fetch(`/internal/api/laporan/feed?filter=all&page=${page}&limit=${LIMIT}${apiType?`&type=${apiType}`:''}${statusFilter?`&status=${encodeURIComponent(statusFilter)}`:''}${search?`&search=${encodeURIComponent(search)}`:''}`
        , { signal: ac.signal })
        .then(r=>r.json())
        .then(d=>{
          if(d.ok && Array.isArray(d.data)) { setFeed(d.data); setTotal(d.pagination?.total||0); }
          setLoading(false);
        }).catch(e=>{ if(e.name!=='AbortError') setLoading(false); });
    };
    loadFeed(true);
    const t = setInterval(()=>loadFeed(false), 5000);
    return () => { clearInterval(t); ac.abort(); };
  }, [filt, page, range, refreshTick, search, statusFilter]);
  const { me, ga, global:gl, by_outlet, per_day, tech_productivity } = stats;
  const maxLead = tech_productivity.length ? Math.max(1,...tech_productivity.map(t=>+t.count)) : 1;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      {/* toast copy */}
      {copied&&(
        <div className={s.toastCopy}>
          ✓ Disalin: <b>{copied}</b>
        </div>
      )}
      {/* toast status */}
      {toast&&(
        <div className={toast.startsWith('❌') ? s.toastError : s.toastStatus}>
          {toast.startsWith('❌') ? toast : <>✓ Status diperbarui: <b>{toast}</b></>}
        </div>
      )}
      {/* ── TOP BAR ── */}
      <div className={s.top}>
        <div className={`${s.wrap} ${s.wrapTopBar}`}>
          <div className={s.brand}>
            <img src="/internal/logo.svg" alt="Matoa" className={s.brandLogo} style={{filter: 'invert()'}} />
            <div><div className={s.bt}>Papan Kinerja Maintenance</div><div className={s.bs}>Matoa Group · User ME & GA</div></div>
          </div>
          <div className={s.spacer}/>
          <div className={s.ctrls}>
            <span className={`${s.srcpill} ${loading?s.sync:s.live}`}><span className={s.d}/>{loading?'Memuat…':'Live DB'}</span>
            <select className={s.rangeSelect} value={range} onChange={e=>setRange(+e.target.value)}>
              {RANGE_OPTIONS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <button className={`${s.tb} ${s.primary}`} onClick={()=>setModal(true)}>＋ Catat Laporan</button>
          </div>
        </div>
      </div>

      <div className={s.wrap}>
        {/* ── STREAMS ── */}
        <div className={s.eyebrow}><span className={s.n}>01</span> Ringkasan Stream</div>
        <div className={s.streams}>
          <div className={s.stream}>
            <div className={s.sh}><span className={s.tag}>User ME · Kendala</span></div>
            <h2>Laporan Kendala Outlet</h2>
            <div className={s.sub}>Kerusakan yang ditemukan & dilaporkan tim teknisi ME</div>
            <div className={s.big}><span className={s.num}>{me.total}</span><span className={s.unit}>kendala dilaporkan</span></div>
            <div className={s.gauge}>
              <div className={s.glabel}><span>Tingkat penyelesaian</span><span><b>{me.resolution_rate}%</b></span></div>
              <div className={s.bar}><i style={{width:me.resolution_rate+'%'}}/></div>
            </div>
            <div className={s.foot}>
              <div className={s.f}><div className={`${s.fv} ${s.sig}`}>{me.pending}</div><div className={s.fk}>Menunggu penanganan</div></div>
              <div className={s.f}><div className={s.fv}>{me.completed}</div><div className={s.fk}>Sudah selesai</div></div>
              <div className={s.f}><div className={s.fv}>{me.oldest_age_days>0?me.oldest_age_days+' hr':'—'}</div><div className={s.fk}>Usia tiket tertua</div></div>
            </div>
          </div>
          <div className={s.stream}>
            <div className={s.sh}><span className={s.tag}>User GA · Pekerjaan</span></div>
            <h2>Laporan Pekerjaan Selesai</h2>
            <div className={s.sub}>Bukti penyelesaian tiket oleh tim GA maintenance</div>
            <div className={s.big}><span className={s.num}>{ga.total}</span><span className={s.unit}>pekerjaan dilaporkan</span></div>
            <div className={s.gauge}>
              <div className={s.glabel}><span>Sudah diverifikasi Manager</span><span><b>{ga.total>0?Math.round(ga.verified/ga.total*100):0}%</b></span></div>
              <div className={s.bar}><i style={{width:(ga.total>0?Math.round(ga.verified/ga.total*100):0)+'%'}}/></div>
            </div>
            <div className={s.foot}>
              <div className={s.f}><div className={`${s.fv} ${s.sig}`}>{ga.pending_verify}</div><div className={s.fk}>Menunggu verifikasi</div></div>
              <div className={s.f}><div className={s.fv}>{ga.verified}</div><div className={s.fk}>Terverifikasi</div></div>
              <div className={s.f}><div className={s.fv}>{ga.tech_count}</div><div className={s.fk}>Teknisi aktif</div></div>
            </div>
          </div>
        </div>

        {/* ── KPI ── */}
        <div className={s.kpis}>
          <div className={s.kpi}><div className={s.kv}>{gl.total}</div><div className={s.kk}>Total laporan</div><div className={s.ks}>ME + GA gabungan</div></div>
          <div className={s.kpi}><div className={`${s.kv} ${s.sig}`}>{gl.attention_needed}</div><div className={s.kk}>Butuh perhatian</div><div className={s.ks}>Kendala + verifikasi terbuka</div></div>
          <div className={s.kpi}><div className={s.kv}>{gl.outlet_count}</div><div className={s.kk}>Outlet dipantau</div><div className={s.ks}>{gl.total_outlets} outlet aktif</div></div>
          <div className={s.kpi}><div className={s.kv}>{gl.avg_per_day}</div><div className={s.kk}>Rata-rata / hari</div><div className={s.ks}>Laju laporan masuk</div></div>
        </div>

        {/* ── BOARD PER OUTLET ── */}
        <div className={s.eyebrow}><span className={s.n}>02</span> Papan Per Outlet</div>
        <div className={s.board}>
          <div className={`${s.brow} ${s.head}`}>
            <span>Outlet</span><span>Kendala Terbuka</span><span>Total Kendala</span>
            <span className={s.colSelesai}>Pekerjaan GA</span><span>Pekerjaan ME</span><span className={s.textRight}>Status</span>
          </div>
          {by_outlet.length===0&&<div className={s.empty}>Belum ada data outlet</div>}
          {by_outlet.map((row,i)=>(
            <div key={row.kode||i} className={s.brow}>
              <div className={s.stName}><span className={s.idx}>{String(i+1).padStart(2,'0')}</span>{row.nama||row.kode}</div>
              <div className={s.cellnum}>{row.kendala_terbuka>0?row.kendala_terbuka:<span className={s.z}>0</span>}</div>
              <div className={s.cellnum}>{row.total_kendala>0?row.total_kendala:<span className={s.z}>0</span>}</div>
              <div className={`${s.cellnum} ${s.colSelesai}`}>{row.pekerjaan_ga>0?row.pekerjaan_ga:<span className={s.z}>0</span>}</div>
              <div className={s.cellnum}>{row.pekerjaan_me>0?row.pekerjaan_me:<span className={s.z}>0</span>}</div>
              {row.kendala_terbuka>0
                ?<span className={`${s.pill} ${s.warn}`}><span className={s.d}/>{row.kendala_terbuka} terbuka</span>
                :<span className={`${s.pill} ${s.clear}`}><span className={s.d}/>aman</span>}
            </div>
          ))}
        </div>

        {/* ── CHARTS ── */}
        <div className={s.eyebrow}><span className={s.n}>03</span> Tren & Produktivitas</div>
        <div className={s.cols}>
          <div className={s.card}>
            <h3>Laporan Masuk Per Hari</h3>
            <div className={s.chSub}>14 hari terakhir</div>
            <TrendChart buckets={per_day}/>
            <div className={s.legend}>
              <div className={s.lg}><div className={`${s.sw} ${s.swKendala}`}/> Kendala (ME)</div>
              <div className={s.lg}><div className={`${s.sw} ${s.swPekerjaan}`}/> Pekerjaan (GA)</div>
            </div>
          </div>
          <div className={s.card}>
            <h3>Produktivitas Teknisi GA & ME</h3>
            <div className={s.chSub}>Pekerjaan diselesaikan</div>
            <div className={s.lead}>
              {tech_productivity.length===0&&<div className={s.empty}>Belum ada data</div>}
              {tech_productivity.map((t,i)=>(
                <div key={t.team||i} className={s.lrow}>
                  <span className={s.rk}>#{i+1}</span>
                  <span className={s.nm}>{t.team}</span>
                  <div className={s.lbar}><i style={{width:Math.round(+t.count/maxLead*100)+'%'}}/></div>
                  <span className={s.ct}>{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── DISPATCH ── */}
        <DispatchBoard onOpenDetail={async (id) => {
          setDetail(null); setDetailLoading(true); setDetailVisible(false);
          try {
            const r = await fetch(`/internal/api/laporan/detail?id=${id}`);
            const d = await r.json();
            if (d.ok) { setDetail(d); requestAnimationFrame(() => requestAnimationFrame(() => setDetailVisible(true))); }
            else { setToast('❌ Detail gagal: ' + (d.message || 'error')); setTimeout(() => setToast(null), 4000); }
          } catch(e) { setToast('❌ ' + e.message); setTimeout(() => setToast(null), 4000); }
          finally { setDetailLoading(false); }
        }} />

        {/* ── LEDGER ── */}
        <div className={s.eyebrow}><span className={s.n}>05</span> Catatan Laporan</div>
        <div className={s.tabBar}>
          <button className={`${s.tabBtn}${mainTab==='laporan'?' '+s.tabActive:''}`} onClick={()=>setMainTab('laporan')}>LAPORAN</button>
          <button className={`${s.tabBtn}${mainTab==='daily'?' '+s.tabActive:''}`} onClick={()=>setMainTab('daily')}>DAILY CHECK</button>
          <button className={`${s.tabBtn}${mainTab==='rutin'?' '+s.tabActive:''}`} onClick={()=>setMainTab('rutin')}>TUGAS RUTIN</button>
        </div>
        {mainTab==='daily'&&<div style={{padding:'32px 0',textAlign:'center',color:'var(--muted)'}}>Daily Check — coming soon</div>}
        {mainTab==='rutin'&&<div style={{padding:'32px 0',textAlign:'center',color:'var(--muted)'}}>Tugas Rutin — coming soon</div>}
        {mainTab==='laporan'&&<><div className={s.ledgerHead}>
          <div className={s.filtRow}>
            <div className={s.filtLine1}>
              <div className={s.filt}>
                {FILTERS.map(f=>(
                  <button key={f} className={`${s.chip}${filt===f?' '+s.on:''}`} onClick={()=>setFilt(f)}>
                    {FILTER_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
            <div className={s.filtControls}>
              {/* status filter */}
              <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setPage(1);}}
                className={s.filtSelect}>
                {STATUS_OPTIONS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
              <div className={s.searchWrap}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={s.searchIco}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text" placeholder="Cari tiket ID…" value={search}
                  className={s.searchInput}
                  onChange={e=>{setSearch(e.target.value);setPage(1);}}
                  onFocus={e=>{e.target.style.borderColor='#6b6d75';e.target.style.background='#25262b';}}
                  onBlur={e=>{e.target.style.borderColor='#3a3b3f';e.target.style.background='#1e1f23';}}
                />
                {search&&<button onClick={()=>{setSearch('');setPage(1);}} className={s.searchClear}>✕</button>}
              </div>
            </div>
          </div>
          <div className={s.pageInfo}>
            <button onClick={()=>setRefreshTick(t=>t+1)} disabled={loading}
              className={`${s.srcpill} ${loading?s.sync:s.live} ${s.realtimeBtn}`}>
              ⟳ Data Realtime
            </button>
            {total} laporan · halaman {page}/{totalPages||1}
          </div>
        </div>

        <div className={s.ledger}>
          {/* header */}
          <div className={`${s.lgRow} ${s.h}`}>
            <span>NO</span>
            <span className={s.sortCol}
              onClick={()=>{ if(sortCol==='type') { if(sortDir==='desc') setSortCol(null); else setSortDir('desc'); } else { setSortCol('type'); setSortDir('asc'); } }}>
              Type <span className={s.sortArrow} style={{opacity:sortCol==='type'?1:0.3}}>{sortCol==='type'&&sortDir==='desc'?'▼':'▲'}</span>
            </span>
            <span className={`${s.hLeft} ${s.sortCol}`}
              onClick={()=>{ if(sortCol==='outlet') { if(sortDir==='desc') setSortCol(null); else setSortDir('desc'); } else { setSortCol('outlet'); setSortDir('asc'); } }}>
              Outlet <span className={s.sortArrow} style={{opacity:sortCol==='outlet'?1:0.3}}>{sortCol==='outlet'&&sortDir==='desc'?'▼':'▲'}</span>
            </span>
            <span className={`${s.colKet} ${s.hLeft}`}>Keterangan</span>
            {['SLA','Jadwal','Selesai'].map(col=>{
              const key = col.toLowerCase();
              const active = sortCol===key;
              return (
                <span key={col} className={s.sortCol}
                  onClick={()=>{ if(active) { if(sortDir==='desc') setSortCol(null); else setSortDir('desc'); } else { setSortCol(key); setSortDir('asc'); } }}>
                  {col}
                  <span className={s.sortArrow} style={{opacity:active?1:0.3}}>
                    {active&&sortDir==='desc'?'▼':'▲'}
                  </span>
                </span>
              );
            })}
          </div>

          {feed.length===0&&!loading&&<div className={s.empty}><b>Tidak ada laporan</b></div>}
          {loading&&<div className={s.empty}>Memuat…</div>}

          {!loading&&sortedFeed.map((row,idx)=>{
            const rowStatus = row.status_raw || row.status;
            const deadline = slaDeadline(row.raw_created_at, row.level, rowStatus, row.deadline_date);
            const slaSt = deadline === 'hold' ? 'hold' : slaStatus(deadline);
            const schSt = scheduleStatus(row.deadline_date);
            const isGA = ['selesai_dikerjakan','terverifikasi'].includes(row.status_raw||row.status);
            return (
              <div key={row.id} className={s.lgRow}>
                {/* NO — desktop only */}
                <span className={s.lgRowNo}>{total - ((page-1)*LIMIT) - idx}</span>

                {/* Type badge — desktop only */}
                <div className={`${s.colTyp} ${s.colTypCenter}`}>
                  {row.tim_name
                    ? <span className={`${s.typ} ${row.tim_name.toUpperCase()==='GA'?s.typGa:s.typMe}`}>{row.tim_name}</span>
                    : <span className={s.muted}>—</span>}
                </div>

                {/* mobile card */}
                <div className={s.mCardTop}>
                  <div className={s.mCardInner}>
                    <span className={s.mCardOutletRow} onClick={async()=>{
                      setDetail(null); setDetailLoading(true); setDetailVisible(false);
                      try { const r=await fetch(`/internal/api/laporan/detail?id=${row.id}`); const d=await r.json(); if(d.ok){setDetail(d);requestAnimationFrame(()=>requestAnimationFrame(()=>setDetailVisible(true)));} else{setToast('❌ Detail gagal: '+(d.message||'error'));setTimeout(()=>setToast(null),4000);} } catch(e){setToast('❌ '+e.message);setTimeout(()=>setToast(null),4000);} finally{setDetailLoading(false);}
                    }}>
                      <span className={s.mCardNo}>{total - ((page-1)*LIMIT) - idx}</span>
                      <span className={s.mCardOutletName}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={s.svgOpacity}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        {row.outlet_nama||row.outlet_kode}
                      </span>
                      <span className={s.mCardBadges}>
                        {row.tim_name && <span className={`${s.typ} ${row.tim_name.toUpperCase()==='GA'?s.typGa:s.typMe}`}>{row.tim_name}</span>}
                        {row.level && <span className={`${s.slaBadge} ${s['sla'+row.level]}`}>{row.level} · {SLA_HOURS[row.level]}j</span>}
                      </span>
                    </span>
                    {row.tiket_id&&(
                      <span className={s.mCardTiketRow}>
                        {row.tiket_id}
                        <button onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(row.tiket_id);setCopied(row.tiket_id);setTimeout(()=>setCopied(null),2000);}}
                          className={s.mCardCopyBtn}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                      </span>
                    )}
                  </div>
                </div>

                {/* Outlet column — desktop only (hidden mobile) */}
                <div className={s.lgOut}>
                  {/* desktop: outlet klik (badge ada di colTyp) */}
                  <span className={`${s.mCardDesktop} ${s.outletClickSpan}`} onClick={async()=>{
                    setDetail(null); setDetailLoading(true); setDetailVisible(false);
                    try { const r=await fetch(`/internal/api/laporan/detail?id=${row.id}`); const d=await r.json(); if(d.ok){setDetail(d);requestAnimationFrame(()=>requestAnimationFrame(()=>setDetailVisible(true)));} else{setToast('❌ Detail gagal: '+(d.message||'error'));setTimeout(()=>setToast(null),4000);} } catch(e){setToast('❌ '+e.message);setTimeout(()=>setToast(null),4000);} finally{setDetailLoading(false);}
                  }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={s.svgOpacity}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    {row.outlet_nama||row.outlet_kode}
                  </span>
                  {/* tiket ID */}
                  <small className={s.tiketRow}>
                    {row.tiket_id||''}
                    {row.tiket_id&&(
                      <button onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(row.tiket_id);setCopied(row.tiket_id);setTimeout(()=>setCopied(null),2000);}}
                        title="Salin tiket ID"
                        className={s.tiketCopyBtn}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </button>
                    )}
                  </small>
                  {/* status select — desktop */}
                  {row.status&&(
                    <small className={s.statusSmall}>
                      {row.status==='over_sla'
                        ? <div onClick={e=>{e.stopPropagation();setOverSlaPopup(true);}} className={`${s.stbtn} ${s.stbtnOverSla}`}>Over SLA</div>
                        : <select value={row.status} className={s.stbtn}
                            style={STATUS_BORDER[row.status]?{borderColor:STATUS_BORDER[row.status]}:undefined}
                            onClick={e=>e.stopPropagation()}
                            onChange={e=>handleStatusChange(row.id,e.target.value)}>
                            {[{v:'dijadwalkan',l:'Dijadwalkan'},{v:'sedang_dikerjakan',l:'Sedang Dikerjakan'},{v:'selesai_dikerjakan',l:'Selesai Dikerjakan'},{v:'terverifikasi',l:'Terverifikasi'},{v:'tunggu_barang',l:'Tunggu Barang'},{v:'barang_diproses',l:'Barang Diproses'},{v:'barang_ready',l:'Barang Ready'},{v:'over_sla',l:'Over SLA'}].map(st=>(<option key={st.v} value={st.v}>{st.l}</option>))}
                          </select>}
                    </small>
                  )}
                </div>

                {/* Keterangan — desktop + mobile */}
                <div className={`${s.lgKet} ${s.colKet}`}>{row.keterangan||'—'}</div>

                {/* SLA badge — desktop only */}
                <div className={s.slaCell}>
                  {row.level ?<span className={`${s.slaBadge} ${s['sla'+row.level]}`}>{row.level} · {SLA_HOURS[row.level]}j</span>:<span className={s.muted}>—</span>}
                </div>

                {/* Jadwal — desktop only */}
                <div className={s.jadwal}>
                  {row.schedule_date?<>
                    <span className={s.jadwalStart}>{fmtDate(row.schedule_date)}</span>
                    <span className={s.jadwalArrow}>→</span>
                    <span className={`${s.jadwalEnd}${schSt==='overdue'?' '+s.jadwalOverdue:schSt==='today'?' '+s.jadwalToday:''}`}>{fmtDate(row.deadline_date)}</span>
                  </>:<span className={s.muted}>—</span>}
                </div>

                {/* Selesai — desktop only */}
                <div className={s.lgWhen}>
                  <span className={s.selesaiVal}>{(['selesai_dikerjakan','terverifikasi'].includes(rowStatus)&&row.updated_at)?fmtDatetime(row.updated_at):'—'}</span>
                </div>

                {/* mobile: jadwal + selesai label:value */}
                <div className={s.mCardMeta}>
                  <div className={s.mCardMetaRow}>
                    <span className={s.mCardMetaLabel}>Jadwal :</span>
                    {row.schedule_date
                      ?<span>{fmtDate(row.schedule_date)} → <span className={schSt==='overdue'?s.jadwalOverdue:schSt==='today'?s.jadwalToday:''}>{fmtDate(row.deadline_date)}</span></span>
                      :<span className={s.muted}>—</span>}
                  </div>
                  <div className={s.mCardMetaRow}>
                    <span className={s.mCardMetaLabel}>Selesai :</span>
                    <span className={s.mobileSelesaiVal}>{(['selesai_dikerjakan','terverifikasi'].includes(rowStatus)&&row.updated_at)?fmtDatetime(row.updated_at):'—'}</span>
                  </div>
                </div>

                {/* mobile: status select 70% */}
                {row.status&&(
                  <div className={s.mCardStatus}>
                    {row.status==='over_sla'
                      ?<div onClick={e=>{e.stopPropagation();setOverSlaPopup(true);}} className={`${s.stbtn} ${s.stbtnOverSlaFull}`}>Over SLA</div>
                      :<select value={row.status} className={`${s.stbtn} ${s.stbtnFull}`}
                          style={STATUS_BORDER[row.status]?{borderColor:STATUS_BORDER[row.status]}:undefined}
                          onClick={e=>e.stopPropagation()}
                          onChange={e=>handleStatusChange(row.id,e.target.value)}>
                          {[{v:'dijadwalkan',l:'Dijadwalkan'},{v:'sedang_dikerjakan',l:'Sedang Dikerjakan'},{v:'selesai_dikerjakan',l:'Selesai Dikerjakan'},{v:'terverifikasi',l:'Terverifikasi'},{v:'tunggu_barang',l:'Tunggu Barang'},{v:'barang_diproses',l:'Barang Diproses'},{v:'barang_ready',l:'Barang Ready'},{v:'over_sla',l:'Over SLA'}].map(st=>(<option key={st.v} value={st.v}>{st.l}</option>))}
                        </select>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>}

        {/* ── PAGINATION ── */}
        {totalPages>1&&(
          <div className={s.pagination}>
            <button className={s.pgBtn} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
            {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1).map((p,i,arr)=>(
              <span key={p}>
                {i>0&&arr[i-1]!==p-1&&<span className={s.pgDot}>…</span>}
                <button className={`${s.pgBtn}${p===page?' '+s.pgActive:''}`} onClick={()=>setPage(p)}>{p}</button>
              </span>
            ))}
            <button className={s.pgBtn} disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next →</button>
          </div>
        )}

        <div className={s.siteFoot}>Matoa Group · Sistem Internal Maintenance · {new Date().getFullYear()}</div>
      </div>

      {/* ── MODAL stub ── */}
      {modal&&(
        <div className={`${s.modal} ${s.show}`} onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className={s.sheet}>
            <h3>Catat Laporan</h3>
            <div className={s.msub}>Gunakan aplikasi frontend untuk mencatat laporan baru.</div>
            <div className={s.mact}>
              <button type="button" onClick={()=>setModal(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {lightbox && <PhotoViewer src={lightbox} onClose={()=>setLightbox(null)} />}
      {(detail||detailLoading)&&(
        <div className={`${s.modal}${detailVisible?' '+s.show:''}`} onClick={e=>{if(e.target===e.currentTarget){setDetailVisible(false);setTimeout(()=>{setDetail(null);setDetailLoading(false);},220);}}}>
          <div className={`${s.sheet} ${s.sheetDetail}`}>
            {detailLoading&&<div className={`${s.msub} ${s.sheetLoading}`}>Memuat…</div>}
            {detail&&(()=>{
              const lp = detail.laporan;
              const items = detail.kendala || [];
              const deadline = slaDeadline(lp.created_at, lp.level, lp.status, lp.deadline_date);
              const slaSt = deadline === 'hold' ? 'hold' : slaStatus(deadline);
              return(<>
                {/* header */}
                <div className={s.sheetHeader}>
                  <div>
                    <h3 className={s.sheetTitle}>{lp.outlet_nama||lp.outlet_kode||'—'}</h3>
                    <div className={`${s.msub} ${s.sheetSubNm}`}>{lp.tiket_id||'—'}</div>
                  </div>
                  <button onClick={()=>{ setDetailVisible(false); setTimeout(()=>{ setDetail(null); setDetailLoading(false); }, 220); }} className={s.sheetCloseBtn}>✕</button>
                </div>

                {/* tab bar */}
                <div className={s.tabBar}>
                  <button className={`${s.tabBtn}${detailTab==='me'?' '+s.tabActive:''}`} onClick={()=>setDetailTab('me')}>KENDALA</button>
                  <button className={`${s.tabBtn}${detailTab==='ga'?' '+s.tabActive:''}`} onClick={()=>setDetailTab('ga')}>PERBAIKAN</button>
                  <button className={`${s.tabBtn}${detailTab==='pengadaan'?' '+s.tabActive:''}`} onClick={()=>setDetailTab('pengadaan')}>PENGADAAN</button>
                </div>

                {detailTab==='ga'&&(()=>{
                  const pb = detail.perbaikan;
                  const pbItems = detail.perbaikan_items || [];
                  if (!pb) return (
                    <div className={s.dtEmpty}>
                      <span>Data PERBAIKAN belum tersedia.</span>
                      <button onClick={async()=>{
                        setDetailLoading(true);
                        try {
                          const r = await fetch(`/internal/api/laporan/detail?id=${detail.laporan.id}`);
                          const d = await r.json();
                          if(d.ok) setDetail(d);
                        } catch(e) { setToast('❌ Refresh gagal: '+(e.message||'error'));setTimeout(()=>setToast(null),4000); }
                        finally { setDetailLoading(false); }
                      }} className={s.dtRefreshBtn}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                        Refresh Data
                      </button>
                    </div>
                  );
                  return (<>
                    {[
                      ['Petugas',    pb.nama_petugas || '—'],
                      ['Keterangan', (() => { try { const v = typeof pb.keterangan_perbaikan === 'string' ? JSON.parse(pb.keterangan_perbaikan) : pb.keterangan_perbaikan; return v || '—'; } catch(e){ return pb.keterangan_perbaikan || '—'; } })()],
                      ['Butuh Barang', pb.butuh_barang ? 'Ya' : 'Tidak'],
                      ['Status Barang', pb.status_barang || '—'],
                      ['Koordinat',  (pb.lat && pb.lon) ? `${pb.lat}, ${pb.lon}` : '—'],
                      ['Dikerjakan', pb.created_at ? fmtDatetime(pb.created_at) : '—'],
                    ].map(([k,v]) => (
                      <div key={k} className={s.dtRow}>
                        <span className={s.dtKey}>{k}</span>
                        <span className={s.dtVal}>{v}</span>
                      </div>
                    ))}
                    {/* Status dropdown */}
                    <div className={s.dtRow}>
                      <span className={s.dtKey}>Status Kendala</span>
                      {detail.laporan?.status==='over_sla'
                        ? <div onClick={()=>setOverSlaPopup(true)} className={`${s.stbtn} ${s.stbtnOverSla}`}>Over SLA</div>
                        : <select value={detail.laporan?.status||''} className={s.stbtn}
                            style={STATUS_BORDER[detail.laporan?.status]?{borderColor:STATUS_BORDER[detail.laporan?.status]}:undefined}
                            onChange={e=>handleStatusChange(detail.laporan.id, e.target.value)}>
                            {['dijadwalkan','sedang_dikerjakan','selesai_dikerjakan','terverifikasi','tunggu_barang','barang_diproses','barang_ready','over_sla'].map(st=>(<option key={st} value={st}>{STATUS_LABELS[st]||st}</option>))}
                          </select>}
                    </div>
                    {pb.foto_before_id && (()=>{
                      const url = pb.foto_before_id.startsWith('http') ? pb.foto_before_id : `${STATIC_BASE}/${pb.foto_before_id}`;
                      return (
                        <div className={s.fotoSection}>
                          <div className={`${s.fl} ${s.fotoSectionHead}`}>Foto Before</div>
                          <img src={url} alt="foto before" className={`${s.dtPhoto} ${s.dtPhotoClick}`} onClick={()=>setLightbox(url)}/>
                        </div>
                      );
                    })()}
                    {pb.foto_after_id && (()=>{
                      let urls = [];
                      try { urls = typeof pb.foto_after_id === 'string' ? JSON.parse(pb.foto_after_id) : pb.foto_after_id; } catch(e){}
                      if (!Array.isArray(urls)) urls = [urls];
                      return urls.length > 0 ? (
                        <div className={s.fotoSection}>
                          <div className={`${s.fl} ${s.fotoSectionHead}`}>Foto After ({urls.length})</div>
                          <div className={s.fotoGrid}>
                            {urls.map((u,i)=>{
                              const url = u.startsWith('http') ? u : `${STATIC_BASE}/${u}`;
                              return <img key={i} src={url} alt={`after ${i+1}`} className={`${s.dtPhoto} ${s.dtPhotoClick}`} onClick={()=>setLightbox(url)}/>;
                            })}
                          </div>
                        </div>
                      ) : null;
                    })()}

                  </>);
                })()}

                {detailTab==='pengadaan'&&(()=>{
                  const pg = detail.pengadaan;
                  const pgItems = detail.pengadaan_items || [];
                  if (!pg && pgItems.length===0) return (
                    <div className={s.dtEmpty}>
                      <span>Data PENGADAAN belum tersedia.</span>
                      <button onClick={async()=>{
                        setDetailLoading(true);
                        try {
                          const r = await fetch(`/internal/api/laporan/detail?id=${detail.laporan.id}`);
                          const d = await r.json();
                          if(d.ok) setDetail(d);
                        } catch(e) { setToast('❌ Refresh gagal: '+(e.message||'error'));setTimeout(()=>setToast(null),4000); }
                        finally { setDetailLoading(false); }
                      }} className={s.dtRefreshBtn}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                        Refresh Data
                      </button>
                    </div>
                  );
                  const alasan = (() => { try { const v = pg?.alasan; return Array.isArray(v) ? v : (typeof v==='string' ? JSON.parse(v) : []); } catch(e){ return []; } })();
                  const pb = detail.perbaikan;
                  return (<>
                    {[
                      ['Petugas', pg?.nama_petugas || '—'],
                      ['Butuh Barang', pb?.butuh_barang ? 'Ya' : 'Tidak'],
                      ['Status Barang', pb?.status_barang || '—'],
                    ].map(([k,v]) => (
                      <div key={k} className={s.dtRow}>
                        <span className={s.dtKey}>{k}</span>
                        <span className={s.dtVal}>{v}</span>
                      </div>
                    ))}
                    {alasan.length > 0 && (
                      <div className={s.dtRow}>
                        <span className={s.dtKey}>Alasan</span>
                        <span className={s.dtVal}>{alasan.join(', ')}</span>
                      </div>
                    )}
                    {/* Status dropdown */}
                    <div className={s.dtRow}>
                      <span className={s.dtKey}>Status Kendala</span>
                      {detail.laporan?.status==='over_sla'
                        ? <div onClick={()=>setOverSlaPopup(true)} className={`${s.stbtn} ${s.stbtnOverSla}`}>Over SLA</div>
                        : <select value={detail.laporan?.status||''} className={s.stbtn}
                            style={STATUS_BORDER[detail.laporan?.status]?{borderColor:STATUS_BORDER[detail.laporan?.status]}:undefined}
                            onChange={e=>handleStatusChange(detail.laporan.id, e.target.value)}>
                            {['dijadwalkan','sedang_dikerjakan','selesai_dikerjakan','terverifikasi','tunggu_barang','barang_diproses','barang_ready','over_sla'].map(st=>(<option key={st} value={st}>{STATUS_LABELS[st]||st}</option>))}
                          </select>}
                    </div>
                    {pgItems.length > 0 && (
                      <div className={s.fotoSection}>
                        <div className={`${s.fl} ${s.fotoSectionHeadLg}`}>Foto Barang ({pgItems.length})</div>
                        {pgItems.map((it,i) => {
                          const fotoUrl = it.foto_barang_url ? (it.foto_barang_url.startsWith('http') ? it.foto_barang_url : `${STATIC_BASE}/${it.foto_barang_url}`) : null;
                          const detail_b = (() => { try { const v = typeof it.detail_barang==='string' ? JSON.parse(it.detail_barang) : it.detail_barang; return v || '—'; } catch(e){ return it.detail_barang || '—'; } })();
                          return (
                            <div key={it.id||i} className={s.dtItem}>
                              {it.detail_barang && <div className={s.dtItemKet}><span className={s.detailBarangLabel}>Detail barang : </span>{detail_b}</div>}
                              {fotoUrl && <img src={fotoUrl} alt={`barang ${i+1}`} className={`${s.dtPhoto} ${s.dtPhotoClick}`} onClick={()=>setLightbox(fotoUrl)}/>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>);
                })()}
                {detailTab==='me'&&(<>

                {/* field rows */}
                {[
                  ['Type',      lp.tim_name || '—'],
                  ['Level SLA', lp.level ? `${lp.level} · ${SLA_HOURS[lp.level]}j` : '—'],
                  ['Created',   lp.created_at ? fmtDatetime(lp.created_at) : '—'],
                  ['Selesai',   (['selesai_dikerjakan','terverifikasi'].includes(lp.status) && lp.updated_at) ? fmtDatetime(lp.updated_at) : '—'],
                  ['Deadline',  deadline ? `${fmtDatetime(deadline)}${slaSt==='overdue'?' ⚠ overdue':''}` : '—'],
                  ['Alamat',    lp.address||'—'],
                  ['Koordinat', (lp.lat&&lp.lon) ? `${lp.lat}, ${lp.lon}` : '—'],
                ].map(([k,v])=>(
                  <div key={k} className={s.dtRow}>
                    <span className={s.dtKey}>{k}</span>
                    <span className={s.dtVal}>{v}</span>
                  </div>
                ))}

                {/* Status dropdown */}
                <div className={s.dtRow}>
                  <span className={s.dtKey}>Status Kendala</span>
                  {lp.status==='over_sla'
                    ? <div onClick={()=>setOverSlaPopup(true)} className={`${s.stbtn} ${s.stbtnOverSla}`}>Over SLA</div>
                    : <select
                        value={lp.status}
                        className={s.stbtn}
                        style={STATUS_BORDER[lp.status]?{borderColor:STATUS_BORDER[lp.status]}:undefined}
                        onChange={async e => {
                          const newStatus = e.target.value;
                          const res = await fetch('/internal/api/laporan/status', {
                            method: 'POST',
                            headers: {'Content-Type':'application/json'},
                            body: JSON.stringify({ id: lp.id, status: newStatus }),
                          });
                          const d = await res.json();
                          if (d.ok) {
                            setDetail(prev => ({...prev, laporan: {...prev.laporan, status: newStatus}}));
                            setFeed(prev => prev.map(r => r.id===lp.id ? {...r, status: newStatus, status_raw: newStatus} : r));
                            setToast(STATUS_LABELS[newStatus]||newStatus); setTimeout(()=>setToast(null),2500);
                          }
                        }}
                      >
                        {['dijadwalkan','sedang_dikerjakan','selesai_dikerjakan','terverifikasi','tunggu_barang','barang_diproses','barang_ready','over_sla'].map(st=>(
                          <option key={st} value={st}>{STATUS_LABELS[st]||st}</option>
                        ))}
                      </select>}
                </div>

                {/* kendala items */}
                {items.length>0&&(
                  <div className={s.kendalaSection}>
                    <div className={`${s.fl} ${s.kendalaSectionHead}`}>Kendala ({items.length})</div>
                    {items.map((it,i)=>(
                      <div key={it.id||i} className={s.dtItem}>
                        {it.foto_url&&(()=>{
                          const url=it.foto_url.startsWith('http')?it.foto_url:`${STATIC_BASE}/${it.foto_url}`;
                          return <img src={url} alt={`foto ${i+1}`} className={s.dtPhoto}
                            onClick={()=>setLightbox(url)}/>;
                        })()}
                        {it.keterangan&&<div className={s.dtItemKet}>{it.keterangan}</div>}
                        {(it.lat&&it.lon)&&<div className={s.dtItemMeta}>{it.lat}, {it.lon}</div>}
                        {it.photo_taken_at&&<div className={s.dtItemMeta}>{fmtDatetime(it.photo_taken_at)}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </>)}
            </>);
            })()}
          </div>
        </div>
      )}
      {overSlaPopup&&(
        <div className={s.overSlaBackdrop} onClick={()=>setOverSlaPopup(false)}>
          <div className={s.overSlaCard} onClick={e=>e.stopPropagation()}>
            <div className={s.overSlaIcon}>⚠️</div>
            <div className={s.overSlaTitle}>Status Over SLA</div>
            <div className={s.overSlaDesc}>
              Status tidak dapat diubah.<br/>
              Menunggu teknisi mengerjakan tugas dan<br/>
              status akan berubah otomatis setelah tugas dikerjakan.
            </div>
            <button onClick={()=>setOverSlaPopup(false)} className={s.overSlaOkBtn}>OK</button>
          </div>
        </div>
      )}
    </>
  );
}
