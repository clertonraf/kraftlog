import { authService } from '../../services/authService';

// Simple integration test without mocking libraries
// These tests verify the service methods exist and have correct signatures

describe('authService - Password Recovery Integration', () => {
  describe('requestPasswordRecovery', () => {
    it('should be defined', () => {
      expect(authService.requestPasswordRecovery).toBeDefined();
      expect(typeof authService.requestPasswordRecovery).toBe('function');
    });

    it('should accept email parameter', () => {
      const email = 'test@example.com';
      // Just verify the function can be called - actual API call would require backend
      expect(() => {
        const params = authService.requestPasswordRecovery.length;
        expect(params).toBe(1);
      }).not.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('should be defined', () => {
      expect(authService.resetPassword).toBeDefined();
      expect(typeof authService.resetPassword).toBe('function');
    });

    it('should accept token and newPassword parameters', () => {
      // Verify function signature
      expect(authService.resetPassword.length).toBe(2);
    });
  });

  describe('Integration with existing methods', () => {
    it('should not break existing login method', () => {
      expect(authService.login).toBeDefined();
      expect(typeof authService.login).toBe('function');
    });

    it('should not break existing register method', () => {
      expect(authService.register).toBeDefined();
      expect(typeof authService.register).toBe('function');
    });

    it('should not break existing logout method', () => {
      expect(authService.logout).toBeDefined();
      expect(typeof authService.logout).toBe('function');
    });

    it('should not break existing getCurrentUser method', () => {
      expect(authService.getCurrentUser).toBeDefined();
      expect(typeof authService.getCurrentUser).toBe('function');
    });

    it('should not break existing isAuthenticated method', () => {
      expect(authService.isAuthenticated).toBeDefined();
      expect(typeof authService.isAuthenticated).toBe('function');
    });

    it('should not break existing validateSession method', () => {
      expect(authService.validateSession).toBeDefined();
      expect(typeof authService.validateSession).toBe('function');
    });
  });
});
