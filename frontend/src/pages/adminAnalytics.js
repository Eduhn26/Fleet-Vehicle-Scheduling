import { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiDatabase,
  FiDownload,
  FiFileText,
  FiFilter,
  FiRefreshCw,
  FiTruck,
  FiUsers,
  FiX,
} from 'react-icons/fi';

import analyticsService from '../services/analyticsService';
import '../styles/analytics.css';

const STATUS_META = {
  pending: {
    label: 'Pendentes',
    group: 'operational',
    panelTitle: 'Aguardando decisão',
    description: 'Solicitações que ainda aguardam aprovação ou rejeição.',
  },
  approved: {
    label: 'Ativas',
    group: 'operational',
    panelTitle: 'Reservas em andamento',
    description: 'Reservas autorizadas que ainda não concluíram o ciclo operacional.',
  },
  return_pending: {
    label: 'Devolução pendente',
    group: 'operational',
    panelTitle: 'Aguardando devolução',
    description: 'Reservas que aguardam a confirmação final da devolução do veículo.',
  },
  completed: {
    label: 'Concluídas',
    group: 'historical',
    panelTitle: 'Fluxo concluído',
    description: 'Reservas encerradas com o ciclo operacional finalizado.',
  },
  rejected: {
    label: 'Rejeitadas',
    group: 'historical',
    panelTitle: 'Solicitações rejeitadas',
    description: 'Solicitações encerradas sem aprovação administrativa.',
  },
  cancelled: {
    label: 'Canceladas',
    group: 'historical',
    panelTitle: 'Reservas canceladas',
    description: 'Reservas encerradas por cancelamento antes da conclusão do ciclo.',
  },
};

const STATUS_LABELS = Object.fromEntries(
  Object.entries(STATUS_META).map(([key, meta]) => [key, meta.label])
);

const OPERATIONAL_STATUS_KEYS = ['pending', 'approved', 'return_pending'];
const HISTORICAL_STATUS_KEYS = ['completed', 'rejected', 'cancelled'];

function isOperationalStatus(status) {
  return STATUS_META[status]?.group === 'operational';
}

function getStatusInsight(status, total) {
  const count = toNumber(total);

  switch (status) {
    case 'pending':
      return `${formatReservationCount(count)} ${pluralize(
        count,
        'aguarda',
        'aguardam'
      )} decisão no recorte atual.`;
    case 'approved':
      return `${formatReservationCount(count)} ${pluralize(
        count,
        'está ativa',
        'estão ativas'
      )} no recorte atual.`;
    case 'return_pending':
      return `${formatReservationCount(count)} ${pluralize(
        count,
        'aguarda',
        'aguardam'
      )} confirmação de devolução.`;
    case 'completed':
      return `${formatReservationCount(count)} ${pluralize(
        count,
        'foi concluída',
        'foram concluídas'
      )} no recorte atual.`;
    case 'rejected':
      return `${formatReservationCount(count)} ${pluralize(
        count,
        'foi rejeitada',
        'foram rejeitadas'
      )} no recorte atual.`;
    case 'cancelled':
      return `${formatReservationCount(count)} ${pluralize(
        count,
        'foi cancelada',
        'foram canceladas'
      )} no recorte atual.`;
    default:
      return `O recorte reúne ${formatReservationCount(count)}.`;
  }
}

const STATUS_COLORS = {
  completed: '#2563eb',
  approved: '#10b981',
  pending: '#f59e0b',
  rejected: '#f97316',
  cancelled: '#ef4444',
  return_pending: '#8b5cf6',
};

const EXPORT_TABLE_OPTIONS = [
  { value: 'summary', label: 'Resumo executivo' },
  { value: 'rentals', label: 'Reservas' },
  { value: 'vehicles', label: 'Veículos' },
  { value: 'mileageHistory', label: 'Histórico de quilometragem' },
  { value: 'rentalsByStatus', label: 'Reservas por status' },
  { value: 'vehicleUsage', label: 'Reservas por veículo' },
  { value: 'departmentUsage', label: 'Demanda por departamento' },
  { value: 'rentalTrend', label: 'Evolução das reservas' },
  { value: 'maintenanceAlerts', label: 'Alertas de manutenção' },
];

const EMPTY_FILTERS = {
  startDate: '',
  endDate: '',
  status: '',
  vehicleId: '',
  department: '',
};

function countActiveFilters(filters) {
  if (!filters) return 0;

  const hasPeriod = Boolean(filters.startDate || filters.endDate);
  return (
    (hasPeriod ? 1 : 0) +
    ['status', 'vehicleId', 'department'].filter((key) =>
      String(filters[key] || '').trim()
    ).length
  );
}

function areFiltersEqual(current, next) {
  return Object.keys(EMPTY_FILTERS).every(
    (key) => String(current?.[key] || '') === String(next?.[key] || '')
  );
}

function formatFilterPeriod(filters) {
  if (!filters?.startDate && !filters?.endDate) return 'histórico completo';
  if (filters.startDate && filters.endDate) {
    return `${filters.startDate.split('-').reverse().join('/')} até ${filters.endDate
      .split('-')
      .reverse()
      .join('/')}`;
  }
  if (filters.startDate) {
    return `A partir de ${filters.startDate.split('-').reverse().join('/')}`;
  }
  return `Até ${filters.endDate.split('-').reverse().join('/')}`;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatNumber(value, maximumFractionDigits = 0) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits,
  }).format(toNumber(value));
}

function formatDateTime(value) {
  if (!value) return 'Agora';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Agora';

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    'Não foi possível carregar os indicadores de inteligência.'
  );
}

function pluralize(count, singular, plural) {
  return toNumber(count) === 1 ? singular : plural;
}

function formatReservationCount(value) {
  const count = toNumber(value);
  return `${formatNumber(count)} ${pluralize(count, 'reserva', 'reservas')}`;
}

function formatAlertCount(value) {
  const count = toNumber(value);
  return `${formatNumber(count)} ${pluralize(count, 'alerta', 'alertas')}`;
}

