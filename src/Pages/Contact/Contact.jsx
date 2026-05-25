import React from "react";
import "./Contact.css";
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import contact_image from "../../assets/contact.jpg";

const Contact = () => {
  const handleSubmit = async (e) => {

    e.preventDefault();

    const name =
      e.target.name.value.trim();

    const email =
      e.target.email.value.trim();

    const phone =
      e.target.phone.value.trim();

    const message =
      e.target.message.value.trim();

    const Node_Url = import.meta.env.VITE_NODE_API_URL

    try {

      const response = await fetch(

        `${Node_Url}/api/contact`,

        {

          method: "POST",

          headers: {

            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            name,

            email,

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
    }
  };

  return (
    <section className="contact-section">
      <div className="contact-wrapper">
        <div className="contact-left">
          <img src={contact_image} alt="Contact Support" />
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
          {<p>7348862962 {/*<br />sharath: 9538080550<br />supreeth: 8792722208 */}</p>}
        </div>
        <div className="info-item">
          <FaEnvelope className="icon" />
          <h4>Email</h4>
          <p>
            <a href="mailto:vivek.dkrishnamurthy@gmail.com">vivek.dkrishnamurthy@gmail.com</a><br />
            {/* <a href="mailto:sharathgunda267@gmail.com">sharathr.22is@saividya.ac.in</a><br />
            <a href="mailto:nayaksupreeth0@gmail.com">supreetha.22is@saividya.ac.in</a><br />
            <a href="mailto:rakshitha@gmail.com">rakshithas.22is@saividya.ac.in</a><br /> */}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Contact;
