const express = require("express");
const Notification = require("../models/notification.model");
const { getNotifications, deleteNotifications } = require("../controller/notificationController");
const protectedRoute = require("../middleware/protectedRoute");
const router = express.Router();

router.get("/", protectedRoute, getNotifications);
router.delete("/",protectedRoute, deleteNotifications);

module.exports = router;
