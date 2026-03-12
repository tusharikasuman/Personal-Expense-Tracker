import LiquidEther from './LiquidEther.jsx'

export default function Background({ children }) {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100%' }}>

      {/* LiquidEther stays fixed behind everything */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
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

      {/* Scrollable content sits on top */}
      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh' }}>
        {children}
      </div>

    </div>
  )
}