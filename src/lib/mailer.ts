import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
});

export async function sendMail(to: string, subject: string, html: string) {
    try {
        await mailer.sendMail({
            from: process.env.MAIL_FROM,
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error("Failed to send email:", error);
        throw error;
    }
}
