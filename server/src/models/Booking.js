import crypto from 'node:crypto';
import mongoose from 'mongoose';

// Unambiguous characters for booking references (no 0/O, 1/I).
const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateReference() {
  const bytes = crypto.randomBytes(6);
  return `PK-${Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join('')}`;
}

const bookingSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    space: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSpace', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    hours: { type: Number, required: true, min: 1 },
    // Price is copied at booking time so later price changes don't affect it.
    pricePerHour: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    vehicleNumber: { type: String, required: true, uppercase: true, trim: true },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
    cancelledAt: Date,
    // Start of every 30-minute slot this booking occupies. The unique index below makes
    // MongoDB reject overlapping confirmed bookings, even for simultaneous requests.
    slots: { type: [Date], required: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

bookingSchema.index(
  { space: 1, slots: 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' }, name: 'no_double_booking' },
);
bookingSchema.index({ space: 1, status: 1, startTime: 1, endTime: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
