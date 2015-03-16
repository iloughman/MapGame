'use strict';

app.factory('GameFactory', function() {

	var factory = {};

	var Game = function (){
		this.active = false;
		this.nextQuestionAvailable = false;
		this.questionNumber = 1;
		this.questionLimit = 5;
	};

	factory.createGame = function(){
		factory.game = new Game();
		return factory.game;
	};

	return factory;
});