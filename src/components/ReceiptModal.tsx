import React from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PaymentTransactionReceipt } from '../types';

interface ReceiptModalProps {
  receipt: PaymentTransactionReceipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, isOpen, onClose }) => {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 relative print:shadow-none print:border-none print:w-full">
        
        {/* Modal Top Bar - Hidden when printing */}
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Official Escrow Payment Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt Printable Content */}
        <div id="receipt-printable-content" className="p-6 sm:p-8 space-y-6">
          
          {/* Header Brand */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  YANC
                </span>
                <span className="text-sm font-bold text-gray-800">CONNECT</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">Young Minds | Networking | Life Skills</p>
              <p className="text-[10px] text-gray-400">Bangalore, Karnataka, India • support@yanc.in</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ESCROW SECURED
              </span>
              <p className="text-[10px] text-gray-500 mt-1 font-mono">ID: {receipt.transactionId}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Date & Time</p>
              <p className="font-semibold text-gray-800 mt-0.5">
                {new Date(receipt.date).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Payment Method</p>
              <p className="font-semibold text-gray-800 mt-0.5 capitalize">
                {receipt.paymentMethod} {receipt.cardOrUpiLast4 ? `(${receipt.cardOrUpiLast4})` : ''}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Paid By (Founder)</p>
              <p className="font-semibold text-gray-800 mt-0.5">{receipt.payerName}</p>
              <p className="text-[11px] text-gray-500">{receipt.payerEmail}</p>
            </div>
            <div>
              <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Beneficiary / Provider</p>
              <p className="font-semibold text-gray-800 mt-0.5">{receipt.beneficiaryName}</p>
              <p className="text-[11px] text-purple-600 font-medium">YANC Verified Provider</p>
            </div>
          </div>

          {/* Line Item Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Escrow Terms</th>
                  <th className="p-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="p-3">
                    <p className="font-semibold text-gray-800">{receipt.itemTitle}</p>
                    <p className="text-[10px] text-gray-500">
                      {receipt.type === 'session_escrow' 
                        ? '1-on-1 Deep Dive Session with Verified Provider' 
                        : 'Yearly Advisory Board Package Fee'}
                    </p>
                  </td>
                  <td className="p-3 text-right text-gray-500 text-[11px]">
                    Held until session memo verified
                  </td>
                  <td className="p-3 text-right font-bold text-gray-900">
                    ₹{receipt.amountInr.toLocaleString('en-IN')}
                  </td>
                </tr>
                {receipt.creditsUsed && receipt.creditsUsed > 0 && (
                  <tr className="bg-purple-50/50">
                    <td className="p-3 text-purple-900 font-medium" colSpan={2}>
                      YANC Credits Applied (1 Credit = ₹100)
                    </td>
                    <td className="p-3 text-right font-semibold text-purple-700">
                      -{receipt.creditsUsed} Credits
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200 font-bold text-gray-900">
                <tr>
                  <td className="p-3" colSpan={2}>Total Amount Held in Escrow</td>
                  <td className="p-3 text-right text-sm text-purple-700">
                    ₹{receipt.amountInr.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Escrow Guarantee Notice */}
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 text-[11px] text-purple-900 leading-relaxed">
            <span className="font-bold block mb-0.5">🔒 Escrow Protection Guarantee:</span>
            Funds remain safely locked in YANC Escrow until the provider conducts the session, submits a thorough Teardown Memo, and passes Finance Admin audit. If rejected or cancelled, 100% of funds/credits are immediately returned.
          </div>

          {/* Footer Note */}
          <div className="text-center text-[10px] text-gray-400 pt-2 border-t border-gray-100">
            This is a computer-generated receipt issued by YANC Connect Escrow System.
          </div>
        </div>

      </div>
    </div>
  );
};
