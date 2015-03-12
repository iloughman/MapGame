var async = require('async');
var mongoose = require('mongoose');

mongoose.connect("mongodb://localhost/MapGame");

require('./server/db/models/category');
require('./server/db/models/user');
require('./server/db/models/question');

var User = mongoose.model('User');
var Question = mongoose.model('Question');
var Category = mongoose.model('Category');

var userData = [
	{username: "Admin"}
];

var categoryData = [
	{category: "Geographical"},
	{category: "Political"},
	{category: "Cultura"}
]

var questionData = [
	{question: "Identify the sixth largest state.", answer: "Arizona", author:"", difficulty: 2, category: "Geographical"},
	{question: "Chris Christie is the governor of this state.", answer: "New Jersey", author:"", difficulty: 1, category: "Political"}
]

mongoose.connection.on('open', function() {
	mongoose.connection.db.dropDatabase(function() {
		console.log("Adding Data");
		async.each(userData, function (user, firstDone) {
			User.create(user, firstDone);
		}, function (err) {
			console.log("Finished with users");
			User.findOne({username:"Admin"}, function (err, adminUser){
				async.each(questionData, function (question, secondDone) {
					question.author = adminUser._id;
					Question.create(question, secondDone);
				}, function (err) {
					if (err) console.log(err);
					console.log("Finished Adding Questions. Control-C to Exit.");
				})
			});
		});
	});
});