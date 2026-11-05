import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Trim } from 'src/common/transforms';

/**
 * Campos que un usuario puede editar de su perfil. Cualquier otro campo
 * (role, password, hashToken, username...) es descartado por el
 * ValidationPipe (whitelist).
 */
export class UpdateUserDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  lastName!: string;

  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-]{7,15}$/, {
    message: 'Debe ser un número de teléfono válido',
  })
  phone?: string;
}
