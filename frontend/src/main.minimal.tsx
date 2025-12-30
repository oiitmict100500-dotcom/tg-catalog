// Минимальная версия для диагностики - без зависимостей
console.log('📄 main.minimal.tsx loaded');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = '<h1 style="padding: 20px;">Ошибка: элемент #root не найден</h1>';
} else {
  console.log('✅ Root element found');
  
  // Просто показываем HTML напрямую
  rootElement.innerHTML = `
    <div style="
      padding: 40px;
      text-align: center;
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    ">
      <h1 style="font-size: 3rem; margin-bottom: 1rem;">✅ Приложение работает!</h1>
      <p style="font-size: 1.2rem; margin-bottom: 2rem;">Если вы видите это сообщение, значит:</p>
      <ul style="text-align: left; max-width: 600px; margin: 0 auto; font-size: 1.1rem;">
        <li>✅ HTML загружается</li>
        <li>✅ JavaScript выполняется</li>
        <li>✅ DOM доступен</li>
      </ul>
      <p style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.8;">
        Проверьте консоль браузера (F12) для диагностики React
      </p>
    </div>
  `;
  
  console.log('✅ HTML rendered directly');
  
  // Теперь пробуем загрузить React
  setTimeout(() => {
    console.log('🔄 Attempting to load React...');
    import('react').then((React) => {
      console.log('✅ React loaded:', React.version);
      import('react-dom/client').then((ReactDOM) => {
        console.log('✅ ReactDOM loaded');
        
        const root = ReactDOM.createRoot(rootElement);
        root.render(
          React.createElement('div', {
            style: {
              padding: '40px',
              textAlign: 'center',
              fontFamily: 'system-ui',
              minHeight: '100vh',
              background: '#4CAF50',
              color: 'white',
            }
          }, [
            React.createElement('h1', { key: 'h1', style: { fontSize: '3rem' } }, '✅ React работает!'),
            React.createElement('p', { key: 'p' }, 'Если вы видите это, React успешно загрузился и отрендерился.'),
          ])
        );
        console.log('✅ React rendered successfully');
      }).catch((error) => {
        console.error('❌ Error loading ReactDOM:', error);
      });
    }).catch((error) => {
      console.error('❌ Error loading React:', error);
    });
  }, 1000);
}

