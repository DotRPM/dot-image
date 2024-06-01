import {
  Card,
  Page,
  Layout,
  Spinner,
  Stack,
  TextStyle,
  Button,
  Icon,
  Badge
} from '@shopify/polaris';
import { StatusActiveMajor } from '@shopify/polaris-icons';
import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '../hooks';
import ChatBanner from '../components/banners/ChatBanner';
import { useLocation, useNavigate } from 'react-router-dom';
import FreeLimitBanner from '../components/banners/FreeLimitBanner';
import GeneratorProduct from '../components/generator/GeneratorProduct';

export default function HomePage() {
  const fetch = useAuthenticatedFetch();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [savingStatus, setSavingStatus] = useState('idle');
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [childsFetching, setChildsFetching] = useState(0);
  const [regenerateTrigger, setRegenerateTrigger] = useState(1);
  const [fetchingCredits, setFetchingCredits] = useState(false);
  const [credits, setCredits] = useState(0);

  // product ids
  const search = useLocation().search;
  const ids = new URLSearchParams(search).getAll('ids[]');

  const loadProducts = async () => {
    console.log(ids);
    setLoadingProducts(true);
    const response = await fetch(`/api/products/some?ids=${ids.join(',')}`);
    const data = await response.json();
    setProducts(data.products);
    setLoadingProducts(false);
  };

  useEffect(() => {
    loadProducts();
    getCredits();
  }, []);

  const handleSave = async () => {
    setSavingStatus('saving');
    var productsToUpdate = products
      .filter((item) => item.updateImage != null)
      .map((item) => {
        return { id: item.id, image: item.updateImage };
      });

    await fetch(`/api/products`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: productsToUpdate
      })
    });
    setSavingStatus('done');
  };

  const handleRegenerate = () => setRegenerateTrigger((state) => ++state);

  const handleImageChange = (id, src) => {
    const index = products.findIndex((item) => item.id == id);
    setProducts((state) => {
      state[index].updateImage = src;
      return state;
    });
  };

  const handleDelete = (id) => {
    setProducts(products.filter((item) => item.id != id));
  };

  const getCredits = async () => {
    setFetchingCredits(true);
    const res = await fetch('/api/shop/credits');
    const data = await res.json();
    setCredits(data.credits);
    setFetchingCredits(false);
  };

  return (
    <Page
      title="Generate images"
      breadcrumbs={[{ content: 'Home', url: '/' }]}
      narrowWidth
      primaryAction={{
        content: (
          <TextStyle>
            Credits <Badge status="attention">{credits}</Badge>
          </TextStyle>
        ),
        onAction: () => navigate('/plans'),
        loading: fetchingCredits
      }}
    >
      <Layout>
        <Layout.Section>
          <ChatBanner />
        </Layout.Section>
        <Layout.Section>
          <FreeLimitBanner />
        </Layout.Section>
        <Layout.Section>
          <Card>
            {loadingProducts && (
              <Card.Section>
                <Stack alignment="center">
                  <Spinner />
                  <TextStyle variation="subdued">Loading products...</TextStyle>
                </Stack>
              </Card.Section>
            )}
            {!loadingProducts &&
              products.map((product, index) => (
                <GeneratorProduct
                  key={index}
                  product={product}
                  disableDeletion={products.length == 1}
                  changeImage={handleImageChange}
                  trigger={regenerateTrigger}
                  deleteProduct={handleDelete}
                  setFetching={setChildsFetching}
                />
              ))}
          </Card>
          <Card sectioned>
            <Stack alignment="center" distribution="equalSpacing">
              <Stack.Item>
                {savingStatus == 'saving' && (
                  <Stack alignment="center">
                    <div>
                      <Spinner size="small" />
                    </div>
                    <TextStyle>Saving product images...</TextStyle>
                  </Stack>
                )}

                {savingStatus == 'done' && (
                  <Stack alignment="center">
                    <Icon source={StatusActiveMajor} color="success" />
                    <TextStyle variation="positive">
                      Product images saved!
                    </TextStyle>
                  </Stack>
                )}
              </Stack.Item>

              <Stack.Item>
                <Stack alignment="center" spacing="tight">
                  <Button
                    onClick={handleRegenerate}
                    disabled={savingStatus != 'idle' || childsFetching > 0}
                  >
                    Regenerate All
                  </Button>
                  <Button
                    primary
                    onClick={handleSave}
                    disabled={savingStatus != 'idle' || childsFetching > 0}
                  >
                    Save
                  </Button>
                </Stack>
              </Stack.Item>
            </Stack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
