import express from 'express';
import shopify from '../shopify.js';
import 'dotenv/config';
import Shop from '../models/Shop.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const session = res.locals.shopify.session;
  try {
    const shopData = await Shop.findOne({
      domain: session.shop
    });
    const plan = (await listActivePayments(session))[0];
    res.status(200).json(plan ? plan : { usage: shopData.usage });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get('/start', async (req, res) => {
  const session = res.locals.shopify.session;
  try {
    const url = await requestPayment(session, {
      chargeName: 'Pro plan',
      amount: 6,
      currencyCode: 'USD',
      interval: 'EVERY_30_DAYS'
    });
    res.status(200).json({ url });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.get('/terminate', async (req, res) => {
  const session = res.locals.shopify.session;
  try {
    const plan = (await listActivePayments(session))[0];
    await shopify.api.rest.RecurringApplicationCharge.delete({
      session,
      id: plan.id.replace('gid://shopify/AppSubscription/', '')
    });
    res.status(200).json({ success: 1 });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

let isProd = process.env.NODE_ENV === 'production';

export async function listActivePayments(session) {
  const client = new shopify.api.clients.Graphql({ session });
  const currentInstallations = await client.query({
    data: RECURRING_PURCHASES_QUERY
  });
  const subscriptions =
    currentInstallations.body.data.currentAppInstallation.activeSubscriptions;

  return subscriptions;
}

export async function requestPayment(
  session,
  { chargeName, amount, currencyCode, interval }
) {
  const client = new shopify.api.clients.Graphql({ session });
  const returnUrl = `${process.env.HOST}?shop=${
    session.shop
  }&host=${Buffer.from(
    `admin.shopify.com/store/${session.shop.replace('.myshopify.com', '')}`
  ).toString('base64')}`;

  const mutationResponse = await requestRecurringPayment(client, returnUrl, {
    chargeName,
    amount,
    currencyCode,
    interval
  });
  const data = mutationResponse.body.data.appSubscriptionCreate;

  if (data.userErrors.length) {
    throw new ShopifyBillingError(
      'Error while billing the store',
      data.userErrors
    );
  }

  return data.confirmationUrl;
}

async function requestRecurringPayment(
  client,
  returnUrl,
  { chargeName, amount, currencyCode, interval }
) {
  const mutationResponse = await client.query({
    data: {
      query: RECURRING_PURCHASE_MUTATION,
      variables: {
        name: chargeName,
        lineItems: [
          {
            plan: {
              appRecurringPricingDetails: {
                interval,
                price: { amount, currencyCode }
              }
            }
          }
        ],
        returnUrl,
        test: !isProd
      }
    }
  });

  if (mutationResponse.body.errors && mutationResponse.body.errors.length) {
    throw new ShopifyBillingError(
      'Error while billing the store',
      mutationResponse.body.errors
    );
  }

  return mutationResponse;
}

const RECURRING_PURCHASES_QUERY = `
  query appSubscription {
    currentAppInstallation {
      activeSubscriptions {
        status
        id
        name
        createdAt
        currentPeriodEnd
        test
        trialDays
        lineItems {
          id
          plan {
            pricingDetails {
              __typename
              ... on AppRecurringPricing{
                price {
                  amount
                  currencyCode
                }
                interval
              }
            }
          }
        }
      }
    }
  }
`;

const RECURRING_PURCHASE_MUTATION = `
  mutation test(
    $name: String!
    $lineItems: [AppSubscriptionLineItemInput!]!
    $returnUrl: URL!
    $test: Boolean
  ) {
    appSubscriptionCreate(
      name: $name
      lineItems: $lineItems
      returnUrl: $returnUrl
      test: $test
    ) {
      confirmationUrl
      userErrors {
        field
        message
      }
    }
  }
`;

export default router;
