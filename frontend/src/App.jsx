import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LaporanPerbaikan from './pages/LaporanPerbaikan';
import LaporanKendala from './pages/LaporanKendala';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/laporan-kendala" element={<LaporanKendala />} />
        <Route path="/laporan-perbaikan" element={<LaporanPerbaikan />} />
        <Route path="*" element={<Navigate to="/laporan-kendala" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
