let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let Userschema = new Schema({
    first_name: {
        type: String,
        index: true,
        default: ""
    },
    last_name: {
        type: String,
        index: true,
        default: ""
    },
    role: {
        type: String,
        enum: ['1', '2', '3'], // 1 - admin, 2 - user, 3 - driver,
        default: '2'
    },
    email: {
        type: String,
        index: true,
        default: ""
    },
    password: {
        type: String,
        default: ""
    },
    forgot_password: {
        type: String,
        default: ""
    },
    country_code: {
        type: String,
        default: ""
    },
    phone: {
        type: String,default: "",
        index: true
    },
    otp: {
        type: String,
        default: 0
    },
    is_otp_verified: {
        type: String,
        default: 0
    },
    is_phone_verified: {
        type: Boolean,
        default: false
    },
    is_email_verified: {
        type: Boolean,
        default: false
    },
    image: {
        original: { type: String, default: '' },
        thumbnail: { type: String, default: '' }
    },
    device_type: {
        type: String,
        enum: ["1", "2"], // 1 - android, 2 - ios,
        default: "1"
    }, 
    device_token: {
        type: String,
        default: ""
    },
    social_type: {
        type: String,
        enum: ["1", "2", "3"], // 1 - google, 2 - fb, 3- apple
        default: "1"
    },
    social_id: {
        type: String,
        default: ""
    },
    geometry: {
        type: [Number], index: '2dsphere', sparse: true
    },
    stripe_id: {
        type: String,
        default: ""
    },
    access_token: {
        type: String,
        trim: true,default: ""
    },
    login_time: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    wallet_balance: {
        type: String,
        default: '0.0'
    },
    status: {
        type: String,
        enum: ['0', '1', ],  // 1 - active, 0 - inactive,
        default: '1'
    },
    notification_status: {
        type: String,
        enum: ['0', '1', ], // 1 - active, 0 - inactive,
        default: '1'
    }
}, { timestamps: true });

const user = mongoose.model('users', Userschema);
module.exports = user;
