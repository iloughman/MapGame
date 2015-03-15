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

app.controller('mainMapCtrl', function ($scope, QuestionFactory, UserFactory, ScoreFactory) {

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
            console.log($scope.randomQuestion);
            $scope.user = UserFactory.createUser();
            console.log($scope.user);
        });
    };

    $scope.createQuestionForm = false;;
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

app.factory('QuestionFactory', function ($http, ScoreFactory, UserFactory) {
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
			return "correct";
		}
		else if (answer !== clicked && UserFactory.user.guesses > 1) {
			UserFactory.user.guesses--;
			return "incorrect";
		}
		else {
			UserFactory.user.guesses = 0;
			ScoreFactory.incorrect++;
			UserFactory.user.active = false;
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

app.factory('ScoreFactory', function() {
	var factory = {
		correct: 0,
		incorrect: 0
	};
	return factory;
});
'use strict';

app.factory('UserFactory', function() {

	var factory = {};

	var User = function (){
		this.guesses = 3;
		this.active = true;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIk1haW5NYXAvbWFpbk1hcC5qcyIsIk5hdmJhci9uYXZCYXIuanMiLCJRdWVzdGlvbi9RdWVzdGlvbkZhY3RvcnkuanMiLCJRdWVzdGlvbi9jcmVhdGVRdWVzdGlvbi5qcyIsIlF1ZXN0aW9uL3F1ZXN0aW9uLmpzIiwiU2NvcmUvU2NvcmVGYWN0b3J5LmpzIiwiVXNlci9Vc2VyRmFjdG9yeS5qcyIsImZzYS9mc2EtcHJlLWJ1aWx0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcbnZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnTWFwR2FtZScsIFsndWkucm91dGVyJywgJ2ZzYVByZUJ1aWx0J10pO1xuXG4iLCIndXNlIHN0cmljdCc7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbWFpbk1hcCcsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvTWFpbk1hcC9tYWluTWFwLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnbWFpbk1hcEN0cmwnXG4gICAgfSk7XG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ21haW5NYXBDdHJsJywgZnVuY3Rpb24gKCRzY29wZSwgUXVlc3Rpb25GYWN0b3J5LCBVc2VyRmFjdG9yeSwgU2NvcmVGYWN0b3J5KSB7XG5cbiAgICB2YXIgd2lkdGggPSA4MDA7XG4gICAgdmFyIGhlaWdodCA9IDU1MDtcblxuICAgIHZhciBzdmcgPSBkMy5zZWxlY3QoXCJzdmdcIilcbiAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcbiAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KTtcblxuICAgIHZhciBwcm9qZWN0aW9uID0gZDMuZ2VvLmFsYmVyc1VzYSgpXG4gICAgICAgIC5zY2FsZSgxMDAwKVxuICAgICAgICAudHJhbnNsYXRlKFt3aWR0aCooMC41KSwgaGVpZ2h0IC8gMl0pO1xuXG4gICAgdmFyIHBhdGggPSBkMy5nZW8ucGF0aCgpXG4gICAgICAgICAgICAgICAgLnByb2plY3Rpb24ocHJvamVjdGlvbik7XG5cbiAgICAkc2NvcGUuc3RhdGUgPSBcIihjbGljayBhIG9uIHN0YXRlIHRvIGd1ZXNzKVwiO1xuICAgICRzY29wZS5ndWVzc1Jlc3VsdCA9IG51bGw7XG5cbiAgICBkMy5qc29uKFwic3RhdGVzLmpzb25cIiwgZnVuY3Rpb24gKGVycm9yLCBzdGF0ZXMpIHtcbiAgICAgaWYgKGVycm9yKSByZXR1cm4gY29uc29sZS5sb2coZXJyb3IpO1xuICAgICBjb25zb2xlLmxvZyhzdGF0ZXMpO1xuXG4gICAgIHN2Zy5zZWxlY3RBbGwoXCJwYXRoXCIpXG4gICAgICAgICAuZGF0YShzdGF0ZXMuZmVhdHVyZXMpXG4gICAgICAgICAuZW50ZXIoKS5hcHBlbmQoXCJwYXRoXCIpXG4gICAgICAgICAuYXR0cihcImRcIixwYXRoKVxuICAgICAgICAgLmF0dHIoXCJjbGFzc1wiLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJzdGF0ZSBcIiArIGQuU1RVU1BTXG4gICAgICAgICB9KVxuICAgICAgICAgLmF0dHIoXCJzdHJva2VcIiwgXCJ3aGl0ZVwiKVxuICAgICAgICAgLmF0dHIoXCJmaWxsXCIsIGZ1bmN0aW9uIChkLGkpIHtcbiAgICAgICAgICAgIGQucHJvcGVydGllcy5jb2xvciA9ICcjJytNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqMTY3NzcyMTUpLnRvU3RyaW5nKDE2KTtcbiAgICAgICAgICAgIHJldHVybiBkLnByb3BlcnRpZXMuY29sb3I7XG4gICAgICAgICAgICAvLyByZXR1cm4gJyMnK2krJ2MnO1xuICAgICAgICAgfSlcbiAgICAgICAgIC5vbignY2xpY2snLCBmdW5jdGlvbiAoZCxpKSB7XG4gICAgICAgICAgICB2YXIgc3RhdGUgPSBkLnByb3BlcnRpZXMuTkFNRTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZ3Vlc3NSZXN1bHQgPSBRdWVzdGlvbkZhY3RvcnkubWFuYWdlQW5zd2VyKCRzY29wZS5jdXJyZW50UXVlc3Rpb24uYW5zd2VyLCBzdGF0ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgfSlcbiAgICAgICAgIC5vbignbW91c2VlbnRlcicsIGZ1bmN0aW9uIChkLGkpIHtcbiAgICAgICAgICAgICBkMy5zZWxlY3QodGhpcykuc3R5bGUoXCJmaWxsXCIsXCJ5ZWxsb3dcIik7XG4gICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwic3Ryb2tlXCIsXCJibGFja1wiKTtcbiAgICAgICAgICAgICB2YXIgc3RhdGUgPSBkLnByb3BlcnRpZXMuTkFNRTtcbiAgICAgICAgICAgICBpZiAoISRzY29wZS5ndWVzc1Jlc3VsdCB8fCAkc2NvcGUuZ3Vlc3NSZXN1bHQgIT09IFwiY29ycmVjdFwiKXtcbiAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseShmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0YXRlID0gc3RhdGU7XG4gICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgfVxuICAgICAgICAgfSlcbiAgICAgICAgIC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKGQsaSkge1xuICAgICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS5zdHlsZShcImZpbGxcIixkLnByb3BlcnRpZXMuY29sb3IpO1xuICAgICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS5zdHlsZShcInN0cm9rZVwiLFwid2hpdGVcIik7ICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICB9KTtcbiAgICB9KTtcblxuICAgICRzY29wZS5xdWVzdGlvbkF2YWlsYWJsZSA9IHRydWU7XG4gICAgJHNjb3BlLnF1ZXN0aW9ucztcbiAgICAkc2NvcGUucmFuZG9tUXVlc3Rpb247XG5cbiAgICAkc2NvcGUuZmV0Y2hSYW5kb21RdWVzdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgUXVlc3Rpb25GYWN0b3J5LmdldEFsbFF1ZXN0aW9ucygpLnRoZW4oZnVuY3Rpb24ocXVlc3Rpb25zKXtcbiAgICAgICAgICAgIHZhciBudW1RdWVzdGlvbnMgPSBxdWVzdGlvbnMubGVuZ3RoO1xuICAgICAgICAgICAgJHNjb3BlLnJhbmRvbVF1ZXN0aW9uID0gcXVlc3Rpb25zW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpudW1RdWVzdGlvbnMpXTtcbiAgICAgICAgICAgICRzY29wZS5jdXJyZW50UXVlc3Rpb24gPSAkc2NvcGUucmFuZG9tUXVlc3Rpb247XG4gICAgICAgICAgICAkc2NvcGUuc3RhdGUgPSBcIlwiO1xuICAgICAgICAgICAgJHNjb3BlLmd1ZXNzUmVzdWx0O1xuICAgICAgICAgICAgY29uc29sZS5sb2coJHNjb3BlLnJhbmRvbVF1ZXN0aW9uKTtcbiAgICAgICAgICAgICRzY29wZS51c2VyID0gVXNlckZhY3RvcnkuY3JlYXRlVXNlcigpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJHNjb3BlLnVzZXIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgJHNjb3BlLmNyZWF0ZVF1ZXN0aW9uRm9ybSA9IGZhbHNlOztcbiAgICAkc2NvcGUuY3JlYXRlUXVlc3Rpb25EaXNwbGF5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUuY3JlYXRlUXVlc3Rpb25Gb3JtID0gdHJ1ZTtcbiAgICB9O1xuICAgICRzY29wZS5oaWRlUXVlc3Rpb25EaXNwbGF5ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkc2NvcGUuY3JlYXRlUXVlc3Rpb25Gb3JtID0gZmFsc2U7XG4gICAgfVxuXG4gICAgJHNjb3BlLnNjb3JlID0gU2NvcmVGYWN0b3J5O1xufSk7XG5cbiIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgnbmF2QmFyJywgZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9OYXZiYXIvbmF2QmFyLmh0bWwnXG5cdH07XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5mYWN0b3J5KCdRdWVzdGlvbkZhY3RvcnknLCBmdW5jdGlvbiAoJGh0dHAsIFNjb3JlRmFjdG9yeSwgVXNlckZhY3RvcnkpIHtcblx0dmFyIGZhY3RvcnkgPSB7fTtcblxuXHRmYWN0b3J5LmdldEFsbFF1ZXN0aW9ucyA9IGZ1bmN0aW9uKCl7XG5cdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9xdWVzdGlvbi9maW5kQWxsJykudGhlbihmdW5jdGlvbiAocmVzKXtcblx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHR9KTtcblx0fTtcblxuXHRmYWN0b3J5LnN1Ym1pdFF1ZXN0aW9uID0gZnVuY3Rpb24ocXVlc3Rpb24pe1xuXHRcdGNvbnNvbGUubG9nKFwiaGV5XCIpO1xuXHRcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3F1ZXN0aW9uL2NyZWF0ZScsIHF1ZXN0aW9uKS50aGVuKGZ1bmN0aW9uIChyZXMpe1xuXHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdH0pXG5cdH1cblxuXHRmYWN0b3J5Lm1hbmFnZUFuc3dlciA9IGZ1bmN0aW9uKGFuc3dlciwgY2xpY2tlZCl7XG5cdFx0Y29uc29sZS5sb2coVXNlckZhY3RvcnkudXNlci5ndWVzc2VzKTtcblx0XHRpZiAoYW5zd2VyID09IGNsaWNrZWQpe1xuXHRcdFx0VXNlckZhY3RvcnkudXNlci5ndWVzc2VzID0gMDtcblx0XHRcdFNjb3JlRmFjdG9yeS5jb3JyZWN0Kys7XG5cdFx0XHRyZXR1cm4gXCJjb3JyZWN0XCI7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKGFuc3dlciAhPT0gY2xpY2tlZCAmJiBVc2VyRmFjdG9yeS51c2VyLmd1ZXNzZXMgPiAxKSB7XG5cdFx0XHRVc2VyRmFjdG9yeS51c2VyLmd1ZXNzZXMtLTtcblx0XHRcdHJldHVybiBcImluY29ycmVjdFwiO1xuXHRcdH1cblx0XHRlbHNlIHtcblx0XHRcdFVzZXJGYWN0b3J5LnVzZXIuZ3Vlc3NlcyA9IDA7XG5cdFx0XHRTY29yZUZhY3RvcnkuaW5jb3JyZWN0Kys7XG5cdFx0XHRVc2VyRmFjdG9yeS51c2VyLmFjdGl2ZSA9IGZhbHNlO1xuXHRcdFx0cmV0dXJuIFwiTm8gbW9yZSBndWVzc2VzXCI7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBmYWN0b3J5O1xufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZGlyZWN0aXZlKCdjcmVhdGVRdWVzdGlvbicsIGZ1bmN0aW9uIChRdWVzdGlvbkZhY3RvcnkpIHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvUXVlc3Rpb24vY3JlYXRlUXVlc3Rpb24uaHRtbCcsXG5cdFx0bGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW0sIGF0dHIpIHtcblx0XHRcdHNjb3BlLmFkZFF1ZXN0aW9uID0gZnVuY3Rpb24ocXVlc3Rpb24pIHtcblx0XHRcdFx0UXVlc3Rpb25GYWN0b3J5LnN1Ym1pdFF1ZXN0aW9uKHF1ZXN0aW9uKS50aGVuKGZ1bmN0aW9uKHJlcyl7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2cocmVzKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9O1xuXHRcdH1cblx0fTtcbn0pOyIsIid1c2Ugc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgncXVlc3Rpb24nLCBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL1F1ZXN0aW9uL3F1ZXN0aW9uLmh0bWwnXG5cdH07XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5mYWN0b3J5KCdTY29yZUZhY3RvcnknLCBmdW5jdGlvbigpIHtcblx0dmFyIGZhY3RvcnkgPSB7XG5cdFx0Y29ycmVjdDogMCxcblx0XHRpbmNvcnJlY3Q6IDBcblx0fTtcblx0cmV0dXJuIGZhY3Rvcnk7XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbmFwcC5mYWN0b3J5KCdVc2VyRmFjdG9yeScsIGZ1bmN0aW9uKCkge1xuXG5cdHZhciBmYWN0b3J5ID0ge307XG5cblx0dmFyIFVzZXIgPSBmdW5jdGlvbiAoKXtcblx0XHR0aGlzLmd1ZXNzZXMgPSAzO1xuXHRcdHRoaXMuYWN0aXZlID0gdHJ1ZTtcblx0fTtcblxuXHRmYWN0b3J5LmNyZWF0ZVVzZXIgPSBmdW5jdGlvbigpe1xuXHRcdGZhY3RvcnkudXNlciA9IG5ldyBVc2VyKCk7XG5cdFx0cmV0dXJuIGZhY3RvcnkudXNlcjtcblx0fTtcblxuXHRyZXR1cm4gZmFjdG9yeTtcbn0pOyIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoJGxvY2F0aW9uKSB7XG5cbiAgICAgICAgaWYgKCF3aW5kb3cuaW8pIHRocm93IG5ldyBFcnJvcignc29ja2V0LmlvIG5vdCBmb3VuZCEnKTtcblxuICAgICAgICB2YXIgc29ja2V0O1xuXG4gICAgICAgIGlmICgkbG9jYXRpb24uJCRwb3J0KSB7XG4gICAgICAgICAgICBzb2NrZXQgPSBpbygnaHR0cDovL2xvY2FsaG9zdDoxMzM3Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzb2NrZXQgPSBpbygnLycpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHNvY2tldDtcblxuICAgIH0pO1xuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goW1xuICAgICAgICAgICAgJyRpbmplY3RvcicsXG4gICAgICAgICAgICBmdW5jdGlvbiAoJGluamVjdG9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRpbmplY3Rvci5nZXQoJ0F1dGhJbnRlcmNlcHRvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5zZXJ2aWNlKCdBdXRoU2VydmljZScsIGZ1bmN0aW9uICgkaHR0cCwgU2Vzc2lvbiwgJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMsICRxKSB7XG5cbiAgICAgICAgdmFyIG9uU3VjY2Vzc2Z1bExvZ2luID0gZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKHsgdXNlcjogU2Vzc2lvbi51c2VyIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCB0aGlzLmRlc3Ryb3kpO1xuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgdGhpcy5kZXN0cm95KTtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==