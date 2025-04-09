const Razorpay = require("razorpay");
const crypto = require("crypto");
const Booking = require("../models/Booking");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};



exports.verifyPaymentAndCreateBooking = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      packageId,
      phoneNumber,
      total,
      selectedDate,
      totalPersons,
    } = req.body;

    const userId = req.user.id; 

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      
      const booking = new Booking({
        packageId,            
        userId,               
        phoneNumber,
        total,
        selectedDate,
        totalPersons,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        bookingStatus: "Confirmed",
      });
      
      await booking.save();

      res.status(200).json({
        success: true,
        message: "Payment verified & Package booked successfully",
        booking,
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
