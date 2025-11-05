import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';
import { prefetchCriticalRoutes } from '../utils/prefetch';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(username, password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Prefetch critical routes after successful login
      prefetchCriticalRoutes();
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'កំហុសក្នុងការចូល');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl md:text-2xl font-bold text-center">ការាស់សាំង</CardTitle>
          <CardDescription className="text-center">
            សូមចូលទៅកាន់ប្រព័ន្ធគ្រប់គ្រង
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ឈ្មោះអ្នកប្រើ</Label>
              <Input
                id="username"
                type="text"
                placeholder="បញ្ចូលឈ្មោះអ្នកប្រើ"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">ពាក្យសម្ងាត់</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="បញ្ចូលពាក្យសម្ងាត់"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {/* @ts-ignore */}
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {/* @ts-ignore */}
              <FiLogIn className="mr-2 h-4 w-4" />
              {loading ? 'កំពុងចូល...' : 'ចូល'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

