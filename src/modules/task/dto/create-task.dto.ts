import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Trim } from 'src/common/transforms';

export class CreateTaskDto {
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
  @MaxLength(250)
  description!: string;

  @IsNotEmpty()
  @IsBoolean()
  priority!: boolean;

  // user_id ya no se acepta del cliente: el dueño siempre es el usuario autenticado.
}
