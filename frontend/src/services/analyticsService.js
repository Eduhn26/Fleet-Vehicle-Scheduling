import api from './api';

function removeEmptyFilters(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => String(value || '').trim())
  );
}

const analyticsService = {
  async getOverview({ filters = {}, signal } = {}) {
    const response = await api.get('/analytics/overview', {
      params: removeEmptyFilters(filters),
      signal,
    });

    return response?.data?.data ?? null;
  },
};

export default analyticsService;
