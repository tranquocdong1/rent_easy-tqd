import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatPropertyType = (type?: string) => {
  switch (type) {
    case 'HOUSE':
      return 'Nhà nguyên căn';
    case 'BOARDING_HOUSE':
      return 'Phòng trọ';
    case 'MINI_APARTMENT':
      return 'Chung cư mini';
    case 'OTHER':
      return 'Khác';
    default:
      return type || '-';
  }
};

export const formatGender = (gender?: string | null) => {
  switch (gender) {
    case 'MALE':
      return 'Nam';
    case 'FEMALE':
      return 'Nữ';
    case 'OTHER':
      return 'Khác';
    default:
      return gender || '-';
  }
};