function getTopItem(items, valueKey) {
  return safeArray(items).reduce((best, item) => {
    if (!best) return item;
    return toNumber(item?.[valueKey]) > toNumber(best?.[valueKey]) ? item : best;
  }, null);
}

function buildContextualInsights({
  filters,
  totalRentals,
  averageDuration,
  totalMileage,
  vehicleUsage,
  departmentUsage,
  statusItems,
  maintenanceAlerts,
  selectedVehicleLabel,
}) {
  if (totalRentals <= 0) return [];

  const insights = [];
  const topVehicle = getTopItem(vehicleUsage, 'totalRentals');
  const topDepartment = getTopItem(departmentUsage, 'total');
  const predominantStatus = getTopItem(statusItems, 'total');
  const firstMaintenanceAlert = safeArray(maintenanceAlerts)[0];
  const hasPeriodFilter = Boolean(filters?.startDate || filters?.endDate);

  const add = (value) => {
    if (value && insights.length < 3 && !insights.includes(value)) {
      insights.push(value);
    }
  };

  if (filters?.vehicleId) {
    const vehicleName = selectedVehicleLabel || 'O veículo selecionado';
    const contextParts = [];

    if (filters?.department) {
      contextParts.push(`para ${filters.department}`);
    }

    if (filters?.status) {
      contextParts.push(`com status "${STATUS_LABELS[filters.status] || filters.status}"`);
    }

    add(
      `${vehicleName} registrou ${formatReservationCount(totalRentals)}${
        contextParts.length ? ` ${contextParts.join(' ')}` : ''
      } no recorte atual.`
    );

    if (averageDuration > 0) {
      add(
        `A duração média das reservas foi de ${formatNumber(
          averageDuration,
          2
        )} h.`
      );
    } else if (predominantStatus) {
      add(
        `O status mais frequente foi "${predominantStatus.label}", com ${formatReservationCount(
          predominantStatus.total
        )}.`
      );
    }

    if (firstMaintenanceAlert) {
      const kmUntilMaintenance = toNumber(firstMaintenanceAlert.kmUntilMaintenance);

      add(
        kmUntilMaintenance <= 0
          ? `${vehicleName} está com a manutenção vencida.`
          : `A próxima manutenção de ${vehicleName} está prevista em ${formatNumber(
              kmUntilMaintenance
            )} km.`
      );
    } else {
      add(`${vehicleName} não possui alertas de manutenção ativos.`);
    }

    return insights.slice(0, 3);
  }

  if (filters?.department) {
    add(
      `${filters.department} registrou ${formatReservationCount(
        totalRentals
      )} no recorte atual.`
    );

    if (topVehicle) {
      add(
        `${topVehicle.vehicleLabel || 'O veículo líder'} foi o veículo mais reservado pela área, com ${formatReservationCount(
          topVehicle.totalRentals
        )}.`
      );
    }

    if (filters?.status) {
      add(
        `As reservas exibidas estão concentradas no status "${
          STATUS_LABELS[filters.status] || filters.status
        }".`
      );
    } else if (predominantStatus) {
      add(
        `O status mais frequente foi "${predominantStatus.label}", com ${formatReservationCount(
          predominantStatus.total
        )}.`
      );
    }

    if (insights.length < 3 && averageDuration > 0) {
      add(
        `A duração média das reservas da área foi de ${formatNumber(
          averageDuration,
          2
        )} h.`
      );
    }

    return insights.slice(0, 3);
  }

  if (filters?.status) {
    add(getStatusInsight(filters.status, totalRentals));

    if (topVehicle) {
      add(
        `${topVehicle.vehicleLabel || 'O veículo líder'} concentra o maior volume ${
          isOperationalStatus(filters.status) ? 'neste estágio' : 'neste resultado'
        }, com ${formatReservationCount(topVehicle.totalRentals)}.`
      );
    }

    if (topDepartment) {
      add(
        `${topDepartment.department || 'A área líder'} concentra a maior demanda ${
          isOperationalStatus(filters.status) ? 'neste estágio' : 'neste resultado'
        }, com ${formatReservationCount(topDepartment.total)}.`
      );
    }

    return insights.slice(0, 3);
  }

  if (hasPeriodFilter) {
    add(
      `${formatReservationCount(totalRentals)} ${pluralize(
        totalRentals,
        'foi registrada',
        'foram registradas'
      )} no período selecionado.`
    );
  } else if (topVehicle) {
    add(
      `${topVehicle.vehicleLabel || 'O veículo líder'} lidera as reservas da frota, com ${formatReservationCount(
        topVehicle.totalRentals
      )}.`
    );
  }

  if (topVehicle && hasPeriodFilter) {
    add(
      `${topVehicle.vehicleLabel || 'O veículo líder'} foi o veículo mais reservado no período, com ${formatReservationCount(
        topVehicle.totalRentals
      )}.`
    );
  }

  if (topDepartment) {
    add(
      `${topDepartment.department || 'A área líder'} concentra a maior demanda, com ${formatReservationCount(
        topDepartment.total
      )}.`
    );
  }

  if (insights.length < 3) {
    const alertCount = safeArray(maintenanceAlerts).length;
    add(
      alertCount > 0
        ? `${formatAlertCount(alertCount)} de manutenção ${pluralize(
            alertCount,
            'exige',
            'exigem'
          )} acompanhamento.`
        : 'Não há alertas de manutenção ativos na frota.'
    );
  }

  if (insights.length < 3 && totalMileage > 0) {
    add(
      `${formatNumber(totalMileage)} km ${pluralize(
        totalMileage,
        'foi registrado',
        'foram registrados'
      )} no período analisado.`
    );
  }

  return insights.slice(0, 3);
}

