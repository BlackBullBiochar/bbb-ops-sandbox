import React, { createContext, useContext, useReducer } from 'react';

// --- Initial State ---
const initialFilterState = {
  site: '',            // e.g. 'ARA' or 'JNR'
  mode: 'single',      // 'single' | 'range'
  singleDate: '',      // YYYY-MM-DD if mode==='single'
  fromDate: '',        // YYYY-MM-DD start
  toDate: '',          // YYYY-MM-DD end
  isWeek: false,       // treat week as multi-day range flag
  week: '',            // e.g. '2023-W42' for week 42 of 2023
  shouldFetch: false,  // toggle to trigger data-fetch hooks
  extra: {}            // any additional filters keyed by name
};

// --- Actions ---
export const ACTIONS = {
  SET_SITE:        'SET_SITE',
  SET_MODE:        'SET_MODE',
  SET_SINGLE_DATE: 'SET_SINGLE_DATE',
  SET_FROM_DATE:   'SET_FROM_DATE',
  SET_TO_DATE:     'SET_TO_DATE',
  SET_EXTRA:       'SET_EXTRA',
  RESET_FILTERS:   'RESET_FILTERS',
  TOGGLE_WEEK:     'TOGGLE_WEEK',
  FETCH_DATA:      'FETCH_DATA'
};

// --- Reducer ---
function filterReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_SITE:
      return { ...state, site: action.payload };
    case ACTIONS.SET_MODE:
      return { ...state, mode: action.payload };
    case ACTIONS.SET_SINGLE_DATE:
      return { ...state, singleDate: action.payload };
    case ACTIONS.SET_FROM_DATE:
      return { ...state, fromDate: action.payload };
    case ACTIONS.SET_TO_DATE:
      return { ...state, toDate: action.payload };
    case ACTIONS.SET_EXTRA:
      return { ...state, extra: { ...state.extra, ...action.payload } };
    case ACTIONS.TOGGLE_WEEK:
      return { ...state, isWeek: action.payload };
    case ACTIONS.FETCH_DATA:
      return { ...state, shouldFetch: !state.shouldFetch };
    case ACTIONS.RESET_FILTERS:
      return initialFilterState;
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

// --- Contexts ---
const FilterStateContext = createContext();
const FilterDispatchContext = createContext();

// --- Provider ---
export function FilterProvider({ children }) {
  const [state, dispatch] = useReducer(filterReducer, initialFilterState);
  return (
    <FilterStateContext.Provider value={state}>
      <FilterDispatchContext.Provider value={dispatch}>
        {children}
      </FilterDispatchContext.Provider>
    </FilterStateContext.Provider>
  );
}

// --- Hooks ---
export function useFilters() {
  const context = useContext(FilterStateContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}

export function useFilterDispatch() {
  const dispatch = useContext(FilterDispatchContext);
  if (dispatch === undefined) {
    throw new Error('useFilterDispatch must be used within a FilterProvider');
  }
  return dispatch;
}

export function useFilterContext() {
  return [useFilters(), useFilterDispatch()];
}
