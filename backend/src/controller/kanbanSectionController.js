//this controllers are used to create custom sections in kanban board but by default we have created for every project teh sections todo, inprogress, review, done but user can create custom sections as well
import Section from "../models/SectionSchema.js";

export const createSection = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user.tenantId;
    const { name } = req.body;

    const lastSection = await Section.findOne({ projectId, tenantId }).sort({
      order: -1,
    });
    const nextOrder = lastSection ? lastSection.order + 1 : 0;

    const section = await Section.create({
      projectId,
      tenantId,
      name,
      order: nextOrder,
    });
    res.status(201).json({
      success: true,
      section,
      message: "Section Created Successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProjectSections = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tenantId = req.user.tenantId;
    const sections = await Section.find({ projectId, tenantId }).sort({
      order: 1,
    });
    res.status(200).json({ success: true, sections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { name, order } = req.body;
    const section = await Section.findByIdAndUpdate(
      sectionId,
      { name, order },
      { new: true },
    );
    res.status(200).json({
      success: true,
      section,
      message: "Section Updated Successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const section = await Section.findByIdAndDelete(sectionId);
    res.status(200).json({
      success: true,
      section,
      message: "Section Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
//This code handles drag & drop reordering of columns (sections) in your Kanban board.It updates the order number of each section in the database so the board stays in the same order next time you open it.
export const updateSectionOrder = async (req, res) => {
  try {
    const { sectionIds } = req.body;//we will get teh changesd sequence if teh upadted columnand set them in teh respective posoitions 
    for (let i = 0; i < sectionIds.length; i++) {
      await Section.updateOne({ _id: sectionIds[i] }, { order: i });
    }
    res.status(200).json({
      success: true,
      message: "Section Order Updated Successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
