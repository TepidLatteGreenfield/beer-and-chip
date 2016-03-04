var nodemailer = require('nodemailer');

exports.transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'beerandchip@gmail.com',
      pass: 'zygote123'
    }
  });
  // get account with real domain

exports.createMailOptions = function(fromDisplay, subjectLine, eventReceivers, emailBody) {
  return {
    from: fromDisplay, // sender address
    to: eventReceivers, // list of receivers
    subject: subjectLine, // Subject line
    html: emailBody
  };
};
