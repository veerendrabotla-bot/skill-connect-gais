
import React from 'react';
import { ServiceCategory } from './types';

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { 
    id: '1', 
    name: 'Plumbing', 
    icon: '🚰', 
    description: 'Leak repairs, pipe installations, and bathroom fittings.', 
    basePrice: 499,
    serviceTypes: [
      { id: 'p1', name: 'Tap Leakage', description: 'Fixing dripping or broken taps.', basePrice: 499, avgDuration: '30-45 mins', popularityScore: 95 },
      { id: 'p2', name: 'Toilet Flush Repair', description: 'Internal flush mechanism fix.', basePrice: 699, avgDuration: '1 hour', popularityScore: 88 },
      { id: 'p3', name: 'Full Pipe Installation', description: 'Complete water line setup.', basePrice: 2499, avgDuration: '4-6 hours', popularityScore: 65 },
    ]
  },
  { 
    id: '2', 
    name: 'Electrical', 
    icon: '⚡', 
    description: 'Wiring, switchboard repairs, and appliance installation.', 
    basePrice: 399,
    serviceTypes: [
      { id: 'e1', name: 'Switchboard Repair', description: 'Fixing sparks or faulty buttons.', basePrice: 399, avgDuration: '30 mins', popularityScore: 92 },
      { id: 'e2', name: 'Ceiling Fan Install', description: 'Assembly and secure mounting.', basePrice: 599, avgDuration: '45 mins', popularityScore: 85 },
      { id: 'e3', name: 'Full House Wiring', description: 'Modern wiring and MCB setup.', basePrice: 9999, avgDuration: '2-3 days', popularityScore: 40 },
    ]
  },
  { 
    id: '3', 
    name: 'Cleaning', 
    icon: '🧹', 
    description: 'Deep home cleaning, sofa cleaning, and sanitization.', 
    basePrice: 999,
    serviceTypes: [
      { id: 'c1', name: 'Bathroom Deep Clean', description: 'Stain removal and sanitization.', basePrice: 999, avgDuration: '2 hours', popularityScore: 98 },
      { id: 'c2', name: 'Full House Deep Clean', description: 'End-to-end meticulous cleaning.', basePrice: 4500, avgDuration: '6-8 hours', popularityScore: 78 },
    ]
  },
  { 
    id: '4', 
    name: 'Carpentry', 
    icon: '🪚', 
    description: 'Furniture repair, assembly, and custom woodwork.', 
    basePrice: 599,
    serviceTypes: [
      { id: 'cr1', name: 'Furniture Assembly', description: 'Flat-pack furniture setup.', basePrice: 599, avgDuration: '1-2 hours', popularityScore: 82 },
      { id: 'cr2', name: 'Door Lock Repair', description: 'Handle and internal lock fixing.', basePrice: 799, avgDuration: '45 mins', popularityScore: 90 },
    ]
  },
  { 
    id: '5', 
    name: 'Painting', 
    icon: '🎨', 
    description: 'Full house painting or touch-up services.', 
    basePrice: 2499,
    serviceTypes: [
      { id: 'pt1', name: 'Single Wall Texture', description: 'Designer finish for one wall.', basePrice: 2499, avgDuration: '4 hours', popularityScore: 70 },
      { id: 'pt2', name: 'Full Apartment Paint', description: 'Prime, base, and top coat.', basePrice: 12000, avgDuration: '3-5 days', popularityScore: 55 },
    ]
  },
  { 
    id: '6', 
    name: 'AC Repair', 
    icon: '❄️', 
    description: 'Servicing, gas refilling, and cooling issues.', 
    basePrice: 899,
    serviceTypes: [
      { id: 'ac1', name: 'Split AC Service', description: 'Filter cleaning and cooling check.', basePrice: 899, avgDuration: '1 hour', popularityScore: 99 },
      { id: 'ac2', name: 'Gas Refilling', description: 'Recharge for optimal cooling.', basePrice: 2500, avgDuration: '1.5 hours', popularityScore: 84 },
    ]
  },
];

export const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-800',
  MATCHING: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-indigo-100 text-indigo-800',
  IN_TRANSIT: 'bg-purple-100 text-purple-800',
  STARTED: 'bg-orange-100 text-orange-800',
  COMPLETED_PENDING_PAYMENT: 'bg-cyan-100 text-cyan-800',
  PAID: 'bg-green-100 text-green-800',
  DISPUTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};
