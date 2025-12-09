import { db } from '../../db';
import { templates } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { TemplateSchema } from '@proposal-gen/shared';
import * as fs from 'fs/promises';
import * as path from 'path';

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout')), timeoutMs)
    ),
  ]);
}

export class TemplateService {
  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<any | null> {
    const dbTemplate = await db.query.templates.findFirst({
      where: eq(templates.id, id),
    });

    return dbTemplate;
  }

  /**
   * Get template by slug
   */
  async getTemplate(slug: string): Promise<any | null> {
    // Check database first
    const dbTemplate = await db.query.templates.findFirst({
      where: eq(templates.slug, slug),
    });

    if (dbTemplate) {
      return dbTemplate;
    }

    // Fall back to predefined templates from file system
    return this.loadPredefinedTemplate(slug);
  }

  /**
   * Load predefined template from templates directory
   */
  private async loadPredefinedTemplate(slug: string): Promise<any | null> {
    try {
      const templatePath = path.join(process.cwd(), '../../templates', slug, 'schema.json');
      const schemaData = await fs.readFile(templatePath, 'utf-8');
      const schema = JSON.parse(schemaData) as TemplateSchema;

      return {
        id: `predefined-${slug}`,
        name: schema.template_name,
        slug,
        schema,
        styles: { branding: schema.branding },
        isActive: true,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error(`Failed to load predefined template ${slug}:`, error);
      return null;
    }
  }

  /**
   * List all templates
   */
  async listTemplates(): Promise<any[]> {
    let dbTemplates: any[] = [];

    // Get templates from database with error handling and timeout
    try {
      dbTemplates = await withTimeout(
        db.query.templates.findMany({
          where: eq(templates.isActive, true),
        }),
        2000 // 2 second timeout
      );
    } catch (error) {
      console.error('Failed to query database templates:', error);
      // Continue with predefined templates even if database fails or times out
    }

    // Add predefined templates
    const predefinedTemplates = await this.listPredefinedTemplates();

    return [...dbTemplates, ...predefinedTemplates];
  }

  /**
   * List predefined templates from file system
   */
  private async listPredefinedTemplates(): Promise<any[]> {
    const templatesDir = path.join(process.cwd(), '../../templates');
    const predefined: any[] = [];

    try {
      const entries = await fs.readdir(templatesDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const template = await this.loadPredefinedTemplate(entry.name);
          if (template) {
            predefined.push(template);
          }
        }
      }
    } catch (error) {
      console.error('Failed to list predefined templates:', error);
    }

    return predefined;
  }

  /**
   * Create new template
   */
  async createTemplate(
    name: string,
    slug: string,
    schema: TemplateSchema,
    styles?: any,
    assets?: any
  ): Promise<any> {
    const [template] = await db
      .insert(templates)
      .values({
        name,
        slug,
        schema,
        styles,
        assets,
        isActive: true,
      })
      .returning();

    return template;
  }

  /**
   * Update template
   */
  async updateTemplate(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      schema: TemplateSchema;
      styles: any;
      assets: any;
      isActive: boolean;
    }>
  ): Promise<any> {
    const [template] = await db
      .update(templates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();

    return template;
  }

  /**
   * Delete template (soft delete by setting isActive to false)
   */
  async deleteTemplate(id: string): Promise<void> {
    await db.update(templates).set({ isActive: false }).where(eq(templates.id, id));
  }
}

export const templateService = new TemplateService();
