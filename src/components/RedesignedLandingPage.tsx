import { Download, Smartphone, TrendingUp, Calendar, MapPin, Phone, Mail, Facebook, Instagram, Twitter } from 'lucide-react';
import { SimpleChatBot } from './SimpleChatBot';
import { AnalyticsAIChatbot } from './AnalyticsAIChatbot';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useState, type MouseEvent } from 'react';
import { savePendingBooking } from '../utils/bookingStorage';
import { type PlanType } from './OnboardingPaymentScreen';
import '../styles/components/redesigned-landing.css';
import '../styles/components/analytics-chatbot.css';
import '../styles/components/pwa-install.css';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onStartOnboarding?: (planType: PlanType) => void;
}

export function RedesignedLandingPage({ onGetStarted, onLogin, onStartOnboarding }: LandingPageProps) {
  const { install: installPWA, isInstalled } = usePWAInstall();
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Booking form state
  const [bookingData, setBookingData] = useState({
    name: '',
    phone: '',
    email: '',
    salon: '',
    service: '',
    time: '',
    isAdvanceBooking: false,
  });
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, targetId: string) => {
    event.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoginClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 300);
  };

  const handleSignUpClick = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onGetStarted();
    }, 300);
  };

  const handleAndroidDownload = () => {
    setShowAndroidModal(true);
  };

  const handleAPKDownload = () => {
    //APK download link from GitHub Releases
    const apkDownloadUrl = 'https://github.com/Allain-afk/GlamQueue/releases/download/v1.0.0/app-release.apk';
    window.open(apkDownloadUrl, '_blank');
  };

  const handleCopyDownloadLink = () => {
    const apkDownloadUrl = 'https://github.com/Allain-afk/GlamQueue/releases/download/v1.0.0/app-release.apk';
    navigator.clipboard.writeText(apkDownloadUrl).then(() => {
      alert('Download link copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = apkDownloadUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Download link copied to clipboard!');
    });
  };

  const handleIOSDownload = () => {
    setShowIOSModal(true);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!bookingData.name || !bookingData.email || !bookingData.phone || 
        !bookingData.salon || !bookingData.service || !selectedDate || !bookingData.time) {
      alert('Please fill in all fields and select a date and time');
      return;
    }
    
    // Save booking data and redirect to sign-up
    const pendingBooking = {
      name: bookingData.name,
      phone: bookingData.phone,
      email: bookingData.email,
      salon: bookingData.salon,
      service: bookingData.service,
      date: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD format
      time: bookingData.time,
      isAdvanceBooking: bookingData.isAdvanceBooking,
    };
    
    savePendingBooking(pendingBooking);
    
    // Redirect to sign-up (which will be triggered by onGetStarted)
    onGetStarted();
  };
  
  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Adjust to start with Monday (0 = Monday, 6 = Sunday)
    const adjustedStartingDay = (startingDayOfWeek + 6) % 7;
    
    return { daysInMonth, startingDayOfWeek: adjustedStartingDay };
  };
  
  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };
  
  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === currentDate.getMonth() &&
      selectedDate.getFullYear() === currentDate.getFullYear()
    );
  };
  
  const isPastDate = (day: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };
  
  const handleDateClick = (day: number) => {
    if (isPastDate(day)) return;
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(newDate);
  };
  
  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    // Reset selected date if it's in a different month
    if (selectedDate && (selectedDate.getMonth() !== newDate.getMonth() || selectedDate.getFullYear() !== newDate.getFullYear())) {
      setSelectedDate(null);
    }
  };
  
  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    // Reset selected date if it's in a different month
    if (selectedDate && (selectedDate.getMonth() !== newDate.getMonth() || selectedDate.getFullYear() !== newDate.getFullYear())) {
      setSelectedDate(null);
    }
  };
  
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="date-cell empty"></div>);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isPast = isPastDate(day);
      const isTodayDate = isToday(day);
      const isSelectedDate = isSelected(day);
      
      let className = 'date-cell';
      if (isPast) {
        className += ' past';
      } else if (isSelectedDate) {
        className += ' selected';
      } else if (isTodayDate) {
        className += ' today';
      } else {
        className += ' available';
      }
      
      days.push(
        <div
          key={day}
          className={className}
          onClick={() => !isPast && handleDateClick(day)}
        >
          {day}
        </div>
      );
    }
    
    return days;
  };

  const closeModal = () => {
    setShowAndroidModal(false);
    setShowIOSModal(false);
    setShowBookingModal(false);
  };

  return (
    <div className="redesigned-landing-page">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* Header */}
      <header className="redesigned-header">
        <div className="header-container">
          <div className="logo-section">
            <img
              src="/images/GlamQueue-Header-Logo.png"
              alt="GlamQueue Logo"
              className="logo-image"
            />
          </div>

          <nav className="main-nav">
            <ul className="nav-menu">
              <li className="nav-item">
                <a
                  href="#hero"
                  className="nav-link"
                  onClick={(event) => handleNavClick(event, 'hero')}
                >
                  <span>Home</span>
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#about"
                  className="nav-link"
                  onClick={(event) => handleNavClick(event, 'about')}
                >
                  <span>About</span>
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#services"
                  className="nav-link"
                  onClick={(event) => handleNavClick(event, 'services')}
                >
                  <span>Services</span>
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#pricing"
                  className="nav-link"
                  onClick={(event) => handleNavClick(event, 'pricing')}
                >
                  <span>Pricing</span>
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#contact"
                  className="nav-link"
                  onClick={(event) => handleNavClick(event, 'contact')}
                >
                  <span>Contact</span>
                </a>
              </li>
            </ul>
          </nav>

          <div className="header-actions">

            <button className="header-link-btn" onClick={handleLoginClick} disabled={isLoading}>
              Login
            </button>
            <button className="login-btn" onClick={handleSignUpClick} disabled={isLoading}>
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Transform Your Salon Business
            </h1>
            <p className="hero-subtitle">
              The future of salon management is here. Streamline your operations, 
              delight your customers, and grow your business with GlamQueue.
            </p>
            <div className="hero-cta">
              <button className="primary-btn" onClick={handleSignUpClick} disabled={isLoading}>
                Book Now!
              </button>
              <button className="secondary-btn">
                Watch Demo
              </button>
            </div>
          </div>
          <div className="hero-image">
            <img 
              src="/images/GlamQueue-Hero-Image.png" 
              alt="GlamQueue Dashboard" 
              className="hero-img"
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section" id="about">
        <div className="about-container">
          <div className="about-content">
            <span className="section-eyebrow">About GlamQueue</span>
            <h2 className="about-title">We build salon experiences that clients remember</h2>
            <p className="about-description">
              GlamQueue combines human care with intelligent automation so your team can
              focus on delivering luxurious treatments. From easy booking flows to live
              performance dashboards, we give your brand everything it needs to grow with
              confidence.
            </p>

            <div className="about-highlights">
              <div className="about-highlight">
                <h3>Purpose-built platform</h3>
                <p>
                  Streamlined workflows for stylists, front desk teams, and managers.
                  Customize the experience for every branch and service line.
                </p>
              </div>
              <div className="about-highlight">
                <h3>Guided partnership</h3>
                <p>
                  From onboarding to expansion, our success managers ensure your salon
                  leverages every feature and sees results fast.
                </p>
              </div>
            </div>

            <div className="about-stats">
              <div className="about-stat">
                <span className="about-stat-number">120+</span>
                <span className="about-stat-label">Salons scaling with GlamQueue</span>
              </div>
              <div className="about-stat">
                <span className="about-stat-number">4.9/5</span>
                <span className="about-stat-label">Average customer satisfaction</span>
              </div>
            </div>

            <div className="about-actions">
              <button 
                className="primary-btn" 
                onClick={() => onStartOnboarding ? onStartOnboarding('free-trial') : handleSignUpClick()} 
                disabled={isLoading}
              >
                Start Free Trial
              </button>
              <button
                className="about-link-btn"
                type="button"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Talk to our team
              </button>
            </div>
          </div>

          <div className="about-visual">
            <div className="about-visual-card">
              <span className="about-visual-eyebrow">Partner Spotlight</span>
              <p className="about-visual-quote">
                “We filled our weekday slots and doubled recurring memberships in just three months.”
              </p>
              <div className="about-visual-meta">
                <span className="about-visual-name">Glow &amp; Co. Studios</span>
                <span className="about-visual-role">5-branch salon collective</span>
              </div>
            </div>

            <div className="about-visual-grid">
              <div className="about-stat-box">
                <span className="box-value">+32%</span>
                <span className="box-label">Repeat visits</span>
              </div>
              <div className="about-stat-box">
                <span className="box-value">2×</span>
                <span className="box-label">Faster check-ins</span>
              </div>
              <div className="about-stat-box">
                <span className="box-value">6 weeks</span>
                <span className="box-label">Average launch time</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section" id="services">
        <div className="services-container">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">
            Everything you need to manage your salon business efficiently
          </p>
          
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">
                <Calendar size={40} />
              </div>
              <h3 className="service-title">Appointment Booking</h3>
              <p className="service-description">
                Easy online booking system that your customers will love. 
                Reduce no-shows with automated reminders.
              </p>
            </div>
            
            <div className="service-card analytics-card">
              <div className="service-icon">
                <TrendingUp size={40} />
              </div>
              <h3 className="service-title">Analytics & Reports</h3>
              <p className="service-description">
                Track your business performance with detailed analytics 
                and AI-powered insights to help you grow.
              </p>
              <div className="analytics-chatbot-wrapper">
                <AnalyticsAIChatbot />
              </div>
            </div>
            
            <div className="service-card">
              <div className="service-icon">
                <Smartphone size={40} />
              </div>
              <h3 className="service-title">Mobile App</h3>
              <p className="service-description">
                Manage your salon on the go with our intuitive mobile 
                application for iOS and Android.
              </p>
            </div>
            
            <div className="service-card">
              <div className="service-icon">
                <Phone size={40} />
              </div>
              <h3 className="service-title">Customer Support</h3>
              <p className="service-description">
                Dedicated support team to help you get the most out of 
                your GlamQueue experience.
              </p>
            </div>
            
            <div className="service-card">
              <div className="service-icon">
                <Mail size={40} />
              </div>
              <h3 className="service-title">Email Marketing</h3>
              <p className="service-description">
                Keep your customers engaged with automated email campaigns 
                and personalized offers.
              </p>
            </div>
            
            <div className="service-card">
              <div className="service-icon">
                <MapPin size={40} />
              </div>
              <h3 className="service-title">Location Services</h3>
              <p className="service-description">
                Help customers find your salon with integrated maps 
                and location-based features.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section" id="pricing">
        <div className="pricing-container">
          <h2 className="section-title">Simple. Transparent Plans</h2>
          <p className="section-subtitle">
            Start free for 14-days. Cancel Anytime.
          </p>
          
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3 className="plan-name">Freemium</h3>
              <div className="plan-price">₱0</div>
              <div className="plan-period">for 14 days</div>
              <ul className="plan-features">
                <li className="plan-feature">All Pro features for 14 days</li>
                <li className="plan-feature">No credit card required</li>
                <li className="plan-feature">Cancel Anytime.</li>
              </ul>
              <button 
                className="pricing-btn" 
                onClick={() => onStartOnboarding ? onStartOnboarding('free-trial') : handleSignUpClick()} 
                disabled={isLoading}
              >
                Start Free Trial
              </button>
            </div>
            
            <div className="pricing-card featured">
              <h3 className="plan-name">Pro</h3>
              <div className="plan-price">₱1,499</div>
              <div className="plan-period">per month</div>
              <ul className="plan-features">
                <li className="plan-feature">100 Appointments per day</li>
                <li className="plan-feature">Client CRM & loyalty tools</li>
                <li className="plan-feature">AI scheduling & chatbot</li>
                <li className="plan-feature">Multibranch support</li>
                <li className="plan-feature">Advanced analytics</li>
              </ul>
              <button 
                className="pricing-btn" 
                onClick={() => onStartOnboarding ? onStartOnboarding('pro') : handleSignUpClick()} 
                disabled={isLoading}
              >
                Get Pro
              </button>
            </div>
            
            <div className="pricing-card">
              <h3 className="plan-name">Enterprise</h3>
              <div className="plan-price">Custom Pricing</div>
              <div className="plan-period">billed annually</div>
              <ul className="plan-features">
                <li className="plan-feature">Unlimited appointments</li>
                <li className="plan-feature">Dedicated success manager</li>
                <li className="plan-feature">SLA & priority support</li>
                <li className="plan-feature">Custom integrations</li>
                <li className="plan-feature">Security review & SSO</li>
              </ul>
              <button 
                className="pricing-btn" 
                onClick={() => onStartOnboarding ? onStartOnboarding('enterprise') : handleSignUpClick()} 
                disabled={isLoading}
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PWA Section */}
      <section className="pwa-section">
        <div className="pwa-container">
          <div className="pwa-content">
            <div>
              <h2 className="pwa-title">We take care of our clients and our people.</h2>
              <div className="pwa-buttons">
                <button 
                  className="pwa-button" 
                  onClick={async () => {
                    const result = await installPWA();
                    if (!result.success && result.message) {
                      // Instructions already shown in install function
                      console.log('Install result:', result);
                    }
                  }}
                  disabled={isInstalled}
                  style={{ opacity: isInstalled ? 0.6 : 1, cursor: isInstalled ? 'not-allowed' : 'pointer' }}
                >
                  <div className="pwa-button-icon">
                    <Download size={20} />
                  </div>
                  <span>{isInstalled ? 'Already Installed' : 'Install PWA'}</span>
                </button>
                <button className="pwa-button" onClick={handleAndroidDownload}>
                  <div className="pwa-button-icon">
                    <Smartphone size={20} />
                  </div>
                  <span>Download Android App</span>
                </button>
                <button className="pwa-button" onClick={handleIOSDownload}>
                  <div className="pwa-button-icon">
                    <Smartphone size={20} />
                  </div>
                  <span>Download iOS App</span>
                </button>
              </div>
            </div>
            <div className="pwa-image">
              <img 
                src="/images/GlamQueue-People-Install-Section.png" 
                alt="GlamQueue Team" 
                className="pwa-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Book An Appointment Section */}
      <section className="booking-section">
        <div className="booking-container">
          <h2 className="booking-title">Book An Appointment</h2>
          <div className="booking-content">
            <form className="booking-form" onSubmit={handleBookingSubmit}>
              <div className="form-row">
                <div className="form-field">
                  <div className="field-icon">👤</div>
                  <input 
                    type="text" 
                    placeholder="Name" 
                    className="form-input" 
                    value={bookingData.name}
                    onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-field">
                  <div className="field-icon">📞</div>
                  <input 
                    type="tel" 
                    placeholder="Phone" 
                    className="form-input" 
                    value={bookingData.phone}
                    onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="form-field full-width">
                <div className="field-icon">@</div>
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  className="form-input" 
                  value={bookingData.email}
                  onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-field">
                  <div className="field-icon">🏢</div>
                  <select 
                    className="form-select"
                    value={bookingData.salon}
                    onChange={(e) => setBookingData({ ...bookingData, salon: e.target.value })}
                    required
                  >
                    <option value="">Select Salon</option>
                    <option value="Glam Studio Manila">Glam Studio Manila</option>
                    <option value="Beauty Lounge BGC">Beauty Lounge BGC</option>
                    <option value="Nail Spa Quezon City">Nail Spa Quezon City</option>
                  </select>
                  <div className="dropdown-arrow">▼</div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-field">
                  <div className="field-icon">✂️</div>
                  <select 
                    className="form-select"
                    value={bookingData.service}
                    onChange={(e) => setBookingData({ ...bookingData, service: e.target.value })}
                    required
                  >
                    <option value="">Select Services</option>
                    <option value="Premium Haircut">Premium Haircut</option>
                    <option value="Hair Coloring">Hair Coloring</option>
                    <option value="Manicure & Pedicure">Manicure & Pedicure</option>
                    <option value="Facial Treatment">Facial Treatment</option>
                    <option value="Hair Styling">Hair Styling</option>
                    <option value="Keratin Treatment">Keratin Treatment</option>
                  </select>
                  <div className="dropdown-arrow">▼</div>
                </div>
                <div className="form-field">
                  <div className="field-icon">🕐</div>
                  <select 
                    className="form-select"
                    value={bookingData.time}
                    onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                    required
                  >
                    <option value="">Time</option>
                    <option value="9:00 AM">9:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="1:00 PM">1:00 PM</option>
                    <option value="2:00 PM">2:00 PM</option>
                    <option value="3:00 PM">3:00 PM</option>
                    <option value="4:00 PM">4:00 PM</option>
                    <option value="5:00 PM">5:00 PM</option>
                  </select>
                  <div className="dropdown-arrow">▼</div>
                </div>
              </div>
              
              {/* Advance Booking Option */}
              <div className="form-field full-width" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={bookingData.isAdvanceBooking}
                    onChange={(e) => setBookingData({ ...bookingData, isAdvanceBooking: e.target.checked })}
                    style={{ 
                      width: '20px', 
                      height: '20px', 
                      cursor: 'pointer', 
                      accentColor: '#e91e8c',
                      flexShrink: 0
                    }}
                  />
                  <span style={{ color: '#4a4a4a', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    📅 Book this appointment in advance (recommended for future dates)
                  </span>
                </label>
              </div>
              
              <button type="submit" className="booking-btn">Book An Appointment</button>
            </form>
            
            <div className="booking-calendar">
              <div className="calendar-header">
                <button 
                  type="button"
                  className="calendar-nav" 
                  onClick={handlePrevMonth}
                >
                  ‹
                </button>
                <h3 className="calendar-month">{formatMonthYear(currentDate)}</h3>
                <button 
                  type="button"
                  className="calendar-nav" 
                  onClick={handleNextMonth}
                >
                  ›
                </button>
              </div>
              
              <div className="calendar-grid">
                <div className="calendar-days">
                  <div className="day-header">Mo</div>
                  <div className="day-header">Tu</div>
                  <div className="day-header">We</div>
                  <div className="day-header">Th</div>
                  <div className="day-header">Fr</div>
                  <div className="day-header">Sa</div>
                  <div className="day-header">Su</div>
                </div>
                
                <div className="calendar-dates">
                  {renderCalendar()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-section" id="contact">
        <div className="footer-container">
          <div className="footer-content">
            <div>
              <h3 className="footer-section-title">How can we help?</h3>
              <ul className="footer-links">
                <li><a href="#" className="footer-link">Services</a></li>
                <li><a href="#" className="footer-link">Contact Us</a></li>
                <li><a href="#" className="footer-link">FAQ</a></li>
                <li><a href="#" className="footer-link">Our Brand</a></li>
                <li><a href="#" className="footer-link">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="footer-section-title">Keep in touch with GlamQueue</h3>
              <p style={{ color: '#cccccc', marginBottom: '1.5rem' }}>
                Join the Glam newsletter and be first to hear about news and offers
              </p>
              <form className="newsletter-form">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="newsletter-input"
                />
                <button type="submit" className="newsletter-btn">Subscribe</button>
              </form>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '1rem' }}>
                <input type="checkbox" id="privacy" style={{ marginTop: '0.25rem' }} />
                <label htmlFor="privacy" style={{ color: '#cccccc', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  By submitting your email, you agree to receive advertising emails from Glam. 
                  Please review our Privacy Policy, which includes our Financial Incentive Notice.
                </label>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <div>
              <p>© 2025 GlamQueue. All Rights Reserved. The future of salon management.</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <span>USPF</span>
                <span>0999 143 1234</span>
              </div>
            </div>
            <div>
              <div className="social-links">
                <a href="#" className="social-link"><Facebook size={20} /></a>
                <a href="#" className="social-link"><Instagram size={20} /></a>
                <a href="#" className="social-link"><Twitter size={20} /></a>
                <a href="#" className="social-link"><Mail size={20} /></a>
                <a href="#" className="social-link"><Phone size={20} /></a>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <a href="#" className="footer-link">Terms & Conditions</a>
                <a href="#" className="footer-link">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ChatBot Widget */}
      <SimpleChatBot />

      {/* Android Download Modal */}
      {showAndroidModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Download GlamQueue Android App</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="download-instructions">
                <h4>📱 How to Install:</h4>
                <ol>
                  <li>Click the download button below</li>
                  <li>Allow installation from unknown sources when prompted</li>
                  <li>Open the downloaded APK file</li>
                  <li>Follow the installation instructions</li>
                </ol>
                <div className="download-buttons">
                  <button className="download-btn primary" onClick={handleAPKDownload}>
                    📥 Download APK (MB)
                  </button>
                  <button className="download-btn secondary" onClick={handleCopyDownloadLink}>
                    📋 Copy Download Link
                  </button>
                </div>
                <p className="download-note">
                  <strong>Note:</strong> This is a beta version. For the latest updates, visit our website regularly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Coming Soon Modal */}
      {showIOSModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>iOS App Coming Soon</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="coming-soon-content">
                <div className="coming-soon-icon">🍎</div>
                <h4>We're working on it!</h4>
                <p>Our iOS app is currently in development and will be available soon in the App Store.</p>
                <div className="coming-soon-features">
                  <h5>What to expect:</h5>
                  <ul>
                    <li>✓ Full salon management features</li>
                    <li>✓ Appointment booking & scheduling</li>
                    <li>✓ Client management & CRM</li>
                    <li>✓ Analytics & reporting</li>
                    <li>✓ Offline functionality</li>
                  </ul>
                </div>
                <div className="notify-section">
                  <p>Want to be notified when it's ready?</p>
                  <div className="notify-form">
                    <input type="email" placeholder="Enter your email" className="notify-input" />
                    <button className="notify-btn">Notify Me</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Success Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Appointment Booked Successfully!</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="booking-success-content">
                <div className="success-icon">✅</div>
                <h4>Thank you for booking with GlamQueue!</h4>
                <p>We've received your appointment request and will contact you shortly to confirm the details.</p>
                <div className="booking-details">
                  <h5>What happens next:</h5>
                  <ul>
                    <li>📞 We'll call you within 24 hours to confirm</li>
                    <li>📧 You'll receive a confirmation email</li>
                    <li>📱 We'll send you a reminder 24 hours before your appointment</li>
                  </ul>
                </div>
                <div className="booking-actions">
                  <button className="action-btn primary" onClick={closeModal}>
                    Got it!
                  </button>
                  <button className="action-btn secondary" onClick={() => {
                    closeModal();
                    // Scroll to contact section
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    Contact Us
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

