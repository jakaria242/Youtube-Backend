import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const emailPattrn =  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/


const register = asyncHandler(async (req,res)=>{
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

export {register}