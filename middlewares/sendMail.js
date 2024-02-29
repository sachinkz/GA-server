"use strict";
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendMail({mailId,message}) {

    console.log(mailId,message)
    transporter.sendMail({
        from: process.env.SMTP_USER,
        to: mailId,
        subject: "Notification from GRAB-ARTS",
        text: message,
        html: `<h2>${message}</h2>`,
    }, (err, data) => {
        if (err) {
            console.log(err)
        }
        if (data) {
            console.log(data)
        }
    });

}



module.exports = sendMail;