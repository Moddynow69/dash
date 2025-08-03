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
  const [tickets, setTickets] = useState([]);
  const [spendTickets, setSpendTickets] = useState([]);

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


  const getSpendTickets = async () => {
    const data = await getDocs(collection(db, "spendTickets"));
    console.log(data.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    setSpendTickets(data.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
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

        const ticketRef = doc(db, "spendTickets", id);
        await updateDoc(ticketRef, { status: "approved" });

        alert("Spend approved and amount deducted!");
      } else {
        alert("Insufficient balance.");
      }
    }
    getSpendTickets();
  };

  const rejectSpend = async (id) => {
    const ticketRef = doc(db, "spendTickets", id);
    await updateDoc(ticketRef, { status: "rejected" });
    alert("Spend request rejected.");
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
              <th>Subtotal</th>
              <th>Commission</th>
              <th>Total</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {spendTickets.map((ticketDoc, index) => {
              return (
                <tr key={ticketDoc.id}>
                  <td>{index + 1}</td>
                  <td>{ticketDoc.userId}</td>
                  <td>
                    {ticketDoc.items?.map((item, idx) => (
                      <div key={idx}>
                        {item.name} - ₹{item.price}
                      </div>
                    ))}
                  </td>
                  <td>₹{ticketDoc.subtotal}</td>
                  <td>₹{ticketDoc.commission}</td>
                  <td>₹{ticketDoc.totalAmount}</td>
                  <td>{ticketDoc.status}</td>
                  <td>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => approveSpend(ticketDoc.id, ticketDoc.userId, ticketDoc.totalAmount)}
                      disabled={ticketDoc.status === "approved" || ticketDoc.status === "rejected"}
                    >
                      Approve
                    </Button>{" "}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => rejectSpend(ticketDoc.id)}
                      disabled={ticketDoc.status === "approved" || ticketDoc.status === "rejected"}
                    >
                      Reject
                    </Button>
                  </td>
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
