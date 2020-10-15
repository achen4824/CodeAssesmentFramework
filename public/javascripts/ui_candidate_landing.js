  /*jshint esversion: 6 */
  //This vue instance is used by the candidate's user interface 
  
  var appVue = new Vue({
    el: "#app",
  
    data: {
      //name to display on top right corner
      displayName: "",
      //array of questions
      test: [],
  
      //this variable shows the index of the current question
      currentIndex: 0,
    },
  
    mounted: function () {
      this.getCandidateInfo();
      this.getQuestions();
    },
  
    methods: {
      //expands a list item
      expandListItem(index){
        var buttons = document.getElementsByClassName("collapsible");
        var coll = document.getElementsByClassName("content");
        if (coll[index].style.display === "block") {
          coll[index].style.display = "none";
          buttons[index].innerHTML = "&#8744";
        } else {
          coll[index].style.display = "block";
          buttons[index].innerHTML = "&#8743";
        }
      },
      //this function gets all the questions assigned to this candidate
      getQuestions: function (event) {
  
        // Create new AJAX request
        var xhttp = new XMLHttpRequest();
  
        // Handle response
        var ptrToData = this;
        xhttp.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            var res = JSON.parse(xhttp.response);
            // save the questions to array
            ptrToData.test = res;
            ptrToData.question = res[0];
          } else if (this.readyState == 4 && this.status == 401) {
            // Non admins cannot access the admin page, will be redirected to login page
            window.location.href = "/";
          }
        };
  
        // Open connection
        xhttp.open("GET", "/candidate/test.json", true);
  
        // Send request
        xhttp.send();
      },
  
      //this route is used to get candidate info to display on the top right corner of page
      getCandidateInfo: function (event) {
        // Create new AJAX request
        var xhttp = new XMLHttpRequest();
  
        // Handle response
        var ptrToData = this;
        xhttp.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            // display the name of user
            var res = JSON.parse(xhttp.response);
            // console.log("INFO: " + res);
            var str = "Hi ";
  
            ptrToData.displayName = str.concat(res.name.first, ' ', res.name.last);
          } else if (this.readyState == 4 && this.status == 401) {
            // Non admins cannot access the admin page, will be redirected to login page
            window.location.href = "/";
          }
        };
  
        // Open connection
        xhttp.open("GET", "/candidate/info.json", true);
  
        // Send request
        xhttp.send();
      },
  
      //this route is used to send logout request and reroute to login page
      logout: function (event) {
        // Create new AJAX request
        var xhttp = new XMLHttpRequest();
  
        // Handle response
        xhttp.onreadystatechange = function () {
          if (this.readyState == 4 && this.status == 200) {
            // redirect back to login page.
            window.location.href = "/";
          }
        };
  
        // Open connection
        xhttp.open("POST", "/logout", true);
  
        // Send request
        xhttp.send();
      }
    }
  });

  function updatePassword(){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function(){
      if(this.readyState == 4 && this.status == 200){
        alert("Password updated succesfully");
      } 
      else if (this.readyState == 4 && this.status == 400) {
        alert("Passwords do not match");
      }
      else if (this.readyState == 4 && this.status == 500) {
        alert("An error occured");
      }
    };
    xhttp.open("POST", "/candidate/updatePassword", true);
    xhttp.setRequestHeader('Content-type','application/json');
    xhttp.send(JSON.stringify({newPassword:document.getElementById('nPword').value, confPassword:document.getElementById('cPword').value}));
  }
  
  