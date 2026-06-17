import { useState, useEffect } from 'react';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const fetchMessages = () => {
    fetch('http://localhost:5000/api/messages')
      .then(response => response.json())
      .then(data => setMessages(data))
      .catch(error => console.error("Error fetching data:", error));
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsTyping(true);

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
    <div style={{ maxWidth: '600px', margin: '30px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>GPT-X Chat</h1>
      
      {/* The main chat container background is Alice Blue (#f0f8ff)
        instead of f4f4f4. This makes user blue and bot white messages pop.
      */}
      <div style={{ height: '400px', overflowY: 'auto', backgroundColor: '#f0f8ff', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        
        {messages.length === 0 && <p style={{ textAlign: 'center', color: '#888' }}>Start a conversation...</p>}
        
        {messages.map((msg) => (
          <div key={msg._id} style={{ 
            marginBottom: '15px', 
            textAlign: msg.role === 'user' ? 'right' : 'left' 
          }}>
            {/* User messages are now Blue/White; Bot is White/Black */}
            <div style={{ 
              display: 'inline-block',
              padding: '10px 15px', 
              borderRadius: '15px',
              backgroundColor: msg.role === 'user' ? '#007bff' : '#ffffff',
              color: msg.role === 'user' ? '#ffffff' : '#333',
              border: msg.role === 'user' ? 'none' : '1px solid #ddd',
              maxWidth: '80%',
              textAlign: 'left'
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