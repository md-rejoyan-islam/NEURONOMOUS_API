import secret from "../app/secret";
import mailTemplate from "./mail-template";

const accountCreatedMail = ({ to, name }: { to: string; name: string }) => {
  return mailTemplate({
    to,
    name,
    subject: "New Account Confirmation Email",
    body: `
       <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol';background-color:#f4f4f4;margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;width:100%!important"><div class="container" style="max-width:600px;margin:20px auto;background-color:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)"><div class="header" style="background-color:#28a745;color:#fff;padding:20px;text-align:center"><h1 style="margin:0;font-size:24px">Welcome to EEE SUST!</h1></div><div class="content" style="padding:20px;color:#333;line-height:1.6;text-align:center"><p>Hello ${name},</p><p>Your account has been successfully created. We're excited to have you on board!</p><p>To get started, please click the button below to log in to your new account and explore all the features.</p><div class="button-container" style="margin-top:20px"><a href="${secret.client_url}" style="background-color:#007bff;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:700;display:inline-block">Log in to your account</a></div><p style="color:#666;font-size:14px;margin-top:30px">If you have any questions or need help, please don't hesitate to reach out.</p></div><div class="footer" style="background-color:#eee;color:#666;padding:20px;text-align:center;font-size:12px;border-top:1px solid #ddd"><p style="margin:0">&copy; 2025 EEE SUST. All rights reserved.</p><p style="margin:0">You received this email because you signed up for an account at EEE SUST.</p></div></div></body>
        `,
  });
};

export default accountCreatedMail;
