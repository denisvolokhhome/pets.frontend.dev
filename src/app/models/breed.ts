export interface IBreed {
  id:         number;
  name:       string;
  kind: 'dog' | 'cat';  // dog and cat only
  code?:      string;
  group?:     string;
  created_at: string;
  updated_at?: string;
}

