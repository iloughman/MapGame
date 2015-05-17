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
             d3.select(this).style("fill","red");
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

