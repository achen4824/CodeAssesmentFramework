const fs = require('fs');
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
const emailWrapper = require('./email-wrapper');
const bcrypt = require('bcrypt');
const saltRounds = 10;

var candidateModel = mongoose.model('Candidate');
var adminModel = mongoose.model('Admin');
var questionModel = mongoose.model('Question');

//function to generate randomized name to avoid conflicts
function makeName(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

//get java class name for file
function getJavaClass(sourceCode){
  var tokens = sourcecode.split(" ");
  var fname = "";
  for (let i = 0; i < tokens.length; i++)
    if (tokens[i] == "public")
      if (tokens[i + 1] == "class")
        return fname = tokens[i + 2];
}

async function runSource(sourceCode, type){
  var results = '';
  var runCommand = undefined;
  let compile = undefined;

  //create directory
  var name = makeName(6);
  var folderName = "temp/" + name;
  fs.mkdirSync(folderName);
  fileName = folderName + "/" + name;
  source = fileName;
  var t0 = new Date().getTime();

  //create and compile files
  switch(type){
    case "python":
      fs.writeFile(fileName + ".py", sourceCode, function (err,data) {
        if (err) {
          return console.log(err);
        }
      });
      runCommand = "python3 " + name + ".py";
      name = name + ".py"
      break;
    case "c_cpp":
      fs.writeFile(fileName + ".cpp", sourceCode, function (err,data) {
        if (err) {
          return console.log(err);
        }
      });
      compile = spawn("gcc", ["-o" + fileName, fileName + ".cpp", "-lstdc++"]);
      runCommand = "./"+ name;
      break;
    case "java":
      name = getJavaClass(sourceCode);
      fileName = folderName + "/" + name;
      fs.writeFile(fileName + ".java", sourceCode, function (err,data) {
        if (err) {
          return console.log(err);
        }
      });
      compile = spawn("javac", [fileName + ".java"]);
      runCommand = "java " + name;
      name = name + ".class";
      break;
    case "csharp":
      fs.writeFile(fileName + ".cs", sourceCode, function (err,data) {
        if (err) {
          return console.log(err);
        }
      });
      compile = spawn("mcs", ["-out:"+ fileName + ".exe", fileName + ".cs"]);
      runCommand = "mono "+ name + ".exe "
      name = name + ".exe"
  }
  if(type != "python"){
    for await(const data of compile.stdout) {
      results += data;
    }
    for await(const data of compile.stderr) {
      results += data;
    }
    var exitCode = await new Promise( (resolve, reject) => {
        compile.on('close', resolve);
    });
    if( exitCode) {
      return results;
    }
  }

  var t1 = new Date().getTime();

  results += "Compiled Successfully in " + (t1-t0)/1000 + " seconds\n";

  //create script for running in container
  fs.writeFile(folderName + "/script.sh", "#!/bin/sh\necho \"OUTPUT: \"\n" + runCommand, function (err,data) {
    if (err) {
      return console.log(err);
    }
  });

  //create script for starting docker container
  fs.writeFile(folderName + "/dockerrun.sh", "#!/bin/sh\ndocker run --rm -i $(docker build -q "+ folderName + "/.)", function (err,data) {
    if (err) {
      return console.log(err);
    }
  });

  //make script executable
  const chmodCom = spawn("chmod", ["+x",folderName + "/script.sh", folderName + "/dockerrun.sh"]);
  exitCode = await new Promise( (resolve, reject) => {
      chmodCom.on('close', resolve);
  });
  if( exitCode) {
      throw new Error( `CHMOD subprocess error exit ${exitCode}, ${error}`);
  }

  //create docker file
  var dockerCode = 'FROM ubuntu\n# ...\nENV DEBIAN_FRONTEND noninteractive\nRUN apt-get update && apt-get -y install gcc mono-mcs default-jre python3 && rm -rf /var/lib/apt/lists/\*\nCOPY script.sh /script.sh\nCOPY ' + name + ' /' + name + '\nCMD ["/script.sh"]'
  fs.writeFile(folderName + "/Dockerfile", dockerCode, function (err,data) {
    if (err) {
      return console.log(err);
    }
  });

  //run dockerContainer timeout is execution time
  const runFile = spawn(folderName + "/dockerrun.sh",{
    shell: true,
    timeout: 3000
  });
  for await(const data of runFile.stdout) {
    results += data.toString('utf8');
  }
  exitCode = await new Promise( (resolve, reject) => {
      runFile.on('close', resolve);
  });
  if( exitCode) {
      throw new Error( `Execution subprocess error exit ${exitCode}, ${error}`);
  }

  // fs.rmdir(folderName, { recursive: true }, function(err){
  //   if (err) {
  //       throw err;
  //   }
  // });
  return results;
}

router.use(function(req, res, next) {
  if (req.session.candidate === true && req.session.candidateid != undefined) {
    next();
  } else {
  	console.log("Not logged in");
    res.sendStatus(401);	// 401: Unauthorised
  }
});

// Candidate can only use the following routes if they have not yet completed the test
router.use(function(req, res, next) {
  candidateModel.findOne({_id: req.session.candidateid}, 'testCompleted', function(err, status){
  	if (err) {
  		console.log(err);
  		return res.sendStatus(500);
  	}
  	if (status.testCompleted === false) {
  		console.log("Test not completed");
  		next();
  	} else {
  		console.log("Test completed");
      delete req.session.candidate;
      delete req.session.candidateid;
  		return res.sendStatus(401);	// 401: Unauthorised
  	}
  })
});

router.use(function(req, res, next) {
  candidateModel.findOne({_id: req.session.candidateid}, 'condition.test_end_time', function(err, status){
  	if (err) {
  		console.log(err);
  		return res.sendStatus(500);
  	}
  	var current_date = new Date();
  	var test_end_time = new Date(status._doc.condition.test_end_time);
  	if (current_date < test_end_time) {
  		console.log("Request date (" + current_date.toUTCString() + ") less than allocated completion date (" + test_end_time.toUTCString() + ")");
  		next();
  	} else {
  		console.log("Request date (" + current_date.toUTCString() + ") greater or equal to allocated completion date (" + test_end_time.toUTCString() + ")");
  		delete req.session.candidate;
      delete req.session.candidateid;
      return res.sendStatus(401);	// 401: Unauthorised
  	}
  })
});

function getCandidateQuestions(req, res, next) {
  // Saving all question ids assigned to candidates in req.question_ids
  questions = [];
  candidateModel.findById(req.session.candidateid, 'test', function(err, result){
    if(err){
      console.log(err);
      return res.sendStatus(500);
    }

    if (result == null) {
      console.log("No questions assigned");
      return res.sendStatus(200);
    }

    var test = result.test;
    for (i = 0; i < test.length; i++) {
        questions.push(test[i].question_id);
    }

    req.question_ids = questions;
    next();
  })
}

/* GET candidate listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

// Get admin's own info
router.get('/info.json', function(req, res, next) {
	// Get current personal info (name and email) of admin with id = req.session.adminid
  candidateModel.findOne({_id: req.session.candidateid}, 'name email', function(err, admin) {
		if (err) {
  		console.log(err);
  		return res.sendStatus(500);
  	}
  	if (admin === null) {
  		return res.sendStatus(500);
  	}
		res.send(admin);
  });
});

// Return a list of questions that is assigned to the candidate
router.get('/test.json', getCandidateQuestions, function(req, res, next) {
  // Get test questions of candidate with id of req.session.candidateid
  questionModel.find({"_id" : {$in: req.question_ids}}, function(err, test) {
  	if (err) {
			console.log(err);
			return res.sendStatus(500);
		}
  	res.send(test);
  })
});

function updateTest(req, res, next) {
  /* Input: JSON object "response_arr" which is an array consisting of question ids and
   * JSON objects (type, body), Output: status(200)
   * Create new test JSON object and fill in with request data in format:
   * test: [{question_id, response:{type, body}}, …]
   * Look up test and overwrite it in database
   */
   var arr_length = req.body.response_arr.length;

   var requestTime = new Date();
   req.requestTime = requestTime;
   console.log("requested time" + req.requestTime);

   // checking if input data consists of required fields
   for(var i =0; i < arr_length; i++){
    if (req.body.response_arr[i].question_id == undefined || req.body.response_arr[i].response==undefined){
      return res.sendStatus(500);
    }
    if(req.body.response_arr[i].response.type == undefined || req.body.response_arr[i].response.body == undefined){
      return res.sendStatus(500);
    }
    if (req.body.response_arr.length <= 0) {
      return res.sendStatus(500);
    }
   }

  //push question entries to test array
  var test = [];
  for(var i = 0; i < arr_length; i++){
    var question = {
      "question_id" : req.body.response_arr[i].question_id,
      "response" : {"type" : req.body.response_arr[i].response.type, "body" : req.body.response_arr[i].response.body
      }
    }
    test.push(question);
  }

  candidateModel.findOneAndUpdate({"_id": req.session.candidateid}, {$set: {"test": test, "lastSavedTime": req.requestTime}}, function(err, output) {
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    }

    if (output === null) {
      return res.sendStatus(500);
    }
    next();
  });
};

