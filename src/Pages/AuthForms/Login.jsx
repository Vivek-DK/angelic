import React, { useState, useContext } from 'react';
import './Signup.css';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../context/UserContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success("Login successful!");
      navigate('/');
    } catch (err) {
      const msg = err?.message || "Login error";
      toast.error(msg);
      console.error(msg);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleLogin}>
        <h2>Welcome Back</h2>
        <p className="auth-subtext">Login to continue</p>

        <input
          type="email"
          placeholder="Email Address"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>
        
        <p className="auth-switch">
          Don't have an account? <span onClick={() => navigate('/signup')}>Sign Up</span>
        </p>
      </form>
    </div>
  );
};

export default Login;
