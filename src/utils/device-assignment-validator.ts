
import { isSupabaseUUID } from '@/types/device-ids';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AssignmentData {
  deviceId: string;
  groupId: string;
  deviceExists?: boolean;
  groupExists?: boolean;
}

export class DeviceAssignmentValidator {
  static validateAssignmentData(data: AssignmentData): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate device ID is a Supabase UUID
    if (!data.deviceId) {
      result.errors.push('Device ID is required');
      result.isValid = false;
    } else if (!isSupabaseUUID(data.deviceId)) {
      result.errors.push(`Invalid device ID format: ${data.deviceId}. Must be a Supabase UUID.`);
      result.isValid = false;
    }

    // Validate group ID is a Supabase UUID
    if (!data.groupId) {
      result.errors.push('Group ID is required');
      result.isValid = false;
    } else if (!isSupabaseUUID(data.groupId)) {
      result.errors.push(`Invalid group ID format: ${data.groupId}. Must be a Supabase UUID.`);
      result.isValid = false;
    }

    // Check existence flags if provided
    if (data.deviceExists === false) {
      result.errors.push('Device does not exist');
      result.isValid = false;
    }

    if (data.groupExists === false) {
      result.errors.push('Group does not exist');
      result.isValid = false;
    }

    return result;
  }

  static generateTestCases(): AssignmentData[] {
    return [
      // Valid case - both proper Supabase UUIDs
      {
        deviceId: '123e4567-e89b-12d3-a456-426614174000',
        groupId: '987fcdeb-51a2-43d1-9876-123456789abc',
        deviceExists: true,
        groupExists: true
      },
      // Invalid device ID format
      {
        deviceId: 'invalid-uuid',
        groupId: '987fcdeb-51a2-43d1-9876-123456789abc',
        deviceExists: true,
        groupExists: true
      },
      // Invalid group ID format
      {
        deviceId: '123e4567-e89b-12d3-a456-426614174000',
        groupId: 'invalid-group-id',
        deviceExists: true,
        groupExists: true
      },
      // Missing device ID
      {
        deviceId: '',
        groupId: '987fcdeb-51a2-43d1-9876-123456789abc',
        deviceExists: false,
        groupExists: true
      },
      // Missing group ID
      {
        deviceId: '123e4567-e89b-12d3-a456-426614174000',
        groupId: '',
        deviceExists: true,
        groupExists: false
      }
    ];
  }

  static runTests(): void {
    console.log('🧪 Running Device Assignment Validation Tests...');
    
    const testCases = this.generateTestCases();
    
    testCases.forEach((testCase, index) => {
      console.log(`\n📋 Test Case ${index + 1}:`, testCase);
      
      const result = this.validateAssignmentData(testCase);
      
      console.log(`✅ Valid: ${result.isValid}`);
      if (result.errors.length > 0) {
        console.log(`❌ Errors:`, result.errors);
      }
      if (result.warnings.length > 0) {
        console.log(`⚠️ Warnings:`, result.warnings);
      }
    });
    
    console.log('\n🎉 Validation tests complete!');
  }
}
