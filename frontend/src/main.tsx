import React from 'react'
import ReactDOM from 'react-dom/client'

console.log('📄 main.tsx script started');
console.log('📦 React version:', React.version);
console.log('📦 Document ready:', document.readyState);
console.log('📦 Root element:', document.getElementById('root'));

// Простой компонент
function SimpleApp() {
  console.log('✅ SimpleApp component rendering');
  
  return React.createElement('div', {
    style: {
      padding: '40px',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    }
  }, [
    React.createElement('h1', { 
      key: 'h1', 
      style: { fontSize: '3rem', marginBottom: '1rem' } 
    }, '✅ Приложение работает!'),
    React.createElement('p', { 
      key: 'p1',
      style: { fontSize: '1.2rem', marginBottom: '1rem' }
    }, 'React успешно загрузился и отрендерился.'),
    React.createElement('p', { 
      key: 'p2',
      style: { fontSize: '0.9rem', opacity: 0.8, marginTop: '2rem' }
    }, 'Проверьте консоль браузера (F12) для диагностики.'),
  ]);
}

// Инициализация
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = '<h1 style="padding: 20px; text-align: center;">Ошибка: элемент #root не найден</h1>';
} else {
  console.log('🚀 Starting app initialization...');
  
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('✅ React root created');
    
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(SimpleApp)
      )
    );
    console.log('✅ App render call completed');
    
    // Проверяем результат через небольшую задержку
    setTimeout(() => {
      if (rootElement.children.length === 0) {
        console.error('❌ Root element is still empty!');
        rootElement.innerHTML = `
          <div style="padding: 40px; text-align: center; font-family: system-ui;">
            <h1 style="color: #d32f2f;">❌ Приложение не отрендерилось</h1>
            <p>Проверьте консоль браузера (F12) для ошибок</p>
          </div>
        `;
      } else {
        console.log('✅ App rendered successfully!');
        console.log('Root children:', rootElement.children.length);
      }
    }, 100);
  } catch (error) {
    console.error('❌ Error rendering app:', error);
    rootElement.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: system-ui;">
        <h1 style="color: #d32f2f;">❌ Ошибка рендеринга</h1>
        <p>Проверьте консоль браузера (F12)</p>
        <pre style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: left; max-width: 600px; margin: 20px auto; overflow: auto;">
          ${error instanceof Error ? error.toString() + '\n' + error.stack : String(error)}
        </pre>
      </div>
    `;
  }
}

// Обработка глобальных ошибок
window.addEventListener('error', (event) => {
  console.error('❌ Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled promise rejection:', event.reason);
});

// Настраиваем axios для использования правильного baseURL
try {
  if (API_BASE_URL) {
    axios.defaults.baseURL = API_BASE_URL;
    console.log('🔧 API Base URL configured:', API_BASE_URL);
  } else {
    console.log('🔧 Using relative API paths (for local development)');
  }
} catch (error) {
  console.error('❌ Error configuring API:', error);
}

// Устанавливаем тему по умолчанию
try {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
} catch (error) {
  console.error('❌ Error setting theme:', error);
}

// Простой fallback HTML на случай критической ошибки
const showFallbackError = (message: string, details?: string) => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
        text-align: center;
        font-family: system-ui, -apple-system, sans-serif;
        background: #f5f5f5;
      ">
        <h1 style="font-size: 2rem; margin-bottom: 1rem; color: #d32f2f;">⚠️ Ошибка загрузки</h1>
        <p style="margin-bottom: 1rem; color: #666; max-width: 600px;">${message}</p>
        ${details ? `
          <details style="margin-top: 1rem; text-align: left; max-width: 600px;">
            <summary style="cursor: pointer; font-weight: bold;">Детали ошибки</summary>
            <pre style="background: white; padding: 10px; border-radius: 4px; overflow: auto; margin-top: 0.5rem;">
              ${details}
            </pre>
          </details>
        ` : ''}
        <button 
          onclick="window.location.reload()" 
          style="
            padding: 12px 24px;
            margin-top: 1rem;
            font-size: 1rem;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          Обновить страницу
        </button>
        <p style="margin-top: 1rem; font-size: 0.875rem; color: #999;">
          Откройте консоль браузера (F12) для подробностей
        </p>
      </div>
    `;
  }
};

// Проверяем наличие root элемента
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  showFallbackError('Элемент #root не найден в DOM. Проверьте файл index.html.');
} else {
  console.log('🚀 Starting app initialization...');
  console.log('📦 React version:', React.version);
  console.log('📦 Root element found:', rootElement);
  console.log('📦 Document ready state:', document.readyState);
  console.log('📦 Window location:', window.location.href);
  
  try {
    const root = ReactDOM.createRoot(rootElement);
    console.log('✅ React root created');
    
    console.log('🔄 Attempting to render App...');
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <SimpleApp />
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log('✅ App render call completed');
    
    // Проверяем через небольшую задержку, что рендер прошел
    setTimeout(() => {
      console.log('🔍 Checking render result...');
      console.log('Root children count:', rootElement.children.length);
      console.log('Root innerHTML length:', rootElement.innerHTML.length);
      
      if (rootElement.children.length === 0 && rootElement.innerHTML.trim() === '') {
        console.error('❌ Root element is still empty after render!');
        console.error('This usually means:');
        console.error('1. An error occurred during render (check errors above)');
        console.error('2. A component is returning null/undefined');
        console.error('3. CSS is hiding the content (check styles)');
        showFallbackError('Приложение не смогло отрендериться. Проверьте консоль для ошибок.');
      } else {
        console.log('✅ App rendered successfully!');
        console.log('First child:', rootElement.children[0]?.tagName || 'none');
      }
    }, 200);
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    showFallbackError(
      'Критическая ошибка при инициализации приложения',
      error instanceof Error ? error.toString() + '\n' + error.stack : String(error)
    );
  }
}


