import api from './api';

const analyticsService = {
  async getOverview({ signal } = {}) {
    const response = await api.get('/analytics/overview', { signal });
    return response?.data?.data ?? null;
  },
};

export default analyticsService;
