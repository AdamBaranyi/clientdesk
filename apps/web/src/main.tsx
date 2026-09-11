import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { App } from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { endSessionOnUnauthenticated } from './features/auth/use-session.ts';
import { LocaleProvider } from './i18n/LocaleProvider.tsx';
import { ThemeProvider } from './lib/theme.tsx';
import './styles/global.css';

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => endSessionOnUnauthenticated(queryClient, error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => endSessionOnUnauthenticated(queryClient, error),
  }),
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const container = document.getElementById('root');
if (!container) throw new Error('Wurzelelement #root fehlt in index.html.');

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ErrorBoundary>
        </ThemeProvider>
      </LocaleProvider>
    </QueryClientProvider>
  </StrictMode>,
);
