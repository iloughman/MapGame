'use strict';
var router = require('express').Router();
var mongoose = require('mongoose');
var Question = mongoose.model('Question');
var User = mongoose.model('User');

router.post('/create', function (req, res, next){
	var question = new Question(req.body);
	question.save(function (err, savedQuestion){
		console.log(err);
		if (err) next(err);
		else res.json(savedQuestion);
	});
});

router.post('/updateRating', function (req, res, next) {
	Question.updateRating(req.body.rating, req.body.id, function (err, question){
		console.log(err);
		if (err) next(err);
		else res.json(question);
	});
});

router.get('/findAll', function (req, res, next){
	Question.find({}, function (err, questions) {
		if (err) next(err);
		else res.json(questions);
	});
});





module.exports = router;