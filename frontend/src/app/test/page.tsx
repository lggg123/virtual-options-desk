export default function TestPage() {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#1a1a2e', minHeight: '100vh', color: 'white' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>✅ Test Page Works!</h1>
      <p>If you can see this, routing is working correctly.</p>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#16213e', borderRadius: '8px' }}>
        <h2>Quick Tests:</h2>
        <button 
          onClick={() => {
            console.log('Button clicked!');
            alert('JavaScript is working!');
          }}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#0f3460',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Test Button
        </button>
        
        <div style={{ marginTop: '1rem' }}>
          <a href="/pricing" style={{ color: '#00d4ff' }}>← Go to Pricing</a>
          {' | '}
          <a href="/debug-simple" style={{ color: '#00d4ff' }}>Go to Simple Debug →</a>
        </div>
      </div>
    </div>
  );
}
