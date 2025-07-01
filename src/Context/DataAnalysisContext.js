import React, { createContext, useContext } from 'react';
import { SiteProvider, useSite } from './SiteContext';
import { BagProvider, useBags } from './BagContext';
import { FormsProvider, useForms } from './FormsContext';
import { TempDataProvider, useTempData } from './TempDataContext';
import { EBCStatusProvider, useEbcStatus } from './EBCStatusContext';

// Create a super-context
export const DataAnalysisContext = createContext();

// Internal bridge to gather values after all providers are in place
const DataAnalysisBridge = ({ children }) => {
  const siteCtx  = useSite();
  const bagCtx   = useBags();
  const formsCtx = useForms();
  const tempCtx  = useTempData();
  const ebcCtx   = useEbcStatus();

  // Compose a single value object
  const value = {
    ...siteCtx,
    ...bagCtx,
    ...formsCtx,
    ...tempCtx,
    ...ebcCtx
  };

  return (
    <DataAnalysisContext.Provider value={value}>
      {children}
    </DataAnalysisContext.Provider>
  );
};


export const DataAnalysisProvider = ({ children }) => (
  <SiteProvider>
    <BagProvider>
      <FormsProvider>
        <TempDataProvider>
          <EBCStatusProvider>
            <DataAnalysisBridge>
              {children}
            </DataAnalysisBridge>
          </EBCStatusProvider>
        </TempDataProvider>
      </FormsProvider>
    </BagProvider>
  </SiteProvider>
);

// Hook for consumers
export const useDataAnalysis = () => useContext(DataAnalysisContext);
