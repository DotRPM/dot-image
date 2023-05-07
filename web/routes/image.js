import express from 'express';
import axios from 'axios';
import 'dotenv/config';
import Shop from '../models/Shop.js';
import { listActivePayments } from './plans.js';

const router = express.Router();
const client = axios.create({
  headers: { Authorization: 'Bearer ' + process.env.OPEN_AI_API_KEY }
});

router.get('/:title', async (req, res) => {
  const session = res.locals.shopify.session;
  try {
    const shopData = await Shop.findOne({
      domain: session.shop
    });
    const plan = (await listActivePayments(session))[0];

    // free limit is 20
    if (shopData.usage < 20 || plan?.name == 'Pro plan') {
      const { data } = await client.post(
        'https://api.openai.com/v1/images/generations',
        {
          prompt: req.params.title,
          size: '256x256'
        }
      );
      shopData.usage = shopData.usage + 1;
      await shopData.save();
      res.status(200).json({ src: data.data[0].url });
    } else {
      res.status(500).json({ error: 1 });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 2 });
  }
});

export default router;
