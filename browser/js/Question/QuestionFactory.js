'use strict';

app.factory('QuestionFactory', function ($http) {
	var factory = {};
	factory.getAllQuestions = function(){
		return $http.get('/api/question/findAll').then(function (res){
			return res.data;
		});
	};
	factory.checkAnswer = function(answer,clicked){
		if (answer == clicked){
			return "correct";
		}
		else {
			return "incorrect";
		}
	}
	return factory;
});