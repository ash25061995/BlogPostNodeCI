const {cleanHash}=require('../services/cache')

//waiting for the new blog post to create successfully only then clearing the cache
module.exports=async (req,res,next)=>{
        await next();
        cleanHash(req.user.id)
    
    }
