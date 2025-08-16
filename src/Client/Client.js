import "../App.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Form, Alert, InputGroup, Button, Container, Navbar, Row, Col } from "react-bootstrap";
import { collection, addDoc, getDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase-config";
import QrService from "../services/qr.services";
import Spend from "./spend";
import TransactionHistory from "../Component/TransactionHistory";

function Client() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [userId, setUserId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentProof, setPaymentProof] = useState("");
  const [amount, setAmount] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [message, setMessage] = useState({ error: false, msg: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkLoginAndFetchBalance = async () => {
      const loggedIn = localStorage.getItem("isLoggedIn");
      if (loggedIn !== "true") {
        navigate("/");
      } else {
        const user = localStorage.getItem("userId");
        setUserId(user);
        if (user) {
          const docSnap = await getDoc(doc(db, "accounts", user));
          if (docSnap.exists()) {
            setBalance(docSnap.data().amount || 0);
          }
        }
      }
    };
    checkLoginAndFetchBalance();
  }, [navigate, userId]);

  useEffect(() => {
    const getQr = async () => {
      const url = await QrService.fetchQrImage();
      setQrUrl(url);
    };
    getQr();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!paymentProof) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result.split(",")[1];
        const formData = new FormData();
        formData.append("image", base64);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=d7478228aeaffe11bc627055c6e5b3c0`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        const proofUrl = data?.data?.url;
        const doc = await addDoc(collection(db, "transactions"), {
          userId,
          type: "add",
          itemName: "Deposit",
          amount: Number(amount),
          status: "pending",
          createdAt: new Date(),
        });
        await addDoc(collection(db, "tickets"), {
          userId,
          transactionId,
          amount,
          paymentProof: proofUrl,
          createdAt: serverTimestamp(),
          internalTicketId: doc.id,
        });

        setMessage({ error: false, msg: "Ticket raised. Money will be added after verification." });
        setTransactionId("");
        setPaymentProof("");
        setAmount("");
      } catch (err) {
        setMessage({ error: true, msg: "Something went wrong!" });
      }
      setLoading(false);
    };

    reader.readAsDataURL(paymentProof);
  };


  return (
    <>
      <Navbar bg="dark" variant="dark" className="header">
        <Container style={{ display: "flex", justifyContent: "space-between" }}>
          <Navbar.Brand href="/">Account Dashboard</Navbar.Brand>
          <Navbar.Brand href="/">
            Your Balance : <span>${balance}</span>
          </Navbar.Brand>
          <Navbar.Brand href="#home" style={{ cursor: "pointer", backgroundColor: "White", color: "black", borderRadius: "10px", paddingLeft: "30px", paddingRight: "30px", paddingBottom: "5px", paddingTop: "5px" }} onClick={() => {
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("userId");
            navigate("/");
          }}>
            Logout
          </Navbar.Brand>
        </Container>
      </Navbar>
      <Container style={{ marginTop: "20px" }}>
        <Row>
          <Col>
            <div className="p-4 box mt-5">
              <h4 className="mb-4">Add Money</h4>
              {message?.msg && (
                <Alert
                  variant={message?.error ? "danger" : "success"}
                  dismissible
                  onClose={() => setMessage("")}
                >
                  {message?.msg}
                </Alert>
              )}

              {qrUrl && (
                <div className="text-center mb-3">
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    className="img-fluid"
                    style={{ maxWidth: "300px" }}
                  />
                </div>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group>
                  <InputGroup>
                    <InputGroup.Text>Amount</InputGroup.Text>
                    <Form.Control
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group>
                  <InputGroup>
                    <InputGroup.Text>Transaction ID</InputGroup.Text>
                    <Form.Control
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      required
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group>
                  <InputGroup>
                    <InputGroup.Text>Payment Proof</InputGroup.Text>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPaymentProof(e.target.files[0])}
                      required
                    />
                  </InputGroup>
                </Form.Group>

                <div className="d-grid gap-2 mt-3">
                  <Button type="submit" variant="primary" className="mt-3"
                    disabled={loading}
                  >
                    Add Money
                  </Button>
                </div>
              </Form>
            </div>
          </Col>
          <Col>
            <Spend userId={userId} balance={balance} />
          </Col>
        </Row>
        <div className="p-4 box mt-5">
          <TransactionHistory userId={userId} isAdmin={false} />
        </div>
      </Container>

    </>
  );
}

export default Client;
