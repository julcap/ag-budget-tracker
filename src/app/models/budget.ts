export interface Budget {
  id: string,
  scope?: 'global' | 'category',
  name: string,
  spent: number,
  limit: number
}
