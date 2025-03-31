const express = require("express");
const { createPost, deletePost, commentOnPost, likeUnlikePost, getAllPosts, getLikedPosts, followingPosts, getUsersPosts } = require("../controller/postController");
const protectedRoute = require("../middleware/protectedRoute");
const router = express.Router();

router.get("/all", protectedRoute, getAllPosts);
router.get("/following", protectedRoute, followingPosts);
router.get("/liked/:id", protectedRoute, getLikedPosts);
router.get("/user/:username", protectedRoute, getUsersPosts);
router.post("/create", protectedRoute, createPost);
router.post("/likeUnlike/:id", protectedRoute, likeUnlikePost);
router.post("/comment/:id", protectedRoute, commentOnPost);
router.delete("/:id", protectedRoute, deletePost);

module.exports = router;
