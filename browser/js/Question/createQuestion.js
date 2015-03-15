'use strict';

app.directive('createQuestion', function (QuestionFactory) {
	return {
		restrict: 'E',
		templateUrl: 'js/Question/createQuestion.html',
		link: function(scope, elem, attr) {
			scope.addQuestion = function(question) {
				QuestionFactory.submitQuestion(question).then(function(res){
					console.log(res);
				});
			};
		}
	};
});