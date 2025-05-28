// models/bag.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

const bagSchema = new Schema({
  charcode: { type: String, unique: true, index: true },
  status: { type: String, default: "unassigned", index: true },
  _order: { type: Schema.ObjectId, ref: 'Order', index: true },
  _product: { type: Schema.ObjectId, ref: 'Product', index: true },
  delivery_date: Date,
  pickup_date: Date,
  application_date: Date,
  batch_id: { type: String, default: "n/a", index: true },
  bagging_date: Date,
  locations: {
    bagging: { lat: Number, long: Number, time: Date },
    storage_pickup: { lat: Number, long: Number, time: Date, _order_to_storage: { type: Schema.ObjectId, ref: 'Order' } },
    storage_delivery: { lat: Number, long: Number, time: Date, signature: String },
    pickup: { lat: Number, long: Number, time: Date },
    delivery: { lat: Number, long: Number, time: Date },
    application: { lat: Number, long: Number, time: Date }
  },
  signature: String,
  _site: { type: Schema.ObjectId, ref: 'Site', index: true },
  weight: Number,
  moisture_content: String,
  internal_temperature: String,
  is_deleted: { type: Boolean, default: false, index: true },
  created_at: { type: Date, default: Date.now, index: true }
});

bagSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.charcode = `CHA-${(count + 1).toString().padStart(6, '0')}`;
  }
  next();
});

const Bag = mongoose.model("Bag", bagSchema);
module.exports = Bag;