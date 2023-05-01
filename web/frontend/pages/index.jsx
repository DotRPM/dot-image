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
import GeneratorModal from '../components/generator/GeneratorModal';
import ChatBanner from '../components/banners/ChatBanner';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';

export default function HomePage() {
  const fetch = useAuthenticatedFetch();
  const [{ run, steps, stepIndex }, setJoyride] = useState({
    run: false,
    steps: [
      {
        target: 'body',
        content:
          'Welcome to imagenie! Product image generator using Artificial Intelligence.',
        disableBeacon: true,
        placement: 'center',
        hideCloseButton: true,
        hideBackButton: true
      },
      {
        target:
          '#app > div > div.Polaris-Page > div:nth-child(2) > div > div:nth-child(2) > div > div.Polaris-IndexTable > div.Polaris-IndexTable-ScrollContainer > table > tbody > tr:nth-child(1) > td:nth-child(6) > div > div > span > button',
        content: 'Generate your first image by clicking this button.',
        hideCloseButton: true,
        hideBackButton: true
      },
      {
        target:
          '#PolarisPortalsContainer > div:nth-child(1) > div:nth-child(1) > div > div > div > div > div.Polaris-Modal__BodyWrapper > div > section > div > div:nth-child(2) > div > div:nth-child(1) > span > button',
        content: 'You can regenerate the image if you have to.',
        hideCloseButton: true,
        hideBackButton: true
      },
      {
        target:
          '#PolarisPortalsContainer > div:nth-child(1) > div:nth-child(1) > div > div > div > div > div.Polaris-Modal-Footer > div > div > div:nth-child(2) > div > div:nth-child(2) > button',
        content: 'Click save once you have finished generating images.',
        hideCloseButton: true,
        hideBackButton: true
      }
    ],
    stepIndex: 0
  });

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
  const [childsFetching, setChildsFetching] = useState(0);

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

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (openModal && stepIndex == 1)
      setJoyride((state) => {
        return { ...state, stepIndex: stepIndex + 1 };
      });
  }, [openModal]);

  useEffect(() => {
    if (openModal && stepIndex == 2 && childsFetching == 0)
      setJoyride((state) => {
        return { ...state, run: true };
      });
  }, [childsFetching]);

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

  const handleJoyrideCallback = (data) => {
    const { action, index, status, type } = data;

    if (index == 2 || index == 3) {
      setTimeout(() => {
        document.querySelector(
          '#react-joyride-portal > div'
        ).style.zIndex = 700;
        document.querySelector('.__floater.__floater__open').style.zIndex = 800;
      }, 400);
    }

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      if (index == 1) {
        setJoyride((state) => {
          return { ...state, run: false };
        });
      } else {
        // Update state to advance the tour
        setJoyride((state) => {
          return {
            ...state,
            stepIndex: index + (action === ACTIONS.PREV ? -1 : 1)
          };
        });
      }
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Need to set our running state to false, so we can restart if we click start again.
      setJoyride((state) => {
        return { ...state, run: false };
      });
      try {
        localStorage.setItem('onboarding-completed', 1);
      } catch (error) {
        console.log('Third party cookies not supported');
      }
    }

    console.groupCollapsed(type);
    console.log(data); //eslint-disable-line no-console
    console.groupEnd();
  };

  return (
    <Page title="Generate image for products">
      <Joyride
        steps={steps}
        stepIndex={stepIndex}
        continuous
        run={run}
        callback={handleJoyrideCallback}
      />
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
        childsFetching={childsFetching}
        setChildsFetching={setChildsFetching}
      />
    </Page>
  );
}
