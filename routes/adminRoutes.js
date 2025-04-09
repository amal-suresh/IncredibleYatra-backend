const express = require('express');
const router = express.Router();
const { getAllUsers, toggleBlockUser, getPackages, deletePackage, deletePackageImage, createOrUpdatePackage, togglePackageVisibility, getAllBookings, updateBookingStatus, getDashboardStats } = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/authMiddleware');


router.get('/getUsers', verifyAdmin, getAllUsers);
router.post("/toggle-block/:id", verifyAdmin, toggleBlockUser);
router.post("/packages", verifyAdmin, createOrUpdatePackage);
router.get("/packages", verifyAdmin, getPackages);
router.delete("/delete-package/:id", verifyAdmin, deletePackage);
router.delete('/delete-package-image', verifyAdmin, deletePackageImage);
router.post("/packages/toggle-visibility", verifyAdmin, togglePackageVisibility);
router.get("/bookings", verifyAdmin, getAllBookings);
router.put("/bookings/:bookingId/status", verifyAdmin, updateBookingStatus);
router.get("/dashboard", verifyAdmin, getDashboardStats);






module.exports = router;
