import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.modle.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user detailsfrom frontend
  const { fullName, email, username, password } = req.body;
  console.log("email", email);
  // validate - not empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, `All fields are required`);
  }
  // check if user allready exists: username, email
  const existedUser = User.findOne({ $or: [{ email }, { fullName }] });
  if (existedUser) {
    throw new ApiError(409, "User with email or name allready exist.");
  }
  // check for img & avatar. Files get from multer middleware
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  // upload them to coludinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  // create user object - create entry in DB
  const user = await User.create({
    username: username.toLowerCase,
    fullName,
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
  });
  // remove password & refresh token field from res
  const cretedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // check for user creation
  if (!cretedUser) {
    throw new ApiError(500, "Something went wrong while registring the user.");
  }
  // return res
  return res
    .status(201)
    .json(new ApiResponse(200, cretedUser, "User registered Successfully"));
});

export { registerUser };
