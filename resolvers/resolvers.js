const Author = require('../models/Author')
const Book = require('../models/Book')
const { UserInputError, ApolloError, AuthenticationError, PubSub } = require('apollo-server')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const pubsub = new PubSub()

module.exports = {
    Query: {
        me: (root, args, context) => {
            return context.currentUser
        },

        authorCount: () => Author.collection.countDocuments(),

        bookCount: () => Book.collection.countDocuments(),

        allBooks: async (root, args) => {

            if (args.author) {
                const author = await Author.findOne({ name: args.author })
                    .populate({
                        path: 'books',
                        populate: { path: 'author' } // Só mais uma outra...
                    })

                if (!author) throw new UserInputError('Author not found', {
                    invalArgs: 'author'
                })

                if (args.genre) {
                    return  author.books.filter(b => b.genres.find(i => i === args.genre)) || []
                }

                return author.books || []
            }

            if (args.genre) {
                const books = await Book.find({}).populate({ path:'author' })
                return books.filter(b => b.genres.find(i => i === args.genre)) || []
            }

            const books = await Book.find({}).populate({ path:'author' })
            return books || []
        },

        allAuthors: async () => {
            const authors = await Author.find({}).populate({ path:'books' })
            return authors || []
        },

        allUsers: async (root, args, { currentUser }) => {
            if (!currentUser) throw new AuthenticationError('Must be logged in to access this endpoint')

            const users = await User.find({}).populate('friends').populate('friend_requests')
            return users
        }
    },

    Mutation: {
        addBook: async (root, args, context) => {
            const { title, author, published, genres } = args
            const { currentUser } = context

            if (!currentUser) {
                throw new AuthenticationError("not authenticated")
            }

            const existingAuthor = await Author.findOne({ name: author })

            if (!existingAuthor) {
                const newAuthor = new Author({
                    name: author
                })

                let savedAuthor
                try {
                    savedAuthor = await newAuthor.save()
                } catch(error) {
                    throw new UserInputError(error.message, {
                        invalidArgs: args,
                    })
                }

                const newBook = new Book({
                    title,
                    published,
                    author: savedAuthor.id,
                    genres
                })
    
                let savedBook
                try {
                    savedBook = await newBook.save()
                } catch(error) {
                    throw new UserInputError(error.message, {
                        invalidArgs: args,
                    })
                }
                
                savedAuthor.books.push(savedBook.id)
                try {
                    await savedAuthor.save()
                } catch(error) {
                    throw new UserInputError(error.message, {
                        invalidArgs: args,
                    })
                }

                pubsub.publish('BOOK_ADDED', { bookAdded: savedBook })
                return savedBook.populate('author').execPopulate()

            } else { // If author already exists

                const newBook = new Book({
                    title,
                    published,
                    author: existingAuthor.id,
                    genres
                })
                
                let savedBook
                try {
                    savedBook = await newBook.save()
                } catch(error) {
                    throw new UserInputError(error.message, {
                        invalidArgs: args,
                    })
                }

                existingAuthor.books.push(savedBook.id)
                
                try {
                    await existingAuthor.save()
                } catch(error) {
                    throw new UserInputError(error.message, {
                        invalidArgs: args,
                    })
                }
                pubsub.publish('BOOK_ADDED', { bookAdded: savedBook })
                return savedBook.populate('author').execPopulate()
            }
        },

        editAuthor: async (root, args, context) => {
            let { name, setBornTo } = args
            const { currentUser } = context

            if (!currentUser) {
                throw new AuthenticationError("not authenticated")
            }

            const updatedAuthor = await Author.findOneAndUpdate(
                { name },
                { born: setBornTo },
                { new: true }
            )
            if (!updatedAuthor) throw new UserInputError("Author not found", { invalArgs: "name" })
            return updatedAuthor.populate('books').execPopulate()
        },

        createUser: async (root, args) => {
            let { username, favoriteGenre, password, repeatPassword } = args

            if (password !== repeatPassword) {
                throw new UserInputError('Passwords do not match', {
                    invalArgs: 'repeatPassword'
                })
            }

            const salt = await bcrypt.genSalt(10)

            let hashedPassword
            try {
                hashedPassword = await bcrypt.hash(password, salt)
            } catch(error) {
                throw new ApolloError(`Failed hashing password: ${error.message}`)
            }
            
            const newUser = new User({
                username,
                favoriteGenre,
                password: hashedPassword
            })

            let savedUser
            try {
                savedUser = await newUser.save()
            } catch(error) {
                throw new UserInputError(error.message, {
                    invalArgs: args
                })
            }

            return savedUser.populate('friends').populate('friend_requests').execPopulate()
        },

        login: async (root, args) => {
            let { username, password } = args

            const user = await User.findOne({ username })
            if (!user) throw new UserInputError('Username or password invalid')

            const isPasswordValid = await bcrypt.compare(password, user.password)
            if (!isPasswordValid) throw new UserInputError('Username or password invalid')

            const payload = {
                username: user.username,
                id: user._id
            }

            return {
                username: user.username,
                id: user.id,
                value: jwt.sign(payload, process.env.TOKEN_SECRET)
            }
        },

        requestFriend: async (root, args, context) => {
            let { id } = args // Target user
            const { currentUser } = context // Me

            if (!currentUser) {
                throw new AuthenticationError("Not authenticated")
            }

            const user = await User.findById(id)
            if (!user) throw UserInputError('User not found', {
                invalArgs: id
            })

            if (user.friends.find(f => f.toString() === currentUser.id)) {
                throw new UserInputError('Cannot add friend already in your friends list', {
                    invalArgs: id
                })
            }

            if (user.friend_requests.find(f => f.toString() === currentUser.id)) {
                throw new UserInputError('Cannot make more than one friend request to the same user', {
                    invalArgs: id
                })
            }

            user.friend_requests = [ ...user.friend_requests, currentUser.id ]
            const savedUser = await user.save()

            return savedUser.populate('friends').populate('friend_requests').execPopulate()
        },

        acceptFriend: async (root, args, context) => {
            const { id } = args // The id who requested friendship
            const { currentUser } = context // My id

            // Remove from my request to friends and save
            const myUser = await User.findById(currentUser.id)

            if (myUser.friends.find(f => f.toString() === id)) {
                throw new UserInputError('User is already in friends list', {
                    invalArgs: id
                })
            }

            if (!myUser.friend_requests.find(f => f.toString() === id)) {
                throw new UserInputError('Friend request not found', {
                    invalArgs: id
                })
            }

            myUser.friends = [...myUser.friends, id]
            myUser.friend_requests = [...myUser.friend_requests].filter(i => i.toString() !== id)
            await myUser.save()

            // Also save myself to my new friend's friend list
            const friend = await User.findById(id)
            friend.friends = [...friend.friends, currentUser.id]
            const savedFriend = await friend.save()

            return savedFriend.populate('friends').populate('friend_requests').execPopulate()
        },

        rejectFriend: async (root, args, context) => {
            const { id } = args // The id who requested friendship
            const { currentUser } = context // My id

            const myUser = await User.findById(currentUser.id)

            myUser.friend_requests = [...myUser.friend_requests].filter(i => i.toString() !== id)
            const updatedUser = await myUser.save()

            return updatedUser.populate('friends').populate('friend_requests').execPopulate()
        }
    },

    Subscription: {
        bookAdded: {
            subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
        }
    }
}
