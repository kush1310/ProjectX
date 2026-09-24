export interface Coupon {
  id: string;
  code: string;
  discount: string;
  title: string;
  description: string;
  expiry: string;
  brandColor: string;
  brandName: string;
  isCustom: boolean; // True if created by the vendor
  isActive: boolean; // True if enabled by the vendor for their canteen
  minOrderValue?: number;
  startDate?: string;
}
