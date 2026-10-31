export type Settings = {
  id: number;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  opening_hours: string | null;
  theme_color: string;
};

export type Category = {
  id: string;
  name: string;
  sort_order: number;
};

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_popular: boolean;
  sort_order: number;
};
