import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Mail, Phone, MapPin, Globe, Shield, Users, Building, MessageCircle, Twitter, Facebook, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HelpCenter = () => {
  const navigate = useNavigate();
  const [selectedAuthority, setSelectedAuthority] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

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
    setSelectedAuthority(authority);
    setShowDetails(true);
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
            <ArrowLeft className="h-4 w-4 mr-2" />
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
            return (
              <motion.div
                key={authority.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-full"
              >
                <Card 
                  className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl hover:bg-slate-800/70 transition-all duration-300 h-full cursor-pointer"
                  onClick={() => handleCardClick(authority)}
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
                    
                    {/* Preview of contact info */}
                    <div className="space-y-2">
                      {authority.customerCare && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">Customer Care Available</span>
                        </div>
                      )}
                      
                      {authority.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">{authority.email.length} Email(s)</span>
                        </div>
                      )}
                      
                      {authority.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">Phone Available</span>
                        </div>
                      )}
                      
                      {authority.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">Website Available</span>
                        </div>
                      )}
                    </div>
                    
                    {/* View Details Button */}
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(authority);
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-800/95 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedAuthority?.color}`}>
                  {selectedAuthority?.icon && <selectedAuthority.icon className="h-5 w-5 text-white" />}
                </div>
                {selectedAuthority?.name}
              </DialogTitle>
            </DialogHeader>
            
            {selectedAuthority && (
              <div className="space-y-6">
                <p className="text-slate-300 text-lg">
                  {selectedAuthority.description}
                </p>
                
                {/* Customer Care Numbers */}
                {selectedAuthority.customerCare && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-lg">
                      <Phone className="h-5 w-5 text-slate-400" />
                      <span className="text-slate-300 font-semibold">Customer Care (24/7):</span>
                    </div>
                    {selectedAuthority.customerCare.prepaid && (
                      <div className="ml-7 text-base">
                        <span className="text-slate-300">Prepaid: </span>
                        <span className="text-blue-400">Dial {selectedAuthority.customerCare.prepaid}</span>
                      </div>
                    )}
                    {selectedAuthority.customerCare.postpaid && (
                      <div className="ml-7 text-base">
                        <span className="text-slate-300">Postpaid: </span>
                        <span className="text-blue-400">Dial {selectedAuthority.customerCare.postpaid}</span>
                      </div>
                    )}
                    {selectedAuthority.customerCare.airtelLine && (
                      <div className="ml-7 text-base">
                        <span className="text-slate-300">From Airtel: </span>
                        <span className="text-blue-400">Dial {selectedAuthority.customerCare.airtelLine}</span>
                      </div>
                    )}
                    {selectedAuthority.customerCare.otherNetworks && (
                      <div className="ml-7 text-base">
                        <span className="text-slate-300">Other Networks: </span>
                        <a href={`tel:${selectedAuthority.customerCare.otherNetworks}`} className="text-blue-400 hover:text-blue-300">
                          {selectedAuthority.customerCare.otherNetworks}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                {/* SMS Codes */}
                {selectedAuthority.smsCodes && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-lg">
                      <MessageCircle className="h-5 w-5 text-slate-400" />
                      <span className="text-slate-300 font-semibold">SMS Short Codes:</span>
                    </div>
                    {selectedAuthority.smsCodes.fraud && (
                      <div className="ml-7 text-base">
                        <span className="text-slate-300">Fraud Reporting: </span>
                        <span className="text-blue-400">{selectedAuthority.smsCodes.fraud}</span>
                        <span className="text-slate-400 text-sm"> (send scammer's number & details)</span>
                      </div>
                    )}
                    {selectedAuthority.smsCodes.mpesa && (
                      <div className="ml-7 text-base">
                        <span className="text-slate-300">M-PESA Fraud: </span>
                        <span className="text-blue-400">{selectedAuthority.smsCodes.mpesa}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Email */}
                {selectedAuthority.email && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-lg">
                      <Mail className="h-5 w-5 text-slate-400" />
                      <span className="text-slate-300 font-semibold">Email:</span>
                    </div>
                    {selectedAuthority.email.map((email: string, emailIndex: number) => (
                      <a
                        key={emailIndex}
                        href={`mailto:${email}`}
                        className="block text-blue-400 hover:text-blue-300 text-base ml-7"
                      >
                        {email}
                      </a>
                    ))}
                  </div>
                )}
                
                {/* Phone */}
                {selectedAuthority.phone && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-lg">
                      <Phone className="h-5 w-5 text-slate-400" />
                      <span className="text-slate-300 font-semibold">Phone:</span>
                    </div>
                    <a
                      href={`tel:${selectedAuthority.phone}`}
                      className="block text-blue-400 hover:text-blue-300 text-base ml-7"
                    >
                      {selectedAuthority.phone}
                    </a>
                  </div>
                )}
                
                {/* Address */}
                {selectedAuthority.address && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-slate-400" />
                      <span className="text-slate-300 font-semibold">Address:</span>
                    </div>
                    <p className="text-slate-300 text-base ml-7">
                      {selectedAuthority.address}
                    </p>
                  </div>
                )}
                
                {/* Website */}
                {selectedAuthority.website && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-lg">
                      <Globe className="h-5 w-5 text-slate-400" />
                      <span className="text-slate-300 font-semibold">Website:</span>
                    </div>
                    <a
                      href={selectedAuthority.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-400 hover:text-blue-300 text-base ml-7"
                    >
                      {selectedAuthority.website.replace('https://', '')}
                    </a>
                  </div>
                )}
                
                {/* Social Media */}
                {selectedAuthority.social && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-lg">
                      <span className="text-slate-300 font-semibold">Social Media:</span>
                    </div>
                    <div className="ml-7 space-y-2">
                      {selectedAuthority.social.twitter && (
                        <div className="flex items-center gap-2 text-base">
                          <Twitter className="h-4 w-4 text-blue-400" />
                          <span className="text-blue-400">{selectedAuthority.social.twitter}</span>
                        </div>
                      )}
                      {selectedAuthority.social.facebook && (
                        <div className="flex items-center gap-2 text-base">
                          <Facebook className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-400">{selectedAuthority.social.facebook}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

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