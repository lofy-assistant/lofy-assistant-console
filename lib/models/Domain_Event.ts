import mongoose, { Schema, Document, Model } from 'mongoose';

// TypeScript interface for event metadata
export interface IEventMetadata {
  correlation_id: string;
  causation_id?: string | null;
  source: string;
  user_message?: string;
}

// TypeScript interface for the document
export interface IDomainEvent extends Document {
  event_id: string; // UUID
  event_type: string;
  user_id: string; // UUID
  data: Record<string, unknown>;
  event_metadata: IEventMetadata;
  created_at: Date;
}

// Define the event metadata schema
const EventMetadataSchema = new Schema<IEventMetadata>(
  {
    correlation_id: {
      type: String,
      required: true,
    },
    causation_id: {
      type: String,
      default: null,
    },
    source: {
      type: String,
      required: true,
    },
    user_message: {
      type: String,
    },
  },
  { _id: false } // Prevent _id for subdocument
);

// Define the main schema
const DomainEventSchema = new Schema<IDomainEvent>(
  {
    event_id: {
      type: String,
      required: [true, 'Event ID is required'],
      unique: true,
      index: true,
    },
    event_type: {
      type: String,
      required: [true, 'Event type is required'],
      index: true,
    },
    user_id: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    event_metadata: {
      type: EventMetadataSchema,
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'domain_events',
  }
);

// Add compound indexes for common queries
DomainEventSchema.index({ event_type: 1, created_at: -1 });
DomainEventSchema.index({ user_id: 1, created_at: -1 });
DomainEventSchema.index({ 'event_metadata.correlation_id': 1 });

// Prevent model recompilation in development (Next.js hot reload)
const DomainEvent: Model<IDomainEvent> =
  mongoose.models.DomainEvent || mongoose.model<IDomainEvent>('DomainEvent', DomainEventSchema);

export default DomainEvent;
