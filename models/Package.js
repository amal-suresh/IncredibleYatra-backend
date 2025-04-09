const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        pricePerPerson: { type: Number, required: true },
        description: { type: String, required: true },
        location: { type: String, required: true },
        duration: { type: String, required: true },
        images: [
            {
                url: { type: String, required: true },
                public_id: { type: String, required: true },
                alt: { type: String },
            },
        ],
        isVisible: { type: Boolean, default: true },
    },
    { timestamps: true }
);
module.exports = mongoose.model("Package", packageSchema);

