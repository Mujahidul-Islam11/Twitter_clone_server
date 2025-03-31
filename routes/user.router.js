const express = require("express");
const protectedRoute = require("../middleware/protectedRoute");
const {
  getUserProfile,
  suggestedUsers,
  followUnfollow,
  updateProfile,
} = require("../controller/userController");
const router = express.Router();

router.get("/profile/:username", protectedRoute, getUserProfile);
router.get("/suggested", protectedRoute, suggestedUsers);
router.post("/follow/:id", protectedRoute, followUnfollow);
router.post("/update", protectedRoute, updateProfile);

module.exports = router;
