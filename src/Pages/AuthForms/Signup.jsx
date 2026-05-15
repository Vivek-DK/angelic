import React, {

  useContext,

  useState

} from "react";

import "./Signup.css";

import axios from "axios";

import {

  toast

} from "react-toastify";

import {

  useNavigate

} from "react-router-dom";

import {

  UserContext

} from "../../context/UserContext";

import {

  signupSchema

} from "../../validators/authValidator";


const Signup = () => {

  const navigate =
    useNavigate();

  const { signup } =
    useContext(UserContext);

  const [step, setStep] =
    useState(1);

  const [loading, setLoading] =
    useState(false);

  const [form, setForm] =
    useState({

      name: "",

      email: "",

      password: "",

      otp: ""
    });

  const API_BASE =
    import.meta.env.VITE_NODE_URL || "http://localhost:5000";


  const handleChange =
    (e) => {

      setForm({

        ...form,

        [e.target.name]:
          e.target.value
      });
    };


  // ==========================================
  // SEND OTP
  // ==========================================

  const sendOtp =
    async (e) => {

      e.preventDefault();

      const { error } =
        signupSchema.validate({

          name:
            form.name.trim(),

          email:
            form.email.trim(),

          password:
            form.password
        });

      if (error) {

        return toast.error(
          error.details[0].message
        );
      }

      try {

        setLoading(true);

        await axios.post(

          `${API_BASE}/api/auth/send-otp`,

          {

            email:
              form.email
                .trim()
                .toLowerCase()
          }
        );

        toast.success(
          "OTP sent successfully"
        );

        setStep(2);

      } catch (err) {

        toast.error(

          err.response?.data?.message ||

          "Failed to send OTP"
        );

      } finally {

        setLoading(false);
      }
    };


  // ==========================================
  // SIGNUP
  // ==========================================

  const handleSignup =
    async (e) => {

      e.preventDefault();

      const { error } =
        signupSchema.validate(form);

      if (error) {

        return toast.error(
          error.details[0].message
        );
      }

      try {

        setLoading(true);

        await signup(

          form.name.trim(),

          form.email
            .trim()
            .toLowerCase(),

          form.password,

          form.otp
        );

        toast.success(
          "Signup successful!"
        );

        navigate("/");

      } catch (err) {

        toast.error(

          err?.message ||

          "Signup failed"
        );

      } finally {

        setLoading(false);
      }
    };


  return (

    <div className="auth-container">

      <form

        className="auth-form"

        onSubmit={
          step === 1
            ? sendOtp
            : handleSignup
        }
      >

        <h2>

          {step === 1

            ? "Create Account"

            : "Verify OTP"}

        </h2>


        {step === 1 && (

          <>

            <input

              name="name"

              placeholder="Your Name"

              required

              value={form.name}

              onChange={handleChange}
            />

            <input

              name="email"

              type="email"

              placeholder="Email Address"

              required

              value={form.email}

              onChange={handleChange}
            />

            <input

              name="password"

              type="password"

              placeholder="Create Password"

              required

              value={form.password}

              onChange={handleChange}
            />

            <button

              type="submit"

              disabled={loading}
            >

              {loading

                ? "Sending OTP..."

                : "Send OTP"}

            </button>

          </>
        )}


        {step === 2 && (

          <>

            <p>

              OTP sent to:

              <strong>
                {" "}
                {form.email}
              </strong>

            </p>

            <input

              name="otp"

              placeholder="Enter OTP"

              required

              value={form.otp}

              onChange={handleChange}
            />

            <button

              type="submit"

              disabled={loading}
            >

              {loading

                ? "Creating Account..."

                : "Verify & Sign Up"}

            </button>

          </>
        )}


        <p className="auth-switch">

          Already have an account?

          <span
            onClick={() =>
              navigate("/login")
            }
          >

            Log In

          </span>

        </p>


        <p
          style={{
            marginTop: "15px",
            fontSize: "14px",
            color: "var(--text-muted)"
          }}
        >

          OTP sending may be limited
          on deployed free hosting.

        </p>

      </form>

    </div>
  );
};

export default Signup;