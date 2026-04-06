import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./Models/user.model.js";
import Attendance from "./Models/attendance.model.js";
import dotenv from "dotenv";

dotenv.config();

const SEED_USERS = [
  { FirstName: "Nijam", LastName: "", UserName: "nijam", Email: "nijam@gmail.com", Password: "nijam123" },
  { FirstName: "Tarun", LastName: "", UserName: "tarun", Email: "tarun@gmail.com", Password: "tarun123" }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for seeding");
  } catch (error) {
    console.error("Error connecting to DB:", error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  await connectDB();

  console.log("Seeding started...");
  
  await User.deleteMany({
    $or: [
      { Email: { $in: [ ...SEED_USERS.map(u => u.Email), "nijam@example.com", "tarun@example.com", "alice@example.com", "bob@example.com" ] } },
      { UserName: { $in: SEED_USERS.map(u => u.UserName) } }
    ]
  });
  
  const createdUsers = [];
  for (const u of SEED_USERS) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(u.Password, salt);
    const newUser = new User({ ...u, Password: hashedPassword, role: 'user' });
    await newUser.save();
    createdUsers.push(newUser);
  }

  await Attendance.deleteMany({ userId: { $in: createdUsers.map(u => u._id) } });

  // Generate March 2026 data
  const marchYear = 2026;
  const marchMonth = 2; // JS Date index for March is 2

  let totalAttendances = [];

  createdUsers.forEach(user => {
    // March has 31 days
    for (let day = 1; day <= 31; day++) {
      const date = new Date(marchYear, marchMonth, day, 0, 0, 0, 0);
      
      // Skip Weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const rand = Math.random();
      let hoursWorked = 0;
      let status = "";
      let salaryEarned = 0;

      if (rand < 0.5) {
        hoursWorked = 8.5;
        status = "Full Day";
        salaryEarned = 1000;
      } else if (rand < 0.75) {
        hoursWorked = 5.2;
        status = "Half Day";
        salaryEarned = 500;
      } else if (rand < 0.9) {
        hoursWorked = 3.3; // between 2 and 4
        status = "Quarter Day";
        salaryEarned = 200;
      } else {
        hoursWorked = 1.5;
        status = "Short Shift";
        salaryEarned = 0;
      }

      const loginTime = new Date(marchYear, marchMonth, day, 9, 0, 0);
      const logoutTime = new Date(loginTime.getTime() + hoursWorked * 60 * 60 * 1000);

      totalAttendances.push({
        userId: user._id,
        date: date,
        loginTime: loginTime,
        logoutTime: logoutTime,
        hoursWorked: hoursWorked,
        status: status,
        salaryEarned: salaryEarned
      });
    }
  });

  await Attendance.insertMany(totalAttendances);

  console.log("Seeding complete! Added Alice and Bob with March 2026 attendance data.");
  process.exit();
};

seedDatabase();
