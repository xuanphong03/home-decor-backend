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
  from: string,
  subject: string,
  content: string,
) => {
  return transporter.sendMail({
    from: from,
    to: 'xphong.fullstack03@gmail.com',
    subject: subject,
    html: content,
  });
};
