# Blog Backend Project

## Overview

This is the backend of a blogging platform built with Node.js and Express. It serves as the core server-side application that supports various features, enabling users to interact efficiently with the blogging community.

## Technology Stack

- **Node.js**: JavaScript runtime for server-side execution.
- **Express**: Web framework for building the API.
- **PostgreSQL**: Relational database management system for data storage.
- **WebSocket**: For real-time communication between users.

## Features

1. **User Authentication**:
   - **Registration**: Users can create accounts.
   - **Login**: Secure login functionality.
   - **Google Authentication**: Users can log in using their Google accounts.

2. **Blog Post Management**:
   - **CRUD Operations**: Create, read, update, and delete blog posts.
   - **Image and Video Uploads**: Supports uploading multimedia content organized by file type.

3. **Comment System**:
   - Users can comment on posts, enhancing interaction and discussion.

4. **Profile Management**:
   - Each user has a profile displaying their activity and interactions on the platform.

5. **Voting System**:
   - Users can upvote or downvote posts and comments, facilitating community moderation.

6. **Chat Functionality**:
   - Real-time chat allows users to communicate, fostering community engagement.

7. **Subscriptions**:
   - Users can subscribe to authors for updates on new posts.

8. **File Management**:
   - Uses **Multer** for handling file uploads with type and size restrictions.
   - Supports deletion and replacement of existing files.

9. **WebSocket Integration**:
   - Enables real-time features like chat and live notifications.

10. **Token Verification**:
    - Secure access to protected routes through JWT (JSON Web Tokens).

## Structure

- **Routing**: Organized into modules for posts, comments, profiles, authentication, chat, subscriptions, and video management.
- **Database Interaction**: Uses PostgreSQL for data management, with a connection pool for efficient query handling.

## Middleware

- **CORS**: Enabled to allow requests from the frontend.
- **Body Parser**: Configured to handle JSON and URL-encoded data.

## File Storage

- **Directory Management**: Automatically creates directories for uploaded images, videos, and audio files if they do not exist.
