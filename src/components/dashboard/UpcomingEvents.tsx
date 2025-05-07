"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  FaCalendarAlt, 
  FaBullhorn, 
  FaTrophy, 
  FaGift, 
  FaUsers, 
  FaGraduationCap,
  FaChevronRight,
  FaFilter
} from 'react-icons/fa';

interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  type: 'training' | 'promotion' | 'meeting' | 'recognition' | 'announcement';
  description: string;
  link?: string;
}

interface UpcomingEventsProps {
  events?: Event[];
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  events = []
}) => {
  const [filter, setFilter] = useState<string>('all');
  
  // Sample events if none provided
  const sampleEvents: Event[] = [
    {
      id: '1',
      title: 'Product Training Webinar',
      date: '2023-07-15',
      time: '2:00 PM - 4:00 PM',
      type: 'training',
      description: 'Learn about our new Biogen Shield Herbal Care Soap and its benefits.',
      link: '/events/product-training'
    },
    {
      id: '2',
      title: 'Summer Sales Promotion',
      date: '2023-07-01',
      time: '12:00 AM',
      type: 'promotion',
      description: 'Special summer promotion with increased PV for all products.',
      link: '/promotions/summer-sales'
    },
    {
      id: '3',
      title: 'Monthly Distributor Meeting',
      date: '2023-07-20',
      time: '6:00 PM - 8:00 PM',
      location: 'Zoom Meeting',
      type: 'meeting',
      description: 'Monthly meeting to discuss business updates and strategies.',
      link: '/events/monthly-meeting'
    },
    {
      id: '4',
      title: 'Recognition Day',
      date: '2023-07-30',
      time: '3:00 PM - 6:00 PM',
      location: 'Grand Ballroom, Manila Hotel',
      type: 'recognition',
      description: 'Celebrating our top performers and rank advancements.',
      link: '/events/recognition-day'
    },
    {
      id: '5',
      title: 'New Compensation Plan Announcement',
      date: '2023-07-10',
      type: 'announcement',
      description: 'Important updates to our compensation structure.',
      link: '/announcements/compensation-update'
    }
  ];
  
  // Use provided events or sample data
  const allEvents = events.length > 0 ? events : sampleEvents;
  
  // Filter events
  const filteredEvents = filter === 'all' 
    ? allEvents 
    : allEvents.filter(event => event.type === filter);
  
  // Sort events by date (closest first)
  const sortedEvents = [...filteredEvents].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get icon for event type
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'training':
        return <FaGraduationCap className="text-blue-500" />;
      case 'promotion':
        return <FaGift className="text-purple-500" />;
      case 'meeting':
        return <FaUsers className="text-green-500" />;
      case 'recognition':
        return <FaTrophy className="text-yellow-500" />;
      case 'announcement':
        return <FaBullhorn className="text-red-500" />;
      default:
        return <FaCalendarAlt className="text-gray-500" />;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
        <h3 className="font-medium text-gray-700 flex items-center">
          <FaCalendarAlt className="mr-2 text-blue-500" /> Upcoming Events
        </h3>
        
        <div className="flex items-center">
          <FaFilter className="text-gray-400 mr-2" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            <option value="all">All Events</option>
            <option value="training">Training</option>
            <option value="promotion">Promotions</option>
            <option value="meeting">Meetings</option>
            <option value="recognition">Recognition</option>
            <option value="announcement">Announcements</option>
          </select>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200">
        {sortedEvents.length > 0 ? (
          sortedEvents.map((event) => (
            <div key={event.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  {getEventIcon(event.type)}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between">
                    <h4 className="text-base font-medium text-gray-900">{event.title}</h4>
                    <span className="text-sm text-gray-500">{formatDate(event.date)}</span>
                  </div>
                  
                  {(event.time || event.location) && (
                    <div className="mt-1 text-sm text-gray-500">
                      {event.time && <span>{event.time}</span>}
                      {event.time && event.location && <span> • </span>}
                      {event.location && <span>{event.location}</span>}
                    </div>
                  )}
                  
                  <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                  
                  {event.link && (
                    <Link 
                      href={event.link} 
                      className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Learn more <FaChevronRight className="ml-1 h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">No upcoming events found.</p>
          </div>
        )}
      </div>
      
      <div className="px-4 py-3 bg-gray-50 border-t text-center">
        <Link 
          href="/events" 
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          View All Events
        </Link>
      </div>
    </div>
  );
};

export default UpcomingEvents;
