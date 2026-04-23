export class User {
    id!: number;
    name!: string;
    lastName!: string;
    username!: string;
    hashToken?: string | null;
    password?: string;
    created_at?: Date;
}