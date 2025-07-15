// api/users/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import { User, Task } from '@/lib/Schema';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Get all users with their task counts and current activity
    const users = await User.find({})
      .select('-password')
      .populate({
        path: 'assignedTasks',
        select: 'title progress dueDate',
        options: { limit: 5 } // Latest 5 tasks for activity preview
      })
      .populate({
        path: 'createdTasks',
        select: 'title progress createdAt',
        options: { limit: 3 } // Latest 3 created tasks
      });
    
    // Format data for admin view
    const formattedUsers = users.map(user => ({
      ...user.toObject(),
      stats: {
        totalAssignedTasks: user.assignedTasks.length,
        totalCreatedTasks: user.createdTasks.length,
        activeTasks: user.assignedTasks.filter(task => task.progress !== 'Done').length,
        completedTasks: user.assignedTasks.filter(task => task.progress === 'Done').length
      },
      currentActivity: {
        recentAssignedTasks: user.assignedTasks.slice(0, 3),
        recentCreatedTasks: user.createdTasks.slice(0, 2)
      }
    }));
    
    return NextResponse.json({
      users: formattedUsers,
      totalUsers: users.length
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { userId, updates } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // If password is being updated, hash it
    if (updates.password) {
      if (updates.password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }
      updates.password = await bcrypt.hash(updates.password, 12);
    }
    
    // Check if username or email already exists (if being updated)
    if (updates.username || updates.email) {
      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: userId } },
          {
            $or: [
              updates.username ? { username: updates.username } : {},
              updates.email ? { email: updates.email } : {}
            ].filter(obj => Object.keys(obj).length > 0)
          }
        ]
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Username or email already exists' },
          { status: 409 }
        );
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const { userIds } = await request.json();
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs array is required' },
        { status: 400 }
      );
    }
    
    // Find users to be deleted and their associated tasks
    const usersToDelete = await User.find({ _id: { $in: userIds } });
    
    if (usersToDelete.length === 0) {
      return NextResponse.json(
        { error: 'No users found to delete' },
        { status: 404 }
      );
    }
    
    // Collect all task IDs associated with these users
    const taskIdsToUpdate = [];
    usersToDelete.forEach(user => {
      taskIdsToUpdate.push(...user.createdTasks, ...user.assignedTasks);
    });
    
    // Remove user references from tasks
    await Task.updateMany(
      { _id: { $in: taskIdsToUpdate } },
      { 
        $pull: { assignedTo: { $in: userIds } },
        $unset: { createdBy: "" }
      }
    );
    
    // Delete users
    const deleteResult = await User.deleteMany({ _id: { $in: userIds } });
    
    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.deletedCount} user(s)`,
      deletedCount: deleteResult.deletedCount,
      tasksUpdated: taskIdsToUpdate.length
    });
    
  } catch (error) {
    console.error('Delete users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}