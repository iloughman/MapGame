'use strict';

app.factory('QuestionFactory', function ($http, ScoreFactory, UserFactory, GameFactory) {
	var factory = {};

	factory.getAllQuestions = function(){
		return $http.get('/api/question/findAll').then(function (res){
			return res.data;
		});
	};

	factory.submitQuestion = function(question){
		return $http.post('/api/question/create', question).then(function (res){
			return res.data;
		})
	};

	factory.submitRating = function(rating,questionId) {
		if (rating){
			return $http.post('/api/question/updateRating', {id: questionId, rating:rating}).then(function(res){
				return res.data;
			})
		}
	}

	factory.manageAnswer = function(answer, clicked){
		if (answer == clicked && UserFactory.user.guesses < 3){
			UserFactory.user.guesses = 3;
			ScoreFactory.correct++;
			UserFactory.user.correct++;
			UserFactory.user.active = false;
			GameFactory.game.nextQuestionAvailable = true;
			if (GameFactory.game.questionNumber == GameFactory.game.questionLimit){
				GameFactory.game.active = false;
			}
			return "Correct";
		}
		else if (answer !== clicked && UserFactory.user.guesses < 3) {
			UserFactory.user.guesses++;
			return "Incorrect";
		}
		else {
			UserFactory.user.guesses = 3;
			ScoreFactory.incorrect++;
			UserFactory.user.incorrect++;
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