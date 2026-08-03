'use client';
import s from './page.module.css';

export default function PageOutlet() {
  return (
    <div className={s.wrap}>
      <div className={s.eyebrow}>
        <span className={s.n}>—</span> Outlet
      </div>
      <div style={{ color: 'var(--grey)', padding: '48px 0', textAlign: 'center', fontSize: 14 }}>
        Halaman Outlet — segera hadir.
      </div>
    </div>
  );
}
