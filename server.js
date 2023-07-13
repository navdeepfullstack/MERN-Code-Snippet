var createError = require('http-errors');
var express = require('express');
var bodyParser = require('body-parser');
const cors = require('cors');

var app = express();
const fileUpload = require('express-fileupload');
const server = require('http').Server(app);
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
var Constants = require('./config/appConstants');

global.ObjectId = mongoose.Types.ObjectId;
var dotenv = require('dotenv');
dotenv.config();
var mongoURI = require('./config/dbConfig').mongo;

const [ admin_api,  api] = require('./src').routes;


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.set(Constants.SERVER.JWT_SECRET_KEY, Constants.SERVER.JWT_SECRET_VAL);

app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit:50000}));

app.use(logger('dev'));
app.use(express.json());
// app.use(fileUpload());
app.use(fileUpload({
  useTempFiles : true,
  tempFileDir : '/tmp/'
}));

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.Promise = global.Promise;

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('error', function (err) {
    console.log(err);
    console.log('error in connecting, process is exiting ...');
    process.exit();
});

mongoose.connection.once('open', function () {
    console.log('Successfully connected to database');
});


app.use('/admin_api', admin_api);
app.use('/api', api);

app.use('/node_modules_url', express.static(path.join(__dirname, 'node_modules')));
app.use('/', express.static(path.join(__dirname, 'frontend/build')));
app.use('/*', express.static(path.join(__dirname, 'frontend/build')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

server.listen(process.env.PORT, function () {
  console.log('Node app is running on port', process.env.PORT);
});

module.exports = app;
