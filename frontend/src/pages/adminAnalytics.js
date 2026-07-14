import { useEffect, useMemo, useState } from 'react';
import {
  FiActivity,
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiCpu,
  FiRefreshCw,
  FiTruck,
  FiUsers,
} from 'react-icons/fi';

import analyticsService from '../services/analyticsService';
import '../styles/analytics.css';

const STATUS_LABELS = {
  pending: 'Pendentes',
  approved: 'Aprovadas',
  rejected: 'Rejeitadas',
  cancelled: 'Canceladas',
  return_pending: 'Devolução pendente',
  completed: 'Concluídas',
};

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

function SummaryCard({ icon, label, value, detail, tone = 'blue' }) {
  return (
    <article className={`analytics-summary-card analytics-tone-${tone}`}>
      <div className="analytics-summary-head">
        <span className="analytics-summary-label">{label}</span>
        <span className="analytics-summary-icon" aria-hidden="true">
          {icon}
        </span>
      </div>
      <strong className="analytics-summary-value">{value}</strong>
      <span className="analytics-summary-detail">{detail}</span>
    </article>
  );
}

function Panel({ kicker, title, description, children, className = '' }) {
  return (
    <section className={`analytics-panel ${className}`.trim()}>
      <header className="analytics-panel-header">
        <div>
          <span className="analytics-kicker">{kicker}</span>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      <div className="analytics-panel-body">{children}</div>
    </section>
  );
}

