-- Migration: Add contact discovery fields to public.businesses table
alter table public.businesses 
add column if not exists business_email text,
add column if not exists contact_email text,
add column if not exists contact_page text;
