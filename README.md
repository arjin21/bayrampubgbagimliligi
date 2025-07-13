# Instagram Clone - Social Media Application

A comprehensive Instagram-like social media application built with modern web technologies. This full-stack application includes user authentication, post creation, real-time messaging, search functionality, and a responsive UI.

## 🚀 Features

### Core Features
- **User Authentication**: Register, login, logout with JWT tokens
- **User Profiles**: Customizable profiles with bio, profile pictures, and privacy settings
- **Post Management**: Create, edit, delete, and archive posts with multiple images
- **Social Interactions**: Like, comment, save posts, and follow/unfollow users
- **Real-time Messaging**: Direct messaging with real-time updates using Socket.io
- **Search & Discovery**: Search users, posts, and tags with trending suggestions
- **Responsive Design**: Mobile-first design that works on all devices

### Advanced Features
- **Privacy Controls**: Private accounts, blocking users, notification preferences
- **Content Moderation**: Report posts, hide content, archive posts
- **Real-time Notifications**: Live updates for likes, comments, follows, and messages
- **Image Upload**: Drag-and-drop image upload with preview
- **Infinite Scroll**: Efficient content loading for better performance
- **Dark Mode Ready**: CSS structure supports theme switching

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Socket.io** - Real-time communication
- **Multer** - File upload handling
- **Cloudinary** - Image storage and optimization
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Icons** - Icon library
- **React Dropzone** - File upload interface
- **React Hot Toast** - Toast notifications
- **Framer Motion** - Animations
- **Socket.io Client** - Real-time client
- **Day.js** - Date manipulation
- **React Infinite Scroll** - Efficient content loading

## 📁 Project Structure

```
instagram-clone/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── contexts/       # React contexts for state management
│       ├── pages/          # Page components
│       └── App.js          # Main app component
├── models/                 # Mongoose schemas
│   ├── User.js
│   ├── Post.js
│   ├── Comment.js
│   └── Message.js
├── routes/                 # API route handlers
│   ├── auth.js
│   ├── users.js
│   ├── posts.js
│   ├── comments.js
│   ├── likes.js
│   ├── follows.js
│   ├── messages.js
│   └── search.js
├── middleware/             # Custom middleware
│   └── auth.js
├── server.js              # Express server
└── package.json           # Backend dependencies
```

## 🗄 Database Models

### User Model
- Basic info: username, email, password, fullName
- Profile: bio, profilePicture, website, phone, gender
- Social: followers, following, blockedUsers
- Settings: isPrivate, isVerified, notifications
- Activity: lastSeen, isOnline

### Post Model
- Content: images, caption, location, tags, mentions
- Interactions: likes, comments, savedBy, reportedBy
- Settings: isArchived, isHidden, allowComments, allowLikes
- Analytics: viewCount, shareCount

### Comment Model
- Content: text, author, post reference
- Interactions: likes, replies
- Metadata: isEdited, editedAt

### Message Model
- Content: text, sender, receiver
- Media: images, attachments
- Status: isRead, readAt
- Reactions: emoji reactions

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Users
- `GET /api/users/profile/:username` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/profile-picture` - Update profile picture
- `POST /api/users/follow/:userId` - Follow user
- `DELETE /api/users/follow/:userId` - Unfollow user
- `POST /api/users/block/:userId` - Block user
- `DELETE /api/users/block/:userId` - Unblock user

### Posts
- `GET /api/posts/feed` - Get user feed
- `GET /api/posts/explore` - Get explore posts
- `POST /api/posts` - Create post
- `GET /api/posts/:postId` - Get single post
- `PUT /api/posts/:postId` - Update post
- `DELETE /api/posts/:postId` - Delete post
- `POST /api/posts/:postId/archive` - Archive post
- `POST /api/posts/:postId/save` - Save post
- `DELETE /api/posts/:postId/save` - Unsave post

### Comments
- `GET /api/comments/:postId` - Get post comments
- `POST /api/comments` - Add comment
- `PUT /api/comments/:commentId` - Edit comment
- `DELETE /api/comments/:commentId` - Delete comment

### Likes
- `POST /api/likes/post/:postId` - Like post
- `DELETE /api/likes/post/:postId` - Unlike post
- `POST /api/likes/comment/:commentId` - Like comment
- `DELETE /api/likes/comment/:commentId` - Unlike comment

### Messages
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/:userId` - Get messages with user
- `POST /api/messages` - Send message
- `PUT /api/messages/:messageId/read` - Mark as read
- `DELETE /api/messages/:messageId` - Delete message

### Search
- `GET /api/search/users` - Search users
- `GET /api/search/posts` - Search posts
- `GET /api/search/tags` - Search tags
- `GET /api/search/suggestions` - Get search suggestions
- `GET /api/search/trending` - Get trending content

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd instagram-clone
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/instagram-clone
   JWT_SECRET=your-super-secret-jwt-key
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   PORT=5000
   NODE_ENV=development
   ```

5. **Start the development servers**
   ```bash
   # Start backend (from root directory)
   npm run dev
   
   # Start frontend (in another terminal, from root directory)
   npm run client
   ```

### Production Deployment

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```env
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

## 🎨 UI Components

### Core Components
- **Layout**: Main app layout with navigation
- **PrivateRoute**: Route protection component
- **PostCard**: Individual post display
- **CreatePostModal**: Post creation interface
- **Stories**: User stories component
- **Suggestions**: Follow suggestions

### Pages
- **Login/Register**: Authentication pages
- **Home**: Main feed with posts
- **Explore**: Discovery page
- **Profile**: User profile page
- **Messages**: Real-time messaging
- **Settings**: User settings
- **Search**: Search functionality

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers
- File upload restrictions

## 📱 Responsive Design

- Mobile-first approach
- Responsive navigation (sidebar on desktop, bottom nav on mobile)
- Touch-friendly interfaces
- Optimized for all screen sizes

## 🔄 Real-time Features

- Live messaging with Socket.io
- Real-time notifications
- Online/offline status
- Message read receipts
- Live post interactions

## 🚀 Performance Optimizations

- Infinite scroll for content loading
- Image optimization with Cloudinary
- Efficient database queries with indexing
- Lazy loading of components
- Optimized bundle size

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Instagram for inspiration
- React and Node.js communities
- All open-source contributors

---

**Note**: This is a demonstration project. For production use, ensure proper security measures, error handling, and testing are implemented.