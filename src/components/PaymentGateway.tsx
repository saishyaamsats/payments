import React, { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Landmark, Smartphone, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const SOLANA_ADDRESS = "8cdcxambJVYVXVGbQrRhFVaGs1QwhtztBEToBEyHW7Vr";
const API_URL = "http://localhost:8080";

const generateOrderId = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

interface PaymentGatewayProps {
  amountUSDT: string;
}

const PaymentGateway = ({ amountUSDT }: PaymentGatewayProps) => {
  const [tradeType, setTradeType] = useState<"local" | "international">("international");
  const [localPaymentMethod, setLocalPaymentMethod] = useState<"upi" | "bank" | "card" | "">("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 min timer
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [backendAvailable, setBackendAvailable] = useState(false);
  
  // UPI specific state
  const [upiId, setUpiId] = useState("");
  
  // Bank transfer specific state
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountName, setAccountName] = useState("");
  
  // Card specific state
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");

  // Check if backend is available
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_URL}/health`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        
        if (response.ok) {
          setBackendAvailable(true);
          console.log("Backend is available");
        }
      } catch (error) {
        console.error("Backend connection error:", error);
        setBackendAvailable(false);
      }
    };
    
    checkBackend();
  }, []);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  useEffect(() => {
    if (!timerActive) return;
    const checkPayment = setInterval(async () => {
      try {
        // Mock API call since we don't have a real backend
        if (Math.random() > 0.95) { // Simulate occasional success
          setPaymentConfirmed(true);
          setOrderId(generateOrderId());
          clearInterval(checkPayment);
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        if (timeLeft <= 0) {
          setError("Failed to verify payment. Please try again.");
        }
      }
    }, 5000);
    return () => clearInterval(checkPayment);
  }, [timerActive, timeLeft]);

  useEffect(() => {
    if (paymentConfirmed) {
      // In a real app, we would redirect to a success page
      console.log("Payment confirmed, order ID:", orderId);
    }
  }, [paymentConfirmed, orderId]);

  const copyAddress = () => {
    navigator.clipboard.writeText(SOLANA_ADDRESS);
    toast.success("Address copied to clipboard!");
  };

  const handleSentClick = () => {
    setLoading(true);
    setTimeout(() => {
      setPaymentConfirmed(true);
      setOrderId(generateOrderId());
      setLoading(false);
    }, 1000);
  };

  const handleLocalPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let paymentData: any = {
      amount: 16499,
    };
    
    // Add method-specific data
    switch (localPaymentMethod) {
      case "upi":
        paymentData.method = "upi";
        paymentData.upiId = upiId;
        break;
      case "bank":
        paymentData.method = "bank";
        paymentData.accountNumber = accountNumber;
        paymentData.ifscCode = ifscCode;
        paymentData.accountName = accountName;
        break;
      case "card":
        paymentData.method = "card";
        paymentData.cardNumber = cardNumber;
        paymentData.expiryDate = expiryDate;
        paymentData.nameOnCard = nameOnCard;
        break;
    }
    
    if (backendAvailable) {
      try {
        const response = await fetch(`${API_URL}/api/local-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(paymentData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          setPaymentConfirmed(true);
          setOrderId(data.orderId);
          toast.success("Payment processed successfully!");
        } else {
          setError(data.error || "Payment processing failed");
          toast.error(data.error || "Payment processing failed");
        }
      } catch (error) {
        console.error("Payment error:", error);
        setError("Connection error. Please try again.");
        toast.error("Connection error. Please try again.");
      }
    } else {
      // Fallback to mock payment if backend is not available
      setTimeout(() => {
        setPaymentConfirmed(true);
        setOrderId(generateOrderId());
        toast.success("Payment processed successfully!");
      }, 1500);
    }
    
    setLoading(false);
  };

  const renderLocalPaymentMethod = () => {
    switch (localPaymentMethod) {
      case "upi":
        return (
          <form onSubmit={handleLocalPayment} className="mt-4 space-y-4">
            <div>
              <Label className="text-white">UPI ID</Label>
              <Input 
                type="text" 
                value={upiId} 
                onChange={(e) => setUpiId(e.target.value)} 
                placeholder="example@upi" 
                required 
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <p className="text-sm text-gray-400">Amount: ₹16,499</p>
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? "Processing..." : "Pay Now"}
            </Button>
          </form>
        );
      
      case "bank":
        return (
          <form onSubmit={handleLocalPayment} className="mt-4 space-y-4">
            <div>
              <Label className="text-white">Account Number</Label>
              <Input 
                type="text" 
                value={accountNumber} 
                onChange={(e) => setAccountNumber(e.target.value)} 
                placeholder="Enter account number" 
                required 
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label className="text-white">IFSC Code</Label>
              <Input 
                type="text" 
                value={ifscCode} 
                onChange={(e) => setIfscCode(e.target.value)} 
                placeholder="IFSC code" 
                required 
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div>
              <Label className="text-white">Account Holder Name</Label>
              <Input 
                type="text" 
                value={accountName} 
                onChange={(e) => setAccountName(e.target.value)} 
                placeholder="Enter name" 
                required 
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <p className="text-sm text-gray-400">Amount: ₹16,499</p>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Processing..." : "Transfer Now"}
            </Button>
          </form>
        );
      
      case "card":
        return (
          <form onSubmit={handleLocalPayment} className="mt-4 space-y-4">
            <div>
              <Label className="text-white">Card Number</Label>
              <Input 
                type="text" 
                value={cardNumber} 
                onChange={(e) => setCardNumber(e.target.value)} 
                placeholder="XXXX XXXX XXXX XXXX" 
                required 
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Expiry Date</Label>
                <Input 
                  type="text" 
                  value={expiryDate} 
                  onChange={(e) => setExpiryDate(e.target.value)} 
                  placeholder="MM/YY" 
                  required 
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>
              <div>
                <Label className="text-white">CVV</Label>
                <Input 
                  type="password" 
                  value={cvv} 
                  onChange={(e) => setCvv(e.target.value)} 
                  placeholder="XXX" 
                  required 
                  className="bg-gray-700 text-white border-gray-600"
                />
              </div>
            </div>
            <div>
              <Label className="text-white">Name on Card</Label>
              <Input 
                type="text" 
                value={nameOnCard} 
                onChange={(e) => setNameOnCard(e.target.value)} 
                placeholder="Enter name" 
                required 
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <p className="text-sm text-gray-400">Amount: ₹16,499</p>
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={loading}
            >
              {loading ? "Processing..." : "Pay with Card"}
            </Button>
          </form>
        );
      
      default:
        return (
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Button 
              onClick={() => setLocalPaymentMethod("upi")}
              className="flex flex-col items-center justify-center p-4 h-auto"
              variant="outline"
            >
              <Smartphone className="h-8 w-8 mb-2" />
              <span>UPI</span>
            </Button>
            <Button 
              onClick={() => setLocalPaymentMethod("bank")}
              className="flex flex-col items-center justify-center p-4 h-auto"
              variant="outline"
            >
              <Landmark className="h-8 w-8 mb-2" />
              <span>Bank Transfer</span>
            </Button>
            <Button 
              onClick={() => setLocalPaymentMethod("card")}
              className="flex flex-col items-center justify-center p-4 h-auto"
              variant="outline"
            >
              <CreditCard className="h-8 w-8 mb-2" />
              <span>Card</span>
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-900 text-white min-h-screen text-center">
      <h1 className="text-2xl font-bold mb-4">Payment Gateway</h1>
      
      {!backendAvailable && tradeType === "local" && (
        <div className="bg-yellow-800 text-yellow-100 p-2 rounded-md flex items-center mb-4 w-full max-w-md">
          <AlertCircle className="mr-2 h-4 w-4" />
          <span className="text-sm">Backend connection unavailable. Using fallback mode.</span>
        </div>
      )}
      
      <Tabs defaultValue="international" className="w-full max-w-md" onValueChange={(value) => setTradeType(value as "local" | "international")}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="local">Local Trade</TabsTrigger>
          <TabsTrigger value="international">International Trade</TabsTrigger>
        </TabsList>
        
        <TabsContent value="local" className="w-full">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Local Payment Options</h2>
              
              {paymentConfirmed ? (
                <div className="mt-4 text-green-500 text-lg bg-gray-900 p-4 rounded-lg">
                  <p className="text-2xl font-bold">🎉 Payment Successful! ✅</p>
                  <p className="mt-2">Order ID: {orderId}</p>
                  <p className="text-sm text-gray-400 mt-2">Your order has been placed successfully.</p>
                </div>
              ) : (
                renderLocalPaymentMethod()
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="international" className="w-full">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">International Payment</h2>
              
              {paymentConfirmed ? (
                <div className="mt-4 text-green-500 text-lg bg-gray-900 p-4 rounded-lg">
                  <p className="text-2xl font-bold">🎉 Payment Successful! ✅</p>
                  <p className="mt-2">Order ID: {orderId}</p>
                  <p className="text-sm text-gray-400 mt-2">Your order has been placed successfully.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm mb-1 font-semibold">Send {amountUSDT} USDT to:</p>
                  <div className="flex items-center bg-gray-700 p-2 rounded mb-2 w-full justify-between">
                    <span className="text-xs font-mono truncate">{SOLANA_ADDRESS}</span>
                    <button onClick={copyAddress} className="px-2 py-1 bg-blue-500 text-white rounded text-xs">Copy</button>
                  </div>
                  <button 
                    onClick={() => { setTimerActive(true); setShowQR(true); }}
                    className="mb-2 px-3 py-1 bg-green-500 text-white rounded text-sm w-full"
                  >
                    Open QR
                  </button>
                  <div className={`flex justify-center p-2 rounded mb-2 ${showQR ? "bg-white" : "bg-gray-700 blur-sm"}`}>
                    <QRCodeCanvas value={SOLANA_ADDRESS} size={150} />
                  </div>
                  {timerActive && (
                    <p className="text-red-500 text-4xl font-extrabold my-2">
                      Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                    </p>
                  )}
                  <button 
                    onClick={handleSentClick}
                    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded text-sm w-full"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Sent"}
                  </button>
                </>
              )}
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentGateway;