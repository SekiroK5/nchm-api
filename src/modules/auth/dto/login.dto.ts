import { IsNotEmpty, IsString, MinLength, MaxLength } from "class-validator";

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3, { message: "El nombre de usuario debe tener al menos 3 caracteres" })
    @MaxLength(100, { message: "El nombre de usuario debe tener menos de 100 caracteres" })
    username!: string;
    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
    @MaxLength(50, { message: "La contraseña debe tener menos de 16 caracteres" })
    password!: string;
}