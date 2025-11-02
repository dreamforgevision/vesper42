const request = require('supertest');
const app = require('../api-server');

describe('API Endpoints', () => {
  
  describe('GET /api/health', () => {
    test('should return status ok', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.message).toContain('VESPER42');
    });
  });

  describe('GET /api/stats', () => {
    test('should return stats object', async () => {
      const response = await request(app).get('/api/stats');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toHaveProperty('scripts');
      expect(response.body.stats).toHaveProperty('scenes');
      expect(response.body.stats).toHaveProperty('dialogue_lines');
      expect(response.body.stats).toHaveProperty('learned_patterns');
    });

    test('should return valid numbers', async () => {
      const response = await request(app).get('/api/stats');
      expect(typeof response.body.stats.scripts).toBe('number');
      expect(response.body.stats.scripts).toBeGreaterThanOrEqual(0);
    });
  });

  describe('GET /api/genres', () => {
    test('should return array of genres', async () => {
      const response = await request(app).get('/api/genres');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.genres)).toBe(true);
    });
  });

  describe('GET /api/examples/:genre', () => {
    test('should return examples for valid genre', async () => {
      const response = await request(app).get('/api/examples/Action');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.examples)).toBe(true);
    });
  });

  describe('POST /api/generate-outline', () => {
    test('should generate outline with valid input', async () => {
      const response = await request(app)
        .post('/api/generate-outline')
        .send({
          premise: 'Test premise',
          genre: 'Action',
          targetLength: 110
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.outline).toHaveProperty('premise');
      expect(response.body.outline).toHaveProperty('genre');
      expect(response.body.outline).toHaveProperty('structure');
      expect(response.body.outline).toHaveProperty('act1');
      expect(response.body.outline).toHaveProperty('act2a');
      expect(response.body.outline).toHaveProperty('act2b');
      expect(response.body.outline).toHaveProperty('act3');
    });

    test('should fail without premise', async () => {
      const response = await request(app)
        .post('/api/generate-outline')
        .send({
          genre: 'Action',
          targetLength: 110
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail without genre', async () => {
      const response = await request(app)
        .post('/api/generate-outline')
        .send({
          premise: 'Test premise',
          targetLength: 110
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should validate structure page numbers', async () => {
      const response = await request(app)
        .post('/api/generate-outline')
        .send({
          premise: 'Test premise',
          genre: 'Action',
          targetLength: 110
        });
      
      const structure = response.body.outline.structure;
      expect(structure.totalPages).toBe(110);
      expect(structure.act1End).toBeLessThan(structure.act2aMidpoint);
      expect(structure.act2aMidpoint).toBeLessThan(structure.act2bEnd);
      expect(structure.act2bEnd).toBeLessThan(structure.act3End);
    });

    test('should include prediction data', async () => {
      const response = await request(app)
        .post('/api/generate-outline')
        .send({
          premise: 'Test premise',
          genre: 'Action',
          targetLength: 110
        });
      
      const prediction = response.body.outline.prediction;
      expect(prediction).toHaveProperty('probability');
      expect(prediction).toHaveProperty('confidence');
      expect(prediction).toHaveProperty('reasoning');
      expect(prediction.probability).toBeGreaterThanOrEqual(0);
      expect(prediction.probability).toBeLessThanOrEqual(1);
    });
  });
});
