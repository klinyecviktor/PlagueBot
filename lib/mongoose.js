let mongoose = require('mongoose');
let config = require('config');

mongoose.Promise = global.Promise;
mongoose.connect(config.get('db.uri'));

module.exports = mongoose;