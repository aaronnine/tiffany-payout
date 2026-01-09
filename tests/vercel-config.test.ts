import * as fs from 'fs';
import * as path from 'path';

describe('Vercel Configuration Validation', () => {
  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');

  describe('vercel.json file existence and format', () => {
    test('vercel.json file should exist', () => {
      expect(fs.existsSync(vercelConfigPath)).toBe(true);
    });

    test('vercel.json should be valid JSON', () => {
      if (fs.existsSync(vercelConfigPath)) {
        const configContent = fs.readFileSync(vercelConfigPath, 'utf8');
        expect(() => JSON.parse(configContent)).not.toThrow();
      }
    });
  });

  describe('vercel.json required fields validation', () => {
    let config: any;

    beforeAll(() => {
      if (fs.existsSync(vercelConfigPath)) {
        const configContent = fs.readFileSync(vercelConfigPath, 'utf8');
        config = JSON.parse(configContent);
      }
    });

    test('should contain framework field set to nextjs', () => {
      expect(config).toHaveProperty('framework');
      expect(config.framework).toBe('nextjs');
    });

    test('should contain rewrites for proper routing', () => {
      expect(config).toHaveProperty('rewrites');
      expect(Array.isArray(config.rewrites)).toBe(true);
    });

    test('rewrites should handle SPA routing', () => {
      const hasRootRewrite = config.rewrites.some((rewrite: any) => 
        rewrite.source === '/((?!api|_next|_static|favicon.ico).*)'
      );
      expect(hasRootRewrite).toBe(true);
    });

    test('rewrite destination should point to root', () => {
      const rootRewrite = config.rewrites.find((rewrite: any) => 
        rewrite.source === '/((?!api|_next|_static|favicon.ico).*)'
      );
      expect(rootRewrite.destination).toBe('/');
    });
  });

  describe('vercel.json structure validation', () => {
    let config: any;

    beforeAll(() => {
      if (fs.existsSync(vercelConfigPath)) {
        const configContent = fs.readFileSync(vercelConfigPath, 'utf8');
        config = JSON.parse(configContent);
      }
    });

    test('should not contain deprecated fields', () => {
      // Check for deprecated fields that might cause issues
      expect(config).not.toHaveProperty('builds');
      expect(config).not.toHaveProperty('routes');
    });

    test('should not contain invalid function configurations', () => {
      // Ensure no invalid function configurations that cause deployment failures
      expect(config).not.toHaveProperty('functions');
    });

    test('should have valid rewrite rules structure', () => {
      if (config.rewrites) {
        config.rewrites.forEach((rewrite: any) => {
          expect(rewrite).toHaveProperty('source');
          expect(rewrite).toHaveProperty('destination');
          expect(typeof rewrite.source).toBe('string');
          expect(typeof rewrite.destination).toBe('string');
          expect(rewrite.source.trim()).not.toBe('');
          expect(rewrite.destination.trim()).not.toBe('');
        });
      }
    });

    test('should be minimal and deployment-safe', () => {
      // Ensure the configuration is minimal and won't cause deployment issues
      const allowedKeys = ['framework', 'rewrites'];
      const configKeys = Object.keys(config);
      configKeys.forEach(key => {
        expect(allowedKeys).toContain(key);
      });
    });
  });
});