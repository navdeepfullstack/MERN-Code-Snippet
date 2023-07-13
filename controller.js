'use strict';

const { Validator } = require('node-input-validator');
var jwt = require('jsonwebtoken');
const moment = require("moment");
const helper = require('../../../helper/helper');
const bcrypt = require('bcryptjs');
const Constants = require('../../../config/appConstants');
const stripe = require('stripe')(Constants.GLOBALVALUES.STRIPE_KEY);
const Models = require('../../../models');
	

module.exports = {

    file_upload: async function (req, res, next) {
        try {
            const required = {
                type: req.body.type,
                folder: req.body.folder
            };
            const non_required = {};
            const requestdata = await helper.vaildObject(required, non_required, res);

            if (req.files == null) {
                return helper.failed(res, "Please select image")
            }

            console.log("req.body ------------ ", req.body)
            console.log("req.files ------------ ", req.files)
            let PAYLOAD = req.body;
            var FILE_TYPE = PAYLOAD.type; // image,video,etc
            var FOLDER = req.body.folder; //PAYLOAD.folder;// user,category,products,etc

            var image_data = [];
            if (req.files && req.files.image && Array.isArray(req.files.image)) {
                for (var imgkey in req.files.image) {
                    var image_url = await helper.fileUploadMultiparty(req.files.image[imgkey], FOLDER, FILE_TYPE);
                    image_data.push(image_url)
                }
                return res.status(200).json({
                    status: true,
                    code: 200,
                    message: 'Successufully',
                    body: image_data
                });
            } else if (req.files.image.name != "") {
                var image_url = await helper.fileUploadMultiparty(req.files.image, FOLDER, FILE_TYPE);
                image_data.push(image_url)
                return res.status(200).json({
                    status: true,
                    code: 200,
                    message: 'Successufully',
                    body: image_data
                });
            } else {
                return res.status(200).json({
                    status: false,
                    code: 400,
                    message: "Error - Image can't be empty",
                    body: []
                });
            }
        } catch (err) {
            console.log(err)
            return helper.failed(res, err)
        }
    },

    signup: async (req, res) => {
		try {
			let v = new Validator( req.body, {
                first_name: 'required', 
                last_name: 'required', 
                role: 'required|integer',  // 2 for user, 3 for driver
                email: 'required|email', 
                country_code: 'required', 
                phone: 'required', 
                password: 'required', 
                // image: 'required', 
                confirm_password: 'required|same:password', 
            });
            var errorsResponse
            await v.check().then(function (matched) {
                if (!matched) {
                    var valdErrors=v.errors;
                    var respErrors=[];
                    Object.keys(valdErrors).forEach(function(key)
                    {
                        if(valdErrors && valdErrors[key] && valdErrors[key].message){
                            respErrors.push(valdErrors[key].message);
                        }
                    });   
                    errorsResponse=respErrors.join(', ');
                }
            });
            if(errorsResponse){
               return helper.failed(res, errorsResponse)
			}
			
			const {first_name, last_name, email, role, password, image, confirm_password, country_code, phone, } = req.body;
			
			if (role != 2 && role != 3) {
                return helper.failed(res, "Invalid role.")
            }
			
			//check exist user	
			const find_exist_user = await Models.Users.findOne({ email });
			
			if(find_exist_user) 
				return helper.failed(res, "This email already exists.")
			

			//check exist user phone
			const find_exist_phone = await Models.Users.findOne({ phone });
			if(find_exist_phone){
				return helper.failed(res, "This phone number already exists.")
            }

            let signup_otp = 1111;
            
			//hash the password
			const salt = bcrypt.genSaltSync(8);
			const passwordHash = bcrypt.hashSync(password, salt);

			let time = helper.unixTimestamp();
			let image_val = {};
            if (image) {
                for (var imgkey of JSON.parse(image)) {
					var image_data = {
						original : imgkey.image,
						thumbnail : imgkey.thumbnail
					};
					image_val = image_data
                } 
			}   

			req.body.login_time = time;
			req.body.otp = signup_otp;
			req.body.password = passwordHash;
			req.body.image  = image_val ? image_val : { original : '', thumbnail : '' };

			let create_user = await Models.Users.create(req.body);
          
			if (create_user) {
                let to = email;
                let html = await helper.resend_otp_html(signup_otp);
                await helper.sendEmail({
                    from: process.env.EMAIL_FROM,
                    to: to,
                    subject: 'PackageDelivery Reset Otp',
                    html: html
                });

                const customer = await stripe.customers.create({
                    email: email,
                });
                let stripe_id = customer.id
                
                let update_details = await Models.Users.findOne(
                    {"_id": create_user._id },
                );
                update_details.stripe_id = stripe_id
                update_details.save()

				let token = jwt.sign({
                    data: {
                        _id: create_user._id,
                        email: create_user.email,
                        login_time: create_user.login_time,
                    }
				}, Constants.SERVER.JWT_SECRET_KEY);

				create_user.access_token = token;
				return helper.success(res, "Signup successfully.", create_user);
			} else {
				return helper.failed(res, "Error. Please try again.")
			}
  
        } catch (error) {
			console.log(error)
			return helper.failed(res, error)
		}
	},

	login: async (req, res) => {
		try {
			let v = new Validator( req.body, {
                email: 'required|email', 
                password: 'required',
                role: 'required|integer',
            });
            var errorsResponse
            await v.check().then(function (matched) {
                if (!matched) {
                    var valdErrors=v.errors;
                    var respErrors=[];
                    Object.keys(valdErrors).forEach(function(key)
                    {
                        if(valdErrors && valdErrors[key] && valdErrors[key].message){
                            respErrors.push(valdErrors[key].message);
                        }
                    });   
                    errorsResponse=respErrors.join(', ');
                }
            });
            if(errorsResponse){
               return helper.failed(res, errorsResponse)
			}
			const { email, password, device_type, role, device_token } = req.body;

			if (role != 2 && role != 3) {
                return helper.failed(res, "Invalid role.")
            }

			let check_email_exists = await Models.Users.findOne({ email });

			if (!check_email_exists) {
				return helper.failed(res, "Invalid Credentials.")
			}

			if(role != check_email_exists.role){
				let roleMessage = role == 2 ? 'Please login with driver App' : 'Please login with User App';
                    return helper.failed(res, roleMessage)
			}
			
			//check password
			const passwordCorrect = await bcrypt.compare(password, check_email_exists.password);

			if(!passwordCorrect) {
				return helper.failed(res, "Invalid Credentials.")
			}

			let time = helper.unixTimestamp();
			
			let login_user = await Models.Users.findOne(
				{"_id": check_email_exists._id },
			);
			login_user.device_token = device_token
			login_user.device_type = device_type
			login_user.login_time = time
			login_user.save()
				
			if(login_user){
				let token = jwt.sign({
                    data: {
                        _id: check_email_exists._id,
						email: check_email_exists.email,
						login_time: login_user.login_time,
                    }
                }, Constants.SERVER.JWT_SECRET_KEY);

				login_user.access_token = token;
			return helper.success(res, "Login successfully.", login_user);
			} else {
				return helper.failed(res, "Error. Please try again.")
			}
			
		} catch (error) {
			console.log(error)
			return helper.failed(res, error)
		}
	},


    update_profile: async (req, res) => {
        try {
            let v = new Validator( req.body, {
                // email: 'required|email', 
                first_name: 'required',
                last_name: 'required',
                location: 'required',
                latitude: 'required',
                longitude: 'required',
                country_code: 'required',
                phone: 'required',
            });
            var errorsResponse
            await v.check().then(function (matched) {
                if (!matched) {
                    var valdErrors=v.errors;
                    var respErrors=[];
                    Object.keys(valdErrors).forEach(function(key)
                    {
                        if(valdErrors && valdErrors[key] && valdErrors[key].message){
                            respErrors.push(valdErrors[key].message);
                        }
                    });   
                    errorsResponse=respErrors.join(', ');
                }
            });
            if(errorsResponse){
               return helper.failed(res, errorsResponse)
			}
			const {_id, role} = req.user
			const {phone, image} = req.body
            //check exist user phone
			const find_exist_phone = await Models.Users.findOne({ phone, _id: { $ne: _id } });
			if(find_exist_phone){
				return helper.failed(res, "This phone number already exists.")
            }
			let image_val = {};
			if (req.body.image) {
				for (var imgkey of JSON.parse(image)) {
					let image_data = {
						original : imgkey.image,
						thumbnail : imgkey.thumbnail
					};
					image_val = image_data
				}
			} else {
				let image_data = {
					original : req.user.image.original,
					thumbnail : req.user.image.thumbnail
				};
				image_val = image_data
			}

			req.body.image = image_val;
			req.body.geometry = [req.body.longitude, req.body.latitude];
            let updateData = await Models.Users.updateMany({_id,role}, req.body)
    
            if (updateData) {
                let getData = await Models.Users.findOne({ _id, role });
                return helper.success(res, "Profile updated successfully.", getData);
            } else {
                return helper.failed(res, "Error. Please try again.")
            }
        } catch (error) {
            return helper.failed(res, error)
        }
    },

	change_password: async (req, res) => {
        try {
            let v = new Validator( req.body, {
                old_password: 'required|string', 
                new_password: 'required|different:old_password', 
                confirm_password: 'required|same:new_password',
            });
            var errorsResponse
            await v.check().then(function (matched) {
                if (!matched) {
                    var valdErrors=v.errors;
                    var respErrors=[];
                    Object.keys(valdErrors).forEach(function(key)
                    {
                        if(valdErrors && valdErrors[key] && valdErrors[key].message){
                            respErrors.push(valdErrors[key].message);
                        }
                    });   
                    errorsResponse=respErrors.join(', ');
                }
            });
            if(errorsResponse){
               return helper.failed(res, errorsResponse)
			}

			const { old_password, new_password, confirm_password } = req.body;
			const {_id, role, password} = req.user

            //check password
			const checkPassword = await bcrypt.compare(old_password, password);

            if (checkPassword == false) {
                let msg =  "Please enter correct old password";
				return helper.failed(res, msg);
            } else {
				//hash the password
				const salt = bcrypt.genSaltSync(8);
				const passwordHash = bcrypt.hashSync(new_password, salt);
				let getData = await Models.Users.findOne({ _id, role });
				getData.password = passwordHash;
                if (getData.save()) {
                    return helper.success(res, 'Password updated successfully.', {});
                } else {
					return helper.failed(res, "Error...Please try again");
                }
            }
        } catch (err) {
            return helper.failed(res, err);
        }
    },

	logout: async (req, res) => {
		try {
			let CheckAuth = await Models.Users.findOne({_id: req.user._id});

			if (CheckAuth) {
                let Updateauth = await Models.Users.updateMany(
					{_id: req.user._id },
                   	{
					    device_token: '',
                    	login_time: 0,
					}
				);
                if (Updateauth) {
                    let msg = "User Logged Out Successfully !"
                    return helper.success(res, msg, {});
                } else {
                    return helper.failed(res, "Something went wrong")
                }
            } else {
                let msg = "Invalid Token !";
                return helper.failed(res, msg)
            }
		} catch (error) {
			console.log(error)
			return helper.failed(res, error)
		}
    },
    
    
};