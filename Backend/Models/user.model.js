import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
  FirstName:{
    type:String,
    required:true
  },
  LastName:{
    type:String,
  },
  UserName:{
    type:String,
    required:true,
    unique:true
  },
  Email:{
    type:String,
    required:true,
    unique:true
  },
  Password:{
    type:String,
    required:true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
},{timestamps:true})

const User=mongoose.model("User",userSchema);
export default User;
