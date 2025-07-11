import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Shield, Globe, Phone, Building, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HelpCenter = () => {
  const navigate = useNavigate();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const authorities = [
    {
      name: 'DCI Kenya – Cybercrime Unit',
      description: 'For reporting cybercrime, online fraud, and scams.',
      email: ['info@cid.go.ke', 'dcikenya@gmail.com'],
      phone: '+254 20 720 2000',
      address: 'Mazingira Complex, Kiambu Rd, Nairobi',
      icon: Shield,
      color: 'bg-red-500'
    },
    {
      name: 'Communications Authority of Kenya (KE-CIRT)',
      description: 'Handles national cyber incident response and coordination.',
      email: ['incidents@ke-cirt.go.ke'],
      website: 'https://www.ke-cirt.go.ke',
      icon: Globe,
      color: 'bg-blue-500'
    },
    {
      name: 'Safaricom PLC',
      description: 'For scams involving Safaricom numbers, M-PESA fraud, and mobile-related scams.',
      customerCare: {
        prepaid: '100',
        postpaid: '200',
        otherNetworks: '+254 722 002 100'
      },
      email: ['customercare@safaricom.co.ke', 'media@safaricom.co.ke', 'legal@safaricom.co.ke'],
      smsCodes: {
        fraud: '333',
        mpesa: '456'
      },
      address: 'Safaricom House, Waiyaki Way, Westlands, P.O. Box 66827-00800, Nairobi, Kenya',
      website: 'https://www.safaricom.co.ke',
      social: {
        twitter: '@SafaricomPLC',
        facebook: 'fb.com/SafaricomPLC'
      },
      icon: Phone,
      color: 'bg-green-500'
    },
    {
      name: 'Airtel Kenya',
      description: 'For scams involving Airtel numbers and mobile-related fraud.',
      customerCare: {
        airtelLine: '100',
        otherNetworks: '0733 100 100'
      },
      email: ['customerservice@ke.airtel.com', 'airtelbusiness@ke.airtel.com'],
      address: 'Airtel Kenya Ltd, Parkside Towers, Mombasa Road, P.O. Box 73146-00200, Nairobi, Kenya',
      website: 'https://www.airtel.co.ke',
      social: {
        twitter: '@Airtel_KE',
        facebook: 'fb.com/AirtelKenya'
      },
      icon: Phone,
      color: 'bg-red-600'
    },
    {
      name: 'Ethics & Anti-Corruption Commission (EACC)',
      description: 'For scams involving bribes or fraud.',
      email: ['report@integrity.go.ke'],
      icon: Building,
      color: 'bg-purple-500'
    },
    {
      name: 'ICT Authority',
      description: 'For possible endorsement or support under Kenya\'s Digital Economy agenda.',
      website: 'https://icta.go.ke',
      icon: Users,
      color: 'bg-orange-500'
    }
  ];

  const handleCardClick = (authority: any) => {
    // This function is no longer needed for the dialog, but kept for consistency
    // setSelectedAuthority(authority);
    // setShowDetails(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mb-4 text-white hover:bg-white/10"
          >
            <ChevronUp className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Help Center
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Key authorities to contact for reporting scams, cybercrime, and fraud in Kenya
            </p>
          </div>
        </motion.div>

        {/* Authorities Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {authorities.map((authority, index) => {
            const IconComponent = authority.icon;
            const isExpanded = expandedIndex === index;
            return (
              <motion.div
                key={authority.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full"
              >
                <Card 
                  className={`bg-slate-800/50 border-slate-700/50 backdrop-blur-xl transition-all duration-300 h-full cursor-pointer flex flex-col justify-between ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}
                  onMouseEnter={e => e.currentTarget.classList.add('shadow-lg', 'scale-[1.02]')}
                  onMouseLeave={e => e.currentTarget.classList.remove('shadow-lg', 'scale-[1.02]')}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${authority.color}`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-white text-lg">
                        {authority.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex flex-col h-full">
                    <p className="text-slate-300 text-sm flex-grow">
                      {authority.description}
                    </p>
                    <Button 
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2 bg-slate-900/30 hover:bg-blue-700/30 text-white border-blue-700/30 transition-all duration-200"
                      onClick={e => {
                        e.stopPropagation();
                        setExpandedIndex(isExpanded ? null : index);
                      }}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {isExpanded ? 'Hide Details' : 'Read More'}
                    </Button>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 space-y-2 text-slate-200 text-sm"
                      >
                        {authority.email && (
                          <div>
                            <span className="font-semibold">Email:</span> {authority.email.map((em: string, i: number) => (
                              <a key={em} href={`mailto:${em}`} className="underline ml-1">{em}{i < authority.email.length - 1 ? ',' : ''}</a>
                            ))}
                          </div>
                        )}
                        {authority.phone && (
                          <div><span className="font-semibold">Phone:</span> <a href={`tel:${authority.phone}`} className="underline ml-1">{authority.phone}</a></div>
                        )}
                        {authority.address && (
                          <div><span className="font-semibold">Address:</span> <span className="ml-1">{authority.address}</span></div>
                        )}
                        {authority.website && (
                          <div><span className="font-semibold">Website:</span> <a href={authority.website} target="_blank" rel="noopener noreferrer" className="underline ml-1">{authority.website}</a></div>
                        )}
                        {authority.customerCare && (
                          <div>
                            <span className="font-semibold">Customer Care:</span>
                            <ul className="ml-4 list-disc">
                              {Object.entries(authority.customerCare).map(([k, v]) => (
                                <li key={k}><span className="capitalize">{k}:</span> <span className="ml-1">{v}</span></li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {authority.smsCodes && (
                          <div>
                            <span className="font-semibold">SMS Codes:</span>
                            <ul className="ml-4 list-disc">
                              {Object.entries(authority.smsCodes).map(([k, v]) => (
                                <li key={k}><span className="capitalize">{k}:</span> <span className="ml-1">{v}</span></li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {authority.social && (
                          <div>
                            <span className="font-semibold">Social:</span>
                            <ul className="ml-4 list-disc">
                              {authority.social.twitter && <li>Twitter: <a href={`https://twitter.com/${authority.social.twitter.replace('@', '')}`} className="underline ml-1" target="_blank" rel="noopener noreferrer">{authority.social.twitter}</a></li>}
                              {authority.social.facebook && <li>Facebook: <a href={`https://${authority.social.facebook.replace('fb.com/', 'facebook.com/')}`} className="underline ml-1" target="_blank" rel="noopener noreferrer">{authority.social.facebook}</a></li>}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12"
        >
          <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-300">
              <div className="space-y-2">
                <h4 className="font-semibold text-white">When to Contact Each Authority:</h4>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>DCI Kenya:</strong> For cybercrime, online fraud, and general scam reports</li>
                  <li>• <strong>KE-CIRT:</strong> For national cyber incident response and coordination</li>
                  <li>• <strong>Safaricom:</strong> For scams involving Safaricom numbers, M-PESA fraud, and mobile-related scams</li>
                  <li>• <strong>Airtel:</strong> For scams involving Airtel numbers and mobile-related fraud</li>
                  <li>• <strong>EACC:</strong> For scams involving corruption, bribes, or government fraud</li>
                  <li>• <strong>ICT Authority:</strong> For digital economy related scams and policy support</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-white">Emergency Contacts:</h4>
                <p className="text-sm">
                  For immediate threats or emergencies, contact the nearest police station or call the national emergency number.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default HelpCenter; 