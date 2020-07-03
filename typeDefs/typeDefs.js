const { gql } = require('apollo-server')

module.exports = gql`
    type User {
        username: String!
        favoriteGenre: String
        friends: [User]!
        friend_requests: [User]!
        id: ID!
    }

    type Token {
        username: String!
        id: ID!
        value: String!
    }

    type Author {
        name: String!
        born: Int
        books: [Book]!
        id: ID!
    }

    type Book {
        title: String!
        published: Int!
        author: Author!
        genres: [String!]!
        id: ID!
    }

    type Query {
        authorCount: Int!
        
        bookCount: Int!

        allBooks(
            author: String
            genre: String
        ): [Book]!

        allAuthors: [Author]!

        me: User

        allUsers: [User]!
    }

    type Mutation {
        addBook(
            title: String!
            author: String!
            published: Int!
            genres: [String]!
        ): Book

        editAuthor(
            name: String!
            setBornTo: Int!
        ): Author

        createUser(
            username: String!
            favoriteGenre: String
            password: String!
            repeatPassword: String!
        ): User

        login(
            username: String!
            password: String!
        ): Token

        requestFriend(
            id: ID!
        ): User

        acceptFriend(
            id: ID!
        ): User

        rejectFriend(
            id: ID!
        ): User
    }

    type Subscription {
        bookAdded: Book!
    }
`
