import express from 'express';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { corsOptions } from './config/cors';
import { swaggerDocument } from './config/swagger';
import { errorHandler } from './middlewares/error-handler';
import { notFoundHandler } from './middlewares/not-found';
import { env } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import clientRoutes from './modules/clients/clients.routes';
import vehicleRoutes from './modules/vehicles/vehicles.routes';

const app = express();

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors(corsOptions));

// Static files for uploads
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// Swagger UI
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// OpenAPI spec as JSON
app.get('/docs/openapi.json', (_req, res) => {
  res.json(swaggerDocument);
});

// OpenAPI spec as YAML
app.get('/docs/openapi.yaml', (_req, res) => {
  res.set('Content-Type', 'text/yaml');
  res.send(YAML.stringify(swaggerDocument));
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Module routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/vehicles', vehicleRoutes);
// app.use('/api/work-orders', workOrderRoutes);
// app.use('/api/maintenance-reminders', maintenanceReminderRoutes);
// app.use('/api/reports', reportRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
