angular.module('eventDetails', ['eventList'])
.controller('eventDetailsController', ['$scope', '$http', 'requestFactory', '$cookies', '$routeParams', function($scope, $http, requestFactory, $cookies, $routeParams) {
/** ADD ITEM AND ADD GUEST INPUT BOXES **/

  // Holds text input from add item and add guest input boxes
  $scope.itemName;
  $scope.guestName;
  $scope.guestEmail;
  $scope.itemPrice;
  $scope.settling = false;
  $scope.payments = [];
  $scope.average;
  // calculates easiest way to settle the bill, called in initializeDetails
  calcPayments = function () {
    // for every guest
    var payments = [];
    var avg = $scope.average;
    var under =[];
    var over =[];
    for(var key in $scope.models.guests) {
      // if the guest isn't the still needed
      if(!key.includes("STILL NEEDED")) {
        // get the guest's name and total spend
        var theName = $scope.getName(key);
        var spent = $scope.getSpent($scope.getId(key));
        var person = {name: theName};
        // if the guest spent less than average, put her in the under
        if(spent < avg) {
          person.owes = avg-spent;
          under.push(person);
        // if the guest spent more than average, put her in the over
      } else if (spent > avg) {
          person.owed = spent-avg;
          over.push(person);
        } // (if the guest spent average, they need no transactions)
      }
    }
    // sort the unders and over arrays
    under.sort(function(a,b){
      // sort the under array from low to high (owes)
      return a.owes-b.owes;
    });
    over.sort(function(a,b){
      // sort the over array from high to low owed
      return b.owed-a.owed;
    });
    // iterate from back of over array
    var underIn = 0;
    for(var overIn = 0; overIn < over.length && underIn < under.length; overIn++) {
      // declare temp payment object, set to and from
      var payment = {};
      payment.from = under[underIn].name;
      payment.to = over[overIn].name;
      // if the over person is owed more than (or exactly) what the under person owes
      if (over[overIn].owed > under[underIn].owes) {
        // make a payment from under to over for entire under owes
        var theAmount = under[underIn].owes;
        payment.amount = theAmount;
        payments.push(payment);
        //update owed and owes
        //the under now owes nothing
        under[underIn].owes = 0;
        // the amount the over has coming is lessened by the payment amount
        over[overIn].owed -= theAmount;
        // increment underIn (meaning we're done with the first under)
        underIn++;
        // decrement overIn(so that next time through the FOR, we're on the same over)
        overIn--;
        // ELSE: if the over person is owed LESS than the under OWES
      } else if (over[overIn].owed < under[underIn].owes) {
        // make a payment from under to over for entire over owed
        var theAmount = over[overIn].owed;
        payment.amount = theAmount;
        payments.push(payment);
        //update owed and owes
        // the over is now owed nothing
        over[overIn].owed = 0;
        // the under's debt is lessened by amount paid
        under[underIn].owes -= theAmount;
        // we don't need to change either index: we still need the under, and we're done with the over
      } else { // IF what over is owed is exactly what under owes
        // make a payment from under to over for entire under owes
        var theAmount = over[overIn].owed;
        payment.amount = theAmount;
        payments.push(payment);
        //update owed and owes
        over[overIn].owed = 0;
        under[underIn].owes = 0;
        // increment underIn (we're done with the under, over will auto inc)
        underIn++;
      }
    }
    $scope.payments = payments;// console.log($scope.payments);
  };
  // clear text in text field, takes a string as input
  $scope.resetField = function(field) {
    $scope[field] = "";
  };
  //makes settleUp box appear
  $scope.settleUp = function () {
    $scope.settling = !$scope.settling;
  };

  // adds a property on item used to decide to show value
  $scope.isSelected = function(item) {
    item.show = !(item.show);
  };

  // changes the price of an item
  $scope.changePriceOfItem = function(item, newPrice) {
    item.show = false;
    requestFactory.updateSomePropOnItem(item, {price: newPrice})
    .then(function () {
      socket.emit('eventDetails change');
    });
    item.price = newPrice;
  };

  // sends a POST request to insert a new item
  $scope.addItemFunc = function(itemName, itemPrice){
    var newItem = {
      EventId: $cookies.get('eventID'),
      name: itemName, // this is coming from ng-model
      price: itemPrice
    };
    return $http({
      method: 'POST',
      url: '/api/items',
      data: newItem
    }).then(function(){
        $scope.resetField('itemName'); // reset text field
        $scope.resetField('itemPrice');
        socket.emit('eventDetails change');
    });

  };

  // sends a POST request to insert a new guest
  $scope.addGuestFunc = function(guestName, guestEmail){
    var newGuest = {
      EventId: $cookies.get('eventID'),
      name: guestName, //this is coming from ng-model
      email: guestEmail
    };
    return $http({
      method: 'POST',
      url: '/api/guests',
      data: newGuest
    }).then(function(){
        $scope.resetField('guestName');
        $scope.resetField('guestEmail');
        socket.emit('eventDetails change');
    });

  };

  $scope.deleteGuest = function(guestId){
    return $http({
      method: 'DELETE',
      url: '/api/guests/' + guestId +'/' + $routeParams.eventID
    }).then(function(um){
      socket.emit('eventDetails change');
    });

  };
  // function that determines whether a user is the still needed or the creatorName
  $scope.isUninviteable = function (user) {
    if ($scope.details.creatorName) {
      var userName = $scope.getName(user);
      var userId = $scope.getId(user);
      var stringUser = userName.toString();
      if (stringUser.trim() == $scope.details.creatorName.trim()) {
        return false;
      } else {
        return $scope.isPerson(user);
      }
    }
  };

  $scope.isPerson = function (user) {
    var userId = $scope.getId(user);
    if (userId == $scope.details.guests[0].id) {
      return false;
    } else {
      return true;
    }
  };

/** DRAG AND DROP TABLE **/

  // Holds guests and the items they are bringing (guests)
  // The selected property is specific to drag-and-drop (which item is selected)
  $scope.models = {
    selected: null,
    guests: {} // each guest will be a column in the table
  };

  // ng-model for storing event details
  $scope.details;

  // For simplicity when refering to the ng-model guests
  // var guests =  $scope.models.guests;

  var initializeDetails = function() {
    $scope.models.guests = {};
    // Makes request to server for all event details
    requestFactory.getEvents($routeParams.eventID)
      .then(function(details) {
        // assigns event details to ng-model details
        $scope.details = details;
        // $scope.models.guests = details.guests;
        if ($scope.details.event.totalCost === 0) {
          $scope.average = "free!";
        } else {
          $scope.average = $scope.details.event.totalCost/$scope.details.event.numGuests;
        }

        // temporarily holds guestId: [items]
        var temp = {};

        // Populate temp
        for (var j = 0; j < details.items.length; j++) {
          var GuestId = details.items[j].GuestId;
          var item = details.items[j];
          if (temp[GuestId]) {
            temp[GuestId].push(item);
          } else {
            temp[GuestId] = [item];
          }
        }

        // Populate the ng-model guests
        for (var i = 0; i < details.guests.length; i++){
          var guestName = details.guests[i].name;
          var guestId = details.guests[i].id;
          // Adds guestName and guestId to ng-model guests
          // and assigns guests an items array or an empty array
          $scope.models.guests[guestName + ' ' + guestId] = temp[guestId] ? temp[guestId] : [];
        }
        // added this so next then has details
        return details;
      })
      // this function is to get the creator name from the database
      .then(function(details) {
        return requestFactory.getUserDetails(details.event.UserId);
      })
      .then(function(creatorName) {
        $scope.details.creatorName = creatorName.data;
        calcPayments();
      });
  };

  // Fires when an item is moved to a column
  $scope.reassignItem = function(item, guestInfo) {
    var guestId = $scope.getId(guestInfo);
    requestFactory.updateItem(item, guestId)
    .then(function () {
      socket.emit('eventDetails change');
    });
    // nessesary for drag-and-drop visualization
    // return false to reject visual update
    return item;
  };

  // parse guestInfo for guest id
  $scope.getId = function(guestInfo) {
    // var name = guestInfo.match(/([^\s])+/g);
    // return name[1];
    var name = guestInfo;
    name = name.split(' ');
    return name[name.length - 1];
  };

  //parse guestInfo and $scope.details for price differential/person
  $scope.getSpent = function (id) {
    return $scope.details.items.reduce(function(acc, item){
      if(item.GuestId == id) {
        return acc + item.price;
      } else {
        return acc;
      }
    }, 0);
  };

  // parse guestInfo for guest name
  $scope.getName = function(guestInfo) {
    // var name = guestInfo.match(/([^\s])+/);
    // return name[0];
    var name;
    name = guestInfo;
    name.trim();
    name = name.split(" ");
    var newName = "";
    for(var i = 0; i < name.length - 1; i++) {
      newName += name[i] + ' ';
    }
    return newName;
  };

  $scope.deleteItem = function (itemId) {
    requestFactory.deleteItem(itemId)
    .then(function () {
      socket.emit('eventDetails change');
    });
  }
/** EMAIL **/
  // sends unique eventDetails url to all guests
  $scope.emailInvites = function() {
    var eventID = $cookies.get("eventID");
    requestFactory.sendInvites(eventID);
  };

/** INITIALIZE ON PAGE LOAD **/
  initializeDetails();

  socket.on('eventDetails change', function () {
    initializeDetails();
  });

}])

