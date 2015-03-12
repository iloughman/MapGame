'use strict';
var crypto = require('crypto');
var mongoose = require('mongoose');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongodb connection error: '));

var userSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    firstName: {type: String},
    lastName: {type: String},
    email: { type: String },
    questions: [{type: mongoose.Schema.Types.ObjectId, ref: 'Question'}],
    password: { type: String },
    salt: { type: String },
    facebook: { id: String },
    google: { id: String }
});

// generateSalt, encryptPassword and the pre 'save' and 'correctPassword' operations
// are all used for local authentication security.
var generateSalt = function () {
    return crypto.randomBytes(16).toString('base64');
};

var encryptPassword = function (plainText, salt) {
    var hash = crypto.createHash('sha1');
    hash.update(plainText);
    hash.update(salt);
    return hash.digest('hex');
};

userSchema.pre('save', function (next) {

    var user = this;

    if (user.isModified('password')) {
        user.salt = generateSalt();
        user.password = encryptPassword(user.password, user.salt);
    }

    next();

});

userSchema.method('correctPassword', function (candidatePassword) {
    return encryptPassword(candidatePassword, this.salt) === this.password;
});

mongoose.model('User', userSchema);