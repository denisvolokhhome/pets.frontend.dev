/**
 * Utility functions for pet-related operations
 */

/**
 * Calculate the age of a pet from their date of birth
 * @param dateOfBirth - The pet's date of birth as a string
 * @returns A human-readable age string (e.g., "2 years 3 months", "5 months", "10 days")
 */
export function calculatePetAge(dateOfBirth: string): string {
  if (!dateOfBirth) return 'Unknown';
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  
  // Check if date is valid
  if (isNaN(birthDate.getTime())) {
    return 'Invalid date';
  }
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  // Adjust for negative months
  if (months < 0) {
    years--;
    months += 12;
  }
  
  // Format the output
  if (years > 0) {
    const yearText = `${years} year${years > 1 ? 's' : ''}`;
    const monthText = months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : '';
    return yearText + monthText;
  } else if (months > 0) {
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    const days = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
}

/**
 * Get the opposite gender
 * @param gender - Current gender ('Male' or 'Female')
 * @returns The opposite gender as a string
 */
export function getOppositeGender(gender: string): string {
  if (gender === 'Male') {
    return 'Female';
  } else if (gender === 'Female') {
    return 'Male';
  }
  return '';
}
