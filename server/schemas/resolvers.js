const { AuthenticationError } = require("apollo-server-express");
const { User, Book } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({_id: context.user._id})
                .select("-__V =password")
                .populate("books")
                return userData;
            }
            throw new AuthenticationError("Not Logged In!")
        }
    },
    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args)
            const token = signToken(user);
            return {user, token}
        },
        login: async (parent, {email,password}) => {
            const user = await User.findOne({email})
            if(!user) {
                throw new AuthenticationError("Invalid Credentials!")
            }
            const correctPassword = await user.isCorrectPassword(password)
            if(!correctPassword) {
                throw new AuthenticationError("Invalid Credentials!")
            }
            const token = signToken(user)
            return {token,user} 
        },
        saveBook: async (parent, args, context) => {
            if(context.user) {
                const updateUser = await User.findByIdAndUpdate(
                    {_id: context.user._id},
                    {$addToSet: {savedBooks: args.input}},
                    {new:true}
                );
                return updateUser;
            }
            throw new AuthenticationError("Log In First!")
        },
        removeBook: async (parent, args, context) => {
            if(context.user) {
                const updateUser = await User.findOneAndUpdate(
                    {_id: context.user._id},
                    {$pull: {savedBooks: {bookId: args.bookId}}},
                );
                return updateUser;
            }
            throw new AuthenticationError("Log In First!")
        }
    },
}

module.exports = resolvers;