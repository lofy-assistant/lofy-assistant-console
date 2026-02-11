import mongoose, { Schema, Document, Model } from 'mongoose';

// TypeScript interface for the document
export interface IMessage extends Document {
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  type: string;
  media_url?: string | null;
  metadata?: Record<string, unknown>;
  created_at: Date;
}

// Define the schema
const MessageSchema = new Schema<IMessage>(
  {
    user_id: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: ['user', 'assistant'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
    },
    media_url: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'messages',
  }
);

// Add indexes for better query performance
MessageSchema.index({ user_id: 1, created_at: -1 });
MessageSchema.index({ role: 1 });

// Prevent model recompilation in development (Next.js hot reload)
const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
