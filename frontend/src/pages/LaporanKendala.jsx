import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '../api/client';
import './LaporanKendala.css';

/* ===== Photo Viewer with Zoom ===== */
function PhotoViewer({ src, onClose }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const vpRef = useRef(null);
  const pinchRef = useRef({ dist: 0, scale: 1 });
  const stateRef = useRef({ scale: 1, pos: { x: 0, y: 0 }, dragging: false });

  const clamp = (s) => Math.min(5, Math.max(0.5, s));

  const lastTap = useRef(0);
  const onDoubleTap = (e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (stateRef.current.scale > 1) { setScale(1); setPos({ x: 0, y: 0 }); }
      else setScale(2.5);
    }
    lastTap.current = now;
  };

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    stateRef.current = { scale, pos, dragging };
  }, [scale, pos, dragging]);

  useEffect(() => {
    const el = vpRef.current;
    if (!el) return;
    function getTouchDist(t) {
      return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    }
    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        pinchRef.current = { dist: getTouchDist(e.touches), scale: stateRef.current.scale };
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        dragStart.current = { x: t.clientX, y: t.clientY, px: stateRef.current.pos.x, py: stateRef.current.pos.y };
        setDragging(true);
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        setScale(clamp(pinchRef.current.scale * getTouchDist(e.touches) / pinchRef.current.dist));
      } else if (e.touches.length === 1 && stateRef.current.dragging) {
        const t = e.touches[0];
        setPos({ x: dragStart.current.px + (t.clientX - dragStart.current.x), y: dragStart.current.py + (t.clientY - dragStart.current.y) });
      }
    };
    const onWheel = (e) => {
      e.preventDefault();
      setScale(prev => clamp(prev + (e.deltaY > 0 ? -0.15 : 0.15)));
    };
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('wheel', onWheel);
    };
  }, []);

  return (
    <div className="pv-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={vpRef} className="pv-viewport" onClick={onDoubleTap}
        onMouseDown={(e) => { if (scale <= 1) return; setDragging(true); dragStart.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }; }}
        onMouseMove={(e) => { if (!dragging) return; setPos({ x: dragStart.current.px + (e.clientX - dragStart.current.x), y: dragStart.current.py + (e.clientY - dragStart.current.y) }); }}
        onMouseUp={() => setDragging(false)}
      >
        <img src={src} alt="Foto" style={{ transform: `translate(${pos.x}px,${pos.y}px) scale(${scale})`, cursor: scale > 1 ? 'grab' : 'zoom-in' }} draggable={false} />
      </div>
      <div className="pv-controls">
        <button className="pv-btn" onClick={(e) => { e.stopPropagation(); setScale(s => clamp(s + 0.3)); }}>＋</button>
        <button className="pv-btn" onClick={(e) => { e.stopPropagation(); setScale(s => clamp(s - 0.3)); }}>−</button>
        <button className="pv-btn" onClick={(e) => { e.stopPropagation(); setScale(1); setPos({ x: 0, y: 0 }); }}>1:1</button>
        <button className="pv-btn pv-close" onClick={onClose}>✕</button>
      </div>
      <div className="pv-hint">{scale > 1 ? `${Math.round(scale * 100)}%` : 'Ketuk 2x untuk zoom'}</div>
    </div>
  );
}

// ===== GPS Overlay on camera =====
function GpsOverlay({ gps, outlet, slaType }) {
  if (!gps || (gps.status !== 'ok' && !gps.lat)) return null;
  const p2 = n => String(n).padStart(2, '0');
  const now = new Date();
  const tgl = p2(now.getDate()) + '/' + p2(now.getMonth()+1) + '/' + now.getFullYear() + ' - ' + p2(now.getHours()) + ':' + p2(now.getMinutes());
  return (
    <div className="gps-overlay">
      <span className="gps-overlay-line">({slaType || 'L1'}) {outlet || 'OUTLET'} - {tgl}</span>
      <span className="gps-overlay-line">LAT  {gps.lat?.toFixed(6)}</span>
      <span className="gps-overlay-line">LON  {gps.lon?.toFixed(6)}</span>
      {gps.addr && <span className="gps-overlay-line gps-overlay-addr">ALAMAT  {gps.addr}</span>}
    </div>
  );
}

