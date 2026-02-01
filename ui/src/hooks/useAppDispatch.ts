import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store.js';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
