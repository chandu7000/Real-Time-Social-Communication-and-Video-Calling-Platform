import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254, index: true },
  password: { type: String, required: true, minlength: 6, maxlength: 128, select: false },
  bio: { type: String, default: "", trim: true, maxlength: 300 },
  profilePic: { type: String, default: "", trim: true, maxlength: 500 },
  nativeLanguage: { type: String, default: "", trim: true, maxlength: 60 },
  learningLanguage: { type: String, default: "", trim: true, maxlength: 60 },
  location: { type: String, default: "", trim: true, maxlength: 120 },
  isOnboarded: { type: Boolean, default: false },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true, toJSON: { transform: (_doc, ret) => { delete ret.password; delete ret.__v; return ret; } } });

userSchema.pre("save", async function (next) { if (!this.isModified("password")) return next(); try { const salt = await bcrypt.genSalt(10); this.password = await bcrypt.hash(this.password, salt); next(); } catch (error) { next(error); } });
userSchema.methods.matchPassword = async function (enteredPassword) { return bcrypt.compare(enteredPassword, this.password); };
const User = mongoose.model("User", userSchema);
export default User;
