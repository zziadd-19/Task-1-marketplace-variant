import { Listing } from '../models/Listing.js';

import Joi from 'joi';
import { Types } from 'mongoose';

const createListingSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().optional(),
  price: Joi.number().min(0).required(),
  category: Joi.string().valid('textbooks', 'electronics', 'clothing', 'furniture', 'other').default('other').required(),
  condition: Joi.string().valid('new', 'like new', 'used').default('used').required(),
  status: Joi.string().valid('active', 'sold', 'removed').default('active').required(),
});

const updateListingSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  price: Joi.number().min(0).optional(),
  category: Joi.string().valid('textbooks', 'electronics', 'clothing', 'furniture', 'other').optional(),
  condition: Joi.string().valid('new', 'like new', 'used').optional(),
  status: Joi.string().valid('active', 'sold', 'removed').optional(),
});

// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    // GET /api/listings
    const listings = await Listing.find();
    const filtered = filterListingsByStatus(listings, req.query.status);
    res.json(filtered);
  } catch (err) { next(err); }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    // GET /api/listings/:id
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(listing);
  } catch (err) { next(err); }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
    // POST /api/listings
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
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    const { id } = req.params;
    const { error } = updateListingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const listing = await Listing.findByIdAndUpdate(id, req.body, { new: true });
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(listing);
  } catch (err) { next(err); }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, { status: 'removed' }, { new: true });
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.json(listing);
  } catch (err) { next(err); }
}


export async function filterListingsByStatus(listings, status) {
  if (status) {
    const validStatuses = ['active', 'sold', 'removed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }
    return listings.filter(listing => listing.status === status);
  }
  return listings.filter(listing => listing.status === 'active');
}