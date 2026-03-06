import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface AdminAuthProps {
  onLogin: (token: string) => void;
}

export function AdminAuth({ onLogin }: AdminAuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      onLogin(response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm p-8">
          <div className="flex items-center gap-3 mb-8">
            <Lock className="text-neutral-100" size={24} />
            <h1
              className="text-2xl font-light text-neutral-100"
              style={{ fontFamily: 'Rubik Distressed' }}
            >
              Admin Login
            </h1>
          </div>

          {error && (
            <div className="mb-6 p-4 border border-red-900/50 bg-red-950/20 flex items-start gap-2">
              <AlertCircle className="text-red-400 flex-shrink-0" size={16} />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-neutral-400 text-sm mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-700"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-400 text-sm mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 text-neutral-100 text-sm focus:outline-none focus:border-neutral-700"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-neutral-100 text-neutral-950 cursor-pointer font-light hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="text-neutral-600 text-xs mt-6 text-center">
            Contact system administrator for credentials
          </p>
        </div>
      </div>
    </div>
  );
}