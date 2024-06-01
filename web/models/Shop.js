import mongoose from 'mongoose';

// Define a schema
const Schema = mongoose.Schema;

const ShopSchema = new Schema(
  {
    name: String,
    domain: { type: String, unique: true },
    email: String,
    credits: { type: Number, default: 20 },
    chargeIds: [
      {
        type: String
      }
    ]
  },
  { timestamps: true }
);

const Shop = mongoose.model('Shop', ShopSchema);

export default Shop;
