const cloudinary  = require("../cloudinary/config");
const Notification = require("../models/notification.model");
const Post = require("../models/post.model");
const User = require("../models/user.model");

const createPost = async (req, res) => {
  try {
    const cloud = cloudinary.config();
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id.toString();

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!text && !img) {
      return res.status(400).json({ error: "Post must have text or image" });
    }

    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: userId,
      text,
      img,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log(err);
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You are not authorized to delete this post" });
    }

    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log(err);
  }
};

const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;

    if (!text) {
      return res.status(404).json({
        error: "Text field is required",
      });
    }

    const post = await Post.findById(postId);

    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = {
      user: userId,
      text,
    };

    post.comments.push(comment);
    await post.save();
    res.status(200).json({ post });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log(err);
  }
};

const likeUnlikePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if the user has already liked the post
    const userHasLiked = post.likes.some(
      (like) => like.user.toString() === userId.toString()
    );

    if (userHasLiked) {
      // Unlike the post
      await Post.updateOne(
        { _id: postId },
        { $pull: { likes: { user: userId } } }
      );
      await User.updateOne(
        {
          _id: userId,
        },
        { $pull: { likedPosts: postId } }
      );
      return res.status(200).json({ message: "Post unliked" });
    } else {
      // Like the post
      post.likes.push({ user: userId });
      await User.updateOne(
        {
          _id: userId,
        },
        { $push: { likedPosts: postId } }
      );
      await post.save();

      const newNotification = new Notification({
        type: "like",
        from: userId,
        to: post.user,
      });

      await newNotification.save();
      return res.status(200).json({ message: "Post liked" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (posts.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log(err);
  }
};

const getLikedPosts = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error: "No user found",
      });
    }

    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    if (likedPosts.length === 0) {
      return res.status(201).json({ error: "No liked posts found" });
    }

    res.status(200).json(likedPosts);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const followingPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(500).json({ error: "No User Found" });
    }

    const following = user.following;

    const feedPosts = await Post.find({ user: { $in: following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(feedPosts);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log(err);
  }
};

const getUsersPosts = async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({ path: "user", select: "-password" })
      .populate({ path: "comments.user", select: "-password" });

    if (!posts) {
      return res.status(201).json({ error: "No posts found" });
    }

    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
    console.log(err);
  }
};

module.exports = {
  createPost,
  deletePost,
  commentOnPost,
  likeUnlikePost,
  getAllPosts,
  getLikedPosts,
  followingPosts,
  getUsersPosts,
};
