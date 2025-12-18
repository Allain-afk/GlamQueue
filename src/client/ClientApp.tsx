import { useState, useEffect } from 'react';
import { ClientProvider, useClient } from './context/ClientContext';
import { ClientHome } from './screens/ClientHome';
import { ServicesExplore } from './screens/ServicesExplore';
import { BookingScreen } from './screens/BookingScreen';
import { MySchedule } from './screens/MySchedule';
import { Profile } from './screens/Profile';
import { BookingSuccessModal } from './components/BookingSuccessModal';
import { PaymentMethodModal } from './components/PaymentMethodModal';
import { RatingModal } from './components/RatingModal';
import { useAuth } from '../auth/useAuth';
import { getPendingBooking, clearPendingBooking } from '../utils/bookingStorage';
import { mapBookingDataToIds, parseTimeToDateTime } from '../utils/bookingMapper';
import { createBooking } from './api/bookings';
import { getUnratedCompletedBookings } from './api/ratings';
import { getMyBookings } from './api/bookings';
import { MobileBottomNav, type MobileNavItem } from '../components/mobile';
import { supabase } from '../lib/supabase';
import { getServiceImageUrl } from '../utils/imageUtils';
import { glamError } from '../lib/glamAlerts';
import type { Service, Booking } from './types';

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);
  const [scheduleInitialTab, setScheduleInitialTab] = useState<'upcoming' | 'history'>('upcoming');

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
        
        // Show payment method selection (then success modal) and clear pending booking
        setBookingId(booking.id);
        setShowPaymentModal(true);
        clearPendingBooking();
      } catch (error) {
        console.error('Error processing pending booking:', error);
        clearPendingBooking();
      }
    };
    
    processPendingBooking();
  }, [session]);

  // Check for unrated completed bookings when app loads/refreshes
  useEffect(() => {
    const checkForUnratedBookings = async () => {
      if (!session) return;
      
      try {
        const unratedBookingIds = await getUnratedCompletedBookings();
        if (unratedBookingIds.length > 0) {
          // Get the first unrated booking details
          const allBookings = await getMyBookings();
          const unratedBooking = allBookings.find(
            b => unratedBookingIds.includes(b.id) && b.status === 'completed'
          );
          
          if (unratedBooking) {
            setRatingBooking(unratedBooking);
            setShowRatingModal(true);
          }
        }
      } catch (error) {
        console.error('Error checking for unrated bookings:', error);
        // Don't show error to user - rating is optional
      }
    };

    // Check after a short delay to allow context to load
    const timer = setTimeout(checkForUnratedBookings, 1000);
    return () => clearTimeout(timer);
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
    setShowPaymentModal(true);
  };

  const handlePaymentDone = () => {
    setShowPaymentModal(false);
    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setBookingId(null);
    setScheduleInitialTab('upcoming');
    setCurrentView('schedule');
  };

  const handleViewSchedule = (tab: 'upcoming' | 'history' = 'upcoming') => {
    setScheduleInitialTab(tab);
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
        showPaymentModal={showPaymentModal}
        showRatingModal={showRatingModal}
        ratingBooking={ratingBooking}
        scheduleInitialTab={scheduleInitialTab}
        onSelectService={handleSelectService}
        onBackToHome={handleBackToHome}
        onViewSchedule={() => handleViewSchedule('upcoming')}
        onViewHistory={() => handleViewSchedule('history')}
        onViewProfile={() => setCurrentView('profile')}
        onViewAllServices={() => setCurrentView('explore')}
        onBookingComplete={handleBookingComplete}
        onPaymentDone={handlePaymentDone}
        onCloseSuccessModal={handleCloseSuccessModal}
        onCloseRatingModal={() => {
          setShowRatingModal(false);
          setRatingBooking(null);
        }}
        onRated={() => {
          // Refresh bookings after rating
          // The context will handle the refresh
        }}
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
  showPaymentModal,
  showRatingModal,
  ratingBooking,
  scheduleInitialTab,
  onSelectService,
  onBackToHome,
  onViewSchedule,
  onViewHistory,
  onViewProfile,
  onViewAllServices,
  onBookingComplete,
  onPaymentDone,
  onCloseSuccessModal,
  onCloseRatingModal,
  onRated,
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
  showPaymentModal: boolean;
  showRatingModal: boolean;
  ratingBooking: Booking | null;
  scheduleInitialTab: 'upcoming' | 'history';
  onSelectService: (service: Service) => void;
  onBackToHome: () => void;
  onViewSchedule: () => void;
  onViewHistory?: () => void;
  onViewProfile: () => void;
  onViewAllServices: () => void;
  onBookingComplete: (id: string) => void;
  onPaymentDone: () => void;
  onCloseSuccessModal: () => void;
  onCloseRatingModal: () => void;
  onRated: () => void;
  onLogout: () => void;
  onMobileNavigate: (item: MobileNavItem) => void;
  viewToNavItem: Record<ClientView, MobileNavItem>;
  onSetCurrentView: (view: ClientView) => void;
  onSetShowSuccessModal: (show: boolean) => void;
}) {
  const { refreshBookings, services } = useClient();

  const handleBookAgain = async (serviceId: string, shopId: string) => {
    // Find the service from the services list
    const service = services.find(s => s.id === serviceId && s.shop_id === shopId);
    
    if (service) {
      onSelectService(service);
    } else {
      // If service not found in cache, try to fetch it
      try {
        const { data, error } = await supabase
          .from('services')
          .select(`
            *,
            shop:shops(id, name, address)
          `)
          .eq('id', serviceId)
          .eq('shop_id', shopId)
          .single();
        
        if (error || !data) {
          glamError('Service not found. Please select a service from the explore page.');
          return;
        }
        
        // Map to Service type
        const service: Service = {
          id: String(data.id),
          name: data.name,
          description: data.description || '',
          price: Number(data.price),
          duration: data.duration,
          category: data.category,
          shop_id: String(data.shop_id),
          shop_name: data.shop?.name || '',
          shop_address: data.shop?.address || '',
          image_url: getServiceImageUrl(data.image_url, data.name) || undefined,
          rating: data.rating ? Number(data.rating) : undefined,
        };
        
        onSelectService(service);
      } catch (error) {
        console.error('Error fetching service:', error);
        glamError('Failed to load service. Please try again.');
      }
    }
  };
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
            onViewHistory={onViewHistory}
            onViewProfile={onViewProfile}
            onLogout={onLogout}
          />
        );
      case 'schedule':
        return <MySchedule onBack={onBackToHome} initialTab={scheduleInitialTab} onBookAgain={handleBookAgain} />;
      case 'profile':
        return <Profile onBack={onBackToHome} onLogout={onLogout} />;
      default:
        return (
          <ClientHome
            onSelectService={onSelectService}
            onViewAllServices={onViewAllServices}
            onViewSchedule={onViewSchedule}
            onViewHistory={onViewHistory}
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

      {showPaymentModal && bookingId && (
        <PaymentMethodModal
          bookingId={bookingId}
          onDone={() => {
            onPaymentDone();
          }}
        />
      )}
      
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

      {showRatingModal && ratingBooking && (
        <RatingModal
          isOpen={showRatingModal}
          booking={ratingBooking}
          onClose={onCloseRatingModal}
          onRated={async () => {
            await refreshBookings();
            onRated();
          }}
        />
      )}
    </div>
  );
}

