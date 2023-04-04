import { Banner } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';

export default function ChatBanner() {
  const [active, setActive] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem('chat-with-is-banner') == 'false')
        setActive(false);
    } catch (_error) {
      console.log('Third party cookies not supported');
    }
  });

  const handleDismiss = () => {
    setActive(false);
    try {
      localStorage.setItem('chat-with-is-banner', 'false');
    } catch (_error) {
      console.log('Third party cookies not supported');
    }
  };

  return (
    <div style={{ display: active ? 'inherit' : 'none' }}>
      <Banner title="Chat with us!" status="info" onDismiss={handleDismiss}>
        <p>
          Do you have any suggestions or issues using the app? Click the icon at
          the bottom right corner to chat with us.
        </p>
      </Banner>
    </div>
  );
}