//Run a candidate's test
router.post('/runTest', updateTest,async function(req, res, next){

  //will need to add loop probably here to check values
  sourcecode = req.body.response_arr[0].response.body;
  results = await runSource(req.body.response_arr[0].response.body,req.body.response_arr[0].response.type);

  res.send(results);
});

// Updates candidate's responses to a test
router.post('/saveTest', updateTest, function(req, res, next) {
	res.send();
});

// Gets all the admins as email recipients
function getAllAdminRecipients(req, res, next) {
  adminModel.find({}, '_id', function(err, admins) {
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    }

    var admin_ids = [];
    for (var i = 0; i < admins.length; i++) {
      admin_ids.push(admins[i]._id);
    }
    req.admin_ids = admin_ids;
    next();
  });
}

// Set the email main text body to send to admin as a reminder of the end of a test
function setCandidateCompleteTestEmail(req, res, next) {
  candidateModel.findOne({_id: {$in: req.session.candidateid}}, 'name email', function(err, candidate) {
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    }

    if (candidate === null) {
      return res.sendStatus(500);
    }

    var textBody = "This is to notify you that " + candidate.name.first + " " + candidate.name.last
      + " <" + candidate.email + "> has finished Test <test name>.\n\n"
      + "Their responses can be viewed at the link http://localhost:3000/admin.html"
    req.emailMainText = textBody;
    next();
  });
}


