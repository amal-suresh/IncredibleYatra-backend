const express = require("express");
const { createOrder, verifyPaymentAndCreateBooking } = require("../controllers/paymentController");
const { verifyAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create-order",verifyAuth, createOrder); 
router.post("/verifyPayment-createOrder",verifyAuth, verifyPaymentAndCreateBooking); 


module.exports = router;
