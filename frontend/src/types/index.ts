export interface User {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  bio: string;
  profilePicture: string;
  isPrivate: boolean;
  isVerified: boolean;
  followers: string[];
  following: string[];
  posts: string[];
  savedPosts: string[];
  blockedUsers: string[];
  isOnline: boolean;
  lastSeen: Date;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isOwner?: boolean;
  settings: {
    notifications: {
      likes: boolean;
      comments: boolean;
      follows: boolean;
      messages: boolean;
    };
    privacy: {
      accountPrivacy: 'public' | 'private';
      showActiveStatus: boolean;
      allowMessages: 'everyone' | 'followers' | 'none';
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  _id: string;
  user: User;
  caption: string;
  images: {
    url: string;
    alt: string;
  }[];
  likes: {
    user: string;
    createdAt: Date;
  }[];
  comments: Comment[];
  location?: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  hashtags: string[];
  mentions: string[];
  isArchived: boolean;
  commentsDisabled: boolean;
  hideLikesCount: boolean;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  _id: string;
  user: User;
  post: string;
  text: string;
  likes: {
    user: string;
    createdAt: Date;
  }[];
  replies: {
    user: string;
    text: string;
    likes: {
      user: string;
      createdAt: Date;
    }[];
    mentions: string[];
    createdAt: Date;
  }[];
  mentions: string[];
  isEdited: boolean;
  editedAt?: Date;
  likesCount: number;
  repliesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  text?: string;
  image?: {
    url: string;
    alt: string;
  };
  messageType: 'text' | 'image' | 'post' | 'location';
  sharedPost?: Post;
  location?: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  isRead: boolean;
  readAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  reactions: {
    user: string;
    emoji: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Conversation {
  _id: string;
  participants: User[];
  messages: Message[];
  lastMessage?: Message;
  isGroup: boolean;
  groupName?: string;
  groupImage?: string;
  groupAdmin?: string;
  mutedBy: {
    user: string;
    mutedAt: Date;
  }[];
  archivedBy: {
    user: string;
    archivedAt: Date;
  }[];
  deletedBy: {
    user: string;
    deletedAt: Date;
  }[];
  lastActivity: Date;
  unreadCount?: number;
  isMuted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface CreatePostData {
  caption: string;
  images: FileList;
  location?: {
    name: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
}

export interface NotificationSettings {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
}

export interface PrivacySettings {
  accountPrivacy: 'public' | 'private';
  showActiveStatus: boolean;
  allowMessages: 'everyone' | 'followers' | 'none';
}

export interface ProfileUpdateData {
  username?: string;
  fullName?: string;
  bio?: string;
  email?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface SearchResult {
  users: User[];
  posts: Post[];
  hashtags: { hashtag: string; count: number }[];
}

export interface SocketEvents {
  join: (userId: string) => void;
  send_message: (data: any) => void;
  receive_message: (data: Message) => void;
  typing: (data: { senderId: string; receiverId: string }) => void;
  stop_typing: (data: { senderId: string; receiverId: string }) => void;
  user_typing: (data: { senderId: string; receiverId: string }) => void;
  user_stop_typing: (data: { senderId: string; receiverId: string }) => void;
}