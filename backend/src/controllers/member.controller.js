const memberService = require('../services/member.service');

const getAll = async (req, res) => {
  try {
    const members = await memberService.getAll();
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await memberService.getById(id);
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, avatar, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const member = await memberService.create({ name, avatar, color });
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatar, color } = req.body;

    const existingMember = await memberService.getById(id);
    if (!existingMember) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const member = await memberService.update(id, { name, avatar, color });
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await memberService.remove(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};
