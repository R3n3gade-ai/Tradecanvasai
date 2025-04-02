"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash,
  Filter,
  Clock,
  DollarSign,
  FileText,
  Tag,
  BarChart2
} from "lucide-react";
import { useDashboardStore } from "../utils/store";
import { CalendarEvent, TradeEntry, CalendarEventType, TradeType } from "../utils/types";
import { formatCurrency } from "../utils/formatters";

// Calendar component for both events and trade journal
export function Calendar() {
  const {
    calendarEvents,
    tradeEntries,
    selectedDate,
    calendarView,
    calendarFilter,
    setSelectedDate,
    setCalendarView,
    setCalendarFilter,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    addTradeEntry,
    updateTradeEntry,
    deleteTradeEntry
  } = useDashboardStore();

  // For the calendar grid
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [days, setDays] = useState<Date[]>([]);
  
  // For event and trade forms
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<TradeEntry | null>(null);

  // Calculate calendar days for the current month
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week of the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Calculate how many days from the previous month to show
    const daysFromPrevMonth = firstDayOfWeek;
    
    // Get the first date to display (might be from the previous month)
    const startDate = new Date(year, month, 1 - daysFromPrevMonth);
    
    // Calculate total days to display (42 for a 6-week calendar)
    const totalDays = 42;
    
    // Generate all days to display
    const allDays: Date[] = [];
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      allDays.push(date);
    }
    
    setDays(allDays);
  }, [currentMonth]);

  // Handlers for month navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      return eventDate === dateString && 
        (calendarFilter === 'all' || calendarFilter === event.type);
    });
  };

  // Get trades for a specific day
  const getTradesForDay = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return tradeEntries.filter(trade => {
      const tradeDate = new Date(trade.date).toISOString().split('T')[0];
      return tradeDate === dateString && 
        (calendarFilter === 'all' || calendarFilter === 'trades');
    });
  };

  // Handle event form submission
  const handleEventSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const eventData = {
      title: formData.get('title') as string,
      date: formData.get('date') as string,
      type: formData.get('type') as CalendarEventType,
      description: formData.get('description') as string,
      ticker: formData.get('ticker') as string || undefined,
      impact: formData.get('impact') as 'high' | 'medium' | 'low' || undefined,
    };
    
    if (selectedEvent) {
      updateCalendarEvent(selectedEvent.id, eventData);
    } else {
      addCalendarEvent(eventData);
    }
    
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  // Handle trade form submission
  const handleTradeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const price = parseFloat(formData.get('price') as string);
    const quantity = parseFloat(formData.get('quantity') as string);
    const amount = price * quantity;
    
    let exitPrice = formData.get('exitPrice') ? parseFloat(formData.get('exitPrice') as string) : undefined;
    let pnl = undefined;
    
    if (exitPrice) {
      if (formData.get('type') === 'shares') {
        pnl = (exitPrice - price) * quantity;
      } else if (formData.get('type') === 'call_option') {
        pnl = (exitPrice - price) * quantity * 100; // Each contract is for 100 shares
      } else if (formData.get('type') === 'put_option') {
        pnl = (price - exitPrice) * quantity * 100; // Reverse for puts
      }
    }
    
    const tradeData = {
      date: formData.get('date') as string,
      ticker: formData.get('ticker') as string,
      type: formData.get('type') as TradeType,
      quantity,
      price,
      amount,
      exitPrice,
      pnl,
      notes: formData.get('notes') as string || undefined,
      isOpen: exitPrice ? false : true
    };
    
    if (selectedTrade) {
      updateTradeEntry(selectedTrade.id, tradeData);
    } else {
      addTradeEntry(tradeData);
    }
    
    setShowTradeModal(false);
    setSelectedTrade(null);
  };

  // Get color based on event type
  const getEventColor = (type: CalendarEventType) => {
    switch (type) {
      case 'earnings': return 'bg-blue-500';
      case 'economic': return 'bg-purple-500';
      case 'market': return 'bg-red-500';
      case 'internal': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Get color based on trade type and PnL
  const getTradeColor = (trade: TradeEntry) => {
    if (trade.isOpen) return 'bg-yellow-500';
    if (trade.pnl === undefined) return 'bg-gray-500';
    return trade.pnl >= 0 ? 'bg-green-500' : 'bg-red-500';
  };

  // Handle day click to show details
  const handleDayClick = (date: Date) => {
    setSelectedDate(date.toISOString());
  };

  // Format day events display
  const renderDay = (day: Date) => {
    const isToday = new Date().toDateString() === day.toDateString();
    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
    const isSelected = selectedDate === day.toISOString().split('T')[0];
    
    const events = getEventsForDay(day);
    const trades = getTradesForDay(day);
    
    // Calculate daily P&L sum for trades with exitPrice
    const closedTrades = trades.filter(trade => !trade.isOpen);
    const dailyPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    return (
      <div 
        key={day.toISOString()} 
        onClick={() => handleDayClick(day)}
        className={`min-h-24 p-1 border border-white/10 overflow-hidden transition-colors relative cursor-pointer ${
          isCurrentMonth ? 'bg-background' : 'bg-background/50 text-muted-foreground'
        } ${
          isToday ? 'border-blue-500' : ''
        } ${
          isSelected ? 'ring-2 ring-primary' : ''
        } hover:bg-card/50`}
      >
        <div className="text-xs font-medium mb-1">{day.getDate()}</div>
        
        {/* Show number of events/trades if there are more than can fit */}
        {(events.length > 0 || trades.length > 0) && (
          <div className="space-y-1">
            {events.slice(0, 2).map(event => (
              <div 
                key={event.id} 
                className={`${getEventColor(event.type)} text-white text-xs p-0.5 rounded truncate`}
                title={event.title}
              >
                {event.title}
              </div>
            ))}
            
            {trades.slice(0, 2).map(trade => (
              <div 
                key={trade.id} 
                className={`${getTradeColor(trade)} text-white text-xs p-0.5 rounded truncate flex items-center justify-between`}
                title={`${trade.ticker} ${trade.type} - ${formatCurrency(trade.amount)}`}
              >
                <span>{trade.ticker}</span>
                {!trade.isOpen && trade.pnl !== undefined && (
                  <span className={trade.pnl >= 0 ? 'text-green-200' : 'text-red-200'}>
                    {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                  </span>
                )}
              </div>
            ))}
            
            {/* Show count if there are more events or trades */}
            {(events.length > 2 || trades.length > 2) && (
              <div className="text-xs text-muted-foreground">
                +{(events.length + trades.length) - (events.slice(0, 2).length + trades.slice(0, 2).length)} more
              </div>
            )}
          </div>
        )}
        
        {/* Show daily P&L if there are closed trades */}
        {dailyPnL !== 0 && (
          <div className={`absolute bottom-0 right-0 text-xs p-0.5 font-medium ${
            dailyPnL > 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {dailyPnL > 0 ? '+' : ''}{formatCurrency(dailyPnL)}
          </div>
        )}
      </div>
    );
  };

  // Render detailed view of selected day
  const renderDayDetail = () => {
    if (!selectedDate) return null;
    
    const date = new Date(selectedDate);
    const events = getEventsForDay(date);
    const trades = getTradesForDay(date);
    
    return (
      <div className="mt-6 bg-card rounded-lg p-4 border border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </h3>
          <div className="space-x-2">
            <button 
              onClick={() => {
                setShowEventModal(true);
                setSelectedEvent(null);
              }}
              className="p-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              title="Add Event"
            >
              <CalendarIcon className="h-4 w-4" />
            </button>
            <button 
              onClick={() => {
                setShowTradeModal(true);
                setSelectedTrade(null);
              }}
              className="p-1.5 rounded-md bg-green-500 hover:bg-green-600 text-white transition-colors"
              title="Add Trade"
            >
              <BarChart2 className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setSelectedDate(null)}
              className="p-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-500 transition-colors"
              title="Close Detail"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Events Section */}
        {events.length > 0 && (
          <div className="mb-4">
            <h4 className="text-md font-medium mb-2 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
              Events
            </h4>
            <div className="space-y-2">
              {events.map(event => (
                <div 
                  key={event.id} 
                  className="bg-background rounded-md p-3 border border-white/10 hover:border-white/20 transition-colors"
                >
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <div className={`${getEventColor(event.type)} w-2 h-full rounded-l-md absolute -ml-3`}></div>
                      <h5 className="font-medium">{event.title}</h5>
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventModal(true);
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit Event"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => deleteCalendarEvent(event.id)}
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Delete Event"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mt-1 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(event.date).toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: 'numeric' 
                    })}
                    
                    {event.ticker && (
                      <span className="ml-2 flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {event.ticker}
                      </span>
                    )}
                    
                    {event.impact && (
                      <span className="ml-2 flex items-center">
                        <span className={`h-2 w-2 rounded-full mr-1 ${
                          event.impact === 'high' ? 'bg-red-500' :
                          event.impact === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}></span>
                        {event.impact} impact
                      </span>
                    )}
                  </div>
                  
                  {event.description && (
                    <p className="text-sm mt-2">{event.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Trades Section */}
        {trades.length > 0 && (
          <div>
            <h4 className="text-md font-medium mb-2 flex items-center">
              <BarChart2 className="h-4 w-4 mr-2 text-green-500" />
              Trades
            </h4>
            <div className="space-y-2">
              {trades.map(trade => {
                const isProfitable = (trade.pnl || 0) > 0;
                
                return (
                  <div 
                    key={trade.id} 
                    className="bg-background rounded-md p-3 border border-white/10 hover:border-white/20 transition-colors"
                  >
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <div className={`${getTradeColor(trade)} w-2 h-full rounded-l-md absolute -ml-3`}></div>
                        <h5 className="font-medium">{trade.ticker}</h5>
                        <span className="text-xs ml-2 px-1.5 py-0.5 rounded bg-background/50">
                          {trade.type === 'shares' ? 'Shares' : 
                           trade.type === 'call_option' ? 'Call' : 'Put'}
                        </span>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => {
                            setSelectedTrade(trade);
                            setShowTradeModal(true);
                          }}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit Trade"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteTradeEntry(trade.id)}
                          className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                          title="Delete Trade"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="text-sm">{trade.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="text-sm">{formatCurrency(trade.price)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Amount</p>
                        <p className="text-sm">{formatCurrency(trade.amount)}</p>
                      </div>
                    </div>
                    
                    {trade.exitPrice && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Exit Price</p>
                          <p className="text-sm">{formatCurrency(trade.exitPrice)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">P&L</p>
                          <p className={`text-sm font-medium ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                            {isProfitable ? '+' : ''}{formatCurrency(trade.pnl || 0)} 
                            {trade.pnl && trade.amount ? ` (${((trade.pnl / trade.amount) * 100).toFixed(2)}%)` : ''}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {trade.notes && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Notes</p>
                        <p className="text-sm">{trade.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* No events or trades message */}
        {events.length === 0 && trades.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No events or trades for this day.</p>
            <p className="mt-2 text-sm">Use the buttons above to add an event or record a trade.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-card rounded-lg p-4 border border-white/10">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold mr-2">Calendar & Journal</h2>
          <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Toggler */}
          <div className="flex border border-white/10 rounded-md overflow-hidden">
            <button 
              onClick={() => setCalendarView('month')}
              className={`text-xs px-2 py-1 ${calendarView === 'month' ? 'bg-primary text-white' : 'hover:bg-primary/10'}`}
            >
              Month
            </button>
            <button 
              onClick={() => setCalendarView('week')}
              className={`text-xs px-2 py-1 ${calendarView === 'week' ? 'bg-primary text-white' : 'hover:bg-primary/10'}`}
            >
              Week
            </button>
          </div>
          
          {/* Filter */}
          <div className="relative inline-block text-left">
            <div>
              <button 
                className="flex items-center p-1.5 border border-white/10 rounded-md hover:bg-primary/10 transition-colors"
                title="Filter Calendar"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
            <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-card shadow-lg border border-white/10 focus:outline-none hidden group-focus-within:block">
              <div className="p-1">
                <button 
                  onClick={() => setCalendarFilter('all')}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded-md ${calendarFilter === 'all' ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'}`}
                >
                  All Items
                </button>
                <button 
                  onClick={() => setCalendarFilter('earnings')}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded-md ${calendarFilter === 'earnings' ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'}`}
                >
                  Earnings
                </button>
                <button 
                  onClick={() => setCalendarFilter('economic')}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded-md ${calendarFilter === 'economic' ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'}`}
                >
                  Economic Data
                </button>
                <button 
                  onClick={() => setCalendarFilter('market')}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded-md ${calendarFilter === 'market' ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'}`}
                >
                  Market Events
                </button>
                <button 
                  onClick={() => setCalendarFilter('internal')}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded-md ${calendarFilter === 'internal' ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'}`}
                >
                  Internal Events
                </button>
                <button 
                  onClick={() => setCalendarFilter('trades')}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded-md ${calendarFilter === 'trades' ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'}`}
                >
                  Trades
                </button>
              </div>
            </div>
          </div>
          
          {/* Month Navigation */}
          <div className="flex border border-white/10 rounded-md overflow-hidden">
            <button 
              onClick={goToPreviousMonth}
              className="p-1.5 hover:bg-primary/10 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date())}
              className="p-1.5 hover:bg-primary/10 transition-colors text-xs font-medium"
              title="Today"
            >
              Today
            </button>
            <button 
              onClick={goToNextMonth}
              className="p-1.5 hover:bg-primary/10 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          {/* Add buttons */}
          <button 
            onClick={() => {
              setShowEventModal(true);
              setSelectedEvent(null);
            }}
            className="flex items-center p-1.5 bg-primary rounded-md hover:bg-primary/90 text-white transition-colors"
            title="Add Event"
          >
            <Plus className="h-4 w-4" />
            <span className="ml-1 text-xs font-medium">Event</span>
          </button>
          <button 
            onClick={() => {
              setShowTradeModal(true);
              setSelectedTrade(null);
            }}
            className="flex items-center p-1.5 bg-green-600 rounded-md hover:bg-green-700 text-white transition-colors"
            title="Add Trade"
          >
            <Plus className="h-4 w-4" />
            <span className="ml-1 text-xs font-medium">Trade</span>
          </button>
        </div>
      </div>
      
      {/* Day Headers */}
      <div className="grid grid-cols-7 text-sm font-medium text-center mb-1">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => renderDay(day))}
      </div>
      
      {/* Selected Day Detail */}
      {renderDayDetail()}
      
      {/* Add/Edit Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 border border-white/10 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedEvent ? 'Edit Event' : 'Add New Event'}
              </h3>
              <button 
                onClick={() => {
                  setShowEventModal(false);
                  setSelectedEvent(null);
                }}
                className="p-1 rounded-md hover:bg-background transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEventSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="title">
                    Event Title
                  </label>
                  <input 
                    type="text" 
                    id="title" 
                    name="title"
                    defaultValue={selectedEvent?.title || ''}
                    required
                    className="w-full p-2 rounded-md bg-background border border-white/10 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="date">
                    Date & Time
                  </label>
                  <input 
                    type="datetime-local" 
                    id="date" 
                    name="date"
                    defaultValue={selectedEvent?.date ? new Date(selectedEvent.date).toISOString().slice(0, 16) : selectedDate ? `${selectedDate}T09:00` : ''}
                    required
                    className="w-full p-2 rounded-md bg-background border border-white/10 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="type">
                    Event Type
                  </label>
                  <select 
                    id="type" 
                    name="type"
                    defaultValue={selectedEvent?.type || 'earnings'}
                    required
                    className="w-full p-2 rounded-md bg-background border border-white/10 focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="earnings">Earnings</option>
                    <option value="economic">Economic Data</option>
                    <option value="market">Market Event</option>
                    <option value="internal">Internal Event</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="description">
                    Description
                  </label>
                  <textarea 
                    id="description" 
                    name="description"
                    defaultValue={selectedEvent?.description || ''}
                    rows={3}
                    className="w-full p-2 rounded-md bg-background border border-white/10 focus:border-primary focus:outline-none transition-colors"
                  ></textarea>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="ticker">
                      Ticker (for earnings)
                    </label>
                    <input 
                      type="text" 
                      id="ticker" 
                      name="ticker"
                      defaultValue={selectedEvent?.ticker || ''}
                      className="w-full p-2 rounded-md bg-background border border-white/10 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="impact">
                      Impact (for economic)
                    </label>
                    <select 
                      id="impact" 
                      name="impact"
                      defaultValue={selectedEvent?.impact || 'medium'}
                      className="w-full p-2 rounded-md bg-background border border-white/10 focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="">-- Select --</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 space-x-3">
                <button 
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    setSelectedEvent(null);
                  }}
                  className="px-4 py-2 rounded-md border border-white/10 hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-white transition-colors"
                >
                  {selectedEvent ? 'Update Event' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add/Edit Trade Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 border border-white/10 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {selectedTrade ? 'Edit Trade' : 'Add New Trade'}
              </h3>
              <button 
                onClick={() => {
                  setShowTradeModal(false);
                  setSelectedTrade(null);
                }}
                className="p-1 rounded-md hover:bg-background transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleTradeSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="date">
                    Date & Time
                  </label>
                  <input 
                    type="datetime-local" 
                    id="date" 
                    name="date"
                    defaultValue={selectedTrade?.date ? new Date(selectedTrade.date).toISOString().slice(0, 16) : selectedDate ? `${selectedDate}T09:30` : ''}
                    required
                    className="w-full p-2 rounded-md bg-background border border-white/10 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="ticker">
                    Ticker
                  </label>
                  <input 
                    type="text" 
                    id="ticker" 
                    name="ticker"
                    defaultValue={selectedTrade?.ticker || ''}
                    required
                    className="w-full p-2 rounded-md bg-background border border-white/10 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="type">
                      Type
                    </label>
                    <select 
                      id="type" 
                      name="type"
                      defaultValue={selectedTrade?.type || 'shares'}
                      required
                      className="w-full p-2 rounded-md bg-background border border-white/10 focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="shares">Shares</option>
                      <option value="call_option">Call Option</option>
                      <option value="put_option">Put Option</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="quantity">
                      Quantity
                    </label>
                    <input 
                      type="number" 
                      id="quantity" 
                      name="quantity"
                      defaultValue={selectedTrade?.quantity || ''}
                      required
                      min="0.01"
                      step="0.01"
                      className="w-full p-2 rounded-md bg-background border border-white/10 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="price">
                      Price
                    </label>
                    <input 
                      type="number" 
                      id="price" 
                      name="price"
                      defaultValue={selectedTrade?.price || ''}
                      required
                      min="0.01"
                      step="0.01"
                      className="w-full p-2 rounded-md bg-background border border-white/10 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="exitPrice">
                    Exit Price (leave blank for open trades)
                  </label>
                  <input 
                    type="number" 
                    id="exitPrice" 
                    name="exitPrice"
                    defaultValue={selectedTrade?.exitPrice || ''}
                    min="0.01"
                    step="0.01"
                    className="w-full p-2 rounded-md bg-background border border-white/10 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="notes">
                    Notes
                  </label>
                  <textarea 
                    id="notes" 
                    name="notes"
                    defaultValue={selectedTrade?.notes || ''}
                    rows={3}
                    className="w-full p-2 rounded-md bg-background border border-white/10 focus:border-primary focus:outline-none transition-colors"
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 space-x-3">
                <button 
                  type="button"
                  onClick={() => {
                    setShowTradeModal(false);
                    setSelectedTrade(null);
                  }}
                  className="px-4 py-2 rounded-md border border-white/10 hover:bg-background transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors"
                >
                  {selectedTrade ? 'Update Trade' : 'Add Trade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}