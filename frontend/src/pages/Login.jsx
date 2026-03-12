import React from 'react';
import styled from 'styled-components';

const Login = () => {
  return (
    <StyledWrapper>
      <div className="card">
        <div className="card2">
          <form className="form">
            <p id="heading">Login</p>
            <div className="field">
              <svg viewBox="0 0 16 16" fill="currentColor" height={16} width={16} xmlns="http://www.w3.org/2000/svg" className="input-icon">
                <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914z" />
              </svg>
              <input type="text" className="input-field" placeholder="Username" autoComplete="off" />
            </div>
            <div className="field">
              <svg viewBox="0 0 16 16" fill="currentColor" height={16} width={16} xmlns="http://www.w3.org/2000/svg" className="input-icon">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              </svg>
              <input type="password" className="input-field" placeholder="Password" />
            </div>
            <div className="btn">
              <button className="button1">Login</button>
              <button className="button2">Sign Up</button>
            </div>
            <button className="google-btn">
  <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
  Continue with Google
</button>
            <button className="button3">Forgot Password</button>
            <div className="bottom-link">
              <p>Don't have an account? <a href="/signup">Sign Up</a></p>
            </div>
          </form>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;

  .card {
    width: 400px;
    background: linear-gradient(163deg, #D89FF6 0%, #7c3aed 100%);
    border-radius: 18px;
    padding: 1.5px;
    animation: pulseGlow 4s ease-in-out infinite;
    transition: all 0.3s;
  }

  .card:hover {
    box-shadow: 0px 0px 40px 4px rgba(216, 159, 246, 0.3);
  }

  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 0 16px 2px rgba(216, 159, 246, 0.15); }
    50%       { box-shadow: 0 0 32px 4px rgba(216, 159, 246, 0.3); }
  }

  .card2 {
    border-radius: 17px;
    transition: transform 0.25s ease;
  }

  .card2:hover {
    transform: scale(0.985);
    border-radius: 17px;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 36px 30px 24px;
    background: rgba(14, 14, 14, 0.85);
    backdrop-filter: blur(20px);
    border-radius: 17px;
    transition: 0.4s ease-in-out;
  }

  #heading {
    text-align: center;
    margin: 0 0 14px 0;
    color: #ffffff;
    font-size: 1.3em;
    font-weight: 700;
    letter-spacing: 0.3px;
  }

  .field {
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 50px;
    padding: 12px 18px;
    background-color: rgba(255, 255, 255, 0.05);
    box-shadow: inset 2px 4px 10px rgba(0, 0, 0, 0.5);
    transition: all 0.3s;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .field:focus-within {
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid #D89FF6;
    box-shadow: inset 2px 4px 10px rgba(0,0,0,0.5),
                0 0 12px rgba(216, 159, 246, 0.4);
  }

  .input-icon {
    height: 14px;
    width: 14px;
    fill: rgba(255, 255, 255, 0.35);
    flex-shrink: 0;
  }

  .input-field {
    background: none;
    border: none;
    outline: none;
    width: 100%;
    color: #d3d3d3;
    font-size: 13px;
  }

  .input-field::placeholder {
    color: rgba(255, 255, 255, 0.2);
  }

  .form .btn {
    display: flex;
    justify-content: center;
    flex-direction: row;
    gap: 8px;
    margin-top: 20px;
  }

  .button1 {
    flex: 1;
    padding: 10px 0;
    border-radius: 8px;
    border: 1px solid rgba(216, 159, 246, 0.3);
    outline: none;
    transition: all 0.3s ease;
    background-color: rgba(216, 159, 246, 0.08);
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .button1:hover {
    background-color: rgba(216, 159, 246, 0.2);
    border-color: #D89FF6;
    transform: scale(0.97);
  }

  .button2 {
    flex: 1;
    padding: 10px 0;
    border-radius: 8px;
    border: 1px solid rgba(124, 58, 237, 0.3);
    outline: none;
    transition: all 0.3s ease;
    background-color: rgba(124, 58, 237, 0.08);
    color: white;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  .button2:hover {
    background-color: rgba(124, 58, 237, 0.2);
    border-color: #7c3aed;
    transform: scale(0.97);
  }

  .google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 10px 0;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.google-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: scale(0.97);
}

  .button3 {
    padding: 9px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    outline: none;
    transition: all 0.3s ease;
    background-color: transparent;
    color: rgba(255, 255, 255, 0.3);
    font-size: 12px;
    cursor: pointer;
  }

  .button3:hover {
    background-color: rgba(192, 57, 43, 0.2);
    border-color: rgba(192, 57, 43, 0.4);
    color: #ff6b6b;
  }

  .bottom-link {
    text-align: center;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.25);
    margin: 4px 0 6px;
  }

  .bottom-link a {
    color: #D89FF6;
    text-decoration: none;
    font-weight: 600;
  }

  .bottom-link a:hover {
    text-decoration: underline;
  }
`;

export default Login;