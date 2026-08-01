import { useState, useEffect, useRef, useCallback } from "react";
import logo from "../assets/logo.svg";
import "./LaporanPerbaikan.css";

const PHP_BASE = "/php-api";
const fotoSrc = (url) => url ? (url.startsWith("http") || url.startsWith("data:") ? url : `${PHP_BASE}/${url}`) : null;

/* ── Photo Viewer (zoom + pan + double-tap) ── */
function PhotoViewer({ src, onClose }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(false);
  const ds = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const clamp = (s) => Math.min(5, Math.max(0.5, s));
  const lastTap = useRef(0);
  const pinchRef = useRef({ dist: 0, scale: 1 });
  const stateRef = useRef({ scale: 1, pos: { x: 0, y: 0 }, drag: false });
  const vpRef = useRef(null);

  useEffect(() => {
    stateRef.current = { scale, pos, drag };
  }, [scale, pos, drag]);

  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

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
        ds.current = { x: t.clientX, y: t.clientY, px: stateRef.current.pos.x, py: stateRef.current.pos.y };
        setDrag(true);
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        setScale(clamp(pinchRef.current.scale * getTouchDist(e.touches) / pinchRef.current.dist));
      } else if (e.touches.length === 1 && stateRef.current.drag) {
        const t = e.touches[0];
        setPos({ x: ds.current.px + (t.clientX - ds.current.x), y: ds.current.py + (t.clientY - ds.current.y) });
      }
    };
    const onWheel = (e) => {
      e.preventDefault();
      setScale((p) => clamp(p + (e.deltaY > 0 ? -0.15 : 0.15)));
    };
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("wheel", onWheel);
    };
  }, []); // mount once — state accessed via stateRef
  return (
    <div
      className="pv-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={vpRef}
        className="pv-viewport"
        onClick={(e) => {
          const now = Date.now();
          if (now - lastTap.current < 300) {
            if (scale > 1) {
              setScale(1);
              setPos({ x: 0, y: 0 });
            } else setScale(2.5);
          }
          lastTap.current = now;
        }}
        onMouseDown={(e) => {
          if (scale <= 1) return;
          setDrag(true);
          ds.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
        }}
        onMouseMove={(e) => {
          if (!drag) return;
          setPos({
            x: ds.current.px + (e.clientX - ds.current.x),
            y: ds.current.py + (e.clientY - ds.current.y),
          });
        }}
        onMouseUp={() => setDrag(false)}
      >
        <img
          src={src}
          alt="Foto"
          draggable={false}
          style={{
            transform: `translate(${pos.x}px,${pos.y}px) scale(${scale})`,
            cursor: scale > 1 ? "grab" : "zoom-in",
          }}
        />
      </div>
      <div className="pv-controls">
        <button
          className="pv-btn"
          onClick={(e) => {
            e.stopPropagation();
            setScale((s) => clamp(s + 0.3));
          }}
        >
          ＋
        </button>
        <button
          className="pv-btn"
          onClick={(e) => {
            e.stopPropagation();
            setScale((s) => clamp(s - 0.3));
          }}
        >
          −
        </button>
        <button
          className="pv-btn"
          onClick={(e) => {
            e.stopPropagation();
            setScale(1);
            setPos({ x: 0, y: 0 });
          }}
        >
          1:1
        </button>
        <button className="pv-btn pv-close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="pv-hint">
        {scale > 1 ? `${Math.round(scale * 100)}%` : "Ketuk 2x untuk zoom"}
      </div>
    </div>
  );
}

/* ── GPS overlay on live viewfinder ── */
function GpsOverlay({ gps, outlet }) {
  if (!gps || (gps.status !== "ok" && !gps.lat)) return null;
  const p2 = (n) => String(n).padStart(2, "0");
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const tgl =
    p2(now.getDate()) +
    "/" +
    p2(now.getMonth() + 1) +
    "/" +
    now.getFullYear() +
    " - " +
    p2(now.getHours()) +
    ":" +
    p2(now.getMinutes());
  return (
    <div className="gps-overlay">
      <span className="gps-overlay-line">
        {outlet || "OUTLET"} - {tgl}
      </span>
      <span className="gps-overlay-line">LAT {gps.lat?.toFixed(6)}</span>
      <span className="gps-overlay-line">LON {gps.lon?.toFixed(6)}</span>
      {gps.addr && (
        <span className="gps-overlay-line gps-overlay-addr">
          ALAMAT {gps.addr}
        </span>
      )}
    </div>
  );
}

/* ── Stamp GPS onto captured image ── */
function stampGpsOnImage(dataUrl, gps, outlet) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      const maxW = 1200;
      const sc = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * sc),
        h = Math.round(img.height * sc);
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const p2 = (n) => String(n).padStart(2, "0");
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const tgl =
        p2(now.getDate()) +
        "/" +
        p2(now.getMonth() + 1) +
        "/" +
        now.getFullYear() +
        " - " +
        p2(now.getHours()) +
        ":" +
        p2(now.getMinutes());
      const lines = [`${outlet || "OUTLET"} - ${tgl}`];
      if (gps?.lat != null) {
        lines.push("LAT  " + gps.lat.toFixed(6));
        lines.push("LON  " + gps.lon.toFixed(6));
      } else lines.push("GPS tidak terkunci");
      if (gps?.addr) lines.push("ALAMAT  " + gps.addr);
      const pad = Math.round(w * 0.028),
        fMono = Math.max(14, Math.round(w * 0.028)),
        fSmall = Math.max(12, Math.round(w * 0.022)),
        lh = fMono * 1.45;
      let barH = pad * 2 + lines.length * lh;
      if (lines.find((l) => l.startsWith("ALAMAT"))) barH += fSmall * 1.4;
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, h - barH - 8, w, barH + 8);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, h - barH, Math.round(w * 0.09), 4);
      const ix = pad,
        iy = h - barH + pad + 2,
        isz = fMono * 0.9;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(2, fMono * 0.09);
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(ix + isz / 2, iy + isz);
      ctx.bezierCurveTo(
        ix + isz / 2 - isz * 0.55,
        iy + isz * 0.55,
        ix,
        iy + isz * 0.35,
        ix + isz / 2,
        iy,
      );
      ctx.bezierCurveTo(
        ix + isz,
        iy + isz * 0.35,
        ix + isz,
        iy + isz * 0.55,
        ix + isz / 2,
        iy + isz,
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ix + isz / 2, iy + isz * 0.38, isz * 0.16, 0, Math.PI * 2);
      ctx.stroke();
      const tx = pad + isz + pad * 0.5;
      let y = h - barH + pad;
      ctx.textBaseline = "top";
      for (const line of lines) {
        if (line.startsWith("ALAMAT")) {
          ctx.fillStyle = "#c7c7c7";
          ctx.font = "400 " + fSmall + "px Inter,sans-serif";
          ctx.fillText(line, tx, y);
          y += fSmall * 1.4;
        } else {
          ctx.fillStyle = "#dcdcdc";
          ctx.font = "500 " + fMono + "px JetBrains Mono,monospace";
          ctx.fillText(line, tx, y);
          y += lh;
        }
      }
      resolve(cv.toDataURL("image/webp", 0.8));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/* ── SLA config (mirror dashboard) ── */
const SLA_HOURS = { L1: 24, L2: 72, L3: 120 };
const SLA_LABEL = { L1: "Maks 1 Hari", L2: "Maks 3 Hari", L3: "Maks 5 Hari" };

const STATUS_LABELS = {
  dijadwalkan: "Belum Dikerjakan",
  sedang_dikerjakan: "Sedang Dikerjakan",
  selesai_dikerjakan: "Selesai Dikerjakan",
  terverifikasi: "Terverifikasi",
  tunggu_barang: "Tunggu Barang",
  barang_diproses: "Barang Diproses",
  barang_ready: "Barang Ready",
  over_sla: "Over SLA",
};
const STATUS_DOT = {
  dijadwalkan: "",
  sedang_dikerjakan: "st-sedang",
  selesai_dikerjakan: "st-ok",
  terverifikasi: "st-ok",
  tunggu_barang: "st-tunggu-barang",
  barang_diproses: "st-tunggu-barang",
  barang_ready: "st-tunggu-barang",
  over_sla: "st-issue",
};
const STATUS_ITEM_CLS = {
  sedang_dikerjakan: "st-sedang-dikerjakan",
  over_sla: "st-over-sla",
  tunggu_barang: "st-tunggu-barang",
  barang_diproses: "st-tunggu-barang",
  barang_ready: "st-barang-ready",
};

function parseWIB(s) {
  if (!s) return null;
  if (s instanceof Date) return s;
  const str = String(s);
  // already has tz offset
  if (/[Z+\-]\d{2}:?\d{2}$/.test(str)) return new Date(str);
  // bare "YYYY-MM-DD HH:MM:SS" from DB → treat as WIB +07:00
  return new Date(str.replace(" ", "T") + "+07:00");
}

function fmtDatetime(dt) {
  if (!dt) return "—";
  const d = parseWIB(dt);
  if (!d || isNaN(d)) return "—";
  return d
    .toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    })
    .replace(".", ":");
}

function fmtDeadline(dt) {
  if (!dt) return "—";
  const d = dt instanceof Date ? dt : parseWIB(dt);
  if (!d || isNaN(d)) return "—";
  return d
    .toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    })
    .replace(".", ".");
}

function slaDeadline(createdAt, level, status, deadlineDate) {
  // tunggu_barang: deadline ditahan, tampilkan dari jadwal_kendala.deadline_date
  if (status === "tunggu_barang" || status === "barang_diproses") return null;
  if (deadlineDate) return parseWIB(deadlineDate);
  return null;
}

// Hapus — semua pakai /api via Vite proxy

function IcoCopy() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function IcoEye() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="svg-no-shrink"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const ALASAN_OPTS = [
  "Butuh Anggaran",
  "Perlu Waktu",
  "Menunggu Sparepart/Vendor",
];