.factory('requestFactory', function($http, $cookies) {
  var getEvents = function(eventID) {
    return $http({
      method: 'GET',
      url: '/api/eventDetails/' + eventID
    })
    .then(function(res) {
      return res.data;
    });
  };

  var sendInvites = function(eventID) {
    return $http({
      method: 'POST',
      url: '/api/email/' + eventID
    });
  };

  var updateItem = function(item, guestId) {
    return $http({
      method: 'PUT',
      url: '/api/items/' + item.id,
      data: {GuestId: guestId}
    })
    .then(function() {
      console.log("UPDATED DB");
    });
  };

  var updateSomePropOnItem = function(item, propAndValueObject) {
    return $http({
      method: 'PUT',
      url: '/api/items/' + item.id,
      data: propAndValueObject
    })
    .then(function() {
      console.log("UPDATED DB");
    });
  };

  var getUserDetails = function(userId) {
    return $http( {
      method: 'GET',
      url: '/api/users/' + userId,
    })
    .then(function(userName) {
      return userName;
    });


  };

  var deleteItem = function (itemId) {
    return $http({
      method: 'DELETE',
      url: '/api/items/' + itemId
    });
  };

  return {
    getEvents: getEvents,
    sendInvites: sendInvites,
    updateItem: updateItem,
    getUserDetails: getUserDetails,
    deleteItem: deleteItem,
    updateSomePropOnItem: updateSomePropOnItem
  };
});
