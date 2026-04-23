import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateUserDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(100)
    name!: string;
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(100)
    lastName!: string;
}