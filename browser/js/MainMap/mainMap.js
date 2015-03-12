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

