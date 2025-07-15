// api/tasks/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import { Task, User, Admin } from '@/lib/Schema';
import { authOptions } from '@/lib/auth';

// Helper function to get current user (User or Admin)
async function getCurrentUser(session) {
  if (!session) return null;
  
  await connectDB();
  
  // Try to find as User first, then Admin
  let user = await User.findOne({ 
    $or: [
      { email: session.user.email },
      { userId: session.user.id }
    ]
  });
  
  if (!user) {
    user = await Admin.findOne({ 
      $or: [
        { email: session.user.email },
        { userId: session.user.id }
      ]
    });
  }
  
  return user;
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const currentUser = await getCurrentUser(session);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }
    
    const task = await Task.findById(id)
      .populate({
        path: 'createdBy',
        select: 'username email createdAt'
      })
      .populate({
        path: 'assignedTo',
        select: 'username email'
      });
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Check if user has permission to view this task
    const isCreator = task.createdBy?._id.toString() === currentUser._id.toString();
    const isAssigned = task.assignedTo.some(user => user._id.toString() === currentUser._id.toString());
    const isAdmin = currentUser.constructor.modelName === 'Admin';
    
    if (!isCreator && !isAssigned && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view this task' },
        { status: 403 }
      );
    }
    
    // Enhanced task details
    const taskDetails = {
      ...task.toObject(),
      permissions: {
        canEdit: isCreator || isAssigned || isAdmin,
        canDelete: isCreator || isAdmin,
        canAssign: isCreator || isAdmin
      },
      metadata: {
        assigneeCount: task.assignedTo.length,
        isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && task.progress !== 'Done',
        daysSinceCreated: Math.floor((new Date() - task.createdAt) / (1000 * 60 * 60 * 24)),
        daysUntilDue: task.dueDate ? 
          Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
      },
      assigneeNames: task.assignedTo.map(user => user.username),
      creatorName: task.createdBy?.username || 'Unknown'
    };
    
    return NextResponse.json({
      task: taskDetails
    });
    
  } catch (error) {
    console.error('Get task by ID error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}