import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch the initial session state
    const fetchSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error fetching session:', error);
      } else {
        setUser(data?.session?.user ?? null);
      }
    };

    fetchSession();

    // Listen for changes to the auth state (sign in, sign out, etc.)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup the listener on component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setUser(user);
    }

    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setUser(user);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.log('Error logging out:', error.message);
    setUser(null);  // Clear user state
    setShortenedUrl('');  // Clear shortened URL
    setUrl('');
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShortenedUrl('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${baseUrl}/url/shorten`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error('Failed to shorten the URL');
      
      const data = await response.json();
      setShortenedUrl(data.short_url);
    } catch (err) {
      console.error(err);
      setError('Failed to shorten the URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '50px 20px' }}>
      <h1>URL Shortener</h1>

      {!user ? (
        <div>
          <h2>Sign in or Sign up</h2>
          <form onSubmit={handleLogin}>
            <label>
              Email:
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', margin: '10px 0' }}
              />
            </label>
            <label>
              Password:
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', margin: '10px 0' }}
              />
            </label>
            <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p>Don't have an account? Sign up below.</p>
          <form onSubmit={handleSignUp}>
            <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }} disabled={loading}>
              {loading ? 'Signing up...' : 'Sign up'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '20px', color: 'red' }}>
              <p>{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p>Logged in as {user.email}</p>
          <button onClick={handleLogout} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Log out
          </button>
          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <div>
              <label>
                Enter URL to shorten:
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', margin: '10px 0' }}
                />
              </label>
            </div>
            <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }} disabled={loading}>
              {loading ? 'Shortening...' : 'Shorten'}
            </button>
          </form>

          {shortenedUrl && (
            <div style={{ marginTop: '20px' }}>
              <h2>Shortened URL:</h2>
              <p>
                <a href={`${shortenedUrl}`} target="_blank" rel="noopener noreferrer">
                {shortenedUrl}
                </a>
              </p>
            </div>
          )}

          {error && (
            <div style={{ marginTop: '20px', color: 'red' }}>
              <p>{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
