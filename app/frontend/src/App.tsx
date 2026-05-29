import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import AuthCallback from './pages/AuthCallback';
import AuthError from './pages/AuthError';
import Dashboard from './pages/Dashboard';
import DefenseDetail from './pages/DefenseDetail';
import AttackDetail from './pages/AttackDetail';
import DefenseForm from './pages/DefenseForm';
import AttackForm from './pages/AttackForm';
import SwgtImport from './pages/SwgtImport';

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/auth/error" element={<AuthError />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/defenses/new" element={<DefenseForm />} />
    <Route path="/defenses/:id" element={<DefenseDetail />} />
    <Route path="/defenses/:id/edit" element={<DefenseForm />} />
    <Route path="/attacks/new" element={<AttackForm />} />
    <Route path="/attacks/:id" element={<AttackDetail />} />
    <Route path="/attacks/:id/edit" element={<AttackForm />} />
    <Route path="/import" element={<SwgtImport />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
export { AppRoutes };