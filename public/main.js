'use strict';
var app = angular.module('MapGame', ['ui.router', 'fsaPreBuilt']);


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

    $scope.fetchAllQuestions = function () {
        QuestionFactory.getAllQuestions().then(function (questions) {
            $scope.game.nextQuestionAvailable = false;
            $scope.questions = questions;
            console.log($scope.questions);
            var numQuestions = questions.length;
            var questionIndex = Math.floor(Math.random()*numQuestions)+1;
            $scope.currentQuestion = $scope.questions[questionIndex];
            $scope.questions.splice(questionIndex,1);
        });
    };

    $scope.nextQuestion = function () {
        $scope.game.questionNumber++;
        $scope.user.guesses = 3;
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

app.directive('navBar', function () {
	return {
		restrict: 'E',
		templateUrl: 'js/Navbar/navBar.html'
	};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIk1haW5NYXAvbWFpbk1hcC5qcyIsIk5hdmJhci9uYXZCYXIuanMiLCJRdWVzdGlvbi9RdWVzdGlvbkZhY3RvcnkuanMiLCJRdWVzdGlvbi9jcmVhdGVRdWVzdGlvbi5qcyIsIlF1ZXN0aW9uL3F1ZXN0aW9uLmpzIiwiUXVlc3Rpb24vcXVlc3Rpb25DdHJsLmpzIiwiU2NvcmUvU2NvcmVGYWN0b3J5LmpzIiwiVXNlci9HYW1lRmFjdG9yeS5qcyIsIlVzZXIvVXNlckZhY3RvcnkuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnTWFwR2FtZScsIFsndWkucm91dGVyJywgJ2ZzYVByZUJ1aWx0J10pO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWFpbk1hcCcsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvTWFpbk1hcC9tYWluTWFwLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnbWFpbk1hcEN0cmwnXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ21haW5NYXBDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgUXVlc3Rpb25GYWN0b3J5LCBVc2VyRmFjdG9yeSwgR2FtZUZhY3RvcnksIFNjb3JlRmFjdG9yeSkge1xuXG4gICAgdmFyIHdpZHRoID0gODAwO1xuICAgIHZhciBoZWlnaHQgPSA1NTA7XG5cbiAgICB2YXIgc3ZnID0gZDMuc2VsZWN0KFwic3ZnXCIpXG4gICAgIC5hdHRyKFwid2lkdGhcIiwgd2lkdGgpXG4gICAgIC5hdHRyKFwiaGVpZ2h0XCIsIGhlaWdodCk7XG5cbiAgICB2YXIgcHJvamVjdGlvbiA9IGQzLmdlby5hbGJlcnNVc2EoKVxuICAgICAgICAuc2NhbGUoMTAwMClcbiAgICAgICAgLnRyYW5zbGF0ZShbd2lkdGgqKDAuNSksIGhlaWdodCAvIDJdKTtcblxuICAgIHZhciBwYXRoID0gZDMuZ2VvLnBhdGgoKVxuICAgICAgICAgICAgICAgIC5wcm9qZWN0aW9uKHByb2plY3Rpb24pO1xuXG4gICAgJHNjb3BlLnN0YXRlID0gXCIoY2xpY2sgYSBvbiBzdGF0ZSB0byBndWVzcylcIjtcbiAgICAkc2NvcGUuZ3Vlc3NSZXN1bHQgPSBudWxsO1xuICAgICRzY29wZS5zaG93QW5zd2VyUmVzdWx0ID0gZmFsc2U7XG4gICAgJHNjb3BlLnF1ZXN0aW9uQWN0aXZlID0gZmFsc2U7XG5cbiAgICBkMy5qc29uKFwic3RhdGVzLmpzb25cIiwgZnVuY3Rpb24gKGVycm9yLCBzdGF0ZXMpIHtcbiAgICAgaWYgKGVycm9yKSByZXR1cm4gY29uc29sZS5sb2coZXJyb3IpO1xuICAgICBjb25zb2xlLmxvZyhzdGF0ZXMpO1xuXG4gICAgIHN2Zy5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgICAuZGF0YShzdGF0ZXMuZmVhdHVyZXMpXG4gICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgICAuYXR0cihcImRcIixwYXRoKVxuICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJzdGF0ZSBcIiArIGQuU1RVU1BTXG4gICAgICAgICB9KVxuICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJ3aGl0ZVwiKVxuICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkLGkpIHtcbiAgICAgICAgICAgIGQucHJvcGVydGllcy5jb2xvciA9ICcjJytNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMTY3NzcyMTUpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgIHJldHVybiBkLnByb3BlcnRpZXMuY29sb3I7XG4gICAgICAgICAgICAvLyByZXR1cm4gJyMnK2krJ2MnO1xuICAgICAgICAgfSlcbiAgICAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoZCxpKSB7XG4gICAgICAgICAgICB2YXIgc3RhdGUgPSBkLnByb3BlcnRpZXMuTkFNRTtcbiAgICAgICAgICAgICRzY29wZS5zaG93QW5zd2VyUmVzdWx0ID0gdHJ1ZTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZ3Vlc3NSZXN1bHQgPSBRdWVzdGlvbkZhY3RvcnkubWFuYWdlQW5zd2VyKCRzY29wZS5jdXJyZW50UXVlc3Rpb24uYW5zd2VyLCBzdGF0ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgIH0pXG4gICAgICAgICAub24oJ21vdXNlZW50ZXInLCBmdW5jdGlvbiAoZCxpKSB7XG4gICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwiZmlsbFwiLFwieWVsbG93XCIpO1xuICAgICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS5zdHlsZShcInN0cm9rZVwiLFwiYmxhY2tcIik7XG4gICAgICAgICAgICAgdmFyIHN0YXRlID0gZC5wcm9wZXJ0aWVzLk5BTUU7XG4gICAgICAgICAgICAgaWYgKCEkc2NvcGUuZ3Vlc3NSZXN1bHQgfHwgJHNjb3BlLmd1ZXNzUmVzdWx0ICE9PSBcImNvcnJlY3RcIil7XG4gICAgICAgICAgICAgICAgICRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zdGF0ZSA9IHN0YXRlO1xuICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgIH1cbiAgICAgICAgIH0pXG4gICAgICAgICAub24oJ21vdXNlbGVhdmUnLCBmdW5jdGlvbihkLGkpIHtcbiAgICAgICAgICAgICBkMy5zZWxlY3QodGhpcykuc3R5bGUoXCJmaWxsXCIsZC5wcm9wZXJ0aWVzLmNvbG9yKTtcbiAgICAgICAgICAgICBkMy5zZWxlY3QodGhpcykuc3R5bGUoXCJzdHJva2VcIixcIndoaXRlXCIpOyAgXG4gICAgICAgICAgICAgJHNjb3BlLnNob3dBbnN3ZXJSZXN1bHQgPSBmYWxzZTsgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgICRzY29wZS5xdWVzdGlvbkF2YWlsYWJsZSA9IHRydWU7XG4gICAgJHNjb3BlLnF1ZXN0aW9ucztcbiAgICAkc2NvcGUucmFuZG9tUXVlc3Rpb247XG5cbiAgICAkc2NvcGUuZmV0Y2hSYW5kb21RdWVzdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgUXVlc3Rpb25GYWN0b3J5LmdldEFsbFF1ZXN0aW9ucygpLnRoZW4oZnVuY3Rpb24ocXVlc3Rpb25zKXtcbiAgICAgICAgICAgIHZhciBudW1RdWVzdGlvbnMgPSBxdWVzdGlvbnMubGVuZ3RoO1xuICAgICAgICAgICAgJHNjb3BlLnJhbmRvbVF1ZXN0aW9uID0gcXVlc3Rpb25zW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpudW1RdWVzdGlvbnMpXTtcbiAgICAgICAgICAgICRzY29wZS5jdXJyZW50UXVlc3Rpb24gPSAkc2NvcGUucmFuZG9tUXVlc3Rpb247XG4gICAgICAgICAgICAkc2NvcGUuc3RhdGUgPSBcIlwiO1xuICAgICAgICAgICAgJHNjb3BlLmd1ZXNzUmVzdWx0O1xuICAgICAgICAgICAgJHNjb3BlLnVzZXIgPSBVc2VyRmFjdG9yeS5jcmVhdGVVc2VyKCk7XG4gICAgICAgICAgICAkc2NvcGUudXNlci5hY3RpdmUgPSB0cnVlO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmJlZ2luR2FtZSA9IGZ1bmN0aW9uICgpe1xuICAgICAgICAkc2NvcGUuZ2FtZSA9IEdhbWVGYWN0b3J5LmNyZWF0ZUdhbWUoKTtcbiAgICAgICAgJHNjb3BlLmdhbWUuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLnVzZXIgPSBVc2VyRmFjdG9yeS5jcmVhdGVVc2VyKCk7XG4gICAgICAgICRzY29wZS5mZXRjaEFsbFF1ZXN0aW9ucygpO1xuICAgIH1cblxuICAgICRzY29wZS5mZXRjaEFsbFF1ZXN0aW9ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgUXVlc3Rpb25GYWN0b3J5LmdldEFsbFF1ZXN0aW9ucygpLnRoZW4oZnVuY3Rpb24gKHF1ZXN0aW9ucykge1xuICAgICAgICAgICAgJHNjb3BlLmdhbWUubmV4dFF1ZXN0aW9uQXZhaWxhYmxlID0gZmFsc2U7XG4gICAgICAgICAgICAkc2NvcGUucXVlc3Rpb25zID0gcXVlc3Rpb25zO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJHNjb3BlLnF1ZXN0aW9ucyk7XG4gICAgICAgICAgICB2YXIgbnVtUXVlc3Rpb25zID0gcXVlc3Rpb25zLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBxdWVzdGlvbkluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKm51bVF1ZXN0aW9ucykrMTtcbiAgICAgICAgICAgICRzY29wZS5jdXJyZW50UXVlc3Rpb24gPSAkc2NvcGUucXVlc3Rpb25zW3F1ZXN0aW9uSW5kZXhdO1xuICAgICAgICAgICAgJHNjb3BlLnF1ZXN0aW9ucy5zcGxpY2UocXVlc3Rpb25JbmRleCwxKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5uZXh0UXVlc3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICRzY29wZS5nYW1lLnF1ZXN0aW9uTnVtYmVyKys7XG4gICAgICAgICRzY29wZS51c2VyLmd1ZXNzZXMgPSAzO1xuICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUucXVlc3Rpb25zKTtcbiAgICAgICAgJHNjb3BlLmdhbWUubmV4dFF1ZXN0aW9uQXZhaWxhYmxlID0gZmFsc2U7XG4gICAgICAgIHZhciBudW1RdWVzdGlvbnMgPSAkc2NvcGUucXVlc3Rpb25zLmxlbmd0aDtcbiAgICAgICAgdmFyIHF1ZXN0aW9uSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqbnVtUXVlc3Rpb25zKSsxO1xuICAgICAgICAkc2NvcGUuY3VycmVudFF1ZXN0aW9uID0gJHNjb3BlLnF1ZXN0aW9uc1txdWVzdGlvbkluZGV4XTtcbiAgICAgICAgJHNjb3BlLnF1ZXN0aW9ucy5zcGxpY2UocXVlc3Rpb25JbmRleCwxKTtcbiAgICB9XG5cbiAgICAkc2NvcGUuY3JlYXRlUXVlc3Rpb25Gb3JtID0gZmFsc2U7XG5cbiAgICAkc2NvcGUuY3JlYXRlUXVlc3Rpb25EaXNwbGF5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUuY3JlYXRlUXVlc3Rpb25Gb3JtID0gdHJ1ZTtcbiAgICB9O1xuICAgICRzY29wZS5oaWRlUXVlc3Rpb25EaXNwbGF5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUuY3JlYXRlUXVlc3Rpb25Gb3JtID0gZmFsc2U7XG4gICAgfVxuXG4gICAgJHNjb3BlLnNjb3JlID0gU2NvcmVGYWN0b3J5O1xufSk7XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnbmF2QmFyJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9OYXZiYXIvbmF2QmFyLmh0bWwnXG5cdH07XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5mYWN0b3J5KCdRdWVzdGlvbkZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHAsIFNjb3JlRmFjdG9yeSwgVXNlckZhY3RvcnksIEdhbWVGYWN0b3J5KSB7XG5cdHZhciBmYWN0b3J5ID0ge307XG5cblx0ZmFjdG9yeS5nZXRBbGxRdWVzdGlvbnMgPSBmdW5jdGlvbigpe1xuXHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvcXVlc3Rpb24vZmluZEFsbCcpLnRoZW4oZnVuY3Rpb24gKHJlcyl7XG5cdFx0XHRyZXR1cm4gcmVzLmRhdGE7XG5cdFx0fSk7XG5cdH07XG5cblx0ZmFjdG9yeS5zdWJtaXRRdWVzdGlvbiA9IGZ1bmN0aW9uKHF1ZXN0aW9uKXtcblx0XHRjb25zb2xlLmxvZyhcImhleVwiKTtcblx0XHRyZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9xdWVzdGlvbi9jcmVhdGUnLCBxdWVzdGlvbikudGhlbihmdW5jdGlvbiAocmVzKXtcblx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHR9KVxuXHR9XG5cblx0ZmFjdG9yeS5tYW5hZ2VBbnN3ZXIgPSBmdW5jdGlvbihhbnN3ZXIsIGNsaWNrZWQpe1xuXHRcdGlmIChhbnN3ZXIgPT0gY2xpY2tlZCAmJiBVc2VyRmFjdG9yeS51c2VyLmd1ZXNzZXMgPiAxKXtcblx0XHRcdFVzZXJGYWN0b3J5LnVzZXIuZ3Vlc3NlcyA9IDA7XG5cdFx0XHRTY29yZUZhY3RvcnkuY29ycmVjdCsrO1xuXHRcdFx0VXNlckZhY3RvcnkudXNlci5jb3JyZWN0Kys7XG5cdFx0XHRVc2VyRmFjdG9yeS51c2VyLmFjdGl2ZSA9IGZhbHNlO1xuXHRcdFx0R2FtZUZhY3RvcnkuZ2FtZS5uZXh0UXVlc3Rpb25BdmFpbGFibGUgPSB0cnVlO1xuXHRcdFx0aWYgKEdhbWVGYWN0b3J5LmdhbWUucXVlc3Rpb25OdW1iZXIgPT0gR2FtZUZhY3RvcnkuZ2FtZS5xdWVzdGlvbkxpbWl0KXtcblx0XHRcdFx0R2FtZUZhY3RvcnkuZ2FtZS5hY3RpdmUgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBcIkNvcnJlY3RcIjtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoYW5zd2VyICE9PSBjbGlja2VkICYmIFVzZXJGYWN0b3J5LnVzZXIuZ3Vlc3NlcyA+IDEpIHtcblx0XHRcdFVzZXJGYWN0b3J5LnVzZXIuZ3Vlc3Nlcy0tO1xuXHRcdFx0cmV0dXJuIFwiSW5jb3JyZWN0XCI7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0VXNlckZhY3RvcnkudXNlci5ndWVzc2VzID0gMDtcblx0XHRcdFNjb3JlRmFjdG9yeS5pbmNvcnJlY3QrKztcblx0XHRcdFVzZXJGYWN0b3J5LnVzZXIuaW5vY3JyZWN0Kys7XG5cdFx0XHRVc2VyRmFjdG9yeS51c2VyLmFjdGl2ZSA9IGZhbHNlO1xuXHRcdFx0R2FtZUZhY3RvcnkuZ2FtZS5uZXh0UXVlc3Rpb25BdmFpbGFibGUgPSB0cnVlO1xuXHRcdFx0aWYgKEdhbWVGYWN0b3J5LmdhbWUucXVlc3Rpb25OdW1iZXIgPT0gR2FtZUZhY3RvcnkuZ2FtZS5xdWVzdGlvbkxpbWl0KXtcblx0XHRcdFx0R2FtZUZhY3RvcnkuZ2FtZS5hY3RpdmUgPSBmYWxzZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBcIk5vIG1vcmUgZ3Vlc3Nlc1wiO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gZmFjdG9yeTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnY3JlYXRlUXVlc3Rpb24nLCBmdW5jdGlvbiAoUXVlc3Rpb25GYWN0b3J5KSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL1F1ZXN0aW9uL2NyZWF0ZVF1ZXN0aW9uLmh0bWwnLFxuXHRcdGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtLCBhdHRyKSB7XG5cdFx0XHRzY29wZS5hZGRRdWVzdGlvbiA9IGZ1bmN0aW9uKHF1ZXN0aW9uKSB7XG5cdFx0XHRcdFF1ZXN0aW9uRmFjdG9yeS5zdWJtaXRRdWVzdGlvbihxdWVzdGlvbikudGhlbihmdW5jdGlvbihyZXMpe1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKHJlcyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fTtcblx0XHR9XG5cdH07XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ3F1ZXN0aW9uJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9RdWVzdGlvbi9xdWVzdGlvbi5odG1sJ1xuXHR9O1xufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29udHJvbGxlcigncXVlc3Rpb25DdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgUXVlc3Rpb25GYWN0b3J5LCBVc2VyRmFjdG9yeSl7XG5cdFxufSkiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5mYWN0b3J5KCdTY29yZUZhY3RvcnknLCBmdW5jdGlvbigpIHtcblx0dmFyIGZhY3RvcnkgPSB7XG5cdFx0Y29ycmVjdDogMCxcblx0XHRpbmNvcnJlY3Q6IDBcblx0fTtcblx0cmV0dXJuIGZhY3Rvcnk7XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5mYWN0b3J5KCdHYW1lRmFjdG9yeScsIGZ1bmN0aW9uKCkge1xuXG5cdHZhciBmYWN0b3J5ID0ge307XG5cblx0dmFyIEdhbWUgPSBmdW5jdGlvbiAoKXtcblx0XHR0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuXHRcdHRoaXMubmV4dFF1ZXN0aW9uQXZhaWxhYmxlID0gZmFsc2U7XG5cdFx0dGhpcy5xdWVzdGlvbk51bWJlciA9IDE7XG5cdFx0dGhpcy5xdWVzdGlvbkxpbWl0ID0gNTtcblx0fTtcblxuXHRmYWN0b3J5LmNyZWF0ZUdhbWUgPSBmdW5jdGlvbigpe1xuXHRcdGZhY3RvcnkuZ2FtZSA9IG5ldyBHYW1lKCk7XG5cdFx0cmV0dXJuIGZhY3RvcnkuZ2FtZTtcblx0fTtcblxuXHRyZXR1cm4gZmFjdG9yeTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ1VzZXJGYWN0b3J5JywgZnVuY3Rpb24oKSB7XG5cblx0dmFyIGZhY3RvcnkgPSB7fTtcblxuXHR2YXIgVXNlciA9IGZ1bmN0aW9uICgpe1xuXHRcdHRoaXMuZ3Vlc3NlcyA9IDM7XG5cdFx0dGhpcy5hY3RpdmUgPSBmYWxzZTtcblx0XHR0aGlzLmdhbWUgPSB0cnVlO1xuXHRcdHRoaXMuY29ycmVjdCA9IDA7XG5cdFx0dGhpcy5pbmNvcnJlY3QgPSAwO1xuXHRcdHRoaXMubmV4dFF1ZXN0aW9uQXZhaWxhYmxlID0gZmFsc2U7XG5cdFx0dGhpcy5xdWVzdGlvbk51bWJlciA9IDE7XG5cdFx0dGhpcy5xdWVzdGlvbkxpbWl0ID0gMTA7XG5cdH07XG5cblx0ZmFjdG9yeS5jcmVhdGVVc2VyID0gZnVuY3Rpb24oKXtcblx0XHRmYWN0b3J5LnVzZXIgPSBuZXcgVXNlcigpO1xuXHRcdHJldHVybiBmYWN0b3J5LnVzZXI7XG5cdH07XG5cblx0cmV0dXJuIGZhY3Rvcnk7XG59KTsiLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCRsb2NhdGlvbikge1xuXG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG5cbiAgICAgICAgdmFyIHNvY2tldDtcblxuICAgICAgICBpZiAoJGxvY2F0aW9uLiQkcG9ydCkge1xuICAgICAgICAgICAgc29ja2V0ID0gaW8oJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMzNycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc29ja2V0ID0gaW8oJy8nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb2NrZXQ7XG5cbiAgICB9KTtcblxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIHZhciBvblN1Y2Nlc3NmdWxMb2dpbiA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbih7IHVzZXI6IFNlc3Npb24udXNlciB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbik7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgdGhpcy5kZXN0cm95KTtcbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHRoaXMuZGVzdHJveSk7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=