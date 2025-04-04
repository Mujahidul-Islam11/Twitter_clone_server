const jwt = require("jsonwebtoken");

const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });


  res.cookie("jwt", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
    httpOnly: true, // Prevents JavaScript access
    secure: true, // Set to true in production with HTTPS
    sameSite: "none", // Helps with CORS
  });
  
};

module.exports = generateTokenAndSetCookie;
