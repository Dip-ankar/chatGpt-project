const mongoose = require('mongoose')

const chatSchema = mongoose.Schema({
    user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'user',
    required:true
    },
    title:{
        type:String,
        required:true
    },
    lastActivity:{
        type:Date,
        default:Date.now
    }
},
{
    timestamps:true
})

const chatMOdel = mongoose.model("chat",chatSchema)

module.exports = chatMOdel