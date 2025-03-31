const Notification = require("../models/notification.model");
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const {v2} = require("cloudinary")
const cloudinary = v2;

const getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const followUnfollow = async (req, res) => {
  try {
    const { id } = req.params;
    const userModify = await User.findById(id);
    const currentUser = await User.findOne(req.user._id);

    if (id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You can't follow/unfollow yourself" });
    }

    if (!userModify || !currentUser) {
      return res.status(400).json({ error: "User Not Found" });
    }

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      // unfollow the user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      res.status(200).json({ message: "User Unfollowed Successfully" });
    } else {
      // follow the user
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      // notification
      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: userModify._id,
      });
      await newNotification.save();
      res.status(200).json({ message: "User Followed Successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const suggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;

    const usersFollowedByMe = await User.findById(userId).select("following");

    const users = await User.aggregate([
      {
        $match: { _id: { $ne: userId } },
      },
      {
        $sample: { size: 10 },
      },
    ]);

    const filteredUsers = users.filter(
      (user) => !usersFollowedByMe.following.includes(user._id)
    );

    const suggestedUsers = filteredUsers.slice(0, 4);

    suggestedUsers.forEach((user) => (user.password = null));

    res.status(200).json(suggestedUsers);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateProfile = async (req, res) => {
  let { email, username, fullName, bio, link, newPassword, currentPassword } = req.body;
  let { profileImg, coverImg } = req.body;

  try {
    const userId = req.user._id;
    let user = await User.findById(userId);
    if(!user){
      return res.status(404).json({error: "User Not Found"});
    }
    if((!currentPassword && newPassword) || (!newPassword && currentPassword)){
      return res.status(400).json({error: "Please provide both current and new password"})
    }

    if(currentPassword && newPassword){
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if(!isMatch){
        return res.status(400).json({error: "Current password is incorrect"})
      }
      if(newPassword.length <6){
        return res.status(400).json({error: "Password must be at least 6 characters long"})
      }
      
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if(profileImg){
      if(user.profileImg){
        await cloudinary.uploader.destroy(user.profileImg.split('/').pop().split('.')[0])
      }
      const profileImgRes = await cloudinary.uploader.upload(profileImg);
      profileImg = profileImgRes.secure_url;
    }
    if(coverImg){
      if(user.coverImg){
        await cloudinary.uploader.destroy(user.coverImg.split('/').pop().split('.')[0])
      }
      const coverImgRes = await cloudinary.uploader.upload(coverImg);
      coverImg = coverImgRes.secure_url;
    }

    user.username = username || user.username;
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();

    user.password = null;
    res.status(200).json(user);
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getUserProfile,
  followUnfollow,
  updateProfile,
  suggestedUsers,
};
