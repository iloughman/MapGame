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