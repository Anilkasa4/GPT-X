import { useState, useEffect } from 'react';

// 1. The Authentication Component (Login & Register)
function Auth({ setToken }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const payload = isLogin ? { email, password } : { username, email, password };

        try {
            const res = await fetch(`http://localhost:5000${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.message || 'Authentication failed');
            
            if (isLogin) {
                setToken(data.token);
                localStorage.setItem('token', data.token); // Save the JWT wristband to the browser
            } else {
                setIsLogin(true);
                setError('Registration successful! Please login.');
            }
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h2>{isLogin ? 'Login to GPT-X' : 'Create an Account'}</h2>
            {error && <p style={{ color: error.includes('successful') ? 'green' : 'red' }}>{error}</p>}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                {!isLogin && (
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        required 
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                    />
                )}
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                />
                <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    {isLogin ? 'Login' : 'Register'}
                </button>
            </form>
            
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }} 
                style={{ marginTop: '20px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
            >
                {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
            </button>
        </div>
    );
}


// 2. The Main Chat Application Component
function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const fetchMessages = () => {
    // Note: Once we secure this endpoint, we'll need to pass the token in the headers here too!
    fetch('http://localhost:5000/api/messages')
      .then(response => response.json())
      .then(data => setMessages(data))
      .catch(error => console.error("Error fetching data:", error));
  };

  // Fetch messages when the component loads or when the user logs in
  useEffect(() => {
    if (token) {
        fetchMessages();
    }
  }, [token]); 

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  // The Bouncer: If there is no token, stop rendering the chat and show the Login screen instead
  if (!token) {
    return <Auth setToken={setToken} />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsTyping(true);

    // Note: Once we secure this endpoint, we'll need to pass the token in the headers here too!
    fetch('http://localhost:5000/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: inputText })
    })
    .then(() => {
      setInputText("");
      fetchMessages();
    })
    .catch(error => console.error("Error saving data:", error))
    .finally(() => setIsTyping(false));
  };

  return (
    <div style={{ maxWidth: '600px', margin: '30px auto', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* Logout Button */}
      <button 
        onClick={handleLogout} 
        style={{ position: 'absolute', top: 0, right: 0, padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Logout
      </button>

      <h1 style={{ textAlign: 'center', marginTop: '40px' }}>GPT-X Chat</h1>
      
      <div style={{ height: '400px', overflowY: 'auto', backgroundColor: '#f0f8ff', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e0e0e0' }}>
        
        {messages.length === 0 && <p style={{ textAlign: 'center', color: '#888' }}>Start a conversation...</p>}
        
        {messages.map((msg) => (
          <div key={msg._id} style={{ 
            marginBottom: '15px', 
            textAlign: msg.role === 'user' ? 'right' : 'left' 
          }}>
            <div style={{ 
              display: 'inline-block',
              padding: '10px 15px', 
              borderRadius: '15px',
              backgroundColor: msg.role === 'user' ? '#007bff' : '#ffffff',
              color: msg.role === 'user' ? '#ffffff' : '#333',
              border: msg.role === 'user' ? 'none' : '1px solid #ddd',
              maxWidth: '80%',
              textAlign: 'left',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}>
              <strong>{msg.role === 'user' ? 'You' : 'GPT-X'}: </strong>
              <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
            </div>
          </div>
        ))}
        {isTyping && <p style={{ color: '#888', fontStyle: 'italic' }}>GPT-X is typing...</p>}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask GPT-X something..." 
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={isTyping} style={{ padding: '12px 24px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;