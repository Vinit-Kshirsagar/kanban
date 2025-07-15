// api/tasks/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import { Task, User, Admin } from '@/lib/Schemas';
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
    
    const currentUser = await getCurrentUser(session);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'all', 'assigned', 'created', 'my'
    const status = searchParams.get('status'); // 'Todo', 'In Progress', 'Done'
    const priority = searchParams.get('priority'); // 'Low', 'Medium', 'High'
    const assignedTo = searchParams.get('assignedTo'); // User ID
    
    let query = {};
    
    // Apply filters based on user role and request
    if (filter === 'assigned') {
      query.assignedTo = currentUser._id;
    } else if (filter === 'created') {
      query.createdBy = currentUser._id;
    } else if (filter === 'my') {
      query.$or = [
        { assignedTo: currentUser._id },
        { createdBy: currentUser._id }
      ];
    }
    // 'all' or no filter - show all tasks (admin view)
    
    // Additional filters
    if (status) {
      query.progress = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    
    const tasks = await Task.find(query)
      .populate({
        path: 'createdBy',
        select: 'username email'
      })
      .populate({
        path: 'assignedTo',
        select: 'username email'
      })
      .sort({ createdAt: -1 });
    
    // Format for Kanban display
    const kanbanData = {
      Todo: [],
      'In Progress': [],
      Done: []
    };
    
    tasks.forEach(task => {
      kanbanData[task.progress].push({
        ...task.toObject(),
        assigneeNames: task.assignedTo.map(user => user.username),
        creatorName: task.createdBy?.username || 'Unknown',
        isOverdue: task.dueDate && new Date(task.dueDate) < new Date() && task.progress !== 'Done'
      });
    });
    
    return NextResponse.json({
      tasks: tasks,
      kanban: kanbanData,
      summary: {
        total: tasks.length,
        todo: kanbanData.Todo.length,
        inProgress: kanbanData['In Progress'].length,
        done: kanbanData.Done.length,
        overdue: tasks.filter(task => 
          task.dueDate && 
          new Date(task.dueDate) < new Date() && 
          task.progress !== 'Done'
        ).length
      }
    });
    
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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
    
    const {
      title,
      description,
      assignedTo = [],
      priority = 'Medium',
      dueDate,
      tags = []
    } = await request.json();
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    // Validate assigned users exist
    if (assignedTo.length > 0) {
      const assignedUsers = await User.find({ _id: { $in: assignedTo } });
      if (assignedUsers.length !== assignedTo.length) {
        return NextResponse.json(
          { error: 'One or more assigned users not found' },
          { status: 400 }
        );
      }
    }
    
    // Create new task
    const newTask = new Task({
      title,
      description,
      createdBy: currentUser._id,
      assignedTo,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags
    });
    
    await newTask.save();
    
    // Update user task arrays
    // Add to creator's createdTasks
    if (currentUser.constructor.modelName === 'User') {
      await User.findByIdAndUpdate(currentUser._id, {
        $push: { createdTasks: newTask._id }
      });
    } else if (currentUser.constructor.modelName === 'Admin') {
      await Admin.findByIdAndUpdate(currentUser._id, {
        $push: { createdTasks: newTask._id }
      });
    }
    
    // Add to assigned users' assignedTasks
    if (assignedTo.length > 0) {
      await User.updateMany(
        { _id: { $in: assignedTo } },
        { $push: { assignedTasks: newTask._id } }
      );
    }
    
    // Populate the created task for response
    const populatedTask = await Task.findById(newTask._id)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email');
    
    return NextResponse.json({
      message: 'Task created successfully',
      task: populatedTask
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create task error:', error);
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
    
    const currentUser = await getCurrentUser(session);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const { taskId, updates } = await request.json();
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }
    
    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Check permissions: creator, assigned user, or admin
    const isCreator = task.createdBy?.toString() === currentUser._id.toString();
    const isAssigned = task.assignedTo.some(userId => userId.toString() === currentUser._id.toString());
    const isAdmin = currentUser.constructor.modelName === 'Admin';
    
    if (!isCreator && !isAssigned && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update this task' },
        { status: 403 }
      );
    }
    
    // Validate assigned users if being updated
    if (updates.assignedTo) {
      const assignedUsers = await User.find({ _id: { $in: updates.assignedTo } });
      if (assignedUsers.length !== updates.assignedTo.length) {
        return NextResponse.json(
          { error: 'One or more assigned users not found' },
          { status: 400 }
        );
      }
      
      // Update user task arrays if assignedTo changed
      const oldAssignedTo = task.assignedTo.map(id => id.toString());
      const newAssignedTo = updates.assignedTo.map(id => id.toString());
      
      // Remove task from users no longer assigned
      const removedUsers = oldAssignedTo.filter(id => !newAssignedTo.includes(id));
      if (removedUsers.length > 0) {
        await User.updateMany(
          { _id: { $in: removedUsers } },
          { $pull: { assignedTasks: taskId } }
        );
      }
      
      // Add task to newly assigned users
      const addedUsers = newAssignedTo.filter(id => !oldAssignedTo.includes(id));
      if (addedUsers.length > 0) {
        await User.updateMany(
          { _id: { $in: addedUsers } },
          { $push: { assignedTasks: taskId } }
        );
      }
    }
    
    // Validate due date
    if (updates.dueDate) {
      updates.dueDate = new Date(updates.dueDate);
    }
    
    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email')
     .populate('assignedTo', 'username email');
    
    return NextResponse.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
    
  } catch (error) {
    console.error('Update task error:', error);
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
    
    const currentUser = await getCurrentUser(session);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const { taskId } = await request.json();
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }
    
    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Check permissions: only creator or admin can delete
    const isCreator = task.createdBy?.toString() === currentUser._id.toString();
    const isAdmin = currentUser.constructor.modelName === 'Admin';
    
    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this task' },
        { status: 403 }
      );
    }
    
    // Remove task references from users
    await User.updateMany(
      { assignedTasks: taskId },
      { $pull: { assignedTasks: taskId } }
    );
    
    await User.updateMany(
      { createdTasks: taskId },
      { $pull: { createdTasks: taskId } }
    );
    
    await Admin.updateMany(
      { createdTasks: taskId },
      { $pull: { createdTasks: taskId } }
    );
    
    // Delete the task
    await Task.findByIdAndDelete(taskId);
    
    return NextResponse.json({
      message: 'Task deleted successfully',
      deletedTaskId: taskId
    });
    
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}