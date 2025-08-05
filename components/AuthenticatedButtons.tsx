"use client";

import React from 'react';
import NewEvent from './NewEvent';
import ReferAndEarn from './ReferAndEarn';
import { useAuth } from '@/utils/AuthContext';
import { usePathname } from 'next/navigation';

const AuthenticatedButtons = () => {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();

  return (
    <>
      {pathname !== '/upcoming-events' && (
        <NewEvent 
          title="Upcoming Events"
          message="Stay updated with our latest events, workshops, and training programs!"
          ctaText="View Events"
          ctaLink="/schedule"
          autoHide={false}
        />
      )}
      {isAuthenticated && pathname !== '/refer-and-earn' && (
        <ReferAndEarn 
          title="Refer & Earn"
          message="Invite friends and earn rewards!"
          ctaText="Learn More"
          autoHide={false}
        />
      )}
    </>
  );
};

export default AuthenticatedButtons; 