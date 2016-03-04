var nodemailer = require('../config/nodemailer');
var GuestQuery = require('../queries/guestQueries');
var EmailQuery = require('../queries/emailQueries');
var EventQuery = require('../queries/eventQueries');
var UserQuery = require('../queries/userQueries');
var ItemQuery = require('../queries/itemQueries');

// writes an emailbody base
var createInviteManyBody = function (creator, event, url, callback) {
  var body = "";
  body += "<h5>Hey There!</h5>";
  body += "<h4>" + creator + " has invited you to : </h4>";
  body += "<a href='" + url + "'><h3>" + event.name + "!</h3></a>";
  if(event.date !== null) {
    body += "<p>When: <b>" + event.date + "</b></p>";
  }
  if(event.location !== null) {
    body += "<p>Where: <b>" + event.location + "</b></p>";
  }
  body += "<h4>" + creator + " suggests we get the following:";
  ItemQuery.getAll(event.id, function (items){
    body += "<ul>";
    items.forEach(function(item){
      body += "<li>" + item.name + "</li>";
    });
    body += "</ul>";
    body += "<a href='" + url +"'><h4> click here to sign up for items or to add more! </h5></a>";
    callback(body);
  });

};

var createInviteOneBody = function (event, mode) {

};

var createSettleUpBody = function (event, mode) {

};



module.exports = {
  // Uses nodemailer to send out event details to guests
  // sends initial invite initial INVITE
  post: function(req, res) {
    var eventID = req.params.eventID;
    var emails = '';
    var url = "http://localhost:3000/#/eventdetails/" + eventID;
    var body = "";
    // get all the event details
    EventQuery.getByID(eventID, function (event) {
      // create the fromDisplay
      // get creator's display name
      UserQuery.getByUserId(event.dataValues.UserId, function (creator) {
        var fromDisplay = "'";
        fromDisplay += creator.displayName;
        fromDisplay += " via beerandchip' <beeranchip@gmail.com>";
        // create the subjectLine
        var subjectLine = "Invitation to " + event.name;
        // create the emailBody
        var crea = creator.displayName.split(" ")[0];
        createInviteManyBody (crea, event, url, function (emailBody){
          // Get and format all guest emails for nodemailer
          EmailQuery.parseEmails(eventID, function(emails) {
            var mailOptions = nodemailer.createMailOptions(fromDisplay, subjectLine, emails, emailBody); // see below);
            //fromDisplay, subjectLine, eventReceivers, emailBody
            nodemailer.transporter.sendMail(mailOptions, function(err, info) {
              if(err) {
                return console.error(err);
              }
              console.log('Message sent: ' + info.response);
            });
          });
        });
      });
    });
  }
};
  // put: function(req,res) {
  //   console.log("put $$$");
  //
  // },
  // delete: function (req,res) {
  //   console.log("delete");
  // },