function SummaryCard({ icon, label, value, detail, tone = 'blue' }) {
  return (
    <article className={`analytics-summary-card analytics-tone-${tone}`}>
      <div className="analytics-summary-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="analytics-summary-content">
        <span className="analytics-summary-label">{label}</span>
        <strong className="analytics-summary-value">{value}</strong>
        <span className="analytics-summary-detail">{detail}</span>
      </div>
    </article>
  );
}

function AnalyticsFilters({
  draftFilters,
  filterOptions,
  loading,
  activeCount,
  onChange,
  onClear,
}) {
  const statuses = safeArray(filterOptions?.statuses);
  const vehicles = safeArray(filterOptions?.vehicles);
  const departments = safeArray(filterOptions?.departments);
  const dateBounds = filterOptions?.dateBounds || {};

  const operationalStatuses = OPERATIONAL_STATUS_KEYS.filter((status) =>
    statuses.includes(status)
  );
  const historicalStatuses = HISTORICAL_STATUS_KEYS.filter((status) =>
    statuses.includes(status)
  );
  const otherStatuses = statuses.filter(
    (status) =>
      !OPERATIONAL_STATUS_KEYS.includes(status) &&
      !HISTORICAL_STATUS_KEYS.includes(status)
  );

  return (
    <section className="analytics-filter-card" id="analytics-filters">
      <div className="analytics-filter-heading">
        <div>
          <span className="analytics-section-eyebrow">Análise</span>
          <strong>Filtros da análise</strong>
        </div>

        <div className="analytics-filter-heading-meta">
          <span className="analytics-filter-context">
            {activeCount > 0
              ? `${activeCount} ${pluralize(activeCount, 'filtro ativo', 'filtros ativos')}`
              : 'Histórico completo'}
          </span>
          <span className={`analytics-filter-live ${loading ? 'is-loading' : ''}`}>
            {loading ? <FiActivity className="is-spinning" /> : <i />}
            {loading ? 'Atualizando dados...' : 'Atualização automática'}
          </span>
          {activeCount > 0 ? (
            <button
              type="button"
              className="analytics-filter-reset"
              onClick={onClear}
              disabled={loading}
            >
              Limpar filtros
            </button>
          ) : null}
        </div>
      </div>

      <div className="analytics-filter-form">
        <label className="analytics-filter-field">
          <span>Data inicial</span>
          <div className="analytics-filter-control">
            <FiCalendar />
            <input
              type="date"
              name="startDate"
              value={draftFilters.startDate}
              min={dateBounds.min || undefined}
              max={draftFilters.endDate || dateBounds.max || undefined}
              onChange={onChange}
            />
          </div>
        </label>

        <label className="analytics-filter-field">
          <span>Data final</span>
          <div className="analytics-filter-control">
            <FiCalendar />
            <input
              type="date"
              name="endDate"
              value={draftFilters.endDate}
              min={draftFilters.startDate || dateBounds.min || undefined}
              max={dateBounds.max || undefined}
              onChange={onChange}
            />
          </div>
        </label>

        <label className="analytics-filter-field">
          <span>Status</span>
          <select name="status" value={draftFilters.status} onChange={onChange}>
            <option value="">Todos os status</option>

            {operationalStatuses.length > 0 ? (
              <optgroup label="EM ANDAMENTO">
                {operationalStatuses.map((status) => (
                  <option value={status} key={status}>
                    {STATUS_LABELS[status] || status}
                  </option>
                ))}
              </optgroup>
            ) : null}

            {historicalStatuses.length > 0 ? (
              <optgroup label="ENCERRADAS">
                {historicalStatuses.map((status) => (
                  <option value={status} key={status}>
                    {STATUS_LABELS[status] || status}
                  </option>
                ))}
              </optgroup>
            ) : null}

            {otherStatuses.length > 0 ? (
              <optgroup label="OUTROS">
                {otherStatuses.map((status) => (
                  <option value={status} key={status}>
                    {STATUS_LABELS[status] || status}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </label>

        <label className="analytics-filter-field">
          <span>Veículo</span>
          <select
            name="vehicleId"
            value={draftFilters.vehicleId}
            onChange={onChange}
          >
            <option value="">Todos</option>
            {vehicles.map((vehicle) => (
              <option value={vehicle.id} key={vehicle.id}>
                {vehicle.label}
                {vehicle.licensePlate ? ` · ${vehicle.licensePlate}` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="analytics-filter-field">
          <span>Departamento</span>
          <select
            name="department"
            value={draftFilters.department}
            onChange={onChange}
          >
            <option value="">Todos</option>
            {departments.map((department) => (
              <option value={department} key={department}>
                {department}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

function ActiveFilterChips({ filters, filterOptions, onRemove, onClear }) {
  const chips = [];
  const vehicles = safeArray(filterOptions?.vehicles);

  if (filters.startDate || filters.endDate) {
    chips.push({
      key: 'period',
      label: `Período: ${formatFilterPeriod(filters)}`,
    });
  }

  if (filters.status) {
    chips.push({
      key: 'status',
      label: `Status: ${STATUS_LABELS[filters.status] || filters.status}`,
    });
  }

  if (filters.vehicleId) {
    const vehicle = vehicles.find((item) => item.id === filters.vehicleId);
    chips.push({
      key: 'vehicleId',
      label: `Veículo: ${vehicle?.label || 'Selecionado'}`,
    });
  }

  if (filters.department) {
    chips.push({
      key: 'department',
      label: `Departamento: ${filters.department}`,
    });
  }

  if (chips.length === 0) return null;

  return (
    <section className="analytics-active-filters" aria-label="Filtros ativos">
      <div className="analytics-active-filter-list">
        {chips.map((chip) => (
          <button
            type="button"
            className="analytics-active-filter-chip"
            key={chip.key}
            onClick={() => onRemove(chip.key)}
            aria-label={`Remover filtro ${chip.label}`}
          >
            <span>{chip.label}</span>
            <FiX aria-hidden="true" />
          </button>
        ))}
      </div>

      <button type="button" className="analytics-active-filter-clear" onClick={onClear}>
        Limpar todos
      </button>
    </section>
  );
}

function InsightList({ insights }) {
  const normalizedInsights = safeArray(insights).slice(0, 3);

  if (normalizedInsights.length === 0) {
    return (
      <div className="analytics-empty-state">
        Ainda não há dados suficientes para gerar destaques neste recorte.
      </div>
    );
  }

  return (
    <div className="analytics-insight-list">
      {normalizedInsights.map((insight, index) => (
        <article key={`${insight}-${index}`}>
          <span className="analytics-insight-index">
            {String(index + 1).padStart(2, '0')}
          </span>
          <p>{insight}</p>
        </article>
      ))}
    </div>
  );
}

function MaintenanceList({ alerts }) {
  const normalizedAlerts = safeArray(alerts).slice(0, 4);

  if (normalizedAlerts.length === 0) {
    return (
      <div className="analytics-maintenance-ok">
        <FiCheckCircle />
        <div>
          <strong>Nenhum alerta de manutenção</strong>
          <span>Não há veículos nas faixas de atenção ou crítica.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-maintenance-list">
      {normalizedAlerts.map((alert) => (
        <article
          className={`analytics-maintenance-item level-${alert.level || 'attention'}`}
          key={alert.vehicleId || alert.message}
        >
          <span className="analytics-maintenance-symbol" aria-hidden="true">
            <FiAlertTriangle />
          </span>

          <div>
            <strong>{alert.vehicleLabel || 'Veículo'}</strong>
            <span>
              {alert.licensePlate || 'Sem placa'} ·{' '}
              {toNumber(alert.kmUntilMaintenance) <= 0
                ? 'Manutenção vencida'
                : `Próxima manutenção em ${formatNumber(alert.kmUntilMaintenance)} km`}
            </span>
          </div>

          <b>{alert.level === 'critical' ? 'Crítico' : 'Atenção'}</b>
        </article>
      ))}
    </div>
  );
}

function TrendChart({ items }) {
  const data = safeArray(items);

  if (data.length === 0) {
    return (
      <div className="analytics-empty-state">
        Nenhuma reserva encontrada no período selecionado.
      </div>
    );
  }

  if (data.length === 1) {
    const item = data[0];

    return (
      <div className="analytics-trend-single">
        <span>{item?.label || 'Período selecionado'}</span>
        <strong>{formatNumber(item?.total)}</strong>
        <b>reservas</b>
        <p>
          O recorte possui apenas um período com registros. Amplie o intervalo para comparar a evolução das reservas.
        </p>
      </div>
    );
  }

  if (data.length === 2) {
    const first = data[0];
    const second = data[1];
    const firstValue = toNumber(first?.total);
    const secondValue = toNumber(second?.total);
    const change = firstValue > 0 ? ((secondValue - firstValue) / firstValue) * 100 : null;

    return (
      <div className="analytics-trend-comparison">
        <article>
          <span>{first?.label || 'Período inicial'}</span>
          <strong>{formatNumber(firstValue)}</strong>
          <small>reservas</small>
        </article>

        <div className="analytics-trend-comparison-change">
          <span>Comparação entre períodos</span>
          <strong>
            {change === null
              ? 'Sem base anterior'
              : `${change >= 0 ? '+' : ''}${formatNumber(change, 1)}%`}
          </strong>
          <small>variação no recorte analisado</small>
        </div>

        <article>
          <span>{second?.label || 'Período final'}</span>
          <strong>{formatNumber(secondValue)}</strong>
          <small>reservas</small>
        </article>
      </div>
    );
  }

  const width = 720;
  const height = 238;
  const padding = { top: 18, right: 22, bottom: 38, left: 50 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const values = data.map((item) => toNumber(item?.total));
  const maxValue = Math.max(...values, 1);
  const chartMax = Math.ceil((maxValue * 1.12) / 10) * 10 || 10;
  const xStep = plotWidth / (data.length - 1);

  const points = data.map((item, index) => {
    const x = padding.left + index * xStep;
    const y = padding.top + plotHeight - (toNumber(item?.total) / chartMax) * plotHeight;
    return { x, y, item };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${
    padding.top + plotHeight
  } L ${points[0].x} ${padding.top + plotHeight} Z`;

  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const value = chartMax - chartMax * ratio;
    const y = padding.top + plotHeight * ratio;
    return { value, y };
  });

  return (
    <div className="analytics-chart-wrap">
      <svg
        className="analytics-trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Gráfico de evolução mensal das reservas"
      >
        <defs>
          <linearGradient id="analyticsAreaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => (
          <g key={`${tick.value}-${tick.y}`}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={tick.y}
              y2={tick.y}
              className="analytics-chart-gridline"
            />
            <text
              x={padding.left - 12}
              y={tick.y + 4}
              textAnchor="end"
              className="analytics-chart-axis"
            >
              {formatNumber(tick.value)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#analyticsAreaFill)" />
        <path d={linePath} className="analytics-chart-line" />

        {points.map((point, index) => (
          <g key={`${point.item?.label || 'period'}-${index}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5.5"
              className="analytics-chart-point"
            >
              <title>
                {point.item?.label}: {formatNumber(point.item?.total)} reservas
              </title>
            </circle>
            <text
              x={point.x}
              y={height - 14}
              textAnchor="middle"
              className="analytics-chart-axis analytics-chart-x-axis"
            >
              {point.item?.label || ''}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function OperationalStageSummary({
  status,
  total,
  vehicleCount,
  averageDuration,
  activePeriods,
}) {
  const meta = STATUS_META[status] || {
    label: STATUS_LABELS[status] || status,
    panelTitle: 'Etapa operacional',
    description: 'Reservas que permanecem nesta etapa do fluxo.',
  };

  return (
    <div className="analytics-stage-summary">
      <div className="analytics-stage-summary-main">
        <span className="analytics-status-kind is-operational">Em andamento</span>
        <strong>{formatNumber(total)}</strong>
        <h3>{meta.panelTitle}</h3>
        <p>{meta.description}</p>
      </div>

      <div className="analytics-stage-summary-metrics">
        <article>
          <span>Veículos envolvidos</span>
          <strong>{formatNumber(vehicleCount)}</strong>
        </article>

        <article>
          <span>Duração média</span>
          <strong>{formatNumber(averageDuration, 2)} h</strong>
        </article>

        <article>
          <span>Períodos com atividade</span>
          <strong>{formatNumber(activePeriods)}</strong>
        </article>
      </div>

      <small>
        Este status representa o estado atual das reservas nesta etapa, não um
        histórico de todas as aprovações ou transições já realizadas.
      </small>
    </div>
  );
}

function StatusContextPanel({ status, total }) {
  const meta = STATUS_META[status];

  if (!meta) {
    return (
      <div className="analytics-empty-state">
        Nenhum contexto adicional disponível para este status.
      </div>
    );
  }

  const operational = meta.group === 'operational';

  return (
    <div className="analytics-status-context">
      <div>
        <span
          className={`analytics-status-kind ${
            operational ? 'is-operational' : 'is-historical'
          }`}
        >
          {operational ? 'Em andamento' : 'Encerrada'}
        </span>

        <strong>{meta.panelTitle}</strong>
        <p>{meta.description}</p>
      </div>

      <div className="analytics-status-context-total">
        <strong>{formatNumber(total)}</strong>
        <span>{pluralize(total, 'reserva neste recorte', 'reservas neste recorte')}</span>
      </div>

      <div className="analytics-status-context-note">
        {operational
          ? 'O volume mostra as reservas que permanecem atualmente nesta etapa do fluxo.'
          : 'Este status representa um resultado final e pode acumular histórico ao longo do tempo.'}
      </div>
    </div>
  );
}

function StatusDistribution({ items, total }) {
  const normalizedItems = safeArray(items).filter(
    (item) => toNumber(item?.total) > 0
  );
  const safeTotal = Math.max(toNumber(total), 1);

  if (normalizedItems.length === 0) {
    return (
      <div className="analytics-empty-state">
        Nenhuma reserva disponível para análise.
      </div>
    );
  }

  return (
    <div className="analytics-status-distribution">
      <div className="analytics-status-total">
        <strong>{formatNumber(total)}</strong>
        <span>reservas no período</span>
      </div>

      <div
        className="analytics-status-track"
        role="img"
        aria-label="Distribuição percentual das reservas por status"
      >
        {normalizedItems.map((item) => {
          const percentage = (toNumber(item.total) / safeTotal) * 100;
          const color = STATUS_COLORS[item.status] || '#64748b';

          return (
            <span
              key={item.status || item.label}
              style={{
                '--analytics-segment-size': `${percentage}%`,
                '--analytics-segment-color': color,
              }}
              title={`${item.label}: ${formatNumber(item.total)} (${formatNumber(
                percentage,
                1
              )}%)`}
            />
          );
        })}
      </div>

      <div className="analytics-status-legend">
        {normalizedItems.map((item) => {
          const percentage = (toNumber(item.total) / safeTotal) * 100;
          const color = STATUS_COLORS[item.status] || '#64748b';

          return (
            <div key={item.status || item.label}>
              <span
                className="analytics-status-dot"
                style={{ '--analytics-status-color': color }}
                aria-hidden="true"
              />
              <strong>{item.label}</strong>
              <span>{formatNumber(item.total)}</span>
              <b>{formatNumber(percentage, 1)}%</b>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RankingList({
  items,
  labelKey,
  valueKey,
  secondaryKey,
  valueFormatter = (value) => formatNumber(value),
  emptyMessage,
  limit = 5,
}) {
  const normalizedItems = safeArray(items).slice(0, limit);
  const maxValue = Math.max(
    ...normalizedItems.map((item) => toNumber(item?.[valueKey])),
    1
  );

  if (normalizedItems.length === 0) {
    return <div className="analytics-empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="analytics-ranking-list">
      {normalizedItems.map((item, index) => {
        const value = toNumber(item?.[valueKey]);
        const width = Math.max((value / maxValue) * 100, value > 0 ? 5 : 0);

        return (
          <article key={`${item?.[labelKey] || 'item'}-${index}`}>
            <span className="analytics-ranking-position">{index + 1}</span>

            <div className="analytics-ranking-content">
              <div className="analytics-ranking-title-row">
                <div>
                  <strong>{item?.[labelKey] || 'Não informado'}</strong>
                  {secondaryKey && item?.[secondaryKey] ? (
                    <span>{item[secondaryKey]}</span>
                  ) : null}
                </div>
                <b>{valueFormatter(value, item)}</b>
              </div>

              <div className="analytics-ranking-track" aria-hidden="true">
                <span style={{ '--analytics-ranking-width': `${width}%` }} />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function AnalyticsCard({ title, action, children, id, className = '' }) {
  return (
    <section className={`analytics-card ${className}`.trim()} id={id}>
      <header className="analytics-card-header">
        <h2>{title}</h2>
        {action ? <span>{action}</span> : null}
      </header>
      <div className="analytics-card-body">{children}</div>
    </section>
  );
}

export default function AdminAnalytics() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [draftFilters, setDraftFilters] = useState({ ...EMPTY_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_FILTERS });
  const [filterError, setFilterError] = useState('');
  const [exportTable, setExportTable] = useState('rentals');
  const [exporting, setExporting] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOverview() {
      setLoading(true);
      setErrorMessage('');

      try {
        const data = await analyticsService.getOverview({
          filters: appliedFilters,
          signal: controller.signal,
        });
        setOverview(data);
      } catch (error) {
        if (error?.code === 'ERR_CANCELED') return;
        setErrorMessage(getErrorMessage(error));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadOverview();

    return () => controller.abort();
  }, [appliedFilters, refreshKey]);

  useEffect(() => {
    if (
      draftFilters.startDate &&
      draftFilters.endDate &&
      draftFilters.startDate > draftFilters.endDate
    ) {
      setFilterError('A data inicial não pode ser posterior à data final.');
      return undefined;
    }

    setFilterError('');

    const timeoutId = window.setTimeout(() => {
      setAppliedFilters((current) =>
        areFiltersEqual(current, draftFilters) ? current : { ...draftFilters }
      );
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [draftFilters]);

  const metrics = overview?.metrics || null;
  const summary = metrics?.summary || {};
  const rentalMetrics = metrics?.rentals || {};
  const receivedCounts = overview?.receivedCounts || {};

  const vehicleUsage = safeArray(metrics?.vehicleUsage);
  const departmentUsage = safeArray(metrics?.departmentUsage);
  const mileageByVehicle = safeArray(metrics?.mileageByVehicle);
  const maintenanceAlerts = safeArray(metrics?.maintenanceAlerts);
  const rentalTrend = safeArray(metrics?.rentalTrend);
  const warnings = safeArray(overview?.warnings);
  const filterOptions = overview?.filterOptions || {};
  const sourceCounts = overview?.sourceCounts || receivedCounts;

  const totalMileage = useMemo(
    () =>
      mileageByVehicle.reduce(
        (total, item) => total + toNumber(item?.totalMileageDelta),
        0
      ),
    [mileageByVehicle]
  );

  const statusItems = useMemo(
    () =>
      safeArray(rentalMetrics?.rentalsByStatus).map((item) => ({
        ...item,
        label: STATUS_LABELS[item?.status] || item?.status || 'Não informado',
      })),
    [rentalMetrics]
  );

  const isDegraded = overview?.status === 'DEGRADED' || !metrics;
  const pythonAvailable =
    overview?.pythonAnalyticsService?.status === 'available' && !isDegraded;

  const totalRentals =
    summary.totalRentals ?? receivedCounts.rentals ?? rentalMetrics.totalRentals ?? 0;
  const totalVehicles = summary.totalVehicles ?? receivedCounts.vehicles ?? 0;
  const totalUsers = summary.totalUsers ?? receivedCounts.users ?? 0;
  const averageDuration = summary.averageDurationHours ?? 0;
  const maintenanceCount =
    summary.maintenanceAlertsCount ?? maintenanceAlerts.length;

  const activeFilterCount = countActiveFilters(appliedFilters);
  const filteredPeriod = formatFilterPeriod(appliedFilters);
  const hasOverview = Boolean(overview);
  const isInitialLoading = loading && !hasOverview;
  const isRefreshing = loading && hasOverview;
  const totalSourceRentals = sourceCounts.rentals ?? totalRentals;
  const totalSourceVehicles = sourceCounts.vehicles ?? totalVehicles;
  const hasNoRentalResults = !isDegraded && totalRentals === 0;
  const selectedVehicle = safeArray(filterOptions?.vehicles).find(
    (vehicle) => vehicle.id === appliedFilters.vehicleId
  );
  const selectedVehicleLabel = selectedVehicle?.label || '';

  const contextualInsights = useMemo(
    () =>
      buildContextualInsights({
        filters: appliedFilters,
        totalRentals,
        averageDuration,
        totalMileage,
        vehicleUsage,
        departmentUsage,
        statusItems,
        maintenanceAlerts,
        selectedVehicleLabel,
      }),
    [
      appliedFilters,
      totalRentals,
      averageDuration,
      totalMileage,
      vehicleUsage,
      departmentUsage,
      statusItems,
      maintenanceAlerts,
      selectedVehicleLabel,
    ]
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setDraftFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilterError('');
    setDraftFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
  };

  const handleRemoveFilter = (key) => {
    setDraftFilters((current) => {
      if (key === 'period') {
        return {
          ...current,
          startDate: '',
          endDate: '',
        };
      }

      return {
        ...current,
        [key]: '',
      };
    });
  };

  const handleExport = async (format) => {
    setExporting(format);
    setExportMessage('');

    try {
      const filename = await analyticsService.downloadExport({
        format,
        table: exportTable,
        filters: appliedFilters,
      });
      setExportMessage(`Arquivo gerado: ${filename}`);
    } catch (error) {
      setExportMessage(
        getErrorMessage(error) || 'Não foi possível gerar a exportação.'
      );
    } finally {
      setExporting('');
    }
  };

  return (
    <div className={`analytics-page${isRefreshing ? ' is-refreshing' : ''}`} id="analytics-overview" aria-busy={loading}>
      <section className="analytics-page-header">
        <div>
          <div className="analytics-title-row">
            <span className="analytics-title-icon" aria-hidden="true">
              <FiBarChart2 />
            </span>
            <div>
              <h1>Inteligência da Frota</h1>
              <p>
                Acompanhe utilização, demanda, quilometragem e alertas operacionais
                da frota.
              </p>
            </div>
          </div>

          <div className="analytics-page-meta">
            <span
              className={`analytics-service-status ${
                pythonAvailable ? 'is-online' : 'is-degraded'
              }`}
            >
              <i />
              {pythonAvailable
                ? 'Serviço analítico online'
                : 'Serviço analítico com disponibilidade reduzida'}
            </span>
            <span className="analytics-updated-meta">
              <span>
                Atualizado em {formatDateTime(overview?.generatedAt || summary.generatedAt)}
              </span>
              <button
                type="button"
                className="analytics-inline-refresh"
                onClick={() => setRefreshKey((value) => value + 1)}
                disabled={loading}
                aria-label="Atualizar indicadores"
                title="Atualizar indicadores"
              >
                <FiRefreshCw className={isRefreshing ? 'is-spinning' : ''} />
              </button>
            </span>
            <span>Período: {filteredPeriod}</span>
          </div>
        </div>

        <div className="analytics-page-actions">
          <button
            type="button"
            className={`analytics-toolbar-button${filtersOpen ? ' is-active' : ''}`}
            onClick={() => setFiltersOpen((current) => !current)}
            aria-expanded={filtersOpen}
            aria-controls="analytics-filters"
          >
            <FiFilter />
            {filtersOpen ? 'Ocultar filtros' : 'Filtros'}
            {activeFilterCount > 0 ? <b>{activeFilterCount}</b> : null}
          </button>
        </div>
      </section>

      {filtersOpen ? (
        <AnalyticsFilters
          draftFilters={draftFilters}
          filterOptions={filterOptions}
          loading={isRefreshing}
          activeCount={activeFilterCount}
          onChange={handleFilterChange}
          onClear={handleClearFilters}
        />
      ) : null}

      {!filtersOpen ? (
        <ActiveFilterChips
          filters={appliedFilters}
          filterOptions={filterOptions}
          onRemove={handleRemoveFilter}
          onClear={handleClearFilters}
        />
      ) : null}

      {filterError ? (
        <div className="analytics-state analytics-state-error">
          <FiAlertTriangle />
          <div>
            <strong>Período inválido</strong>
            <span>{filterError}</span>
          </div>
        </div>
      ) : null}

      {isInitialLoading ? (
        <div className="analytics-state analytics-state-loading">
          <FiActivity className="is-spinning" />
          Calculando indicadores da frota...
        </div>
      ) : null}

      {errorMessage ? (
        <div className="analytics-state analytics-state-error">
          <FiAlertTriangle />
          <div>
            <strong>Falha ao carregar o painel</strong>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {overview ? (
        isDegraded ? (
          <>
            <div className="analytics-state analytics-state-warning">
              <FiAlertTriangle />
              <div>
                <strong>Análise operacional temporariamente indisponível</strong>
                <span>
                  Os dados básicos do sistema continuam disponíveis, mas os
                  indicadores avançados não puderam ser atualizados.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRefreshKey((value) => value + 1)}
              >
                Tentar novamente
              </button>
            </div>

            <section className="analytics-summary-grid analytics-summary-grid-degraded">
              <SummaryCard
                label="Reservas"
                value={formatNumber(totalRentals)}
                detail="Disponível enquanto os indicadores avançados são restabelecidos."
                tone="blue"
                icon={<FiBarChart2 />}
              />
              <SummaryCard
                label="Veículos"
                value={formatNumber(totalVehicles)}
                detail="Disponível enquanto os indicadores avançados são restabelecidos."
                tone="indigo"
                icon={<FiTruck />}
              />
              <SummaryCard
                label="Usuários"
                value={formatNumber(totalUsers)}
                detail="Disponível enquanto os indicadores avançados são restabelecidos."
                tone="cyan"
                icon={<FiUsers />}
              />
            </section>

            <section className="analytics-degraded-panel">
              <FiCpu />
              <div>
                <span className="analytics-section-eyebrow">Operação preservada</span>
                <h2>O Fleet Manager continua operacional</h2>
                <p>
                  Reservas, veículos e usuários continuam disponíveis. Os painéis
                  analíticos permanecem ocultos até a próxima atualização válida.
                </p>
                {warnings.length > 0 ? <small>{warnings.join(' · ')}</small> : null}
              </div>
            </section>
          </>
        ) : (
          <>
            {warnings.length > 0 ? (
              <div className="analytics-state analytics-state-warning">
                <FiAlertTriangle />
                <div>
                  <strong>Avisos de consistência</strong>
                  <span>{warnings.join(' · ')}</span>
                </div>
              </div>
            ) : null}

            <section className="analytics-summary-grid">
              <SummaryCard
                label={activeFilterCount > 0 ? 'Reservas no recorte' : 'Reservas'}
                value={formatNumber(totalRentals)}
                detail={
                  activeFilterCount > 0
                    ? `${formatNumber(totalRentals)} de ${formatNumber(
                        totalSourceRentals
                      )} no histórico.`
                    : 'Total no período analisado.'
                }
                tone="blue"
                icon={<FiCalendar />}
              />
              {appliedFilters.vehicleId ? (
                <SummaryCard
                  label="Períodos com atividade"
                  value={formatNumber(rentalTrend.length)}
                  detail={`${formatNumber(rentalTrend.length)} ${pluralize(
                    rentalTrend.length,
                    'período com reservas',
                    'períodos com reservas'
                  )} no recorte.`}
                  tone="indigo"
                  icon={<FiBarChart2 />}
                />
              ) : (
                <SummaryCard
                  label={activeFilterCount > 0 ? 'Veículos no recorte' : 'Veículos da frota'}
                  value={formatNumber(totalVehicles)}
                  detail={
                    activeFilterCount > 0
                      ? `${formatNumber(totalVehicles)} de ${formatNumber(
                          totalSourceVehicles
                        )} cadastrados.`
                      : 'Cadastrados no sistema.'
                  }
                  tone="indigo"
                  icon={<FiTruck />}
                />
              )}
              <SummaryCard
                label="Duração média"
                value={`${formatNumber(averageDuration, 2)} h`}
                detail={
                  activeFilterCount > 0
                    ? 'Tempo médio por reserva no recorte.'
                    : 'Tempo médio por reserva.'
                }
                tone="violet"
                icon={<FiClock />}
              />
              <SummaryCard
                label="Quilometragem registrada"
                value={`${formatNumber(totalMileage)} km`}
                detail={
                  activeFilterCount > 0
                    ? 'Percorridos no recorte analisado.'
                    : 'Percorridos no período analisado.'
                }
                tone="cyan"
                icon={<FiActivity />}
              />
              <SummaryCard
                label="Alertas de manutenção"
                value={formatNumber(maintenanceCount)}
                detail={
                  appliedFilters.vehicleId
                    ? 'Situação atual do veículo selecionado.'
                    : 'Exigem acompanhamento da frota.'
                }
                tone={maintenanceCount > 0 ? 'amber' : 'green'}
                icon={<FiAlertTriangle />}
              />
            </section>

            {hasNoRentalResults ? (
              <>
                <AnalyticsCard
                  title="Alertas de manutenção"
                  id="analytics-maintenance"
                  className="analytics-maintenance-card analytics-maintenance-card-wide"
                >
                  <MaintenanceList alerts={maintenanceAlerts} />
                </AnalyticsCard>

                <section className="analytics-no-results" role="status">
                  <span className="analytics-no-results-icon" aria-hidden="true">
                    <FiFilter />
                  </span>
                  <div>
                    <strong>
                      {activeFilterCount > 0
                        ? 'Nenhuma reserva encontrada com os filtros atuais'
                        : 'Ainda não há reservas disponíveis para análise'}
                    </strong>
                    <p>
                      {activeFilterCount > 0
                        ? 'Ajuste o período ou remova um dos filtros para ampliar a análise. Os alertas de manutenção continuam visíveis por representarem a situação atual da frota.'
                        : 'Assim que houver histórico de reservas, os gráficos e rankings serão exibidos aqui.'}
                    </p>
                  </div>
                  {activeFilterCount > 0 ? (
                    <button type="button" onClick={handleClearFilters}>
                      Limpar filtros
                    </button>
                  ) : null}
                </section>
              </>
            ) : (
              <>
                <section className="analytics-visual-grid analytics-visual-grid-priority">
                  {isOperationalStatus(appliedFilters.status) ? (
                    <AnalyticsCard
                      title={STATUS_META[appliedFilters.status]?.panelTitle || 'Etapa operacional'}
                      action="Estado atual"
                      id="analytics-trend"
                      className="analytics-trend-card analytics-stage-card"
                    >
                      <OperationalStageSummary
                        status={appliedFilters.status}
                        total={totalRentals}
                        vehicleCount={totalVehicles}
                        averageDuration={averageDuration}
                        activePeriods={rentalTrend.length}
                      />
                    </AnalyticsCard>
                  ) : (
                    <AnalyticsCard
                      title="Evolução das reservas"
                      action="Mensal"
                      id="analytics-trend"
                      className="analytics-trend-card"
                    >
                      <TrendChart items={rentalTrend} />
                    </AnalyticsCard>
                  )}

                  {appliedFilters.status ? (
                    <AnalyticsCard title="Contexto do status">
                      <StatusContextPanel
                        status={appliedFilters.status}
                        total={totalRentals}
                      />
                    </AnalyticsCard>
                  ) : (
                    <AnalyticsCard title="Reservas por status">
                      <StatusDistribution items={statusItems} total={totalRentals} />
                    </AnalyticsCard>
                  )}
                </section>

                <section className="analytics-decision-grid">
                  <AnalyticsCard title="Destaques da análise" className="analytics-insights-card">
                    <InsightList insights={contextualInsights} />
                  </AnalyticsCard>

                  <AnalyticsCard
                    title="Alertas de manutenção"
                    id="analytics-maintenance"
                    className="analytics-maintenance-card"
                  >
                    <MaintenanceList alerts={maintenanceAlerts} />
                  </AnalyticsCard>
                </section>

                <section className="analytics-ranking-grid">
                  <AnalyticsCard
                    title="Veículos mais reservados"
                    id="analytics-vehicles"
                  >
                    <RankingList
                      items={vehicleUsage}
                      labelKey="vehicleLabel"
                      secondaryKey="licensePlate"
                      valueKey="totalRentals"
                      valueFormatter={(value) => `${formatNumber(value)} reservas`}
                      emptyMessage="Nenhum uso de veículo registrado."
                    />
                  </AnalyticsCard>

                  <AnalyticsCard
                    title="Demanda por departamento"
                    id="analytics-departments"
                  >
                    <RankingList
                      items={departmentUsage}
                      labelKey="department"
                      valueKey="total"
                      valueFormatter={(value) => `${formatNumber(value)} solicitações`}
                      emptyMessage="Nenhum departamento disponível."
                    />
                  </AnalyticsCard>

                  <AnalyticsCard title="Quilometragem por veículo" id="analytics-mileage">
                    <RankingList
                      items={mileageByVehicle}
                      labelKey="vehicleLabel"
                      secondaryKey="licensePlate"
                      valueKey="totalMileageDelta"
                      valueFormatter={(value) => `${formatNumber(value)} km`}
                      emptyMessage="Nenhum histórico de quilometragem disponível."
                    />
                  </AnalyticsCard>
                </section>
              </>
            )}

            <section className="analytics-integration-card" id="analytics-integrations">
              <div className="analytics-integration-copy">
                <span className="analytics-integration-icon" aria-hidden="true">
                  <FiDatabase />
                </span>
                <div>
                  <span className="analytics-section-eyebrow">Dados</span>
                  <h2>Exportação de dados</h2>
                  <p>
                    Exporte os dados da análise atual em CSV ou JSON para uso em
                    relatórios e ferramentas externas.
                  </p>
                </div>
              </div>

              <div className="analytics-integration-controls">
                <label>
                  <span>Conjunto de dados</span>
                  <select
                    value={exportTable}
                    onChange={(event) => setExportTable(event.target.value)}
                    disabled={loading || exporting || !pythonAvailable}
                  >
                    {EXPORT_TABLE_OPTIONS.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="analytics-export-actions">
                  <button
                    type="button"
                    className="analytics-export-button secondary"
                    onClick={() => handleExport('json')}
                    disabled={loading || exporting || !pythonAvailable}
                  >
                    <FiFileText />
                    {exporting === 'json' ? 'Gerando...' : 'Exportar JSON'}
                  </button>
                  <button
                    type="button"
                    className="analytics-export-button"
                    onClick={() => handleExport('csv')}
                    disabled={loading || exporting || !pythonAvailable}
                  >
                    <FiDownload />
                    {exporting === 'csv' ? 'Gerando...' : 'Baixar CSV'}
                  </button>
                </div>

                {exportMessage ? (
                  <span className="analytics-export-message">{exportMessage}</span>
                ) : null}
              </div>
            </section>
          </>
        )
      ) : null}
    </div>
  );
}

