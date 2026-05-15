import React, {

  useContext,

  useState

} from "react";

import "./Signup.css";

import {

  useNavigate

} from "react-router-dom";

import {

  toast

} from "react-toastify";

import {

  UserContext

} from "../../context/UserContext";

import {

  loginSchema

} from "../../validators/authValidator";


const Login = () => {

  const navigate =
    useNavigate();

  const { login } =
    useContext(UserContext);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  const handleLogin =
    async (e) => {

      e.preventDefault();

      const { error } =
        loginSchema.validate({

          email:
            email.trim(),

          password
        });

      if (error) {

        return toast.error(
          error.details[0].message
        );
      }

      try {

        setLoading(true);

        await login(

          email.trim()
            .toLowerCase(),

          password
        );

        toast.success(
          "Login successful!"
        );

        navigate("/");

      } catch (err) {

        toast.error(

          err?.message ||

          "Login failed"
        );

      } finally {

        setLoading(false);
      }
    };


  return (

    <div className="auth-container">

      <form

        className="auth-form"

        onSubmit={handleLogin}
      >

        <h2>
          Welcome Back
        </h2>

        <p className="auth-subtext">
          Login to continue
        </p>

        <input

          type="email"

          placeholder="Email Address"

          required

          value={email}

          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
        />

        <input

          type="password"

          placeholder="Password"

          required

          value={password}

          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
        />

        <button
          type="submit"
          disabled={loading}
        >

          {loading
            ? "Logging in..."
            : "Login"}

        </button>

        <p className="auth-switch">

          Don't have an account?

          <span
            onClick={() =>
              navigate("/signup")
            }
          >

            Sign Up

          </span>

        </p>

      </form>

    </div>
  );
};

export default Login;