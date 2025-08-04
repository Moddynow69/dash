import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Table, Button, Container, Navbar, Row, Col, Spinner } from "react-bootstrap";
import QrService from "../services/qr.services";
import TicketDataSerivce from "../services/ticket.services";
import "../App.css";
import { doc, getDoc, setDoc, updateDoc, getDocs, collection, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import TransactionHistory from "../Component/TransactionHistory";


function Dashboard() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [spendTickets, setSpendTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [sending, setSending] = useState(false);


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
    setLoadingTickets(true);
    const data = await TicketDataSerivce.getAll();
    setTickets(data.docs
      .map((doc) => ({ ...doc.data(), id: doc.id }))
      .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
    ); setLoadingTickets(false);
  };

  const getSpendTickets = async () => {
    const data = await getDocs(collection(db, "spendTickets"));
    setSpendTickets(data.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
    );
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
    await addDoc(collection(db, "transactions"), {
      userId,
      type: "add",
      amount: Number(amount),
      status: userId && amount ? "approved" : "rejected",
      createdAt: new Date(),
    });

    gettickets();

  };

  useEffect(() => {
    getSpendTickets();
  }, []);

  const approveSpend = async (id, userId, totalAmount) => {
    setSending(true);
    const userDocRef = doc(db, "accounts", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const currentAmount = userDoc.data().amount || 0;
      if (currentAmount >= totalAmount) {
        await updateDoc(userDocRef, { amount: currentAmount - totalAmount });

        const ticketRef = doc(db, "spendTickets", id);
        await updateDoc(ticketRef, { status: "approved" });

        await addDoc(collection(db, "transactions"), {
          userId,
          type: "spend",
          amount: totalAmount,
          status: "approved",
          createdAt: new Date(),
        });


        alert("Spend approved and amount deducted!");
      } else {
        alert("Insufficient balance.");
      }
    }
    getSpendTickets();
    setSending(false);
  };


  const rejectSpend = async (id) => {
    setSending(true);
    const ticketRef = doc(db, "spendTickets", id);
    await updateDoc(ticketRef, { status: "rejected" });

    const ticketSnapshot = await getDoc(ticketRef);
    const data = ticketSnapshot.data();

    await addDoc(collection(db, "transactions"), {
      userId: data.userId,
      type: "spend",
      amount: data.totalAmount,
      status: "rejected",
      createdAt: new Date(),
    });

    alert("Spend request rejected.");
    getSpendTickets();
    setSending(false);
  };


  return (
    <>
      <Navbar bg="dark" variant="dark" className="header">
        <Container>
          <Navbar.Brand href="#home">Admin Dashboard</Navbar.Brand>
        </Container>
        <Container>
          <Navbar.Brand href="#home" style={{ cursor: "pointer", backgroundColor: "White", color: "black", borderRadius: "10px", paddingLeft: "30px", paddingRight: "30px", paddingBottom: "5px", paddingTop: "5px" }} onClick={() => {
            localStorage.removeItem("isLoggedInAdmin");
            navigate("/");
          }}>
            Logout
          </Navbar.Brand>
        </Container>
      </Navbar>

      <Container className="my-4">
        <h5>Upload QR Code Image</h5>
        <input type="file" accept="image/*" onChange={handleUpload} />
        {uploading && <Spinner animation="border" size="sm" />}
      </Container>

      <Container>
        <Row>
          <Col>
            <div className="mb-2">
              <Button variant="dark edit" onClick={gettickets}>
                Refresh List
              </Button>
            </div>
            {loadingTickets && (
              <div className="my-2">
                <Spinner animation="border" size="sm" /> Loading tickets...
              </div>
            )}
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Account Name</th>
                  <th>Amount</th>
                  <th>Transaction ID</th>
                  <th>Payment Proof</th>
                  <th>Date</th>
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
                      <td>{doc.createdAt?.toDate().toLocaleString() || "—"}</td>
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
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {spendTickets
              .filter(ticket => ticket.status === "pending")
              .map((ticketDoc, index) => {
                return (
                  <tr key={ticketDoc.id}>
                    <td>{index + 1}</td>
                    <td>{ticketDoc.userId}</td>
                    <td>
                      {
                        <div>
                          {ticketDoc.item.name}
                        </div>
                      }
                    </td>
                    <td>${ticketDoc.subtotal}</td>
                    <td>${ticketDoc.commission}</td>
                    <td>${ticketDoc.totalAmount}</td>
                    <td>{ticketDoc.status}</td>
                    <td>{ticketDoc.createdAt?.toDate().toLocaleString() || "—"}</td>
                    <td>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => approveSpend(ticketDoc.id, ticketDoc.userId, ticketDoc.totalAmount)}
                        disabled={sending}
                      >
                        Approve
                      </Button>{" "}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => rejectSpend(ticketDoc.id)}
                        disabled={sending}
                      >
                        Reject
                      </Button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
        <TransactionHistory isAdmin={true} />
      </Container>
    </>
  );
}

export default Dashboard;
