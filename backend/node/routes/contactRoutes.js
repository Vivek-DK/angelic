const express = require("express");

const nodemailer = require("nodemailer");

const router = express.Router();

router.post("/", async (req, res) => {

  try {

    const {

      name,

      email,

      phone,

      message

    } = req.body;

    if (

      !name ||

      !email ||

      !message

    ) {

      return res.status(400).json({

        message: "Required fields missing"

      });
    }

    const transporter = nodemailer.createTransport({

      service: "gmail",

      auth: {

        user: process.env.MAIL_USER,

        pass: process.env.MAIL_PASS
      }
    });

    const mailOptions = {

      from: process.env.MAIL_USER,

      to: "dkvivek8@gmail.com",

      subject: `New Contact Message from ${name}`,

      html: `

        <h2>New Contact Message</h2>

        <p><strong>Name:</strong> ${name}</p>

        <p><strong>Email:</strong> ${email}</p>

        <p><strong>Phone:</strong> ${phone}</p>

        <p><strong>Message:</strong></p>

        <p>${message}</p>
      `
    };

    await transporter.sendMail(

      mailOptions
    );

    return res.status(200).json({

      success: true,

      message: "Message sent successfully"
    });

  } catch (error) {

    console.log(

      "CONTACT MAIL ERROR:",

      error
    );

    return res.status(500).json({

      success: false,

      message: "Failed to send message"
    });
  }
});

module.exports = router;