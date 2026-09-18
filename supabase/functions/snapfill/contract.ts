export type FoodAnalysis = {
  is_food: boolean; food_name: string | null; food_category: 'gravy' | 'dry' | 'rice' | null;
  estimated_quantity: number | null; quantity_unit: 'kg' | 'litres' | 'portions' | null;
  estimated_servings: number | null; packaging: string | null; visible_freshness_notes: string | null; confidence: number;
}
export const analysisSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    is_food: { type: 'boolean' }, food_name: { type: ['string','null'] },
    food_category: { type: ['string','null'], enum: ['gravy','dry','rice',null] },
    estimated_quantity: { type: ['number','null'] }, quantity_unit: { type: ['string','null'], enum: ['kg','litres','portions',null] },
    estimated_servings: { type: ['integer','null'] }, packaging: { type: ['string','null'] },
    visible_freshness_notes: { type: ['string','null'] }, confidence: { type: 'number' },
  },
  required: ['is_food','food_name','food_category','estimated_quantity','quantity_unit','estimated_servings','packaging','visible_freshness_notes','confidence'],
}
export function parseAnalysis(value: unknown): FoodAnalysis {
  if (!value || typeof value !== 'object') throw new Error('Invalid analysis')
  const row = value as Record<string,unknown>
  if (Object.keys(row).length !== analysisSchema.required.length || !analysisSchema.required.every(key=>key in row)) throw new Error('Invalid analysis')
  for (const [key,limit] of [['food_name',120],['packaging',200],['visible_freshness_notes',700]] as const) {
    if (row[key] !== null && (typeof row[key] !== 'string' || row[key].length > limit)) throw new Error('Invalid analysis')
  }
  if (typeof row.is_food !== 'boolean' || typeof row.confidence !== 'number' || !Number.isFinite(row.confidence) || row.confidence < 0 || row.confidence > 1) throw new Error('Invalid analysis')
  if (![null,'gravy','dry','rice'].includes(row.food_category as string | null) || ![null,'kg','litres','portions'].includes(row.quantity_unit as string | null)) throw new Error('Invalid analysis')
  if ((row.estimated_quantity === null) !== (row.quantity_unit === null)) throw new Error('Invalid analysis')
  if (row.estimated_quantity !== null && (typeof row.estimated_quantity !== 'number' || !Number.isFinite(row.estimated_quantity) || row.estimated_quantity <= 0)) throw new Error('Invalid analysis')
  if (row.estimated_servings !== null && (typeof row.estimated_servings !== 'number' || !Number.isInteger(row.estimated_servings) || row.estimated_servings <= 0)) throw new Error('Invalid analysis')
  return row as FoodAnalysis
}
export function validImageSignature(bytes: Uint8Array, type: string) {
  if (type === 'image/jpeg') return bytes[0]===255 && bytes[1]===216 && bytes[2]===255
  if (type === 'image/png') return [137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b)
  if (type === 'image/webp') return new TextDecoder().decode(bytes.slice(0,4))==='RIFF' && new TextDecoder().decode(bytes.slice(8,12))==='WEBP'
  return false
}

// Only existing donation fields are suggested. Temperature/time/location stay donor-entered.
export function analysisFields(result: FoodAnalysis): Record<string,string> {
  if (!result.is_food) return {}
  return {
    ...(result.food_name ? {food_name:result.food_name} : {}), ...(result.food_category ? {food_type:result.food_category} : {}),
    ...(result.estimated_quantity!==null ? {quantity:String(result.estimated_quantity),quantity_unit:result.quantity_unit!} : result.estimated_servings!==null ? {quantity:String(result.estimated_servings),quantity_unit:'portions'} : {}),
    ...(result.packaging ? {container:result.packaging} : {}), ...(result.visible_freshness_notes ? {description:`AI visual estimate: ${result.visible_freshness_notes}`} : {}),
  }
}
