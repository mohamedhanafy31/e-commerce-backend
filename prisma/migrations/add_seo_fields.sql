-- Migration: Add SEO fields to products table
-- This migration adds meta_title, meta_description, and slug fields to the products table

-- Add SEO fields to products table
ALTER TABLE products 
ADD COLUMN meta_title VARCHAR(60),
ADD COLUMN meta_description VARCHAR(160),
ADD COLUMN slug VARCHAR(100);

-- Create unique index on slug for SEO-friendly URLs
CREATE UNIQUE INDEX products_slug_key ON products(slug);

-- Create index on slug for faster lookups
CREATE INDEX products_slug_idx ON products(slug);

-- Add comments for documentation
COMMENT ON COLUMN products.meta_title IS 'SEO meta title for search engines (max 60 characters)';
COMMENT ON COLUMN products.meta_description IS 'SEO meta description for search engines (max 160 characters)';
COMMENT ON COLUMN products.slug IS 'URL-friendly slug for SEO (unique)';
