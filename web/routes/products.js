import express from 'express';
import shopify from '../shopify.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    let query = req.query;
    if (!query.limit) {
      query = { ...query, limit: 15 };
    }
    const products = await shopify.api.rest.Product.all({
      session: res.locals.shopify.session,
      ...query
    });
    res.status(200).json({
      products,
      nextPageInfo: shopify.api.rest.Product.NEXT_PAGE_INFO?.query,
      prevPageInfo: shopify.api.rest.Product.PREV_PAGE_INFO?.query
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get('/some', async (req, res) => {
  try {
    let query = req.query;
    console.log(query);
    const products = await shopify.api.rest.Product.all({
      session: res.locals.shopify.session,
      ...query
    });
    res.status(200).json({
      products
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.post('/', async (req, res) => {
  try {
    for (const product of req.body.products) {
      const image = new shopify.api.rest.Image({
        session: res.locals.shopify.session
      });
      image.product_id = product.id;
      image.position = 1;
      image.src = product.image;
      await image.save({
        update: true
      });
    }

    res.status(200).json({
      message: 'done'
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

export default router;
