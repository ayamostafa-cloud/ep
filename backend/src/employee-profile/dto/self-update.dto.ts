import { 
  IsEmail,
  IsOptional, 
  IsString, 
  Matches, 
  MaxLength, 
  ValidateNested 
} from 'class-validator';
import { Type } from 'class-transformer';

class AddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  country?: string;
}

export class SelfUpdateDto {
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-]{7,15}$/, { message: "Phone must be 7–15 digits and valid format ✅" })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: "Must be valid personal email format ✅" })
  @MaxLength(100)
  personalEmail?: string;

  @IsOptional()
  @IsEmail({}, { message: "Must be valid work email format ✅" })
  @MaxLength(100)
  workEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300, { message: "Biography too long (max 300 chars) ✅" })
  biography?: string;

  @IsOptional()
  @ValidateNested() 
  @Type(() => AddressDto)
  address?: AddressDto;
}
