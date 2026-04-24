import { IsNotEmpty, MinLength, MaxLength, IsString, Matches, IsEmail, IsOptional } from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3, { message: "El nombre debe tener al menos 3 caracteres" })
    @MaxLength(100, { message: "El nombre debe tener menos de 100 caracteres" })
    name!: string;
    @IsString()
    @IsNotEmpty()
    @MinLength(3, { message: "El apellido debe tener al menos 3 caracteres" })
    @MaxLength(100, { message: "El apellido debe tener menos de 100 caracteres" })
    lastName!: string;
    @IsString()
    @IsNotEmpty()
    @MinLength(3, { message: "El nombre de usuario debe tener al menos 3 caracteres" })
    @MaxLength(100, { message: "El nombre de usuario debe tener menos de 100 caracteres" })
    username!: string;
    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
    @MaxLength(16, { message: "La contraseña debe tener menos de 16 caracteres" })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, { message: "La contraseña debe contener al menos una mayuscula, una minuscula, un numero y un caracter especial" })
    password!: string;

    @IsEmail({}, { message: "Debe ser un correo electrónico válido" })
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    @Matches(/^\+?[0-9\s\-]{7,15}$/, { message: "Debe ser un número de teléfono válido" })
    phone?: string;
}