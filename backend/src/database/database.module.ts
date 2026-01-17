import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ||
        'mongodb://admin:strongpassword@localhost:27017/minecraft-wiki?authSource=admin',
    ),
  ],
})
export class DatabaseModule {}
