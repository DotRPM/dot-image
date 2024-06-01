// @ts-check
import { join } from 'path';
import { readFileSync } from 'fs';
import express from 'express';
import serveStatic from 'serve-static';
import 'dotenv/config';

import shopify from './shopify.js';
import GDPRWebhookHandlers from './gdpr.js';

import {
  imageRouter,
  plansRouter,
  productsRouter,
  shopRouter
} from './routes/index.js';
import connectDb from './mongodb.js';
import Shop from './models/Shop.js';

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

const STATIC_PATH =
  process.env.NODE_ENV === 'production'
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

connectDb();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  // storing store data on installation
  async (req, res, next) => {
    const shop = (
      await shopify.api.rest.Shop.all({
        session: res.locals.shopify.session
      })
    )[0];
    await Shop.findOneAndUpdate(
      { domain: shop.myshopify_domain },
      {
        name: shop.name,
        domain: shop.myshopify_domain,
        email: shop.email
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    next();
  },
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use('/api/*', shopify.validateAuthenticatedSession());

app.use(express.json());

app.use('/api/products', productsRouter);
app.use('/api/image', imageRouter);
app.use('/api/plans', plansRouter);
app.use('/api/shop', shopRouter);

app.use(serveStatic(STATIC_PATH, { index: false }));

app.use('/*', shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set('Content-Type', 'text/html')
    .send(readFileSync(join(STATIC_PATH, 'index.html')));
});

app.listen(PORT);