// ===== Stamp GPS onto photo =====
function stampGpsOnImage(dataUrl, gps, outlet, slaType) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas');
      const maxW = 1200;
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const p2 = n => String(n).padStart(2, '0');
      const now = new Date();
      const tgl = p2(now.getDate()) + '/' + p2(now.getMonth()+1) + '/' + now.getFullYear() + ' - ' + p2(now.getHours()) + ':' + p2(now.getMinutes());
      const sla = slaType || 'L1';
      const lines = [`(${sla}) ${outlet || 'OUTLET'} - ${tgl}`];
      if (gps?.lat != null) { lines.push('LAT  ' + gps.lat.toFixed(6)); lines.push('LON  ' + gps.lon.toFixed(6)); }
      else lines.push('GPS tidak terkunci');
      if (gps?.addr) lines.push('ALAMAT  ' + gps.addr);
      const pad = Math.round(w * 0.028);
      const fMono = Math.max(14, Math.round(w * 0.028));
      const fSmall = Math.max(12, Math.round(w * 0.022));
      const lh = fMono * 1.45;
      let barH = pad * 2 + lines.length * lh;
      if (lines.find(l => l.startsWith('ALAMAT'))) barH += fSmall * 1.4;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, h - barH - 8, w, barH + 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, h - barH, Math.round(w * 0.09), 4);
      const ix = pad, iy = h - barH + pad + 2, isz = fMono * 0.9;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, fMono * 0.09); ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(ix + isz/2, iy + isz);
      ctx.bezierCurveTo(ix + isz/2 - isz*0.55, iy + isz*0.55, ix, iy + isz*0.35, ix + isz/2, iy);
      ctx.bezierCurveTo(ix + isz, iy + isz*0.35, ix + isz/2 + isz*0.55, iy + isz*0.55, ix + isz/2, iy + isz); ctx.stroke();
      ctx.beginPath(); ctx.arc(ix + isz/2, iy + isz*0.4, isz*0.16, 0, Math.PI * 2); ctx.stroke();
      const tx = pad + isz + pad * 0.5; let y = h - barH + pad; ctx.textBaseline = 'top';
      for (const line of lines) {
        if (line.startsWith('ALAMAT')) { ctx.fillStyle = '#c7c7c7'; ctx.font = '400 ' + fSmall + 'px Inter, sans-serif'; ctx.fillText(line, tx, y); y += fSmall * 1.4; }
        else { ctx.fillStyle = '#dcdcdc'; ctx.font = '500 ' + fMono + 'px JetBrains Mono, monospace'; ctx.fillText(line, tx, y); y += lh; }
      }
      resolve(cv.toDataURL('image/webp', 0.8));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ===== Kendala Item =====
