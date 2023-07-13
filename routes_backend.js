'use strict';

// npm modules
const express = require('express');

// router
const router = express.Router();
const requireAuthentication = require('../../../passport').authenticateUser;

// local modules
const controller = require('./controller');

router.route('/file_upload').post(controller.file_upload);

//auth 
router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.post('/social_login', controller.social_login);
router.post('/logout', requireAuthentication, controller.logout);
router.post('/verify_otp', requireAuthentication, controller.verify_otp);
router.post('/resend_otp', requireAuthentication, controller.resend_otp);

//password
router.post('/change_password', requireAuthentication, controller.change_password);
router.post('/forgot_password', controller.forgot_password);
router.get('/reset_password/:id', controller.reset_password_form);
router.post('/update_reset_password', controller.reset_password);

//profile
router.get('/get_profile', requireAuthentication, controller.get_profile);
router.post('/update_profile', requireAuthentication, controller.update_profile);



module.exports = router;
