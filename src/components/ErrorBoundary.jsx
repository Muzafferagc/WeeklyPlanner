import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch(e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'sans-serif',
          padding: '2rem',
          textAlign: 'center',
          background: '#f8fafc',
          color: '#1e293b'
        }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444' }}>⚠️ Bir Yükleme Hatası Oluştu</h2>
          <p style={{ maxWidth: '500px', lineHeight: 1.5, color: '#64748b', margin: '0.8rem 0 1.2rem 0' }}>
            Uygulama yüklenirken bir çalışma hatası meydana geldi. Aşağıdaki butona basarak uygulamayı sıfırlayıp yeniden başlatabilirsiniz.
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: '0.85rem 1.75rem',
              borderRadius: '10px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            Sıfırla ve Yeniden Başlat
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
