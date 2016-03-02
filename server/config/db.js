var Sequelize = require('sequelize');

module.exports = new Sequelize('BeerAndChip', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  port:1036,
  define: {
   timestamps: false
  }
});


// module.exports = new Sequelize('heroku_50c8789c054e9e5', 'b8a52638ac3cd9', 'b95b5984', {
//   host: 'us-cdbr-iron-east-03.cleardb.net',
//   dialect: 'mysql',
//   define: {
//     timestamps: false
//   }
// });
