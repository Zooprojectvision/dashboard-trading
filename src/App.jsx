export default function App() {
  try {
    return (
      <div style={{
        minHeight:'100vh',
        background:'#0b0b0c',
        color:'#e9ecef',
        display:'grid',
        placeItems:'center',
        fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif'
      }}>
        <div>
          <h1 style={{color:'#20e3d6', fontWeight:400, margin:0}}>ZooProjectVision</h1>
          <p style={{marginTop:8, color:'#bfc5c9'}}>Si tu vois ce message, le câblage React/Vite fonctionne ✅</p>
        </div>
      </div>
    );
  } catch (e) {
    console.error(e);
    return (
      <div style={{color:'#ff5fa2', padding:16}}>
        Erreur dans App.jsx : {String(e.message || e)}
      </div>
    );
  }
}
