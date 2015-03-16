'use strict';
var app = angular.module('MapGame', ['ui.router', 'fsaPreBuilt']);


'use strict';

app.directive('navBar', function () {
	return {
		restrict: 'E',
		templateUrl: 'js/Navbar/navBar.html'
	};
});
'use strict';

app.config(function ($stateProvider) {

    $stateProvider.state('mainMap', {
        url: '/',
        templateUrl: 'js/MainMap/mainMap.html',
        controller: 'mainMapCtrl'
    });
});

app.controller('mainMapCtrl', function ($scope, QuestionFactory, UserFactory, GameFactory, ScoreFactory) {

    var width = 800;
    var height = 550;

    var svg = d3.select("svg")
     .attr("width", width)
     .attr("height", height);

    var projection = d3.geo.albersUsa()
        .scale(1000)
        .translate([width*(0.5), height / 2]);

    var path = d3.geo.path()
                .projection(projection);

    $scope.state = "(click a on state to guess)";
    $scope.guessResult = null;
    $scope.showAnswerResult = false;
    $scope.questionActive = false;

    d3.json("states.json", function (error, states) {
     if (error) return console.log(error);
     console.log(states);

     svg.selectAll("path")
         .data(states.features)
         .enter().append("path")
         .attr("d",path)
         .attr("class", function(d) {
            return "state " + d.STUSPS
         })
         .attr("stroke", "white")
         .attr("fill", function (d,i) {
            d.properties.color = '#'+Math.floor(Math.random()*16777215).toString(16);
            return d.properties.color;
            // return '#'+i+'c';
         })
         .on('click', function (d,i) {
            var state = d.properties.NAME;
            $scope.showAnswerResult = true;
            $scope.$apply(function(){
                $scope.state = state;
                $scope.guessResult = QuestionFactory.manageAnswer($scope.currentQuestion.answer, state);
            });
         })
         .on('mouseenter', function (d,i) {
             d3.select(this).style("fill","yellow");
             d3.select(this).style("stroke","black");
             var state = d.properties.NAME;
             if (!$scope.guessResult || $scope.guessResult !== "correct"){
                 $scope.$apply(function(){
                     $scope.state = state;
                 })
             }
         })
         .on('mouseleave', function(d,i) {
             d3.select(this).style("fill",d.properties.color);
             d3.select(this).style("stroke","white");  
             $scope.showAnswerResult = false;                   
         });
    });

    $scope.questionAvailable = true;
    $scope.questions;
    $scope.randomQuestion;

    $scope.fetchRandomQuestion = function () {
        QuestionFactory.getAllQuestions().then(function(questions){
            var numQuestions = questions.length;
            $scope.randomQuestion = questions[Math.floor(Math.random()*numQuestions)];
            $scope.currentQuestion = $scope.randomQuestion;
            $scope.state = "";
            $scope.guessResult;
            $scope.user = UserFactory.createUser();
            $scope.user.active = true;
        });
    };

    $scope.beginGame = function (){
        $scope.game = GameFactory.createGame();
        $scope.game.active = true;
        $scope.user = UserFactory.createUser();
        $scope.fetchAllQuestions();
    }

    $scope.quitGame = function () {
        $scope.questions = null;
        $scope.currentQuestion = null;
        $scope.user = null;
        $scope.game.active = false;
    }

    $scope.fetchAllQuestions = function () {
        QuestionFactory.getAllQuestions().then(function (questions) {
            $scope.game.nextQuestionAvailable = false;
            $scope.questions = questions;
            //Put this in questionFactory
            $scope.questions.forEach(function (question) {
                var average = 0;
                question.ratings.forEach(function(rating){
                    average += Number(rating);
                });
                question.averageRating = average/question.ratings.length;
            });
            var numQuestions = questions.length;
            var questionIndex = Math.floor(Math.random()*numQuestions)+1;
            $scope.currentQuestion = $scope.questions[questionIndex];
            $scope.questions.splice(questionIndex,1);
        });
    };

    $scope.nextQuestion = function (rating,currentQuestion) {
        // if (rating){
        //     QuestionFactory.submitRating(rating, currentQuestion._id).then(function (response) {
        //         $scope.rating=null;
        //     });
        // };
        $scope.rating = null;
        $scope.game.questionNumber++;
        $scope.user.guesses = 1;
        console.log($scope.questions);
        $scope.game.nextQuestionAvailable = false;
        var numQuestions = $scope.questions.length;
        var questionIndex = Math.floor(Math.random()*numQuestions)+1;
        $scope.currentQuestion = $scope.questions[questionIndex];
        $scope.questions.splice(questionIndex,1);
    }

    $scope.createQuestionForm = false;

    $scope.createQuestionDisplay = function () {
        $scope.createQuestionForm = true;
    };
    $scope.hideQuestionDisplay = function () {
        $scope.createQuestionForm = false;
    }

    $scope.score = ScoreFactory;

});


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
'use strict';

app.directive('createQuestion', function (QuestionFactory, $timeout) {
	return {
		restrict: 'E',
		templateUrl: 'js/Question/createQuestion.html',
		link: function(scope, elem, attr) {
			scope.addQuestion = function(question) {
				QuestionFactory.submitQuestion(question).then(function(res){
					scope.question = {};
					scope.submitted = true;
					$timeout(function(){
						scope.submitted = false;
					}, 2000);				
				});
			};
		}
	};
});

