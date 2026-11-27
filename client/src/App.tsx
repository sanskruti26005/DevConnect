
import { useEffect, useState } from 'react';
import './App.css';
import Profile from './Profile';

const API_URL = 'http://localhost:5000/api/auth';

interface User {
  id: string;
  name: string;
  email: string;
  bio?: string | null;
  location?: string | null;
  profileImage?: string | null;
  skills?: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
}

function App() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Check existing login session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_URL}/me`, {
          credentials: 'include'
        });

        if (!response.ok) return;

        const result: ApiResponse<User> = await response.json();

        if (result.success && result.data) {
          setUser(result.data);
        }
      } catch {
        console.log('No active session found');
      }
    };

    checkSession();
  }, []);

  // Handle registration and login
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const endpoint = mode === 'register' ? 'register' : 'login';

      const body =
        mode === 'register'
          ? { name, email, password }
          : { email, password };

      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const result: ApiResponse<User> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Something went wrong');
      }

      if (mode === 'register') {
        setMessage('Registration successful! Please log in.');
        setMode('login');
        setPassword('');
      } else if (result.data) {
        setUser(result.data);
        setPassword('');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle logout

const handleLogout = async () => {
  try {
    const response = await fetch(`${API_URL}/logout`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    setUser(null);
    setMessage('');
    setError('');

    alert('You have logged out successfully!');
  } catch {
    alert('Unable to log out. Please try again.');
  }
};


  // Logged-in dashboard and profile
  if (user) {
    return (
      <div className="app-container">
        <Profile onLogout={handleLogout} />
      </div>
    );
  }

  // Login and registration forms
  return (
    <div className="app-container">
      <div className="auth-card">
        <h1>DevConnect</h1>
        <p className="tagline">Connect. Collaborate. Build Together.</p>

        <div className="tab-buttons">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login');
              setError('');
              setMessage('');
            }}
          >
            Login
          </button>

          <button
            className={mode === 'register' ? 'active' : ''}
            onClick={() => {
              setMode('register');
              setError('');
              setMessage('');
            }}
          >
            Register
          </button>
        </div>

        <h2>
          {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
        </h2>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password (minimum 8 characters)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />

          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Login'
                : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
