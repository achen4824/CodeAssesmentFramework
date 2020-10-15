var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var logger = require('morgan');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

require('./models/admin.js');
require('./models/candidate.js');
require('./models/question.js');
require('./models/allocation.js');
require('./models/test.js');

var indexRouter = require('./routes/index');
// todo: delete usersRouter
var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');
var candidateRouter = require('./routes/candidate');

// use MongoDB in this app
var mongoClient = require('mongodb').MongoClient;

var app = express();

// mongoose.connect('mongodb+srv://dbAdmin:admin123@sep-nhond.mongodb.net/test?retryWrites=true&w=majority', {
const connection = mongoose.connect('mongodb://localhost:27017/hireMeCoder', {
	poolSize: 10,
	// autoIndex: false,
	useNewUrlParser: true,
  useFindAndModify: false
}, function(err) {
	if (err) throw err;
	console.log('database succesfully connected');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Configuring express to use body-parser as middle-ware.
// body-parser extracts the incoming request stream and exposes it on req.body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({secret:"thisissession", resave:true, saveUninitialized:true}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// middleware for accessing database. NOTE: needs to be before app.use('/', routes).
app.use(function(req, res, next) { 
  req.mdb = mongoClient; 
  next(); 
});

app.use('/', indexRouter);
// todo: delete app.use('/users')
app.use('/users', usersRouter);
app.use('/admin', adminRouter);
app.use('/candidate', candidateRouter);

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

module.exports = app;
