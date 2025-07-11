import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, MapPin, Globe, Shield, Users, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HelpCenter = () => {
  const navigate = useNavigate();

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
      name: 'Safaricom / Airtel / Telkom Kenya',
      description: 'For scams involving phone numbers, request collaboration or a data-sharing MoU for reported numbers.',
      icon: Phone,
      color: 'bg-green-500'
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
              >
                <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl hover:bg-slate-800/70 transition-all duration-300">
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
                  <CardContent className="space-y-4">
                    <p className="text-slate-300 text-sm">
                      {authority.description}
                    </p>
                    
                    {authority.email && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">Email:</span>
                        </div>
                        {authority.email.map((email, emailIndex) => (
                          <a
                            key={emailIndex}
                            href={`mailto:${email}`}
                            className="block text-blue-400 hover:text-blue-300 text-sm ml-6"
                          >
                            {email}
                          </a>
                        ))}
                      </div>
                    )}
                    
                    {authority.phone && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">Phone:</span>
                        </div>
                        <a
                          href={`tel:${authority.phone}`}
                          className="block text-blue-400 hover:text-blue-300 text-sm ml-6"
                        >
                          {authority.phone}
                        </a>
                      </div>
                    )}
                    
                    {authority.address && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">Address:</span>
                        </div>
                        <p className="text-slate-300 text-sm ml-6">
                          {authority.address}
                        </p>
                      </div>
                    )}
                    
                    {authority.website && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300">Website:</span>
                        </div>
                        <a
                          href={authority.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-400 hover:text-blue-300 text-sm ml-6"
                        >
                          {authority.website.replace('https://', '')}
                        </a>
                      </div>
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
                  <li>• <strong>Telecom Companies:</strong> For scams involving phone numbers or SMS fraud</li>
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