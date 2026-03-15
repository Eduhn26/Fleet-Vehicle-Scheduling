import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import '../styles/dashboard.css';

// NOTE: Reservation modal that combines calendar availability and request submission flow.
function getApiErrorMessage(err, fallbackMessage) {
  const apiMessage = err?.response?.data?.error?.message;
  if (apiMessage) return apiMessage;
  return fallbackMessage;
}

function formatDateLocal(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDatesInMonth(year, month) {
  const date = new Date(year, month, 1);
  const dates = [];

  while (date.getMonth() === month) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  return dates;
}

function getStatusForDate(date, bookings) {
  const dateStr = formatDateLocal(date);
  const todayStr = formatDateLocal(new Date());

  if (dateStr < todayStr) return 'past';
  if (!bookings?.length) return 'available';

  const dayStart = new Date(`${dateStr}T00:00:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59`);

  const isBlocked = bookings.some((booking) => {
    const bookingStart = new Date(`${booking.startDate}T00:00:00`);
    const bookingEnd = new Date(`${booking.endDate}T23:59:59`);
    return bookingStart <= dayStart && bookingEnd >= dayEnd;
  });

  return isBlocked ? 'blocked' : 'available';
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.split('-').reverse().join('/');
}

function daysInclusive(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

export default function RentalRequestModal({ vehicle, onClose, onCreated }) {
  const today = useMemo(() => new Date(), []);
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  const [approvedBookings, setApprovedBookings] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [purpose, setPurpose] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!vehicle) return;

    let alive = true;

    const loadAvailability = async () => {
      setLoadingCalendar(true);
      setError('');
      setPurpose('');
      setStartDate('');
      setEndDate('');
      setCalendarMonth(today.getMonth());
      setCalendarYear(today.getFullYear());

      try {
        const res = await api.get(
          `/vehicles/${vehicle.licensePlate}/availability`
        );

        if (!alive) return;

        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
        setApprovedBookings(data);
      } catch (err) {
        if (!alive) return;
        setError(
          getApiErrorMessage(
            err,
            'Não foi possível carregar a disponibilidade do veículo.'
          )
        );
      } finally {
        if (!alive) return;
        setLoadingCalendar(false);
      }
    };

    loadAvailability();

    return () => {
      alive = false;
    };
  }, [vehicle, today]);

  if (!vehicle) return null;

  const handleDateClick = (date) => {
    const dateStr = formatDateLocal(date);
    const dayStatus = getStatusForDate(date, approvedBookings);

    if (dayStatus !== 'available') return;

    if (!startDate || (startDate && endDate && startDate !== endDate) || dateStr < startDate) {
      setStartDate(dateStr);
      setEndDate(dateStr);
      setError('');
      return;
    }

    if (startDate && endDate && startDate === endDate && dateStr === startDate) {
      setStartDate('');
      setEndDate('');
      setError('');
      return;
    }

    if (startDate && endDate && startDate === endDate && dateStr > startDate) {
      let current = new Date(`${startDate}T00:00:00`);
      const target = new Date(`${dateStr}T00:00:00`);
      let hasBlockedDay = false;

      current.setDate(current.getDate() + 1);

      while (current <= target) {
        if (getStatusForDate(current, approvedBookings) === 'blocked') {
          hasBlockedDay = true;
          break;
        }
        current.setDate(current.getDate() + 1);
      }

      if (hasBlockedDay) {
        setError('O intervalo selecionado conflita com dias indisponíveis.');
        return;
      }

      const totalDays = daysInclusive(startDate, dateStr);

      if (totalDays > 5) {
        setError('O período máximo de aluguel é de 5 dias.');
        return;
      }

      setEndDate(dateStr);
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!startDate || !endDate || !purpose.trim()) {
      setError('Selecione as datas e preencha a finalidade.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/rentals', {
        vehicleId: vehicle.id,
        startDate,
        endDate,
        purpose: purpose.trim(),
      });

      await onCreated();
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Não foi possível enviar a solicitação.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const daysInMonth = getDatesInMonth(calendarYear, calendarMonth);
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const monthName = new Date(calendarYear, calendarMonth).toLocaleString('pt-BR', {
    month: 'long',
  });

  const totalDays =
    startDate && endDate ? daysInclusive(startDate, endDate) : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-card rental-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="rental-modalHeader">
          <div>
            <h2 className="rental-modalTitle">Solicitar Reserva</h2>
            <p className="rental-modalSubtitle">
              {vehicle.brand} {vehicle.model} • {vehicle.licensePlate}
            </p>
          </div>

          <button
            type="button"
            className="rental-modalClose"
            onClick={onClose}
            disabled={submitting}
          >
            ×
          </button>
        </div>

        <div className="rental-modalBody">
          {error && <div className="alert alert-error">{error}</div>}

          <form className="rental-modalGrid" onSubmit={handleSubmit}>
            <div className="rental-calendarColumn">
              <div className="rental-calendarNav">
                <button
                  type="button"
                  className="calendar-navBtn"
                  onClick={() => {
                    const newDate = new Date(calendarYear, calendarMonth - 1, 1);
                    setCalendarMonth(newDate.getMonth());
                    setCalendarYear(newDate.getFullYear());
                  }}
                >
                  ‹
                </button>

                <h3 className="rental-calendarMonth">
                  {monthName} {calendarYear}
                </h3>

                <button
                  type="button"
                  className="calendar-navBtn"
                  onClick={() => {
                    const newDate = new Date(calendarYear, calendarMonth + 1, 1);
                    setCalendarMonth(newDate.getMonth());
                    setCalendarYear(newDate.getFullYear());
                  }}
                >
                  ›
                </button>
              </div>

              <div className="rental-calendarCard">
                <div className="calendar-grid">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="day-header">
                      {day}
                    </div>
                  ))}

                  {[...Array(firstDayOfWeek)].map((_, index) => (
                    <div key={`empty-${index}`} className="day-cell empty" />
                  ))}

                  {daysInMonth.map((date) => {
                    const status = getStatusForDate(date, approvedBookings);
                    const dateStr = formatDateLocal(date);
                    const isSelectedStart = dateStr === startDate;
                    const isSelectedEnd = dateStr === endDate;

                    let inRange = false;
                    if (startDate && endDate) {
                      if (dateStr > startDate && dateStr < endDate) {
                        inRange = true;
                      }
                    }

                    const baseClass = ['day-cell'];

                    if (status === 'available') baseClass.push('status-available');
                    if (status === 'blocked') baseClass.push('status-booked');
                    if (status === 'past') baseClass.push('status-past');
                    if (isSelectedStart) baseClass.push('selected-start');
                    if (isSelectedEnd) baseClass.push('selected-end');
                    if (inRange) baseClass.push('in-range');

                    return (
                      <div
                        key={dateStr}
                        className={baseClass.join(' ')}
                        onClick={() => handleDateClick(date)}
                        title={
                          status === 'blocked'
                            ? 'Indisponível'
                            : status === 'past'
                              ? 'Data passada'
                              : 'Disponível'
                        }
                      >
                        {date.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rental-calendarLegend">
                <div className="legend-item">
                  <span className="legend-dot legend-available" />
                  Disponível
                </div>
                <div className="legend-item">
                  <span className="legend-dot legend-booked" />
                  Ocupado
                </div>
                <div className="legend-item">
                  <span className="legend-dot legend-past" />
                  Passado
                </div>
              </div>

              {loadingCalendar && (
                <div className="card-meta">Carregando disponibilidade...</div>
              )}
            </div>

            <div className="rental-detailsColumn">
              <div className="rental-summaryCard">
                <div className="card-title">Informações do veículo</div>
                <div className="rental-summaryGrid">
                  <div>
                    <span className="rental-summaryLabel">Modelo</span>
                    <p className="rental-summaryValue">
                      {vehicle.brand} {vehicle.model}
                    </p>
                  </div>
                  <div>
                    <span className="rental-summaryLabel">Ano / Placa</span>
                    <p className="rental-summaryValue">
                      {vehicle.year} • {vehicle.licensePlate}
                    </p>
                  </div>
                  <div>
                    <span className="rental-summaryLabel">Quilometragem</span>
                    <p className="rental-summaryValue">
                      {vehicle.mileage?.toLocaleString()} km
                    </p>
                  </div>
                  <div>
                    <span className="rental-summaryLabel">Transmissão</span>
                    <p className="rental-summaryValue">
                      {vehicle.transmissionType === 'automatic'
                        ? 'Automático'
                        : 'Manual'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rental-purposeCard">
                <label htmlFor="purpose" className="rental-summaryLabel">
                  Finalidade do aluguel
                </label>
                <textarea
                  id="purpose"
                  name="purpose"
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value)}
                  placeholder="Ex.: visita técnica, reunião externa..."
                  className="rental-purposeInput"
                  rows="4"
                  disabled={submitting}
                />
              </div>

              {(startDate || endDate) && (
                <div className="rental-selectionCard">
                  <div className="card-title">Resumo da reserva</div>
                  <div className="rental-selectionRow">
                    <span>Início</span>
                    <strong>{formatDisplayDate(startDate)}</strong>
                  </div>
                  <div className="rental-selectionRow">
                    <span>Término</span>
                    <strong>{formatDisplayDate(endDate)}</strong>
                  </div>
                  {startDate && endDate && (
                    <div className="rental-selectionRow rental-selectionTotal">
                      <span>Total</span>
                      <strong>
                        {totalDays} {totalDays === 1 ? 'dia' : 'dias'}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              <div className="rental-modalActions">
                <button
                  type="submit"
                  className="dashboard-linkBtn"
                  disabled={submitting || !startDate || !endDate || !purpose.trim()}
                >
                  {submitting ? 'Enviando...' : 'Enviar solicitação'}
                </button>

                <button
                  type="button"
                  className="rental-cancelBtn"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancelar
                </button>
              </div>

              <div className="rental-hintCard">
                <div className="card-title">Informações importantes</div>
                <ul className="rental-hintList">
                  <li>Para reserva de 1 dia, basta um clique na data desejada.</li>
                  <li>Dias em vermelho indicam indisponibilidade.</li>
                  <li>Período máximo de aluguel: 5 dias.</li>
                  <li>O backend continua validando conflitos no envio.</li>
                </ul>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}