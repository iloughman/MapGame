'use strict';

app.factory('QuestionFactory', function ($http, ScoreFactory, UserFactory, GameFactory) {
	var factory = {};

	factory.getAllQuestions = function(){
		return $http.get('/api/question/findAll').then(function (res){
			return res.data;
		});
	};

	factory.submitQuestion = function(question){
		console.log("hey");
		return $http.post('/api/question/create', question).then(function (res){
			return res.data;
		})
	}

	factory.manageAnswer = function(answer, clicked){
		if (answer == clicked && UserFactory.user.guesses > 1){
			UserFactory.user.guesses = 0;
			ScoreFactory.correct++;
			UserFactory.user.correct++;
			UserFactory.user.active = false;
			GameFactory.game.nextQuestionAvailable = true;
			if (GameFactory.game.questionNumber == GameFactory.game.questionLimit){
				GameFactory.game.active = false;
			}
			return "Correct";
		}
		else if (answer !== clicked && UserFactory.user.guesses > 1) {
			UserFactory.user.guesses--;
			return "Incorrect";
		}
		else {
			UserFactory.user.guesses = 0;
			ScoreFactory.incorrect++;
			UserFactory.user.inocrrect++;
			UserFactory.user.active = false;
			GameFactory.game.nextQuestionAvailable = true;
			if (GameFactory.game.questionNumber == GameFactory.game.questionLimit){
				GameFactory.game.active = false;
			}
			return "No more guesses";
		}
	}
	return factory;
});