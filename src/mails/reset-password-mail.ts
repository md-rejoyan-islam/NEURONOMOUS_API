import secret from "../app/secret";
import mailTemplate from "./mail-template";

const resetPasswordMail = ({ to, name }: { to: string; name: string }) => {
  return mailTemplate({
    to,
    name,
    subject: "Password Change Confirmation Email",
    body: `
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol';background-color:#f4f4f4;margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;width:100%!important"><div class="container" style="max-width:600px;margin:20px auto;background-color:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)"><div class="header" style="background-color:#28a745;color:#fff;padding:20px;text-align:center"><h1 style="margin:0;font-size:24px">Password Changed Successfully</h1></div><div class="content" style="padding:20px;color:#333;line-height:1.6;text-align:center"><p>Hello ${name},</p><p>This email is to confirm that the   password for your account has been successfully changed.</p><p style="font-weight:700;margin-top:30px">You can now log in with your new password.</p><div class="button-container" style="margin-top:20px"><a href="${secret.client_url}" style="background-color:#007bff;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:700;display:inline-block">Log in to your account</a></div><p style="color:#666;font-size:14px;margin-top:30px">If you did not change your password, please contact our support team immediately.</p></div><div class="footer" style="background-color:#eee;color:#666;padding:20px;text-align:center;font-size:12px;border-top:1px solid #ddd"><p style="margin:0">&copy; 2025 EEE SUST. All rights reserved.</p><p style="margin:0">If you have any questions, please contact our<a href="#" style="color:#007bff;text-decoration:none">support team</a>.</p></div></div></body>
        `,
  });
};

export default resetPasswordMail;
