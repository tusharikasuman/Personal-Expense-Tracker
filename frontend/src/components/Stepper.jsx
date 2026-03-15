import { useState, Children } from 'react'
import styled from 'styled-components'

export const Step = ({ children }) => <>{children}</>

const Stepper = ({
  children,
  initialStep = 1,
  onStepChange,
  onFinalStepCompleted,
  backButtonText = 'Back',
  nextButtonText = 'Next',
}) => {
  const steps = Children.toArray(children)
  const [current, setCurrent] = useState(initialStep - 1)

  const goNext = () => {
    if (current < steps.length - 1) {
      const next = current + 1
      setCurrent(next)
      onStepChange?.(next + 1)
    } else {
      onFinalStepCompleted?.()
    }
  }

  const goBack = () => {
    if (current > 0) {
      const prev = current - 1
      setCurrent(prev)
      onStepChange?.(prev + 1)
    }
  }

  return (
    <Wrapper>
      {/* Step indicators */}
      <div className="indicators">
        {steps.map((_, i) => (
          <div key={i} className="indicator-wrap">
            <div className={`dot ${i < current ? 'done' : i === current ? 'active' : ''}`}>
              {i < current ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`line ${i < current ? 'done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="content">
        {steps[current]}
      </div>

      {/* Buttons */}
      <div className="buttons">
        {current > 0 && (
          <button className="back-btn" onClick={goBack}>{backButtonText}</button>
        )}
        <button className="next-btn" onClick={goNext}>
          {current === steps.length - 1 ? 'Finish' : nextButtonText}
        </button>
      </div>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 28px;
  font-family: 'DM Sans', sans-serif;
  color: white;

  .indicators {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
  }

  .indicator-wrap {
    display: flex;
    align-items: center;
  }

  .dot {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.4);
    transition: all 0.3s;
    flex-shrink: 0;
  }

  .dot.active {
    background: linear-gradient(135deg, #7c3aed, #D89FF6);
    border-color: transparent;
    color: white;
    box-shadow: 0 0 16px rgba(216,159,246,0.4);
  }

  .dot.done {
    background: rgba(0,255,135,0.15);
    border-color: rgba(0,255,135,0.3);
    color: #00ff87;
  }

  .line {
    width: 60px;
    height: 1px;
    background: rgba(255,255,255,0.1);
    transition: background 0.3s;
    flex-shrink: 0;
  }

  .line.done {
    background: rgba(0,255,135,0.4);
  }

  .content {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px;
    padding: 28px;
    min-height: 180px;
    display: flex;
    flex-direction: column;
    gap: 14px;

    h2 {
      font-family: 'Syne', sans-serif;
      font-size: 20px;
      font-weight: 800;
      color: white;
    }

    p {
      font-size: 13px;
      color: rgba(255,255,255,0.5);
      line-height: 1.6;
    }

    input {
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 11px 14px;
      color: white;
      font-size: 13px;
      outline: none;
      font-family: 'DM Sans', sans-serif;
      transition: border-color 0.2s;
    }
    input:focus { border-color: rgba(216,159,246,0.5); }
    input::placeholder { color: rgba(255,255,255,0.25); }
  }

  .buttons {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .back-btn {
    padding: 10px 22px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.6);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.2s;
  }
  .back-btn:hover { background: rgba(255,255,255,0.08); color: white; }

  .next-btn {
    padding: 10px 28px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #7c3aed, #D89FF6);
    color: white;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: opacity 0.2s;
  }
  .next-btn:hover { opacity: 0.85; }
`

export default Stepper