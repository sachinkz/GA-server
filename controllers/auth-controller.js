const mongoose = require("mongoose")
const HttpError = require("../models/http-errors")
const User = require("../models/user-model")



const createUser = async (req, res, next) => {

    const { userId, name, email, imageUrl } = req.body

    const newUser = new User({
        userId,
        name,
        email,
        imageUrl,
        reviews: [],
        isVerified: false,
        isTopten: false,
        posts: [],
        works: [],
        followers: [],
        following: []
    })

    try {

        await newUser.save()

    } catch (err) {
        return next(new HttpError('something went wrong while creating user', 500))
    }

    res.json(newUser)

}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////

const getUser = async (req, res, next) => {
    const userId = req.params.userId;
    let user={status:false}
    try {
        user = await User.findOne({ userId: userId })
        if (!user) {
        return next(new HttpError('not registered', 500));
        }
        
    } catch (err) {
        return next(new HttpError('something went wrong while finding user', 500));
    }
    res.json(user);
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////


exports.createUser = createUser;
exports.getUser = getUser;
