import { hasPermission, assertPermission, Permission } from '../../utils/permissions'
import type { UserRole } from '../../types'

describe('hasPermission', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('admin role', () => {
    it('should have all permissions', () => {
      const permissions: Permission[] = [
        'create_products', 'edit_products', 'delete_products',
        'view_reports', 'create_notes', 'manage_movements',
        'manage_users', 'system_settings', 'view_history', 'manage_backup'
      ]
      for (const perm of permissions) {
        expect(hasPermission('admin', perm)).toBe(true)
      }
    })
  })

  describe('manager role', () => {
    it('should have create_products permission', () => {
      expect(hasPermission('manager', 'create_products')).toBe(true)
    })

    it('should NOT have delete_products permission', () => {
      expect(hasPermission('manager', 'delete_products')).toBe(false)
    })

    it('should NOT have manage_users permission', () => {
      expect(hasPermission('manager', 'manage_users')).toBe(false)
    })

    it('should NOT have system_settings permission', () => {
      expect(hasPermission('manager', 'system_settings')).toBe(false)
    })
  })

  describe('operator role', () => {
    it('should have manage_movements permission', () => {
      expect(hasPermission('operator', 'manage_movements')).toBe(true)
    })

    it('should NOT have view_reports permission', () => {
      expect(hasPermission('operator', 'view_reports')).toBe(false)
    })

    it('should NOT have view_history permission', () => {
      expect(hasPermission('operator', 'view_history')).toBe(false)
    })
  })

  describe('viewer role', () => {
    it('should only have view_reports permission', () => {
      expect(hasPermission('viewer', 'view_reports')).toBe(true)
    })

    it('should NOT have create_products permission', () => {
      expect(hasPermission('viewer', 'create_products')).toBe(false)
    })

    it('should NOT have manage_movements permission', () => {
      expect(hasPermission('viewer', 'manage_movements')).toBe(false)
    })
  })

  describe('vendedor role', () => {
    it('should have create_notes permission', () => {
      expect(hasPermission('vendedor', 'create_notes')).toBe(true)
    })

    it('should NOT have view_reports permission', () => {
      expect(hasPermission('vendedor', 'view_reports')).toBe(false)
    })
  })

  describe('contador role', () => {
    it('should have view_reports permission', () => {
      expect(hasPermission('contador', 'view_reports')).toBe(true)
    })

    it('should NOT have create_products permission', () => {
      expect(hasPermission('contador', 'create_products')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should return false for unknown role', () => {
      expect(hasPermission('unknown' as UserRole, 'create_products')).toBe(false)
    })
  })
})

describe('assertPermission', () => {
  it('should not throw for valid permission', () => {
    expect(() => assertPermission('admin', 'manage_users')).not.toThrow()
  })

  it('should throw for invalid permission', () => {
    expect(() => assertPermission('viewer', 'manage_users')).toThrow('Sem permissão')
  })

  it('should throw for null role', () => {
    expect(() => assertPermission(null, 'manage_users')).toThrow('Sem permissão')
  })

  it('should throw for undefined role', () => {
    expect(() => assertPermission(undefined, 'manage_users')).toThrow('Sem permissão')
  })
})
