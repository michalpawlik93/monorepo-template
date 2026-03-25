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

export const MockPageRequestByTime = (): PageRequestByTime => ({
  pageSize: 10,
  cursor: '1',
  sortBy: 'publishedDate',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-01'),
});

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object
    ? T[P] extends (...args: unknown[]) => unknown
      ? T[P]
      : DeepRequired<T[P]>
    : T[P];
};
