const express = require('express');
const User = require('../models/user');
const { body } = require('express-validator/check');

const router = express.Router();
const authController = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');

router.put('/signup', [
    body('email')
        .isEmail().withMessage('Please enter valid email.')
        .custom((value, { req }) => {
            return User.chkEmailCount(value).then(([rows, fieldData]) => {
                if (rows[0].emailCount > 0) {
                    return Promise.reject('E-Mail address already exists!');
                }
            })
        })
        .normalizeEmail(),
    body('password').trim().isLength({ min: 5 }),
    body('name').trim().notEmpty()
], authController.signup);

router.post('/login', authController.login);

router.get('/status', isAuth, authController.getUserStatus);

router.patch('/status', isAuth, [
    body('status').trim().notEmpty()
    ],
    authController.updateUserStatus
)

module.exports = router;