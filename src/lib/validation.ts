import { z } from 'zod';

// Project name validation - max 200 chars
export const projectNameSchema = z
  .string()
  .trim()
  .min(1, 'Nome é obrigatório')
  .max(200, 'Nome deve ter no máximo 200 caracteres');

// Project description validation - max 2000 chars
export const projectDescriptionSchema = z
  .string()
  .trim()
  .max(2000, 'Descrição deve ter no máximo 2000 caracteres')
  .optional()
  .nullable();

// UUID validation
export const uuidSchema = z
  .string()
  .uuid('ID inválido');

// Array of IDs validation (for product_ids and campaign_ids)
export const idArraySchema = z
  .array(z.string().max(100, 'ID muito longo'))
  .max(100, 'Máximo de 100 itens permitidos')
  .optional()
  .nullable();

// Benchmark validation (percentage 0-100)
export const benchmarkSchema = z
  .number()
  .min(0, 'Valor mínimo é 0')
  .max(100, 'Valor máximo é 100');

// Integration credential schemas
export const kiwifyCredentialsSchema = z.object({
  client_id: z.string().trim().min(1, 'Client ID é obrigatório').max(500, 'Client ID muito longo'),
  client_secret: z.string().trim().min(1, 'Client Secret é obrigatório').max(500, 'Client Secret muito longo'),
  account_id: z.string().trim().min(1, 'Account ID é obrigatório').max(100, 'Account ID muito longo'),
});

export const metaCredentialsSchema = z.object({
  access_token: z.string().trim().min(1, 'Access Token é obrigatório').max(1000, 'Access Token muito longo'),
  ad_account_id: z.string().trim().min(1, 'Ad Account ID é obrigatório').max(100, 'Ad Account ID muito longo'),
});

// Full project create/update schema
export const projectSchema = z.object({
  name: projectNameSchema,
  description: projectDescriptionSchema,
  kiwify_product_ids: idArraySchema,
  meta_campaign_ids: idArraySchema,
  benchmark_engagement: benchmarkSchema.optional(),
  benchmark_ctr: benchmarkSchema.optional(),
  benchmark_lp_rate: benchmarkSchema.optional(),
  benchmark_checkout_rate: benchmarkSchema.optional(),
  benchmark_sale_rate: benchmarkSchema.optional(),
});

// Validation helper function
export function validateProjectName(name: string): { valid: boolean; error?: string } {
  const result = projectNameSchema.safeParse(name);
  if (result.success) {
    return { valid: true };
  }
  return { valid: false, error: result.error.errors[0]?.message };
}

export function validateProjectDescription(description: string | null): { valid: boolean; error?: string } {
  const result = projectDescriptionSchema.safeParse(description);
  if (result.success) {
    return { valid: true };
  }
  return { valid: false, error: result.error.errors[0]?.message };
}
