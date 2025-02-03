import { asyncHandler } from '../utils/AsyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { User } from '../models/user.models.js'
import { createAvatarWebp } from '../utils/CreateAvatar.js'
import { uploadOnCloudinary } from '../utils/Cloudinary.js'

const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({
            validateBeforeSave: false
        })

        return {
            accessToken,
            refreshToken
        }
    } catch (error) {
        throw new ApiError(
            500,
            'SOMETHING WENT WRONG GENERATING ACCESS AND REFRESH TOKEN'
        )
    }
}

const registerUser = asyncHandler(async(req,res) => {
    const { username,fullname,email,password } = req.body
    if(
        [fullname,username,email,password].some((field) => (field?.trim() === ""))
    ) {
        throw new ApiError(
            400,
            "ALL FIELDS ARE REQUIRED"
        )
    }

    const existedUser = await User.findOne({
        $or: [
            {username},
        ]
    })

    if(existedUser) {
        throw new ApiError(
            409,
            "USER WITH THIS USERNAME ALREADY EXISTS"
        )
    }

    let avatar = null;
    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if (avatarLocalPath) {
        avatar = await uploadOnCloudinary(avatarLocalPath);
    } else {
        const avatarLocalPath = await createAvatarWebp(username);
        avatar = await uploadOnCloudinary(avatarLocalPath);
    }

    if(!avatar) {
        throw new ApiError(
            400,
            "SOMETHING WENT WRONG UPLOADING IMAGE FILE"
        )
    }

    const user = new User({
        username: username.toLowerCase(),
        fullname,
        password,
        email,
        avatar: avatar.secure_url
    })

    await user.save()

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(
            500,
            "SOMETHING WENT WRONG REGISTERING THE USER"
        )
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            user,
            'NEW USER CREATED SUCCESFULLY'
        )
    )
})

const signInUser = asyncHandler(async(req,res) => {
    const { username,email,password } = req.body

    if([username,email,password].some((field) => !field?.trim())) {
        throw new ApiError(
            400,
            "ALL FIELDS ARE REQUIRED"
        )
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user) {
        throw new ApiError(
            404,
            'USER DOES NOT EXIST'
        )
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(
            401,
            'PASSWORD INCORRECT'
        )
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select('-password -refreshToken')

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "USER SIGNED IN SUCCESSFULLY"
        )
    )
})

const signOutUser = asyncHandler(async(req,res) => {
    const userOut = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(
        200,
        {},
        "USER SIGNED OUT"
    ))
})

const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomingRefreshToken = req.cookies.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(
            401,
            "UNAUTHORIZED REQUEST"
        )
    }

    try {
        const decodeToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodeToken?._id)

        if(!user) {
            401,
            "INVALID REFRESH TOKEN"
        }

        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(
                401,
                'REFRESH TOKEN IS EXPIRED'
            )
        }  

        const options = {
            httpOnly: true,
            secure: true
        }

        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)

        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, refreshToken: newRefreshToken
                },
                'ACCESS TOKEN REFRESHED'
            )
        )

    } catch (error) {
        throw new ApiError(
            401,
            error?.message || 'INVALID REFRESH TOKEN'
        )
    }
})

const changeCurrentPassword = asyncHandler(async(req,res) => {
    const { oldPassword,newPassword } = req.body

    if(!oldPassword) {
        throw new ApiError(
            400,
            "PLEASE ENTER A PASSWORD"
        )
    }

    const user = await User.findById(req.user?._id)

    const verifyOldPass = await user.isPasswordCorrect(oldPassword)

    if(!verifyOldPass) {
        throw new ApiError(
            400,
            "INVALID OLD PASSWORD"
        )
    }

    user.password = newPassword

    await user.save({
        validateBeforeSave: false
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "PASSWORD CHANGED"
        )
    )
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const { username, fullname, email } = req.body

    if(!fullname && !email && !username) {
        throw new ApiError(
            400,
            "ATLEAST ONE FEILD IS REQUIRED"
        )
    }

    const updateData = {}

    if(username) {
        updateData.username = username
    }
    if(email) {
        updateData.email = email
    }
    if(fullname) {
        updateData.fullname = fullname
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: updateData
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "ACCOUNT UPDATED"
        )
    )
})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(
            400,
            'AVATAR FILE IS MISSING'
        )
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    console.log('response : ',avatar);
    

    if(!avatar.secure_url) {
        throw new ApiError(
            400,
            'ERROR WHILE UPLOADING AVATAR FILE'
        )
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.secure_url
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            'AVATAR FILE UPLOADED'
        )
    )
})

export {
    registerUser,
    signInUser,
    signOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserAvatar,
}