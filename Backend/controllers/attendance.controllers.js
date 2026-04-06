import Attendance from "../Models/attendance.model.js";
import User from "../Models/user.model.js";

// Punch In: Starts the working day
export const punchIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({ userId, date: today });
    if (existingAttendance) {
      return res.status(400).json({ message: "Already punched in today." });
    }

    const newAttendance = new Attendance({
      userId,
      date: today,
      loginTime: new Date(),
    });

    await newAttendance.save();
    res.status(201).json({ message: "Punched in successfully", attendance: newAttendance });
  } catch (error) {
    console.error("Error in punchIn:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Punch Out: Ends the working day and calculates hours & salary
export const punchOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ userId, date: today });
    if (!attendance) {
      return res.status(400).json({ message: "Please punch in first." });
    }
    if (attendance.logoutTime) {
      return res.status(400).json({ message: "Already punched out today." });
    }

    const logoutTime = new Date();
    attendance.logoutTime = logoutTime;

    // Calculate hours worked
    const diffMs = logoutTime - new Date(attendance.loginTime);
    const hoursWorked = diffMs / (1000 * 60 * 60);
    attendance.hoursWorked = parseFloat(hoursWorked.toFixed(2));

    // Determine status and salary
    if (attendance.hoursWorked >= 8) {
      attendance.status = "Full Day";
      attendance.salaryEarned = 1000;
    } else if (attendance.hoursWorked >= 4) {
      attendance.status = "Half Day";
      attendance.salaryEarned = 500;
    } else if (attendance.hoursWorked >= 2) {
      attendance.status = "Quarter Day";
      attendance.salaryEarned = 200;
    } else {
      attendance.status = "Short Shift";
      attendance.salaryEarned = 0;
    }

    await attendance.save();
    res.status(200).json({ message: "Punched out successfully", attendance });
  } catch (error) {
    console.error("Error in punchOut:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get today's attendance status
export const getTodayStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date().setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ userId, date: today });
    res.status(200).json({ attendance });
  } catch (error) {
    console.error("Error in getTodayStatus:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get monthly summary for the logged in user
export const getUserSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all records, sorted by date descending
    const history = await Attendance.find({ userId }).sort({ date: -1 });

    let totalHours = 0;
    let fullDays = 0;
    let halfDays = 0;
    let expectedSalary = 0;

    history.forEach(record => {
      totalHours += record.hoursWorked || 0;
      if (record.status === "Full Day") {
        fullDays++;
      } else if (record.status === "Half Day") {
        halfDays++;
      }
      expectedSalary += record.salaryEarned || 0;
    });

    res.status(200).json({
      history,
      summary: {
        totalHours: totalHours.toFixed(2),
        fullDays,
        halfDays,
        expectedSalary
      }
    });

  } catch (error) {
    console.error("Error in getUserSummary:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin: Get all users' summary for current month (or all time)
export const getAllUsersData = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    // Fetch all users
    const users = await User.find({ role: 'user' }).select("-Password");
    
    // Fetch all attendances (so we can see past months for showcase)
    const attendances = await Attendance.find();

    const summaryData = users.map(user => {
      const userRecords = attendances.filter(a => a.userId.toString() === user._id.toString());
      
      let fullDays = 0;
      let halfDays = 0;
      let totalSalary = 0;
      let totalHours = 0;

      userRecords.forEach(record => {
        if (record.status === "Full Day") fullDays++;
        else if (record.status === "Half Day") halfDays++;
        totalSalary += record.salaryEarned || 0;
        totalHours += record.hoursWorked || 0;
      });

      return {
        user: {
          _id: user._id,
          firstName: user.FirstName,
          lastName: user.LastName,
          email: user.Email
        },
        stats: {
          fullDays,
          halfDays,
          totalSalary,
          totalHours: totalHours.toFixed(2)
        },
        history: userRecords
      };
    });

    res.status(200).json(summaryData);
  } catch (error) {
    console.error("Error in getAllUsersData:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
