import { Router } from 'express'
import { upload } from '../middlewares/multer.middlewares.js'
import { 
    changeCurrentPassword, 
    refreshAccessToken, 
    registerUser, 
    signInUser, 
    signOutUser, 
    updateAccountDetails, 
    updateUserAvatar 
} from '../controllers/users.controllers.js'
import { authenticateToken } from '../middlewares/auth.middlewares.js'

const router = Router()

router.route('/register-user').post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }
    ]),
    registerUser
)
router.route('/signin-user').post(signInUser)
router.route('/signout-user').post(authenticateToken,signOutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(authenticateToken,changeCurrentPassword)
router.route('/update-account').post(authenticateToken,updateAccountDetails)
router.route('/update-avatar').post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }
    ]),authenticateToken,updateUserAvatar)

export default router