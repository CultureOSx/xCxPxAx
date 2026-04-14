import { z } from 'zod';

/**
 * CulturePass Validation Schemas
 * Categories: Event, Artist, Venue, Movie, Community, Onboarding
 */

const baseSchema = z.object({
  title: z.string()
    .min(2, "Please provide a slightly longer name.")
    .max(100, "This title is a bit too long."),
  description: z.string()
    .min(10, "Tell us a bit more about this.")
    .max(2000, "The description is too detailed; please keep it concise."),
});

export const EventSchema = baseSchema.extend({
  date: z.date({
    error: "Please select a valid date.",
  }),
  venueId: z.string().uuid("Please select a valid venue."),
  price: z.number().min(0, "Price cannot be negative."),
  category: z.enum(['music', 'arts', 'theatre', 'food', 'community']),
});

export const ArtistSchema = baseSchema.extend({
  genre: z.array(z.string()).min(1, "Select at least one genre."),
  handle: z.string()
    .regex(/^[a-zA-Z0-9._]+$/, "Handles can only contain letters, numbers, dots and underscores.")
    .min(3, "Handles should be at least 3 characters."),
});

export const VenueSchema = baseSchema.extend({
  address: z.string().min(5, "A full street address is required."),
  capacity: z.number().positive("Capacity must be a positive number."),
  isAccessible: z.boolean().default(false),
});

export const MovieSchema = baseSchema.extend({
  rating: z.enum(['G', 'PG', 'M', 'MA15+', 'R18+']),
  runtime: z.number().positive("Runtime must be in minutes."),
  cinemaId: z.string().uuid("Please select a valid cinema location."),
});

export const CommunitySchema = baseSchema.extend({
  purpose: z.string().min(20, "Please explain the community's purpose more clearly."),
  isPrivate: z.boolean().default(false),
});

export const OnboardingSchema = z.object({
  fullName: z.string().min(2, "What's your name?"),
  email: z.string().email("Please provide a valid email address."),
  interests: z.array(z.string()).min(3, "Tell us at least three things you're interested in."),
  location: z.string().min(2, "Where are you based?"),
});

export type CategorySchemas = typeof EventSchema | typeof ArtistSchema | typeof VenueSchema | typeof MovieSchema | typeof CommunitySchema | typeof OnboardingSchema;