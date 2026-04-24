import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, IsBoolean, IsInt } from "class-validator";

export class UpdateTaskDto {

    @IsOptional()
    @IsString({ message: "El nombre debe ser una cadena" })
    @MinLength(3, { message: "El nombre debe tener al menos 3 caracteres" })
    @MaxLength(100, { message: "El nombre debe tener menos de 100 caracteres" })
    name!: string;

    @IsOptional()
    @IsString({ message: "La descripción debe ser una cadena" })
    @MinLength(3, { message: "La descripción debe tener al menos 3 caracteres" })
    @MaxLength(100, { message: "La descripción debe tener menos de 100 caracteres" })
    description!: string;

    @IsOptional()
    @IsBoolean()
    priority!: boolean;

    @IsOptional()
    @IsBoolean()
    completed!: boolean;
}