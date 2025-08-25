import React, { useState, useContext } from "react";
import "./Signup.css";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import { toast } from "react-toastify";
import axios from "axios";

const Signup = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", otp: "" });
  const { signup } = useContext(UserContext);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_NODE_URL;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/auth/send-otp`, { email: form.email });
      toast.success("OTP sent to your email");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await signup(form.name, form.email, form.password, form.otp);
      toast.success("Signup successful!");
      navigate("/");
    } catch (err) {
      toast.error(err?.message || "Signup error");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={step === 1 ? sendOtp : handleSignup}>
        <h2>{step === 1 ? "Create Account" : "Verify OTP"}</h2>
        {step === 1 && (
          <>
            <input name="name" placeholder="Your Name" required value={form.name} onChange={handleChange} />
            <input name="email" type="email" placeholder="Email Address" required value={form.email} onChange={handleChange} />
            <input name="password" type="password" placeholder="Create Password" required value={form.password} onChange={handleChange} />
            <button type="submit">Send OTP</button>
          </>
        )}

        {step === 2 && (
          <>
            <p>We have sent an OTP to {form.email}</p>
            <input name="otp" placeholder="Enter OTP" required value={form.otp} onChange={handleChange} />
            <button type="submit">Verify & Sign Up</button>
          </>
        )}

        <p className="auth-switch">
          Already have an account? <span onClick={() => navigate('/login')}>Log In</span>
        </p>
      </form>
    </div>
  );
};

export default Signup;
