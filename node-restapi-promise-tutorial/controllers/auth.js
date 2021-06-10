const { validationResult } = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.signup = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    const status = 'I am new';
    const createdAt = new Date();
    bcrypt.hash(password, 12)
        .then(hashedPw => {
            const user = new User(null, email, hashedPw, name, status, createdAt);
            return user.save();
        })
        .then(result => {
            res.status(201).json({
                message: 'user created',
                userId: result[0].insertId
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}


exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    User.findByEmail(email)
        .then(([rows, fieldData]) => {
            if (rows.length == 0) {
                const error = new Error('A user with this email could not be found');
                error.statusCode = 500;
                throw error;
            }
            loadedUser = rows[0];
            return bcrypt.compare(password, rows[0].password);
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong password');
                error.statusCode = 401;
                throw error;
            }
            const token = jwt.sign(
                {
                    email: loadedUser.email,
                    userId: loadedUser.id.toString()
                },
                'somesupersecretsecret',
                { expiresIn: '1h' }
            );
            res.status(200).json({ token: token, userId: loadedUser.id.toString() })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.getUserStatus = (req, res, next) => {
    User.findById(req.userId)
        .then(([rows, fieldData]) => {
            if (rows.length == 0) {
                const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                status: rows[0].status
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

exports.updateUserStatus = (req, res, next) => {
    const newStatus = req.body.status;
    User.findById(req.userId)
        .then(([rows, fieldData]) => {
            console.log(rows[0]);
            if (rows.length == 0) {
                const error = new Error('User not found');
                error.statusCode = 404;
                throw error;
            }
            return User.update(newStatus, rows[0].id);
        })
        .then(result=>{
            res.status(200).json({message:'User updated.'})
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}