import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { Toaster } from './components/ui/toaster';
import { ErrorBoundary } from './components/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pumps from './pages/Pumps';
import Transactions from './pages/Transactions';

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
            element={<Login />} 
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/pumps"
            element={
              <PrivateRoute>
                <Layout>
                  <Pumps />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <Layout>
                  <Transactions />
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
