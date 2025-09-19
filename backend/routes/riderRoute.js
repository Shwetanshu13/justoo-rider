import express from "express";

const router = express.Router();

router.get("/profile", getProfile);
router.put("/updateprofile", authenticateToken, updateProfile);
router.put("/updatepassword", authenticateToken, updatePassword);
