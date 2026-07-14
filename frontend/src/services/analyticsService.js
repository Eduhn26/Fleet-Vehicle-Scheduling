import api from './api';

function removeEmptyFilters(filters = {}) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => String(value || '').trim())
  );
}

function getDownloadFilename(contentDisposition, fallback) {
  const match = String(contentDisposition || '').match(/filename="?([^";]+)"?/i);
  return match?.[1] || fallback;
}

function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

const analyticsService = {
  async downloadExport({ format, table, filters = {} }) {
    const response = await api.get(`/analytics/export/${format}`, {
      params: {
        ...removeEmptyFilters(filters),
        ...(format === 'csv' ? { table } : {}),
      },
      responseType: 'blob',
    });

    const fallback =
      format === 'csv'
        ? `fleet-analytics-${table || 'export'}.csv`
        : 'fleet-analytics-power-bi.json';
    const filename = getDownloadFilename(
      response.headers['content-disposition'],
      fallback
    );

    saveBlob(response.data, filename);
    return filename;
  },

  async getOverview({ filters = {}, signal } = {}) {
    const response = await api.get('/analytics/overview', {
      params: removeEmptyFilters(filters),
      signal,
    });

    return response?.data?.data ?? null;
  },
};

export default analyticsService;
