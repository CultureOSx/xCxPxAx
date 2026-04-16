import React, { createContext, useContext } from 'react';

/** When true, Discover tab uses Digital Vitrine surfaces + plum typography (Poppins unchanged). */
const DiscoverVitrineContext = createContext(false);

export function DiscoverVitrineProvider({ children }: { children: React.ReactNode }) {
  return <DiscoverVitrineContext.Provider value={true}>{children}</DiscoverVitrineContext.Provider>;
}

export function useDiscoverVitrine(): boolean {
  return useContext(DiscoverVitrineContext);
}
