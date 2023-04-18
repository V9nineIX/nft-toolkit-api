



// Define your authentication middleware that verifies
const authenticate = (req ,secretKey) => {

    const authorizationHeader = req?.headers?.authorization;
    // console.log("authorizationHeader",authorizationHeader)
      
    if (authorizationHeader) {
      const token = authorizationHeader.split(' ')[1];
      try {

      if(token ==  secretKey){
         return  true
      }else{
          throw new Error('Invalid token');
      }
         
      } catch (error) {
        throw new Error('Invalid token');
      }
    } else {
      throw new Error('Authorization header not provided');
    }
  
  
};


  module.exports = { 
      authenticate:authenticate
  }
