use mamr-db;

Create table User (
    id Int @default(autoincrement()) @id,
    name String @db.VarChar(200),
    lastname String @db.VarChar(250),
    username String @db.VarChar(100),
    password String,
    created_at DateTime @default(now())
    tasks Task[]
);

create table task(
    id Int @default(autoincrement()) @id,
    name String @db.VarChar(150),
    description String @db.VarChar(200),
    priority Boolean,
    user_id Int,
    user User @relation(fields: [user_id], references: [id])
);