// Send a notification email to admins that candidate has completed test
function sendCompletionNotificationEmail(req, res, next) {
  let transporter = emailWrapper.createEmailTransporter(req);

  for (var i = 0; i < req.admin_ids.length; i++) {
    adminModel.find({"_id": req.admin_ids[i]}, '_id name email', function(err, admin){
      if (err) {
        console.log(err);
        return res.sendStatus(500);
      }
      if (admin === null) {
        return res.sendStatus(500);
      }
      else {
        // todo: update with test name after implementing test in db
        let message = {
          // Recipients is a string of email encaupsulated by '<>' and comma seperated.
          // E.g. <candidateone@email.com>, <a1667807@student.adelaide.edu.au>
          to: admin[0].name.first + " " + admin[0].name.last + " <" + admin[0].email + ">",
          subject: "Reminder: Maptek HireMeCoder Test <test name> completed",
          text:
            "Hi " + admin[0].name.first + " " + admin[0].name.last + ", \n\n"
            + req.emailMainText + "\n\nKind regards,\n" + "Maptek Hiring Team",
        }

        console.log('Sending Mail');
        transporter.sendMail(message, (err, info) => {
          if (err) {
            console.log('Error occured');
            console.log(err.message);
            return;
          }

          console.log('Message sent successfully!');
          console.log('Server responded with "%s"', info.response);
        });
      }
    });
  }
  transporter.close();
  next();
}

// Ends candidate session. This is called when candidate chooses to complete their session.
router.post('/submitTest', updateTest, function(req,res, next) {
  console.log("Submitting test");
	candidateModel.findOneAndUpdate({"_id": req.session.candidateid}, {$set: {"lastSubmittedTime": req.requestTime, "testCompleted": true}}, function(err, output) {
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    }

    if (output === null) {
      return res.sendStatus(500);
    }
    next();
  });
}, getAllAdminRecipients, setCandidateCompleteTestEmail, emailWrapper.setEmailHandler,
sendCompletionNotificationEmail, function(req, res, next) {
  // Log candidates out
  delete req.session.candidate;
  delete req.session.candidateid;
  res.send().redirect('/index.html');
});

// View response of a given candidate id
router.get('/responses.json', getCandidateQuestions, function(req, res, next) {
	candidateModel.findOne({_id: req.session.candidateid}, 'test', function(err, docs){
		if(err){
			console.log(err);
			return res.sendStatus(500);
		}

		// If database does not contain candidate with req.body.candidate_id
		if (docs === null) {
			return res.sendStatus(500);
		}
    res.send(docs);
	});
});

// change candidate password
router.post('/updatePassword', function(req, res, next) {
  console.log("Updating Password");
  if(req.body.newPassword === req.body.confPassword) {
    console.log(req.session.candidateid);

    var hash = bcrypt.hashSync(req.body.newPassword, saltRounds);

    candidateModel.findOneAndUpdate({_id: req.session.candidateid}, {$set: {password: hash}}, 
    function (err, result) {
      if (err) {
        console.log(err);
        return res.sendStatus(500);
      }
      if (result === null) {
        console.log("Res Null");
        return res.sendStatus(500);
      }
      // Everything is all good, send status 200
      res.sendStatus(200);
    });
  }
  else {
    res.sendStatus(400);
  }
});

module.exports = router;
