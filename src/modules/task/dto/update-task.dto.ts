import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Trim } from 'src/common/transforms';

export class UpdateTaskDto {
  @IsOptional()
  @Trim()
  @IsString({ message: 'El nombre debe ser una cadena' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100, { message: 'El nombre debe tener menos de 100 caracteres' })
  name?: string;

  @IsOptional()
  @Trim()
  @IsString({ message: 'La descripción debe ser una cadena' })
  @MinLength(3, { message: 'La descripción debe tener al menos 3 caracteres' })
  // Mismo límite que al crear (antes 100 al editar vs 250 al crear)
  @MaxLength(250, {
    message: 'La descripción debe tener menos de 250 caracteres',
  })
  description?: string;

  @IsOptional()
  @IsBoolean()
  priority?: boolean;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
