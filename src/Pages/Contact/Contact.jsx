import React from "react";
import "./Contact.css";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import vivek from "../../assets/img3.jpg";

const Contact = () => {
  const handleSubmit = (e) => {
    e.preventDefault();

    const name = e.target.name.value.trim();
    const email = e.target.email.value.trim();
    const phone = e.target.phone.value.trim();
    const message = e.target.message.value.trim();

    const subject = encodeURIComponent(`Message from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nMessage:\n${message}`
    );

    window.location.href = `mailto:vivek.dkrishnamurthy@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <section className="contact-section">
      <div className="contact-wrapper">
        <div className="contact-left">
          <img src={vivek} alt="Contact Support" />
        </div>

        <div className="contact-right">
          <h2>Contact Us.</h2>
          <form className="contact-form" onSubmit={handleSubmit}>
            <input type="text" name="name" placeholder="Name" required />
            <input type="email" name="email" placeholder="Email address" required />
            <input type="tel" name="phone" placeholder="Phone" />
            <textarea name="message" rows="4" placeholder="Message" required></textarea>
            <button type="submit">SUBMIT</button>
          </form>
        </div>
      </div>

      <div className="contact-info">
        <div className="info-item">
          <FaMapMarkerAlt className="icon" />
          <h4>Address</h4>
          <p>Vidya Nagar,<br />Bengaluru North - 561203</p>
        </div>
        <div className="info-item">
          <FaPhoneAlt className="icon" />
          <h4>Phone</h4>
          <p>7348862962<br />6360354928</p>
        </div>
        <div className="info-item">
          <FaEnvelope className="icon" />
          <h4>Email</h4>
          <p>
            <a href="mailto:vivek.dkrishnamurthy@gmail.com">vivek.dkrishnamurthy@gmail.com</a><br />
            <a href="mailto:rakshitha@gmail.com">rakshitha@gmail.com</a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Contact;
