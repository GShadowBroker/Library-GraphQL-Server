const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3
    },
    password: {
      type: String,
      required: true,
      minlength: 5
    },
    favoriteGenre: {
      type: String
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    friend_requests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
})

userSchema.plugin(uniqueValidator)

userSchema.set("toJSON", {
    transform: (doc, returnedObj) => {
        returnedObj.id = returnedObj._id.toString()
        delete returnedObj._id
        delete returnedObj.__v
    }
})

module.exports = mongoose.model('User', userSchema)