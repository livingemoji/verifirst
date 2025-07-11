import React from 'react';

export default function KenyaAuthorities() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 my-6 shadow-sm">
      <h2 className="text-lg font-bold mb-4 text-blue-800">Key Authorities to Contact in Kenya</h2>
      <ul className="space-y-4">
        <li>
          <div className="font-semibold text-blue-700">DCI Kenya – Cybercrime Unit</div>
          <div className="text-sm text-gray-700">For reporting cybercrime, online fraud, and scams.</div>
          <div className="text-sm">📧 <a href="mailto:info@cid.go.ke" className="underline">info@cid.go.ke</a> or <a href="mailto:dcikenya@gmail.com" className="underline">dcikenya@gmail.com</a></div>
          <div className="text-sm">📞 <a href="tel:+254207202000" className="underline">+254 20 720 2000</a></div>
          <div className="text-sm">🏢 Mazingira Complex, Kiambu Rd, Nairobi</div>
        </li>
        <li>
          <div className="font-semibold text-blue-700">Communications Authority of Kenya (KE-CIRT)</div>
          <div className="text-sm text-gray-700">Handles national cyber incident response and coordination.</div>
          <div className="text-sm">📧 <a href="mailto:incidents@ke-cirt.go.ke" className="underline">incidents@ke-cirt.go.ke</a></div>
          <div className="text-sm">🌐 <a href="https://www.ke-cirt.go.ke" target="_blank" rel="noopener noreferrer" className="underline">www.ke-cirt.go.ke</a></div>
        </li>
        <li>
          <div className="font-semibold text-blue-700">Safaricom / Airtel / Telkom Kenya</div>
          <div className="text-sm text-gray-700">For scams involving phone numbers, request collaboration or a data-sharing MoU for reported numbers.</div>
        </li>
        <li>
          <div className="font-semibold text-blue-700">Ethics & Anti-Corruption Commission (EACC)</div>
          <div className="text-sm text-gray-700">For scams involving bribes or fraud.</div>
          <div className="text-sm">📧 <a href="mailto:report@integrity.go.ke" className="underline">report@integrity.go.ke</a></div>
        </li>
        <li>
          <div className="font-semibold text-blue-700">ICT Authority</div>
          <div className="text-sm text-gray-700">For possible endorsement or support under Kenya’s Digital Economy agenda.</div>
          <div className="text-sm">🌐 <a href="https://icta.go.ke" target="_blank" rel="noopener noreferrer" className="underline">icta.go.ke</a></div>
        </li>
      </ul>
    </div>
  );
} 