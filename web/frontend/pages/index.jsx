import {
  Card,
  Page,
  Stack,
  TextStyle,
  IndexTable,
  useIndexResourceState,
  Thumbnail,
  Badge,
  Pagination,
  Button,
  Tooltip,
  Layout
} from '@shopify/polaris';
import { AddImageMajor } from '@shopify/polaris-icons';
import { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '../hooks';
import ChatBanner from '../components/banners/ChatBanner';
import { useNavigate } from 'react-router-dom';
import FreeLimitBanner from '../components/banners/FreeLimitBanner';

export default function HomePage() {
  const fetch = useAuthenticatedFetch();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [nextPageParams, setNextPageParams] = useState(null);
  const [prevPageParams, setPrevPageParams] = useState(null);
  const [fetchingStatus, setFetchingStatus] = useState('loading');
  const [credits, setCredits] = useState(0);
  const [fetchingCredits, setFetchingCredits] = useState(false);
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(products);
  const resourceName = {
    singular: 'product',
    plural: 'products'
  };

  const loadProducts = async (query = {}) => {
    setFetchingStatus('loading');
    const response = await fetch(
      `/api/products?${new URLSearchParams(query).toString()}`
    );
    const data = await response.json();
    setProducts(data.products);
    setNextPageParams(data.nextPageInfo);
    setPrevPageParams(data.prevPageInfo);
    setFetchingStatus('loaded');
    try {
      if (!localStorage.getItem('onboarding-completed')) {
        setJoyride((state) => {
          return { ...state, run: true };
        });
      }
    } catch (error) {
      console.log('Third party cookies not supported!');
    }
  };

  const getCredits = async () => {
    setFetchingCredits(true);
    const res = await fetch('/api/shop/credits');
    const data = await res.json();
    setCredits(data.credits);
    setFetchingCredits(false);
  };

  useEffect(() => {
    loadProducts();
    getCredits();
  }, []);

  const promotedBulkActions = [
    {
      content: 'Bulk generate images',
      onAction: () => {
        navigate(
          `/generate?${selectedResources.map((i) => `ids[]=${i}`).join('&')}`
        );
      }
    }
  ];

  return (
    <Page
      title="Generate image for products"
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
            <IndexTable
              loading={fetchingStatus == 'loading'}
              resourceName={resourceName}
              itemCount={products.length}
              selectedItemsCount={
                allResourcesSelected ? 'All' : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: 'Image' },
                { title: 'Product' },
                { title: 'Status' },
                { title: 'Vendor' },
                { title: 'Actions' }
              ]}
              promotedBulkActions={promotedBulkActions}
            >
              {products.map((product, index) => (
                <IndexTable.Row
                  id={product.id}
                  key={product.id}
                  selected={selectedResources.includes(product.id)}
                  position={index}
                  onClick={() => {}}
                >
                  <IndexTable.Cell>
                    <Thumbnail
                      source={
                        product.image?.src || 'https://placehold.co/400?text=?'
                      }
                      size="small"
                    />
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <TextStyle variation="strong">
                      {product.title.length < 30
                        ? product.title
                        : product.title.slice(0, 30) + '...'}
                    </TextStyle>
                  </IndexTable.Cell>
                  <IndexTable.Cell>
                    <Badge status="success">{product.status}</Badge>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{product.vendor}</IndexTable.Cell>
                  <IndexTable.Cell>
                    <Stack>
                      <Tooltip content="Generate image">
                        <Button
                          size="slim"
                          icon={AddImageMajor}
                          onClick={() =>
                            navigate(`/generate?ids[]=${product.id}`)
                          }
                        ></Button>
                      </Tooltip>
                    </Stack>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
            <Card.Section>
              <Stack distribution="center" alignment="center">
                <Pagination
                  hasNext={nextPageParams}
                  hasPrevious={prevPageParams}
                  onNext={() => loadProducts({ ...nextPageParams })}
                  onPrevious={() => loadProducts({ ...prevPageParams })}
                />
              </Stack>
            </Card.Section>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
