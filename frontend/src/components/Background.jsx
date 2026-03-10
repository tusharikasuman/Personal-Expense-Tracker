import LiquidEther from './LiquidEther.jsx'

export default function Background({ children }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden', background: '#0a0010' }}>
      
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={40}
          cursorSize={200}
          autoDemo={true}
          autoSpeed={1.2}
          autoIntensity={5.0}
          resolution={0.8}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>

      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>

    </div>
  )
}