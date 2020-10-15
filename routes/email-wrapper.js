const nodemailer = require('nodemailer');
const fs = require('fs');
/*
 * Creates an email transporter using the email handler 
 * and it's credentials set in the req variable in an 
 * upstream middleware. 
 * 
 * NOTE: The transporter must later be closed.
 * This is why the transporter doesn't just replace the auth_var field in req
 */
function createEmailTransporter(req){
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          type: 'oauth2',
          user: 'randomoraqs@gmail.com',
          clientId: req.auth_var.client_id,
          clientSecret: req.auth_var.client_secret,
          accessToken: req.auth_var.access_token,
          refreshToken: req.auth_var.refresh_token,
          expires: req.auth_var.expiry_date
        },
        debug: true // include SMTP traffic in the logs
      }, {
        // Sender info - using gmail oauth, must be from a valid gmail account
        from: 'Maptek no-reply <randomoraqs@gmail.com>'
      });
    
    return transporter;
}

/*
 * Middleware that makes Gmail auth variables available downstream
 */
function setEmailHandler(req, res, next) {
    // Set website email handler
    // Reading google api authentication variables needed to send email
    auth_var = {};

    fs.readFile('routes/googleapi/credentials.json', (err, content) => {
      if (err) {
        console.log('Error loading client secret file:', err);
        return res.sendStatus(500);
      };
      content_JSON = JSON.parse(content);
      auth_var.client_secret = content_JSON.installed.client_secret;
      auth_var.client_id = content_JSON.installed.client_id;
  
      fs.readFile('routes/googleapi/token.json', (err, token) => {
        if (err) {
          console.log('Error loading token file:', err);
          return res.sendStatus(500);
        };
        token_JSON = JSON.parse(token);
        auth_var.access_token = token_JSON.access_token;
        auth_var.refresh_token = token_JSON.refresh_token;
        auth_var.expiry_date = token_JSON.expiry_date;
  
        req.auth_var = auth_var;

        next();
      });
    });
    
  }


module.exports = {createEmailTransporter, setEmailHandler};