function KendalaItem({ index, data, gps, outlet, slaType, onChange, onRemove, onPhotoChange, canRemove, disabled, onPhotoClick, contoh }) {
  const videoRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [warn, setWarn] = useState('');
  const [showWebcam, setShowWebcam] = useState(false);
  const [camLoading, setCamLoading] = useState(false);
  const streamRef = useRef(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCamLoading(false);
  }, []);

  const openCamera = async () => {
    if (disabled) return;
    try {
      setCamLoading(true); setWarn('');
      let mediaStream = null;
      try { mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); }
      catch (e1) { mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); }
      streamRef.current = mediaStream;
      setShowWebcam(true); setCamLoading(false);
      requestAnimationFrame(() => {
        const vid = videoRef.current;
        if (vid) { vid.srcObject = mediaStream; vid.play().catch(() => {}); }
        else setTimeout(() => { const v2 = videoRef.current; if (v2) { v2.srcObject = mediaStream; v2.play().catch(() => {}); } }, 100);
      });
    } catch (err) {
      setCamLoading(false);
      if (err.name === 'NotAllowedError') setWarn('Izin kamera ditolak. Aktifkan di pengaturan browser.');
      else if (err.name === 'NotFoundError') setWarn('Kamera tidak ditemukan di perangkat ini.');
      else if (err.name === 'NotReadableError') setWarn('Kamera sedang dipakai aplikasi lain.');
      else if (err.name === 'OverconstrainedError') setWarn('Kamera tidak mendukung mode yang diminta.');
      else setWarn(`Gagal akses kamera: ${err.name || ''} ${err.message || ''}`.trim());
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const stampedUrl = await stampGpsOnImage(canvas.toDataURL('image/webp', 0.8), gps, outlet, slaType);
    setPreview(stampedUrl);
    onPhotoChange(index, stampedUrl);
    setShowWebcam(false);
    stopStream();
  };

  useEffect(() => () => stopStream(), [stopStream]);

  return (
    <div className={`sec kendala ${disabled ? 'disabled' : ''}`}>
      <div className="sec-h">
        <span className="mark num">{index + 1}</span>
        <div>
          <div className="tt">Kendala {index + 1}</div>
          <div className="ds">Foto & keterangan singkat</div>
        </div>
        {!disabled && <span className="hint">Kamera only</span>}
        {!disabled && canRemove && <button className="rm" type="button" onClick={() => { stopStream(); onRemove(index); }}>Hapus</button>}
      </div>

      <div className="field">
        <label className="fl">Foto Kerusakan <span className="req">*</span></label>
        {disabled && <div className="disabled-overlay"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg><span>Selesaikan langkah sebelumnya</span></div>}
        {showWebcam && (
          <div className="cam-view">
            <div className="cam-container">
              <video ref={videoRef} autoPlay playsInline muted className="cam-video" />
              <GpsOverlay gps={gps} outlet={outlet} slaType={slaType} />
            </div>
            <div className="cam-controls">
              <button className="cam-btn capture" onClick={capturePhoto}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg></button>
              <button className="cam-btn cancel" onClick={() => { setShowWebcam(false); stopStream(); }}>Batal</button>
            </div>
          </div>
        )}
        {!showWebcam && !preview && !disabled && (
          <label className="shot-btn shotBtn" onClick={openCamera}>
            <div className="cam-ic">{camLoading ? <div className="cam-spinner" /> : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>}</div>
            <span className="shot-t">{camLoading ? 'Membuka kamera…' : 'Ambil Foto Kerusakan'}</span>
            <span className="shot-s">{camLoading ? 'Mohon tunggu' : 'Buka kamera & foto. GPS + jam ter-cap otomatis.'}</span>
            {!camLoading && <span className="lock"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/></svg> kamera only</span>}
          </label>
        )}
        {!showWebcam && preview && (
          <div className="preview preview--visible">
            <img src={preview} alt="Pratinjau" onClick={() => onPhotoClick(preview)} className="preview__img--zoomable" />
            {!disabled && <label className="shot-btn again shot-btn--padded" onClick={openCamera}><span className="shot-t shot-t--sm">↻ Foto Ulang</span></label>}
          </div>
        )}
        {warn && <div className="warn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.7 3.9a2 2 0 00-3.4 0z"/></svg><span>{warn}</span></div>}
      </div>

      <div className="field">
        <label className="fl">Keterangan <span className="req">*</span></label>
        <textarea className="ket" placeholder={disabled ? 'Selesaikan langkah sebelumnya' : (contoh ? `contoh keterangan : ${contoh}` : '')} value={data.keterangan} disabled={disabled} onChange={(e) => onChange(index, e.target.value)} onFocus={e => { const el = e.target; const scroll = () => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); if (window.visualViewport) { window.visualViewport.addEventListener('resize', scroll, { once: true }); } else { setTimeout(scroll, 300); } }} />
      </div>
    </div>
  );
}

