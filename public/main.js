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

app.controller('mainMapCtrl', function ($scope, QuestionFactory) {

    var width = 1000;
    var height = 1000;

    var svg = d3.select("svg")
     .attr("width", width)
     .attr("height", height);

    var path = d3.geo.path()

    $scope.state = "(click a on state to guess)";
    $scope.guessResult = null;

    d3.json("states.json", function (error, states) {
     if (error) return console.log(error);
     console.log(states);

     svg.selectAll("path")
         .data(states.features)
         .enter().append("path")
         .attr("d",path)
         .attr("stroke", "black")
         .attr("fill","yellow")
         .on('click', function(d,i) {
            var state = d.properties.NAME;
            $scope.$apply(function(){
                $scope.state = state;
                $scope.guessResult = QuestionFactory.checkAnswer($scope.currentQuestion.answer, state);
            });
            
         })
         .on('mouseenter', function(d,i) {
             d3.select(this).style("fill","#ccc");
             var state = d.properties.NAME;
             if (!$scope.guessResult || $scope.guessResult !== "correct"){
                 $scope.$apply(function(){
                     $scope.state = state;
                 })
             }
         })
         .on('mouseleave', function(d,i) {
             d3.select(this).style("fill","yellow");                     
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

        });
    };
});


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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsIk1haW5NYXAvbWFpbk1hcC5qcyIsIlF1ZXN0aW9uL1F1ZXN0aW9uRmFjdG9yeS5qcyIsIlF1ZXN0aW9uL3F1ZXN0aW9uLmpzIiwiZnNhL2ZzYS1wcmUtYnVpbHQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG52YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ01hcEdhbWUnLCBbJ3VpLnJvdXRlcicsICdmc2FQcmVCdWlsdCddKTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ21haW5NYXAnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL01haW5NYXAvbWFpbk1hcC5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ21haW5NYXBDdHJsJ1xuICAgIH0pO1xufSk7XG5cbmFwcC5jb250cm9sbGVyKCdtYWluTWFwQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsIFF1ZXN0aW9uRmFjdG9yeSkge1xuXG4gICAgdmFyIHdpZHRoID0gMTAwMDtcbiAgICB2YXIgaGVpZ2h0ID0gMTAwMDtcblxuICAgIHZhciBzdmcgPSBkMy5zZWxlY3QoXCJzdmdcIilcbiAgICAgLmF0dHIoXCJ3aWR0aFwiLCB3aWR0aClcbiAgICAgLmF0dHIoXCJoZWlnaHRcIiwgaGVpZ2h0KTtcblxuICAgIHZhciBwYXRoID0gZDMuZ2VvLnBhdGgoKVxuXG4gICAgJHNjb3BlLnN0YXRlID0gXCIoY2xpY2sgYSBvbiBzdGF0ZSB0byBndWVzcylcIjtcbiAgICAkc2NvcGUuZ3Vlc3NSZXN1bHQgPSBudWxsO1xuXG4gICAgZDMuanNvbihcInN0YXRlcy5qc29uXCIsIGZ1bmN0aW9uIChlcnJvciwgc3RhdGVzKSB7XG4gICAgIGlmIChlcnJvcikgcmV0dXJuIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgY29uc29sZS5sb2coc3RhdGVzKTtcblxuICAgICBzdmcuc2VsZWN0QWxsKFwicGF0aFwiKVxuICAgICAgICAgLmRhdGEoc3RhdGVzLmZlYXR1cmVzKVxuICAgICAgICAgLmVudGVyKCkuYXBwZW5kKFwicGF0aFwiKVxuICAgICAgICAgLmF0dHIoXCJkXCIscGF0aClcbiAgICAgICAgIC5hdHRyKFwic3Ryb2tlXCIsIFwiYmxhY2tcIilcbiAgICAgICAgIC5hdHRyKFwiZmlsbFwiLFwieWVsbG93XCIpXG4gICAgICAgICAub24oJ2NsaWNrJywgZnVuY3Rpb24oZCxpKSB7XG4gICAgICAgICAgICB2YXIgc3RhdGUgPSBkLnByb3BlcnRpZXMuTkFNRTtcbiAgICAgICAgICAgICRzY29wZS4kYXBwbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgICAgICAgICAkc2NvcGUuZ3Vlc3NSZXN1bHQgPSBRdWVzdGlvbkZhY3RvcnkuY2hlY2tBbnN3ZXIoJHNjb3BlLmN1cnJlbnRRdWVzdGlvbi5hbnN3ZXIsIHN0YXRlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICB9KVxuICAgICAgICAgLm9uKCdtb3VzZWVudGVyJywgZnVuY3Rpb24oZCxpKSB7XG4gICAgICAgICAgICAgZDMuc2VsZWN0KHRoaXMpLnN0eWxlKFwiZmlsbFwiLFwiI2NjY1wiKTtcbiAgICAgICAgICAgICB2YXIgc3RhdGUgPSBkLnByb3BlcnRpZXMuTkFNRTtcbiAgICAgICAgICAgICBpZiAoISRzY29wZS5ndWVzc1Jlc3VsdCB8fCAkc2NvcGUuZ3Vlc3NSZXN1bHQgIT09IFwiY29ycmVjdFwiKXtcbiAgICAgICAgICAgICAgICAgJHNjb3BlLiRhcHBseShmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnN0YXRlID0gc3RhdGU7XG4gICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgfVxuICAgICAgICAgfSlcbiAgICAgICAgIC5vbignbW91c2VsZWF2ZScsIGZ1bmN0aW9uKGQsaSkge1xuICAgICAgICAgICAgIGQzLnNlbGVjdCh0aGlzKS5zdHlsZShcImZpbGxcIixcInllbGxvd1wiKTsgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgJHNjb3BlLnF1ZXN0aW9uQXZhaWxhYmxlID0gdHJ1ZTtcbiAgICAkc2NvcGUucXVlc3Rpb25zO1xuICAgICRzY29wZS5yYW5kb21RdWVzdGlvbjtcblxuICAgICRzY29wZS5mZXRjaFJhbmRvbVF1ZXN0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBRdWVzdGlvbkZhY3RvcnkuZ2V0QWxsUXVlc3Rpb25zKCkudGhlbihmdW5jdGlvbihxdWVzdGlvbnMpe1xuICAgICAgICAgICAgdmFyIG51bVF1ZXN0aW9ucyA9IHF1ZXN0aW9ucy5sZW5ndGg7XG4gICAgICAgICAgICAkc2NvcGUucmFuZG9tUXVlc3Rpb24gPSBxdWVzdGlvbnNbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKm51bVF1ZXN0aW9ucyldO1xuICAgICAgICAgICAgJHNjb3BlLmN1cnJlbnRRdWVzdGlvbiA9ICRzY29wZS5yYW5kb21RdWVzdGlvbjtcbiAgICAgICAgICAgICRzY29wZS5zdGF0ZSA9IFwiXCI7XG4gICAgICAgICAgICAkc2NvcGUuZ3Vlc3NSZXN1bHQ7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUucmFuZG9tUXVlc3Rpb24pO1xuXG4gICAgICAgIH0pO1xuICAgIH07XG59KTtcblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5hcHAuZmFjdG9yeSgnUXVlc3Rpb25GYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwKSB7XG5cdHZhciBmYWN0b3J5ID0ge307XG5cdGZhY3RvcnkuZ2V0QWxsUXVlc3Rpb25zID0gZnVuY3Rpb24oKXtcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3F1ZXN0aW9uL2ZpbmRBbGwnKS50aGVuKGZ1bmN0aW9uIChyZXMpe1xuXHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdH0pO1xuXHR9O1xuXHRmYWN0b3J5LmNoZWNrQW5zd2VyID0gZnVuY3Rpb24oYW5zd2VyLGNsaWNrZWQpe1xuXHRcdGlmIChhbnN3ZXIgPT0gY2xpY2tlZCl7XG5cdFx0XHRyZXR1cm4gXCJjb3JyZWN0XCI7XG5cdFx0fVxuXHRcdGVsc2Uge1xuXHRcdFx0cmV0dXJuIFwiaW5jb3JyZWN0XCI7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBmYWN0b3J5O1xufSk7IiwiJ3VzZXIgc3RyaWN0JztcblxuYXBwLmRpcmVjdGl2ZSgncXVlc3Rpb24nLCBmdW5jdGlvbiAoUXVlc3Rpb25GYWN0b3J5KSB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL1F1ZXN0aW9uL3F1ZXN0aW9uLmh0bWwnLFxuXHRcdGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbSwgYXR0cil7XG5cdFx0XHRzY29wZS5hbnN3ZXJlZCA9IGZhbHNlO1xuXHRcdFx0c2NvcGUuYW5zd2VyZWRDb3JyZWN0bHkgPSAgZmFsc2U7XG5cdFx0fVxuXHR9O1xufSk7IiwiKGZ1bmN0aW9uICgpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIC8vIEhvcGUgeW91IGRpZG4ndCBmb3JnZXQgQW5ndWxhciEgRHVoLWRveS5cbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XG5cbiAgICB2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2ZzYVByZUJ1aWx0JywgW10pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ1NvY2tldCcsIGZ1bmN0aW9uICgkbG9jYXRpb24pIHtcblxuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuXG4gICAgICAgIHZhciBzb2NrZXQ7XG5cbiAgICAgICAgaWYgKCRsb2NhdGlvbi4kJHBvcnQpIHtcbiAgICAgICAgICAgIHNvY2tldCA9IGlvKCdodHRwOi8vbG9jYWxob3N0OjEzMzcnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNvY2tldCA9IGlvKCcvJyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc29ja2V0O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLmZhY3RvcnkoJ0F1dGhJbnRlcmNlcHRvcicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCAkcSwgQVVUSF9FVkVOVFMpIHtcbiAgICAgICAgdmFyIHN0YXR1c0RpY3QgPSB7XG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXG4gICAgICAgICAgICA0MDM6IEFVVEhfRVZFTlRTLm5vdEF1dGhvcml6ZWQsXG4gICAgICAgICAgICA0MTk6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LFxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KHN0YXR1c0RpY3RbcmVzcG9uc2Uuc3RhdHVzXSwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcblxuICAgICAgICB2YXIgb25TdWNjZXNzZnVsTG9naW4gPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gcmVzcG9uc2UuZGF0YTtcbiAgICAgICAgICAgIFNlc3Npb24uY3JlYXRlKGRhdGEuaWQsIGRhdGEudXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcbiAgICAgICAgICAgIHJldHVybiBkYXRhLnVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5nZXRMb2dnZWRJblVzZXIgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oeyB1c2VyOiBTZXNzaW9uLnVzZXIgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2xvZ2luJywgY3JlZGVudGlhbHMpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIHRoaXMuZGVzdHJveSk7XG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCB0aGlzLmRlc3Ryb3kpO1xuXG4gICAgICAgIHRoaXMuY3JlYXRlID0gZnVuY3Rpb24gKHNlc3Npb25JZCwgdXNlcikge1xuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IHVzZXI7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbn0pKCk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9