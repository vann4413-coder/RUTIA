import type { Repository } from './types';
import { LocalRepository } from './local';

export const repo: Repository = new LocalRepository();
export type { Repository };
