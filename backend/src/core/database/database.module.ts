import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

console.log(process.env)

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ??
        'mongodb://admin:strongpassword@localhost:27017/minecraft-wiki?authSource=admin',
    ),
  ],
})
export class DatabaseModule {



}
