// lib/auth.js
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import { User, Admin } from '@/lib/Schema';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          await connectDB();

          // Try to find user in User collection first
          let user = await User.findOne({ email: credentials.email }).select('+password');
          let userType = 'user';

          // If not found in User, try Admin collection
          if (!user) {
            user = await Admin.findOne({ email: credentials.email }).select('+password');
            userType = 'admin';
          }

          if (!user) {
            throw new Error('Invalid email or password');
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValidPassword) {
            throw new Error('Invalid email or password');
          }

          // Return user object for session
          return {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            userId: user.userId,
            userType: userType,
            permissions: user.permissions || null // Only admins have permissions
          };
        } catch (error) {
          console.error('Authentication error:', error);
          throw new Error('Authentication failed');
        }
      }
    })
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  callbacks: {
    async jwt({ token, user }) {
      // Include user data in JWT token
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.userId = user.userId;
        token.userType = user.userType;
        token.permissions = user.permissions;
      }
      return token;
    },
    
    async session({ session, token }) {
      // Include user data in session
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.userId = token.userId;
        session.user.userType = token.userType;
        session.user.permissions = token.permissions;
      }
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // Redirect logic after sign in/out
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    }
  },
  
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error'
  },
  
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User ${user.email} signed in`);
    },
    async signOut({ session, token }) {
      console.log(`User signed out`);
    }
  },
  
  debug: process.env.NODE_ENV === 'development',
  
  secret: process.env.NEXTAUTH_SECRET,
};

// Helper functions for server-side authentication checks
export async function getCurrentUser(session) {
  if (!session?.user?.id) return null;
  
  try {
    await connectDB();
    
    if (session.user.userType === 'admin') {
      return await Admin.findById(session.user.id).select('-password');
    } else {
      return await User.findById(session.user.id).select('-password');
    }
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function isAdmin(session) {
  if (!session?.user?.userType) return false;
  return session.user.userType === 'admin';
}

export async function hasPermission(session, permission) {
  if (!session?.user?.permissions) return false;
  return session.user.permissions[permission] === true;
}

// Middleware helper for protected routes
export async function requireAuth(session) {
  if (!session) {
    throw new Error('Authentication required');
  }
  return session;
}

export async function requireAdmin(session) {
  await requireAuth(session);
  if (!isAdmin(session)) {
    throw new Error('Admin access required');
  }
  return session;
}