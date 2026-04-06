import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date().setHours(0, 0, 0, 0),
    },
    loginTime: {
      type: Date,
      required: true,
    },
    logoutTime: {
      type: Date,
    },
    hoursWorked: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Full Day", "Half Day", "Quarter Day", "In Progress", "Short Shift"],
      default: "In Progress",
    },
    salaryEarned: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index to ensure one attendance record per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
