import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, CheckCircle } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import PaymentGateway from "./PaymentGateway";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (commented out to prevent errors with invalid config)
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);

const SOLANA_ADDRESS = "8cdcxambJVYVXVGbQrRhFVaGs1QwhtztBEToBEyHW7Vr";
const INR_TO_USDT = 0.012; // Example conversion rate
const DEFAULT_INR = 16499;

const generateOrderId = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const product = {
  name: "CMF By Nothing WATCH PRO 2, AMOLED, GPS, BLUETOOTH CALLS - Dark Grey",
  description: "A sleek and stylish smartwatch with health tracking features.",
  price: "₹16,499",
  image: "https://th.bing.com/th/id/R.c54f25e435ed88829f8f877b5853bb4f?rik=mjIdXzzcA5mIrQ&riu=http%3a%2f%2fmoreshopping.com%2fcdn%2fshop%2ffiles%2fNewProject-2024-07-17T161339.093.jpg%3fv%3d1721222105&ehk=%2bl8JroaBaM%2by0%2bzF8%2by1V%2bGKUoelMy1CiegSus5Sqgk%3d&risl=&pid=ImgRaw&r=0"
};

interface OrderDetails {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  landmark: string;
  pincode: string;
  paymentMethod: string;
}

export default function ProductPage() {
  const [cartAdded, setCartAdded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({ 
    name: "", 
    phone: "", 
    address: "", 
    city: "", 
    state: "", 
    landmark: "", 
    pincode: "", 
    paymentMethod: "" 
  });
  const [amountUSDT, setAmountUSDT] = useState((DEFAULT_INR * INR_TO_USDT).toFixed(2));

  const handleAddToCart = () => {
    setCartAdded(true);
    setShowForm(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setOrderDetails({ ...orderDetails, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderDetails.paymentMethod === "Online") {
      setShowForm(false);
      setShowPaymentGateway(true);
    } else {
      alert("Order placed successfully!\n" + JSON.stringify(orderDetails, null, 2));
      setShowForm(false);
      setCartAdded(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
      <Card className="max-w-md w-full bg-white shadow-lg rounded-2xl overflow-hidden">
        <img src={product.image} alt={product.name} className="w-full h-64 object-cover" />
        <CardContent className="p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
          <p className="text-gray-600 mt-2">{product.description}</p>
          <p className="text-xl font-semibold text-gray-900 mt-4">{product.price}</p>
          <Button 
            className="mt-6 w-full flex items-center justify-center gap-2" 
            onClick={handleAddToCart} 
            disabled={cartAdded}
          >
            {cartAdded ? <CheckCircle size={20} /> : <ShoppingCart size={20} />}
            {cartAdded ? "Added to Cart" : "Add to Cart"}
          </Button>
        </CardContent>
      </Card>
      
      {showForm && !showPaymentGateway && (
        <Card className="mt-6 p-6 bg-white shadow-lg rounded-2xl max-w-md w-full">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Enter Order Details</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="block text-gray-700">Full Name</Label>
              <Input type="text" name="name" value={orderDetails.name} onChange={handleChange} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <Label className="block text-gray-700">Phone Number</Label>
              <Input type="tel" name="phone" value={orderDetails.phone} onChange={handleChange} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <Label className="block text-gray-700">Address</Label>
              <Input type="text" name="address" value={orderDetails.address} onChange={handleChange} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <Label className="block text-gray-700">City</Label>
              <Input type="text" name="city" value={orderDetails.city} onChange={handleChange} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <Label className="block text-gray-700">State</Label>
              <Input type="text" name="state" value={orderDetails.state} onChange={handleChange} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <Label className="block text-gray-700">Landmark</Label>
              <Input type="text" name="landmark" value={orderDetails.landmark} onChange={handleChange} className="w-full border p-2 rounded" />
            </div>
            <div>
              <Label className="block text-gray-700">Pincode</Label>
              <Input type="text" name="pincode" value={orderDetails.pincode} onChange={handleChange} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <Label className="block text-gray-700">Payment Method</Label>
              <select 
                name="paymentMethod" 
                value={orderDetails.paymentMethod} 
                onChange={handleChange} 
                required 
                className="w-full border p-2 rounded bg-gray-50 text-gray-900"
              >
                <option value="">Select Payment Method</option>
                <option value="COD">Cash on Delivery</option>
                <option value="Online">Online Payment</option>
              </select>
            </div>
            <Button type="submit" className="w-full bg-blue-500 text-white py-2 rounded-lg">Place Order</Button>
          </form>
        </Card>
      )}
      
      {showPaymentGateway && (
        <PaymentGateway amountUSDT={amountUSDT} />
      )}
    </div>
  );
}