app.directive('state', function () {
	return {
		require: 'ngModel',
		link: function (scope, elem, attrs, ctrl) {
			ctrl.$validators.state = function (modelValue, viewValue){
				viewValue = viewValue.toUpperCase();
				if (stateArray.indexOf(viewValue) > -1){
					return true;
				} else {
					return false;
				};
			};
		}
	};
});

var usStates = [
    { name: 'ALABAMA', abbreviation: 'AL'},
    { name: 'ALASKA', abbreviation: 'AK'},
    { name: 'AMERICAN SAMOA', abbreviation: 'AS'},
    { name: 'ARIZONA', abbreviation: 'AZ'},
    { name: 'ARKANSAS', abbreviation: 'AR'},
    { name: 'CALIFORNIA', abbreviation: 'CA'},
    { name: 'COLORADO', abbreviation: 'CO'},
    { name: 'CONNECTICUT', abbreviation: 'CT'},
    { name: 'DELAWARE', abbreviation: 'DE'},
    { name: 'DISTRICT OF COLUMBIA', abbreviation: 'DC'},
    { name: 'FEDERATED STATES OF MICRONESIA', abbreviation: 'FM'},
    { name: 'FLORIDA', abbreviation: 'FL'},
    { name: 'GEORGIA', abbreviation: 'GA'},
    { name: 'GUAM', abbreviation: 'GU'},
    { name: 'HAWAII', abbreviation: 'HI'},
    { name: 'IDAHO', abbreviation: 'ID'},
    { name: 'ILLINOIS', abbreviation: 'IL'},
    { name: 'INDIANA', abbreviation: 'IN'},
    { name: 'IOWA', abbreviation: 'IA'},
    { name: 'KANSAS', abbreviation: 'KS'},
    { name: 'KENTUCKY', abbreviation: 'KY'},
    { name: 'LOUISIANA', abbreviation: 'LA'},
    { name: 'MAINE', abbreviation: 'ME'},
    { name: 'MARSHALL ISLANDS', abbreviation: 'MH'},
    { name: 'MARYLAND', abbreviation: 'MD'},
    { name: 'MASSACHUSETTS', abbreviation: 'MA'},
    { name: 'MICHIGAN', abbreviation: 'MI'},
    { name: 'MINNESOTA', abbreviation: 'MN'},
    { name: 'MISSISSIPPI', abbreviation: 'MS'},
    { name: 'MISSOURI', abbreviation: 'MO'},
    { name: 'MONTANA', abbreviation: 'MT'},
    { name: 'NEBRASKA', abbreviation: 'NE'},
    { name: 'NEVADA', abbreviation: 'NV'},
    { name: 'NEW HAMPSHIRE', abbreviation: 'NH'},
    { name: 'NEW JERSEY', abbreviation: 'NJ'},
    { name: 'NEW MEXICO', abbreviation: 'NM'},
    { name: 'NEW YORK', abbreviation: 'NY'},
    { name: 'NORTH CAROLINA', abbreviation: 'NC'},
    { name: 'NORTH DAKOTA', abbreviation: 'ND'},
    { name: 'NORTHERN MARIANA ISLANDS', abbreviation: 'MP'},
    { name: 'OHIO', abbreviation: 'OH'},
    { name: 'OKLAHOMA', abbreviation: 'OK'},
    { name: 'OREGON', abbreviation: 'OR'},
    { name: 'PALAU', abbreviation: 'PW'},
    { name: 'PENNSYLVANIA', abbreviation: 'PA'},
    { name: 'PUERTO RICO', abbreviation: 'PR'},
    { name: 'RHODE ISLAND', abbreviation: 'RI'},
    { name: 'SOUTH CAROLINA', abbreviation: 'SC'},
    { name: 'SOUTH DAKOTA', abbreviation: 'SD'},
    { name: 'TENNESSEE', abbreviation: 'TN'},
    { name: 'TEXAS', abbreviation: 'TX'},
    { name: 'UTAH', abbreviation: 'UT'},
    { name: 'VERMONT', abbreviation: 'VT'},
    { name: 'VIRGIN ISLANDS', abbreviation: 'VI'},
    { name: 'VIRGINIA', abbreviation: 'VA'},
    { name: 'WASHINGTON', abbreviation: 'WA'},
    { name: 'WEST VIRGINIA', abbreviation: 'WV'},
    { name: 'WISCONSIN', abbreviation: 'WI'},
    { name: 'WYOMING', abbreviation: 'WY' }
];

var stateArray = [];

usStates.forEach(function(stateObj) {
	stateArray.push(stateObj.name)
});
'use strict';

app.directive('question', function () {
	return {
		restrict: 'E',
		templateUrl: 'js/Question/question.html'
	};
});
'use strict';

app.controller('questionCtrl', function ($scope, QuestionFactory, UserFactory){
	
})
'use strict';

app.factory('ScoreFactory', function() {
	var factory = {
		correct: 0,
		incorrect: 0
	};
	return factory;
});
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
'use strict';

