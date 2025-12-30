import { useState, useEffect } from 'react';
import './ThemeToggle.css';

function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <button className="theme-toggle" onClick={toggleTheme} title="Переключить тему">
      {theme === 'light' ? '☀️' : '🌙'}
    </button>
  );
}

export default ThemeToggle;
