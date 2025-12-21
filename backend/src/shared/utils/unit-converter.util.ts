import { InventoryUnit } from '../../entities/inventory.entity';

/**
 * Unit Conversion Utility
 * Converts between different units for inventory calculations
 * All conversions go through base units (grams for weight, liters for volume)
 */

// Base units
const BASE_WEIGHT_UNIT = 'gram';
const BASE_VOLUME_UNIT = 'milliliter';

/**
 * Conversion factors to base units
 */
const CONVERSION_TO_BASE: Record<InventoryUnit, number> = {
  kilogram: 1000,        // 1 kg = 1000 g
  gram: 1,               // 1 g = 1 g (base)
  liter: 1000,           // 1 L = 1000 mL
  milliliter: 1,         // 1 mL = 1 mL (base)
  piece: 1,              // Pieces are not convertible
  cup: 250               // 1 cup = 250 mL (approximate)
};

/**
 * Check if unit is a weight unit
 */
export function isWeightUnit(unit: InventoryUnit): boolean {
  return unit === 'kilogram' || unit === 'gram';
}

/**
 * Check if unit is a volume unit
 */
export function isVolumeUnit(unit: InventoryUnit): boolean {
  return unit === 'liter' || unit === 'milliliter' || unit === 'cup';
}

/**
 * Check if units are compatible (can be converted)
 */
export function areUnitsCompatible(unit1: InventoryUnit, unit2: InventoryUnit): boolean {
  // Same unit is always compatible
  if (unit1 === unit2) return true;
  
  // Weight units are compatible with each other
  if (isWeightUnit(unit1) && isWeightUnit(unit2)) return true;
  
  // Volume units are compatible with each other
  if (isVolumeUnit(unit1) && isVolumeUnit(unit2)) return true;
  
  // Pieces are only compatible with pieces
  if (unit1 === 'piece' || unit2 === 'piece') return false;
  
  return false;
}

/**
 * Convert quantity from one unit to another
 * @param quantity - Quantity to convert
 * @param fromUnit - Source unit
 * @param toUnit - Target unit
 * @returns Converted quantity
 * @throws Error if units are incompatible
 */
export function convertUnit(
  quantity: number,
  fromUnit: InventoryUnit,
  toUnit: InventoryUnit
): number {
  // Same unit, no conversion needed
  if (fromUnit === toUnit) return quantity;
  
  // Check compatibility
  if (!areUnitsCompatible(fromUnit, toUnit)) {
    throw new Error(
      `Cannot convert from ${fromUnit} to ${toUnit}. Units must be of the same type (weight, volume, or piece).`
    );
  }
  
  // Convert to base unit first, then to target unit
  const baseQuantity = quantity * CONVERSION_TO_BASE[fromUnit];
  const convertedQuantity = baseQuantity / CONVERSION_TO_BASE[toUnit];
  
  return convertedQuantity;
}

/**
 * Convert quantity to base unit (gram for weight, milliliter for volume)
 */
export function toBaseUnit(quantity: number, unit: InventoryUnit): number {
  return quantity * CONVERSION_TO_BASE[unit];
}

/**
 * Convert quantity from base unit
 */
export function fromBaseUnit(quantity: number, toUnit: InventoryUnit): number {
  return quantity / CONVERSION_TO_BASE[toUnit];
}

/**
 * Normalize units to a standard unit for comparison
 * Weight -> gram, Volume -> milliliter, Piece -> piece
 */
export function normalizeToBaseUnit(quantity: number, unit: InventoryUnit): {
  quantity: number;
  unit: InventoryUnit;
} {
  if (isWeightUnit(unit)) {
    return { quantity: toBaseUnit(quantity, unit), unit: 'gram' };
  }
  if (isVolumeUnit(unit)) {
    return { quantity: toBaseUnit(quantity, unit), unit: 'milliliter' };
  }
  // Piece units don't need conversion
  return { quantity, unit: 'piece' };
}

