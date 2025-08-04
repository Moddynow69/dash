import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Table } from "react-bootstrap";
import { db } from "../firebase-config";

const TransactionHistory = ({ userId, isAdmin }) => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      let q = collection(db, "transactions");
      if (!isAdmin) {
        q = query(q, where("userId", "==", userId));
      }
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setTransactions(data);
      console.log("Transactions fetched:", data);
    };
    fetchData();
  }, [userId, isAdmin]);

  return (
    <div className="mt-4">
      <h5>{isAdmin ? "All" : "Your"} Transaction History</h5>
      <Table striped bordered hover size="sm">
        <thead>
          <tr>
            <th>#</th>
            <th>Type</th>
            <th>Item Name</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, index) => (
            <tr key={tx.id}>
              <td>{index + 1}</td>
              <td>{tx.type}</td>
              <td>{tx.itemName ? tx.itemName : "N/A"}</td>
              <td>${tx.amount}</td>
              <td>
                <span style={{ color: tx.status === "rejected" ? "red" : "green" }}>
                  {tx.status}
                </span>
              </td>
              <td>{new Date(tx.createdAt.seconds * 1000).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>

    </div>
  );
};

export default TransactionHistory;
