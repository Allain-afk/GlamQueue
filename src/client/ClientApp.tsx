import { useState, useEffect } from 'react';
import { ClientProvider } from './context/ClientContext';
import { ClientHome } from './screens/ClientHome';
import { ServicesExplore } from './screens/ServicesExplore';
import { BookingScreen } from './screens/BookingScreen';
import { MySchedule } from './screens/MySchedule';
import { Profile } from './screens/Profile';
import { BookingSuccessModal } from './components/BookingSuccessModal';
import { useAuth } from '../auth/useAuth';
import { getPendingBooking, clearPendingBooking } from '../utils/bookingStorage';
import { mapBookingDataToIds, parseTimeToDateTime } from '../utils/bookingMapper';
import { createBooking } from './api/bookings';
import { MobileBottomNav, type MobileNavItem } from '../components/mobile';
import type { Service } from './types';

type ClientView = 'home' | 'explore' | 'booking' | 'schedule' | 'profile';

// Map ClientView to MobileNavItem
const viewToNavItem: Record<ClientView, MobileNavItem> = {
  home: 'home',
  explore: 'explore',
  booking: 'explore',
  schedule: 'schedule',
  profile: 'more',
};

interface ClientAppProps {
  onBackToLanding: () => void;
  onLogout: () => void;
  onRequireLogin: () => void;
}

export function ClientApp({ onLogout, onRequireLogin }: ClientAppProps) {
  const { session } = useAuth();
  const [currentView, setCurrentView] = useState<ClientView>('home');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!session) {
      onRequireLogin();
    }
  }, [session, onRequireLogin]);

  // Process pending booking after authentication
  useEffect(() => {
    const processPendingBooking = async () => {
      if (!session) return;
      
      const pendingBooking = getPendingBooking();
      if (!pendingBooking) return;
      
      try {
        // Map salon and service names to IDs
        const ids = await mapBookingDataToIds(pendingBooking.salon, pendingBooking.service);
        if (!ids) {
          console.error('Could not map salon/service names to IDs');
          clearPendingBooking();
          return;
        }
        
        // Parse date and time to ISO datetime
        const dateTime = parseTimeToDateTime(pendingBooking.date, pendingBooking.time);
        
        // Create the booking
        const notes = pendingBooking.isAdvanceBooking 
          ? `Advance booking from landing page. Name: ${pendingBooking.name}, Phone: ${pendingBooking.phone}`
          : `Booking from landing page. Name: ${pendingBooking.name}, Phone: ${pendingBooking.phone}`;
        
        const booking = await createBooking({
          service_id: ids.serviceId,
          shop_id: ids.shopId,
          date_time: dateTime,
          notes: notes,
        });
        
        console.log('Pending booking created successfully:', booking);
        
        // Show success modal and clear pending booking
        setBookingId(booking.id);
        setShowSuccessModal(true);
        clearPendingBooking();
      } catch (error) {
        console.error('Error processing pending booking:', error);
        clearPendingBooking();
      }
    };
    
    processPendingBooking();
  }, [session]);

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setCurrentView('booking');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedService(null);
  };

  const handleBookingComplete = (id: string) => {
    setBookingId(id);
    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setBookingId(null);
    setCurrentView('schedule');
  };

  // Handle mobile navigation
  const handleMobileNavigate = (item: MobileNavItem) => {
    switch (item) {
      case 'home':
        setCurrentView('home');
        break;
      case 'explore':
        setCurrentView('explore');
        break;
      case 'schedule':
        setCurrentView('schedule');
        break;
      case 'more':
        setCurrentView('profile');
        break;
    }
    setSelectedService(null);
  };

  // Don't render if not authenticated
  if (!session) {
    return null;
  }

  return (
    <ClientProvider>
      <ClientAppContent
        currentView={currentView}
        selectedService={selectedService}
        showSuccessModal={showSuccessModal}
        bookingId={bookingId}
        onSelectService={handleSelectService}
        onBackToHome={handleBackToHome}
        onViewSchedule={() => setCurrentView('schedule')}
        onViewProfile={() => setCurrentView('profile')}
        onViewAllServices={() => setCurrentView('explore')}
        onBookingComplete={handleBookingComplete}
        onCloseSuccessModal={handleCloseSuccessModal}
        onLogout={onLogout}
        onMobileNavigate={handleMobileNavigate}
        viewToNavItem={viewToNavItem}
        onSetCurrentView={setCurrentView}
        onSetShowSuccessModal={setShowSuccessModal}
      />
    </ClientProvider>
  );
}

// Separate component that uses the context - ensures it's within ClientProvider
function ClientAppContent({
  currentView,
  selectedService,
  showSuccessModal,
  bookingId,
  onSelectService,
  onBackToHome,
  onViewSchedule,
  onViewProfile,
  onViewAllServices,
  onBookingComplete,
  onCloseSuccessModal,
  onLogout,
  onMobileNavigate,
  viewToNavItem,
  onSetCurrentView,
  onSetShowSuccessModal,
}: {
  currentView: ClientView;
  selectedService: Service | null;
  showSuccessModal: boolean;
  bookingId: string | null;
  onSelectService: (service: Service) => void;
  onBackToHome: () => void;
  onViewSchedule: () => void;
  onViewProfile: () => void;
  onViewAllServices: () => void;
  onBookingComplete: (id: string) => void;
  onCloseSuccessModal: () => void;
  onLogout: () => void;
  onMobileNavigate: (item: MobileNavItem) => void;
  viewToNavItem: Record<ClientView, MobileNavItem>;
  onSetCurrentView: (view: ClientView) => void;
  onSetShowSuccessModal: (show: boolean) => void;
}) {
  // Render view component based on current view
  const renderView = () => {
    switch (currentView) {
      case 'explore':
        return (
          <ServicesExplore
            onSelectService={onSelectService}
            onBack={onBackToHome}
          />
        );
      case 'booking':
        return selectedService ? (
          <BookingScreen
            service={selectedService}
            onBack={() => onSetCurrentView('explore')}
            onBookingComplete={onBookingComplete}
          />
        ) : (
          <ClientHome
            onSelectService={onSelectService}
            onViewAllServices={onViewAllServices}
            onViewSchedule={onViewSchedule}
            onViewProfile={onViewProfile}
            onLogout={onLogout}
          />
        );
      case 'schedule':
        return <MySchedule onBack={onBackToHome} />;
      case 'profile':
        return <Profile onBack={onBackToHome} onLogout={onLogout} />;
      default:
        return (
          <ClientHome
            onSelectService={onSelectService}
            onViewAllServices={onViewAllServices}
            onViewSchedule={onViewSchedule}
            onViewProfile={onViewProfile}
            onLogout={onLogout}
          />
        );
    }
  };

  return (
    <div className="min-h-screen mobile-layout">
      {renderView()}
      
      {/* Mobile Bottom Navigation - only visible on mobile */}
      <MobileBottomNav 
        activeItem={viewToNavItem[currentView]} 
        onNavigate={onMobileNavigate} 
      />
      
      {showSuccessModal && (
        <BookingSuccessModal
          bookingId={bookingId}
          onClose={onCloseSuccessModal}
          onViewSchedule={() => {
            onSetShowSuccessModal(false);
            onSetCurrentView('schedule');
          }}
        />
      )}
    </div>
  );
}

