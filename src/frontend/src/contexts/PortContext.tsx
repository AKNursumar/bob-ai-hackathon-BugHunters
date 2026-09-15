import { createContext, useContext, useState, ReactNode } from 'react';

export interface Port {
  id: string;
  name: string;
}

export const INDIAN_PORTS: Port[] = [
  { id: 'port776', name: 'JNPA / Nhava Sheva' },
  { id: 'port777', name: 'Mundra' },
  { id: 'port235', name: 'Chennai' },
  { id: 'port540', name: 'Kandla' },
  { id: 'port1367', name: 'Visakhapatnam' },
];

interface PortContextType {
  selectedPort: Port;
  setSelectedPort: (port: Port) => void;
}

const PortContext = createContext<PortContextType | undefined>(undefined);

export function PortProvider({ children }: { children: ReactNode }) {
  // Default to JNPA as per requirement
  const [selectedPort, setSelectedPort] = useState<Port>(INDIAN_PORTS[0]);

  return (
    <PortContext.Provider value={{ selectedPort, setSelectedPort }}>
      {children}
    </PortContext.Provider>
  );
}

export function usePort() {
  const context = useContext(PortContext);
  if (context === undefined) {
    throw new Error('usePort must be used within a PortProvider');
  }
  return context;
}
