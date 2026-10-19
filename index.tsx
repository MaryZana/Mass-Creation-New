import './index.css';
import 'antd/dist/reset.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProfileProvider } from './components/ProfileContext';
import { PromoBonusDemoProvider } from './components/PromoBonusDemoContext';
import { PromoMissedBonusUxProvider } from './components/PromoMissedBonusUxContext';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            padding: 24,
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#111',
            background: '#F3F5F8',
            minHeight: '100vh',
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>Ошибка загрузки интерфейса</h1>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#b91c1c' }}>
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

declare global {
  interface Window {
    __MASS_CREATION_ROOT__?: ReturnType<typeof ReactDOM.createRoot>;
  }
}

// Reuse one createRoot across Vite HMR — a second createRoot on #root stacks a full app duplicate.
if (!window.__MASS_CREATION_ROOT__) {
  if (rootElement.childElementCount > 0) {
    rootElement.replaceChildren();
  }
  window.__MASS_CREATION_ROOT__ = ReactDOM.createRoot(rootElement);
}

window.__MASS_CREATION_ROOT__.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter basename={routerBasename}>
        <ProfileProvider>
          <PromoBonusDemoProvider>
            <PromoMissedBonusUxProvider>
              <App />
            </PromoMissedBonusUxProvider>
          </PromoBonusDemoProvider>
        </ProfileProvider>
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>
);