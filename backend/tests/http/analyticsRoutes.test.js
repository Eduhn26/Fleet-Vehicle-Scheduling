jest.mock('../../src/services/analyticsService');

const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');

const analyticsService = require('../../src/services/analyticsService');
const analyticsRoutes = require('../../src/routes/analyticsRoutes');
const errorHandler = require('../../src/middleware/errorHandler');
const AppError = require('../../src/utils/AppError');

const TEST_SECRET = 'phase-13-k-test-secret';

const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use((req, _res, next) => {
    req.id = 'analytics-route-test';
    next();
  });

  app.use('/api/analytics', analyticsRoutes);
  app.use(errorHandler);

  return app;
};

const createToken = (role = 'admin') =>
  jwt.sign(
    {
      userId: `${role}-user-id`,
      role,
    },
    TEST_SECRET,
    { expiresIn: '5m' }
  );

describe('analyticsRoutes', () => {
  const originalSecret = process.env.JWT_SECRET;
  let app;
  let consoleErrorSpy;

  beforeAll(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    app = createTestApp();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalSecret;
    }

    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    analyticsService.getAnalyticsHealth.mockReturnValue({
      status: 'OK',
      phase: '13.I',
    });

    analyticsService.getAnalyticsOverview.mockResolvedValue({
      status: 'OK',
      phase: '13.I',
      metrics: {
        summary: {
          totalRentals: 39,
        },
      },
    });

    analyticsService.getAnalyticsExport.mockResolvedValue({
      status: 'OK',
      phase: '13.I',
      filename: 'fleet-analytics-power-bi.json',
      tables: {
        summary: [],
      },
    });
  });

  test('rejects an unauthenticated analytics request', async () => {
    const response = await request(app).get('/api/analytics/overview');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        message: 'Token ausente',
        requestId: 'analytics-route-test',
      },
    });
    expect(analyticsService.getAnalyticsOverview).not.toHaveBeenCalled();
  });

  test('rejects a regular user from admin analytics routes', async () => {
    const response = await request(app)
      .get('/api/analytics/overview')
      .set('Authorization', `Bearer ${createToken('user')}`);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe('Acesso negado');
    expect(analyticsService.getAnalyticsOverview).not.toHaveBeenCalled();
  });

  test('returns analytics health to an authenticated admin', async () => {
    const response = await request(app)
      .get('/api/analytics/health')
      .set('Authorization', `Bearer ${createToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        status: 'OK',
        phase: '13.I',
      },
      requestId: 'analytics-route-test',
    });
    expect(analyticsService.getAnalyticsHealth).toHaveBeenCalledTimes(1);
  });

  test('forwards overview filters to the analytics service', async () => {
    const response = await request(app)
      .get(
        '/api/analytics/overview?status=approved&department=Opera%C3%A7%C3%B5es&startDate=2026-01-01'
      )
      .set('Authorization', `Bearer ${createToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.data.metrics.summary.totalRentals).toBe(39);
    expect(analyticsService.getAnalyticsOverview).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'approved',
        department: 'Operações',
        startDate: '2026-01-01',
      })
    );
  });

  test('downloads a JSON export with attachment headers', async () => {
    const response = await request(app)
      .get('/api/analytics/export/json?status=completed')
      .set('Authorization', `Bearer ${createToken()}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="fleet-analytics-power-bi.json"'
    );
    expect(response.body.tables).toEqual({ summary: [] });
    expect(analyticsService.getAnalyticsExport).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
      })
    );
  });

  test('downloads an Excel-compatible CSV with UTF-8 BOM', async () => {
    const csv = 'rentalId;status\r\nrental-1;approved\r\n';

    analyticsService.getAnalyticsExport.mockResolvedValue({
      status: 'OK',
      phase: '13.I',
      table: 'rentals',
      filename: 'fleet-analytics-rentals.csv',
      csv,
    });

    const response = await request(app)
      .get('/api/analytics/export/csv?table=rentals&status=approved')
      .set('Authorization', `Bearer ${createToken()}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/csv/);
    expect(response.headers['content-disposition']).toBe(
      'attachment; filename="fleet-analytics-rentals.csv"'
    );
    expect(response.text.charCodeAt(0)).toBe(0xfeff);
    expect(response.text.slice(1)).toBe(csv);
    expect(analyticsService.getAnalyticsExport).toHaveBeenCalledWith(
      expect.objectContaining({
        table: 'rentals',
        status: 'approved',
      }),
      'rentals'
    );
  });

  test('preserves operational error semantics from the service layer', async () => {
    analyticsService.getAnalyticsExport.mockRejectedValue(
      new AppError('Tabela de exportação inválida.', 422)
    );

    const response = await request(app)
      .get('/api/analytics/export/csv?table=users')
      .set('Authorization', `Bearer ${createToken()}`);

    expect(response.status).toBe(422);
    expect(response.body.error).toEqual({
      message: 'Tabela de exportação inválida.',
      requestId: 'analytics-route-test',
    });
  });
});
