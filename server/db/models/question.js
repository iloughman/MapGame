'use strict';
var mongoose = require('mongoose');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongodb connection error: '));

var questionSchema = new mongoose.Schema({
	question: {type: String, required: true},
	answer: {type: String, required: true},
	author: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	difficulty: {type: Number, min: 1, max: 3, required: true, default: 1},
	category: {type: String},
	ratings: [{type: Number, min:1, max: 4}],
	averageRating: {type: Number, min:1, max: 4}
});

questionSchema.statics.updateRating = function (rating, questionId, cb) {
	return this.findByIdAndUpdate(questionId, {$push: {"ratings": rating}}, cb);
};

mongoose.model('Question', questionSchema);