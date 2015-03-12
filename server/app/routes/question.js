'use strict';
var router = require('express').Router();
var mongoose = require('mongoose');
var Question = mongoose.model('Question');
var User = mongoose.model('User');

router.get('/findAll', function (req, res, next){
	Question.find({}, function (err, questions) {
		if (err) next(err);
		else res.json(questions);
	});
});

module.exports = router;