import 'dotenv/config';
import express from 'express';
import Shop from '../models/Shop.js';

const router = express.Router();

router.get('/credits', async (req, res) => {
  const session = res.locals.shopify.session;
  try {
    const shopData = await Shop.findOne({
      domain: session.shop
    });
    res.status(200).json({ credits: shopData.credits });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 2 });
  }
});

export default router;
