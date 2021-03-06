// Require sql models
var Item = require('../models/models.js').Item;
var Guest = require('../models/models.js').Guest;
var EventQueries = require('./eventQueries');
module.exports = {
	//get all items for an event
	getAll: function(eventID, callback) {
		Item
			.findAll({
				where: {eventId: eventID}
			})
			.then(function(items){
				callback(items);
			});

	},
	//add one item
	addOne: function(item, callback) {
		Guest
			.find({
				where: {
					name: "STILL NEEDED:",
					EventId: item.EventId
				}
			})
			.then(function(guest) {
				item.GuestId = guest.id;
				Item
					.create(item)
					.then(function(newItem){
						callback(newItem);
					});
			});
	},
	//add multiple items to one event
  // CHANGE to add all items to STILL NEEDED on creation
	addAll: function(eventID, items, stillNeededId, callback) {
		// put all items on STILL NEEDED
    var costToAdd = 0;
		for (var i=0, j = 0; i < items.length; i++) {
			items[i].EventId = eventID;
			items[i].GuestId = stillNeededId;
      if(items[i].price) {
        costToAdd += Number(items[i].price);
      }
		}
    EventQueries.updateTotalCost(eventID, costToAdd, function () {
      Item
        .bulkCreate(items)
        .then(function(newItems) {
          callback(newItems);
        });
    });

	},

	// update attributes of one item
	updateOne: function(itemID, newAttrs, callback) {
		Item
			.update(newAttrs, {
				where: {id: itemID}
			})
			.then(function() {
        Item.findOne({
          where: {id: itemID}
      }).then(function(item){
        callback(item.dataValues.EventId);
      });
		});
	},
  // reassign items of one user to the STILL TO BE added
  reassignUsersItems: function(userId, eventId, unAssId, callback) {
    Item
      .findAll({
        where: {EventId: eventId,
                GuestId: userId
        }
      })
      .then(function (items) {
        return items.map(function (itemObj){
          return itemObj.id;
        });
      })
      .then(function (listOfItemIds){
        Item
    			.update({GuestId:unAssId}, {
    				where: {id: {
              $in:listOfItemIds
            }}
    			});
        callback();
      });

	},
  getCostOfOne: function(itemId, callback) {
    Item.findOne({
      where: {id: itemId}
    })
    .then(function (item) {
      callback(item.price);
    });
  },
	// delete one item
	deleteOne: function(itemID, callback) {
    Item.findOne({
      where: {id: itemID}
    }).then(function(item){
      var deletedStats = {};
      deletedStats.price = item.price;
      deletedStats.EventId = item.EventId;
      Item
  			.destroy({
  				where: {id: itemID}
  			})
  			.then(function() {
          callback(deletedStats);
        });
    });
	}
};
