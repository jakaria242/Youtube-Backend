import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'

const emailPattrn =  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;


//// ========================= generateAccess And  RefereshTokens start ===========================
const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAcessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}
//// ============ generateAccess And  RefereshTokens End ===============================

  //// =============================rgistration start Here ========================
const registerUser = asyncHandler(async (req,res)=>{
    // (1) get user details from frontend
    // (2) validation - not empty
    // (3) check if user already exists: username, email
    // (4) check for images, check for avatar
    // (5) upload them to cloudinary, avatar
    // (6) create user object - create entry in db
    // (7) remove password and refresh token field from response
    // (8) check for user creation
    // (9) return res
    
    const {userName, email, fullName, password} = req.body
    if ( [fullName, email, userName, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All field are required")
    }
    if (!emailPattrn.test(email)) {
        throw new ApiError(404, "Invalied email")
    }
    const existedUser = await User.findOne({
        $or: [{ email }, { userName }]
    })
    if (existedUser) {
        throw new ApiError(409, "eamil or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path; 
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
     
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName: fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        userName: userName.toLowerCase(),
        email: email,
        password:password
    })

    const createUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createUser){
        throw new ApiError(500, "something went wrong when register the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createUser, "User registered Successfully")
    )

})
  //// =============================rgistration End Here ========================

    //// =======================login start Here ========================
 const loginUser = asyncHandler(async (req,res)=>{
    // (1) req body -> data
    // (2) username or email
    // (3) find the user
    // (4) password check
    // (5) access and referesh token genarate send the user
    // (6) send cookie

    const {email, userName, password} = req.body
    if (!userName && !email ) {
        throw new ApiError(400, "userName or email is required")
    }

    // ===========chaile ai logic use kora jabe jodi jekono akta dorkar hoi===================
    // if (!(userName || email)) {
    //     throw new ApiError(400, "userName or email is required")
    // }
   
    const user = await User.findOne({
        $or: [{ email }, { userName }]
    })
    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isCorrectPassword(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

    // generateAccess And RefereshTokens method call here -=== the method create in the top =====  start here
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)
    // generateAccess And RefereshTokens method call here -=== the method create in the top=====  End here

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // send the access & refresh token by the cookise start here   

    const options = {
        httpOnly: true,
        secure: true
     }

     return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options)
     .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )


    // send the access & refresh token by the cookise End here

 })
//// =========================ogin End Here ========================

    //// ================logout start Here ========================
const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
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
    .json(new ApiResponse(200, {}, "User logged Out"))
})
//// ========================logout End Here ========================

//// =========refreshTokenAccess end-point create start Here ========================
const refreshAccessToken = asyncHandler(async (req,res)=>{
   const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
   if (!incomingRefreshToken) {
     throw new ApiError(401, "unauthorized request")
   }

   try {
    // verify incomingRefreshToken start here=====
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
 
    const user =  await User.findById(decodedToken?._id)
 
    if (!user) {
     throw new ApiError(401, "Invalited RefreshToken")
   }
   if (incomingRefreshToken !== user?.refreshToken) {
     throw new ApiError(401, "Refresh token is expired or used")
   }
    // verify incomingRefreshToken End here=======
 
    ///======= genarate Access & Refresh Token =====
    const options = {
        httpOnly: true,
        secure: true
     } 
     const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
         new ApiResponse(
             200, 
             {accessToken, refreshToken: newRefreshToken},
             "Access token refreshed"
         )
     )
         ///======= genarate Access & Refresh Token =====
   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
   }

})
//// =========refreshToken end-point  End Here ========================

//// =========Change Current Password start Here ========================
const changeCurrentPassword = asyncHandler(async (req, res)=>{

    const {oldPassword, newPassword} =req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isCorrectPassword(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res.status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})
//// =========Change Current Password  End Here ========================

//// =========Get Current User  Start Here ========================
const getCurrentUser = asyncHandler(async(req, res) => {
    return res.status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})
//// =========Get Current User  End Here ========================


//// =========Update Account Deatils Start Here ========================
const updateAccountDetails  = asyncHandler(async(req,res)=>{

     const {fullName, email} = req.body
     if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }
    const user = User.findByIdAndDelete(
        req.user?._id,
        { 
            fullName,           ///  (1) chaile avabe kore jai ---   fullName:fullName  |or|  fullName
            email: email        ///  (2)chaile avabe kore jai  ---   email:email  |or|  email
         },
        { new: true }
        ).select("-password")

        return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
})
//// =========Update Account Deatils End Here ========================

//// =========Update User Avatar  Start Here ========================
   const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})
//// =========Update  User Avatar  End Here ========================

//// =========Update User Cover Iamge  Start Here ========================
   const updateUserCoverImage  = asyncHandler(async(req, res) => {
    const coverImageLocalPath  = req.file?.path

    if (!coverImageLocalPath ) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover image")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})
//// =========Update  User  Cover Iamge  End Here ========================



export {
        registerUser, 
        loginUser, 
        logoutUser, 
        refreshAccessToken, 
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,  
        updateUserAvatar,
        updateUserCoverImage
      }