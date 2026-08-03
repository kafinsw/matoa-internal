'use client';
import s from './page.module.css';

export default function PageUser({ sub }) {
  return (
    <div className={s.wrap}>
      <div className={s.eyebrow}>
        <span className={s.n}>—</span> {sub === 'user-list' ? 'List User' : 'List Petugas'}
      </div>
      <div style={{ color: 'var(--grey)', padding: '48px 0', textAlign: 'center', fontSize: 14 }}>
        Halaman {sub === 'user-list' ? 'List User' : 'List Petugas'} — segera hadir.
      </div>
    </div>
  );
}