function IcoCamera() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function TiketItem({
  t,
  onDetail,
  onCopy,
  onRefresh,
  onScrollTo,
  pic = "",
  gps = null,
  activePic = null,
  lockedByOther = false,
}) {
  const sc = STATUS_ITEM_CLS[t.status] || "";
  const statusLabel = STATUS_LABELS[t.status] || t.status;
  const dotCls = STATUS_DOT[t.status] || "";
  const deadline = slaDeadline(
    t.created_at,
    t.level,
    t.status,
    t.deadline_date,
  );
  const [bbOpen, setBbOpen] = useState(false);
  const [alasan, setAlasan] = useState([]);
  const [alasanError, setAlasanError] = useState(false);
  const [barangItems, setBarangItems] = useState([
    { foto: null, preview: null, detail: "" },
  ]);
  const [sending, setSending] = useState(false);
  const [pgData, setPgData] = useState(null);
  const [pgLoading, setPgLoading] = useState(false);
  const [fotoFull, setFotoFull] = useState(null);
  const [dkOpen, setDkOpen] = useState(
    () => t.status === "sedang_dikerjakan" && t.nama_petugas === pic,
  );
  const [beforeSent, setBeforeSent] = useState(false);
  const [prevStatus, setPrevStatus] = useState(null);
  const [isRevisi, setIsRevisi] = useState(false); // mode revisi: data existing loaded
  const [fotoBefore, setFotoBefore] = useState(null); // dataUrl
  const [fotoAfterList, setFotoAfterList] = useState([]); // dataUrl[]
  const [keterangan, setKeterangan] = useState("");
  const [ketError, setKetError] = useState(false);
  const [pvSrc, setPvSrc] = useState(null); // PhotoViewer
  // webcam state
  const [camTarget, setCamTarget] = useState(null); // 'before'|'after'
  const [retakeAfterIdx, setRetakeAfterIdx] = useState(null); // index to replace, null=append
  const [showCam, setShowCam] = useState(false);
  const [camLoading, setCamLoading] = useState(false);
  const [camWarn, setCamWarn] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fotoAfterRef = useRef(null);
  const fotoBeforeRef = useRef(null);
  const ketRef = useRef(null);


  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCamLoading(false);
  }, []);

  // stop camera stream on unmount
  useEffect(() => () => stopStream(), [stopStream]);

  const openCamera = async (target, retakeIdx = null) => {
    setCamTarget(target);
    setCamWarn("");
    setRetakeAfterIdx(retakeIdx);
    try {
      setCamLoading(true);
      let ms;
      try {
        ms = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        ms = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      streamRef.current = ms;
      setShowCam(true);
      setCamLoading(false);
      requestAnimationFrame(() => {
        const v = videoRef.current;
        if (v) {
          v.srcObject = ms;
          v.play().catch(() => {});
        } else
          setTimeout(() => {
            const v2 = videoRef.current;
            if (v2) {
              v2.srcObject = ms;
              v2.play().catch(() => {});
            }
          }, 100);
      });
    } catch (err) {
      setCamLoading(false);
      if (err.name === "NotAllowedError") setCamWarn("Izin kamera ditolak.");
      else if (err.name === "NotFoundError")
        setCamWarn("Kamera tidak ditemukan.");
      else setCamWarn("Gagal akses kamera.");
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const cv = document.createElement("canvas");
    cv.width = v.videoWidth;
    cv.height = v.videoHeight;
    cv.getContext("2d").drawImage(v, 0, 0, cv.width, cv.height);
    const outlet = t.outlet_nama || t.outlet_kode || "";
    const stamped = await stampGpsOnImage(
      cv.toDataURL("image/webp", 0.8),
      gps,
      outlet,
    );
    if (camTarget === "before") setFotoBefore(stamped);
    else if (retakeAfterIdx !== null) {
      setFotoAfterList((p) =>
        p.map((x, i) => (i === retakeAfterIdx ? stamped : x)),
      );
      setRetakeAfterIdx(null);
    } else setFotoAfterList((p) => [...p, stamped]);
    setShowCam(false);
    stopStream();
    const ref = camTarget === "before" ? fotoBeforeRef : fotoAfterRef;
    setTimeout(
      () => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
      100,
    );
  };

  useEffect(() => () => stopStream(), [stopStream]);

  const isBarangReady = t.status === "barang_ready";
  const isTunggu =
    t.status === "tunggu_barang" ||
    t.status === "barang_diproses" ||
    isBarangReady;
  const isSedang = t.status === "sedang_dikerjakan";
  const isSelesai = t.status === "selesai_dikerjakan";
  const isOwner = isSedang && t.nama_petugas === pic;
  // disable jika:
  // 1. pic sendiri ada tiket aktif, dan tiket ini bukan yang dikerjakan pic
  // 2. tiket ini sedang dikerjakan orang lain
  const myActive = activePic === pic;
  const isDisabled =
    (myActive && !isOwner) ||
    (isSedang && t.nama_petugas !== pic && t.nama_petugas);

  async function openCekBarang() {
    setPgLoading(true);
    setBbOpen(true);
    try {
      const r = await fetch(`/php-api/pengadaan/detail?tiket_id=${t.tiket_id}`);
      const d = await r.json();
      if (d.ok) setPgData(d);
      else setPgData(null);
    } catch {
      setPgData(null);
    } finally {
      setPgLoading(false);
    }
  }

  function toggleAlasan(a) {
    setAlasan((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  }

  function onFotoChange(idx, e) {
    const f = e.target.files?.[0];
    if (!f) return;
    // validasi: hanya image
    if (!f.type.startsWith('image/')) {
      alert('File harus berupa foto (jpg/png/webp)');
      e.target.value = '';
      return;
    }
    const prev = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const MAX = 1280;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const cv = document.createElement('canvas');
      cv.width = width; cv.height = height;
      cv.getContext('2d').drawImage(img, 0, 0, width, height);
      const compressed = cv.toDataURL('image/webp', 0.8);
      URL.revokeObjectURL(prev);
      setBarangItems((items) =>
        items.map((it, i) =>
          i === idx ? { ...it, foto: compressed, preview: compressed } : it,
        ),
      );
    };
    img.src = prev;
    e.target.value = '';
  }

  function onDetailChange(idx, val) {
    setBarangItems((items) =>
      items.map((it, i) => (i === idx ? { ...it, detail: val } : it)),
    );
  }

  function hapusBarang(idx) {
    setBarangItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function tambahBarang() {
    setBarangItems((prev) => [
      ...prev,
      { foto: null, preview: null, detail: "" },
    ]);
  }

  async function kirimPengadaan() {
    if (!alasan.length) {
      setAlasanError(true);
      return;
    }
    setSending(true);
    try {
      // base64 semua foto — sudah dataURL dari onFotoChange
      const fotoUrls = barangItems.map((it) => it.foto ?? null);

      const gps = await new Promise((res) =>
        navigator.geolocation.getCurrentPosition(
          (p) => res({ lat: p.coords.latitude, lon: p.coords.longitude }),
          () => res({ lat: null, lon: null }),
          { timeout: 5000 },
        ),
      );

      // pengadaan/store — kirim array barang
      const rPengadaan = await fetch(`/php-api/pengadaan/store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiket_id: t.tiket_id,
          nama_petugas: pic,
          alasan,
          barang: barangItems.map((it, i) => ({
            foto_url: fotoUrls[i],
            detail: it.detail,
          })),
        }),
      }).then((r) => r.json());

      if (!rPengadaan.ok) throw new Error(rPengadaan.message);

      // perbaikan/store
      const rPerbaikan = await fetch(`/php-api/perbaikan/store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiket_id: t.tiket_id,
          nama_petugas: pic,
          butuh_barang: true,
          keterangan_perbaikan: [],
          lat: gps.lat,
          lon: gps.lon,
        }),
      }).then((r) => r.json());

      if (!rPerbaikan.ok) throw new Error(rPerbaikan.message);

      const rStatus = await fetch(`/php-api/laporan/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, status: "tunggu_barang" }),
      }).then((r) => r.json());

      if (!rStatus.ok) throw new Error(rStatus.message);

      setBbOpen(false);
      setAlasan([]);
      setBarangItems([{ foto: null, preview: null, detail: "" }]);
      onRefresh && onRefresh("✓ Pengadaan terkirim");
    } catch (err) {
      console.error('[kirimPengadaan]', err);
      alert("Gagal kirim: " + (err?.message || JSON.stringify(err)));
    } finally {
      setSending(false);
    }
  }

  async function handleKirimLaporan() {
    if (!fotoBefore) {
      alert("Foto Before wajib");
      return;
    }
    if (!fotoAfterList.length) {
      alert("Minimal 1 Foto After");
      return;
    }
    if (!keterangan.trim()) {
      setKetError(true);
      ketRef.current?.focus();
      ketRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSending(true);
    try {
      const gps = await new Promise((res) =>
        navigator.geolocation.getCurrentPosition(
          (p) => res({ lat: p.coords.latitude, lon: p.coords.longitude }),
          () => res({ lat: null, lon: null }),
          { timeout: 5000 },
        ),
      );
      const r = await fetch(`/php-api/perbaikan/store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tiket_id: t.tiket_id,
          nama_petugas: pic,
          butuh_barang: false,
          foto_before_id: fotoBefore,
          foto_after_id: fotoAfterList,
          keterangan_perbaikan: keterangan ? [keterangan] : [],
          lat: gps.lat,
          lon: gps.lon,
        }),
      }).then((r) => r.json());
      if (!r.ok) throw new Error(r.message);
      setDkOpen(false);
      setBeforeSent(false);
      setIsRevisi(false);
      setFotoBefore(null);
      setFotoAfterList([]);
      setKeterangan("");
      onRefresh && onRefresh("✓ Laporan perbaikan terkirim");
    } catch (err) {
      alert("Gagal kirim: " + err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div data-tiket-id={t.id} className={`lp-tiket-item ${sc}`}>
      <div className="lp-tiket-top">
        <span className="lp-tiket-id">
          {t.tiket_id}
          <button
            className="lp-tiket-copy"
            title="Salin tiket ID"
            onClick={() => {
              navigator.clipboard.writeText(t.tiket_id);
              onCopy && onCopy(t.tiket_id);
            }}
          >
            <IcoCopy />
          </button>
        </span>
        <span className="lp-tiket-status">
          <span className="lp-tiket-status-row">
            <span className={`lp-tiket-status-dot ${dotCls}`} />
            <span className="lp-tiket-status-label">{statusLabel}</span>
          </span>
          {isSedang && t.nama_petugas && (
            <span className="lp-tiket-status-oleh">Oleh {t.nama_petugas}</span>
          )}
        </span>
      </div>
      <div className="lp-tiket-body">
        <div className="lp-tiket-keterangan-label">Keterangan Kendala :</div>
        <div className="lp-tiket-title">
          {(t.keterangan || "—").split("|").map((k, i) => (
            <div key={i} className="lp-tiket-title-row">
              <span className="lp-tiket-title-dot">•</span>
              <span>{k.trim()}</span>
            </div>
          ))}
        </div>
        <div className="lp-tiket-tags">
          <span className="lp-tag-cat">
            {(t.kategori || t.tim_type || "ME").toUpperCase()}
          </span>
          <span className="lp-tag-level">
            {t.level} · {SLA_LABEL[t.level] || "—"}
          </span>
          {t.status === "tunggu_barang" || t.status === "barang_diproses" ? (
            <span className="lp-tag-level lp-tag-hold">Deadline Ditahan</span>
          ) : (
            deadline && (
              <span className="lp-tag-level">
                Deadline · {fmtDeadline(deadline)}
              </span>
            )
          )}
        </div>
      </div>

      <div className="lp-tiket-actions lp-tiket-actions--col">
        <button
          className="lp-tiket-btn lp-tiket-btn--full"
          disabled={isDisabled || lockedByOther}
          onClick={() => onDetail(t.id)}
        >
          <IcoEye />
          Detail Kendala
        </button>
        <div className="lp-tiket-actions--row">
          <button
            className={`lp-tiket-btn${bbOpen ? " lp-tiket-btn--active" : ""}`}
            disabled={isDisabled || lockedByOther || isSelesai}
            onClick={async () => {
              if (isTunggu) {
                openCekBarang();
                return;
              }
              setDkOpen(false);
              // hanya ubah status jika sedang dikerjakan dan panel mau dibuka
              if (isSedang && !bbOpen) {
                // capture status saat ini sebelum revert (prevStatus bisa null kalau state reset)
                const revertTo = prevStatus || t.status || "dijadwalkan";
                try {
                  const r = await fetch("/php-api/laporan/status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: t.id,
                      status: revertTo,
                    }),
                  });
                  const d = await r.json();
                  if (!d.ok) {
                    alert("Gagal update status: " + (d.message || "error"));
                    return;
                  }
                  onRefresh();
                } catch (err) {
                  alert("Gagal update status: " + (err.message || "koneksi error"));
                  return;
                }
              }
              // status bukan sedang_dikerjakan → toggle panel saja, tanpa ubah status
              setBbOpen((v) => !v);
            }}
          >
            {isTunggu ? "Cek Detail Barang" : "Butuh Barang"}
          </button>
          <button
            className={`lp-tiket-btn${isSedang || isRevisi ? " lp-tiket-btn--green" : ""}`}
            disabled={!isRevisi && ((isTunggu && !isBarangReady) || isDisabled || lockedByOther)}
            onClick={async () => {
              if (isDisabled) return;
              setBbOpen(false);
              if (isRevisi) {
                // Batalkan Revisi: kembalikan status selesai_dikerjakan, tutup panel
                try {
                  const r = await fetch("/php-api/laporan/status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: t.id,
                      status: "selesai_dikerjakan",
                      nama_petugas: pic,
                    }),
                  });
                  const d = await r.json();
                  if (!d.ok) {
                    alert("Gagal batalkan revisi: " + (d.message || "error"));
                    return;
                  }
                } catch (err) {
                  alert("Gagal batalkan revisi: " + (err.message || "koneksi error"));
                  return;
                }
                setDkOpen(false);
                setIsRevisi(false);
                setBeforeSent(false);
                setFotoBefore(null);
                setFotoAfterList([]);
                setKeterangan("");
                onRefresh();
                return;
              }
              if (isSelesai) {
                // Revisi: load data existing → pre-fill panel
                let rd;
                try {
                  const rr = await fetch(`/php-api/perbaikan/get?tiket_id=${t.tiket_id}`);
                  rd = await rr.json();
                } catch {
                  alert("Gagal load data revisi: koneksi error");
                  return;
                }
                if (!rd.ok) {
                  alert("Gagal load data revisi");
                  return;
                }
                const lp = rd.data;
                setFotoBefore(lp.foto_before_id || null);
                try {
                  const afterArr = lp.foto_after_id
                    ? JSON.parse(lp.foto_after_id)
                    : [];
                  setFotoAfterList(Array.isArray(afterArr) ? afterArr : []);
                } catch {
                  setFotoAfterList([]);
                }
                let ketArr = [];
                try {
                  ketArr = lp.keterangan_perbaikan
                    ? JSON.parse(lp.keterangan_perbaikan)
                    : [];
                } catch { ketArr = []; }
                setKeterangan(Array.isArray(ketArr) ? ketArr.join("\n") : "");
                // update status ke sedang_dikerjakan
                try {
                  const rs = await fetch("/php-api/laporan/status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: t.id,
                      status: "sedang_dikerjakan",
                      nama_petugas: pic,
                    }),
                  });
                  const ds = await rs.json();
                  if (!ds.ok) {
                    alert("Gagal revisi: " + (ds.message || "error"));
                    return;
                  }
                } catch (err) {
                  alert("Gagal revisi: " + (err.message || "koneksi error"));
                  return;
                }
                setIsRevisi(true);
                setBeforeSent(true); // data existing sudah ada, tampilkan semua langsung
                setDkOpen(true);
                onScrollTo?.(t.id);
                onRefresh();
                return;
              }
              const newStatus = isSedang
                ? prevStatus || "dijadwalkan"
                : "sedang_dikerjakan";
              if (!isSedang) {
                setPrevStatus(t.status);
              }
              try {
                const r = await fetch("/php-api/laporan/status", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: t.id,
                    status: newStatus,
                    nama_petugas: pic,
                  }),
                });
                const d = await r.json();
                if (!d.ok) {
                  alert("Gagal update status: " + (d.message || "error"));
                  return;
                }
              } catch (err) {
                alert("Gagal update status: " + (err.message || "koneksi error"));
                return;
              }
              if (isSedang) {
                setDkOpen(false);
                setBeforeSent(false);
              } else {
                setDkOpen(true);
                onScrollTo?.(t.id);
              }
              onRefresh();
            }}
          >
            {isRevisi
              ? "Batalkan Revisi"
              : isSelesai
                ? "Revisi Pekerjaan"
                : isSedang
                  ? "Batalkan Pekerjaan"
                  : "Mulai Kerjakan"}
          </button>
        </div>
      </div>

      {bbOpen && !isTunggu && (
        <div className="lp-bb-panel">
          <div className="lp-bb-alasan-label">
            Alasan penundaan (pilih satu / lebih)
          </div>
          <div className="lp-bb-alasan-list">
            {ALASAN_OPTS.map((a) => (
              <button
                key={a}
                className={`lp-bb-alasan-btn${alasan.includes(a) ? " active" : ""}`}
                onClick={() => { toggleAlasan(a); setAlasanError(false); }}
              >
                {a}
              </button>
            ))}
          </div>
          {alasanError && <span className="lp-field-error-msg">Pilih minimal satu alasan</span>}
          <div className="lp-bb-upload">
            <div className="lp-bb-upload-header">
              <span className="lp-bb-upload-label">
                Upload foto barang yang dibutuhkan
              </span>
              <span className={`lp-bb-upload-count${barangItems.every(it => it.foto) ? ' lp-bb-upload-count--ok' : ''}`}>
                {barangItems.filter((it) => it.foto).length}/
                {barangItems.length} foto
              </span>
            </div>
            {barangItems.map((item, idx) => (
              <div key={idx} className="lp-bb-barang-item">
                <div className="lp-bb-barang-header">
                  <span className="lp-bb-barang-title">Foto Barang {idx + 1}</span>
                  {barangItems.length > 1 && (
                    <button className="lp-bb-hapus-btn" onClick={() => hapusBarang(idx)}>✕</button>
                  )}
                </div>
                <div
                  className={`lp-bb-upload-zone${item.preview ? " has-preview" : ""}${!alasan.length ? " lp-disabled" : ""}`}
                >
                  {!item.preview && (
                    <label className={`lp-bb-upload-btn${!alasan.length ? " lp-btn-disabled" : ""}`}>
                      <IcoCamera />
                      Upload Foto (Galeri)
                      <input
                        className="lp-bb-upload-input"
                        type="file"
                        accept="image/*"
                        disabled={!alasan.length}
                        onChange={(e) => onFotoChange(idx, e)}
                      />
                    </label>
                  )}
                  {item.preview && (
                    <>
                      <img
                        className="lp-bb-foto-preview"
                        src={item.preview}
                        alt={`foto ${idx + 1}`}
                      />
                      <label className="lp-bb-upload-btn">
                        <IcoCamera />
                        Ganti Foto
                        <input
                          className="lp-bb-upload-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => onFotoChange(idx, e)}
                        />
                      </label>
                    </>
                  )}
                </div>
                <div className="lp-bb-textarea-wrap">
                  <span className="lp-bb-barang-title lp-bb-detail-title">
                    Detail Barang
                  </span>
                  <textarea
                    className={`lp-bb-textarea${item.preview && !item.detail.trim() ? ' lp-input-error' : ''}`}
                    rows="1"
                    placeholder="Jelaskan barang yang dibutuhkan..."
                    value={item.detail}
                    disabled={!item.preview}
                    onChange={(e) => onDetailChange(idx, e.target.value)}
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                  />
                  {item.preview && !item.detail.trim() && (
                    <span className="lp-field-error-msg">Isi detail barang</span>
                  )}
                </div>
              </div>
            ))}
            <button className="lp-bb-tambah-btn" onClick={tambahBarang}
              disabled={barangItems.some(it => !it.preview || !it.detail.trim())}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Tambah Barang
            </button>
          </div>
          <div className="lp-bb-kirim-wrap">
            <button
              className="lp-bb-kirim-btn"
              onClick={kirimPengadaan}
              disabled={sending || !alasan.length || barangItems.some(it => !it.preview || !it.detail.trim())}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              {sending ? "Mengirim…" : "Kirim Pengadaan"}
            </button>
          </div>
        </div>
      )}

      {dkOpen && (
        <div className="lp-bb-panel">
          {/* Webcam fullscreen */}
          {showCam && (
            <div className="cam-view">
              <div className="cam-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="cam-video"
                />
                <GpsOverlay
                  gps={gps}
                  outlet={t.outlet_nama || t.outlet_kode || ""}
                />
              </div>
              <div className="cam-controls">
                <button className="cam-btn capture" onClick={capturePhoto}>
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="4" fill="currentColor" />
                  </svg>
                </button>
                <button
                  className="cam-btn cancel"
                  onClick={() => {
                    setShowCam(false);
                    stopStream();
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {!showCam && (
            <>
              {/* Foto Before */}
              <div className="lp-dk-col" ref={fotoBeforeRef}>
                <div
                  className={`lp-bb-alasan-label ${fotoBefore ? "lp-before-count-ok" : "lp-before-count-err"}`}
                >
                  Foto Before — {fotoBefore ? "1" : "0"}/1 min
                </div>
                {fotoBefore ? (
                  <>
                    <div className="lp-dk-foto-zone has-preview">
                      <img
                        className="lp-dk-foto-preview"
                         src={fotoSrc(fotoBefore)}
                        alt="before"
                         onClick={() => setPvSrc(fotoSrc(fotoBefore))}
                      />
                    </div>
                    <button
                      className="lp-dk-retake"
                      onClick={() => openCamera("before")}
                    >
                      ↻ Foto Ulang
                    </button>
                  </>
                ) : (
                  <button
                    className={`lp-dk-foto-zone${camLoading && camTarget === "before" ? " loading" : ""}`}
                    onClick={() => openCamera("before")}
                  >
                    <IcoCamera />
                    <span>
                      Ambil Foto
                      <br />
                      (camera only)
                    </span>
                  </button>
                )}
              </div>

              {/* Tombol Kirim Foto Before — gerbang fase 2 */}
              {!beforeSent && (
                <button
                  className="lp-dk-kirim-btn"
                  disabled={!fotoBefore}
                  onClick={() => { setBeforeSent(true); onRefresh && onRefresh('✓ Foto Before Terkirim'); }}
                >
                  Lanjutkan
                </button>
              )}

              {/* Fase 2: muncul setelah before dikirim */}
              {beforeSent && (
                <>
                  {/* Foto After */}
                  <div className="lp-dk-col" ref={fotoAfterRef}>
                    <div
                      className={`lp-bb-alasan-label lp-after-count-${fotoAfterList.length >= 3 ? "ok" : fotoAfterList.length === 0 ? "err" : "warn"}`}
                    >
                      Foto After — {fotoAfterList.length}/3 min
                    </div>
                    <div className="lp-dk-after-grid">
                      {fotoAfterList.map((url, i) => (
                        <div key={i} className="lp-dk-after-item">
                          <img
                            className="lp-dk-after-thumb"
                             src={fotoSrc(url)}
                            alt={`after${i}`}
                             onClick={() => setPvSrc(fotoSrc(url))}
                          />
                          <button
                            className="lp-dk-retake"
                            onClick={() => openCamera("after", i)}
                          >
                            ↻ Ulang
                          </button>
                        </div>
                      ))}
                      {fotoAfterList.length < 10 && (
                        <button
                          className={`lp-dk-after-add${camLoading && camTarget === "after" ? " loading" : ""}`}
                          onClick={() => openCamera("after")}
                        >
                          <IcoCamera />
                          <span>
                            Ambil Foto
                            <br />
                            (camera only)
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  {camWarn && <div className="lp-dk-warn">{camWarn}</div>}

                  {fotoAfterList.length >= 3 && (
                    <>
                  {/* Keterangan */}
                  <div className="lp-bb-textarea-wrap">
                    <span className="lp-bb-barang-title lp-bb-detail-title">
                      Keterangan
                    </span>
                    <textarea
                      ref={ketRef}
                      className={`lp-bb-textarea${ketError ? " lp-input-error" : ""}`}
                      rows="2"
                      placeholder="Tulis keterangan perbaikan…"
                      value={keterangan}
                      onChange={(e) => { setKeterangan(e.target.value); if (ketError) setKetError(false); }}
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                      }}
                    />
                    {ketError && <span className="lp-field-error-msg">Keterangan wajib diisi</span>}
                  </div>
                  <button
                    className="lp-dk-kirim-btn"
                    onClick={handleKirimLaporan}
                    disabled={sending}
                  >
                    {sending ? "Mengirim…" : "Kirim Laporan"}
                  </button>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {pvSrc && <PhotoViewer src={pvSrc} onClose={() => setPvSrc(null)} />}

      {bbOpen && isTunggu && (
        <div className="lp-modal-overlay" onClick={() => setBbOpen(false)}>
          <div className="lp-modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="lp-modal-close" onClick={() => setBbOpen(false)}>
              ✕
            </button>
            {pgLoading && <div className="lp-loading">Memuat…</div>}
            {!pgLoading && pgData && (
              <>
                <div className="lp-modal-title">{pgData.tiket_id}</div>
                <div className="lp-modal-rows">
                  {[
                    ["Petugas", pgData.nama_petugas || "—"],
                    ["Outlet", t.outlet_nama || t.outlet_kode || "—"],
                    [
                      "Status",
                      STATUS_LABELS[pgData.status] || pgData.status || "—",
                    ],
                    ["Alasan", (pgData.alasan || []).join(", ") || "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="lp-modal-row">
                      <span className="lp-modal-key">{k}</span>
                      <span className="lp-modal-val">{v}</span>
                    </div>
                  ))}
                </div>
                {(pgData.items || []).length > 0 && (
                  <div className="lp-modal-kendala">
                    <div className="lp-modal-sec">BARANG DIBUTUHKAN</div>
                    {pgData.items.map((item, idx) => (
                      <div key={idx} className="lp-modal-barang-item">
                        <div className="lp-modal-kendala-row lp-modal-kendala-row--bold">
                          Barang {idx + 1}
                        </div>
                        {item.foto_barang_url && (
                          <img
                            src={fotoSrc(item.foto_barang_url)}
                            alt={item.detail_barang}
                            className="lp-modal-foto-full lp-foto-clickable"
                            onClick={() =>
                              setFotoFull(`/${item.foto_barang_url}`.replace(/\/+/, '/'))
                            }
                          />
                        )}
                        {item.detail_barang && (
                          <div className="lp-modal-kendala-row">
                            {item.detail_barang}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {fotoFull && <PhotoViewer src={fotoFull} onClose={() => setFotoFull(null)} />}
    </div>
  );
}
const ROTASI = [
  { outlet: "BRACI", days: "Senin & Kamis" },
  { outlet: "OPIUCI", days: "Selasa & Jumat" },
  { outlet: "TANATAP", days: "Rabu" },
];
const HARIAN = [
  { id: 1, name: "Siram Tanaman", outlet: "OPIUCI" },
  { id: 2, name: "Set Up Photobooth", outlet: "OPIUCI" },
];
const PER_HARI = [
  {
    hari: "Senin",
    tasks: [
      { name: "Brushing Lantai Entrance", outlet: "OPIUCI", freq: "Mingguan" },
      { name: "Cleaning Upper Window", outlet: "BRACI", freq: "Mingguan" },
    ],
  },
  {
    hari: "Selasa",
    tasks: [
      {
        name: "Brushing Lantai Dance Floor",
        outlet: "OPIUCI",
        freq: "Mingguan",
      },
      { name: "Cleaning Rigid", outlet: "OPIUCI", freq: "Mingguan" },
    ],
  },
  {
    hari: "Rabu",
    tasks: [
      { name: "Brushing Lantai Outdoor", outlet: "OPIUCI", freq: "2 Mingguan" },
      {
        name: "Cleaning Talang Air & Atap",
        outlet: "OPIUCI",
        freq: "2 Mingguan",
      },
    ],
  },
  {
    hari: "Kamis",
    tasks: [
      { name: "Brushing Lantai Area Kolam", outlet: "BRACI", freq: "Mingguan" },
      { name: "Pasang LED Screen", outlet: "OPIUCI", freq: "Mingguan" },
      { name: "Cleaning Lampu Gantung", outlet: "BRACI", freq: "Bulanan" },
    ],
  },
  {
    hari: "Jumat",
    tasks: [
      {
        name: "Brushing Lantai Teras Depan",
        outlet: "BRACI",
        freq: "Mingguan",
      },
      { name: "Cleaning Upper Window", outlet: "OPIUCI", freq: "Mingguan" },
      { name: "Copot LED Screen", outlet: "OPIUCI", freq: "Mingguan" },
    ],
  },
  {
    hari: "Sabtu",
    tasks: [
      { name: "Cleaning Kipas & Exhaust", outlet: "OPIUCI", freq: "Mingguan" },
      { name: "Cleaning Mirror Ball", outlet: "OPIUCI", freq: "2 Mingguan" },
      { name: "Cleaning Speaker", outlet: "OPIUCI", freq: "2 Mingguan" },
      { name: "Repaint Dinding & Kolom", outlet: "OPIUCI", freq: "2 Mingguan" },
    ],
  },
];
const VENDOR = [
  { name: "Trimming Tanaman", outlet: "Semua outlet", freq: "Mingguan" },
  { name: "Cleaning Karpet Upper Room", outlet: "BRACI", freq: "2× sebulan" },
  { name: "Cuci Sofa", outlet: "OPIUCI · BRACI", freq: "Bulanan (1×)" },
  { name: "Cuci Sofa", outlet: "TANATAP", freq: "2 bulan sekali" },
];
const getToday = () =>
  new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }))
    .toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

/* ── atoms ── */
function Pill({ children, className = "" }) {
  return <span className={`lp-pill ${className}`}>{children}</span>;
}
function FTag({ label }) {
  return <span className="lp-ftag">{label}</span>;
}
function Sec({ children }) {
  return <div className="lp-sec">{children}</div>;
}
function DarkBox({ children }) {
  return <div className="lp-darkbox">{children}</div>;
}

/* ── tab daily check ── */
const USERS_DAILY = [
  { id: 3, name: "ME" },
  { id: 4, name: "GA" },
];
const OUTLET_IDS_DAILY = { BRACI: "1", OPIUCI: "2", TANATAP: "3" };

// Static katalog — sync with daily_katalog + daily_task in DB
const DC_KATALOG = [
  {
    kode: "c1", no: "01", nama: "Kebersihan",
    items: [
      {
        kode_task: "c1-1", nama: "Kebersihan Area & Parkir", min_foto: 0,
        poin: ["Tidak ada sampah menumpuk di area","Area parkir bersih & rapih"],
      },
    ],
  },
  {
    kode: "c2", no: "02", nama: "Kondisi Bangunan",
    items: [
      {
        kode_task: "c2-1", nama: "Lantai Kayu", min_foto: 0,
        poin: ["Tidak ada lantai kayu yang terlepas","Segera tambal bila ada yang lepas"],
      },
      {
        kode_task: "c2-2", nama: "Dinding", min_foto: 0,
        poin: ["Tidak ada noda / kotor sedikit pun","Cat mulus & rapi (tidak terkelupas)","Segera cat ulang bila ada noda sekecil apapun"],
      },
      {
        kode_task: "c2-3", nama: "Pintu", min_foto: 0,
        poin: ["Cat mulus sempurna, tidak terkelupas / lecet sedikit pun","Body pintu mulus dan tidak penyok","Mekanis buka-tutup normal","Segera perbaiki bila ada lecet sekecil apapun"],
      },
    ],
  },
  {
    kode: "c3", no: "03", nama: "Fasilitas & Furnitur",
    items: [
      {
        kode_task: "c3-1", nama: "Karpet Upper Room", min_foto: 0,
        poin: ["Karpet bersih"],
      },
      {
        kode_task: "c3-2", nama: "Kursi Besi (Teras, Kolam, Balkon)", min_foto: 0,
        poin: ["Cat mulus, tidak terkelupas","Dudukan tidak patah","Segera perbaiki bila cat terlekupas / dudukan rusak"],
      },
      {
        kode_task: "c3-3", nama: "Meja Outdoor (Teras, Kolam & Balkon)", min_foto: 0,
        poin: ["Kaki meja tidak lecet karena air","Segera repaint bila bagian bawah kaki terkelupas"],
      },
      {
        kode_task: "c3-4", nama: "Kursi & Sofa", min_foto: 1,
        poin: ["Bersih, tidak noda / bau","Kokoh & tidak rusak"],
      },
      {
        kode_task: "c3-5", nama: "Meja (dining, bar, GRO)", min_foto: 1,
        poin: ["Bersih","Kokoh, tidak goyang","Permukaan mulus, tidak rusak"],
      },
      {
        kode_task: "c3-6", nama: "Seluruh Sofa & Kursi", min_foto: 3,
        poin: ["Tidak ada sofa / kursi yang patah","Periksa kaki kursi outdoor (besi sering patah)","Segera perbaiki bila ada yang rusak"],
      },
      {
        kode_task: "c3-7", nama: "Seluruh Meja", min_foto: 3,
        poin: ["Tidak ada meja yang patah / tidak layak pakai"],
      },
      {
        kode_task: "c3-8", nama: "DJ Booth", min_foto: 1,
        poin: ["Acrylic meja tidak patah & tidak goyang","Lampu normal","Kabel rapih"],
      },
    ],
  },
  {
    kode: "c4", no: "04", nama: "Taman, Kolam & Landscape",
    items: [
      {
        kode_task: "c4-1", nama: "Tanaman (indoor & outdoor)", min_foto: 0,
        poin: ["Tidak ada tanaman mati / space kosong","Segar tidak layu / kering","Segera request tanaman baru ke vendor bila ada yang mati"],
      },
      {
        kode_task: "c4-2", nama: "Kolam Hias / Air Mancur", min_foto: 0,
        poin: ["Air jernih & tidak kotor","Tidak berlumut"],
      },
      {
        kode_task: "c4-3", nama: "Dahan Pohon Outdoor", min_foto: 2,
        poin: ["Dahan tertata rapi, tidak menjuntai / mengganggu","Tidak ada dahan kering / patah","Lakukan trimming bila ada dahan berlebih"],
      },
    ],
  },
  {
    kode: "E1", no: "01", nama: "Elektrikal & Power",
    items: [
      {
        kode_task: "E1-4", nama: "Genset & ATS", min_foto: 2,
        poin: ["Genset menyala normal","Solar tercukupi","Sekring & fuse normal, tidak putus","Tegangan accu normal","Koneksi ke ATS tersambung normal","Test beban normal"],
      },
      {
        kode_task: "E1-1", nama: "Panel Listrik & MCB (utama + sub panel stage/bar)", min_foto: 3,
        poin: ["Kabel rapih & rapat pada konektor","Tidak ada kenaikan suhu pada kabel & MCB","MCB tidak gosong / loss","Tegangan 1 phase 220V","Tegangan 3 phase 380V"],
      },
    ],
  },
  {
    kode: "E2", no: "02", nama: "Air & Plumbing",
    items: [
      {
        kode_task: "E2-1", nama: "Pompa Air", min_foto: 1,
        poin: ["Tekanan stabil","Tidak bocor & tidak berisik","Debit air normal","Otomatis pelampung normal"],
      },
      {
        kode_task: "E2-3", nama: "Toilet & Wastafel (guest/staff)", min_foto: 1,
        poin: ["Air lancar","Flush normal"],
      },
      {
        kode_task: "E2-4", nama: "Instalasi Air Kotor & Saluran Pembuangan", min_foto: 1,
        poin: ["Air lancar","Tidak mampet"],
      },
      {
        kode_task: "E2-5", nama: "Grease Trap Kitchen", min_foto: 1,
        poin: ["Tidak penuh / meluber","Aliran air lancar"],
      },
      {
        kode_task: "E2-6", nama: "Grease Trap Bar", min_foto: 1,
        poin: ["Tidak penuh / meluber","Aliran air lancar"],
      },
    ],
  },
  {
    kode: "E3", no: "03", nama: "AC, Ventilasi & Sirkulasi Udara",
    items: [
      {
        kode_task: "E3-1p1", nama: "AC Area Dance Floor (4 unit)", min_foto: 4,
        poin: ["Suhu dingin","Tidak kondensasi / menetes"],
      },
      {
        kode_task: "E3-1p2", nama: "AC Depan Bar (2 unit)", min_foto: 2,
        poin: ["Suhu dingin","Tidak kondensasi / menetes"],
      },
      {
        kode_task: "E3-1p3", nama: "AC Area Balkon Lt.2 (2 unit)", min_foto: 2,
        poin: ["Suhu dingin","Tidak kondensasi / menetes"],
      },
      {
        kode_task: "E3-1p4", nama: "AC Area Office (2 unit)", min_foto: 2,
        poin: ["Suhu dingin","Tidak kondensasi / menetes"],
      },
      {
        kode_task: "E3-1p5", nama: "AC Area RICI (1 unit)", min_foto: 0,
        poin: ["Suhu dingin","Tidak kondensasi / menetes"],
      },
      {
        kode_task: "E3-1p6", nama: "AC Area Toilet (2 unit)", min_foto: 2,
        poin: ["Suhu dingin","Tidak kondensasi / menetes"],
      },
      {
        kode_task: "E3-2d", nama: "HEPA Filter Dance Floor", min_foto: 0,
        poin: ["Unit nyala & berfungsi normal","Tidak berbunyi abnormal"],
      },
      {
        kode_task: "E3-4o", nama: "Kipas Angin Area Outdoor", min_foto: 0,
        poin: ["Semua kipas bisa nyala"],
      },
    ],
  },
  {
    kode: "E4", no: "04", nama: "Refrigerasi & Kitchen",
    items: [
      {
        kode_task: "E4-1p1", nama: "Chiller & Freezer Area Bar", min_foto: 3,
        poin: ["Suhu chiller <5°C","Suhu freezer <-15°C"],
      },
      {
        kode_task: "E4-1p2", nama: "Chiller & Freezer Area Kitchen", min_foto: 3,
        poin: ["Suhu chiller <5°C","Suhu freezer <-15°C"],
      },
      {
        kode_task: "E4-1p3", nama: "Chiller & Freezer Area RICI", min_foto: 3,
        poin: ["Suhu chiller <5°C","Suhu freezer <-15°C"],
      },
      {
        kode_task: "E4-2o", nama: "Ice Making Machine (2 unit)", min_foto: 2,
        poin: ["Produksi es stabil","Pasokan air normal","Filter RO bersih"],
      },
      {
        kode_task: "E4-3", nama: "Kompor Gas / Induksi", min_foto: 0,
        poin: ["Api stabil","Tidak ada bau gas","Valve gas rapat"],
      },
      {
        kode_task: "E4-4", nama: "Hood & Exhaust Kitchen", min_foto: 0,
        poin: ["Nyala normal","Daya hisap normal","Lampu hood nyala normal"],
      },
    ],
  },
  {
    kode: "E5", no: "05", nama: "Audio & Special Effect",
    items: [
      {
        kode_task: "E5-1", nama: "Sound System", min_foto: 3,
        poin: ["Suara jernih, tidak feedback","Fungsi normal tidak protect"],
      },
      {
        kode_task: "E5-4", nama: "Smoke / CO₂ Jet Machine (stage & bar)", min_foto: 0,
        poin: ["Tidak ada kebocoran pada valve","Selang & sambungan tidak bocor"],
      },
    ],
  },
  {
    kode: "E6", no: "06", nama: "IT, Jaringan & CCTV",
    items: [
      {
        kode_task: "E6-1s", nama: "PC Server Utama POS (Area Office)", min_foto: 0,
        poin: ["PC server menyala normal","Tidak ada aplikasi selain Quinos","Koneksi Local & Internet baik"],
      },
      {
        kode_task: "E6-3", nama: "Router / Modem Internet", min_foto: 0,
        poin: ["Internet stabil (cek speedtest)","Indikator normal, tidak loss","Jaringan LAN rapih & tidak longgar"],
      },
      {
        kode_task: "E6-4", nama: "CCTV", min_foto: 2,
        poin: ["Kamera aktif","Tidak buram & bergoyang","Status record aktif"],
      },
    ],
  },
  {
    kode: "E7", no: "07", nama: "Safety & Proteksi",
    items: [
      {
        kode_task: "E7-1", nama: "APAR — Tekanan Tabung", min_foto: 0,
        poin: ["Jarum indikator di zona hijau","Segel & pin utuh","Selang & nozzle tidak retak"],
      },
    ],
  },
];

// Jadwal harian per user_id: { 1=senin..5=jumat: { outlet, tasks: [kode_task] } }
// sabtu(6)/minggu(0) = libur
const DC_JADWAL = {
  4: { // GA
    1: { outlet: "BRACI",   tasks: ["c1-1","c2-1","c2-2","c2-3","c3-1","c3-2","c3-3","c4-1","c4-2"] },
    2: { outlet: "OPIUCI",  tasks: ["c1-1","c3-1","c3-2","c3-3","c4-3"] },
    3: { outlet: "TANATAP", tasks: ["c2-4","c3-4","c3-5","c4-1"] },
    4: { outlet: "BRACI",   tasks: ["c1-1","c2-1","c2-2","c2-3","c3-1","c3-2","c3-3","c4-1","c4-2"] },
    5: { outlet: "OPIUCI",  tasks: ["c1-1","c3-6","c3-7","c3-8","c4-3"] },
  },
  3: { // ME — E1-E7 semua hari kerja, semua outlet
    1: { outlet: "BRACI",   tasks: null }, // null = tampil semua item E
    2: { outlet: "OPIUCI",  tasks: null },
    3: { outlet: "TANATAP", tasks: null },
    4: { outlet: "BRACI",   tasks: null },
    5: { outlet: "OPIUCI",  tasks: null },
  },
};

function getScheduleToday(userId, dateStr) {
  const d = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  const day = d.getDay(); // 0=minggu,6=sabtu
  if (day === 0 || day === 6) return { outlet: "LIBUR", tasks: [], libur: true };
  const sched = DC_JADWAL[userId]?.[day];
  if (!sched) return { outlet: "LIBUR", tasks: [], libur: true };
  return { outlet: sched.outlet, tasks: sched.tasks, libur: false };
}

// Filter DC_KATALOG berdasarkan tasks[] — null = tampil semua
function getFilteredKatalog(userId, tasks) {
  const isGA = userId === 4;
  const isME = userId === 3;
  if (isME && tasks === null) {
    // ME: hanya tampil kategori E
    return DC_KATALOG.filter(c => c.kode.startsWith("E"));
  }
  if (isGA && Array.isArray(tasks)) {
    const taskSet = new Set(tasks);
    return DC_KATALOG
      .filter(c => c.kode.startsWith("c"))
      .map(c => ({ ...c, items: c.items.filter(it => taskSet.has(it.kode_task)) }))
      .filter(c => c.items.length > 0);
  }
  return [];
}

function TabDaily({ pic = "" }) {
  const [tim, setTim] = useState("");
  const [gps, setGps] = useState({ status: "loading" });
  const _gpsWatchRef = useRef(null);
  const _gpsHardStopRef = useRef(null);

  // dev mode: 5x tap label tanggal → bisa edit tanggal
  const [devTap, setDevTap] = useState(0);
  const [devMode, setDevMode] = useState(false);
  const [devDate, setDevDate] = useState("");
  function handleDateTap() {
    const next = devTap + 1;
    if (next >= 5) {
      setDevTap(0);
      if (devMode) {
        setDevMode(false);
        setDevDate("");
        alert("Mode developer non-aktif.");
      } else {
        setDevMode(true);
        setDevDate(getToday());
        alert("Mode developer aktif.");
      }
    } else {
      setDevTap(next);
    }
  }
  const activeDate = devMode && devDate ? devDate : getToday();

  // derived from tim selection
  const userId = tim ? Number(tim) : null;
  const schedule = userId ? getScheduleToday(userId, activeDate) : null;
  const outletLabel = schedule ? schedule.outlet : "";
  const filteredKatalog = schedule && !schedule.libur
    ? getFilteredKatalog(userId, schedule.tasks)
    : [];

  const initChecks = () => {
    const m = {};
    DC_KATALOG.forEach(cat => cat.items.forEach(it => {
      m[it.kode_task] = { status: "", note: "", photos: [] };
    }));
    return m;
  };
  const [checks, setChecks] = useState(initChecks);
  const [openCats, setOpenCats] = useState(() => new Set(DC_KATALOG.map(c => c.kode)));

  function setCheck(kode_task, field, val) {
    setChecks(prev => ({ ...prev, [kode_task]: { ...prev[kode_task], [field]: val } }));
  }

  function toggleCat(kode) {
    setOpenCats(prev => {
      const s = new Set(prev);
      s.has(kode) ? s.delete(kode) : s.add(kode);
      return s;
    });
  }

  function handlePhoto(kode_task, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      setChecks(prev => ({
        ...prev,
        [kode_task]: {
          ...prev[kode_task],
          photos: [...prev[kode_task].photos, e.target.result],
        },
      }));
    };
    reader.readAsDataURL(file);
  }

  // derived progress — hanya dari filtered katalog
  const totalItems = filteredKatalog.reduce((s, c) => s + c.items.length, 0);
  const doneItems = filteredKatalog.reduce((s, c) =>
    s + c.items.filter(it => checks[it.kode_task]?.status !== "").length, 0);

  // reverse geocode
  async function reverseGeocode(lat, lon) {
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        { headers: { "Accept-Language": "id" } },
      );
      const d = await r.json();
      return d.display_name || "";
    } catch {
      return "";
    }
  }

  function fetchGps() {
    if (!navigator.geolocation) {
      setGps({ status: "error", message: "GPS tidak tersedia" });
      return;
    }
    setGps({ status: "loading" });
    let bestAcc = Infinity;

    async function commit(lat, lon, acc) {
      const addr = await reverseGeocode(lat, lon);
      setGps({ status: "ok", lat, lon, accuracy: acc, addr });
    }

    _gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon, accuracy } = pos.coords;
        if (accuracy < bestAcc) {
          bestAcc = accuracy;
          commit(lat, lon, accuracy);
        }
        if (accuracy <= 30) {
          navigator.geolocation.clearWatch(_gpsWatchRef.current);
          _gpsWatchRef.current = null;
        }
      },
      (err) => {
        const msg =
          err.code === 1
            ? "Izin lokasi ditolak"
            : err.code === 2
              ? "Sinyal GPS tidak tersedia"
              : "Waktu habis";
        setGps({ status: "error", message: msg });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
    const _stop = setTimeout(() => {
      if (_gpsWatchRef.current != null) {
        navigator.geolocation.clearWatch(_gpsWatchRef.current);
        _gpsWatchRef.current = null;
      }
    }, 10000);
    _gpsHardStopRef.current = _stop;
  }

  useEffect(() => {
    fetchGps();
    return () => {
      if (_gpsHardStopRef.current != null) clearTimeout(_gpsHardStopRef.current);
      if (_gpsWatchRef.current != null)
        navigator.geolocation.clearWatch(_gpsWatchRef.current);
    };
  }, []);

  const gpsOk = gps.status === "ok";
  const gpsBoxCls = gpsOk
    ? "lp-gps-box lp-gps-box--ok"
    : gps.status === "error"
      ? "lp-gps-box lp-gps-box--err"
      : "lp-gps-box lp-gps-box--loading";

  return (
    <div className="lp-daily-wrap">
      <div className="lp-form-card">
        <div className="lp-form-grid">
          <label className="lp-label">
            TYPE
            <select
              value={tim}
              onChange={(e) => setTim(e.target.value)}
              className={`lp-input${!tim ? " lp-input--err" : ""}`}
            >
              <option value="">— Pilih Type —</option>
              {USERS_DAILY.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            {!tim && (
              <span className="lp-field-warn">⚠ Pilih type</span>
            )}
          </label>
          <div>
            <span className="lp-label">OUTLET</span>
            <div className={`lp-input-read${outletLabel === "LIBUR" ? " lp-input-read--libur" : ""}`}>
              {outletLabel || "—"}
            </div>
          </div>
          <div>
            <span className="lp-label" onClick={handleDateTap}>TANGGAL (OTOMATIS)</span>
            {devMode
              ? <input type="date" className="lp-input" value={devDate} onChange={e => setDevDate(e.target.value)} />
              : <div className="lp-input-read">{activeDate}</div>
            }
          </div>
        </div>
        <label className="lp-form-label-mt lp-label">
          NAMA PETUGAS
          <div className="lp-input-read">{pic || "—"}</div>
        </label>
        <div className={gpsBoxCls}>
          <div className="lp-gps-top">
            <div className="lp-gps-ic">
              {gpsOk ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : gps.status === "error" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                </svg>
              )}
            </div>
            <div>
              <div className="lp-gps-ttl">Lokasi GPS</div>
              <div className="lp-gps-st">
                {gpsOk
                  ? `Terdeteksi · akurasi ±${Math.round(gps.accuracy)} m`
                  : gps.status === "error"
                    ? gps.message
                    : "Mendeteksi lokasi..."}
              </div>
            </div>
          </div>
          {gpsOk && (
            <div className="lp-coord">
              <div>
                <span className="lp-coord-k">LAT</span>{"  "}{gps.lat?.toFixed(6)}{"  "}
                <span className="lp-coord-k">LON</span>{"  "}{gps.lon?.toFixed(6)}
              </div>
              {gps.addr && <div className="lp-coord-addr">{gps.addr}</div>}
            </div>
          )}
        </div>
      </div>
      {/* progress bar */}
      <div className="lp-progress-wrap">
        <div className="lp-progress-row">
          <span className="lp-progress-label">Progress</span>
          <span className="lp-progress-count">{doneItems}/{totalItems}</span>
        </div>
        <div className="lp-progress-bar">
          <div className="lp-progress-fill" style={{ width: totalItems ? `${(doneItems / totalItems) * 100}%` : "0%" }} />
        </div>
      </div>

      {/* checklist accordion */}
      {!tim && (
        <div className="dc-empty">Pilih TYPE untuk memuat checklist.</div>
      )}
      {tim && schedule?.libur && (
        <div className="dc-empty">🌴 Hari ini libur. Tidak ada jadwal.</div>
      )}
      {filteredKatalog.map(cat => {
        const catDone = cat.items.filter(it => checks[it.kode_task]?.status !== "").length;
        const isOpen = openCats.has(cat.kode);
        return (
          <div key={cat.kode} className="dc-cat-group">
            <button className="dc-acc" onClick={() => toggleCat(cat.kode)}>
              <span className="dc-acc-no">{cat.no}</span>
              <span className="dc-acc-ttl">{cat.nama}</span>
              <span className="dc-acc-cnt">{catDone}/{cat.items.length}</span>
              <span className={`dc-acc-chev${isOpen ? " dc-acc-chev--open" : ""}`}>▾</span>
            </button>

            {isOpen && (
              <div className="dc-items">
                {cat.items.map(item => {
                  const ck = checks[item.kode_task] || { status: "", note: "", photos: [] };
                  const stCls = ck.status === "Normal" ? " dc-item--ok"
                    : ck.status === "Bermasalah" ? " dc-item--issue"
                    : ck.status === "Dalam Proses" ? " dc-item--process"
                    : "";
                  return (
                    <div key={item.kode_task} className={`dc-item${stCls}`}>
                      {/* left accent bar rendered via CSS ::before on modifier classes */}
                      <div className="dc-item-head">
                        <span className="dc-item-kode">{item.kode_task}</span>
                        <div className="dc-item-mid">
                          <div className="dc-item-nama">{item.nama}</div>
                          {item.min_foto > 0 && (
                            <div className="dc-item-tags">
                              <span className="dc-tag-foto">MIN. {item.min_foto} FOTO</span>
                            </div>
                          )}
                        </div>
                        <span className={`dc-item-dot${ck.status === "Normal" ? " dc-item-dot--ok" : ck.status ? " dc-item-dot--active" : ""}`} />
                      </div>

                      <ul className="dc-poin-list">
                        {item.poin.map((p, i) => (
                          <li key={i} className="dc-poin-item">{p}</li>
                        ))}
                      </ul>

                      <div className="dc-seg">
                        {DC_STATUSES.map(s => (
                          <button
                            key={s}
                            className={`dc-seg-btn${ck.status === s ? " dc-seg-btn--on" : ""}`}
                            onClick={() => setCheck(item.kode_task, "status", ck.status === s ? "" : s)}
                          >
                            <span className="dc-seg-ic" />
                            {s}
                          </button>
                        ))}
                      </div>

                      {item.min_foto > 0 && (
                        <div className="dc-photo-wrap">
                          <div className="dc-photo-row">
                            <span className="dc-photo-label">Foto bukti (kamera)</span>
                            <span className={`dc-photo-count${ck.photos.length < item.min_foto ? " dc-photo-count--warn" : " dc-photo-count--ok"}`}>
                              {ck.photos.length} foto
                            </span>
                          </div>
                          <div className="dc-photo-btn-wrap">
                            <div className="dc-photo-btn">
                              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
                                <circle cx="12" cy="13" r="3.2" />
                              </svg>
                              Ambil Foto (Kamera)
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="dc-photo-input"
                              onChange={e => handlePhoto(item.kode_task, e.target.files?.[0])}
                            />
                          </div>
                          {ck.photos.length > 0 && (
                            <div className="dc-photo-thumbs">
                              {ck.photos.map((src, i) => (
                                <img key={i} src={src} className="dc-photo-thumb" alt={`foto-${i + 1}`} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <textarea
                        rows={1}
                        placeholder="Catatan (opsional)…"
                        className="dc-note"
                        value={ck.note}
                        onChange={e => setCheck(item.kode_task, "note", e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── tab tugas rutin ── */
function TabRutin() {
  return (
    <div className="lp-rutin-wrap">
      <Sec>Jadwal Daily Check</Sec>
      <DarkBox>
        <div className="lp-rotasi-label">ROTASI OUTLET</div>
        <div className="lp-rotasi-list">
          {ROTASI.map((r) => (
            <div key={r.outlet} className="lp-rotasi-row">
              <Pill className="pill-pink">{r.outlet}</Pill>
              <span className="lp-rotasi-days">{r.days}</span>
            </div>
          ))}
          <div className="lp-rotasi-footer">
            Sabtu &amp; Minggu — libur rotasi
          </div>
        </div>
      </DarkBox>

      <Sec>Jadwal Tasking Rutin</Sec>
      <div className="lp-card lp-mb14">
        <div className="lp-harian-header">
          <span className="lp-harian-title">Setiap Hari</span>
          <span className="lp-harian-outlet">OPIUCI</span>
        </div>
        {HARIAN.map((t) => (
          <div key={t.id} className="lp-harian-row">
            <span className="lp-item-name">{t.name}</span>
            <span className="lp-jadwal-task-outlet">{t.outlet}</span>
          </div>
        ))}
      </div>

      {PER_HARI.map((g) => (
        <div key={g.hari} className="lp-hari-group">
          <div className="lp-hari-header-row">
            <Sec>{g.hari}</Sec>
            <span className="lp-hari-count">{g.tasks.length} tugas</span>
          </div>
          <div className="lp-card">
            {g.tasks.map((t, i) => (
              <div
                key={i}
                className={`lp-hari-task-row${i === 0 ? " first" : ""}`}
              >
                <span className="lp-task-name">{t.name}</span>
                <div className="lp-task-tags">
                  <Pill className="pill-pink-light">{t.outlet}</Pill>
                  <FTag label={t.freq} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Sec>Vendor</Sec>
      <div className="lp-card">
        {VENDOR.map((v, i) => (
          <div key={i} className={`lp-vendor-row${i === 0 ? " first" : ""}`}>
            <span className="lp-item-name">{v.name}</span>
            <FTag label={v.freq} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── tab perbaikan ── */
function TabPerbaikan({ outlet, setOutlet, tim, setTim, pic = "" }) {
  const [gps, setGps] = useState({
    lat: null,
    lon: null,
    acc: null,
    addr: null,
    status: "loading",
  });
  const [retryLoad, setRetryLoad] = useState(false);
  const [tiket, setTiket] = useState([]);
  const [tiketLoading, setTiketLoading] = useState(true);
  const scrollToIdRef = useRef(null);

  // scroll ke card setelah tiket list re-render
  useEffect(() => {
    if (!scrollToIdRef.current) return;
    const id = scrollToIdRef.current;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.querySelector(`[data-tiket-id="${id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        scrollToIdRef.current = null;
      }
      // card tidak di DOM → tiket pindah page, tunggu findAndGoToTiket selesai
    }));
  }, [tiket]);

  // pic sendiri sedang ada tugas aktif → lock outlet/tim/nama
  const myActiveTask = tiket.some(
    (x) => x.status === "sedang_dikerjakan" && x.nama_petugas === pic,
  );
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotal] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const LIMIT = 10;
  const [detailData, setDetailData] = useState(null);
  const [lbSrc, setLbSrc] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // cari tiket by ID lintas page, set page saat ketemu
  const findAndGoToTiket = useCallback(async (id) => {
    scrollToIdRef.current = id;
    for (let p = 1; p <= totalPages; p++) {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (outlet) params.append('outlet_id', OUTLET_IDS[outlet] || '');
      if (tim) params.append('user_id', tim);
      try {
        const r = await fetch(`/php-api/laporan/list?${params}`);
        const d = await r.json();
        const found = (d.data || []).find((x) => x.id === id);
        if (found) {
          setPage(p);
          setTiket(d.data || []);
          setTotal(d.pagination?.pages || d.total_pages || 1);
          setTotalCount(d.pagination?.total || d.total || 0);
          return;
        }
      } catch { break; }
    }
    scrollToIdRef.current = null;
  }, [outlet, tim, totalPages]);

  async function openDetail(id) {
    setDetailData(null);
    setDetailLoading(true);
    try {
      const r = await fetch(`/php-api/laporan/detail?id=${id}`);
      const d = await r.json();
      if (d.ok) setDetailData(d);
      else alert("Gagal load detail: " + (d.message || "error"));
    } catch {
      alert("Gagal load detail");
    } finally {
      setDetailLoading(false);
    }
  }

  const _gpsWatchRef = useRef(null);
  const _gpsHardStopRef = useRef(null);

  function fetchGps() {
    if (!navigator.geolocation) {
      setGps((p) => ({ ...p, status: "error", message: "GPS tidak didukung" }));
      return;
    }
    if (_gpsWatchRef.current != null)
      navigator.geolocation.clearWatch(_gpsWatchRef.current);

    let bestAcc = Infinity;
    const commit = (lat, lon, accuracy) => {
      setGps({ lat, lon, acc: Math.round(accuracy), addr: null, status: "ok" });
      setRetryLoad(false);
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat=${lat}&lon=${lon}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "MatoaInternal/1.0",
          },
        },
      )
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => {
          if (d?.display_name) setGps((p) => ({ ...p, addr: d.display_name }));
        })
        .catch(() => {});
    };

    _gpsWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon, accuracy } = pos.coords;
        if (accuracy < bestAcc) {
          bestAcc = accuracy;
          commit(lat, lon, accuracy);
        }
        // stop watching once accuracy ≤ 30 m or after 10 s (timeout below)
        if (accuracy <= 30) {
          navigator.geolocation.clearWatch(_gpsWatchRef.current);
          _gpsWatchRef.current = null;
        }
      },
      (err) => {
        const msg =
          err.code === 1
            ? "Izin lokasi ditolak"
            : err.code === 2
              ? "Sinyal GPS tidak tersedia"
              : "Waktu habis";
        setGps((p) => ({ ...p, status: "error", message: msg }));
        setRetryLoad(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    // hard stop after 10 s regardless of accuracy
    const _gpsHardStop = setTimeout(() => {
      if (_gpsWatchRef.current != null) {
        navigator.geolocation.clearWatch(_gpsWatchRef.current);
        _gpsWatchRef.current = null;
      }
    }, 10000);
    // store so useEffect cleanup can cancel if GPS resolves early
    _gpsHardStopRef.current = _gpsHardStop;
  }

  useEffect(() => {
    fetchGps();
    return () => {
      if (_gpsHardStopRef.current != null) clearTimeout(_gpsHardStopRef.current);
      if (_gpsWatchRef.current != null)
        navigator.geolocation.clearWatch(_gpsWatchRef.current);
    };
  }, []);

  async function fetchTiket(
    reset = false,
    pg = page,
    fOutlet = outlet,
    fUser = tim,
    silent = false,
  ) {
    const p = reset ? 1 : pg;
    if (reset) setPage(1);
    if (!silent) setTiketLoading(true);
    const params = new URLSearchParams({ page: p, limit: LIMIT });
    if (fOutlet) params.append("outlet_id", OUTLET_IDS[fOutlet] || "");
    if (fUser) params.append("user_id", fUser);
    try {
      const r = await fetch(`/php-api/laporan/list?${params}`);
      const d = await r.json();
      setTiket(d.data || []);
      setTotal(d.pagination?.pages || d.total_pages || 1);
      setTotalCount(d.pagination?.total || d.total || 0);
    } catch {
      // silent fail on polling; non-silent shows stale data
    } finally {
      if (!silent) setTiketLoading(false);
    }
  }

  useEffect(() => {
    if (outlet && tim && pic.trim() && gps.status === "ok")
      fetchTiket(true, 1, outlet, tim);
  }, [outlet, tim, pic, gps.status]);

  // Realtime polling setiap 5 detik — hanya kalau syarat terpenuhi
  useEffect(() => {
    if (!outlet || !tim || !pic.trim() || gps.status !== "ok") return;
    const id = setInterval(() => {
      fetchTiket(false, page, outlet, tim, true);
      fetch("/php-api/sla/tick", { method: "POST" }).catch(() => {});
      fetch("/php-api/petugas/list").then(r => r.json()).then(d => setPetugasList(Array.isArray(d) ? d : [])).catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [page, outlet, tim, pic, gps.status]);

  // Heartbeat — update last_seen tiap 5 menit selama pic aktif
  useEffect(() => {
    if (!pic.trim()) return;
    const id = setInterval(() => {
      fetch("/php-api/petugas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: pic }),
      }).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [pic]);

  // Expire check — tiap 1 menit, kalau server bilang expired → clear sesi
  useEffect(() => {
    if (!pic.trim()) return;
    const id = setInterval(async () => {
      try {
        const r = await fetch(`/php-api/petugas?nama=${encodeURIComponent(pic)}`);
        const d = await r.json();
        if (!d.is_active) {
          // sesi expired atau di-logout dari tempat lain
          localStorage.removeItem("lp_pic");
          setPic("");
          setPicInput("");
        }
      } catch { /* network error — biarkan, coba lagi 1 menit */ }
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [pic]);

  return (
    <>
      <div className="lp-perbaikan-wrap">
        <div className="lp-form-wrap">
          <div className="lp-form-card">
            <div className="lp-form-grid">
              <label className="lp-label">
                OUTLET
                <select
                  value={outlet}
                  disabled={myActiveTask}
                  onChange={(e) => {
                    setOutlet(e.target.value);
                    if (e.target.value) {
                      setToast(`✓ Outlet: ${e.target.value}`);
                      setTimeout(() => setToast(null), 2500);
                    }
                  }}
                  className={`lp-input${!outlet ? " lp-input--err" : ""}`}
                >
                  <option value="">— Pilih Outlet —</option>
                  {["BRACI", "OPIUCI", "TANATAP"].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                {!outlet && (
                  <span className="lp-field-warn">⚠ Pilih outlet</span>
                )}
              </label>
              <label className="lp-label">
                TYPE
                <select
                  value={tim}
                  disabled={myActiveTask}
                  onChange={(e) => {
                    setTim(e.target.value);
                    if (e.target.value) {
                      const label = e.target.value === "3" ? "ME" : "GA";
                      setToast(`✓ Type: ${label}`);
                      setTimeout(() => setToast(null), 2500);
                    }
                  }}
                  className={`lp-input${outlet && !tim ? " lp-input--err" : ""}`}
                >
                  <option value="">— Pilih Type —</option>
                  <option value="3">ME</option>
                  <option value="4">GA</option>
                </select>
                {outlet && !tim && (
                  <span className="lp-field-warn">⚠ Pilih type</span>
                )}
              </label>
              <div>
                <span className="lp-label">TANGGAL (OTOMATIS)</span>
                <div className="lp-input-read">{getToday()}</div>
              </div>
            </div>
            <label className="lp-form-label-mt lp-label">
              NAMA PETUGAS
              <div className="lp-input-read">{pic}</div>
            </label>
            <div
              className={`lp-gps-box${gps.status === "ok" ? " lp-gps-box--ok" : gps.status === "error" ? " lp-gps-box--err" : ""}`}
            >
              <div className="lp-gps-top">
                <div className="lp-gps-ic">
                  {gps.status === "ok" ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : gps.status === "error" ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 21s-7-5.7-7-11a7 7 0 0114 0c0 5.3-7 11-7 11z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="lp-gps-ttl">Lokasi GPS</div>
                  <div className="lp-gps-st">
                    {gps.status === "loading"
                      ? "Meminta izin lokasi…"
                      : gps.status === "ok"
                        ? `Terdeteksi · akurasi ±${gps.acc} m`
                        : gps.status === "error"
                          ? gps.message || "Gagal dapat lokasi"
                          : "Meminta izin lokasi…"}
                  </div>
                </div>
              </div>
              {gps.status === "ok" && gps.lat && (
                <div className="lp-coord">
                  <div>
                    <span className="lp-coord-k">LAT</span>
                    {"  "}
                    {gps.lat.toFixed(6)}
                    {"  "}
                    <span className="lp-coord-k">LON</span>
                    {"  "}
                    {gps.lon.toFixed(6)}
                  </div>
                  {gps.addr && <div className="lp-coord-addr">{gps.addr}</div>}
                </div>
              )}
              {gps.status === "error" && (
                <button
                  className="lp-gps-retry"
                  onClick={() => {
                    setRetryLoad(true);
                    fetchGps();
                  }}
                  disabled={retryLoad}
                >
                  {retryLoad ? "Mengambil ulang…" : "↻ Coba Ambil Lokasi Lagi"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* tiket list — hanya muncul kalau outlet + type + pic + gps sudah siap */}
        {outlet && tim && pic.trim().length >= 3 && gps.status === "ok" ? (
          <div className="lp-kendala-wrap">
            <div className="lp-kendala-card">
              <div className="lp-kendala-title">INSTRUKSI PEKERJAAN</div>
              <div className="lp-kendala-sub">
                · Pastikan nama petugas benar dan tidak boleh sama dengan
                petugas lain.
                <br />
                · Kerjakan kendala dari paling atas.
                <br />
                · Dahulukan outlet BRACI lalu OPIUCI.
                <br />
                · 1 Device hanya bisa mengerjakan 1 Pekerjaan.
                <br />
                · "Selesaikan" atau "Batalkan" pekerjaan jika ingin mengerjakan
                pekerjaan lainnya.
                <br />
                <span className="lp-kendala-sub-note">
                  * Tugas sudah otomatis diurutkan oleh sistem
                </span>
              </div>
            </div>
            {toast && <div className="lp-toast">{toast}</div>}
            {tiketLoading ? (
              <div className="lp-loading">Memuat…</div>
            ) : tiket.length === 0 ? (
              <div className="lp-empty">
                <div>Ikuti instruksi</div>
                <div>Data akan muncul otomatis</div>
              </div>
            ) : (
              <div className="lp-tk-list">
                {tiket.map((t) => {
                  // siapapun yg sedang dikerjakan → semua tiket lain disable
                  const activePic =
                    (tiket.find((x) => x.status === "sedang_dikerjakan") || {})
                      .nama_petugas || null;
                  const lockedByOther =
                    activePic && activePic !== pic && t.status !== "sedang_dikerjakan";
                  return (
                    <TiketItem
                      key={t.id}
                      t={t}
                      pic={pic}
                      gps={gps}
                      activePic={activePic}
                      lockedByOther={!!lockedByOther}
                      onDetail={(id) => openDetail(id)}
                      onCopy={(id) => {
                        setToast(`✓ Tersalin: ${id}`);
                        setTimeout(() => setToast(null), 2500);
                      }}
                      onRefresh={(msg) => {
                        if (msg) {
                          setToast(msg);
                          setTimeout(() => setToast(null), 3000);
                        }
                        fetchTiket(false, page, outlet, tim, true);
                      }}
                      onScrollTo={(id) => { findAndGoToTiket(id); }}
                    />
                  );
                })}
              </div>
            )}
            {totalPages > 1 && (
              <div className="lp-pagination">
                <button
                  className="lp-pg-btn"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((p) => p - 1);
                    fetchTiket(false, page - 1, outlet, tim);
                  }}
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                  )
                  .map((p, i, arr) => (
                    <span key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="lp-pg-dot">…</span>
                      )}
                      <button
                        className={`lp-pg-btn${p === page ? " lp-pg-active" : ""}`}
                        onClick={() => {
                          setPage(p);
                          fetchTiket(false, p, outlet, tim);
                        }}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  className="lp-pg-btn"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((p) => p + 1);
                    fetchTiket(false, page + 1, outlet, tim);
                  }}
                >
                  Next →
                </button>
              </div>
            )}
            {totalCount > 0 &&
              (() => {
                const tungguCount = tiket.filter((t) =>
                  ["tunggu_barang", "barang_diproses", "barang_ready"].includes(
                    t.status,
                  ),
                ).length;
                const aktifCount = tiket.filter(
                  (t) =>
                    !["selesai_dikerjakan", "terverifikasi"].includes(t.status),
                ).length;
                return (
                  <div className="lp-sticky-bar">
                    <div className="lp-sticky-summary">
                      <span className="lp-sticky-total">
                        {aktifCount} Tugas Tersedia
                      </span>
                      {tungguCount > 0 && (
                        <span className="lp-sticky-tunggu">
                          {" "}
                          · {tungguCount} menunggu barang
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
          </div>
        ) : (
          <div className="lp-empty">
            <div>Ikuti instruksi</div>
            <div>Data akan muncul otomatis</div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {(detailLoading || detailData) && (
        <div className="lp-modal-overlay" onClick={() => setDetailData(null)}>
          <div className="lp-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              className="lp-modal-close"
              onClick={() => setDetailData(null)}
            >
              ✕
            </button>
            {detailLoading && <div className="lp-loading">Memuat…</div>}
            {detailData &&
              (() => {
                const lp = detailData.laporan;
                if (!lp) return <div className="lp-loading">Data tidak tersedia</div>;
                const items = detailData.kendala || [];
                return (
                  <>
                    <div className="lp-modal-title">{lp.tiket_id}</div>
                    <div className="lp-modal-rows">
                      {[
                        ["Outlet", lp.outlet_nama || lp.outlet_kode || "—"],
                        ["Status", STATUS_LABELS[lp.status] || lp.status || "—"],
                        ["Level", lp.level || "—"],
                        ["Created", fmtDatetime(lp.created_at)],
                        [
                          "Deadline",
                          lp.status === "tunggu_barang" ||
                          lp.status === "barang_diproses"
                            ? "Ditahan"
                            : lp.deadline_date
                              ? fmtDatetime(lp.deadline_date)
                              : "—",
                        ],
                        ["Alamat", lp.address || "—"],
                      ].map(([k, v]) => (
                        <div key={k} className="lp-modal-row">
                          <span className="lp-modal-key">{k}</span>
                          <span className="lp-modal-val">{v}</span>
                        </div>
                      ))}
                    </div>
                    {items.length > 0 && (
                      <div className="lp-modal-kendala">
                        <div className="lp-modal-sec">KENDALA</div>
                        {items.map((it, i) => (
                          <div key={i} className="lp-modal-barang-item">
                            {it.foto_url && (
                              <img
                                src={fotoSrc(it.foto_url)}
                                alt={it.keterangan}
                                className="lp-modal-foto-full lp-foto-clickable"
                                onClick={() => setLbSrc(it.foto_url)}
                              />
                            )}
                            <div className="lp-modal-kendala-row">
                              · {it.keterangan || "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {(lp.foto_before || lp.foto_after) && (
                      <div className="lp-modal-kendala lp-modal-foto-wrap">
                        <div className="lp-modal-sec">FOTO PERBAIKAN</div>
                        <div className="lp-modal-foto-row">
                          {lp.foto_before && (
                            <img
                              src={fotoSrc(lp.foto_before)}
                              alt="Before"
                              className="lp-modal-foto-half lp-foto-clickable"
                              onClick={() => setLbSrc(fotoSrc(lp.foto_before))}
                            />
                          )}
                          {lp.foto_after && (
                            <img
                              src={fotoSrc(lp.foto_after)}
                              alt="After"
                              className="lp-modal-foto-half lp-foto-clickable"
                              onClick={() => setLbSrc(fotoSrc(lp.foto_after))}
                            />
                          )}
                        </div>
                      </div>
                    )}
                    {detailData.barang_items?.length > 0 && (
                      <div className="lp-modal-kendala lp-modal-foto-wrap">
                        <div className="lp-modal-sec">FOTO BARANG</div>
                        {detailData.barang_items.map((b, i) => (
                          <div key={i} className="lp-modal-barang-item">
                            {b.foto_barang_url && (
                              <img
                                src={fotoSrc(b.foto_barang_url)}
                                alt={b.detail_barang}
                                className="lp-modal-foto-full lp-foto-clickable"
                                onClick={() => setLbSrc(b.foto_barang_url)}
                              />
                            )}
                            {b.detail_barang && (
                              <div className="lp-modal-kendala-row">
                                {b.detail_barang}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
          </div>
        </div>
      )}
      {lbSrc && <PhotoViewer src={lbSrc} onClose={() => setLbSrc(null)} />}
    </>
  );
}

/* ── tab jadwal ── */
function TabJadwal() {
  return (
    <div className="lp-jadwal-wrap">
      <div className="lp-jadwal-inner">
        {/* rotasi */}
        <div className="lp-darkbox">
          <div className="lp-jadwal-rotasi-label">JADWAL DAILY CHECK</div>
          <div className="lp-rotasi-list">
            {ROTASI.map((r) => (
              <div key={r.outlet} className="lp-rotasi-row">
                <Pill className="pill-pink">{r.outlet}</Pill>
                <span className="lp-jadwal-rotasi-days">{r.days}</span>
              </div>
            ))}
            <div className="lp-jadwal-rotasi-footer">
              Sabtu &amp; Minggu — libur rotasi
            </div>
          </div>
        </div>

        <div className="lp-jadwal-sec">JADWAL TASKING RUTIN</div>

        {/* harian */}
        <div className="lp-jadwal-card">
          <div className="lp-jadwal-harian-header">
            <span className="lp-jadwal-harian-title">Setiap Hari</span>
            <span className="lp-jadwal-harian-outlet">OPIUCI</span>
          </div>
          {HARIAN.map((t) => (
            <div key={t.id} className="lp-jadwal-harian-row">
              <span className="lp-jadwal-task-name">{t.name}</span>
              <span className="lp-jadwal-task-outlet">{t.outlet}</span>
            </div>
          ))}
        </div>

        {/* per hari */}
        <div className="lp-jadwal-card">
          {PER_HARI.map((g) => (
            <div key={g.hari}>
              <div className="lp-jadwal-perhari-day-header">
                <span className="lp-jadwal-perhari-day">{g.hari}</span>
                <span className="lp-jadwal-perhari-count">
                  {g.tasks.length} tugas
                </span>
              </div>
              {g.tasks.map((t, i) => (
                <div key={i} className="lp-jadwal-perhari-row">
                  <span className="lp-jadwal-task-name">{t.name}</span>
                  <span className="lp-jadwal-task-outlet">{t.outlet}</span>
                  <span className="lp-jadwal-freq">{t.freq}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="lp-jadwal-sec">DIKERJAKAN VENDOR</div>

        {/* vendor */}
        <div className="lp-jadwal-vendor-card">
          {VENDOR.map((v, i) => (
            <div key={i} className="lp-jadwal-vendor-row">
              <span className="lp-jadwal-task-name">{v.name}</span>
              <span className="lp-jadwal-vendor-outlet">{v.outlet}</span>
              <span className="lp-jadwal-vendor-freq">{v.freq}</span>
            </div>
          ))}
        </div>

        <div className="lp-spacer" />
      </div>
    </div>
  );
}

/* ── root ── */
const TABS = [
  { id: "daily", label: "Daily Check" },
  { id: "rutin", label: "Tugas Rutin" },
  { id: "perbaikan", label: "Perbaikan" },
  { id: "jadwal", label: "Jadwal" },
];

export default function LaporanPerbaikan() {
  const [tab, setTab] = useState("daily");
  const [outlet, setOutlet] = useState("");
  const [tim, setTim] = useState("");
  const [pic, setPic] = useState(() => localStorage.getItem("lp_pic") || "");
  const [picInput, setPicInput] = useState("");
  const [picError, setPicError] = useState("");
  const [petugasList, setPetugasList] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch daftar petugas saat popup muncul
  useEffect(() => {
    if (pic) return;
    fetch("/php-api/petugas/list").then(r => r.json()).then(d => setPetugasList(Array.isArray(d) ? d : [])).catch(() => {});
  }, [pic]);

  const picSuggestions = picInput.trim().length >= 1 && showDropdown
    ? petugasList.filter(p => p.nama.toLowerCase().includes(picInput.trim().toLowerCase()))
    : [];

  async function handleMasuk() {
    const v = picInput.trim();
    if (v.length < 3) return;
    // cek apakah nama sedang aktif di DB
    try {
      const r = await fetch(`/php-api/petugas?nama=${encodeURIComponent(v)}`);
      const d = await r.json();
      if (d.is_active) {
        setPicError("Nama petugas sedang aktif, masukkan nama yang berbeda.");
        return;
      }
    } catch { /* network error — lanjut saja */ }
    // tandai aktif
    await fetch("/php-api/petugas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nama: v }) }).catch(() => {});
    setPicError("");
    localStorage.setItem("lp_pic", v);
    setPic(v);
    setLoginToast(v);
    setTimeout(() => setLoginToast(""), 3000);
  }
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loginToast, setLoginToast] = useState("");

  async function handleLogout() {
    try { await fetch("/php-api/petugas", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nama: pic }) }); } catch(e) {}
    localStorage.removeItem("lp_pic");
    setPic("");
    setPicInput("");
  }

  return (
    <div className="lp-root">
      <div className="lp-frame">
        {loginToast && (
          <div className="lp-login-toast">
            <span className="lp-login-toast-icon">✓</span>
            <span className="lp-login-toast-title">Berhasil Masuk</span>
            <span className="lp-login-toast-name">Nama Petugas : {loginToast}</span>
          </div>
        )}
        {/* modal login */}
        {!pic && (
          <div className="lp-login-overlay">
            <div className="lp-login-card">
              <img src={logo} alt="Matoa Group" className="lp-login-logo" />
              <div className="lp-login-sub">
                Masukkan nama petugas sebelum melanjutkan.
              </div>
              <div className="lp-login-input-wrap">
                <input
                  className="lp-login-input"
                  value={picInput}
                  onChange={(e) => { setPicInput(e.target.value); setPicError(""); setShowDropdown(true); }}
                  onKeyDown={(e) => e.key === "Enter" && handleMasuk()}
                  placeholder="Tulis nama petugas…"
                  autoFocus
                  autoComplete="off"
                />
                <button
                  className="lp-login-btn"
                  disabled={picInput.trim().length < 3}
                  onClick={handleMasuk}
                >
                  Masuk
                </button>
                {picSuggestions.length > 0 && (
                  <ul className="lp-login-dropdown">
                    {picSuggestions.map(p => (
                      <li
                        key={p.nama}
                        className={"lp-login-dropdown-item" + (p.is_active ? " lp-login-dropdown-item--disabled" : "")}
                        onClick={() => {
                          if (p.is_active) return;
                          setPicInput(p.nama);
                          setPicError("");
                          setShowDropdown(false);
                        }}
                      >
                        {p.nama}
                        {p.is_active && <span className="lp-login-dropdown-badge">Sedang Aktif</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {picInput.trim().length > 0 && picInput.trim().length < 3 && (
                <span className="lp-field-warn">⚠ Min 3 huruf</span>
              )}
              {picError && (
                <span className="lp-field-warn">⚠ {picError}</span>
              )}
              <p className="lp-login-note">*Nama petugas tidak boleh sama<br/>*Pilih nama petugas jika sudah tersedia<br/>*Tulis nama petugas jika belum tersedia</p>
            </div>
          </div>
        )}

        {/* modal konfirmasi logout */}
        {showLogoutConfirm && (
          <div className="lp-login-overlay">
            <div className="lp-confirm-card">
              <div className="lp-confirm-title">Apakah kamu ingin logout?</div>
              <div className="lp-confirm-actions">
                <button
                  className="lp-confirm-no"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Tidak
                </button>
                <button
                  className="lp-confirm-yes"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    handleLogout();
                  }}
                >
                  Ya
                </button>
              </div>
            </div>
          </div>
        )}

        {/* header sticky */}
        <div className="lp-header">
          <div className="lp-header-top">
            <img src={logo} alt="Matoa Group" className="lp-logo" />
            <div className="lp-header-info">
              <div className="lp-header-title">Operating System</div>
              <div className="lp-header-sub">Maintenance &amp; Facility</div>
            </div>
            {pic && (
              <div className="lp-header-user">
                <button
                  className="lp-logout-btn"
                  onClick={() => setShowLogoutConfirm(true)}
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
          <div className="lp-tabbar">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`lp-tab${tab === t.id ? " active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {tab === "daily" && <TabDaily pic={pic} />}
        {tab === "rutin" && <TabRutin />}
        {tab === "perbaikan" && (
          <TabPerbaikan
            outlet={outlet}
            setOutlet={setOutlet}
            tim={tim}
            setTim={setTim}
            pic={pic}
          />
        )}
        {tab === "jadwal" && <TabJadwal />}
      </div>
      <footer className="lp-footer">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="25"
          viewBox="0 0 24 25"
          fill="none"
        >
          <path
            d="M10.08 11.36C10.13 11.03 10.24 10.74 10.38 10.49C10.52 10.24 10.72 10.03 10.97 9.87C11.21 9.72 11.51 9.65 11.88 9.64C12.11 9.65 12.32 9.69 12.51 9.77C12.71 9.86 12.89 9.98 13.03 10.13C13.17 10.28 13.28 10.46 13.37 10.66C13.46 10.86 13.5 11.08 13.51 11.3H15.3C15.28 10.83 15.19 10.4 15.02 10.01C14.85 9.62 14.62 9.28 14.32 9C14.02 8.72 13.66 8.5 13.24 8.34C12.82 8.18 12.36 8.11 11.85 8.11C11.2 8.11 10.63 8.22 10.15 8.45C9.67 8.68 9.27 8.98 8.95 9.37C8.63 9.76 8.39 10.21 8.24 10.73C8.09 11.25 8 11.79 8 12.37V12.64C8 13.22 8.08 13.76 8.23 14.28C8.38 14.8 8.62 15.25 8.94 15.63C9.26 16.01 9.66 16.32 10.14 16.54C10.62 16.76 11.19 16.88 11.84 16.88C12.31 16.88 12.75 16.8 13.16 16.65C13.57 16.5 13.93 16.29 14.24 16.02C14.55 15.75 14.8 15.44 14.98 15.08C15.16 14.72 15.27 14.34 15.28 13.93H13.49C13.48 14.14 13.43 14.33 13.34 14.51C13.25 14.69 13.13 14.84 12.98 14.97C12.83 15.1 12.66 15.2 12.46 15.27C12.27 15.34 12.07 15.36 11.86 15.37C11.5 15.36 11.2 15.29 10.97 15.14C10.72 14.98 10.52 14.77 10.38 14.52C10.24 14.27 10.13 13.97 10.08 13.64C10.03 13.31 10 12.97 10 12.64V12.37C10 12.02 10.03 11.69 10.08 11.36ZM12 2.5C6.48 2.5 2 6.98 2 12.5C2 18.02 6.48 22.5 12 22.5C17.52 22.5 22 18.02 22 12.5C22 6.98 17.52 2.5 12 2.5ZM12 20.5C7.59 20.5 4 16.91 4 12.5C4 8.09 7.59 4.5 12 4.5C16.41 4.5 20 8.09 20 12.5C20 16.91 16.41 20.5 12 20.5Z"
            fill="white"
          />
        </svg>
        <span>Matoa Group</span>
      </footer>
    </div>
  );
}
