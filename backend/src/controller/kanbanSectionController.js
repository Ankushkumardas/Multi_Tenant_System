//this controllers are used to create custom sections in kanban board but by default we have created for every project teh sections todo, inprogress, review, done but user can create custom sections as well
import Section from "../models/SectionSchema.js";

export const createSection=async(req,res)=>{
    try {
        const {projectId}=req.params;
        const tenantId=req.user.tenantId;
        const {name,order}=req.body;
        const section=await Section.create({
            projectId,
            tenantId,
            name,
            order,
        });
        res.status(201).json({success:true,section,message:"Section Created Successfully"});
    } catch (error) {
        res.status(500).json({success:false,message:error.message});
    }
}
