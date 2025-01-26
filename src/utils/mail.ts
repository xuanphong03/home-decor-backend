import * as nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: 'xphong.fullstack03@gmail.com',
    pass: 'hzsc ltzx rqoo vagk',
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  content: string,
) => {
  return transporter.sendMail({
    from: 'Xuan Phong 👻 <xphong.fullstack03@gmail.com>',
    to: to,
    subject: subject,
    html: content,
  });
};

export const contactAdmin = async (
  name: string,
  email: string,
  phoneNumber: string,
  subject: string,
  message: string,
) => {
  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #007bff;">Bạn có một liên hệ mới</h2>
      <p><strong>Tên:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Số điện thoại:</strong> ${phoneNumber}</p>
      <p><strong>Tiêu đề:</strong> ${subject}</p>
      <p><strong>Nội dung:</strong></p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; border: 1px solid #ddd;">
        ${message}
      </div>
      <p style="margin-top: 20px; font-size: 0.9em; color: #666;">
        Email này được gửi tự động từ hệ thống. Vui lòng không trả lời trực tiếp email này.
      </p>
    </div>
  `;
  return transporter.sendMail({
    from: email,
    to: 'xphong.fullstack03@gmail.com',
    subject: subject,
    html: emailTemplate,
  });
};
