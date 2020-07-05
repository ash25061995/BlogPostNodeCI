const Keygrip=require('keygrip');
const keys=require('../../config/keys');//importing keys 
const keygrip=new Keygrip([keys.cookieKey])//keygrip takes keylist
const buffer=require('safe-buffer').Buffer;

module.exports=user=>{

    const sessionObject={passport:{user:user._id.toString()}}//creating a session object 

    const session=buffer.from(JSON.stringify(sessionObject)).toString('base64');//converting the sessionObject to hash base64 string which 
                                                                                   // is set as session in the cookie

    const sig=keygrip.sign('session='+session)//signing the data using keygrip creates a SHA1 HMAC and outputs it as a 27-byte url-safe base64 digest 

    return {session,sig}

}