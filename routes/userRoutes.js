const express = require('express');
const { registerUser, loginUser, getVisiblePackages, getPackageById, getBookingDetails, getUserBookingsWithProfile, sendContactMail } = require('../controllers/userController');
const { verifyAuth } = require('../middleware/authMiddleware');
const router = express.Router();


router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/packages', getVisiblePackages);
router.get("/package/:id", verifyAuth, getPackageById);
router.get("/booking/:bookingId", verifyAuth, getBookingDetails);
router.get("/my-bookings", verifyAuth, getUserBookingsWithProfile);
router.post("/send", sendContactMail);





module.exports = router;
