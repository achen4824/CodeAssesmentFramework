var mongoose = require('mongoose');

var allocationSchema = new mongoose.Schema({
	candidates: {type:[{candidate_id: {type: String, ref: 'Candidate'}}], required: true},
	// test_id: {type: Number, ref: 'Test'},
	questions: {type:[{question_id: {type: mongoose.Types.ObjectId, ref: 'Question'}}], required: true},
	allocated_completion_time: {type: Date, required: true}
}, {collection: 'allocation'} );

mongoose.model('Allocation', allocationSchema);
