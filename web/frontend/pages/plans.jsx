import {
  Card,
  Page,
  Layout,
  List,
  Button,
  TextContainer,
  TextStyle
} from '@shopify/polaris';
import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '../hooks';
import ChatBanner from '../components/banners/ChatBanner';
import { useNavigate } from 'react-router-dom';
import { useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';
import FreeLimitBanner from '../components/banners/FreeLimitBanner';

export default function HomePage() {
  const fetch = useAuthenticatedFetch();
  const app = useAppBridge();

  const [fetching, setFetching] = useState(false);
  const [plan, setPlan] = useState({});

  useEffect(() => getPlan(), []);

  const getPlan = async () => {
    setFetching(true);
    const res = await fetch('/api/plans/');
    const data = await res.json();
    setPlan(data);
    setFetching(false);
  };

  const startProPlan = async () => {
    setFetching(true);
    const res = await fetch('/api/plans/start');
    const data = await res.json();
    setFetching(false);
    const redirect = Redirect.create(app);
    redirect.dispatch(Redirect.Action.REMOTE, data.url);
  };

  const startFreePlan = async () => {
    setFetching(true);
    await fetch('/api/plans/terminate');
    setFetching(false);
    await getPlan();
  };

  return (
    <Page title="Plans & pricing" breadcrumbs={[{ content: 'Home', url: '/' }]}>
      <Layout>
        <Layout.Section>
          <ChatBanner />
        </Layout.Section>
        <Layout.Section>
          <FreeLimitBanner />
        </Layout.Section>
        <Layout.Section oneHalf>
          <Card title="Free">
            <Card.Section>
              <span style={{ fontSize: '30px' }}>
                <TextStyle variation="strong">$ 0 /</TextStyle>{' '}
              </span>
              <TextStyle variation="strong">month</TextStyle>
            </Card.Section>
            <Card.Section>
              <List type="bullet">
                <List.Item>20 image generation</List.Item>
                <List.Item>Support in less than 5 hours</List.Item>
                <List.Item>Bulk image generation</List.Item>
              </List>
            </Card.Section>
            <Card.Section>
              {!plan.name ? (
                <Button disabled>You are using this plan</Button>
              ) : (
                <Button onClick={startFreePlan} loading={fetching}>
                  Use this plan
                </Button>
              )}
            </Card.Section>
          </Card>
        </Layout.Section>

        <Layout.Section oneHalf>
          <Card title="Pro">
            <Card.Section>
              <span style={{ fontSize: '30px' }}>
                <TextStyle variation="strong">$ 12 /</TextStyle>{' '}
              </span>
              <TextStyle variation="strong">month</TextStyle>
            </Card.Section>
            <Card.Section>
              <List type="bullet">
                <List.Item>Unlimited image generation</List.Item>
                <List.Item>Quick support</List.Item>
                <List.Item>Custom features</List.Item>
              </List>
            </Card.Section>
            <Card.Section>
              {plan?.name == 'Pro plan' ? (
                <Button disabled>You are using this plan</Button>
              ) : (
                <Button onClick={startProPlan} loading={fetching}>
                  Use this plan
                </Button>
              )}
            </Card.Section>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
