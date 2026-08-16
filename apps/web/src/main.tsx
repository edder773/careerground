import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './auth';
import { App, preloadJobsPage, preloadLearningPage } from './App';
import './styles.css';

const client = new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, retry: 1 } } });

void preloadJobsPage().catch(() => undefined);
void preloadLearningPage().catch(() => undefined);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
