import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ✅ NOVO: Bypass do aviso do ngrok (deve ser o PRIMEIRO middleware!)
  app.use((req: any, res: any, next: any) => {
    res.setHeader('ngrok-skip-browser-warning', 'true');
    next();
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // ✅ CORS configurado para aceitar requisições do frontend Next.js
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true, // Importante para cookies httpOnly
  });  
  
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
