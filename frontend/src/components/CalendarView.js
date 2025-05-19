import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';


const CalendarView = ({ events, onAddEvent, onRemoveEvent }) => {
  const [calendarEvents, setCalendarEvents] = useState(events);

  const handleDateClick = (info) => {
    const task = prompt(`What did you do on ${info.dateStr}?`);
    if (task) {
      const newEvent = { title: task, start: info.dateStr, allDay: true };
      setCalendarEvents((prev) => [...prev, newEvent]);
      if (onAddEvent) onAddEvent(newEvent);
    }
  };

  const handleEventClick = (info) => {
    const confirmed = window.confirm(`Delete "${info.event.title}"?`);
    if (confirmed) {
      const updated = calendarEvents.filter(
        (event) => !(event.title === info.event.title && event.start === info.event.startStr)
      );
      setCalendarEvents(updated);
      if (onRemoveEvent) onRemoveEvent(info.event);
    }
  };

  return (
    <div>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
      />
    </div>
  );
};

export default CalendarView;
