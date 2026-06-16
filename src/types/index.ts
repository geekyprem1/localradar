export interface Organization {
  id: string;
  created_at: string;
  name: string;
  stripe_customer_id?: string;
  subscription_tier: 'free' | 'pro' | 'agency';
  subscription_status: string;
}

export interface UserProfile {
  id: string;
  created_at: string;
  email: string;
  full_name?: string;
  organization_id?: string;
}

export interface Search {
  id: string;
  created_at: string;
  organization_id: string;
  business_type: string;
  city: string;
  country: string;
}

export interface Business {
  id: string;
  created_at: string;
  search_id?: string;
  organization_id: string;
  name: string;
  website: string;
  rating: number;
  reviews_count: number;
  phone: string;
  address: string;
}

export interface Opportunity {
  id: string;
  created_at: string;
  business_id: string;
  website_score: number;
  reviews_score: number;
  seo_score: number;
  gbp_score: number;
  social_score: number;
  total_score: number;
  opportunity_level: 'High' | 'Medium' | 'Low';
  estimated_deal_value: number;
  closing_probability: number;
}

export interface Audit {
  id: string;
  created_at: string;
  business_id: string;
  website_issues: string[];
  seo_issues: string[];
  review_issues: string[];
  gbp_issues: string[];
  social_issues: string[];
  recommended_services: string[];
}

export interface Competitor {
  id: string;
  created_at: string;
  business_id: string;
  name: string;
  website: string;
  rating: number;
  reviews_count: number;
  seo_score: number;
}

export interface Pitch {
  id: string;
  created_at: string;
  business_id: string;
  cold_email: string;
  cold_dm: string;
  website_proposal: string;
  seo_proposal: string;
}
