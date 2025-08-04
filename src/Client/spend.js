// Spend.js
import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { db } from "../firebase-config";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const Spend = ({ userId, balance }) => {
  const [items, setItems] = useState([{ name: "", price: 0 }]);
  const [loading, setLoading] = useState(false);

  const handleItemChange = (index, key, value) => {
    const updatedItems = [...items];
    updatedItems[index][key] = key === "price" ? parseFloat(value) || 0 : value;
    setItems(updatedItems);
  };

  const addItem = () => {
    setItems([...items, { name: "", price: 0 }]);
  };

  const removeItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price || 0), 0);
  };

  const getCommission = () => {
    return Math.ceil(getSubtotal() * 0.04);
  };

  const getTotalAmount = () => {
    return getSubtotal() + getCommission();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || items.length === 0 || items.some(item => !item.name || item.price <= 0)) {
      alert("Please fill all fields correctly.");
      return;
    }
    if (getTotalAmount() <= 0) {
      alert("Total amount must be greater than zero.");
      return;
    }
    if (getTotalAmount() > balance) {
      alert(`Total amount exceeds your balance of $${balance}.`);
      return;
    }
    setLoading(true);
    items.forEach(async (item) => {
    try {
      await addDoc(collection(db, "spendTickets"), {
        userId,
        item,
        subtotal: item.price,
        commission: item.price * 0.04,
        totalAmount: item.price + item.price * 0.04,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert("Spend request submitted!");
      setItems([{ name: "", price: 0 }]);
    } catch (err) {
      alert("Submission failed.");
    }})
    setLoading(false);
  };


  return (
    <div className="container mt-4">
      <h4>Spend Money on Services</h4>
      <Form onSubmit={handleSubmit}>
        {items.map((item, index) => (
          <div key={index} className="d-flex gap-2 mt-2">
            <Form.Control
              type="text"
              placeholder="Item name"
              value={item.name}
              onChange={(e) => handleItemChange(index, "name", e.target.value)}
              required
            />
            <Form.Control
              type="number"
              placeholder="Amount"
              value={item.price}
              onChange={(e) => handleItemChange(index, "price", e.target.value)}
              required
              min={1}
            />
            {items.length > 1 && (
              <Button variant="danger" onClick={() => removeItem(index)}>
                ✕
              </Button>
            )}
          </div>
        ))}

        <Button variant="secondary" className="mt-2" onClick={addItem}>
          + Add Item
        </Button>

        <div className="mt-3">
          <p>Subtotal: ${getSubtotal()}</p>
          <p>Commission (4%): ${getCommission()}</p>
          <h5>Total Deduction: ${getTotalAmount()}</h5>
        </div>

        <Button type="submit" className="mt-3" variant="primary" disabled={loading}>
          {loading ? "Submitting..." : "Submit Request"}
        </Button>
      </Form>
    </div>
  );
};

export default Spend;
