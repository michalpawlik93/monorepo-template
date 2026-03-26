export interface Pager {
  pageSize: number;
  cursor?: string;
}

export interface PagerResult<T> {
  data: T[];
  cursor?: string;
}

export const SortDirection = {
  asc: 'asc',
  desc: 'desc',
} as const;
export type SortDirection = keyof typeof SortDirection;

export interface PageRequestByTime {
  pageSize: number;
  cursor?: string;
  sortBy?: string;
  startDate: Date;
  endDate: Date;
  sortDirection?: SortDirection;
}

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends (infer U)[]
    ? DeepRequired<U>[]
    : T[P] extends (...args: unknown[]) => unknown
      ? T[P]
      : T[P] extends object
        ? DeepRequired<T[P]>
        : T[P];
};
