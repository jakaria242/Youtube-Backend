import mongoose, { Schema }  from "mongoose";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"

 const userSchema = new Schema({
    userName:{
        type: String,
        requireed: true,
        unique: true,
        lowercase:true,
        trim: true,
        indexe: true
    },
    email:{
        type:String,
        requireed: true,
        unique: true,
        lowercase:true,
        trim: true
    },
    fullName:{
        type: String,
        requireed: true,
        trim: true,
        indexe: true
    },
    avatar:{
        type: String,      //=== cloudinary url
        requireed: true,
    },
    coverImage:{
        type: String,      //=== cloudinary url
    },
    watchHistory:[
      {
        type: Schema.Types.ObjectId,
        ref: "Video"
    }
    ],
    password:{
        type: String,
        requireed: [true, "password is required"]
    },
    refreshToken:{
        type: String
    }
   
 }, {timestamps: true})


// password encrypt function start here=============================

//===(pre)-ar maddome database a kono kisu save howar age change kora arr (isModified)-check kore kono field is modified or not ====
 userSchema.pre("save", async function (next){
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10)
        next();
      } else {
       return  next();
      }
 })
// password encrypt function end here=============================


// password bcrypt or compare method start here=============================

/*  mongoose (method)-helps to mange utils funtions. This (methods)-name is isCorrectPassword. This (method) create password bcrypt function. compare to encrypt& bcrypt*/
userSchema.methods.isCorrectPassword = async function (password) {
 return await bcrypt.compare(password, this.password);
};
// password bcrypt or compare method end here=============================


//@function generateAcessToken() method start here ============
userSchema.methods.generateAcessToken = function () {
    return jwt.sign(
      {
        _id: this._id,
        email: this.email,
        userName: this.userName,
        fullName: this.fullName,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
    );
  };
//@function generateAcessToken() method End here ============


//@function generateRefreshToken() method Start here ============

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
      {
        _id: this._id,

      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      }
    );
  };

//@function generateRefreshToken() method End here ============





 export const  User = mongoose.model("User",userSchema)