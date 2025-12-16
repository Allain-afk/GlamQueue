import { useState } from 'react';
import { Mail, Phone, MessageCircle, Video, Clock, Star, ExternalLink } from 'lucide-react';
import Swal from 'sweetalert2';

interface SuccessManager {
  name: string;
  title: string;
  email: string;
  phone: string;
  photo: string;
  calendlyLink?: string;
  availability: string;
}

interface SuccessManagerCardProps {
  compact?: boolean;
}

// Default success manager for Enterprise accounts
const defaultSuccessManager: SuccessManager = {
  name: 'Allain Ralph Legaspi',
  title: 'Senior Customer Success Manager / Senior Developer',
  email: 'allain.legaspi@glamqueue.com',
  phone: '+63 917 123 4567',
  photo: '/assets/Allain-Legaspi-Profile.jpg',
  calendlyLink: 'https://calendly.com/glamqueue-enterprise',
  availability: 'Mon-Fri, 9AM-6PM PHT'
};

export function SuccessManagerCard({ compact = false }: SuccessManagerCardProps) {
  const [manager] = useState<SuccessManager>(defaultSuccessManager);

  const handleEmailClick = () => {
    window.location.href = `mailto:${manager.email}?subject=Enterprise Support Request - GlamQueue`;
  };

  const handlePhoneClick = () => {
    window.location.href = `tel:${manager.phone}`;
  };

  const handleScheduleCall = () => {
    if (manager.calendlyLink) {
      window.open(manager.calendlyLink, '_blank');
    } else {
      Swal.fire({
        title: 'Schedule a Call',
        html: `
          <div class="text-left space-y-3">
            <p class="text-gray-600">Contact ${manager.name} to schedule a call:</p>
            <div class="flex items-center gap-2 text-gray-700">
              <span class="font-medium">Email:</span>
              <a href="mailto:${manager.email}" class="text-pink-600 hover:underline">${manager.email}</a>
            </div>
            <div class="flex items-center gap-2 text-gray-700">
              <span class="font-medium">Phone:</span>
              <a href="tel:${manager.phone}" class="text-pink-600 hover:underline">${manager.phone}</a>
            </div>
          </div>
        `,
        icon: 'info',
        confirmButtonText: 'Got it',
        confirmButtonColor: '#ec4899',
      });
    }
  };

  const handleStartChat = () => {
    Swal.fire({
      title: 'Start a Conversation',
      html: `
        <div class="text-left space-y-4">
          <textarea 
            id="chat-message" 
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent" 
            rows="4" 
            placeholder="Hi ${manager.name.split(' ')[0]}, I need help with..."
          ></textarea>
          <p class="text-sm text-gray-500">Your message will be sent to ${manager.name}. Expected response time: within 2 hours during business hours.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Send Message',
      confirmButtonColor: '#ec4899',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const message = (document.getElementById('chat-message') as HTMLTextAreaElement)?.value;
        if (!message || message.trim().length < 10) {
          Swal.showValidationMessage('Please enter a message (at least 10 characters)');
          return false;
        }
        return message;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // In a real app, this would send the message to the backend
        Swal.fire({
          icon: 'success',
          title: 'Message Sent!',
          text: `${manager.name.split(' ')[0]} will get back to you shortly.`,
          timer: 2500,
          showConfirmButton: false,
        });
      }
    });
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
        <div className="flex items-center gap-3">
          <img
            src={manager.photo}
            alt={manager.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{manager.name}</p>
            <p className="text-xs text-gray-600">Your Success Manager</p>
          </div>
          <button
            onClick={handleStartChat}
            className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            title="Message"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 sm:p-6 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-5 h-5 text-yellow-300" />
          <span className="text-sm font-medium">Enterprise Support</span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold">Your Dedicated Success Manager</h3>
        <p className="text-sm text-white/80 mt-1">Priority support for your business</p>
      </div>

      {/* Manager Info */}
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <img
            src={manager.photo}
            alt={manager.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-pink-100 shadow-lg"
          />
          <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-900">{manager.name}</h4>
            <p className="text-sm text-gray-600">{manager.title}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{manager.availability}</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-4 space-y-2">
          <button
            onClick={handleEmailClick}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
          >
            <Mail className="w-5 h-5 text-pink-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900 truncate">{manager.email}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={handlePhoneClick}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
          >
            <Phone className="w-5 h-5 text-pink-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900">{manager.phone}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={handleScheduleCall}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium text-sm"
          >
            <Video className="w-4 h-4" />
            <span>Schedule Call</span>
          </button>
          <button
            onClick={handleStartChat}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Message</span>
          </button>
        </div>

        {/* SLA Info */}
        <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">Priority Support Active</span>
          </div>
          <p className="text-xs text-green-600 mt-1">Response guaranteed within 2 hours during business hours</p>
        </div>
      </div>
    </div>
  );
}
