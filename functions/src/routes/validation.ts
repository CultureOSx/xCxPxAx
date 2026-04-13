import { z } from 'zod';

const ContentStatusSchema = z.enum(['active', 'draft', 'archived', 'suspended']);

const ADDRESS_ALLOWED_CHARS = /^[A-Za-z0-9\s,'./#()-]+$/;
const PLACE_ALLOWED_CHARS = /^[A-Za-z\s'.-]+$/;

function addressSchema(required: boolean) {
  const base = z.string().transform((value) => value.replace(/\s+/g, ' ').trim());
  return base.superRefine((value, ctx) => {
    if (!value) {
      if (required) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'address is required' });
      return;
    }
    if (value.length < 6) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'address is too short' });
    if (value.length > 160) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'address is too long' });
    if (!ADDRESS_ALLOWED_CHARS.test(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'address contains invalid characters' });
    }
  });
}

function placeSchema(fieldName: 'city' | 'country') {
  return z.string().transform((value) => value.replace(/\s+/g, ' ').trim()).superRefine((value, ctx) => {
    if (!value) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} is required` });
      return;
    }
    if (value.length < 2) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} is too short` });
    if (value.length > 80) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} is too long` });
    if (!PLACE_ALLOWED_CHARS.test(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${fieldName} contains invalid characters` });
    }
  });
}

export const ShopDealSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  discount: z.string(),
  description: z.string().optional(),
  validTill: z.string(),
  code: z.string().optional(),
  isActive: z.boolean(),
});

export const ShopOpeningHoursSchema = z.object({
  monday: z.string().optional(),
  tuesday: z.string().optional(),
  wednesday: z.string().optional(),
  thursday: z.string().optional(),
  friday: z.string().optional(),
  saturday: z.string().optional(),
  sunday: z.string().optional(),
});

export const ShopInputSchema = z.object({
  name: z.string(),
  category: z.string(),
  description: z.string(),
  imageUrl: z.string(),
  address: addressSchema(true),
  location: z.string().optional(),
  city: placeSchema('city'),
  country: placeSchema('country'),
  rating: z.number().optional(),
  reviewsCount: z.number().optional(),
  isOpen: z.boolean(),
  isPromoted: z.boolean(),
  deliveryAvailable: z.boolean(),
  phone: z.string().optional(),
  website: z.string().optional(),
  openingHours: ShopOpeningHoursSchema.optional(),
  deals: z.array(ShopDealSchema).optional(),
  ownerId: z.string().optional(),
  culturePassId: z.string().optional(),
  status: ContentStatusSchema.optional(),
});

export const RestaurantInputSchema = z.object({
  name: z.string().min(1),
  cuisine: z.string().min(1),
  priceRange: z.enum(['$', '$$', '$$$', '$$$$']),
  description: z.string().min(1),
  imageUrl: z.string().min(1),
  address: addressSchema(true),
  city: placeSchema('city'),
  country: placeSchema('country'),
  rating: z.number().optional(),
  reviewsCount: z.number().optional(),
  isOpen: z.boolean(),
  isPromoted: z.boolean(),
  phone: z.string().optional(),
  website: z.string().optional(),
  openingHours: ShopOpeningHoursSchema.optional(),
  deals: z.array(ShopDealSchema).optional(),
  reservationAvailable: z.boolean().optional(),
  deliveryAvailable: z.boolean().optional(),
  ownerId: z.string().optional(),
  culturePassId: z.string().optional(),
  status: ContentStatusSchema.optional(),
});
