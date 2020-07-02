const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

let bookSchema = new mongoose.Schema({
    title: {
        type: String,
        unique: true,
        minlength: 3,
        maxlength: 55,
        required: true
    },
    published: {
        type: Number
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Author'
    },
    genres: [String]
})

bookSchema.plugin(uniqueValidator)

bookSchema.set("toJSON", {
    transform: (doc, returnedObj) => {
        returnedObj.id = returnedObj._id.toString()
        delete returnedObj._id
        delete returnedObj.__v
    }
})

module.exports = mongoose.model('Book', bookSchema)