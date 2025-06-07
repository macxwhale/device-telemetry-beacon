
import { isValidUUID, formatToUUID, isValidDeviceId } from '@/lib/uuid-utils';

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

    // Validate device ID (accepts both UUID and hybrid android_id-uuid format)
    if (!data.deviceId) {
      result.errors.push('Device ID is required');
      result.isValid = false;
    } else if (!isValidDeviceId(data.deviceId)) {
      result.errors.push(`Invalid device ID format: ${data.deviceId}. Expected UUID or android_id-uuid format.`);
      result.isValid = false;
    }

    // Validate group ID
    if (!data.groupId) {
      result.errors.push('Group ID is required');
      result.isValid = false;
    } else {
      const formattedGroupId = formatToUUID(data.groupId);
      if (!isValidUUID(formattedGroupId)) {
        result.errors.push(`Invalid group ID format: ${data.groupId}`);
        result.isValid = false;
      } else if (formattedGroupId !== data.groupId) {
        result.warnings.push(`Group ID will be formatted: ${data.groupId} → ${formattedGroupId}`);
      }
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
      // Valid cases
      {
        deviceId: '123e4567-e89b-12d3-a456-426614174000',
        groupId: '987fcdeb-51a2-43d1-9876-123456789abc',
        deviceExists: true,
        groupExists: true
      },
      // Hybrid device ID format (android_id-uuid)
      {
        deviceId: '110151380690111-18bd997a-d674-4afe-a05c-4fa964a7f5fc',
        groupId: '987fcdeb-51a2-43d1-9876-123456789abc',
        deviceExists: true,
        groupExists: true
      },
      // Invalid UUID formats
      {
        deviceId: 'invalid-uuid',
        groupId: '987fcdeb-51a2-43d1-9876-123456789abc',
        deviceExists: true,
        groupExists: true
      },
      // Missing hyphens (should be auto-formatted for group)
      {
        deviceId: '123e4567-e89b-12d3-a456-426614174000',
        groupId: '987fcdeb51a243d19876123456789abc',
        deviceExists: true,
        groupExists: true
      },
      // Missing data
      {
        deviceId: '',
        groupId: '987fcdeb-51a2-43d1-9876-123456789abc',
        deviceExists: false,
        groupExists: true
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
