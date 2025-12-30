import { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ResourceDetail from './pages/ResourceDetail';
import SubmitResource from './pages/SubmitResource';
import Profile from './pages/Profile';
import MyResources from './pages/MyResources';
import BuyAdSlot from './pages/BuyAdSlot';
import Header from './components/Header';
import LoadingFallback from './components/LoadingFallback';
import './App.css';

function App() {
  useEffect(() => {
    console.log('✅ App component mounted');
  }, []);

  try {
    console.log('🔄 App component rendering...');
    return (
      <Router>
        <div className="App">
          <Header />
          <main>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/resource/:id" element={<ResourceDetail />} />
                <Route path="/submit" element={<SubmitResource />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/my-resources" element={<MyResources />} />
                <Route path="/buy-ad/:categoryId" element={<BuyAdSlot />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </Router>
    );
  } catch (error) {
    console.error('❌ Error in App component:', error);
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        fontFamily: 'system-ui',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️ Ошибка в компоненте App</h1>
        <p style={{ marginBottom: '1rem' }}>Проверьте консоль браузера (F12) для деталей</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            fontSize: '1rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Обновить страницу
        </button>
        <details style={{ marginTop: '1rem', textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer' }}>Детали ошибки</summary>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
            {error instanceof Error ? error.toString() + '\n' + error.stack : String(error)}
          </pre>
        </details>
      </div>
    );
  }
}

export default App;


