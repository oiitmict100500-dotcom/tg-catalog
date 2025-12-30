// Простая версия App для диагностики

function SimpleApp() {
  console.log('✅ SimpleApp component rendering...');
  
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'system-ui',
      minHeight: '100vh',
      background: '#f5f5f5',
    }}>
      <h1>✅ Приложение загрузилось!</h1>
      <p>Если вы видите это сообщение, значит React работает.</p>
      <p>Проверьте консоль браузера (F12) для диагностики.</p>
    </div>
  );
}

export default SimpleApp;

