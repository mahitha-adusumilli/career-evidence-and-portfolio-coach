import exp from 'express'
export const basicApp=exp.Router()

//basic-api
basicApp.get('/health',(req,res)=>{
    res.status(200).json({status:"Ok",message:"career evidence and portfolio coach backend is running"})
});

