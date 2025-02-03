import jwt from 'jsonwebtoken'
import { ApiError } from '../utils/ApiError'
import { User } from '../models/user.models'

const authenticateToken = async (req,_,next) => {
    try{
        const token = req.cookies?.accesToken || req.header("Authorization")?.replace("Bearer ", "")
        if(!token) {
            throw new ApiError(
                401,
                "UNAUTHORIZED ACCESS"
            )
        }

        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodeToken?._id).select(
            "-password -refreshToken"
        )

        if(!user) {
            throw new ApiError(
                401,
                "INVALID ACCESS TOKEN"
            )
        }

        req.user = user;
        next()
    } catch {
        throw new ApiError(
            401,
            error?.message || "INVALID ACCESS TOKEN"
        )
    }
}

export {
    authenticateToken
}