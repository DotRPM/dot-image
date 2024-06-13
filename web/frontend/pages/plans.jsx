import {
  Card,
  Page,
  Layout,
  Button,
  TextStyle,
  RangeSlider,
  Stack,
  ButtonGroup,
  Badge,
  Toast,
  Frame
} from '@shopify/polaris';
import { ChevronLeftMinor, ChevronRightMinor } from '@shopify/polaris-icons';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthenticatedFetch } from '../hooks';
import ChatBanner from '../components/banners/ChatBanner';
import { useAppBridge } from '@shopify/app-bridge-react';
import { Redirect } from '@shopify/app-bridge/actions';
import FreeLimitBanner from '../components/banners/FreeLimitBanner';

export default function PlansPage() {
  const fetch = useAuthenticatedFetch();
  const app = useAppBridge();
  const navigate = useNavigate();

  const [fetching, setFetching] = useState(false);
  const [searchParams, _setSearchParams] = useSearchParams();
  const [fetchingCredits, setFetchingCredits] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [current, setCurrent] = useState(0);
  const [credits, setCredits] = useState(100);
  const creditsRate = 6;

  useEffect(() => {
    getCredits();
    if (searchParams.get('charge_id')) {
      activateCredits(searchParams.get('charge_id'));
    }
  }, []);

  const activateCredits = async (chargeId) => {
    setFetchingCredits(true);
    setFetching(true);
    const res = await fetch(`/api/plans/activate/${chargeId}`, {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.credits) {
      setCurrent(data.credits);
      setShowToast(true);
    }
    setFetching(false);
    setFetchingCredits(false);
  };

  const getCredits = async () => {
    setFetchingCredits(true);
    const res = await fetch('/api/shop/credits');
    const data = await res.json();
    setCurrent(data.credits);
    setFetchingCredits(false);
  };

  const buyCredits = async () => {
    setFetching(true);
    const res = await fetch('/api/plans/buy', {
      method: 'post',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        count: credits
      })
    });
    const data = await res.json();
    setFetching(false);
    const redirect = Redirect.create(app);
    redirect.dispatch(Redirect.Action.REMOTE, data.url);
  };

  const toastMarkup = showToast && (
    <Toast onDismiss={() => setShowToast(false)} content="Credits added" />
  );

  return (
    <Frame>
      <Page
        title="Buy credits"
        primaryAction={{
          content: (
            <TextStyle>
              Credits <Badge status="attention">{current}</Badge>
            </TextStyle>
          ),
          onAction: () => navigate('/plans'),
          loading: fetchingCredits
        }}
        narrowWidth
        breadcrumbs={[{ content: 'Home', url: '/' }]}
      >
        {toastMarkup}
        <Layout>
          <Layout.Section>
            <ChatBanner />
          </Layout.Section>
          <Layout.Section>
            <FreeLimitBanner />
          </Layout.Section>
          <Layout.Section>
            <Card title="Credits">
              <Card.Section>
                <Stack distribution="equalSpacing" alignment="center">
                  <TextStyle variation="strong">{credits} Credits</TextStyle>
                  <ButtonGroup>
                    <Button
                      icon={ChevronLeftMinor}
                      size="slim"
                      onClick={() =>
                        setCredits((state) => {
                          if (state > 100) return state - 100;
                          else return state;
                        })
                      }
                    />
                    <Button
                      icon={ChevronRightMinor}
                      size="slim"
                      onClick={() =>
                        setCredits((state) => {
                          if (state < 2000) return state + 100;
                          else return state;
                        })
                      }
                    />
                  </ButtonGroup>
                </Stack>
                <RangeSlider
                  label="Credits"
                  labelHidden
                  step={100}
                  max={2000}
                  min={100}
                  value={credits}
                  onChange={(value) => setCredits(value)}
                />
              </Card.Section>
              <Card.Section>
                <Stack alignment="center" distribution="equalSpacing">
                  <p style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    <span
                      style={{
                        position: 'relative'
                      }}
                    >
                      <span
                        style={{
                          width: '100%',
                          height: '2px',
                          position: 'absolute',
                          background: 'red',
                          top: '50%',
                          left: 0,
                          transform: 'translateY(-50%)'
                        }}
                      ></span>
                      <span style={{ color: 'black' }}>$12</span>
                    </span>{' '}
                    ${creditsRate} / 100 credits
                  </p>
                  <Stack
                    alignment="center"
                    distribution="trailing"
                    spacing="loose"
                  >
                    <TextStyle variation="positive">
                      $ {(creditsRate * credits) / 100}
                    </TextStyle>
                    <Button primary loading={fetching} onClick={buyCredits}>
                      Buy
                    </Button>
                  </Stack>
                </Stack>
              </Card.Section>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    </Frame>
  );
}
