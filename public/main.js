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
		console.log(UserFactory.user.guesses);
		if (answer == clicked){
			UserFactory.user.guesses = 0;
			ScoreFactory.correct++;
			UserFactory.user.active = false;
			GameFactory.game.nextQuestionAvailable = true;
			return "Correct";
		}
		else if (answer !== clicked && UserFactory.user.guesses > 1) {
			UserFactory.user.guesses--;
			return "Incorrect";
		}
		else {
			UserFactory.user.guesses = 0;
			ScoreFactory.incorrect++;
			UserFactory.user.active = false;
			GameFactory.game.nextQuestionAvailable = true;
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
		this.questionLimit = 10;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIk1haW5NYXAvbWFpbk1hcC5qcyIsIk5hdmJhci9uYXZCYXIuanMiLCJRdWVzdGlvbi9RdWVzdGlvbkZhY3RvcnkuanMiLCJRdWVzdGlvbi9jcmVhdGVRdWVzdGlvbi5qcyIsIlF1ZXN0aW9uL3F1ZXN0aW9uLmpzIiwiUXVlc3Rpb24vcXVlc3Rpb25DdHJsLmpzIiwiU2NvcmUvU2NvcmVGYWN0b3J5LmpzIiwiVXNlci9HYW1lRmFjdG9yeS5qcyIsIlVzZXIvVXNlckZhY3RvcnkuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ01hcEdhbWUnLCBbJ3VpLnJvdXRlcicsICdmc2FQcmVCdWlsdCddKTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ21haW5NYXAnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL01haW5NYXAvbWFpbk1hcC5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ21haW5NYXBDdHJsJ1xuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdtYWluTWFwQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIFF1ZXN0aW9uRmFjdG9yeSwgVXNlckZhY3RvcnksIEdhbWVGYWN0b3J5LCBTY29yZUZhY3RvcnkpIHtcblxuICAgIHZhciB3aWR0aCA9IDgwMDtcbiAgICB2YXIgaGVpZ2h0ID0gNTUwO1xuXG4gICAgdmFyIHN2ZyA9IGQzLnNlbGVjdChcInN2Z1wiKVxuICAgICAuYXR0cihcIndpZHRoXCIsIHdpZHRoKVxuICAgICAuYXR0cihcImhlaWdodFwiLCBoZWlnaHQpO1xuXG4gICAgdmFyIHByb2plY3Rpb24gPSBkMy5nZW8uYWxiZXJzVXNhKClcbiAgICAgICAgLnNjYWxlKDEwMDApXG4gICAgICAgIC50cmFuc2xhdGUoW3dpZHRoKigwLjUpLCBoZWlnaHQgLyAyXSk7XG5cbiAgICB2YXIgcGF0aCA9IGQzLmdlby5wYXRoKClcbiAgICAgICAgICAgICAgICAucHJvamVjdGlvbihwcm9qZWN0aW9uKTtcblxuICAgICRzY29wZS5zdGF0ZSA9IFwiKGNsaWNrIGEgb24gc3RhdGUgdG8gZ3Vlc3MpXCI7XG4gICAgJHNjb3BlLmd1ZXNzUmVzdWx0ID0gbnVsbDtcbiAgICAkc2NvcGUuc2hvd0Fuc3dlclJlc3VsdCA9IGZhbHNlO1xuICAgICRzY29wZS5xdWVzdGlvbkFjdGl2ZSA9IGZhbHNlO1xuXG4gICAgZDMuanNvbihcInN0YXRlcy5qc29uXCIsIGZ1bmN0aW9uIChlcnJvciwgc3RhdGVzKSB7XG4gICAgIGlmIChlcnJvcikgcmV0dXJuIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgY29uc29sZS5sb2coc3RhdGVzKTtcblxuICAgICBzdmcuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAgLmRhdGEoc3RhdGVzLmZlYXR1cmVzKVxuICAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicGF0aFwiKVxuICAgICAgICAgLmF0dHIoXCJkXCIscGF0aClcbiAgICAgICAgIC5hdHRyKFwiY2xhc3NcIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIFwic3RhdGUgXCIgKyBkLlNUVVNQU1xuICAgICAgICAgfSlcbiAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwid2hpdGVcIilcbiAgICAgICAgIC5hdHRyKFwiZmlsbFwiLCBmdW5jdGlvbiAoZCxpKSB7XG4gICAgICAgICAgICBkLnByb3BlcnRpZXMuY29sb3IgPSAnIycrTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKjE2Nzc3MjE1KS50b1N0cmluZygxNik7XG4gICAgICAgICAgICByZXR1cm4gZC5wcm9wZXJ0aWVzLmNvbG9yO1xuICAgICAgICAgICAgLy8gcmV0dXJuICcjJytpKydjJztcbiAgICAgICAgIH0pXG4gICAgICAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24gKGQsaSkge1xuICAgICAgICAgICAgdmFyIHN0YXRlID0gZC5wcm9wZXJ0aWVzLk5BTUU7XG4gICAgICAgICAgICAkc2NvcGUuc2hvd0Fuc3dlclJlc3VsdCA9IHRydWU7XG4gICAgICAgICAgICAkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnN0YXRlID0gc3RhdGU7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmd1ZXNzUmVzdWx0ID0gUXVlc3Rpb25GYWN0b3J5Lm1hbmFnZUFuc3dlcigkc2NvcGUuY3VycmVudFF1ZXN0aW9uLmFuc3dlciwgc3RhdGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICB9KVxuICAgICAgICAgLm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24gKGQsaSkge1xuICAgICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS5zdHlsZShcImZpbGxcIixcInllbGxvd1wiKTtcbiAgICAgICAgICAgICBkMy5zZWxlY3QodGhpcykuc3R5bGUoXCJzdHJva2VcIixcImJsYWNrXCIpO1xuICAgICAgICAgICAgIHZhciBzdGF0ZSA9IGQucHJvcGVydGllcy5OQU1FO1xuICAgICAgICAgICAgIGlmICghJHNjb3BlLmd1ZXNzUmVzdWx0IHx8ICRzY29wZS5ndWVzc1Jlc3VsdCAhPT0gXCJjb3JyZWN0XCIpe1xuICAgICAgICAgICAgICAgICAkc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAkc2NvcGUuc3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICB9XG4gICAgICAgICB9KVxuICAgICAgICAgLm9uKCdtb3VzZWxlYXZlJywgZnVuY3Rpb24oZCxpKSB7XG4gICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwiZmlsbFwiLGQucHJvcGVydGllcy5jb2xvcik7XG4gICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwic3Ryb2tlXCIsXCJ3aGl0ZVwiKTsgIFxuICAgICAgICAgICAgICRzY29wZS5zaG93QW5zd2VyUmVzdWx0ID0gZmFsc2U7ICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAkc2NvcGUucXVlc3Rpb25BdmFpbGFibGUgPSB0cnVlO1xuICAgICRzY29wZS5xdWVzdGlvbnM7XG4gICAgJHNjb3BlLnJhbmRvbVF1ZXN0aW9uO1xuXG4gICAgJHNjb3BlLmZldGNoUmFuZG9tUXVlc3Rpb24gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFF1ZXN0aW9uRmFjdG9yeS5nZXRBbGxRdWVzdGlvbnMoKS50aGVuKGZ1bmN0aW9uKHF1ZXN0aW9ucyl7XG4gICAgICAgICAgICB2YXIgbnVtUXVlc3Rpb25zID0gcXVlc3Rpb25zLmxlbmd0aDtcbiAgICAgICAgICAgICRzY29wZS5yYW5kb21RdWVzdGlvbiA9IHF1ZXN0aW9uc1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqbnVtUXVlc3Rpb25zKV07XG4gICAgICAgICAgICAkc2NvcGUuY3VycmVudFF1ZXN0aW9uID0gJHNjb3BlLnJhbmRvbVF1ZXN0aW9uO1xuICAgICAgICAgICAgJHNjb3BlLnN0YXRlID0gXCJcIjtcbiAgICAgICAgICAgICRzY29wZS5ndWVzc1Jlc3VsdDtcbiAgICAgICAgICAgICRzY29wZS51c2VyID0gVXNlckZhY3RvcnkuY3JlYXRlVXNlcigpO1xuICAgICAgICAgICAgJHNjb3BlLnVzZXIuYWN0aXZlID0gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgICRzY29wZS5iZWdpbkdhbWUgPSBmdW5jdGlvbiAoKXtcbiAgICAgICAgJHNjb3BlLmdhbWUgPSBHYW1lRmFjdG9yeS5jcmVhdGVHYW1lKCk7XG4gICAgICAgICRzY29wZS51c2VyID0gVXNlckZhY3RvcnkuY3JlYXRlVXNlcigpO1xuICAgICAgICAkc2NvcGUuZmV0Y2hBbGxRdWVzdGlvbnMoKTtcbiAgICB9XG5cbiAgICAkc2NvcGUuZmV0Y2hBbGxRdWVzdGlvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIFF1ZXN0aW9uRmFjdG9yeS5nZXRBbGxRdWVzdGlvbnMoKS50aGVuKGZ1bmN0aW9uIChxdWVzdGlvbnMpIHtcbiAgICAgICAgICAgICRzY29wZS5nYW1lLm5leHRRdWVzdGlvbkF2YWlsYWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgJHNjb3BlLnF1ZXN0aW9ucyA9IHF1ZXN0aW9ucztcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCRzY29wZS5xdWVzdGlvbnMpO1xuICAgICAgICAgICAgdmFyIG51bVF1ZXN0aW9ucyA9IHF1ZXN0aW9ucy5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgcXVlc3Rpb25JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpudW1RdWVzdGlvbnMpKzE7XG4gICAgICAgICAgICAkc2NvcGUuY3VycmVudFF1ZXN0aW9uID0gJHNjb3BlLnF1ZXN0aW9uc1txdWVzdGlvbkluZGV4XTtcbiAgICAgICAgICAgICRzY29wZS5xdWVzdGlvbnMuc3BsaWNlKHF1ZXN0aW9uSW5kZXgsMSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAkc2NvcGUubmV4dFF1ZXN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUuZ2FtZS5xdWVzdGlvbk51bWJlcisrO1xuICAgICAgICAkc2NvcGUudXNlci5ndWVzc2VzID0gMztcbiAgICAgICAgY29uc29sZS5sb2coJHNjb3BlLnF1ZXN0aW9ucyk7XG4gICAgICAgICRzY29wZS5nYW1lLm5leHRRdWVzdGlvbkF2YWlsYWJsZSA9IGZhbHNlO1xuICAgICAgICB2YXIgbnVtUXVlc3Rpb25zID0gJHNjb3BlLnF1ZXN0aW9ucy5sZW5ndGg7XG4gICAgICAgIHZhciBxdWVzdGlvbkluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKm51bVF1ZXN0aW9ucykrMTtcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRRdWVzdGlvbiA9ICRzY29wZS5xdWVzdGlvbnNbcXVlc3Rpb25JbmRleF07XG4gICAgICAgICRzY29wZS5xdWVzdGlvbnMuc3BsaWNlKHF1ZXN0aW9uSW5kZXgsMSk7XG4gICAgfVxuXG4gICAgJHNjb3BlLmNyZWF0ZVF1ZXN0aW9uRm9ybSA9IGZhbHNlO1xuXG4gICAgJHNjb3BlLmNyZWF0ZVF1ZXN0aW9uRGlzcGxheSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLmNyZWF0ZVF1ZXN0aW9uRm9ybSA9IHRydWU7XG4gICAgfTtcbiAgICAkc2NvcGUuaGlkZVF1ZXN0aW9uRGlzcGxheSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHNjb3BlLmNyZWF0ZVF1ZXN0aW9uRm9ybSA9IGZhbHNlO1xuICAgIH1cblxuICAgICRzY29wZS5zY29yZSA9IFNjb3JlRmFjdG9yeTtcbn0pO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5kaXJlY3RpdmUoJ25hdkJhcicsIGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvTmF2YmFyL25hdkJhci5odG1sJ1xuXHR9O1xufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZmFjdG9yeSgnUXVlc3Rpb25GYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwLCBTY29yZUZhY3RvcnksIFVzZXJGYWN0b3J5LCBHYW1lRmFjdG9yeSkge1xuXHR2YXIgZmFjdG9yeSA9IHt9O1xuXG5cdGZhY3RvcnkuZ2V0QWxsUXVlc3Rpb25zID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3F1ZXN0aW9uL2ZpbmRBbGwnKS50aGVuKGZ1bmN0aW9uIChyZXMpe1xuXHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdH0pO1xuXHR9O1xuXG5cdGZhY3Rvcnkuc3VibWl0UXVlc3Rpb24gPSBmdW5jdGlvbihxdWVzdGlvbil7XG5cdFx0Y29uc29sZS5sb2coXCJoZXlcIik7XG5cdFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvcXVlc3Rpb24vY3JlYXRlJywgcXVlc3Rpb24pLnRoZW4oZnVuY3Rpb24gKHJlcyl7XG5cdFx0XHRyZXR1cm4gcmVzLmRhdGE7XG5cdFx0fSlcblx0fVxuXG5cdGZhY3RvcnkubWFuYWdlQW5zd2VyID0gZnVuY3Rpb24oYW5zd2VyLCBjbGlja2VkKXtcblx0XHRjb25zb2xlLmxvZyhVc2VyRmFjdG9yeS51c2VyLmd1ZXNzZXMpO1xuXHRcdGlmIChhbnN3ZXIgPT0gY2xpY2tlZCl7XG5cdFx0XHRVc2VyRmFjdG9yeS51c2VyLmd1ZXNzZXMgPSAwO1xuXHRcdFx0U2NvcmVGYWN0b3J5LmNvcnJlY3QrKztcblx0XHRcdFVzZXJGYWN0b3J5LnVzZXIuYWN0aXZlID0gZmFsc2U7XG5cdFx0XHRHYW1lRmFjdG9yeS5nYW1lLm5leHRRdWVzdGlvbkF2YWlsYWJsZSA9IHRydWU7XG5cdFx0XHRyZXR1cm4gXCJDb3JyZWN0XCI7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKGFuc3dlciAhPT0gY2xpY2tlZCAmJiBVc2VyRmFjdG9yeS51c2VyLmd1ZXNzZXMgPiAxKSB7XG5cdFx0XHRVc2VyRmFjdG9yeS51c2VyLmd1ZXNzZXMtLTtcblx0XHRcdHJldHVybiBcIkluY29ycmVjdFwiO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdFVzZXJGYWN0b3J5LnVzZXIuZ3Vlc3NlcyA9IDA7XG5cdFx0XHRTY29yZUZhY3RvcnkuaW5jb3JyZWN0Kys7XG5cdFx0XHRVc2VyRmFjdG9yeS51c2VyLmFjdGl2ZSA9IGZhbHNlO1xuXHRcdFx0R2FtZUZhY3RvcnkuZ2FtZS5uZXh0UXVlc3Rpb25BdmFpbGFibGUgPSB0cnVlO1xuXHRcdFx0cmV0dXJuIFwiTm8gbW9yZSBndWVzc2VzXCI7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBmYWN0b3J5O1xufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCdjcmVhdGVRdWVzdGlvbicsIGZ1bmN0aW9uIChRdWVzdGlvbkZhY3RvcnkpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvUXVlc3Rpb24vY3JlYXRlUXVlc3Rpb24uaHRtbCcsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW0sIGF0dHIpIHtcblx0XHRcdHNjb3BlLmFkZFF1ZXN0aW9uID0gZnVuY3Rpb24ocXVlc3Rpb24pIHtcblx0XHRcdFx0UXVlc3Rpb25GYWN0b3J5LnN1Ym1pdFF1ZXN0aW9uKHF1ZXN0aW9uKS50aGVuKGZ1bmN0aW9uKHJlcyl7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2cocmVzKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9O1xuXHRcdH1cblx0fTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgncXVlc3Rpb24nLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL1F1ZXN0aW9uL3F1ZXN0aW9uLmh0bWwnXG5cdH07XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb250cm9sbGVyKCdxdWVzdGlvbkN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCBRdWVzdGlvbkZhY3RvcnksIFVzZXJGYWN0b3J5KXtcblx0XG59KSIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ1Njb3JlRmFjdG9yeScsIGZ1bmN0aW9uKCkge1xuXHR2YXIgZmFjdG9yeSA9IHtcblx0XHRjb3JyZWN0OiAwLFxuXHRcdGluY29ycmVjdDogMFxuXHR9O1xuXHRyZXR1cm4gZmFjdG9yeTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ0dhbWVGYWN0b3J5JywgZnVuY3Rpb24oKSB7XG5cblx0dmFyIGZhY3RvcnkgPSB7fTtcblxuXHR2YXIgR2FtZSA9IGZ1bmN0aW9uICgpe1xuXHRcdHRoaXMuYWN0aXZlID0gZmFsc2U7XG5cdFx0dGhpcy5uZXh0UXVlc3Rpb25BdmFpbGFibGUgPSBmYWxzZTtcblx0XHR0aGlzLnF1ZXN0aW9uTnVtYmVyID0gMTtcblx0XHR0aGlzLnF1ZXN0aW9uTGltaXQgPSAxMDtcblx0fTtcblxuXHRmYWN0b3J5LmNyZWF0ZUdhbWUgPSBmdW5jdGlvbigpe1xuXHRcdGZhY3RvcnkuZ2FtZSA9IG5ldyBHYW1lKCk7XG5cdFx0cmV0dXJuIGZhY3RvcnkuZ2FtZTtcblx0fTtcblxuXHRyZXR1cm4gZmFjdG9yeTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmZhY3RvcnkoJ1VzZXJGYWN0b3J5JywgZnVuY3Rpb24oKSB7XG5cblx0dmFyIGZhY3RvcnkgPSB7fTtcblxuXHR2YXIgVXNlciA9IGZ1bmN0aW9uICgpe1xuXHRcdHRoaXMuZ3Vlc3NlcyA9IDM7XG5cdFx0dGhpcy5hY3RpdmUgPSBmYWxzZTtcblx0XHR0aGlzLmdhbWUgPSB0cnVlO1xuXHRcdHRoaXMubmV4dFF1ZXN0aW9uQXZhaWxhYmxlID0gZmFsc2U7XG5cdFx0dGhpcy5xdWVzdGlvbk51bWJlciA9IDE7XG5cdFx0dGhpcy5xdWVzdGlvbkxpbWl0ID0gMTA7XG5cdH07XG5cblx0ZmFjdG9yeS5jcmVhdGVVc2VyID0gZnVuY3Rpb24oKXtcblx0XHRmYWN0b3J5LnVzZXIgPSBuZXcgVXNlcigpO1xuXHRcdHJldHVybiBmYWN0b3J5LnVzZXI7XG5cdH07XG5cblx0cmV0dXJuIGZhY3Rvcnk7XG59KTsiLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCRsb2NhdGlvbikge1xuXG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG5cbiAgICAgICAgdmFyIHNvY2tldDtcblxuICAgICAgICBpZiAoJGxvY2F0aW9uLiQkcG9ydCkge1xuICAgICAgICAgICAgc29ja2V0ID0gaW8oJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMzNycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc29ja2V0ID0gaW8oJy8nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzb2NrZXQ7XG5cbiAgICB9KTtcblxuICAgIGFwcC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSkge1xuXG4gICAgICAgIHZhciBvblN1Y2Nlc3NmdWxMb2dpbiA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbih7IHVzZXI6IFNlc3Npb24udXNlciB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbik7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgU2Vzc2lvbi5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ291dFN1Y2Nlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gISFTZXNzaW9uLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdTZXNzaW9uJywgZnVuY3Rpb24gKCRyb290U2NvcGUsIEFVVEhfRVZFTlRTKSB7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgdGhpcy5kZXN0cm95KTtcbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIHRoaXMuZGVzdHJveSk7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=