app.factory('UserFactory', function() {

	var factory = {};

	var User = function (){
		this.guesses = 1;
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
(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.
    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('fsaPreBuilt', []);

    app.factory('Socket', function ($location) {

        if (!window.io) throw new Error('socket.io not found!');

        var socket;

        if ($location.$$port) {
            socket = io('http://localhost:1337');
        } else {
            socket = io('/');
        }

        return socket;

    });

    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push([
            '$injector',
            function ($injector) {
                return $injector.get('AuthInterceptor');
            }
        ]);
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function (response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

        var onSuccessfulLogin = function (response) {
            var data = response.data;
            Session.create(data.id, data.user);
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return data.user;
        };

        this.getLoggedInUser = function () {

            if (this.isAuthenticated()) {
                return $q.when({ user: Session.user });
            }

            return $http.get('/session').then(onSuccessfulLogin).catch(function () {
                return null;
            });

        };

        this.login = function (credentials) {
            return $http.post('/login', credentials).then(onSuccessfulLogin);
        };

        this.logout = function () {
            return $http.get('/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };

        this.isAuthenticated = function () {
            return !!Session.user;
        };

    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, this.destroy);
        $rootScope.$on(AUTH_EVENTS.sessionTimeout, this.destroy);

        this.create = function (sessionId, user) {
            this.id = sessionId;
            this.user = user;
        };

        this.destroy = function () {
            this.id = null;
            this.user = null;
        };

    });

})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIk5hdmJhci9uYXZCYXIuanMiLCJNYWluTWFwL21haW5NYXAuanMiLCJRdWVzdGlvbi9RdWVzdGlvbkZhY3RvcnkuanMiLCJRdWVzdGlvbi9jcmVhdGVRdWVzdGlvbi5qcyIsIlF1ZXN0aW9uL3F1ZXN0aW9uLmpzIiwiUXVlc3Rpb24vcXVlc3Rpb25DdHJsLmpzIiwiU2NvcmUvU2NvcmVGYWN0b3J5LmpzIiwiVXNlci9HYW1lRmFjdG9yeS5qcyIsIlVzZXIvVXNlckZhY3RvcnkuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xudmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdNYXBHYW1lJywgWyd1aS5yb3V0ZXInLCAnZnNhUHJlQnVpbHQnXSk7XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnbmF2QmFyJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9OYXZiYXIvbmF2QmFyLmh0bWwnXG5cdH07XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWFpbk1hcCcsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvTWFpbk1hcC9tYWluTWFwLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnbWFpbk1hcEN0cmwnXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ21haW5NYXBDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgUXVlc3Rpb25GYWN0b3J5LCBVc2VyRmFjdG9yeSwgR2FtZUZhY3RvcnksIFNjb3JlRmFjdG9yeSkge1xuXG4gICAgdmFyIHdpZHRoID0gODAwO1xuICAgIHZhciBoZWlnaHQgPSA1NTA7XG5cbiAgICB2YXIgc3ZnID0gZDMuc2VsZWN0KFwic3ZnXCIpXG4gICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGgpXG4gICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCk7XG5cbiAgICB2YXIgcHJvamVjdGlvbiA9IGQzLmdlby5hbGJlcnNVc2EoKVxuICAgICAgICAuc2NhbGUoMTAwMClcbiAgICAgICAgLnRyYW5zbGF0ZShbd2lkdGgqKDAuNSksIGhlaWdodCAvIDJdKTtcblxuICAgIHZhciBwYXRoID0gZDMuZ2VvLnBhdGgoKVxuICAgICAgICAgICAgICAgIC5wcm9qZWN0aW9uKHByb2plY3Rpb24pO1xuXG4gICAgJHNjb3BlLnN0YXRlID0gXCIoY2xpY2sgYSBvbiBzdGF0ZSB0byBndWVzcylcIjtcbiAgICAkc2NvcGUuZ3Vlc3NSZXN1bHQgPSBudWxsO1xuICAgICRzY29wZS5zaG93QW5zd2VyUmVzdWx0ID0gZmFsc2U7XG4gICAgJHNjb3BlLnF1ZXN0aW9uQWN0aXZlID0gZmFsc2U7XG5cbiAgICBkMy5qc29uKFwic3RhdGVzLmpzb25cIiwgZnVuY3Rpb24gKGVycm9yLCBzdGF0ZXMpIHtcbiAgICAgaWYgKGVycm9yKSByZXR1cm4gY29uc29sZS5sb2coZXJyb3IpO1xuICAgICBjb25zb2xlLmxvZyhzdGF0ZXMpO1xuXG4gICAgIHN2Zy5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgICAuZGF0YShzdGF0ZXMuZmVhdHVyZXMpXG4gICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgICAuYXR0cihcImRcIixwYXRoKVxuICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJzdGF0ZSBcIiArIGQuU1RVU1BTXG4gICAgICAgICB9KVxuICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJ3aGl0ZVwiKVxuICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkLGkpIHtcbiAgICAgICAgICAgIGQucHJvcGVydGllcy5jb2xvciA9ICcjJytNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMTY3NzcyMTUpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgIHJldHVybiBkLnByb3BlcnRpZXMuY29sb3I7XG4gICAgICAgICAgICAvLyByZXR1cm4gJyMnK2krJ2MnO1xuICAgICAgICAgfSlcbiAgICAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoZCxpKSB7XG4gICAgICAgICAgICB2YXIgc3RhdGUgPSBkLnByb3BlcnRpZXMuTkFNRTtcbiAgICAgICAgICAgICRzY29wZS5zaG93QW5zd2VyUmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZ3Vlc3NSZXN1bHQgPSBRdWVzdGlvbkZhY3RvcnkubWFuYWdlQW5zd2VyKCRzY29wZS5jdXJyZW50UXVlc3Rpb24uYW5zd2VyLCBzdGF0ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgIH0pXG4gICAgICAgICAub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbiAoZCxpKSB7XG4gICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwiZmlsbFwiLFwieWVsbG93XCIpO1xuICAgICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS5zdHlsZShcInN0cm9rZVwiLFwiYmxhY2tcIik7XG4gICAgICAgICAgICAgdmFyIHN0YXRlID0gZC5wcm9wZXJ0aWVzLk5BTUU7XG4gICAgICAgICAgICAgaWYgKCEkc2NvcGUuZ3Vlc3NSZXN1bHQgfHwgJHNjb3BlLmd1ZXNzUmVzdWx0ICE9PSBcImNvcnJlY3RcIil7XG4gICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdGF0ZSA9IHN0YXRlO1xuICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgIH1cbiAgICAgICAgIH0pXG4gICAgICAgICAub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbihkLGkpIHtcbiAgICAgICAgICAgICBkMy5zZWxlY3QodGhpcykuc3R5bGUoXCJmaWxsXCIsZC5wcm9wZXJ0aWVzLmNvbG9yKTtcbiAgICAgICAgICAgICBkMy5zZWxlY3QodGhpcykuc3R5bGUoXCJzdHJva2VcIixcIndoaXRlXCIpOyAgXG4gICAgICAgICAgICAgJHNjb3BlLnNob3dBbnN3ZXJSZXN1bHQgPSBmYWxzZTsgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgICRzY29wZS5xdWVzdGlvbkF2YWlsYWJsZSA9IHRydWU7XG4gICAgJHNjb3BlLnF1ZXN0aW9ucztcbiAgICAkc2NvcGUucmFuZG9tUXVlc3Rpb247XG5cbiAgICAkc2NvcGUuZmV0Y2hSYW5kb21RdWVzdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgUXVlc3Rpb25GYWN0b3J5LmdldEFsbFF1ZXN0aW9ucygpLnRoZW4oZnVuY3Rpb24ocXVlc3Rpb25zKXtcbiAgICAgICAgICAgIHZhciBudW1RdWVzdGlvbnMgPSBxdWVzdGlvbnMubGVuZ3RoO1xuICAgICAgICAgICAgJHNjb3BlLnJhbmRvbVF1ZXN0aW9uID0gcXVlc3Rpb25zW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpudW1RdWVzdGlvbnMpXTtcbiAgICAgICAgICAgICRzY29wZS5jdXJyZW50UXVlc3Rpb24gPSAkc2NvcGUucmFuZG9tUXVlc3Rpb247XG4gICAgICAgICAgICAkc2NvcGUuc3RhdGUgPSBcIlwiO1xuICAgICAgICAgICAgJHNjb3BlLmd1ZXNzUmVzdWx0O1xuICAgICAgICAgICAgJHNjb3BlLnVzZXIgPSBVc2VyRmFjdG9yeS5jcmVhdGVVc2VyKCk7XG4gICAgICAgICAgICAkc2NvcGUudXNlci5hY3RpdmUgPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmJlZ2luR2FtZSA9IGZ1bmN0aW9uICgpe1xuICAgICAgICAkc2NvcGUuZ2FtZSA9IEdhbWVGYWN0b3J5LmNyZWF0ZUdhbWUoKTtcbiAgICAgICAgJHNjb3BlLmdhbWUuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLnVzZXIgPSBVc2VyRmFjdG9yeS5jcmVhdGVVc2VyKCk7XG4gICAgICAgICRzY29wZS5mZXRjaEFsbFF1ZXN0aW9ucygpO1xuICAgIH1cblxuICAgICRzY29wZS5xdWl0R2FtZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLnF1ZXN0aW9ucyA9IG51bGw7XG4gICAgICAgICRzY29wZS5jdXJyZW50UXVlc3Rpb24gPSBudWxsO1xuICAgICAgICAkc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICRzY29wZS5nYW1lLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH1cblxuICAgICRzY29wZS5mZXRjaEFsbFF1ZXN0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgUXVlc3Rpb25GYWN0b3J5LmdldEFsbFF1ZXN0aW9ucygpLnRoZW4oZnVuY3Rpb24gKHF1ZXN0aW9ucykge1xuICAgICAgICAgICAgJHNjb3BlLmdhbWUubmV4dFF1ZXN0aW9uQXZhaWxhYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUucXVlc3Rpb25zID0gcXVlc3Rpb25zO1xuICAgICAgICAgICAgLy9QdXQgdGhpcyBpbiBxdWVzdGlvbkZhY3RvcnlcbiAgICAgICAgICAgICRzY29wZS5xdWVzdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAocXVlc3Rpb24pIHtcbiAgICAgICAgICAgICAgICB2YXIgYXZlcmFnZSA9IDA7XG4gICAgICAgICAgICAgICAgcXVlc3Rpb24ucmF0aW5ncy5mb3JFYWNoKGZ1bmN0aW9uKHJhdGluZyl7XG4gICAgICAgICAgICAgICAgICAgIGF2ZXJhZ2UgKz0gTnVtYmVyKHJhdGluZyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcXVlc3Rpb24uYXZlcmFnZVJhdGluZyA9IGF2ZXJhZ2UvcXVlc3Rpb24ucmF0aW5ncy5sZW5ndGg7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBudW1RdWVzdGlvbnMgPSBxdWVzdGlvbnMubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIHF1ZXN0aW9uSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqbnVtUXVlc3Rpb25zKSsxO1xuICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRRdWVzdGlvbiA9ICRzY29wZS5xdWVzdGlvbnNbcXVlc3Rpb25JbmRleF07XG4gICAgICAgICAgICAkc2NvcGUucXVlc3Rpb25zLnNwbGljZShxdWVzdGlvbkluZGV4LDEpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLm5leHRRdWVzdGlvbiA9IGZ1bmN0aW9uIChyYXRpbmcsY3VycmVudFF1ZXN0aW9uKSB7XG4gICAgICAgIC8vIGlmIChyYXRpbmcpe1xuICAgICAgICAvLyAgICAgUXVlc3Rpb25GYWN0b3J5LnN1Ym1pdFJhdGluZyhyYXRpbmcsIGN1cnJlbnRRdWVzdGlvbi5faWQpLnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgIC8vICAgICAgICAgJHNjb3BlLnJhdGluZz1udWxsO1xuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vIH07XG4gICAgICAgICRzY29wZS5yYXRpbmcgPSBudWxsO1xuICAgICAgICAkc2NvcGUuZ2FtZS5xdWVzdGlvbk51bWJlcisrO1xuICAgICAgICAkc2NvcGUudXNlci5ndWVzc2VzID0gMTtcbiAgICAgICAgY29uc29sZS5sb2coJHNjb3BlLnF1ZXN0aW9ucyk7XG4gICAgICAgICRzY29wZS5nYW1lLm5leHRRdWVzdGlvbkF2YWlsYWJsZSA9IGZhbHNlO1xuICAgICAgICB2YXIgbnVtUXVlc3Rpb25zID0gJHNjb3BlLnF1ZXN0aW9ucy5sZW5ndGg7XG4gICAgICAgIHZhciBxdWVzdGlvbkluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKm51bVF1ZXN0aW9ucykrMTtcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRRdWVzdGlvbiA9ICRzY29wZS5xdWVzdGlvbnNbcXVlc3Rpb25JbmRleF07XG4gICAgICAgICRzY29wZS5xdWVzdGlvbnMuc3BsaWNlKHF1ZXN0aW9uSW5kZXgsMSk7XG4gICAgfVxuXG4gICAgJHNjb3BlLmNyZWF0ZVF1ZXN0aW9uRm9ybSA9IGZhbHNlO1xuXG4gICAgJHNjb3BlLmNyZWF0ZVF1ZXN0aW9uRGlzcGxheSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLmNyZWF0ZVF1ZXN0aW9uRm9ybSA9IHRydWU7XG4gICAgfTtcbiAgICAkc2NvcGUuaGlkZVF1ZXN0aW9uRGlzcGxheSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLmNyZWF0ZVF1ZXN0aW9uRm9ybSA9IGZhbHNlO1xuICAgIH1cblxuICAgICRzY29wZS5zY29yZSA9IFNjb3JlRmFjdG9yeTtcblxufSk7XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ1F1ZXN0aW9uRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCwgU2NvcmVGYWN0b3J5LCBVc2VyRmFjdG9yeSwgR2FtZUZhY3RvcnkpIHtcblx0dmFyIGZhY3RvcnkgPSB7fTtcblxuXHRmYWN0b3J5LmdldEFsbFF1ZXN0aW9ucyA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9xdWVzdGlvbi9maW5kQWxsJykudGhlbihmdW5jdGlvbiAocmVzKXtcblx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHR9KTtcblx0fTtcblxuXHRmYWN0b3J5LnN1Ym1pdFF1ZXN0aW9uID0gZnVuY3Rpb24ocXVlc3Rpb24pe1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3F1ZXN0aW9uL2NyZWF0ZScsIHF1ZXN0aW9uKS50aGVuKGZ1bmN0aW9uIChyZXMpe1xuXHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdH0pXG5cdH07XG5cblx0ZmFjdG9yeS5zdWJtaXRSYXRpbmcgPSBmdW5jdGlvbihyYXRpbmcscXVlc3Rpb25JZCkge1xuXHRcdGlmIChyYXRpbmcpe1xuXHRcdFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvcXVlc3Rpb24vdXBkYXRlUmF0aW5nJywge2lkOiBxdWVzdGlvbklkLCByYXRpbmc6cmF0aW5nfSkudGhlbihmdW5jdGlvbihyZXMpe1xuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XG5cdFx0XHR9KVxuXHRcdH1cblx0fVxuXG5cdGZhY3RvcnkubWFuYWdlQW5zd2VyID0gZnVuY3Rpb24oYW5zd2VyLCBjbGlja2VkKXtcblx0XHRpZiAoYW5zd2VyID09IGNsaWNrZWQgJiYgVXNlckZhY3RvcnkudXNlci5ndWVzc2VzIDwgMyl7XG5cdFx0XHRVc2VyRmFjdG9yeS51c2VyLmd1ZXNzZXMgPSAzO1xuXHRcdFx0U2NvcmVGYWN0b3J5LmNvcnJlY3QrKztcblx0XHRcdFVzZXJGYWN0b3J5LnVzZXIuY29ycmVjdCsrO1xuXHRcdFx0VXNlckZhY3RvcnkudXNlci5hY3RpdmUgPSBmYWxzZTtcblx0XHRcdEdhbWVGYWN0b3J5LmdhbWUubmV4dFF1ZXN0aW9uQXZhaWxhYmxlID0gdHJ1ZTtcblx0XHRcdGlmIChHYW1lRmFjdG9yeS5nYW1lLnF1ZXN0aW9uTnVtYmVyID09IEdhbWVGYWN0b3J5LmdhbWUucXVlc3Rpb25MaW1pdCl7XG5cdFx0XHRcdEdhbWVGYWN0b3J5LmdhbWUuYWN0aXZlID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gXCJDb3JyZWN0XCI7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKGFuc3dlciAhPT0gY2xpY2tlZCAmJiBVc2VyRmFjdG9yeS51c2VyLmd1ZXNzZXMgPCAzKSB7XG5cdFx0XHRVc2VyRmFjdG9yeS51c2VyLmd1ZXNzZXMrKztcblx0XHRcdHJldHVybiBcIkluY29ycmVjdFwiO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdFVzZXJGYWN0b3J5LnVzZXIuZ3Vlc3NlcyA9IDM7XG5cdFx0XHRTY29yZUZhY3RvcnkuaW5jb3JyZWN0Kys7XG5cdFx0XHRVc2VyRmFjdG9yeS51c2VyLmluY29ycmVjdCsrO1xuXHRcdFx0VXNlckZhY3RvcnkudXNlci5hY3RpdmUgPSBmYWxzZTtcblx0XHRcdEdhbWVGYWN0b3J5LmdhbWUubmV4dFF1ZXN0aW9uQXZhaWxhYmxlID0gdHJ1ZTtcblx0XHRcdGlmIChHYW1lRmFjdG9yeS5nYW1lLnF1ZXN0aW9uTnVtYmVyID09IEdhbWVGYWN0b3J5LmdhbWUucXVlc3Rpb25MaW1pdCl7XG5cdFx0XHRcdEdhbWVGYWN0b3J5LmdhbWUuYWN0aXZlID0gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gXCJObyBtb3JlIGd1ZXNzZXNcIjtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGZhY3Rvcnk7XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ2NyZWF0ZVF1ZXN0aW9uJywgZnVuY3Rpb24gKFF1ZXN0aW9uRmFjdG9yeSwgJHRpbWVvdXQpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvUXVlc3Rpb24vY3JlYXRlUXVlc3Rpb24uaHRtbCcsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW0sIGF0dHIpIHtcblx0XHRcdHNjb3BlLmFkZFF1ZXN0aW9uID0gZnVuY3Rpb24ocXVlc3Rpb24pIHtcblx0XHRcdFx0UXVlc3Rpb25GYWN0b3J5LnN1Ym1pdFF1ZXN0aW9uKHF1ZXN0aW9uKS50aGVuKGZ1bmN0aW9uKHJlcyl7XG5cdFx0XHRcdFx0c2NvcGUucXVlc3Rpb24gPSB7fTtcblx0XHRcdFx0XHRzY29wZS5zdWJtaXR0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0XHRzY29wZS5zdWJtaXR0ZWQgPSBmYWxzZTtcblx0XHRcdFx0XHR9LCAyMDAwKTtcdFx0XHRcdFxuXHRcdFx0XHR9KTtcblx0XHRcdH07XG5cdFx0fVxuXHR9O1xufSk7XG5cbmFwcC5kaXJlY3RpdmUoJ3N0YXRlJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlcXVpcmU6ICduZ01vZGVsJyxcblx0XHRsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW0sIGF0dHJzLCBjdHJsKSB7XG5cdFx0XHRjdHJsLiR2YWxpZGF0b3JzLnN0YXRlID0gZnVuY3Rpb24gKG1vZGVsVmFsdWUsIHZpZXdWYWx1ZSl7XG5cdFx0XHRcdHZpZXdWYWx1ZSA9IHZpZXdWYWx1ZS50b1VwcGVyQ2FzZSgpO1xuXHRcdFx0XHRpZiAoc3RhdGVBcnJheS5pbmRleE9mKHZpZXdWYWx1ZSkgPiAtMSl7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9O1xuXHRcdFx0fTtcblx0XHR9XG5cdH07XG59KTtcblxudmFyIHVzU3RhdGVzID0gW1xuICAgIHsgbmFtZTogJ0FMQUJBTUEnLCBhYmJyZXZpYXRpb246ICdBTCd9LFxuICAgIHsgbmFtZTogJ0FMQVNLQScsIGFiYnJldmlhdGlvbjogJ0FLJ30sXG4gICAgeyBuYW1lOiAnQU1FUklDQU4gU0FNT0EnLCBhYmJyZXZpYXRpb246ICdBUyd9LFxuICAgIHsgbmFtZTogJ0FSSVpPTkEnLCBhYmJyZXZpYXRpb246ICdBWid9LFxuICAgIHsgbmFtZTogJ0FSS0FOU0FTJywgYWJicmV2aWF0aW9uOiAnQVInfSxcbiAgICB7IG5hbWU6ICdDQUxJRk9STklBJywgYWJicmV2aWF0aW9uOiAnQ0EnfSxcbiAgICB7IG5hbWU6ICdDT0xPUkFETycsIGFiYnJldmlhdGlvbjogJ0NPJ30sXG4gICAgeyBuYW1lOiAnQ09OTkVDVElDVVQnLCBhYmJyZXZpYXRpb246ICdDVCd9LFxuICAgIHsgbmFtZTogJ0RFTEFXQVJFJywgYWJicmV2aWF0aW9uOiAnREUnfSxcbiAgICB7IG5hbWU6ICdESVNUUklDVCBPRiBDT0xVTUJJQScsIGFiYnJldmlhdGlvbjogJ0RDJ30sXG4gICAgeyBuYW1lOiAnRkVERVJBVEVEIFNUQVRFUyBPRiBNSUNST05FU0lBJywgYWJicmV2aWF0aW9uOiAnRk0nfSxcbiAgICB7IG5hbWU6ICdGTE9SSURBJywgYWJicmV2aWF0aW9uOiAnRkwnfSxcbiAgICB7IG5hbWU6ICdHRU9SR0lBJywgYWJicmV2aWF0aW9uOiAnR0EnfSxcbiAgICB7IG5hbWU6ICdHVUFNJywgYWJicmV2aWF0aW9uOiAnR1UnfSxcbiAgICB7IG5hbWU6ICdIQVdBSUknLCBhYmJyZXZpYXRpb246ICdISSd9LFxuICAgIHsgbmFtZTogJ0lEQUhPJywgYWJicmV2aWF0aW9uOiAnSUQnfSxcbiAgICB7IG5hbWU6ICdJTExJTk9JUycsIGFiYnJldmlhdGlvbjogJ0lMJ30sXG4gICAgeyBuYW1lOiAnSU5ESUFOQScsIGFiYnJldmlhdGlvbjogJ0lOJ30sXG4gICAgeyBuYW1lOiAnSU9XQScsIGFiYnJldmlhdGlvbjogJ0lBJ30sXG4gICAgeyBuYW1lOiAnS0FOU0FTJywgYWJicmV2aWF0aW9uOiAnS1MnfSxcbiAgICB7IG5hbWU6ICdLRU5UVUNLWScsIGFiYnJldmlhdGlvbjogJ0tZJ30sXG4gICAgeyBuYW1lOiAnTE9VSVNJQU5BJywgYWJicmV2aWF0aW9uOiAnTEEnfSxcbiAgICB7IG5hbWU6ICdNQUlORScsIGFiYnJldmlhdGlvbjogJ01FJ30sXG4gICAgeyBuYW1lOiAnTUFSU0hBTEwgSVNMQU5EUycsIGFiYnJldmlhdGlvbjogJ01IJ30sXG4gICAgeyBuYW1lOiAnTUFSWUxBTkQnLCBhYmJyZXZpYXRpb246ICdNRCd9LFxuICAgIHsgbmFtZTogJ01BU1NBQ0hVU0VUVFMnLCBhYmJyZXZpYXRpb246ICdNQSd9LFxuICAgIHsgbmFtZTogJ01JQ0hJR0FOJywgYWJicmV2aWF0aW9uOiAnTUknfSxcbiAgICB7IG5hbWU6ICdNSU5ORVNPVEEnLCBhYmJyZXZpYXRpb246ICdNTid9LFxuICAgIHsgbmFtZTogJ01JU1NJU1NJUFBJJywgYWJicmV2aWF0aW9uOiAnTVMnfSxcbiAgICB7IG5hbWU6ICdNSVNTT1VSSScsIGFiYnJldmlhdGlvbjogJ01PJ30sXG4gICAgeyBuYW1lOiAnTU9OVEFOQScsIGFiYnJldmlhdGlvbjogJ01UJ30sXG4gICAgeyBuYW1lOiAnTkVCUkFTS0EnLCBhYmJyZXZpYXRpb246ICdORSd9LFxuICAgIHsgbmFtZTogJ05FVkFEQScsIGFiYnJldmlhdGlvbjogJ05WJ30sXG4gICAgeyBuYW1lOiAnTkVXIEhBTVBTSElSRScsIGFiYnJldmlhdGlvbjogJ05IJ30sXG4gICAgeyBuYW1lOiAnTkVXIEpFUlNFWScsIGFiYnJldmlhdGlvbjogJ05KJ30sXG4gICAgeyBuYW1lOiAnTkVXIE1FWElDTycsIGFiYnJldmlhdGlvbjogJ05NJ30sXG4gICAgeyBuYW1lOiAnTkVXIFlPUksnLCBhYmJyZXZpYXRpb246ICdOWSd9LFxuICAgIHsgbmFtZTogJ05PUlRIIENBUk9MSU5BJywgYWJicmV2aWF0aW9uOiAnTkMnfSxcbiAgICB7IG5hbWU6ICdOT1JUSCBEQUtPVEEnLCBhYmJyZXZpYXRpb246ICdORCd9LFxuICAgIHsgbmFtZTogJ05PUlRIRVJOIE1BUklBTkEgSVNMQU5EUycsIGFiYnJldmlhdGlvbjogJ01QJ30sXG4gICAgeyBuYW1lOiAnT0hJTycsIGFiYnJldmlhdGlvbjogJ09IJ30sXG4gICAgeyBuYW1lOiAnT0tMQUhPTUEnLCBhYmJyZXZpYXRpb246ICdPSyd9LFxuICAgIHsgbmFtZTogJ09SRUdPTicsIGFiYnJldmlhdGlvbjogJ09SJ30sXG4gICAgeyBuYW1lOiAnUEFMQVUnLCBhYmJyZXZpYXRpb246ICdQVyd9LFxuICAgIHsgbmFtZTogJ1BFTk5TWUxWQU5JQScsIGFiYnJldmlhdGlvbjogJ1BBJ30sXG4gICAgeyBuYW1lOiAnUFVFUlRPIFJJQ08nLCBhYmJyZXZpYXRpb246ICdQUid9LFxuICAgIHsgbmFtZTogJ1JIT0RFIElTTEFORCcsIGFiYnJldmlhdGlvbjogJ1JJJ30sXG4gICAgeyBuYW1lOiAnU09VVEggQ0FST0xJTkEnLCBhYmJyZXZpYXRpb246ICdTQyd9LFxuICAgIHsgbmFtZTogJ1NPVVRIIERBS09UQScsIGFiYnJldmlhdGlvbjogJ1NEJ30sXG4gICAgeyBuYW1lOiAnVEVOTkVTU0VFJywgYWJicmV2aWF0aW9uOiAnVE4nfSxcbiAgICB7IG5hbWU6ICdURVhBUycsIGFiYnJldmlhdGlvbjogJ1RYJ30sXG4gICAgeyBuYW1lOiAnVVRBSCcsIGFiYnJldmlhdGlvbjogJ1VUJ30sXG4gICAgeyBuYW1lOiAnVkVSTU9OVCcsIGFiYnJldmlhdGlvbjogJ1ZUJ30sXG4gICAgeyBuYW1lOiAnVklSR0lOIElTTEFORFMnLCBhYmJyZXZpYXRpb246ICdWSSd9LFxuICAgIHsgbmFtZTogJ1ZJUkdJTklBJywgYWJicmV2aWF0aW9uOiAnVkEnfSxcbiAgICB7IG5hbWU6ICdXQVNISU5HVE9OJywgYWJicmV2aWF0aW9uOiAnV0EnfSxcbiAgICB7IG5hbWU6ICdXRVNUIFZJUkdJTklBJywgYWJicmV2aWF0aW9uOiAnV1YnfSxcbiAgICB7IG5hbWU6ICdXSVNDT05TSU4nLCBhYmJyZXZpYXRpb246ICdXSSd9LFxuICAgIHsgbmFtZTogJ1dZT01JTkcnLCBhYmJyZXZpYXRpb246ICdXWScgfVxuXTtcblxudmFyIHN0YXRlQXJyYXkgPSBbXTtcblxudXNTdGF0ZXMuZm9yRWFjaChmdW5jdGlvbihzdGF0ZU9iaikge1xuXHRzdGF0ZUFycmF5LnB1c2goc3RhdGVPYmoubmFtZSlcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgncXVlc3Rpb24nLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL1F1ZXN0aW9uL3F1ZXN0aW9uLmh0bWwnXG5cdH07XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdxdWVzdGlvbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBRdWVzdGlvbkZhY3RvcnksIFVzZXJGYWN0b3J5KXtcblx0XG59KSIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ1Njb3JlRmFjdG9yeScsIGZ1bmN0aW9uKCkge1xuXHR2YXIgZmFjdG9yeSA9IHtcblx0XHRjb3JyZWN0OiAwLFxuXHRcdGluY29ycmVjdDogMFxuXHR9O1xuXHRyZXR1cm4gZmFjdG9yeTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ0dhbWVGYWN0b3J5JywgZnVuY3Rpb24oKSB7XG5cblx0dmFyIGZhY3RvcnkgPSB7fTtcblxuXHR2YXIgR2FtZSA9IGZ1bmN0aW9uICgpe1xuXHRcdHRoaXMuYWN0aXZlID0gZmFsc2U7XG5cdFx0dGhpcy5uZXh0UXVlc3Rpb25BdmFpbGFibGUgPSBmYWxzZTtcblx0XHR0aGlzLnF1ZXN0aW9uTnVtYmVyID0gMTtcblx0XHR0aGlzLnF1ZXN0aW9uTGltaXQgPSA1O1xuXHR9O1xuXG5cdGZhY3RvcnkuY3JlYXRlR2FtZSA9IGZ1bmN0aW9uKCl7XG5cdFx0ZmFjdG9yeS5nYW1lID0gbmV3IEdhbWUoKTtcblx0XHRyZXR1cm4gZmFjdG9yeS5nYW1lO1xuXHR9O1xuXG5cdHJldHVybiBmYWN0b3J5O1xufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZmFjdG9yeSgnVXNlckZhY3RvcnknLCBmdW5jdGlvbigpIHtcblxuXHR2YXIgZmFjdG9yeSA9IHt9O1xuXG5cdHZhciBVc2VyID0gZnVuY3Rpb24gKCl7XG5cdFx0dGhpcy5ndWVzc2VzID0gMTtcblx0XHR0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuXHRcdHRoaXMuZ2FtZSA9IHRydWU7XG5cdFx0dGhpcy5jb3JyZWN0ID0gMDtcblx0XHR0aGlzLmluY29ycmVjdCA9IDA7XG5cdFx0dGhpcy5uZXh0UXVlc3Rpb25BdmFpbGFibGUgPSBmYWxzZTtcblx0XHR0aGlzLnF1ZXN0aW9uTnVtYmVyID0gMTtcblx0XHR0aGlzLnF1ZXN0aW9uTGltaXQgPSAxMDtcblx0fTtcblxuXHRmYWN0b3J5LmNyZWF0ZVVzZXIgPSBmdW5jdGlvbigpe1xuXHRcdGZhY3RvcnkudXNlciA9IG5ldyBVc2VyKCk7XG5cdFx0cmV0dXJuIGZhY3RvcnkudXNlcjtcblx0fTtcblxuXHRyZXR1cm4gZmFjdG9yeTtcbn0pOyIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoJGxvY2F0aW9uKSB7XG5cbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcblxuICAgICAgICB2YXIgc29ja2V0O1xuXG4gICAgICAgIGlmICgkbG9jYXRpb24uJCRwb3J0KSB7XG4gICAgICAgICAgICBzb2NrZXQgPSBpbygnaHR0cDovL2xvY2FsaG9zdDoxMzM3Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzb2NrZXQgPSBpbygnLycpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNvY2tldDtcblxuICAgIH0pO1xuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgdmFyIG9uU3VjY2Vzc2Z1bExvZ2luID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKHsgdXNlcjogU2Vzc2lvbi51c2VyIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCB0aGlzLmRlc3Ryb3kpO1xuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgdGhpcy5kZXN0cm95KTtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==