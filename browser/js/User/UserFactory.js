'use strict';

app.factory('UserFactory', function() {

	var factory = {};

	var User = function (){
		this.guesses = 3;
		this.active = false;
		this.game = true;
		this.correct = 0;
		this.incorrect = 0;
		this.nextQuestionAvailable = false;
		this.questionNumber = 1;
		this.questionLimit = 10;
	};

	factory.createUser = function(){
		factory.user = new User();
		return factory.user;
	};

	return factory;
});