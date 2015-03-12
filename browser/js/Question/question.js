'user strict';

app.directive('question', function (QuestionFactory) {
	return {
		restrict: 'E',
		templateUrl: 'js/Question/question.html',
		link: function (scope, elem, attr){
			scope.answered = false;
			scope.answeredCorrectly =  false;
		}
	};
});