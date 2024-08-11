const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config(); // Load environment variables

const app = express();
app.use(bodyParser.json());

// Verify that the environment variables are loaded
console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_PASS:', process.env.GMAIL_PASS);

// Store OTPs in memory for simplicity (consider using a database for production)
let otps = {};

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Generate and send OTP
app.post('/send-otp', (req, res) => {
  const email = req.body.email;
  const otp = crypto.randomInt(100000, 999999); // Generate 6-digit OTP

  // Store OTP with expiration time (5 minutes)
  otps[email] = {
    otp: otp,
    expires: Date.now() + 5 * 60 * 1000
  };

  // Send email with OTP
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send({ message: 'Error sending OTP', error });
    }
    res.status(200).send({ message: 'OTP sent successfully' });
  });
});

// Verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!otps[email]) {
    return res.status(400).send({ message: 'OTP not found' });
  }

  const storedOtp = otps[email];

  if (Date.now() > storedOtp.expires) {
    delete otps[email];
    return res.status(400).send({ message: 'OTP expired' });
  }

  if (parseInt(otp) !== storedOtp.otp) {
    return res.status(400).send({ message: 'Invalid OTP' });
  }

  delete otps[email];
  res.status(200).send({ message: 'OTP verified successfully' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
