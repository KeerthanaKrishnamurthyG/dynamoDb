const AWS=require('aws-sdk');
AWS.config.update({
    region: 'local', // Change to your preferred AWS region
    endpoint: 'http://localhost:8000' // DynamoDB Local endpoint
});
module.exports=AWS;