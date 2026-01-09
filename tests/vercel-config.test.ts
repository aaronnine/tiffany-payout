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

    test('should contain buildCommand field', () => {
      expect(config).toHaveProperty('buildCommand');
      expect(typeof config.buildCommand).toBe('string');
      expect(config.buildCommand.trim()).not.toBe('');
    });

    test('should contain framework field set to nextjs', () => {
      expect(config).toHaveProperty('framework');
      expect(config.framework).toBe('nextjs');
    });

    test('should contain functions configuration for API routes', () => {
      expect(config).toHaveProperty('functions');
      expect(typeof config.functions).toBe('object');
    });

    test('should contain rewrites for proper routing', () => {
      expect(config).toHaveProperty('rewrites');
      expect(Array.isArray(config.rewrites)).toBe(true);
    });

    test('buildCommand should be npm run build', () => {
      expect(config.buildCommand).toBe('npm run build');
    });

    test('functions should configure API routes properly', () => {
      const apiRouteKey = 'src/app/api/**/*.ts';
      expect(Object.keys(config.functions)).toContain(apiRouteKey);
      const apiConfig = config.functions[apiRouteKey];
      expect(apiConfig).toHaveProperty('runtime');
      expect(apiConfig.runtime).toBe('nodejs20.x');
    });

    test('rewrites should handle SPA routing', () => {
      const hasRootRewrite = config.rewrites.some((rewrite: any) => 
        rewrite.source === '/((?!api|_next|_static|favicon.ico).*)'
      );
      expect(hasRootRewrite).toBe(true);
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

    test('should have proper function configuration structure', () => {
      if (config.functions) {
        Object.values(config.functions).forEach((funcConfig: any) => {
          expect(funcConfig).toHaveProperty('runtime');
          if (funcConfig.memory) {
            expect(typeof funcConfig.memory).toBe('number');
            expect(funcConfig.memory).toBeGreaterThan(0);
          }
          if (funcConfig.maxDuration) {
            expect(typeof funcConfig.maxDuration).toBe('number');
            expect(funcConfig.maxDuration).toBeGreaterThan(0);
          }
        });
      }
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
  });
});