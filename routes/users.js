var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

//candidate login action
router.post('/login_action', function(req, res, next){

});

//admin login action
router.post('/admin_login_action', function(req, res, next){

});

//create admin
router.post('/createAdmin', function(req, res, next){
	console.log("ROUTE: createAdmin");
	//get the user inputs from request object
	var inputName = req.body.name;
	var inputEmail = req.body.email;
	var inputPwd = req.body.pwd;

	console.log("inputName: " + inputName + ", inputEmail: " + inputEmail + ", inputPwd: " + inputPwd);

	//Connect to database
	req.mdb.connect('mongodb://localhost:27017', function (err, database) {
		if (err) throw err

		//get database object
		var mongodb = database.db('maptek_assessment');

		//access the admin collection and check if the inputEmail exists.
		mongodb.collection('admin').find({"email":inputEmail}).toArray(function (err, result) {
		if (err) throw err

			//check if result is empty, then this email doesnt exist in the database and add to database.
			if (result.length==0){
				mongodb.collection('admin').insertOne({"name":inputName, "email":inputEmail, "pwd":inputPwd});
			}
			else{
				
			}
		})
	})
	res.status(200).redirect('/admin.html');
});


module.exports = router;
