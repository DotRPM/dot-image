import { Icon, Modal, Spinner, Stack, TextStyle } from '@shopify/polaris';
import GeneratorProduct from './GeneratorProduct';
import { useState } from 'react';
import { useAuthenticatedFetch } from '../../hooks';
import { StatusActiveMajor } from '@shopify/polaris-icons';

export default function GeneratorModal({
  open,
  onClose,
  products,
  setProducts,
  loadProducts,
  childsFetching,
  setChildsFetching
}) {
  const fetch = useAuthenticatedFetch();
  const [regenerateTrigger, setRegenerateTrigger] = useState(1);
  const [savingStatus, setSavingStatus] = useState('idle');

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
    loadProducts();
    setSavingStatus('done');
  };
  const handleRegenerate = () => setRegenerateTrigger((state) => ++state);
  const handleDelete = (id) => {
    setProducts(products.filter((item) => item.id != id));
  };
  const handleImageChange = (id, src) => {
    const index = products.findIndex((item) => item.id == id);
    setProducts((state) => {
      state[index].updateImage = src;
      return state;
    });
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        setSavingStatus('idle');
      }}
      title="Generating images for selected products"
      primaryAction={{
        content: 'Save',
        onAction: handleSave,
        disabled: savingStatus != 'idle' || childsFetching > 0
      }}
      secondaryActions={[
        {
          content: 'Regenerate all',
          onAction: handleRegenerate,
          disabled: savingStatus != 'idle' || childsFetching > 0
        }
      ]}
    >
      {savingStatus == 'saving' && (
        <Modal.Section>
          <Stack alignment="center">
            <div>
              <Spinner size="small" />
            </div>
            <TextStyle>Saving product images...</TextStyle>
          </Stack>
        </Modal.Section>
      )}

      {savingStatus == 'done' && (
        <Modal.Section>
          <Stack alignment="center">
            <Icon source={StatusActiveMajor} color="success" />
            <TextStyle variation="positive">Product images saved!</TextStyle>
          </Stack>
        </Modal.Section>
      )}

      {savingStatus == 'idle' &&
        products.map((product) => (
          <Modal.Section key={product.id}>
            <GeneratorProduct
              product={product}
              trigger={regenerateTrigger}
              deleteProduct={handleDelete}
              changeImage={handleImageChange}
              setFetching={setChildsFetching}
            />
          </Modal.Section>
        ))}
    </Modal>
  );
}
