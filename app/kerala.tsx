import React from 'react';
import { CulturalHubPage } from '@/components/hubs/CulturalHubPage';

export default function KeralaLandingScreen() {
  return (
    <CulturalHubPage
      seed={{
        slug: 'culturekerala',
        title: 'CultureKerala - Kerala & Malayalee Communities',
        subtitle: 'Discover Kerala communities, events, announcements, and trusted links in one dedicated hub.',
        description:
          'Join Kerala and Malayalee communities, discover events, and explore culture-focused experiences on CultureKerala.',
        domainUrl: 'https://culturekerala.com/kerala',
        defaultState: 'NSW',
        defaultLanguage: 'mal',
        matchTerms: ['kerala', 'malayali', 'malayalee', 'malayalam', 'onam', 'vishu'],
      }}
      showBuilder={false}
    />
  );
}
