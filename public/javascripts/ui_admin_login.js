/*jshint esversion: 6 */
Vue.config.debug = true;
Vue.config.devtools = true;

var appVue = new Vue({
  el: "#app",

  data: {
    //The following variables are used to get the account details for the new admin account.
    firstname: "",
    lastname: "",
    email: "",
    seen: true,
    forgotPasswordSuccess: false,
    forgotPasswordErrors: [],
    },

  methods: {
    //This method is used to send the AJAX request to add the new admin account details to the database.
    forgotPassword: function(event) {
		  // Disable default form submission
		  event.preventDefault();

      // Reset create admin errors
      appVue.createAdminErrors = [];
      // Create new AJAX request
      var xhttp = new XMLHttpRequest();
      // Define behaviour for a response
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          appVue.forgotPasswordSuccess = true;
        } else if (this.readyState == 4 && this.status == 401) {
          appVue.forgotPasswordSuccess = false;
          appVue.forgotPasswordErrors.push("The entered details cannot be matched to an existing account.");
        }
      };
      // Initiate connection
      xhttp.open("POST", "/forgotPassword", true);
      // Set content type to JSON
      xhttp.setRequestHeader("Content-type", "application/json");
      // Send request
      // 'this' keyword points to variables in the data section above.
      xhttp.send(JSON.stringify({
        firstname: this.firstname,
        lastname: this.lastname,
        email: this.email
      }));
    },













  }
});
