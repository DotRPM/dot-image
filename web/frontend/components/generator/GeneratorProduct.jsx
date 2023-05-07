import {
  Button,
  Icon,
  Spinner,
  Stack,
  TextStyle,
  Thumbnail,
  Tooltip
} from '@shopify/polaris';
import {
  TickMinor,
  DeleteMinor,
  RefreshMinor,
  AlertMinor
} from '@shopify/polaris-icons';
import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from '../../hooks';

export default function GeneratorProduct({
  product,
  trigger,
  deleteProduct,
  changeImage,
  setFetching
}) {
  const fetch = useAuthenticatedFetch();

  const [generatingStatus, setGeneratingStatus] = useState(false);
  const [image, setImage] = useState(product.image?.src);

  const generateImage = async () => {
    setFetching((state) => ++state);
    setGeneratingStatus('generating');
    const response = await fetch(`/api/image/${product.title}`);
    const data = await response.json();
    if (data.error) {
      switch (data.error) {
        case 1:
          setGeneratingStatus('expired');
          break;
        default:
          setGeneratingStatus('error');
          break;
      }
      setFetching((state) => --state);
    } else {
      setImage(data.src);
      changeImage(product.id, data.src);
      setGeneratingStatus('generated');
      setFetching((state) => --state);
    }
  };

  useEffect(() => {
    generateImage();
  }, [trigger]);

  return (
    <Stack alignment="center" distribution="equalSpacing">
      <Stack.Item>
        <Stack alignment="center">
          <Thumbnail source={image} />
          <div>
            <TextStyle variation="strong">{product.title}</TextStyle>
            {generatingStatus == 'generating' && (
              <Stack alignment="center" spacing="extraTight">
                <Spinner size="small" />
                <TextStyle variation="warning">
                  Generating new image...
                </TextStyle>
              </Stack>
            )}
            {generatingStatus == 'generated' && (
              <Stack alignment="center" spacing="extraTight">
                <Icon source={TickMinor} color="success" />
                <TextStyle variation="positive">New image generated.</TextStyle>
              </Stack>
            )}
            {generatingStatus == 'expired' && (
              <Stack alignment="center" spacing="extraTight">
                <Icon source={AlertMinor} color="warning" />
                <TextStyle variation="warning">
                  Reached free limit of 20 image generation.
                </TextStyle>
              </Stack>
            )}
            {generatingStatus == 'error' && (
              <Stack alignment="center" spacing="extraTight">
                <Icon source={AlertMinor} color="critical" />
                <TextStyle variation="negative">
                  Something went wrong.
                </TextStyle>
              </Stack>
            )}
          </div>
        </Stack>
      </Stack.Item>
      <Stack.Item>
        <Stack alignment="center">
          <Tooltip content="Regenerate image">
            <Button icon={RefreshMinor} onClick={generateImage}></Button>
          </Tooltip>
          <Tooltip content="Remove product">
            <Button
              icon={DeleteMinor}
              onClick={() => deleteProduct(product.id)}
            ></Button>
          </Tooltip>
        </Stack>
      </Stack.Item>
    </Stack>
  );
}
