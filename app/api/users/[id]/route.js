// api/users/[id]/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import { User } from '@/lib/Schema';
import { authOptions } from '@/lib/auth';

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
    
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const user = await User.findById(id)
      .select('-password')
      .populate({
        path: 'assignedTasks',
        select: 'title progress dueDate priority',
        populate: {
          path: 'createdBy',
          select: 'username'
        }
      })
      .populate({
        path: 'createdTasks',
        select: 'title progress assignedTo createdAt',
        populate: {
          path: 'assignedTo',
          select: 'username'
        }
      });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Format response for task assignment ease
    const formattedUser = {
      ...user.toObject(),
      taskSummary: {
        totalAssigned: user.assignedTasks.length,
        totalCreated: user.createdTasks.length,
        activeAssigned: user.assignedTasks.filter(task => task.progress !== 'Done').length,
        completedAssigned: user.assignedTasks.filter(task => task.progress === 'Done').length
      },
      availability: {
        workload: user.assignedTasks.filter(task => task.progress !== 'Done').length,
        status: user.assignedTasks.filter(task => task.progress !== 'Done').length > 5 ? 'busy' : 'available'
      }
    };
    
    return NextResponse.json({
      user: formattedUser
    });
    
  } catch (error) {
    console.error('Get user by ID error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}