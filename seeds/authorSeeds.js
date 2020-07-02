const Author = require('../models/Author')
const dotenv = require('dotenv').config({path: '../.env'})
const mongoose = require('mongoose')

const db = () => {
    return mongoose.connect(process.env.MONGODB_CONNECTION_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
}

let authors = [
    {
      name: 'Robert Martin',
      id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
      born: 1952,
    },
    {
      name: 'Martin Fowler',
      id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
      born: 1963
    },
    {
      name: 'Fyodor Dostoevsky',
      id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
      born: 1821
    },
    { 
      name: 'Joshua Kerievsky', // birthyear not known
      id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
    },
    { 
      name: 'Sandi Metz', // birthyear not known
      id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
    },
]

const createAuthor = async (name, born = null) => {
    console.log('Creating', name)
    const author = await new Author({
        name: name,
        born: born ? born : null
    })
    await author.save()
    console.log('author saved')
}

const initSeeding = async () => {
    console.log('Initializing seeds...')
    authors.forEach(a => {
        createAuthor(a.name, a.born)
    })
}

db()
initSeeding()