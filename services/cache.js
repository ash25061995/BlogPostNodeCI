const mongoose = require('mongoose');
const redis=require('redis')
const util=require('util');
const keys=require('../config/keys')
const client=redis.createClient(keys.redisUrl)

//promisifying hget so that we can use async await
client.hget=util.promisify(client.hget)


const exec = mongoose.Query.prototype.exec;


//implementing our own function and binding it with query for future use anywhere in our code
//cache is applied to the only queries which needs to be cached
//option has empty object as default parameter if user doesn't pass anything
//else we are expecting user id as parameter for the purpose of nested hashing
mongoose.Query.prototype.cache=function(option={}){
    this.useCache=true;
    this.hashKey=JSON.stringify(option.key||'');
    return this
}

//mongoose.query.prototype is part of prototypal inheritence, we are making use of it for tweaking our additional functionalities
//and calling exec again 
mongoose.Query.prototype.exec = async function () {
    //if query which is not part of caching is fired then we will simply return via mongoDB 
    if(!this.useCache){
        return exec.apply(this,arguments);
    }
    //else we will form unique key with the combination of query and collection name
    const key = JSON.stringify(
        Object.assign({},
            this.getQuery(),
            { collection: this.mongooseCollection.name }
        ))

    //nested hashing in which each user has it's blogs stored in a nested manner
    const cacheValue=await client.hget(this.hashKey,key)
    
    //if redis has cached value associated with that user then return from redis itself
    if(cacheValue){
        const doc=JSON.parse(cacheValue)//parsing stringified object into json format


        return Array.isArray(doc)       //checking whether cachedValue is an array
        ?doc.map(d=>new this.model(d))  //if yes then iterate over each value and return as model as any mongoose query expects an model document to be returned
        :new this.model(doc)            //else return single model
        
    }

    //if redis doesn't have cached value return the result from mongoDB
    const result=await exec.apply(this, arguments);

    //after returning the result from mongo, cache the result in redis in a nested manner  
    client.hset(this.hashKey,key,JSON.stringify(result))
}

//cleanHash is for cleaning the entire cache associated with particular userid when new blog post is created
module.exports={
    cleanHash(hashKey){
        client.del(JSON.stringify(hashKey))
    }
}