import { Banner } from '@shopify/polaris';
import React, { useEffect, useState } from 'react';
import { useAuthenticatedFetch } from '../../hooks';
import { useNavigate } from 'react-router-dom';

export default function FreeLimitBanner() {
  const navigate = useNavigate();
  const [credits, setCredits] = useState(true);
  const [fetching, setFetching] = useState(true);
  const fetch = useAuthenticatedFetch();

  useEffect(() => {
    getPlanDetails();
  }, []);

  const getPlanDetails = async () => {
    setFetching(true);
    const response = await fetch(`/api/shop/credits`);
    const data = await response.json();
    setCredits(data.credits);
    setFetching(false);
  };

  return (
    <div
      style={{
        display: !fetching && credits < 10 ? 'inherit' : 'none'
      }}
    >
      <Banner
        title="You are running out of credits"
        status="warning"
        action={{ content: 'Buy credits', onAction: () => navigate('/plans') }}
      >
        <p>
          You have only <b>{credits}</b> credits left. Buy some credits to
          generate images more images.
        </p>
      </Banner>
    </div>
  );
}
