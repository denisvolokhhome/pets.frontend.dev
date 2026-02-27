export interface IBreed {
  id:         number;
  name:       string;
  kind:       'dog' | 'cat' | 'cow' | 'horse';  // ← add this
  code?:      string;
  group?:     string;
  created_at: string;
  updated_at?: string;
}

