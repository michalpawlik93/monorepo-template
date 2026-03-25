import { z } from 'zod';

export enum SagaStatus {
  RUNNING = 'RUNNING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  COMPENSATED = 'COMPENSATED',
}

export interface SagaState<Data = unknown> {
  _id: string;
  type: string;
  status: SagaStatus;
  currentStep?: string;
  ttl: number;
  tempData: unknown;
  data?: Data;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export const SagaStateSchema = z.object({
  _id: z.string(),
  type: z.string(),
  status: z.nativeEnum(SagaStatus),
  currentStep: z.string().optional(),
  ttl: z.number(),
  data: z.unknown().optional(),
  version: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  expiresAt: z.date().optional(),
});

export const SAGA_COLLECTION_NAME = 'sagas';
