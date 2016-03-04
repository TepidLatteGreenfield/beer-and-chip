// Require sql model
var Guest = require('../models/models').Guest;
var User = require('../models/models').User;
var EventQuery = require('./eventQueries');
var GuestQuery = require('./guestQueries');

module.exports = {
  // get all guests from an event
  // returns properly formatted emails of all guests for nodemailer call
  parseEmails: function(eventID, callback) {
    GuestQuery.getAll(eventID, function(guests) {
      var emails = "";
      for (var i = 0; i < guests.length; i++) {
        emails = emails + guests[i].email + ' ,';
      }
      emails = emails.slice(0, emails.length - 2);
      callback(emails);
    });
  }
};
  // // add one guest
  // addOne: function(guest, callback) {
  //   Guest
	//     .create(guest)
	//     .then(function(newGuest) {
	//     	callback(newGuest);
	//     });
  // },
  //
  // // add multiple guests to one event (changed to take in the whole event so we can access the creator ID)
  // addAll: function(event, guests, callback) {
  //   // Add dummy guest to hold all unassigned items
  //   guests.unshift({name: "STILL NEEDED:", EventId: event.id});
  //   // automatically create a guest entry for the event creator
  //   var creatorName = "";
  //   // find the user that created the event
  //   User.findOne({
  //     where: {id:event.UserId}
  //   })
  //   .then(function (user){
  //     //set creatorname to that user's displayname
  //     creatorName = user.dataValues.displayName;
  //     guests.push({name: creatorName, EventId: event.id});
  //     for (var i=0; i < guests.length; i++) {
  //     	guests[i].EventId = event.id;
  //     }
  //     // update number of guests on event
  //     EventQuery.updateNumberOfGuests(event.id, guests.length-1,function () {
  //       Guest
  //         .bulkCreate(guests)
  //         .then(function(newGuests) {
  //           callback(newGuests);
  //         });
  //     });
  //   });
  // },
  //
  // // update attributes of one guest
  // updateOne: function(guestID, newAttrs, callback) {
  //   Guest
  //     .update(newAttrs, {
  //       where: {id: guestID}
  //     })
  //     .then(function() {
  //       callback();
  //     })
  // },
  //
  // // delete one guest
  // deleteOne: function(guestID, callback) {
  //   Guest
  //     .destroy({
  //       where: {id: guestID}
  //     })
  //     .then(function() {
  //       callback();
  //     });
  // },
  //
  // // find the STILL NEEDED ID for any given eventID
  // findStillNeeded: function (eventID, callback) {
  //   Guest
	// 		.find({
	// 			where: {
	// 				name: "STILL NEEDED:",
	// 				EventId: eventID
	// 			}
	// 		}).then(function (guest) {
  //       callback(guest.dataValues.id);
  //     });
  // }
