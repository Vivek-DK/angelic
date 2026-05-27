import React, {
  useContext,
  useState
} from "react";

import "./Contact.css";

import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope
} from "react-icons/fa";

import contact_image from "../../assets/contact.jpg";

import {
  UserContext
} from "../../context/UserContext";

const Contact = () => {

  const {
    user,
    token
  } = useContext(UserContext);

  const [loading, setLoading] =
    useState(false);

  const Node_Url =
    import.meta.env.VITE_NODE_API_URL ||
    "http://localhost:5000";

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!token) {

      return alert(
        "Please login first"
      );
    }

    const phone =
      e.target.phone.value.trim();

    const message =
      e.target.message.value.trim();

    try {

      setLoading(true);

      const response = await fetch(

        `${Node_Url}/api/contact`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          },

          body: JSON.stringify({

            phone,

            message
          })
        }
      );

      const data =
        await response.json();

      if (data.success) {

        alert(
          "Message sent successfully!"
        );

        e.target.reset();

      } else {

        alert(
          data.message
        );
      }

    } catch (error) {

      console.log(error);

      alert(
        "Failed to send message"
      );

    } finally {

      setLoading(false);
    }
  };

  return (

    <section className="contact-section">

      <div className="contact-wrapper">

        <div className="contact-left">

          <img
            src={contact_image}
            alt="Contact Support"
          />

        </div>

        <div className="contact-right">

          <h2>Contact Us.</h2>

          <form
            className="contact-form"
            onSubmit={handleSubmit}
          >

            <input
              type="text"
              value={user?.name || ""}
              disabled
            />

            <input
              type="email"
              value={user?.email || ""}
              disabled
            />

            <input
              type="tel"
              name="phone"
              placeholder="Phone"
            />

            <textarea
              name="message"
              rows="4"
              placeholder="Message"
              required
            ></textarea>

            <button
              type="submit"
              disabled={loading}
            >

              {
                loading
                ? "Sending..."
                : "SUBMIT"
              }

            </button>

          </form>

        </div>

      </div>

      <div className="contact-info">

        <div className="info-item">

          <FaMapMarkerAlt className="icon" />

          <h4>Address</h4>

          <p>
            Vidya Nagar,
            <br />
            Bengaluru North - 561203
          </p>

        </div>

        <div className="info-item">

          <FaPhoneAlt className="icon" />

          <h4>Phone</h4>

          <p>
            7348862962
          </p>

        </div>

        <div className="info-item">

          <FaEnvelope className="icon" />

          <h4>Email</h4>

          <p>

            <a href="mailto:dkvivek8@gmail.com">

              dkvivek8@gmail.com

            </a>

          </p>

        </div>

      </div>

    </section>
  );
};

export default Contact;