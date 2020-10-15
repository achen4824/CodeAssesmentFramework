/*jshint esversion: 6 */
//This vue instance is used by the admin's user interface header section.
Vue.config.debug = true;
Vue.config.devtools = true;
//Vue.component('vue-multiselect', window.VueMultiselect.default);
function updateFunction(el, binding) {
  // get options from binding value.
  // v-select="THIS-IS-THE-BINDING-VALUE"
  let options = binding.value || {};

  // set up select2
  $(el).select2(options).on("select2:select", (e) => {
    // v-model looks for
    //  - an event named "change"
    //  - a value with property path "$event.target.value"
    el.dispatchEvent(new Event('change', {
      target: e.target
    }));
  });
}
Vue.directive('select', {
  inserted: updateFunction,
  componentUpdated: updateFunction,
});

function formatFunction(state) {
  var $state = $(
    '<span style="color: red">' + state.text + '</span>'
  );
  return $state;
}
// Multiselect JQuery Function
$(document).ready(function () {
  $('.js-example-basic-multiple').select2({
    placeholder: '  Select Questions',
    closeOnSelect: false
  });
});


var appVue = new Vue({
  el: "#app",

  data: {
    //name to display on top right corner
    displayName: "",

    // Variables for adding new question to the database
    image: '',
    uploadQuestionFormData: '',
    tempUploadQuestionFormData: '',
    title: "",
    body: "",
    showAddQuestion: false,

    // Variables for the uploading test
    testEndDate: "",
    assignTestErrors: [],

    //save Tests in array
    saveTestDetails: [],

    //Variables for candidate details (will have fields id, firstname, lastname, and email)
    candidates: [{
      firstname: "",
      lastname: "",
      email: ""
    }],
    newCandidate: { firstname: "", lastname: "", email: "" },
    selectedCandidatesList: [], // candidates selected for a certain test
    searchCandidateList: [], // candidates to be shown in the search popup suggested results
    showAddCandidate: false,

    //variables for the questions
    questions: {},

    // other variables
    searchText: '',
    isDarkTheme: false,

  },
  mounted: function () {
    this.fillAdminPage();
    this.getQuestions();
    this.getCandidates();
  },

  methods: {
    addNewCandidateForm() {
      this.candidates.push({
        firstname: "",
        lastname: "",
        email: ""
      })
    },

    deleteCandidateForm(index) {
      this.candidates.splice(index, 1)
    },

    // This function sends the current inputs for candidate details to the server and clears the candidates array.
    save_candidates: function (event) {
      // Create new AJAX request
      var xhttp = new XMLHttpRequest();
      var numCandAdded = this.candidates.length;
      // Define behaviour for a response
      var ptrToData = this;
      xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          // do stuff if successful
          alert("Saved " + numCandAdded + " candidates to this test.");
          //empty the candidates array
          ptrToData.candidates.splice(0, numCandAdded);
          var res = JSON.parse(xhttp.response);
          for (var i = 0; i < res.length; i++) {
            var candidate = {
              id: res[i]._id,
              firstname: res[i].name.first,
              lastname: res[i].name.last,
              email: res[i].email
            }
            ptrToData.candidates.push(candidate);
          }
          //get the list of saved candidates
          //getCandidates();
        } else if (this.readyState == 4 && this.status == 500) {
          alert("Error: candidates could not be added");
        }
      };
      // Initiate connection
      xhttp.open("POST", "admin/newCandidates", true);
      // Set content type to JSON
      xhttp.setRequestHeader("Content-type", "application/json");
      // Send request
      // 'this' keyword points to variables in the data section above.
      xhttp.send(JSON.stringify({ candidates: this.candidates }));
    },

    //get tests and candidates
    loadTests: function () {

      this.getCandidates();

      // Create new AJAX request
      var xhttp = new XMLHttpRequest();

      var ptrToData = this;
      // Handle response
      xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          // save the responses to the saved candidates array
          var res = JSON.parse(xhttp.response);
          ptrToData.saveTestDetails = res;
          ptrToData.openTestPage(0)
        }
      };

      // Open connection
      xhttp.open("GET", "/admin/tests.json", true);

      // Send request
      xhttp.send();
    },

    openTestPage: function (index) {
      var ptrToData = this;
      allMenuOptions = document.getElementsByClassName("menuOption");
      for (var i = 0; i < allMenuOptions.length; i++) {
        allMenuOptions[i].style.border = "0px solid gray";
      }
      allMenuOptions[index].style.borderBottom = "3px solid gray";

      //start loading tests
      node = document.getElementById("testsection");

      //create proper out animation later
      node.innerHTML = "";


      for (var i = 0; i < ptrToData.saveTestDetails.length; i++) {

        //convert ISO timestamp to date
        date = new Date(ptrToData.saveTestDetails[i].allocated_completion_time);
        year = date.getFullYear();
        month = date.getMonth() + 1;
        dt = date.getDate();

        if (dt < 10) {
          dt = '0' + dt;
        }
        if (month < 10) {
          month = '0' + month;
        }

        //create div
        divdata = "<div class='tempDisplay noselect' onclick='appVue.showTestCandidates(" + i + ")'><strong>Test ID: "
          + ptrToData.saveTestDetails[i]._id
          + "</strong><br>Candidates: "
          + ptrToData.saveTestDetails[i].candidates.length
          + "<br>Questions: "
          + ptrToData.saveTestDetails[i].questions.length
          + "<br>End Time: "
          + dt + '-' + month + '-' + year + "</div>";

        ptrToData.createDivSection(node, divdata)
        setTimeout(function(node,i){
          node.children[i].classList.add("itemDisplay");
        },100*(i+1),node,i);
      }

      divdata = "<div class='tempDisplay noselect' style='font-size: xx-large;text-align:center;padding-top:0px;padding-bottom:0px;' onclick=''>+</div>";

      ptrToData.createDivSection(node, divdata)
      setTimeout(function(node){
        node.children[ptrToData.saveTestDetails.length].classList.add("itemDisplay");
      },100*ptrToData.saveTestDetails.length,node);

    },

    openCandidatePage: function (index) {
      allMenuOptions = document.getElementsByClassName("menuOption");
      for (var i = 0; i < allMenuOptions.length; i++) {
        allMenuOptions[i].style.border = "0px solid gray";
      }
      allMenuOptions[index].style.borderBottom = "3px solid gray";
    },

    createDivSection(node, divString) {
      var ptrToData = this;

      node.innerHTML = node.innerHTML + divString;

    },



    showTestCandidates: function(testindex){
      var ptrToData = this;
      resizefocus(282);
      document.getElementById("candidatesection").style.width = "300px";
      this.getQuestionsfromTest(testindex);

      for(var  i = 0; i < ptrToData.saveTestDetails[testindex].candidates.length; i++){
        var candidateList = [];
        for(var j = 0; j < ptrToData.candidates.length; j++){
          if(ptrToData.saveTestDetails[testindex].candidates[i].candidate_id == ptrToData.candidates[j]._id){
            candidateList.push(ptrToData.candidates[j]);
          }
        }
      }
      resetNode = document.getElementById("testsection");
      if(resetNode.getElementsByClassName("selectedItemDisplay").length> 0){
        resetNode.getElementsByClassName("selectedItemDisplay")[0].classList.remove("selectedItemDisplay");
      }
      resetNode.children[testindex].classList.add("selectedItemDisplay");
      
      //start loading tests
      node = document.getElementById("candidatesection");

      //create proper out animation later
      node.innerHTML = "";

      for(var i = 0;i<candidateList.length;i++){
        //create div
        divdata = "<div class='tempDisplay noselect'><strong>"
                  + candidateList[i].name.first + " " + candidateList[i].name.last
                  +"</strong><br>" 
                  + candidateList[i].email
                  + "<br>Completed: "
                  + candidateList[i].testCompleted.toString();

        ptrToData.createDivSection(node,divdata);
        setTimeout(function(node,i){
          node.children[i].classList.add("itemDisplay");
        },100*(i+1),node,i);
     }
    },

    getQuestionsfromTest(testindex){
      var ptrToData = this;

      document.getElementById("testhead").innerHTML = this.saveTestDetails[testindex]._id;

      // Create new AJAX request
      var xhttp = new XMLHttpRequest();

      xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          var res = JSON.parse(xhttp.response);
          main = document.getElementById("showTestQuestions");

          main.innerHTML = "";

          for(var i = 0;i<res.length;i++){
            main.innerHTML = main.innerHTML + "<div class='showQuestion' onclick='appVue.showQuestionSelected(this);appVue.expandContract(this.children[1])'><div class='showQuestionHead'><strong>" + res[i].title + "</strong>&nbsp<span class='editIcon'><i class='fas fa-edit'></i></span><div class='expandsymbol'><strong>+</strong></div></div><div class='showQuestionBody'><div style='height:auto;padding:7px'>"+res[i].body+"</div></div></div>"
          }
        }
      };
      // Initiate connection
      xhttp.open("POST", "admin/testQuestions", true);
      // Set content type to JSON
      xhttp.setRequestHeader("Content-type", "application/json");
      // Send request
      // 'this' keyword points to variables in the data section above.
      xhttp.send(JSON.stringify({ questionList: ptrToData.saveTestDetails[testindex].questions }));
    },

    expandContract(htmlobj){
      if(htmlobj.style.height == "0px" || htmlobj.style.height == ""){
        htmlobj.style.height = htmlobj.children[0].getBoundingClientRect().height + "px";
      }else{
        htmlobj.style.height = "0px";
      }
    },

    showQuestionSelected(htmlobj){
      if(htmlobj.getElementsByClassName("expandsymbol")[0].children[0].innerHTML == "+"){
        htmlobj.children[0].classList.add("highlightQuestion");
        htmlobj.getElementsByClassName("expandsymbol")[0].children[0].innerHTML  = "-";
      }else{
        htmlobj.getElementsByClassName("expandsymbol")[0].children[0].innerHTML  = "+";
        htmlobj.children[0].classList.remove("highlightQuestion");
      }
    },

    // todo: check if still need this
    getCandidates() {
      // Create new AJAX request
      var xhttp = new XMLHttpRequest();

      var ptrToData = this;
      // Handle response
      xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          // save the responses to the saved candidates array
          var res = JSON.parse(xhttp.response);
          ptrToData.candidates = res;
        }
      };

      // Open connection
      xhttp.open("GET", "/admin/candidates.json", true);

      // Send request
      xhttp.send();
    },

    fillAdminPage: function (event) {
      // Create new AJAX request
      var xhttp = new XMLHttpRequest();

      // Handle response
      var ptrToData = this;
      xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          // display the name of user
          var res = JSON.parse(xhttp.response);
          var str = "Hi ";

          ptrToData.displayName = str.concat(res.name.first, ' ', res.name.last);
        } else if (this.readyState == 4 && this.status == 401) {
          // Non admins cannot access the admin page, will be redirected to login page
          window.location.href = "/admin_login.html";
        }
      };

      // Open connection
      xhttp.open("GET", "/admin/info.json", true);

      // Send request
      xhttp.send();
    },

    logout: function (event) {
      // Create new AJAX request
      var xhttp = new XMLHttpRequest();

      // Handle response
      xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          // redirect back to login page.
          window.location.href = "/admin_login.html";
        }
      };

      // Open connection
      xhttp.open("POST", "/logout", true);

      // Send request
      xhttp.send();
    },

    //Get ID and Questions
    getQuestions() {
      // Create new AJAX request
      var xhttp = new XMLHttpRequest();

      // Handle response
      xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          // save the responses to the saved candidates array
          var res = JSON.parse(xhttp.response);
          questions = []
          for (var i = 0; i < res.length; i++) {
            var question = {
              id: res[i]._id,
              text: "Q" + res[i].question_id + ": " + res[i].title
            }
            questions.push(question);
          }
          appVue.questions = { data: questions };
        }
      };

      // Open connection
      xhttp.open("GET", "admin/questions.json", true);

      // Send request
      xhttp.send();
    },

    // This is called when admin uploads a question, it also sends the file as a binary encoded file
    uploadQuestion: function (event) {
      // Disable default form submission
      event.preventDefault();

      // Form data to send over url
      appVue.uploadQuestionFormData = new FormData($("#uploadQuestionForm")[0]);
      if (appVue.image) {
        appVue.uploadQuestionFormData.set('file', appVue.tempUploadQuestionFormData.get('file'))
      }

      // Initialise error to nil
      appVue.uploadQuestionErrors = [];

      // Create new AJAX request
      var xhttp = new XMLHttpRequest();

      // Define behaviour for a response
      xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
          appVue.uploadQuestionSuccess = true;
          // Reset values
          appVue.title = "";
          appVue.body = "";
          appVue.image = "";
          // Populate Vue's question fields again
          appVue.getQuestions();
        } else if (this.readyState == 4 && this.status == 406) {
          appVue.uploadQuestionSuccess = false;
          appVue.uploadQuestionErrors.push("The file you uploaded must be either jpeg, png, or pdf");
        } else if (this.readyState == 4 && this.status == 401) {
          appVue.uploadQuestionSuccess = false;
          appVue.uploadQuestionErrors.push("You're currently not logged in as admin. Please log in.");
        } else if (this.readyState == 4 && this.status == 500) {
          appVue.uploadQuestionSuccess = false;
          appVue.uploadQuestionErrors.push("Unknown error uploading to server. Please try again.");
          console.log("Error: could not uplod question.");
        }
      };
      // Initiate connection
      xhttp.open("POST", "admin/addQuestion", true);

      xhttp.send(appVue.uploadQuestionFormData);
    },

    // Display selected image on uploadQuestionFrom
    createImage() {
      appVue.tempUploadQuestionFormData = new FormData($("#uploadQuestionForm")[0]);

      var files = this.$refs.uploadedFile.files;
      if (!files.length) {
        return;
      }
      var file = files[0];
      var image = new Image();
      var reader = new FileReader();

      reader.onload = (e) => {
        appVue.image = e.target.result;
      };
      reader.readAsDataURL(file);
    },

    // Remove selected image on uploadQuestionForm
    removeImage: function (e) {
      this.image = '';
    },

    // changing theme
    onChangeTheme: () => {
      appVue.isDarkTheme = !appVue.isDarkTheme;
      document.documentElement.setAttribute('page-theme', appVue.isDarkTheme ? 'dark' : 'light');
    },

    onShowAddCandidate: () => {
      appVue.showAddCandidate = !appVue.showAddCandidate;
      appVue.showAddQuestion = false;
    },
    
    onShowAddQuestion: () => {
      appVue.showAddQuestion = !appVue.showAddQuestion;
      appVue.showAddCandidate = false;
    },
  }
});

window.addEventListener("load", function (event) {
  appVue.loadTests();

  document.getElementsByClassName("navbar1")[0].style.height = "60px"
  setheight = window.innerHeight - 60;
  document.getElementById("content").style.height = setheight + "px";

  setInterval(function () {

    document.getElementById("image").style.top = "0px";

    setInterval(function () {
      document.getElementsByClassName("menuOption")[0].style.top = "0px";

      setInterval(function () {
        document.getElementsByClassName("menuOption")[1].style.top = "0px";

      }, 100);
    }, 100);
  }, 300);
});

window.onresize = function (event) {
  setheight = window.innerHeight - 60;
  document.getElementById("content").style.height = setheight + "px";
  resizefocus(0);
};
function resizefocus(num){
  setwidth = window.innerWidth - 300 - num;
  document.getElementById("focussection").style.width = setwidth + "px";
}