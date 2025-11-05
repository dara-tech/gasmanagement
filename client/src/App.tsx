import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { Toaster } from './components/ui/toaster';
import { LoadingFallback } from './components/LoadingFallback';
import { ErrorBoundary } from './components/ErrorBoundary';
import { createLazyComponent } from './utils/lazyLoad';

// Lazy load all page components
const Login = createLazyComponent(() => import('./pages/Login'), 'Login');
const Dashboard = createLazyComponent(() => import('./pages/Dashboard'), 'Dashboard');
const Pumps = createLazyComponent(() => import('./pages/Pumps'), 'Pumps');
const Transactions = createLazyComponent(() => import('./pages/Transactions'), 'Transactions');

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Toaster />
      <ErrorBoundary>
        <Routes>
          <Route 
            path="/login" 
            element={
              <Suspense fallback={<LoadingFallback message="កំពុងផ្ទុកទំព័រចូល..." />}>
                <Login />
              </Suspense>
            } 
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <Suspense fallback={<LoadingFallback message="កំពុងផ្ទុកផ្ទាំងគ្រប់គ្រង..." />}>
                    <Dashboard />
                  </Suspense>
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/pumps"
            element={
              <PrivateRoute>
                <Layout>
                  <Suspense fallback={<LoadingFallback message="កំពុងផ្ទុកស្តុកសាំង..." />}>
                    <Pumps />
                  </Suspense>
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <Layout>
                  <Suspense fallback={<LoadingFallback message="កំពុងផ្ទុកព័ត៌មានលក់..." />}>
                    <Transactions />
                  </Suspense>
                </Layout>
              </PrivateRoute>
            }
          />
          {/* Redirect old fuel-types route to pumps */}
          <Route path="/fuel-types" element={<Navigate to="/pumps" replace />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
