const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },

    phoneNumber: {
      type: String,
      required: true,
    },

    selectedDate: {
      type: String,
      required: true,
    },

    totalPersons: {
      type: Number,
      required: true,
    },

    total: {
      type: Number,
      required: true,
    },

    razorpay_order_id: {
      type: String,
      required: true,
    },

    razorpay_payment_id: {
      type: String,
      required: true,
    },

    razorpay_signature: {
      type: String,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Success", "Failed"],
      default: "Success",
    },

    bookingStatus: {
        type: String,
        enum: ["Confirmed", "Pending", "Cancelled", "Completed"],
        default: "Confirmed",
      }
      
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
