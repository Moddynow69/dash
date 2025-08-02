// services/TicketSerivce.js
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase-config";

const ticketsCollectionRef = collection(db, "tickets");

const TicketSerivce = {
  getAll: () => getDocs(ticketsCollectionRef),

  create: (ticket) => addDoc(ticketsCollectionRef, ticket),

  update: (id, ticket) => {
    const ticketDocRef = doc(db, "tickets", id);
    return updateDoc(ticketDocRef, ticket);
  },

  remove: (id) => {
    const ticketDocRef = doc(db, "tickets", id);
    return deleteDoc(ticketDocRef);
  },
};

export default TicketSerivce;
