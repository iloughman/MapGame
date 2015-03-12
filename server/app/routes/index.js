'use strict';
var router = require('express').Router();

router.use('/question', require('./question.js'));

module.exports = router;