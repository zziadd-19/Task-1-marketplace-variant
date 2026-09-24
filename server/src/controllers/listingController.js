import { Listing } from '../models/Listing.js';

import Joi from 'joi';
import { Types } from 'mongoose';

const CATEGORIES = ['textbooks', 'electronics', 'clothing', 'furniture', 'other'];
const CONDITIONS = ['new', 'like-new', 'used', 'worn'];
const STATUSES = ['active', 'sold', 'removed'];

const createListingSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid(...CATEGORIES).default('other'),
  condition: Joi.string().valid(...CONDITIONS).default('used'),
  status: Joi.string().valid(...STATUSES).default('active'),
  seller: Joi.string().hex().length(24).optional(),
});

const updateListingSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  price: Joi.number().min(0).optional(),
  category: Joi.string().valid(...CATEGORIES).optional(),
  condition: Joi.string().valid(...CONDITIONS).optional(),
  status: Joi.string().valid(...STATUSES).optional(),
  seller: Joi.string().hex().length(24).optional(),
}).min(1).required();

// GET /api/listings
export async function getAllListings(req, res, next) {
  try {
    const listings = await Listing.find();
    const filtered = filterListingsByStatus(listings, req.query.status);
    res.json(filtered);
  } catch (err) { next(err); }
}

// GET /api/listings/:id
export async function getListing(req, res, next) {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid listing id' });
    }
    const listing = await Listing.findById(id);
    if (!listing || listing.status === 'removed') {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(listing);
  } catch (err) { next(err); }
}

// POST /api/listings
export async function createListing(req, res, next) {
  try {
    const { error } = createListingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const listing = new Listing(req.body);
    await listing.save();
    res.status(201).json(listing);
  } catch (err) { next(err); }
}

// PATCH /api/listings/:id
export async function updateListing(req, res, next) {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid listing id' });
    }
    const { error } = updateListingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const listing = await Listing.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(listing);
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id — soft delete
export async function deleteListing(req, res, next) {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid listing id' });
    }
    const listing = await Listing.findByIdAndUpdate(id, { status: 'removed' }, { new: true });
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(listing);
  } catch (err) { next(err); }
}

function filterListingsByStatus(listings, status) {
  if (status) {
    if (!STATUSES.includes(status)) {
      const err = new Error(`Invalid status: ${status}`);
      err.status = 400;
      throw err;
    }
    return listings.filter(listing => listing.status === status);
  }
  return listings.filter(listing => listing.status === 'active');
}
