const { Schema, default: mongoose } = require("mongoose");

const NotificationSchema = new Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ["follow", "like", "comment"]
    },
    read: {
        type: Boolean,
        default: false,
    },
}, {timestamps: true});

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;