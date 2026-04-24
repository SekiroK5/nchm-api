import { IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(100)
    name!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(250)
    description!: string;

    @IsNotEmpty()
    @IsBoolean()
    priority!: boolean;

    @IsOptional()
    @IsInt()
    user_id!: number;

}