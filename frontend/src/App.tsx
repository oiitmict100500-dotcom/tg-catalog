import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ResourceDetail from './pages/ResourceDetail';
import SubmitResource from './pages/SubmitResource';
import Profile from './pages/Profile';
import MyResources from './pages/MyResources';
import BuyAdSlot from './pages/BuyAdSlot';
import Header from './components/Header';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/resource/:id" element={<ResourceDetail />} />
            <Route path="/submit" element={<SubmitResource />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-resources" element={<MyResources />} />
            <Route path="/buy-ad/:categoryId" element={<BuyAdSlot />} />
              </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;


