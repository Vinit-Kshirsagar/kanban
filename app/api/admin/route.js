// api/admin/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import connectDB from '@/lib/db';
import { Admin, Task } from '@/lib/Schema';
import { authOptions } from '@/lib/auth';

// Helper function to check if user is admin
async function checkAdminPermission(session) {
  if (!session) return false;
  
  await connectDB();
  const admin = await Admin.findOne({ 
    $or: [
      { email: session.user.email },
      { userId: session.user.id }
    ]
  });
  
  return admin && admin.permissions.canManageSystem;
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
    
    // Check if current user has admin privileges
    const hasAdminPermission = await checkAdminPermission(session);
    if (!hasAdminPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const { 
      username, 
      email, 
      password, 
      permissions = {} 
    } = await request.json();
    
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin with this email or username already exists' },
        { status: 409 }
      );
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Set default permissions if not provided
    const defaultPermissions = {
      canCreateUsers: true,
      canDeleteUsers: true,
      canAssignTasks: true,
      canViewAllTasks: true,
      canManageSystem: false, // Only super admin can grant this
      ...permissions
    };
    
    // Create new admin
    const newAdmin = new Admin({
      userId: uuidv4(),
      username,
      email,
      password: hashedPassword,
      permissions: defaultPermissions
    });
    
    await newAdmin.save();
    
    // Remove password from response
    const { password: _, ...adminWithoutPassword } = newAdmin.toObject();
    
    return NextResponse.json({
      message: 'Admin created successfully',
      admin: adminWithoutPassword
    }, { status: 201 });
    
  } catch (error) {
    console.error('Create admin error:', error);
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
    
    const { adminId, updates } = await request.json();
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      );
    }
    
    // Check if current user has admin privileges
    const hasAdminPermission = await checkAdminPermission(session);
    const currentAdmin = await Admin.findOne({ 
      $or: [
        { email: session.user.email },
        { userId: session.user.id }
      ]
    });
    
    // Allow self-update or require admin permission
    const isSelfUpdate = currentAdmin && currentAdmin._id.toString() === adminId;
    
    if (!hasAdminPermission && !isSelfUpdate) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // If updating permissions, only super admin can do it
    if (updates.permissions && !currentAdmin?.permissions?.canManageSystem) {
      return NextResponse.json(
        { error: 'Only super admin can update permissions' },
        { status: 403 }
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
      const existingAdmin = await Admin.findOne({
        $and: [
          { _id: { $ne: adminId } },
          {
            $or: [
              updates.username ? { username: updates.username } : {},
              updates.email ? { email: updates.email } : {}
            ].filter(obj => Object.keys(obj).length > 0)
          }
        ]
      });
      
      if (existingAdmin) {
        return NextResponse.json(
          { error: 'Username or email already exists' },
          { status: 409 }
        );
      }
    }
    
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedAdmin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Admin updated successfully',
      admin: updatedAdmin
    });
    
  } catch (error) {
    console.error('Update admin error:', error);
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
    
    // Check if current user has admin privileges
    const hasAdminPermission = await checkAdminPermission(session);
    if (!hasAdminPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Super admin access required.' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const { adminIds } = await request.json();
    
    if (!adminIds || !Array.isArray(adminIds) || adminIds.length === 0) {
      return NextResponse.json(
        { error: 'Admin IDs array is required' },
        { status: 400 }
      );
    }
    
    // Get current admin info
    const currentAdmin = await Admin.findOne({ 
      $or: [
        { email: session.user.email },
        { userId: session.user.id }
      ]
    });
    
    // Prevent self-deletion
    if (currentAdmin && adminIds.includes(currentAdmin._id.toString())) {
      return NextResponse.json(
        { error: 'Cannot delete your own admin account' },
        { status: 400 }
      );
    }
    
    // Find admins to be deleted
    const adminsToDelete = await Admin.find({ _id: { $in: adminIds } });
    
    if (adminsToDelete.length === 0) {
      return NextResponse.json(
        { error: 'No admins found to delete' },
        { status: 404 }
      );
    }
    
    // Check if trying to delete the last super admin
    const superAdmins = await Admin.find({ 'permissions.canManageSystem': true });
    const superAdminsToDelete = adminsToDelete.filter(admin => 
      admin.permissions.canManageSystem
    );
    
    if (superAdminsToDelete.length >= superAdmins.length) {
      return NextResponse.json(
        { error: 'Cannot delete all super admins. At least one must remain.' },
        { status: 400 }
      );
    }
    
    // Collect all task IDs created by these admins
    const taskIdsToUpdate = [];
    adminsToDelete.forEach(admin => {
      taskIdsToUpdate.push(...admin.createdTasks);
    });
    
    // Update tasks to remove admin references
    await Task.updateMany(
      { _id: { $in: taskIdsToUpdate } },
      { $unset: { createdBy: "" } }
    );
    
    // Delete admins
    const deleteResult = await Admin.deleteMany({ _id: { $in: adminIds } });
    
    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.deletedCount} admin(s)`,
      deletedCount: deleteResult.deletedCount,
      tasksUpdated: taskIdsToUpdate.length,
      deletedAdmins: adminsToDelete.map(admin => ({
        id: admin._id,
        username: admin.username,
        email: admin.email
      }))
    });
    
  } catch (error) {
    console.error('Delete admins error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET route for listing admins (bonus route for admin management)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if current user has admin privileges
    const hasAdminPermission = await checkAdminPermission(session);
    if (!hasAdminPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    // Get all admins with their created tasks
    const admins = await Admin.find({})
      .select('-password')
      .populate({
        path: 'createdTasks',
        select: 'title progress createdAt assignedTo',
        populate: {
          path: 'assignedTo',
          select: 'username'
        }
      });
    
    // Format data for admin management view
    const formattedAdmins = admins.map(admin => ({
      ...admin.toObject(),
      stats: {
        totalCreatedTasks: admin.createdTasks.length,
        recentTasks: admin.createdTasks
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5),
        lastActive: admin.updatedAt
      }
    }));
    
    return NextResponse.json({
      admins: formattedAdmins,
      totalAdmins: admins.length,
      superAdmins: admins.filter(admin => admin.permissions.canManageSystem).length
    });
    
  } catch (error) {
    console.error('Get admins error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}