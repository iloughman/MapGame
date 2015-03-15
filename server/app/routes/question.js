'use strict';
var router = require('express').Router();
var mongoose = require('mongoose');
var Question = mongoose.model('Question');
var User = mongoose.model('User');

router.post('/create', function (req, res, next){
	console.log("body",req.body);
	var question = new Question(req.body);
	console.log("question", question);
	question.save(function (err, savedQuestion){
		console.log(err);
		if (err) next(err);
		else res.json(savedQuestion);
	});
});

router.get('/findAll', function (req, res, next){
	Question.find({}, function (err, questions) {
		if (err) next(err);
		else res.json(questions);
	});
});



module.exports = router;