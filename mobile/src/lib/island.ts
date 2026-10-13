// How much extra room screens leave at the top while the running-timer island is showing.
// (Kept in its own file so ui.tsx and timer-island.tsx don't import each other.)
import { createContext, useContext } from 'react';

export const IslandSpace = createContext(0);
export const useIslandSpace = () => useContext(IslandSpace);
