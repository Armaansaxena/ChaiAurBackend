import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;
    if (!content || content.trim()) {
        throw new ApiError(400, "Can not add a blank tweet")
    }
    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user?.id
    })
    return res
        .status(200)
        .json(new ApiResponse(200, {tweet}, "Tweet added successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params
    if (!userId) {
        throw new ApiError(404, "User id is missing")
    }

    const existingUser = await User.findById(userId)

    if (!existingUser) {
        throw new ApiError(404, "User with this ID is missing ")
    }
    const userTweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: {
                from: "users",
                foreignField: "_id",
                localField: "owner",
                as: "ownerInfo",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: {
                path: "$ownerInfo",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                username: "$ownerInfo.username",
                fullName: "$ownerInfo.fullName",
                avatar: "$ownerInfo.avatar"
            }
        },
        {
            $project: {
                content: 1,
                username: 1,
                fullName: 1,
                avatar: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, {tweets: userTweets}, "User tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    
    if (!tweetId) {
        throw new ApiError(400, "Tweet id is missing")
    }
    const existingTweet = await Tweet.findById(tweetId)

    if (!existingTweet) {
        throw new ApiError(404, "Tweet not found")
    }
    if (!existingTweet.owner.equals(req.user?.id)) {
        throw new ApiError(403, "User unauthorized to perform this action ")
    }

    const { content } = req.body
    if (!content || content.trim()) {
        throw new ApiError(400, "Content not be empty")
    }
    existingTweet.content = content.trim()
    await existingTweet.save();
    return res
        .status(200)
        .json(new ApiResponse(200, {tweet: existingTweet}, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
    if (!tweetId) {
        throw new ApiError(400, "Tweet id not found")
    }

    const existingTweet = await Tweet.findById(tweetId)

    if (!existingTweet) {
        throw new ApiError(404, "Tweet not found")
    }
    if (!existingTweet.owner.equals(req.user?.id)) {
        throw new ApiError(403, "User not authorized to perform this action")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}