// ===== Main Page =====
export default function LaporanKendala() {
  const [outlets, setOutlets] = useState([]);
  const [outlet, setOutlet] = useState('');
  const [outletNama, setOutletNama] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [ticketTime, setTicketTime] = useState(null);
  const [gps, setGps] = useState({ lat: null, lon: null, acc: null, addr: null, status: 'loading' });
  const [kendalaList, setKendalaList] = useState([{ keterangan: '', photo: null }]);
  const [apiStatus, setApiStatus] = useState({ loading: true, ok: false });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [photoViewer, setPhotoViewer] = useState(null);
  const [slaLevels, setSlaLevels] = useState([]);
  const [slaType, setSlaType] = useState('');
  const [katalogGejala, setKatalogGejala] = useState([]);
  const [kategori, setKategori] = useState('');
  const [kategoriQuery, setKategoriQuery] = useState('');
  const [kategoriOpen, setKategoriOpen] = useState(false);
  const [kategoriSelected, setKategoriSelected] = useState(null);
  const kategoriRef = useRef(null);
  const [retryGpsLoading, setRetryGpsLoading] = useState(false);
  const [kendalaKey, setKendalaKey] = useState(0); // force remount KendalaItem on reset

  // Load outlets + SLA levels
  useEffect(() => {
    api.getOutlets()
      .then(rows => setOutlets(Array.isArray(rows) ? rows : (rows?.data ?? [])))
      .catch(() => setOutlets([{ kode: 'BRACI', nama: 'BRACI' }, { kode: 'OPIUCI', nama: 'OPIUCI' }, { kode: 'RICI', nama: 'RICI' }, { kode: 'JURNAL_BRAGA', nama: 'JURNAL BRAGA' }, { kode: 'TANATAP', nama: 'TANATAP' }]));
    
    api.getSlaLevels()
      .then(rows => {
        if (rows.length > 0) {
          setSlaLevels(rows.map(s => ({ kode: s.kode, nama: `${s.kode} — ${s.nama}`, max_hours: s.max_hours })));
        }
      })
      .catch(err => setApiStatus({ loading: false, ok: false, detail: `SLA gagal dimuat: ${err.message}` }));

    api.getKatalogGejala()
      .then(rows => setKatalogGejala(rows))
      .catch(err => setApiStatus({ loading: false, ok: false, detail: `Katalog gejala gagal dimuat: ${err.message}` }));

    api.health()
      .then(() => setApiStatus({ loading: false, ok: true, detail: null }))
      .catch(err => setApiStatus({ loading: false, ok: false, detail: err.message || null }));
  }, []);

  // GPS
  useEffect(() => {
    if (!navigator.geolocation) { setGps(p => ({ ...p, status: 'error', message: 'Perangkat tidak mendukung GPS' })); return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGps({ lat: latitude, lon: longitude, acc: Math.round(accuracy), status: 'ok', addr: null });
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat=${latitude}&lon=${longitude}`, { headers: { Accept: 'application/json', 'User-Agent': 'MatoaInternal/1.0' } })
          .then(r => r.ok ? r.json() : Promise.reject())
          .then(d => { if (d?.display_name) setGps(p => ({ ...p, addr: d.display_name })); })
          .catch(() => {});
      },
      err => {
        const msg = err.code === 1 ? 'Izin lokasi ditolak' : err.code === 2 ? 'Sinyal GPS tidak tersedia' : 'Waktu habis';
        setGps(p => ({ ...p, status: 'error', message: msg }));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  // Close kategori dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (kategoriRef.current && !kategoriRef.current.contains(e.target)) {
        setKategoriOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doRetryGps = () => {
    setRetryGpsLoading(true);
    setGps({ lat: null, lon: null, acc: null, addr: null, status: 'loading' });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude, accuracy } = pos.coords;
          setGps({ lat: latitude, lon: longitude, acc: Math.round(accuracy), status: 'ok', addr: null });
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat=${latitude}&lon=${longitude}`, { headers: { Accept: 'application/json', 'User-Agent': 'MatoaInternal/1.0' } })
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(d => { if (d?.display_name) setGps(p => ({ ...p, addr: d.display_name })); })
            .catch(() => {});
          setRetryGpsLoading(false);
        },
        err => {
          const msg = err.code === 1 ? 'Izin lokasi ditolak' : err.code === 2 ? 'Sinyal GPS tidak tersedia' : 'Waktu habis';
          setGps(p => ({ ...p, status: 'error', message: msg }));
          setRetryGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  };

  const handleOutletChange = (e) => {
    const kode = e.target.value;
    const found = outlets.find(o => o.kode === kode);
    setOutlet(kode);
    setOutletNama(found ? found.nama : kode);
    if (kode && !ticketId) {
      const now = new Date();
      const p2 = n => String(n).padStart(2, '0');
      setTicketId(`${kode} - ${p2(now.getDate())}/${p2(now.getMonth()+1)}/${now.getFullYear()} - ${p2(now.getHours())}:${p2(now.getMinutes())}`);
      setTicketTime(now);
    }
  };

  const handleKendalaChange = (idx, value) => {
    setKendalaList(prev => prev.map((k, i) => i === idx ? { ...k, keterangan: value } : k));
  };

  const handlePhotoChange = (idx, photoUrl) => {
    setKendalaList(prev => prev.map((k, i) => i === idx ? { ...k, photo: photoUrl } : k));
  };

  const addKendala = () => setKendalaList(prev => [...prev, { keterangan: '', photo: null }]);
  const removeKendala = (idx) => setKendalaList(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!outlet) { setSubmitResult({ type: 'error', message: 'Pilih outlet terlebih dahulu.' }); return; }
    if (!kategori) { setSubmitResult({ type: 'error', message: 'Pilih kategori kendala.' }); return; }
    if (kendalaList.some(k => !k.photo || !k.keterangan.trim())) {
      setSubmitResult({ type: 'error', message: 'Lengkapi semua foto dan keterangan.' }); return; }
    setSubmitting(true); setSubmitResult(null);
    try {
      // Ambil next ticket ID dari server
      const tidJson = await api.nextTicketId();
      if (!tidJson.ok) throw new Error('Gagal generate tiket ID');
      const tid = tidJson.tiket_id;

      // Detect device — high-entropy API for exact model (Chrome 110+ Android hides model as "K")
      const getDeviceInfo = async () => {
        const ua = navigator.userAgent;
        const brMatch = ua.match(/(Chrome|Firefox|Edge|OPR)\/(\d+)/);
        const br = brMatch ? brMatch[1].replace('OPR', 'Opera') + ' ' + brMatch[2] : '';
        try {
          if (navigator.userAgentData?.getHighEntropyValues) {
            const h = await navigator.userAgentData.getHighEntropyValues(['model', 'platform', 'platformVersion']);
            const model = h.model || '';
            const platform = h.platform || '';
            const ver = (h.platformVersion || '').split('.')[0];
            if (model) return `${platform} ${ver} / ${model} / ${br}`.slice(0, 80);
            if (platform) return `${platform} ${ver} / ${br}`.slice(0, 80);
          }
        } catch (_) { /* fallback below */ }
        const m = ua.match(/\(([^)]+)\)/);
        if (!m) return `Unknown / ${br}`;
        const parts = m[1].split(';').map(s => s.trim());
        if (parts[1]?.startsWith('Android')) {
          const raw = parts.slice(2).join('; ').trim();
          const brandMatch = ua.match(/(Infinix|Samsung|Xiaomi|Redmi|OPPO|Vivo|Realme|OnePlus|Huawei|Nokia|Tecno)\s+[A-Z0-9\-]+/i);
          const device = (!raw || raw === 'K') ? (brandMatch?.[0] || 'Android') : raw.replace(/\s+Build\/.+/, '');
          return `${parts[1]} / ${device} / ${br}`.slice(0, 80);
        }
        if (parts[0] === 'iPhone') return `iPhone iOS ${(parts[1]?.match(/OS ([\d_]+)/)?.[1]||'').replace(/_/g,'.')} / ${br}`;
        if (parts[0] === 'iPad')   return `iPad iOS ${(parts[1]?.match(/OS ([\d_]+)/)?.[1]||'').replace(/_/g,'.')} / ${br}`;
        const win = parts.find(p => p.startsWith('Windows NT'));
        if (win) {
          const ver = {'10.0':'10','6.3':'8.1','6.2':'8','6.1':'7'}[win.replace('Windows NT ','')] || win.replace('Windows NT ','');
          return `Windows ${ver} / ${br}`;
        }
        if (parts.find(p => p === 'Macintosh')) return `macOS / ${br}`;
        return `Linux / ${br}`;
      };
      const createdBy = await getDeviceInfo();

      await api.submitLaporan({
        tiket_id: tid,
        outlet,
        user_id: kategoriSelected?.user_id ?? null,
        created_by: createdBy,
        gejala_id: kategoriSelected?.gejala_id ?? null,
        created_at: (() => {
          const t = ticketTime || new Date();
          const p2 = n => String(n).padStart(2, '0');
          return `${t.getFullYear()}-${p2(t.getMonth()+1)}-${p2(t.getDate())}T${p2(t.getHours())}:${p2(t.getMinutes())}:${p2(t.getSeconds())}+07:00`;
        })(),
        gps: {
          lat: gps.lat,
          lon: gps.lon,
          acc: gps.acc,
          addr: gps.addr,
        },
        sla_type: slaType,
        issues: kendalaList.map((k, i) => ({
          keterangan: k.keterangan,
          lat: gps.lat,
          lon: gps.lon,
          photo_taken_at: new Date().toISOString(),
          photos: [{ url: k.photo, keterangan: 'Kendala ' + (i+1), seq: i }],
        })),
      });

      setSubmitResult({ type: 'success', message: 'Laporan berhasil disimpan', ticketId: tid });
      setKendalaList([{ keterangan: '', photo: null }]);
      setTicketId('');
      setOutlet('');
      setOutletNama('');
      setSlaType('');
      setTicketTime(null);
      setKategori('');
      setKategoriQuery('');
      setKategoriSelected(null);
      setKategoriOpen(false);
    } catch (err) {
      setSubmitResult({ type: 'error', message: err.message || 'Gagal menyimpan. Coba lagi.' });
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = outlet && kendalaList.every(k => k.photo && k.keterangan.trim());
  const kendalaDisabled = !outlet;

  return (
    <div className="wrap">
      {photoViewer && <PhotoViewer src={photoViewer} onClose={() => setPhotoViewer(null)} />}

      {/* Topbar - matched reference */}
      <div className="topbar">
        <div className="brand">
          <div className="logo-mark">M</div>
          <span className="dept">Maintenance</span>
        </div>
        <div className="topbar-right">
          <span className="tag">Lapor · Kendala</span>
        </div>
      </div>

      {/* Hero - matched reference */}
      <div className="hero">
        <div className="eyebrow">Laporan Kendala · Tim Teknisi ME</div>
        <h1>Laporan Kendala Outlet</h1>
        <p className="lead">Foto kerusakan + keterangan singkat, langsung dari HP. Bisa beberapa kendala sekaligus, foto otomatis ber-geotag.</p>
        
        {/* API Status */}
        <div className="api-status">
          {apiStatus.loading ? (
            <span className="api-loading"><span className="spin-sm" /> memuat API...</span>
          ) : apiStatus.ok ? (
            <span className="api-ok">✓ API connected</span>
          ) : (
            <span className="api-err">✗ API offline — {apiStatus.detail || 'data belum tersinkron'}</span>
          )}
        </div>

        {/* Step Progress - sticky */}
        <div className="step-prog">
          <div className={`sp-item ${gps.status === 'ok' ? 'done' : ''}`}>
            <span className="sp-icon">{gps.status === 'ok' ? '✓' : '1'}</span>
            <span className="sp-label">Lokasi GPS</span>
          </div>
          <div className="sp-line" />
          <div className={`sp-item ${outlet ? 'done' : ''}`}>
            <span className="sp-icon">{outlet ? '✓' : '2'}</span>
            <span className="sp-label">Outlet</span>
          </div>
          <div className="sp-line" />
          <div className={`sp-item ${slaType ? 'done' : ''}`}>
            <span className="sp-icon">{slaType ? '✓' : '3'}</span>
            <span className="sp-label">Kategori</span>
          </div>
          <div className="sp-line" />
          <div className={`sp-item ${kendalaList.every(k => k.photo && k.keterangan.trim()) ? 'done' : ''}`}>
            <span className="sp-icon">{kendalaList.every(k => k.photo && k.keterangan.trim()) ? '✓' : '4'}</span>
            <span className="sp-label">Kendala</span>
          </div>
        </div>
      </div>
      {/* GPS Box - always enabled */}
      <div className={`gps ${gps.status === 'error' ? 'err' : ''}`} id="gps">
        <div className="gps-top">
          <div className="gps-ic">
            {gps.status === 'ok' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            ) : gps.status === 'error' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-5.7-7-11a7 7 0 0114 0c0 5.3-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
            )}
          </div>
          <div>
            <div className="gps-ttl">Lokasi GPS</div>
            <div className="gps-st">
              {gps.status === 'loading' ? 'Meminta izin lokasi…' :
               gps.status === 'ok' ? `Terdeteksi · akurasi ±${gps.acc} m` :
               gps.status === 'error' ? (gps.message || 'Gagal dapat lokasi') :
               'Meminta izin lokasi…'}
            </div>
          </div>
        </div>
        {gps.status === 'ok' && gps.lat && (
          <div className="coord">
            <span className="k">LAT</span>  {gps.lat.toFixed(6)}{'\n'}
            <span className="k">LON</span>  {gps.lon.toFixed(6)}{gps.addr ? '\n' + gps.addr : ''}
          </div>
        )}
        {gps.status === 'error' && (
          <button className="btn-mini" onClick={doRetryGps} disabled={retryGpsLoading}>
            {retryGpsLoading ? 'Mengambil ulang…' : '↻ Coba Ambil Lokasi Lagi'}
          </button>
        )}
      </div>

      {/* Form - disabled sequentially */}
      <div className={`sec ${gps.status !== 'ok' ? 'sec-disabled' : ''}`}>
        <div className="sec-h">
          <span className="mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-5.7-7-11a7 7 0 0114 0c0 5.3-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>
          </span>
          <div>
            <div className="tt">Detail Laporan</div>
            <div className="ds">Outlet & lokasi</div>
          </div>
        </div>

        <div className="field">
          <label className="fl">Outlet <span className="req">*</span></label>
          <select value={outlet} onChange={handleOutletChange} disabled={gps.status !== 'ok'}>
            <option value="">— Pilih Outlet —</option>
            {outlets.map(o => <option key={o.kode} value={o.kode}>{o.nama}</option>)}
          </select>
        </div>

        <div className="field" ref={kategoriRef}>
          <label className="fl">Kategori <span className="req">*</span></label>
          <div className="combo-wrap">
            <input
              className="combo-input"
              type="text"
              placeholder={gps.status !== 'ok' || !outlet ? 'Selesaikan langkah sebelumnya' : '— Pilih atau cari kategori —'}
              disabled={gps.status !== 'ok' || !outlet}
              value={kategoriQuery}
              autoComplete="off"
              onFocus={e => { setKategoriOpen(true); const el = e.target; const scroll = () => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); if (window.visualViewport) { window.visualViewport.addEventListener('resize', scroll, { once: true }); } else { setTimeout(scroll, 300); } }}
              onChange={e => {
                setKategoriQuery(e.target.value);
                setKategori('');
                setKategoriOpen(true);
              }}
            />
            {kategoriQuery && !(gps.status !== 'ok' || !outlet) && (
              <button
                type="button"
                className="combo-clear"
                onMouseDown={e => {
                  e.preventDefault();
                  setKategori('');
                  setKategoriQuery('');
                  setKategoriSelected(null);
                  setSlaType('');
                  setKategoriOpen(false);
                }}
                aria-label="Hapus kategori"
              >×</button>
            )}
            {kategoriOpen && (
              <ul className="combo-list">
                {(kategoriQuery.length >= 2
                  ? katalogGejala.filter(g =>
                      g.kategori.toLowerCase().includes(kategoriQuery.toLowerCase()) ||
                      g.gejala.toLowerCase().includes(kategoriQuery.toLowerCase()) ||
                      g.gejala_id.toLowerCase().includes(kategoriQuery.toLowerCase())
                    )
                  : katalogGejala
                ).map(g => (
                  <li key={g.gejala_id} className="combo-item" onMouseDown={e => {
                    e.preventDefault();
                    setKategori(g.gejala_id);
                    setKategoriQuery(`[${g.gejala_id}] ${g.gejala}`);
                    setSlaType(`L${g.level}`);
                    setKategoriSelected(g);
                    setKategoriOpen(false);
                  }}>
                    <span className="combo-id">{g.gejala_id}</span>
                    <span className="combo-gejala">{g.gejala}</span>
                    <span className="combo-meta">{g.kategori} · L{g.level} · <span className={`combo-tag ${g.user_id == 4 ? 'combo-tag-ga' : 'combo-tag-me'}`}>{g.user_name ?? (g.user_id == 4 ? 'GA' : 'ME')}</span></span>
                  </li>
                ))}
                {(kategoriQuery.length >= 2 && katalogGejala.filter(g =>
                  g.kategori.toLowerCase().includes(kategoriQuery.toLowerCase()) ||
                  g.gejala.toLowerCase().includes(kategoriQuery.toLowerCase()) ||
                  g.gejala_id.toLowerCase().includes(kategoriQuery.toLowerCase())
                ).length === 0) && (
                  <li className="combo-empty">Tidak ditemukan</li>
                )}
              </ul>
            )}
          </div>
          <p className="field-note">Jika kategori tidak tersedia, tambahkan pada dashboard terlebih dahulu.</p>
          {kategoriSelected && (() => {
            const slaInfo = slaLevels.find(s => s.kode === `L${kategoriSelected.level}`);
            return (
              <div className="kategori-info">
                <div className="ki-row">
                  <span className="ki-label">Level SLA</span>
                  <span className="ki-val">
                    <span className="ki-badge ki-tidak ki-badge--mr">L{kategoriSelected.level}</span>
                    {slaInfo ? slaInfo.nama : `L${kategoriSelected.level}`}
                  </span>
                </div>
                <div className="ki-row">
                  <span className="ki-label">Contoh Kerusakan</span>
                  <span className="ki-val">{kategoriSelected.contoh || '-'}</span>
                </div>
                <div className="ki-row">
                  <span className="ki-label">Butuh Barang</span>
                  <span className={`ki-badge ${kategoriSelected.butuh_barang == 1 ? 'ki-ya' : 'ki-tidak'}`}>
                    {kategoriSelected.butuh_barang == 1 ? 'YA' : 'TIDAK'}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {ticketId && <div className="field"><label className="fl">Tiket ID</label><input readOnly value={ticketId} placeholder="pilih outlet dulu" /></div>}
      </div>

      {/* Kendala List */}
      <div className={`sec ${gps.status !== 'ok' || !outlet || !kategori ? 'sec-disabled' : ''}`}>
        <div className="sec-h">
          <span className="mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </span>
          <div>
            <div className="tt">Kendala & Foto</div>
            <div className="ds">Tiap kendala wajib foto</div>
          </div>
        </div>

        {gps.status !== 'ok' && (
          <div className="gps-warn">⚠️ Aktifkan GPS terlebih dahulu.</div>
        )}
        {!outlet && gps.status === 'ok' && (
          <div className="gps-warn">⚠️ Pilih outlet terlebih dahulu.</div>
        )}
        {!kategori && outlet && (
          <div className="gps-warn">⚠️ Pilih kategori kendala terlebih dahulu.</div>
        )}

        {kendalaList.map((k, i) => (
          <KendalaItem key={`${kendalaKey}-${i}`} index={i} data={k} gps={gps} outlet={outletNama || outlet} slaType={slaType}
            onChange={handleKendalaChange} onRemove={removeKendala}
            onPhotoChange={handlePhotoChange} canRemove={kendalaList.length > 1}
            contoh={kategoriSelected?.contoh ?? null}
            disabled={kendalaDisabled || gps.status !== 'ok' || !outlet || !slaType} onPhotoClick={setPhotoViewer} />
        ))}
      </div>

      <div className="add-wrap">
        <button className="add" onClick={addKendala} disabled={kendalaDisabled || gps.status !== 'ok' || !outlet || !slaType}>＋ Tambah Kendala</button>
      </div>

      {/* Note */}
      <div className={`note ${gps.status !== 'ok' || !outlet || !slaType ? 'note-disabled' : ''}`}>
        <div className="nl">Catatan</div>
        <p>Setiap kendala wajib disertai foto langsung dari kamera di lokasi.</p>
      </div>

      {/* CTA */}
      <div className="cta">
        <button className={`gen ${submitResult?.type === 'success' ? 'gen-ok' : ''} ${submitResult?.type === 'error' ? 'gen-err' : ''}`} onClick={handleSubmit} disabled={!canSubmit || submitting || gps.status !== 'ok' || !outlet || !slaType}>
          {submitting ? (
            <><div className="spin" /> Menyimpan…</>
          ) : submitResult?.type === 'success' ? (
            <>✓ Laporan Terkirim</>
          ) : submitResult?.type === 'error' ? (
            <>✗ Gagal Mengirim</>
          ) : (
            'Buat Laporan'
          )}
        </button>
        
        {submitResult?.type === 'success' && (
          <div className="popup-overlay" onClick={() => {}}>
            <div className="popup-box">
              <div className="popup-icon">✓</div>
              <h2>Laporan Berhasil Terkirim</h2>
              <p>Data laporan telah tersimpan.</p>
              <button className="gen gen-new" onClick={() => {
                setKendalaKey(k => k + 1);
                setKendalaList([{ keterangan: '', photo: null }]);
                setTicketId('');
                setTicketTime(null);
                setOutlet('');
                setOutletNama('');
                setSlaType('');
                setKategori('');
                setKategoriQuery('');
                setKategoriSelected(null);
                setKategoriOpen(false);
                setSubmitResult(null);
                setPhotoViewer(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}>
                + Buat Laporan Baru
              </button>
            </div>
          </div>
        )}

        {submitResult?.type === 'error' && (
          <div className="popup-overlay" onClick={() => {}}>
            <div className="popup-box">
              <div className="popup-icon popup-err">✗</div>
              <h2>Gagal Mengirim Laporan</h2>
              <p>{submitResult.message}</p>
              <button className="gen gen-new" onClick={() => {
                setKendalaKey(k => k + 1);
                setKendalaList([{ keterangan: '', photo: null }]);
                setTicketId('');
                setSlaType('');
                setKategori('');
                setKategoriQuery('');
                setSubmitResult(null);
                setPhotoViewer(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}>
                + Buat Laporan Baru
              </button>
            </div>
          </div>
        )}

        {canSubmit && !submitting && !submitResult && (
          <p className="gen-note">Hasil berisi seluruh kendala + foto ber-geotag.</p>
        )}
      </div>

      <div className="site-foot">Matoa Group · Sistem Pelaporan Maintenance</div>
    </div>
  );
}
