# Backend API Documentation

Base URL: `http://localhost:5050`

## Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/signup` | Public | Register a new user |
| **POST** | `/api/auth/login` | Public | Login user and get token |
| **GET** | `/api/auth/me` | Authenticated | Get current logged-in user details |

## Events (`/api/events`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/events` | Public | List all approved events |
| **GET** | `/api/events/:id` | Public | Get details of a specific event |
| **POST** | `/api/events` | Organizer, Admin | Create a new event (Multipart form: `poster` file) |
| **PUT** | `/api/events/:id` | Organizer, Admin | Update an existing event (Multipart form: `poster` file) |
| **DELETE** | `/api/events/:id` | Organizer, Admin | Delete an event |

## Registrations (`/api/registrations`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/registrations/:id/register` | Authenticated | Register for an event (ID is Event ID) |
| **GET** | `/api/registrations/me` | Authenticated | Get list of events the current user registered for |
| **GET** | `/api/registrations/:id/participants` | Organizer, Admin | List participants for a specific event |
| **POST** | `/api/registrations/:id/checkin` | Organizer, Admin | Check-in a participant (manual or QR scan) |
| **GET** | `/api/registrations/:id/participants.csv` | Organizer, Admin | Download participants as CSV |

## Reviews (`/api/reviews`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/reviews/:id` | Public | List reviews for a specific event |
| **POST** | `/api/reviews/:id` | Authenticated | Add a review for a specific event |

## Stats & Dashboard (`/api/stats`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/stats/leaderboard` | Public | Get organizer leaderboard |
| **GET** | `/api/stats/recommendations` | Authenticated | Get personalized event recommendations |
| **GET** | `/api/stats/summary` | Public | System-wide summary stats |
| **GET** | `/api/stats/trending` | Public | List of trending events |
| **GET** | `/api/stats/dashboard` | Public | General dashboard statistics |

## Admin Management (`/api/admin`)
**Requires `admin` role**

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/admin/events/pending` | List events waiting for approval |
| **POST** | `/api/admin/events/:id/approve` | Approve a pending event |
| **POST** | `/api/admin/events/:id/reject` | Reject a pending event |
| **POST** | `/api/admin/users/:id/block` | Block a user account |
| **POST** | `/api/admin/users/:id/unblock` | Unblock a user account |
