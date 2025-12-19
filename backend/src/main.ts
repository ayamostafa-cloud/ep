import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

async function bootstrap() {
  // Load .env BEFORE anything else
  dotenv.config();

  console.log("BACKEND DB URI =>", process.env.MONGO_URI);

  const app = await NestFactory.create(AppModule);

  // =============================
  //          FIXED CORS
  // =============================
  app.enableCors({
    origin: "http://localhost:3000",   // frontend
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  

  // ---- SWAGGER ----
  const config = new DocumentBuilder()
    .setTitle('Employee Profile API')
    .setDescription('API documentation for Employee Profile, Change Requests, Disputes, and Manager Views')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const PORT = process.env.PORT || 3001;
  await app.listen(PORT);

  console.log(`Backend running at http://localhost:${PORT} 🚀`);
  console.log(`Swagger running at http://localhost:${PORT}/api 🟢`);
}

bootstrap();
