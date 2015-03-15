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

