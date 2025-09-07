import dotenv from "dotenv";
import nodemailer from "nodemailer";
import secret from "../app/secret";
dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  name: string;
  body: string;
}

export default async function mailTemplate(
  options: EmailOptions
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: secret.nodeMailer.emailHost,
    port: secret.nodeMailer.emailPort,
    secure: false,
    auth: {
      user: secret.nodeMailer.emailUsername,
      pass: secret.nodeMailer.emailPassword,
    },
  });

  const mailOptions = {
    from: `Neuronomous | IoT Platform <${secret.nodeMailer.emailFrom}>`,
    to: options.to,
    subject: options.subject,
    html: options.body,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Could not send email.");
  }
}
