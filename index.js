const { ApolloServer } = require('apollo-server')
const dotenv = require('dotenv').config()
const colors = require('colors')
const jwt = require('jsonwebtoken')
const typeDefs = require('./typeDefs/typeDefs')
const resolvers = require('./resolvers/resolvers')
const User = require('./models/User')

const db = require('./models/db')

db().then(() => console.log('Connection to database estabilished'.green))
    .catch(err => console.log('Error connection to database'.red, err.message))

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
        const auth = req ? req.headers.authorization : null
        if (auth && auth.toLowerCase().startsWith('bearer ')) {
            const decodedToken = jwt.verify(auth.substring(7), process.env.TOKEN_SECRET)
            const currentUser = await User.findById(decodedToken.id)
                .populate('friends').populate('friend_requests')
            return { currentUser }
        }
    }
})

server.listen()
    .then(({ url }) => console.log(`Server ready at ${url}`.blue))