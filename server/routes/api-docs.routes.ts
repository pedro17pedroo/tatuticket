import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { specs, swaggerUiOptions } from '../swagger.config.js';

const router = Router();

/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: API Documentation
 *     description: Interactive API documentation using Swagger UI
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: API documentation page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */

// Serve Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(specs, swaggerUiOptions));

// JSON spec endpoint
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// YAML spec endpoint
router.get('/yaml', (req, res) => {
  res.setHeader('Content-Type', 'text/yaml');
  res.send(specs);
});

export default router;