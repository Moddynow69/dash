import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Table, Button, Container, Navbar, Row, Col } from "react-bootstrap";
import QrService from "../services/qr.services";
import TicketDataSerivce from "../services/ticket.services";
import "../App.css";
import { doc, getDoc, setDoc, updateDoc, getDocs, collection, deleteDoc } from "firebase/firestore";
import { db } from "../firebase-config";


function Dashboard() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedInAdmin");
    if (loggedIn !== "true") {
      navigate("/");
    }
  }, [navigate]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      await QrService.uploadQrImage(file);
      alert("QR Code updated on ImgBB successfully!");
    } catch (err) {
      alert("Upload failed");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };
  const [tickets, setTickets] = useState([]);
  useEffect(() => {
    gettickets();
  }, []);
  setInterval(() => {
    gettickets();
  }, 300000);
  const gettickets = async () => {
    const data = await TicketDataSerivce.getAll();
    console.log(data.docs);
    setTickets(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  const deleteHandler = async (id, userId, amount) => {
    if (userId && amount) {
      const userDocRef = doc(db, "accounts", userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const currentAmount = userDoc.data().amount || 0;
        await updateDoc(userDocRef, { amount: currentAmount + Number(amount) });
      } else {
        await setDoc(userDocRef, { amount: Number(amount) });
      }
    }

    await TicketDataSerivce.remove(id);
    gettickets();
  };

  const [spendTickets, setSpendTickets] = useState([]);

  const getSpendTickets = async () => {
    const data = await getDocs(collection(db, "spendTickets"));
    setSpendTickets(data.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    console.log(data.docs);
  };

  useEffect(() => {
    getSpendTickets();
  }, []);

  const approveSpend = async (id, userId, totalAmount) => {
    const userDocRef = doc(db, "accounts", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const currentAmount = userDoc.data().amount || 0;
      if (currentAmount >= totalAmount) {
        await updateDoc(userDocRef, { amount: currentAmount - totalAmount });
        await deleteDoc(doc(db, "spendTickets", id));
        alert("Spend approved and amount deducted!");
      } else {
        alert("Insufficient balance.");
      }
    }
    getSpendTickets();
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" className="header">
        <Container>
          <Navbar.Brand href="#home">Admin Dashboard</Navbar.Brand>
        </Container>
      </Navbar>

      <Container className="my-4">
        <h5>Upload QR Code Image</h5>
        <input type="file" accept="image/*" onChange={handleUpload} />
        {uploading && <p>Uploading to ImgBB...</p>}
      </Container>

      <Container>
        <Row>
          <Col>
            <div className="mb-2">
              <Button variant="dark edit" onClick={gettickets}>
                Refresh List
              </Button>
            </div>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Account Name</th>
                  <th>Amount</th>
                  <th>Transaction ID</th>
                  <th>Payment Proof</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((doc, index) => {
                  return (
                    <tr key={doc.id}>
                      <td>{index + 1}</td>
                      <td>{doc.userId}</td>
                      <td>{doc.amount}</td>
                      <td>{doc.transactionId}</td>
                      <td><img onClick={() => window.open(doc.paymentProof, "_blank")} src={doc.paymentProof} alt="Payment Proof" style={{ width: "100px", height: "auto" }} /></td>
                      <td>
                        <Button
                          variant="secondary"
                          className="edit"
                          onClick={() => deleteHandler(doc.id, doc.userId, doc.amount)}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="danger"
                          className="delete"
                          onClick={() => deleteHandler(doc.id, null, null)}
                        >
                          Reject
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Col>
        </Row>
        <h5>Spend Requests</h5>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>#</th>
              <th>User</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticketDoc) => {
              const ticket = ticketDoc.data(); // ✅ Extract plain object
              return (
                <tr key={ticketDoc.id}>
                  <td>{ticket.userId?.userId}</td>
                  <td>
                    {ticket.items?.map((item, idx) => (
                      <div key={idx}>
                        {item.name} - ₹{item.price}
                      </div>
                    ))}
                  </td>
                  <td>₹{ticket.subtotal}</td>
                  <td>₹{ticket.commission}</td>
                  <td>₹{ticket.totalAmount}</td>
                  <td>{ticket.status}</td>
                </tr>
              );
            })}

          </tbody>
        </Table>

      </Container>
    </>
  );
}

export default Dashboard;
