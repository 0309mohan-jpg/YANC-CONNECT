import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  QrCode, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Coins, 
  Download, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { PaymentTransactionReceipt, User, YancMember } from '../types';
import { ReceiptModal } from './ReceiptModal';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemTitle: string;
  amountInr: number;
  beneficiaryName: string;
  payerUser: User;
  yancMemberData?: YancMember | null;
  onSuccess: (details: {
    transactionId: string;
    paymentMethod: 'cash' | 'credits';
    creditsUsed?: number;
    amountInr: number;
  }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  itemTitle,
  amountInr,
  beneficiaryName,
  payerUser,
  yancMemberData,
  onSuccess
}) => {
  const [paymentChoice, setPaymentChoice] = useState<'cash' | 'credits'>('cash');
  const [tab, setTab] = useState<'card' | 'upi'>('card');
  const [hasConsented, setHasConsented] = useState(false);
  const [simulationOutcome, setSimulationOutcome] = useState<'success' | 'failure'>('success');
  const [status, setStatus] = useState<'checkout' | 'processing' | 'success' | 'failure'>('checkout');
  
  // Card inputs
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [cardError, setCardError] = useState('');

  // UPI inputs
  const [upiId, setUpiId] = useState('founder@upi');
  const [upiError, setUpiError] = useState('');

  // Generated receipt
  const [receipt, setReceipt] = useState<PaymentTransactionReceipt | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  if (!isOpen) return null;

  // 1 Credit = ₹100
  const requiredCredits = Math.ceil(amountInr / 100);
  const userCreditBalance = yancMemberData?.creditBalance || 0;
  const hasEnoughCredits = userCreditBalance >= requiredCredits;

  const handlePay = () => {
    if (!hasConsented) return;
    setCardError('');
    setUpiError('');

    if (paymentChoice === 'cash') {
      if (tab === 'card') {
        if (!cardNumber.trim() || cardNumber.length < 10) {
          setCardError('Please enter a valid card number');
          return;
        }
        if (!cardExpiry.includes('/')) {
          setCardError('Expiry must be in MM/YY format');
          return;
        }
        if (!cardCvv || cardCvv.length < 3) {
          setCardError('Valid CVV required');
          return;
        }
      } else {
        if (!upiId.includes('@')) {
          setUpiError('Enter a valid UPI ID (e.g. name@bank)');
          return;
        }
      }
    } else {
      if (!hasEnoughCredits) {
        setCardError('Insufficient credit balance');
        return;
      }
    }

    // Begin 2-second processing simulation
    setStatus('processing');

    setTimeout(() => {
      if (simulationOutcome === 'failure') {
        setStatus('failure');
      } else {
        const txnId = `TXN_YANC_${Date.now().toString().slice(-8)}`;
        const createdReceipt: PaymentTransactionReceipt = {
          transactionId: txnId,
          date: new Date().toISOString(),
          type: itemTitle.includes('Advisory') ? 'advisory_package' : 'session_escrow',
          itemTitle,
          amountInr,
          creditsUsed: paymentChoice === 'credits' ? requiredCredits : 0,
          payerName: payerUser.name,
          payerEmail: payerUser.email,
          beneficiaryName,
          status: 'Escrow Held',
          paymentMethod: paymentChoice === 'credits' ? 'YANC Credits' : (tab === 'card' ? 'Credit/Debit Card' : 'UPI Instant Pay'),
          cardOrUpiLast4: paymentChoice === 'credits' ? `${requiredCredits} credits` : (tab === 'card' ? '4242' : upiId)
        };
        setReceipt(createdReceipt);
        setStatus('success');
      }
    }, 2000);
  };

  const handleFinishSuccess = () => {
    if (receipt) {
      onSuccess({
        transactionId: receipt.transactionId,
        paymentMethod: paymentChoice,
        creditsUsed: paymentChoice === 'credits' ? requiredCredits : 0,
        amountInr
      });
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 relative">
          
          {/* Razorpay-style Gateway Top Bar */}
          <div className="bg-[#1E1B4B] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-xs">
                YC
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">YANC Connect Secure Gateway</p>
                <p className="text-[10px] text-purple-300">Verified Escrow Checkout (Test Mode)</p>
              </div>
            </div>
            
            {status !== 'processing' && (
              <button 
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Dev Simulation Switcher Pill */}
          {status === 'checkout' && (
            <div className="bg-purple-50 px-4 py-1.5 border-b border-purple-100 flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold text-purple-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Gateway Simulation:
              </span>
              <div className="flex items-center bg-white rounded-full p-0.5 border border-purple-200">
                <button
                  type="button"
                  onClick={() => setSimulationOutcome('success')}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                    simulationOutcome === 'success' 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Success
                </button>
                <button
                  type="button"
                  onClick={() => setSimulationOutcome('failure')}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                    simulationOutcome === 'failure' 
                      ? 'bg-red-600 text-white' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Fail (Test)
                </button>
              </div>
            </div>
          )}

          {/* State 1: Checkout Screen */}
          {status === 'checkout' && (
            <div className="p-6 space-y-4">
              {/* Order Summary Card */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Order Summary</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{itemTitle}</p>
                <p className="text-xs text-gray-500">Beneficiary: <span className="font-semibold text-gray-700">{beneficiaryName}</span></p>

                <div className="mt-3 pt-2 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600">Total Due:</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-purple-700">₹{amountInr.toLocaleString('en-IN')}</span>
                    {yancMemberData && (
                      <span className="block text-[10px] text-gray-500">or {requiredCredits} YANC Credits</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Mode Selector (Cash vs YANC Credits for members) */}
              {yancMemberData ? (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Choose Payment Option</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('cash')}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                        paymentChoice === 'cash' 
                          ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs' 
                          : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-xs font-bold">Online Pay</p>
                        <p className="text-[10px] text-gray-500">Cards, UPI</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={!hasEnoughCredits}
                      onClick={() => setPaymentChoice('credits')}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                        !hasEnoughCredits 
                          ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' 
                          : paymentChoice === 'credits' 
                            ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs' 
                            : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <Coins className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="text-xs font-bold">YANC Credits</p>
                        <p className="text-[10px] text-gray-500">Balance: {userCreditBalance}</p>
                      </div>
                    </button>
                  </div>
                  {!hasEnoughCredits && (
                    <p className="text-[10px] text-amber-700 mt-1">
                      * Insufficient credits (Need {requiredCredits}, have {userCreditBalance}). Please select Online Pay.
                    </p>
                  )}
                </div>
              ) : null}

              {/* Cash Tabs: Card vs UPI */}
              {paymentChoice === 'cash' && (
                <div>
                  <div className="flex border-b border-gray-200 mb-3">
                    <button
                      type="button"
                      onClick={() => setTab('card')}
                      className={`flex-1 pb-2 text-xs font-bold transition border-b-2 flex items-center justify-center gap-1.5 ${
                        tab === 'card' 
                          ? 'border-purple-600 text-purple-700' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Debit / Credit Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('upi')}
                      className={`flex-1 pb-2 text-xs font-bold transition border-b-2 flex items-center justify-center gap-1.5 ${
                        tab === 'upi' 
                          ? 'border-purple-600 text-purple-700' 
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Instant UPI
                    </button>
                  </div>

                  {tab === 'card' ? (
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Card Number</label>
                        <input
                          id="input-payment-card-number"
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 4242 4242 4242"
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Valid Thru (MM/YY)</label>
                          <input
                            id="input-payment-card-expiry"
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 mb-1">CVV</label>
                          <input
                            id="input-payment-card-cvv"
                            type="password"
                            maxLength={4}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            placeholder="•••"
                            className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                          />
                        </div>
                      </div>
                      {cardError && (
                        <p className="text-[11px] text-red-600">{cardError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 mb-1">Enter UPI ID / VPA</label>
                        <input
                          id="input-payment-upi"
                          type="text"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          placeholder="e.g. founder@upi"
                          className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                        />
                      </div>
                      {upiError && (
                        <p className="text-[11px] text-red-600">{upiError}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {paymentChoice === 'credits' && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1 text-xs">
                  <p className="font-bold text-purple-900">Paying with YANC Membership Credits</p>
                  <p className="text-purple-800">
                    <span className="font-semibold">{requiredCredits} credits</span> will be deducted from your balance of {userCreditBalance}.
                  </p>
                  <p className="text-[11px] text-purple-600">
                    Your session will be immediately treated as fully funded in escrow at ₹{amountInr.toLocaleString('en-IN')}.
                  </p>
                </div>
              )}

              {/* Mandatory Escrow Consent Checkbox */}
              <div className="pt-2 border-t border-gray-100">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-gray-700 select-none">
                  <input
                    id="chk-escrow-consent"
                    type="checkbox"
                    checked={hasConsented}
                    onChange={(e) => setHasConsented(e.target.checked)}
                    className="mt-0.5 rounded text-purple-600 focus:ring-purple-500 w-4 h-4 border-gray-300"
                  />
                  <span className="leading-snug">
                    I understand this amount will be held in escrow until the session is completed and verified.
                  </span>
                </label>
              </div>

              {/* Pay Button */}
              <button
                id="btn-confirm-payment"
                onClick={handlePay}
                disabled={!hasConsented}
                className="w-full py-3 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                {paymentChoice === 'credits' 
                  ? `Redeem ${requiredCredits} Credits (Escrow ₹${amountInr})`
                  : `Pay ₹${amountInr.toLocaleString('en-IN')}`
                }
              </button>
            </div>
          )}

          {/* State 2: Processing Spinner */}
          {status === 'processing' && (
            <div className="p-10 text-center space-y-4">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto" />
              <div>
                <h4 className="text-base font-bold text-gray-900">Processing Escrow Deposit...</h4>
                <p className="text-xs text-gray-500 mt-1">
                  Connecting to bank network and locking funds into YANC Connect Escrow.
                </p>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full w-2/3 animate-pulse" />
              </div>
            </div>
          )}

          {/* State 3: Payment Success Confirmation */}
          {status === 'success' && receipt && (
            <div className="p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900">Payment Secured in Escrow!</h4>
                <p className="text-xs text-emerald-700 font-semibold mt-0.5">Transaction ID: {receipt.transactionId}</p>
                <p className="text-xs text-gray-600 mt-2">
                  ₹{receipt.amountInr.toLocaleString('en-IN')} has been safely deposited into escrow. The slot has been locked for you.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl text-left text-xs space-y-1 border border-gray-200">
                <p><span className="text-gray-500">Service:</span> <span className="font-semibold text-gray-800">{receipt.itemTitle}</span></p>
                <p><span className="text-gray-500">Provider:</span> <span className="font-semibold text-gray-800">{receipt.beneficiaryName}</span></p>
                <p><span className="text-gray-500">Method:</span> <span className="font-semibold text-gray-800">{receipt.paymentMethod}</span></p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  id="btn-download-receipt"
                  onClick={() => setShowReceiptModal(true)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Download Receipt
                </button>
                <button
                  id="btn-payment-continue"
                  onClick={handleFinishSuccess}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* State 4: Payment Failure Screen */}
          {status === 'failure' && (
            <div className="p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-gray-900">Payment Failed</h4>
                <p className="text-xs text-red-600 mt-1">
                  Bank network declined the transaction or simulator flag was set to Failure.
                </p>
              </div>

              <p className="text-xs text-gray-500">
                No funds were deducted. You can retry with a different card or UPI ID.
              </p>

              <button
                id="btn-retry-payment"
                onClick={() => setStatus('checkout')}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Printable Receipt Modal */}
      {receipt && (
        <ReceiptModal
          receipt={receipt}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </>
  );
};
