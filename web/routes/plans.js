import express from 'express';
import shopify from '../shopify.js';
import 'dotenv/config';
import Shop from '../models/Shop.js';

const router = express.Router();

// for 100 credits
const CREDIT_RATE = 6;

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

router.post('/buy', async (req, res) => {
  const session = res.locals.shopify.session;
  try {
    const client = new shopify.api.clients.Graphql({ session });
    const returnUrl = (await getApplicationUrl(client)) + '/plans';

    const response = await requestOnetimePayment(client, returnUrl, {
      chargeName: req.body.count + ' Credits',
      amount: (req.body.count / 100) * CREDIT_RATE,
      currencyCode: 'USD'
    });
    const data = response.body.data.appPurchaseOneTimeCreate;

    res.status(200).json({ url: data.confirmationUrl });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.post('/activate/:chargeId', async (req, res) => {
  const session = res.locals.shopify.session;
  try {
    const data = await shopify.api.rest.ApplicationCharge.find({
      session,
      id: req.params.chargeId
    });
    const credits = (Number(data.price) / CREDIT_RATE) * 100;
    const shop = await Shop.findOne({
      domain: session.shop
    });
    if (!shop.chargeIds.includes(req.params.chargeId) && credits) {
      shop.credits += credits;
      shop.chargeIds.push(req.params.chargeId);
    }
    await shop.save();
    res.status(200).json({ credits: shop.credits });
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

async function requestOnetimePayment(
  client,
  returnUrl,
  { chargeName, amount, currencyCode }
) {
  const mutationResponse = await client.query({
    data: {
      query: ONETIME_PURCHASE_MUTATION,
      variables: {
        name: chargeName,
        price: {
          amount,
          currencyCode
        },
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

async function getApplicationUrl(client) {
  const response = await client.query({
    data: {
      query: LAUNCH_URL_QUERY
    }
  });
  const {
    data: {
      currentAppInstallation: { launchUrl }
    }
  } = response.body;
  return launchUrl;
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

const ONETIME_PURCHASE_MUTATION = `
  mutation AppPurchaseOneTimeCreate($name: String!, $price: MoneyInput!, $returnUrl: URL!, $test: Boolean) {
    appPurchaseOneTimeCreate(name: $name, returnUrl: $returnUrl, price: $price, test: $test) {
      userErrors {
        field
        message
      }
      appPurchaseOneTime {
        createdAt
        id
      }
      confirmationUrl
    }
  }
`;

const LAUNCH_URL_QUERY = `
  query {
    currentAppInstallation {
      launchUrl
    }
  }
`;

export default router;
