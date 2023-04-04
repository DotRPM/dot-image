import {
  Button,
  Icon,
  Spinner,
  Stack,
  TextStyle,
  Thumbnail,
  Tooltip
} from '@shopify/polaris';
import { TickMinor, DeleteMinor, RefreshMinor } from '@shopify/polaris-icons';
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

  const [generating, setGenerating] = useState(false);
  const [image, setImage] = useState(product.image?.src);

  const generateImage = async () => {
    setFetching((state) => ++state);
    setGenerating(true);
    const response = await fetch(`/api/image/${product.title}`);
    const data = await response.json();
    setImage(data.src);
    changeImage(product.id, data.src);
    setGenerating(false);
    setFetching((state) => --state);
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
            {generating ? (
              <Stack alignment="center" spacing="extraTight">
                <Spinner size="small" />
                <TextStyle variation="warning">
                  Generating new image...
                </TextStyle>
              </Stack>
            ) : (
              <Stack alignment="center" spacing="extraTight">
                <Icon source={TickMinor} color="success" />
                <TextStyle variation="positive">New image generated.</TextStyle>
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
