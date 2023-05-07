import mongoose from 'mongoose';

// Define a schema
const Schema = mongoose.Schema;

const ShopSchema = new Schema(
  {
    name: String,
    domain: { type: String, unique: true },
    email: String,
    usage: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const Shop = mongoose.model('Shop', ShopSchema);

export default Shop;
