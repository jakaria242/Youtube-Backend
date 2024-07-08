import mongoose, { Schema }  from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

 const videoSchema = new Schema({
    videoFile:{
        type: String,  //=== cloudinary url
        requireed: true,
    },
    thumbnail:{
        type: String,  //=== cloudinary url
        requireed: true,
    },
    title:{
        type: String,
        requireed: true,
    },
    description:{
        type: String,     
    },
    duration:{
        type: Number,      //=== cloudinary url
        requireed: true,
    },
    views:{
        type: Number,
        default: 0
    },
    isPubleshed:{
        type: Boolean,
        default: true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
   
 }, {timestamps: true})

 videoSchema.plugin(mongooseAggregatePaginate)

 export const Video = mongoose.model("Video",videoSchema)