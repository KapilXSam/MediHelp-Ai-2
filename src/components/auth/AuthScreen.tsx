import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Role } from '../../types';

const AuthScreen: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>(Role.PATIENT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);


  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (isLoginView) {
      // Handle Login
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      // Handle Sign Up
      if (!fullName) {
        setError("Full name is required.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            role: role,
          },
        },
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        setMessage('Registration successful! Please check your email to confirm your account.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-slate-50">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center tracking-tight">
          {isLoginView ? 'Welcome Back' : 'Create Your Account'}
        </h2>
        <p className="text-slate-600 mb-8 text-center">
          {isLoginView ? 'Sign in to access your dashboard.' : 'Get started with MediHelp AI.'}
        </p>
        
        <form onSubmit={handleAuthAction} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
          {!isLoginView && (
            <div className="mb-4">
              <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-slate-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              minLength={6}
              required
            />
          </div>

          {!isLoginView && (
             <div className="mb-6">
                <label className="block text-slate-700 text-sm font-bold mb-2">I am a...</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    <option value={Role.PATIENT}>Patient</option>
                    <option value={Role.DOCTOR}>Doctor</option>
                    {/* Admins would typically be assigned manually, but we include it for testing */}
                    <option value={Role.ADMIN}>Admin</option> 
                </select>
             </div>
          )}
          
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          {message && <p className="text-green-500 text-xs italic mb-4">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 shadow-md hover:shadow-lg"
          >
            {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        
        <p className="text-center text-sm text-slate-600 mt-6">
          {isLoginView ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={() => { setIsLoginView(!isLoginView); setError(null); }} className="font-bold text-blue-500 hover:text-blue-700 ml-2">
            {isLoginView ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;