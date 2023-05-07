import { Banner } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '../../hooks';

export default function FreeLimitBanner() {
  const [active, setActive] = useState(true);
  const [plan, setPlan] = useState(true);
  const [fetching, setFetching] = useState(true);
  const fetch = useAuthenticatedFetch();

  useEffect(() => {
    try {
      if (localStorage.getItem('free-limit-banner') == 'false')
        setActive(false);
    } catch (_error) {
      console.log('Third party cookies not supported');
    }
    getPlanDetails();
  }, []);

  const getPlanDetails = async () => {
    setFetching(true);
    const response = await fetch(`/api/plans`);
    const data = await response.json();
    setPlan(data);
    setFetching(false);
  };

  const handleDismiss = () => {
    setActive(false);
    try {
      localStorage.setItem('free-limit-banner', 'false');
    } catch (_error) {
      console.log('Third party cookies not supported');
    }
  };

  return (
    <div
      style={{
        display: active && !fetching && !plan.name ? 'inherit' : 'none'
      }}
    >
      <Banner title="Upgrade to pro" status="warning" onDismiss={handleDismiss}>
        <p>
          You have only {20 - plan.usage} more free image generations available
          right now. Upgrade to pro plan for unlimited image generations.
        </p>
      </Banner>
    </div>
  );
}
