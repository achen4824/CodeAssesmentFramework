var mongoose = require('mongoose');

var adminSchema = new mongoose.Schema({
	// _id: mongoose.Schema.Types.ObjectId,
	name: { first: { type: String, required: true }, last: { type: String, required: true } },
	email: { type: String, required: true },
	password: { type: String, required: true }
}, { collection: 'admin' });

adminSchema.virtual('fullName').get(function() {
	return this.name.first + ' ' + this.name.last;
});

mongoose.model('Admin', adminSchema);