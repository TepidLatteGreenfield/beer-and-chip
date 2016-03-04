var GuestQuery = require('../queries/guestQueries');
var ItemQuery = require('../queries/itemQueries');
var EventQuery = require('../queries/eventQueries');

module.exports = {
  get: function(req, res) {
    var eventID = req.body.eventID;
    GuestQuery.getAll(eventID, function(guests) {
      res.json(guests);
    });
  },
  // add email call when a guest is invited
  post: function(req, res) {
    var guest = req.body;
    GuestQuery.addOne(guest, function(newGuest) {
      EventQuery.incOrDecGuestNum(req.body.EventId, 1, function() {
        res.json(newGuest);
      });
    });
  },

  put: function(req, res) {
    var guestID = req.params.guestID;
    var newAttrs = req.body;
    GuestQuery.updateOne(guestID, newAttrs, function() {
      res.send();
    });
  },
  // add email call when guest is uninvited
    // email event creator
    // email guest saying if you can make it just come back!
  delete: function(req, res) {
    var guestID = req.params.guestID;
    var eventID = req.params.eventID;
    var unAssId;
    GuestQuery.findStillNeeded(eventID, function (id){
      unAssId = id;
      if ((unAssId != guestID) && (guestID)) {
        // need to add function where (BEFORE WE DELETE THE GUEST)
        // we reassign any items a deleted guest had claimed to the STILL NEEDED 'guest'
        ItemQuery.reassignUsersItems(guestID, eventID, unAssId, function(){
          GuestQuery.deleteOne(req.params.guestID, function(){
            EventQuery.incOrDecGuestNum(eventID, -1, function() {
              res.send();
            });
          });
        });
      }
    });
  }
};
