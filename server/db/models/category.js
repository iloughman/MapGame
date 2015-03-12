'use strict';
var mongoose = require('mongoose');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongodb connection error: '));

var categorySchema = new mongoose.Schema({
	category: {type: String, required: true},
	questions: [{type: mongoose.Schema.Types.ObjectId, ref: 'Question'}]
});

mongoose.model('Category', categorySchema);