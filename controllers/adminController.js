const Booking = require("../models/Booking");
const Package = require("../models/Package");
const User = require("../models/User");
const cloudinary = require("../utils/cloudinary");


const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = {
      role: "user",
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select(" name email isBlocked");

    const total = await User.countDocuments(query);

    res.status(200).json({
      data: users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const toggleBlockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({ success: true, isBlocked: user.isBlocked });
  } catch (error) {
    console.error("Toggle block error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const createOrUpdatePackage = async (req, res) => {
  try {
    const {
      _id, // for edit
      title,
      description,
      duration,
      location,
      pricePerPerson,
      images,
    } = req.body;

    // Validate required fields
    if (!title || !description || !duration || !location || !pricePerPerson || !images?.length) {
      return res.status(400).json({ message: "All fields including images are required" });
    }

    if (_id) {
      // ✅ EDIT MODE
      const existingPackage = await Package.findById(_id);
      if (!existingPackage) {
        return res.status(404).json({ message: "Package not found" });
      }

      existingPackage.title = title;
      existingPackage.description = description;
      existingPackage.duration = duration;
      existingPackage.location = location;
      existingPackage.pricePerPerson = pricePerPerson;
      existingPackage.images = images;

      await existingPackage.save();

      return res.status(200).json({ message: "Package updated successfully", data: existingPackage });
    } else {
      // ✅ CREATE MODE
      const newPackage = new Package({
        title,
        description,
        duration,
        location,
        pricePerPerson,
        images,
      });

      await newPackage.save();

      return res.status(201).json({ message: "Package created successfully", data: newPackage });
    }
  } catch (error) {
    console.error("Error creating or updating tour package:", error);
    res.status(500).json({ message: "Server error" });
  }
};



const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await Package.findById(id);

    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }
    const imageDeletePromises = pkg.images.map((img) =>
      cloudinary.uploader.destroy(img.public_id)
    );
    await Promise.all(imageDeletePromises);
    await pkg.deleteOne();

    res.status(200).json({ message: "Package and images deleted successfully" });
  } catch (error) {
    console.error("Error deleting package:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getPackages = async (req, res) => {
  try {
    const { search = "", location = "", sort = "", page = 1, limit = 6 } = req.query;

    const query = {};

    if (search) {
      query.title = { $regex: search, $options: "i" }; // case-insensitive
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    let sortOption = {};
    if (sort === "price_asc") {
      sortOption.pricePerPerson = 1;
    } else if (sort === "price_desc") {
      sortOption.pricePerPerson = -1;
    } else {
      sortOption.createdAt = -1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [packages, total] = await Promise.all([
      Package.find(query).sort(sortOption).skip(skip).limit(parseInt(limit)),
      Package.countDocuments(query),
    ]);

    res.status(200).json({
      data: packages,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
    });

  } catch (error) {
    console.error("Error fetching packages:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
const deletePackageImage = async (req, res) => {
  const { public_id, packageId } = req.query;

  if (!public_id || !packageId) {
    return res.status(400).json({ message: 'Missing public_id or packageId' });
  }

  try {
    await cloudinary.uploader.destroy(public_id);
    const updatedPackage = await Package.findByIdAndUpdate(
      packageId,
      {
        $pull: { images: { public_id } },
      },
      { new: true }
    );

    if (!updatedPackage) {
      return res.status(404).json({ message: 'Package not found' });
    }

    return res.status(200).json({
      message: 'Image deleted successfully',
      images: updatedPackage.images,
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return res.status(500).json({ message: 'Failed to delete image', error });
  }
};

const togglePackageVisibility = async (req, res) => {
  try {
    const { id } = req.body;
    const pkg = await Package.findById(id);

    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }

    pkg.isVisible = !pkg.isVisible;
    await pkg.save();

    res.status(200).json({ message: "Visibility toggled successfully", isVisible: pkg.isVisible });
  } catch (error) {
    console.error("Error toggling package visibility:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const { page = 1, search = "" } = req.query;
    const limit = 6;
    const skip = (page - 1) * limit;

    // Find user IDs and package IDs matching the search term
    const users = await User.find({
      name: { $regex: search, $options: "i" },
    }).select("_id");

    const packages = await Package.find({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    const userIds = users.map((u) => u._id);
    const packageIds = packages.map((p) => p._id);

    const query = {
      $or: [
        { userId: { $in: userIds } },
        { packageId: { $in: packageIds } },
      ],
    };

    const total = await Booking.countDocuments(query);

    const bookings = await Booking.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("userId", "name email")
      .populate("packageId", "title location pricePerPerson");

    res.status(200).json({
      success: true,
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      bookings,
    });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { bookingStatus } = req.body;

    if (!["Confirmed", "Pending", "Cancelled", "Completed"].includes(bookingStatus)) {
      return res.status(400).json({ success: false, message: "Invalid booking status" });
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { bookingStatus },
      { new: true }
    ).populate("userId", "name email")
      .populate("packageId", "title location");

    if (!updatedBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      booking: updatedBooking,
    });
  } catch (err) {
    console.error("Error updating booking status:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPackages = await Package.countDocuments();
    const totalBookings = await Booking.countDocuments();

    const totalRevenueAgg = await Booking.aggregate([
      { $match: { paymentStatus: "Success" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "name email")
      .populate("packageId", "title location");

    const topLocations = await Booking.aggregate([
      {
        $lookup: {
          from: "packages",
          localField: "packageId",
          foreignField: "_id",
          as: "package",
        },
      },
      { $unwind: "$package" },
      {
        $group: {
          _id: "$package.location",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const dailyBookings = await Booking.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      totalUsers,
      totalPackages,
      totalBookings,
      totalRevenue,
      recentBookings,
      topLocations,
      dailyBookings,
    });
  } catch (error) {
    console.error("Dashboard Error:", error.message);
    res.status(500).json({ message: "Failed to fetch dashboard data." });
  }
};


module.exports = { getAllUsers, toggleBlockUser, createOrUpdatePackage, deletePackage, getPackages, deletePackageImage, togglePackageVisibility, getAllBookings, updateBookingStatus, getDashboardStats };