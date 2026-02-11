import mongoose, { Schema, Document, Model } from 'mongoose';

// TypeScript interface for the document
export interface IUser extends Document {
  user_id: string; // Postgres UUID
  email?: string;
  name?: string;
  phoneNumber?: string;
  encrypted_phone?: string;
  hashed_phone?: string;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema
const UserSchema = new Schema<IUser>(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    encrypted_phone: String,
    hashed_phone: String,
    timezone: String,
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Prevent model recompilation in development (Next.js hot reload)
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
