var mongoose = require('mongoose');

var candidateSchema = new mongoose.Schema({
	name: { first: { type: String, required: true }, last: { type: String, required: true } },
	email: String,
	real_password: String,
	password: String,
	test: [{ question_id: {type: mongoose.Types.ObjectId, ref: 'Question'}, response: { type: {type: String}, body: {type: String} } }],
	feedback: String,
	condition: { test_start_time: Date, test_end_time: Date },
	testCompleted: { type: Boolean, default: false },
	lastSubmittedTime : {type: Date},
	lastSavedTime : {type: Date}
}, { collection: 'candidate'} );

candidateSchema.virtual('fullName').get(function() {
	return this.name.first + ' ' + this.name.last;
});

mongoose.model('Candidate', candidateSchema);