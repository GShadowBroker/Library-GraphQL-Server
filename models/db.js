const mongoose = require('mongoose')

module.exports = () => {
    return mongoose.connect(process.env.MONGODB_CONNECTION_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
}
