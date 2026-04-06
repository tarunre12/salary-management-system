import generateToken from "../config/token.js";
import User from "../Models/user.model.js";
import bcrypt from "bcryptjs";

export const signUp = async (req, res) => {
  try {
    const { FirstName, LastName, Email, Password, UserName, role } = req.body;

    if (!FirstName || !LastName || !Email || !Password || !UserName) {
      return res.status(400).json({ message: "Enter All The Details" });
    }

    let existUser = await User.findOne({ Email });
    if (existUser) {
      return res.status(400).json({ message: "User Exist" });
    }
    const hassedPassword = await bcrypt.hash(Password, 10);

    const user = await User.create({
      FirstName,
      LastName,
      Email,
      Password: hassedPassword,
      UserName,
      role: role || 'user',
    });

    let token;
    try {
      token = await generateToken(user._id);
    } catch (error) {
      console.log(error);
    }
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      user: {
        FirstName: user.FirstName,
        LastName: user.LastName,
        Email: user.Email,
        UserName: user.UserName,
        role: user.role,
      },
      token // For frontend localstorage fallback if needed
    });
  } catch (error) {
    return res.status(500).json({ message: "internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { Email, Password, role } = req.body;
    let existUser = await User.findOne({ Email });
    if (!existUser) {
      return res.status(400).json({ message: "User Does Not Exist" });
    }
    if (existUser.role !== role) {
      return res.status(403).json({ message: "Invalid role selected for this account" });
    }
    let match = await bcrypt.compare(Password, existUser.Password);
    if (!match) {
      return res.status(400).json({ message: "Incorrect Password" });
    }

    let token;
    try {
      token = await generateToken(existUser._id);
    } catch (error) {
      console.log(error);
    }
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      user: {
        FirstName: existUser.FirstName,
        LastName: existUser.LastName,
        Email: existUser.Email,
        UserName: existUser.UserName,
        role: existUser.role,
      },
      token // For frontend localstorage fallback if needed
    });
  } catch (error) {
    return res.status(500).json(error);
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logout Successfull." });
  } catch (error) {
    console.log(error);
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
