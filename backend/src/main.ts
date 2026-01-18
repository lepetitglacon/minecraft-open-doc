import { NestFactory } from '@nestjs/core';
import { RootModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(RootModule);

  app.enableCors({
    origin: true, // Autorise toutes les origines en dev
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server is running on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
