import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { UploadPage } from './pages/UploadPage';
import { HistoryPage } from './pages/HistoryPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<UploadPage />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
