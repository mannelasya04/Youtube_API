# YouTube Companion Dashboard

A comprehensive dashboard application that connects to the YouTube API to help content creators manage their videos, engage with their audience, and organize their ideas.

## Features

- 📺 **Video Management**: View and edit video details, track analytics
- 💬 **Comment Management**: View, reply to, and delete comments  
- 📝 **Notes System**: Organize ideas with searchable tags
- 📊 **Event Logging**: Track all user interactions and API calls
- 🔐 **Authentication**: Secure user authentication system
- 🎨 **Modern UI**: Beautiful, responsive design with YouTube-inspired styling

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Database, Authentication, Edge Functions)
- **External APIs**: YouTube Data API v3
- **Deployment**: Vercel (recommended)

## Database Schema

### Tables

#### `profiles`
```sql
id UUID PRIMARY KEY REFERENCES auth.users(id)
username TEXT
avatar_url TEXT
youtube_channel_id TEXT
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

#### `videos`
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES auth.users(id) NOT NULL
youtube_video_id TEXT UNIQUE NOT NULL
title TEXT NOT NULL
description TEXT
thumbnail_url TEXT
duration TEXT
view_count INTEGER DEFAULT 0
like_count INTEGER DEFAULT 0
comment_count INTEGER DEFAULT 0
published_at TIMESTAMP WITH TIME ZONE
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

#### `notes`
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES auth.users(id) NOT NULL
video_id UUID REFERENCES videos(id) ON DELETE CASCADE
title TEXT NOT NULL
content TEXT NOT NULL
tags TEXT[] DEFAULT '{}'
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

#### `event_logs`
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES auth.users(id)
event_type TEXT NOT NULL
event_data JSONB
ip_address INET
user_agent TEXT
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

#### `youtube_comments`
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id UUID REFERENCES auth.users(id) NOT NULL
video_id UUID REFERENCES videos(id) ON DELETE CASCADE
youtube_comment_id TEXT UNIQUE NOT NULL
parent_comment_id TEXT
author_name TEXT NOT NULL
author_channel_id TEXT
text_display TEXT NOT NULL
like_count INTEGER DEFAULT 0
published_at TIMESTAMP WITH TIME ZONE
updated_at TIMESTAMP WITH TIME ZONE
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

## API Endpoints

### Authentication Endpoints
- `POST /auth/signup` - Create new user account
- `POST /auth/signin` - User login
- `POST /auth/signout` - User logout
- `GET /auth/user` - Get current user profile

### Video Management Endpoints
- `GET /api/videos` - Get user's videos
- `GET /api/videos/:id` - Get specific video details
- `PUT /api/videos/:id` - Update video title/description
- `DELETE /api/videos/:id` - Remove video from tracking

### Comments Endpoints  
- `GET /api/videos/:id/comments` - Get video comments
- `POST /api/videos/:id/comments` - Add comment to video
- `POST /api/comments/:id/reply` - Reply to a comment
- `DELETE /api/comments/:id` - Delete user's comment

### Notes Endpoints
- `GET /api/notes` - Get user's notes (with optional search/tag filters)
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update existing note
- `DELETE /api/notes/:id` - Delete note

### Event Logging Endpoints
- `POST /api/events` - Log user event
- `GET /api/events` - Get user's event history (admin)

### YouTube API Integration Endpoints
- `GET /api/youtube/video/:videoId` - Fetch video details from YouTube
- `GET /api/youtube/comments/:videoId` - Fetch comments from YouTube
- `PUT /api/youtube/video/:videoId` - Update video on YouTube
- `POST /api/youtube/comments` - Post comment via YouTube API
- `DELETE /api/youtube/comments/:commentId` - Delete comment via YouTube API

## Environment Variables

```env
# Supabase Configuration (Auto-configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id

# YouTube API (Configure via Supabase Secrets)
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_CLIENT_ID=your_oauth_client_id
YOUTUBE_CLIENT_SECRET=your_oauth_client_secret
```

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ and npm
- Supabase account
- YouTube Data API v3 credentials

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd youtube-companion-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Supabase Setup
1. Create a new Supabase project
2. Run the database migrations (automatically handled)
3. Configure Row Level Security policies
4. Add YouTube API credentials to Supabase Secrets

### 4. YouTube API Setup
1. Go to Google Cloud Console
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs
5. Store credentials in Supabase Secrets

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Alternative Platforms
- **Netlify**: Use `npm run build` and deploy `dist/` folder
- **Cloudflare Pages**: Connect GitHub repository
- **Render**: Use Docker or static site deployment

## Security Features

- **Row Level Security (RLS)**: All database access is user-scoped
- **API Rate Limiting**: Prevents abuse of YouTube API quota
- **Input Validation**: All user inputs are sanitized
- **CORS Configuration**: Proper cross-origin request handling
- **Secure Authentication**: JWT-based auth with Supabase

## Event Logging

All user interactions are automatically logged for analytics and debugging:

- User authentication (login/logout)
- Video operations (view, edit, delete)
- Comment interactions (view, post, reply, delete)
- Note management (create, edit, delete, search)
- API calls and responses
- Error events and system issues

## Development

### Project Structure
```
src/
├── components/       # Reusable UI components
├── pages/           # Route components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── integrations/    # API integrations (Supabase, YouTube)
└── types/           # TypeScript type definitions
```

### Key Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add feature'`
5. Push to the branch: `git push origin feature-name`  
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API reference

---

Built with ❤️ using React, Supabase, and the YouTube Data API
