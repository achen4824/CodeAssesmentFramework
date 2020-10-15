var mongoose = require('mongoose');

// Don't use counter, especially not as an index.
var counterSchema = new mongoose.Schema({
	_id: { "type": String, "required": true },
    seq: { "type": Number, "default": 1 }
}, { collection: 'counter' });
var counter = mongoose.model('counter', counterSchema);

var questionSchema = new mongoose.Schema({
    // Don't use question_id, the default _id should be used to
    // allow for populate of questions as fields of other schema.
    question_id: { type: Number },
	title: { type: String, required: true },
	body: { type: String, required: true },
	image: String,
}, { collection: 'question' });

questionSchema.pre('save', function (next) {
    if (!this.isNew) {
	    next();
	    return;
	}
    var doc = this;
    counter.findByIdAndUpdate(
        { "_id": "question_id" },
        { "$inc": { "seq": 1 } },
        { upsert: true , new: true },
    function(err, counter)   {
        if(err) return next(err);
        doc.question_id = counter.seq;
        next();
    });
});

mongoose.model('Question', questionSchema, 'question');