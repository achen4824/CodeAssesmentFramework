var mongoose = require('mongoose');

var testSchema = new mongoose.Schema({
	name: { type: String, required: true},
	created: {type: Date, required: true},
	lastModified: {type: Date},
	questions: {type:[{question_id: {type: Number, ref: 'Question'}}], required: true}
}, {collection: 'test'} );

mongoose.model('Test', testSchema);