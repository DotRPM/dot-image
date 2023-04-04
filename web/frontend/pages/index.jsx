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
import { useNavigate } from 'react-router-dom';
import GeneratorModal from '../components/generator/GeneratorModal';
import ChatBanner from '../components/banners/chatBanner';

export default function HomePage() {
  const fetch = useAuthenticatedFetch();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [nextPageParams, setNextPageParams] = useState(null);
  const [prevPageParams, setPrevPageParams] = useState(null);
  const [fetchingStatus, setFetchingStatus] = useState('loading');
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(products);
  const resourceName = {
    singular: 'product',
    plural: 'products'
  };
  const [openModal, setOpenModal] = useState(false);
  const [productsToGenerate, setProductsToGenerate] = useState([]);

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
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const promotedBulkActions = [
    {
      content: 'Bulk generate images',
      onAction: () => {
        setProductsToGenerate(
          products.filter((item) => selectedResources.includes(item.id))
        );
        setOpenModal(true);
      }
    }
  ];

  return (
    <Page title="Generate image for products">
      <Layout>
        <Layout.Section>
          <ChatBanner />
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
                    <TextStyle variation="strong">{product.title}</TextStyle>
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
                          onClick={() => {
                            setProductsToGenerate([product]);
                            setOpenModal(true);
                          }}
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

      <GeneratorModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
          setProductsToGenerate([]);
        }}
        products={productsToGenerate}
        setProducts={setProductsToGenerate}
        loadProducts={loadProducts}
      />
    </Page>
  );
}
