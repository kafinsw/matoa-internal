'use client';
import s from './page.module.css';

export default function PageCatalog({ sub }) {
  return (
    <div className={s.wrap}>
      <div className={s.eyebrow}>
        <span className={s.n}>—</span> {sub === 'catalog-kendala' ? 'List Kendala' : 'List Kategori'}
      </div>
      <div style={{ color: 'var(--grey)', padding: '48px 0', textAlign: 'center', fontSize: 14 }}>
        Halaman {sub === 'catalog-kendala' ? 'List Kendala' : 'List Kategori'} — segera hadir.
      </div>
    </div>
  );
}
