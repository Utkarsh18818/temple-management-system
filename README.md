\# 🛕 TempleOS — Temple Management System



TempleOS is a full-stack Temple Management System designed to digitally manage temple operations while providing devotees with a modern online platform for temple information, sevas, bookings, donations, payments and receipts.



The system consists of two major interfaces:



\- 🌐 Public Devotee Portal

\- 🔐 Temple Admin Management Panel



The project is being developed from the ground up with a focus on security, scalability, tenant isolation, clean architecture and real-world temple workflows.



---



\## 🎯 Project Vision



TempleOS aims to bring the major digital operations of a temple onto one platform.



\### For Devotees



Devotees will be able to:



\- Discover temples

\- View temple information

\- Explore available sevas

\- View seva details

\- Check available seva slots

\- Book sevas online

\- Make online payments

\- Make donations

\- Receive digital receipts

\- View booking history

\- View donation history

\- Manage their profile

\- View temple events and festivals



\### For Temple Administration



Temple administrators will be able to:



\- Manage temples

\- Manage users

\- Manage devotees

\- Manage roles and permissions

\- Manage sevas

\- Manage seva slots

\- Manage bookings

\- Manage donations

\- Manage payments

\- Manage receipts

\- Manage events

\- Manage festivals

\- Review audit logs



---



\# 🏗️ System Architecture



```text

&nbsp;                        TEMPLEOS

&nbsp;                           │

&nbsp;             ┌─────────────┴─────────────┐

&nbsp;             │                           │

&nbsp;      PUBLIC DEVOTEE PORTAL         ADMIN PANEL

&nbsp;             │                           │

&nbsp;             └─────────────┬─────────────┘

&nbsp;                           │

&nbsp;                           ▼

&nbsp;                    FASTAPI BACKEND

&nbsp;                           │

&nbsp;         ┌─────────────────┼─────────────────┐

&nbsp;         │                 │                 │

&nbsp;      AUTH/RBAC         BUSINESS          PAYMENTS

&nbsp;                        LOGIC              │

&nbsp;         │                 │             RAZORPAY

&nbsp;         │                 │                 │

&nbsp;         └─────────────────┼─────────────────┘

&nbsp;                           │

&nbsp;                           ▼

&nbsp;                   POSTGRESQL / NEON

&nbsp;                           │

&nbsp;                           ▼

&nbsp;                    RECEIPTS / PDF

