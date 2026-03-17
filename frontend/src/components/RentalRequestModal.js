import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import '../styles/dashboard.css';

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

const SLOT_MINUTES = 30;
const MAX_RENTAL_HOURS = 12;
const BUSINESS_START_HOUR = 6;  // 06:00
const BUSINESS_END_HOUR = 22;   // 22:00 (last slot starts at 21:30)

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function getApiErrorMessage(err, fallbackMessage) {
  const apiMessage = err?.response?.data?.error?.message;
  if (apiMessage) return apiMessage;
  return fallbackMessage;
}

/**
 * Formats a local Date to "YYYY-MM-DD" using local wall-clock values.
 * Used for calendar date cells (no timezone conversion).
 */
function formatDateLocal(date) {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns "YYYY-MM-DDTHH:mm" from a local Date.
 * This is the format sent to the API.
 */
function formatLocalDatetime(date) {
  if (!date) return '';
  const dateStr = formatDateLocal(date);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${dateStr}T${hh}:${mm}`;
}

/**
 * Parses "YYYY-MM-DDTHH:mm" as a local Date object (not UTC).
 */
function parseLocalDatetime(str) {
  if (!str || typeof str !== 'string') return null;
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, yyyy, mm, dd, hh, mi] = match.map(Number);
  return new Date(yyyy, mm - 1, dd, hh, mi, 0, 0);
}

/**
 * Formats "YYYY-MM-DDTHH:mm" or "YYYY-MM-DD" for human display.
 */
function formatDisplayDatetime(str) {
  if (!str) return '';
  if (str.includes('T')) {
    const [datePart, timePart] = str.split('T');
    const [yyyy, mm, dd] = datePart.split('-');
    return `${dd}/${mm}/${yyyy} ${timePart}`;
  }
  const [yyyy, mm, dd] = str.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Returns all calendar dates (Date objects) in a given month.
 */
function getDatesInMonth(year, month) {
  const date = new Date(year, month, 1);
  const dates = [];
  while (date.getMonth() === month) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

/**
 * Determines the status of a calendar day:
 *   'past'      — date is before today
 *   'blocked'   — all business slots on this day are fully covered by approved bookings
 *   'partial'   — some slots are blocked (day has both free and blocked slots)
 *   'available' — day has free slots
 *
 * NOTE: A day is marked 'blocked' only when every possible 30-min slot is
 * covered. 'partial' means at least one slot is free.
 */
function getDayStatus(date, bookings) {
  const dateStr = formatDateLocal(date);
  const todayStr = formatDateLocal(new Date());

  if (dateStr < todayStr) return 'past';
  if (!bookings?.length) return 'available';

  const totalSlots = ((BUSINESS_END_HOUR - BUSINESS_START_HOUR) * 60) / SLOT_MINUTES;
  let blockedSlots = 0;

  for (let i = 0; i < totalSlots; i++) {
    const slotMinutes = BUSINESS_START_HOUR * 60 + i * SLOT_MINUTES;
    const slotHour = Math.floor(slotMinutes / 60);
    const slotMin = slotMinutes % 60;

    const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), slotHour, slotMin);
    const slotEnd = new Date(slotStart.getTime() + SLOT_MINUTES * 60 * 1000);

    const isBlocked = bookings.some((b) => {
      // bookings come as "YYYY-MM-DDTHH:mm" strings from the API
      const bStart = parseLocalDatetime(b.startDate);
      const bEnd = parseLocalDatetime(b.endDate);
      if (!bStart || !bEnd) return false;
      // Slot is blocked if it overlaps with the booking: bStart < slotEnd AND bEnd > slotStart
      return bStart < slotEnd && bEnd > slotStart;
    });

    if (isBlocked) blockedSlots++;
  }

  if (blockedSlots === 0) return 'available';
  if (blockedSlots === totalSlots) return 'blocked';
  return 'partial';
}

/**
 * Returns true if a specific 30-min slot starting at `slotStart` is blocked
 * by any booking in the list.
 */
function isSlotBlocked(slotStart, bookings) {
  const slotEnd = new Date(slotStart.getTime() + SLOT_MINUTES * 60 * 1000);
  return bookings.some((b) => {
    const bStart = parseLocalDatetime(b.startDate);
    const bEnd = parseLocalDatetime(b.endDate);
    if (!bStart || !bEnd) return false;
    return bStart < slotEnd && bEnd > slotStart;
  });
}

/**
 * Generates the list of 30-min slot start times for a given date,
 * between BUSINESS_START_HOUR and BUSINESS_END_HOUR.
 */
function getSlotsForDate(date) {
  const slots = [];
  const totalSlots = ((BUSINESS_END_HOUR - BUSINESS_START_HOUR) * 60) / SLOT_MINUTES;

  for (let i = 0; i < totalSlots; i++) {
    const minutes = BUSINESS_START_HOUR * 60 + i * SLOT_MINUTES;
    const slotHour = Math.floor(minutes / 60);
    const slotMin = minutes % 60;
    slots.push(new Date(date.getFullYear(), date.getMonth(), date.getDate(), slotHour, slotMin));
  }

  return slots;
}

/**
 * Returns duration in minutes between two Date objects.
 */
function durationMinutes(start, end) {
  return Math.round((end.getTime() - start.getTime()) / (60 * 1000));
}

function formatSlotTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// SLOT GRID COMPONENT
// ---------------------------------------------------------------------------

/**
 * SlotGrid renders the 30-min time slots for a selected calendar date.
 *
 * Selection behaviour:
 *   1st click on a free slot → sets startSlot (highlighted in blue)
 *   2nd click on a later free slot → sets endSlot (the end of that slot)
 *     - Validates: no blocked slot in the range, max duration respected
 *   Clicking the already-selected startSlot → deselects
 *   Clicking before startSlot → resets and sets new startSlot
 */
function SlotGrid({ date, bookings, startSlot, endSlot, onSelectStart, onSelectEnd, onReset }) {
  if (!date) return null;

  const slots = getSlotsForDate(date);
  const now = new Date();

  return (
    <div className="slotGrid">
      <div className="slotGrid-header">
        {formatDateLocal(date).split('-').reverse().join('/')} — selecione início e fim
      </div>
      <div className="slotGrid-cells">
        {slots.map((slot) => {
          const slotStr = formatLocalDatetime(slot);
          const slotEnd = new Date(slot.getTime() + SLOT_MINUTES * 60 * 1000);
          const blocked = isSlotBlocked(slot, bookings);
          const isPast = slot < now;

          const isStart = startSlot && formatLocalDatetime(startSlot) === slotStr;
          const isEnd = endSlot && formatLocalDatetime(slot) === formatLocalDatetime(
            new Date(endSlot.getTime() - SLOT_MINUTES * 60 * 1000)
          );

          let inRange = false;
          if (startSlot && endSlot && !isStart && !isEnd) {
            inRange = slot >= startSlot && slotEnd <= endSlot;
          }

          const isDisabled = blocked || isPast;

          let cellClass = 'slotCell';
          if (isDisabled) cellClass += ' slotCell--blocked';
          else if (isStart) cellClass += ' slotCell--start';
          else if (isEnd) cellClass += ' slotCell--end';
          else if (inRange) cellClass += ' slotCell--range';
          else cellClass += ' slotCell--free';

          const handleClick = () => {
            if (isDisabled) return;

            // Clicking the current start → deselect
            if (isStart) {
              onReset();
              return;
            }

            // No start selected yet → set start
            if (!startSlot) {
              onSelectStart(slot);
              return;
            }

            // Clicked before or equal to start → reset and set new start
            if (slot <= startSlot) {
              onSelectStart(slot);
              return;
            }

            // Clicked after start → try to set end
            onSelectEnd(slot, slotEnd);
          };

          return (
            <button
              key={slotStr}
              type="button"
              className={cellClass}
              onClick={handleClick}
              title={
                isDisabled
                  ? (blocked ? 'Slot ocupado' : 'Horário passado')
                  : `${formatSlotTime(slot)}–${formatSlotTime(slotEnd)}`
              }
              disabled={isDisabled}
            >
              {formatSlotTime(slot)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN MODAL
// ---------------------------------------------------------------------------

export default function RentalRequestModal({ vehicle, onClose, onCreated }) {
  const today = useMemo(() => new Date(), []);

  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  const [approvedBookings, setApprovedBookings] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const [purpose, setPurpose] = useState('');
  const [selectedDate, setSelectedDate] = useState(null); // Date object for the chosen calendar day
  const [startSlot, setStartSlot] = useState(null);       // Date: slot start
  const [endSlot, setEndSlot] = useState(null);           // Date: slot end (exclusive)

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Derived strings sent to the API
  const startDateStr = startSlot ? formatLocalDatetime(startSlot) : '';
  const endDateStr = endSlot ? formatLocalDatetime(endSlot) : '';

  // Load availability whenever the vehicle changes
  useEffect(() => {
    if (!vehicle) return;

    let alive = true;

    const loadAvailability = async () => {
      setLoadingCalendar(true);
      setError('');
      setPurpose('');
      setSelectedDate(null);
      setStartSlot(null);
      setEndSlot(null);
      setCalendarMonth(today.getMonth());
      setCalendarYear(today.getFullYear());

      try {
        const res = await api.get(`/vehicles/${vehicle.licensePlate}/availability`);
        if (!alive) return;
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
        setApprovedBookings(data);
      } catch (err) {
        if (!alive) return;
        setError(getApiErrorMessage(err, 'Não foi possível carregar a disponibilidade.'));
      } finally {
        if (!alive) return;
        setLoadingCalendar(false);
      }
    };

    loadAvailability();
    return () => { alive = false; };
  }, [vehicle, today]);

  if (!vehicle) return null;

  // ------------------------------------------------------------------
  // Calendar day click
  // ------------------------------------------------------------------
  const handleDayClick = (date) => {
    const status = getDayStatus(date, approvedBookings);
    if (status === 'past' || status === 'blocked') return;

    setSelectedDate(date);
    setStartSlot(null);
    setEndSlot(null);
    setError('');
  };

  // ------------------------------------------------------------------
  // Slot selection handlers
  // ------------------------------------------------------------------
  const handleSelectStart = (slot) => {
    setStartSlot(slot);
    setEndSlot(null);
    setError('');
  };

  const handleSelectEnd = (slot, slotEndDate) => {
    // Validate: no blocked slot in the range [startSlot, slotEndDate)
    let cursor = new Date(startSlot.getTime() + SLOT_MINUTES * 60 * 1000);
    while (cursor <= slot) {
      if (isSlotBlocked(cursor, approvedBookings)) {
        setError('O intervalo selecionado passa por um horário ocupado.');
        return;
      }
      cursor = new Date(cursor.getTime() + SLOT_MINUTES * 60 * 1000);
    }

    // Validate: max duration
    const dur = durationMinutes(startSlot, slotEndDate);
    if (dur > MAX_RENTAL_HOURS * 60) {
      setError(`Duração máxima por reserva: ${MAX_RENTAL_HOURS} horas.`);
      return;
    }

    setEndSlot(slotEndDate);
    setError('');
  };

  const handleReset = () => {
    setStartSlot(null);
    setEndSlot(null);
    setError('');
  };

  // ------------------------------------------------------------------
  // Form submission
  // ------------------------------------------------------------------
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!startDateStr || !endDateStr || !purpose.trim()) {
      setError('Selecione o horário e preencha a finalidade.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/rentals', {
        vehicleId: vehicle.id,
        startDate: startDateStr,
        endDate: endDateStr,
        purpose: purpose.trim(),
      });
      await onCreated();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Não foi possível enviar a solicitação.'));
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------------------------------------------
  // Calendar render helpers
  // ------------------------------------------------------------------
  const daysInMonth = getDatesInMonth(calendarYear, calendarMonth);
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const monthName = new Date(calendarYear, calendarMonth).toLocaleString('pt-BR', { month: 'long' });

  const selectedDayStr = selectedDate ? formatDateLocal(selectedDate) : '';
  const duration = startSlot && endSlot ? durationMinutes(startSlot, endSlot) : 0;
  const durationLabel =
    duration >= 60
      ? `${Math.floor(duration / 60)}h${duration % 60 > 0 ? `${duration % 60}min` : ''}`
      : duration > 0
      ? `${duration}min`
      : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-card rental-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="rental-modalHeader">
          <div>
            <h2 className="rental-modalTitle">Solicitar Reserva</h2>
            <p className="rental-modalSubtitle">
              {vehicle.brand} {vehicle.model} • {vehicle.licensePlate}
            </p>
          </div>
          <button type="button" className="rental-modalClose" onClick={onClose} disabled={submitting}>
            ×
          </button>
        </div>

        <div className="rental-modalBody">
          {error && <div className="alert alert-error">{error}</div>}

          <form className="rental-modalGrid" onSubmit={handleSubmit}>
            {/* ---- LEFT: Calendar + Slot grid ---- */}
            <div className="rental-calendarColumn">

              {/* Month navigator */}
              <div className="rental-calendarNav">
                <button
                  type="button"
                  className="calendar-navBtn"
                  onClick={() => {
                    const d = new Date(calendarYear, calendarMonth - 1, 1);
                    setCalendarMonth(d.getMonth());
                    setCalendarYear(d.getFullYear());
                  }}
                >‹</button>
                <h3 className="rental-calendarMonth">{monthName} {calendarYear}</h3>
                <button
                  type="button"
                  className="calendar-navBtn"
                  onClick={() => {
                    const d = new Date(calendarYear, calendarMonth + 1, 1);
                    setCalendarMonth(d.getMonth());
                    setCalendarYear(d.getFullYear());
                  }}
                >›</button>
              </div>

              {/* Day grid */}
              <div className="rental-calendarCard">
                <div className="calendar-grid">
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                    <div key={day} className="day-header">{day}</div>
                  ))}

                  {[...Array(firstDayOfWeek)].map((_, i) => (
                    <div key={`e-${i}`} className="day-cell empty" />
                  ))}

                  {daysInMonth.map((date) => {
                    const status = getDayStatus(date, approvedBookings);
                    const dateStr = formatDateLocal(date);
                    const isSelected = dateStr === selectedDayStr;

                    const cellClass = [
                      'day-cell',
                      status === 'available' ? 'status-available' : '',
                      status === 'partial'   ? 'status-partial'   : '',
                      status === 'blocked'   ? 'status-booked'    : '',
                      status === 'past'      ? 'status-past'      : '',
                      isSelected             ? 'selected-start'   : '',
                    ].filter(Boolean).join(' ');

                    return (
                      <div
                        key={dateStr}
                        className={cellClass}
                        onClick={() => handleDayClick(date)}
                        title={
                          status === 'blocked' ? 'Dia sem disponibilidade' :
                          status === 'partial' ? 'Dia com horários parcialmente disponíveis' :
                          status === 'past'    ? 'Data passada' : 'Disponível'
                        }
                      >
                        {date.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="rental-calendarLegend">
                <div className="legend-item"><span className="legend-dot legend-available" />Disponível</div>
                <div className="legend-item"><span className="legend-dot legend-partial" />Parcial</div>
                <div className="legend-item"><span className="legend-dot legend-booked" />Ocupado</div>
                <div className="legend-item"><span className="legend-dot legend-past" />Passado</div>
              </div>

              {loadingCalendar && <div className="card-meta">Carregando disponibilidade...</div>}

              {/* Slot grid — appears after a day is selected */}
              {selectedDate && (
                <SlotGrid
                  date={selectedDate}
                  bookings={approvedBookings}
                  startSlot={startSlot}
                  endSlot={endSlot}
                  onSelectStart={handleSelectStart}
                  onSelectEnd={handleSelectEnd}
                  onReset={handleReset}
                />
              )}
            </div>

            {/* ---- RIGHT: Details panel ---- */}
            <div className="rental-detailsColumn">
              {/* Vehicle info */}
              <div className="rental-summaryCard">
                <div className="card-title">Informações do veículo</div>
                <div className="rental-summaryGrid">
                  <div>
                    <span className="rental-summaryLabel">Modelo</span>
                    <p className="rental-summaryValue">{vehicle.brand} {vehicle.model}</p>
                  </div>
                  <div>
                    <span className="rental-summaryLabel">Ano / Placa</span>
                    <p className="rental-summaryValue">{vehicle.year} • {vehicle.licensePlate}</p>
                  </div>
                  <div>
                    <span className="rental-summaryLabel">Quilometragem</span>
                    <p className="rental-summaryValue">{vehicle.mileage?.toLocaleString()} km</p>
                  </div>
                  <div>
                    <span className="rental-summaryLabel">Transmissão</span>
                    <p className="rental-summaryValue">
                      {vehicle.transmissionType === 'automatic' ? 'Automático' : 'Manual'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div className="rental-purposeCard">
                <label htmlFor="purpose" className="rental-summaryLabel">
                  Finalidade do aluguel
                </label>
                <textarea
                  id="purpose"
                  name="purpose"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Ex.: visita técnica, reunião externa..."
                  className="rental-purposeInput"
                  rows="4"
                  disabled={submitting}
                />
              </div>

              {/* Reservation summary */}
              {(startDateStr || endDateStr) && (
                <div className="rental-selectionCard">
                  <div className="card-title">Resumo da reserva</div>
                  <div className="rental-selectionRow">
                    <span>Início</span>
                    <strong>{formatDisplayDatetime(startDateStr)}</strong>
                  </div>
                  <div className="rental-selectionRow">
                    <span>Término</span>
                    <strong>{formatDisplayDatetime(endDateStr)}</strong>
                  </div>
                  {durationLabel && (
                    <div className="rental-selectionRow rental-selectionTotal">
                      <span>Duração</span>
                      <strong>{durationLabel}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="rental-modalActions">
                <button
                  type="submit"
                  className="dashboard-linkBtn"
                  disabled={submitting || !startDateStr || !endDateStr || !purpose.trim()}
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

              {/* Hints */}
              <div className="rental-hintCard">
                <div className="card-title">Como reservar</div>
                <ul className="rental-hintList">
                  <li>Clique em um dia disponível para ver os horários.</li>
                  <li>Clique no horário de início (azul) e depois no de término.</li>
                  <li>Slots em cinza escuro estão ocupados.</li>
                  <li>Duração máxima: {MAX_RENTAL_HOURS} horas por reserva.</li>
                  <li>Intervalos de {SLOT_MINUTES} minutos.</li>
                </ul>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}