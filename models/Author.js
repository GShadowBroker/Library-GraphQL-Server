const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

let authorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        minlength: [3, "Name is too short"],
        maxlength: [55, "Name is too long"]
    },
    born: {
        type: Number,
        maxlength: [4, "Birth year must be valid"]
    },
    books: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Book'
        }
    ]
})

authorSchema.plugin(uniqueValidator)

authorSchema.set("toJSON", {
    transform: (doc, returnedObj) => {
        returnedObj.id = returnedObj._id.toString()
        delete returnedObj._id
        delete returnedObj.__v
    }
})

module.exports = mongoose.model('Author', authorSchema)