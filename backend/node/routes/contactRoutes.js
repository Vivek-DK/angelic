const express = require("express");

const nodemailer = require("nodemailer");

const auth = require(
  "../middleware/auth"
);

const router = express.Router();

router.post(
  "/",
  auth,
  async (req, res) => {

    try {

      const {

        phone,

        message

      } = req.body;

      if (!message) {

        return res.status(400).json({

          success: false,

          message:
            "Message is required"
        });
      }

      const {

        name,

        email

      } = req.user;

      const transporter =
        nodemailer.createTransport({

          service: "gmail",

          auth: {

            user:
              process.env.MAIL_USER,

            pass:
              process.env.MAIL_PASS
          }
        });

      const mailOptions = {

        from:
          `"Angelic Contact Form" <${process.env.MAIL_USER}>`,

        replyTo: email,

        to: "dkvivek8@gmail.com",

        subject:
          `New Contact Message from ${name}`,

        html: `

          <div style="font-family: Arial;">

            <h2>
              New Contact Message
            </h2>

            <p>
              <strong>Name:</strong>
              ${name}
            </p>

            <p>
              <strong>Email:</strong>
              ${email}
            </p>

            <p>
              <strong>Phone:</strong>
              ${phone || "N/A"}
            </p>

            <p>
              <strong>Message:</strong>
            </p>

            <p>
              ${message}
            </p>

          </div>
        `
      };

      await transporter.sendMail(
        mailOptions
      );

      return res.status(200).json({

        success: true,

        message:
          "Message sent successfully"
      });

    } catch (error) {

      console.log(

        "CONTACT MAIL ERROR:",

        error
      );

      return res.status(500).json({

        success: false,

        message:
          "Failed to send message"
      });
    }
  }
);

module.exports = router;