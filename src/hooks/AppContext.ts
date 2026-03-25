import { createContext, useContext } from 'react';
import type { AppContext as AppContextType } from './useAppState';

export const AppCtx = createContext<AppContextType>(null!);
export const useApp = () => useContext(AppCtx);