function BarList({
  items,
  labelKey,
  valueKey,
  valueFormatter = (value) => formatNumber(value),
  secondaryKey,
  emptyMessage,
}) {
  const normalizedItems = safeArray(items);
  const maxValue = Math.max(
    ...normalizedItems.map((item) => toNumber(item?.[valueKey])),
    1
  );

  if (normalizedItems.length === 0) {
    return <div className="analytics-empty">{emptyMessage}</div>;
  }

  return (
    <div className="analytics-bar-list">
      {normalizedItems.map((item, index) => {
        const value = toNumber(item?.[valueKey]);
        const width = Math.max((value / maxValue) * 100, value > 0 ? 5 : 0);

        return (
          <div
            className="analytics-bar-item"
            key={`${item?.[labelKey] || 'item'}-${index}`}
          >
            <div className="analytics-bar-label-row">
              <div>
                <strong>{item?.[labelKey] || 'Não informado'}</strong>
                {secondaryKey && item?.[secondaryKey] ? (
                  <span>{item[secondaryKey]}</span>
                ) : null}
              </div>
              <b>{valueFormatter(value, item)}</b>
            </div>

            <div className="analytics-bar-track" aria-hidden="true">
              <span style={{ '--analytics-bar-width': `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MaintenanceList({ alerts }) {
  const normalizedAlerts = safeArray(alerts);

  if (normalizedAlerts.length === 0) {
    return (
      <div className="analytics-maintenance-ok">
        <FiCheckCircle />
        <div>
          <strong>Nenhum alerta ativo</strong>
          <span>A frota está fora das faixas críticas de manutenção.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-alert-list">
      {normalizedAlerts.map((alert) => (
        <article
          className={`analytics-maintenance-alert level-${alert.level || 'attention'}`}
          key={alert.vehicleId || alert.message}
        >
          <FiAlertTriangle />
          <div>
            <strong>{alert.vehicleLabel || 'Veículo'}</strong>
            <p>{alert.message || 'Revisão necessária.'}</p>
            <span>
              {alert.licensePlate || 'Sem placa'} ·{' '}
              {formatNumber(alert.kmUntilMaintenance)} km até a manutenção
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function AdminAnalytics() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadOverview() {
      setLoading(true);
      setErrorMessage('');

      try {
        const data = await analyticsService.getOverview({
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
  }, [refreshKey]);

  const metrics = overview?.metrics || null;
  const summary = metrics?.summary || {};
  const rentalMetrics = metrics?.rentals || {};
  const receivedCounts = overview?.receivedCounts || {};

  const vehicleUsage = safeArray(metrics?.vehicleUsage);
  const departmentUsage = safeArray(metrics?.departmentUsage);
  const mileageByVehicle = safeArray(metrics?.mileageByVehicle);
  const maintenanceAlerts = safeArray(metrics?.maintenanceAlerts);
  const insights = safeArray(overview?.insights);
  const warnings = safeArray(overview?.warnings);

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

  return (
    <div className="analytics-page">
      <section className="analytics-hero">
        <div className="analytics-hero-copy">
          <span className="analytics-kicker analytics-kicker-light">
            Fleet Intelligence
          </span>
          <h1>Inteligência da Frota</h1>
          <p>
            Indicadores operacionais calculados pelo serviço Python com Pandas,
            consumidos com segurança pelo backend Node.
          </p>

          <div className="analytics-hero-meta">
            <span
              className={`analytics-service-pill ${
                pythonAvailable ? 'is-online' : 'is-degraded'
              }`}
            >
              <FiCpu />
              {pythonAvailable ? 'Python disponível' : 'Modo degradado'}
            </span>
            <span>
              Atualizado em{' '}
              {formatDateTime(overview?.generatedAt || summary.generatedAt)}
            </span>
          </div>
        </div>

        <div className="analytics-hero-highlight">
          <span>
            {isDegraded ? 'Serviço analítico' : 'Veículo mais solicitado'}
          </span>
          <strong>
            {isDegraded
              ? 'Temporariamente indisponível'
              : summary?.topVehicleByRentals?.vehicleLabel || 'Sem dados'}
          </strong>
          <p>
            {isDegraded
              ? 'Os dados básicos continuam disponíveis pelo backend Node.'
              : summary?.topVehicleByRentals
                ? `${formatNumber(
                    summary.topVehicleByRentals.totalRentals
                  )} reservas · ${formatNumber(
                    summary.topVehicleByRentals.totalDurationHours,
                    1
                  )} horas`
                : 'Aguardando histórico suficiente.'}
          </p>
        </div>

        <button
          type="button"
          className="analytics-refresh"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
        >
          <FiRefreshCw className={loading ? 'is-spinning' : ''} />
          Atualizar
        </button>
      </section>

      {loading ? (
        <div className="analytics-state analytics-state-loading">
          <FiActivity className="is-spinning" />
          Calculando indicadores da frota...
        </div>
      ) : null}

      {!loading && errorMessage ? (
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

      {!loading && !errorMessage && overview ? (
        isDegraded ? (
          <>
            <div className="analytics-state analytics-state-warning">
              <FiAlertTriangle />
              <div>
                <strong>Analytics temporariamente indisponível</strong>
                <span>
                  O backend Node continua respondendo, mas rankings, médias,
                  quilometragem e alertas dependem do serviço Python.
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
                detail="Quantidade preservada pelo fallback do Node."
                tone="blue"
                icon={<FiBarChart2 />}
              />
              <SummaryCard
                label="Veículos"
                value={formatNumber(totalVehicles)}
                detail="Quantidade preservada pelo fallback do Node."
                tone="indigo"
                icon={<FiTruck />}
              />
              <SummaryCard
                label="Usuários"
                value={formatNumber(totalUsers)}
                detail="Quantidade preservada pelo fallback do Node."
                tone="cyan"
                icon={<FiUsers />}
              />
            </section>

            <section className="analytics-degraded-panel">
              <div className="analytics-degraded-icon" aria-hidden="true">
                <FiCpu />
              </div>

              <div className="analytics-degraded-copy">
                <span className="analytics-kicker">Fallback ativo</span>
                <h2>O Fleet Manager continua operacional</h2>
                <p>
                  Reservas, veículos e usuários continuam disponíveis. As áreas
                  analíticas foram ocultadas para não exibir gráficos vazios ou
                  valores que poderiam parecer reais.
                </p>

                {warnings.length > 0 ? (
                  <span className="analytics-degraded-warning">
                    {warnings.join(' · ')}
                  </span>
                ) : null}
              </div>

              <div className="analytics-degraded-status">
                <span>Node backend</span>
                <strong>Disponível</strong>
                <span>Python Analytics</span>
                <strong>Indisponível</strong>
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
                label="Reservas"
                value={formatNumber(totalRentals)}
                detail="Registros analisados no histórico."
                tone="blue"
                icon={<FiBarChart2 />}
              />
              <SummaryCard
                label="Veículos"
                value={formatNumber(totalVehicles)}
                detail="Veículos incluídos no dataset."
                tone="indigo"
                icon={<FiTruck />}
              />
              <SummaryCard
                label="Usuários"
                value={formatNumber(totalUsers)}
                detail="Usuários representados na análise."
                tone="cyan"
                icon={<FiUsers />}
              />
              <SummaryCard
                label="Duração média"
                value={`${formatNumber(averageDuration, 2)} h`}
                detail="Tempo médio das solicitações."
                tone="green"
                icon={<FiClock />}
              />
              <SummaryCard
                label="Km registrados"
                value={`${formatNumber(totalMileage)} km`}
                detail="Soma do histórico de quilometragem."
                tone="amber"
                icon={<FiActivity />}
              />
              <SummaryCard
                label="Manutenção"
                value={formatNumber(maintenanceCount)}
                detail="Alertas que exigem acompanhamento."
                tone={maintenanceCount > 0 ? 'red' : 'green'}
                icon={<FiAlertTriangle />}
              />
            </section>

            {insights.length > 0 ? (
              <section className="analytics-insights">
                <div className="analytics-insights-title">
                  <FiActivity />
                  <div>
                    <span className="analytics-kicker">Leitura automática</span>
                    <h2>Principais insights</h2>
                  </div>
                </div>

                <div className="analytics-insights-grid">
                  {insights.map((insight, index) => (
                    <article key={`${insight}-${index}`}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <p>{insight}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="analytics-main-grid">
              <Panel
                kicker="Distribuição"
                title="Reservas por status"
                description="Leitura do fluxo operacional completo."
              >
                <BarList
                  items={statusItems}
                  labelKey="label"
                  valueKey="total"
                  emptyMessage="Nenhuma reserva disponível para análise."
                />
              </Panel>

              <Panel
                kicker="Ranking"
                title="Uso por veículo"
                description="Veículos ordenados pelo número de solicitações."
              >
                <BarList
                  items={vehicleUsage}
                  labelKey="vehicleLabel"
                  secondaryKey="licensePlate"
                  valueKey="totalRentals"
                  valueFormatter={(value, item) =>
                    `${formatNumber(value)} reservas · ${formatNumber(
                      item?.totalDurationHours,
                      1
                    )} h`
                  }
                  emptyMessage="Nenhum uso de veículo registrado."
                />
              </Panel>

              <Panel
                kicker="Demanda"
                title="Uso por departamento"
                description="Áreas que mais solicitaram veículos."
              >
                <BarList
                  items={departmentUsage}
                  labelKey="department"
                  valueKey="total"
                  valueFormatter={(value) =>
                    `${formatNumber(value)} solicitações`
                  }
                  emptyMessage="Nenhum departamento disponível."
                />
              </Panel>

              <Panel
                kicker="Quilometragem"
                title="Km por veículo"
                description="Acúmulo calculado a partir do histórico de devoluções."
              >
                <BarList
                  items={mileageByVehicle}
                  labelKey="vehicleLabel"
                  secondaryKey="licensePlate"
                  valueKey="totalMileageDelta"
                  valueFormatter={(value, item) =>
                    `${formatNumber(value)} km · ${formatNumber(
                      item?.records
                    )} registros`
                  }
                  emptyMessage="Nenhum histórico de quilometragem disponível."
                />
              </Panel>
            </div>

            <Panel
              kicker="Prevenção"
              title="Alertas de manutenção"
              description="Sinais calculados a partir da quilometragem e do ciclo de manutenção."
              className="analytics-maintenance-panel"
            >
              <MaintenanceList alerts={maintenanceAlerts} />
            </Panel>
          </>
        )
      ) : null}
    </div>
  );
}
