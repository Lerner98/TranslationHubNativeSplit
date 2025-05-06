const Admin = require('../models/Admin');
const fs = require('fs').promises;
const path = require('path');
const { generateToken } = require('../middleware/auth');

const ADMINS_JSON_PATH = path.join(__dirname, '../../logs/admins.json');

const readAdminsFromJson = async () => {
  try {
    const data = await fs.readFile(ADMINS_JSON_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeAdminsToJson = async (admins) => {
  await fs.writeFile(ADMINS_JSON_PATH, JSON.stringify(admins, null, 2));
};

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const admin = new Admin({ name, email, password });
    await admin.save();

    const admins = await readAdminsFromJson();
    const adminData = admin.toObject();
    admins.push(adminData);
    await writeAdminsToJson(admins);

    delete adminData.password;
    res.status(201).json({ success: true, message: 'Admin created successfully', admin: adminData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating admin', error: error.message });
  }
};

exports.getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.status(200).json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching admin', error: error.message });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.status(200).json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching admins', error: error.message });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (name) admin.name = name;
    if (email) admin.email = email;
    if (password) admin.password = password;

    await admin.save();

    const admins = await readAdminsFromJson();
    const adminIndex = admins.findIndex(a => a._id === req.params.id);
    if (adminIndex !== -1) {
      admins[adminIndex] = admin.toObject();
      await writeAdminsToJson(admins);
    }

    res.status(200).json({ success: true, message: 'Admin updated successfully', admin: admin.toObject({ getters: true, versionKey: false, transform: (doc, ret) => { delete ret.password; return ret; } }) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating admin', error: error.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    const admins = await readAdminsFromJson();
    const updatedAdmins = admins.filter(a => a._id !== req.params.id);
    await writeAdminsToJson(updatedAdmins);

    res.status(200).json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting admin', error: error.message });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(admin._id.toString());
    const adminData = admin.toObject({ getters: true, versionKey: false, transform: (doc, ret) => { delete ret.password; return ret; } });
    res.status(200).json({ success: true, message: 'Login successful', admin: adminData, token });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
  }
};