import { useSelector } from 'react-redux';
import type { RootState } from '../store.js';

export const useAppSelector = useSelector.withTypes<RootState>();
