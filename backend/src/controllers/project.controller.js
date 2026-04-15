const projectService = require('../services/project.service');

const getAll = async (req, res) => {
  try {
    const projects = await projectService.getAll(req.auth);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const project = await projectService.getById(req.params.id, req.auth);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const project = await projectService.create({
      name,
      description,
      icon,
      createdBy: req.auth.userId,
      creatorRole: req.auth.role,
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const project = await projectService.update(req.params.id, req.body, req.auth);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const deleted = await projectService.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
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
  remove,
};
