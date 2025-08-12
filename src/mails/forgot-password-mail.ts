import mailTemplate from "./mail-template";

const forgotPasswordMail = ({
  to,
  name,
  resetCode,
}: {
  to: string;
  name: string;
  resetCode: string;
}) => {
  return mailTemplate({
    to,
    name,
    subject: "Reset Your Password",
    body: `
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol';background-color:#f4f4f4;margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;width:100%!important"><div class="container" style="max-width:600px;margin:20px auto;background-color:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)"><div class="header" style="background-color:#007bff;color:#fff;padding:20px;text-align:center"><h1 style="margin:0;font-size:24px">Password Reset</h1></div><div class="content" style="padding:20px;color:#333;line-height:1.6;text-align:center"><p>Hello ${name},</p><p>We received a request to reset the password for your account. If you did not make this request, you can safely ignore this email.</p><p>To proceed with your password reset, please use the following one-time code:</p><div class="code-block" style="background-color:#f0f0f0;border-left:4px solid #007bff;font-size:24px;font-weight:700;padding:10px 20px;margin:20px auto;display:inline-block;letter-spacing:2px;border-radius:4px">${resetCode}</div><div class="instructions" style="margin-top:20px;text-align:left"><p style="margin-bottom:10px"><strong>Instructions:</strong></p><ol style="margin-top:0;padding-left:20px"><li style="margin-bottom:8px">Copy the code above.</li><li style="margin-bottom:8px">Go back to the application or website.</li><li style="margin-bottom:8px">Paste the code in the password reset field.</li><li style="margin-bottom:8px">Choose and confirm your new password.</li></ol></div><p>This code is valid for **10 minutes** and should not be shared with anyone.</p></div><div class="footer" style="background-color:#eee;color:#666;padding:20px;text-align:center;font-size:12px;border-top:1px solid #ddd"><p style="margin:0">&copy; 2025 EEE SUST. All rights reserved.</p><p style="margin:0">If you have any questions, please contact our<a href="#" style="color:#007bff;text-decoration:none">support team</a>.</p></div></div></body>
        `,
  });
};

export default forgotPasswordMail;
