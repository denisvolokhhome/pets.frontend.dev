export interface ReviewCreate {
  breeder_id: string;
  thread_id: string;
  rating: number;
  tags: string[];
  comment?: string;
}

export interface ReviewRead {
  id: string;
  reviewer_id: string;
  breeder_id: string;
  thread_id: string;
  rating: number;
  tags: string[];
  comment: string | null;
  created_at: string;
  reviewer_name: string | null;
}

export interface ReviewSummary {
  breeder_id: string;
  average_rating: number;
  review_count: number;
  tag_counts: Record<string, number>;
}

export interface ReviewEligibility {
  eligible: boolean;
  reason: string | null;
}

export interface PaginatedReviews {
  items: ReviewRead[];
  total: number;
}
