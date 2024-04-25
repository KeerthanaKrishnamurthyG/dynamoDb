/*
 * Filename: c:\Users\Keerthana K\OneDrive\Desktop\MedicineData\config\table\userOrderTable
 * Path: c:\Users\Keerthana K\OneDrive\Desktop\MedicineData
 * Created Date: Tuesday, April 23rd 2024, 12:48:00 pm
 * Author: Keerthana K
 * 
 * Copyright (c) 2024 Trinom Digital Pvt Ltd
 */
const express = require('express');
const AWS= require('../awsConfig');
const mpkUuid = 'MED';
const readTable=require('../table/readProductStockTable');
// Create DynamoDB service object

const Joi = require('joi');
const userOrderschema=Joi.object({
userPhoneNumber: Joi.number().required(),
medicineList: Joi.array().items(
  Joi.object({
    medicineId: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required()
  })
).required(),
saleDiscountPrice:Joi.number().optional()
});


const dynamoDB = new AWS.DynamoDB();

const createTable=async(req,res)=>{

// Define the table parameters
const createTable = {
  TableName: 'UserOrdersTable',
  KeySchema: [
    { AttributeName: 'Pk', KeyType: 'HASH' }, // Partition key
    { AttributeName: 'Sk', KeyType: 'RANGE' } // Sort key
  ],
  AttributeDefinitions: [
    { AttributeName: 'Pk', AttributeType: 'N' },
    { AttributeName: 'Sk', AttributeType: 'S' }
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

try{
    const newUserOrderTable=await dynamoDB.createTable(createTable).promise();
    console.log('Table created successfully.',newUserOrderTable);
    return res.send("ceatedSuccessFully").status(200);
  }
   catch (error) {
    console.error('Error creating table:', error);
    return res.send("not crested").status(400);
  }
}


const docClient = new AWS.DynamoDB.DocumentClient();

const pkUuid='MED';




const stockUpdates= async (req,res,medicineList)=>{
    const docClient = new AWS.DynamoDB.DocumentClient();
    var flag=true;
    var  totalAmount=0;
    const bulkUpdatePromises = medicineList.map(async (eachMedicine) => {
            // update each item with the private visibility
      
            await docClient
            .update({
                TableName: "MedicineProductsTable",
              Key: { Pk:mpkUuid,Sk:eachMedicine.medicineId  },
              UpdateExpression: "SET Quantity = Quantity - :quantity",
             
             
              ConditionExpression: '  Quantity >= :quantity',
              ExpressionAttributeValues: {
                ":quantity": eachMedicine.quantity,
              },

            })
            .promise();
        });
    
        // wait till bulk update is completed
        console.log("bulkUpdatePromises",bulkUpdatePromises);
        try {
          await Promise.all(bulkUpdatePromises);
          console.log("All promises resolved successfully.");
          // console.log("kpkUuid",eachMedicine.medicineId);
      
          let totalAmount = 0;
          for (let eachMedicine of medicineList) {
              const currentMedicineParams = {
                  TableName: "MedicineProductsTable",
                  KeyConditionExpression: 'Pk = :pkval AND Sk = :skval',
                  ExpressionAttributeValues: {
                      ':pkval': pkUuid,
                      ':skval': eachMedicine.medicineId
                  },
              };
              const data = await docClient.query(currentMedicineParams).promise();
              if (data && data.Items && data.Items.length > 0) {
                  const price = data.Items[0].Price || 0; // Ensure price is available, default to 0 if not
                  totalAmount += price * eachMedicine.quantity;
              } else {
                  console.error(`No data found for medicine ID: ${eachMedicine.medicineId}`);
              }
          }
      
          return totalAmount;
      } catch (err) {
          console.error("One or more promises failed:", err);
          return 0; // rethrow the error to be caught by the caller
      }
    }
      


    
    

const addNewUserOrder=async(req,res)=>{
  const{userPhoneNumber,medicineList,saleDiscountPrice}=req.body;
//   const {error} = userOrderschema.validate(req.body);
  console.log(userPhoneNumber,medicineList);
//   if (error){
//     console.log("req body is missing ");
//     res.send("req body ").status(400);
//   }

  
  try{
   console.log("inside try");
    var totalAmount= await stockUpdates(req,res,medicineList);
        console.log("totalAmount value ",totalAmount);

        if (totalAmount==0){
            console.log("error occured while adding medicine price");
            res.send("error occred").status(400);
        }
       
        if (saleDiscountPrice>0 && saleDiscountPrice<100){
          
            totalAmount=Math.floor(totalAmount-((totalAmount*saleDiscountPrice)/100));
        
         }
        console.log("disocuntedAmount",totalAmount);

        const currentDate = new Date();
       const options = {
          day: '2-digit',
           month: '2-digit',
    year: 'numeric'
 } ;

// Format the date
const formattedDate = currentDate.toLocaleDateString('en-GB', options);
        var newuserData={
            TableName: 'UserOrdersTable',
            Item:{
                'Pk':userPhoneNumber,
                'Sk': formattedDate,
                'MedicineList':medicineList,
                'Amount':totalAmount,
                'OrderPlaced':formattedDate
        
            }
        }
     
        await  docClient.put(newuserData, function(error, data) {
            if (error) {
                
                res.send("issue in booking medice ").status(400);

            } else {
                console.log("user order added succeeded:", newuserData);
                res.send('user booked medicine successfully and amount to be paid '+ " "+ totalAmount.toString()).status(200);
            }
         });

  }
  catch(err){
    console.error('Error creating while adding data :', error);
    return res.send("not crested").status(400);
  }

}




const  getParticularUserOrderDetails= async(req,res)=>{
    console.log("getParticular",req.params.userPhoneNumber,req.params.orderPlaced);
    
    
    try{
       
        const userPhoneNumber = parseInt(req.params.userPhoneNumber);
        const orderPlaced=req.body.orderPlaced;

    const currentMedicine= {
        
        TableName: 'UserOrdersTable',
        KeyConditionExpression: 'Pk = :pkname AND Sk=:skName',
        ExpressionAttributeValues: {
            ':pkname': userPhoneNumber,
            ':skName':orderPlaced
        },
        ProjectionExpression:'OrderPlaced,MedicineList,Amount'
    };

     const data = await docClient.query(currentMedicine).promise();
    // const data = await docClient.scan(currentMedicine).promise();
    console.log(data);
    if (data.Items.length === 0) {
        console.log("user not found")
        res.status(404).send('user  not found');
    } else {
        console.log("fetched data ",data.Items);
        res.send(data.Items).status(200);
        

 }
}

 catch (error) {
    console.error('Unable to fetch user:', error);
   
    res.status(500).send('Unable to fetch user');
    
    
}
   }



const  getParticularUserDetails= async(req,res)=>{
    
  
    try{
       
        const userPhoneNumber = parseInt(req.params.userPhoneNumber);

    const currentMedicine= {
        
        TableName: 'UserOrdersTable',
        KeyConditionExpression: 'Pk = :name',
        ExpressionAttributeValues: {
            ':name': userPhoneNumber,
        },
        ProjectionExpression:'OrderPlaced,MedicineList,Amount'
    };

     const data = await docClient.query(currentMedicine).promise();
    // const data = await docClient.scan(currentMedicine).promise();
    console.log(data);
    if (data.Items.length === 0) {
        console.log("user not found")
        res.status(404).send('user  not found');
    } else {
        console.log("fetched data ",data.Items);
        res.send(data.Items).status(200);
        

 }
}

 catch (error) {
    console.error('Unable to fetch user:', error);
   
    res.status(500).send('Unable to fetch user');
    
    
}
   }




   const getLasttransactionHistory=async(req,res)=>{
    const userPhoneNumber=parseInt(req.params.userPhoneNumber);
    
const params = {
  TableName: 'UserOrdersTable',
  KeyConditionExpression: 'Pk = :pkval',
  ExpressionAttributeValues: {
      ':pkval': userPhoneNumber, 
     
  },
  ScanIndexForward: false, // Sort in descending order
  Limit: 30, // Limit to last 30 transactions
};
console.log("params value for last transaction", params);
await docClient.query(params, (err, data) => {
  if (err) {
      console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
      res.send("not able to fetch user").status(404);
  } else {
      console.log("Last 30 transactions:", JSON.stringify(data.Items, null, 2));
      res.status(200).send(data.Items);
    
      // .send("user data fetched successfully",JSON.stringify(data.Items, null, 2));
  }
});
   }

 const deleteParticularUserOrder=async(req,res)=>{
    try{
        const userPhoneNumber=parseInt(req.params.userPhoneNumber);
        const orderDate=req.params.orderDate;
        
        console.log("delete", userPhoneNumber ,orderDate);
        const dataTobeRemove = {
            TableName: 'UserOrdersTable',
            Key: {
                'Pk': userPhoneNumber,
                'Sk':orderDate
            }
        };
    
       const deletedUserFromTable=   await docClient.delete(dataTobeRemove).promise();
       
        console.log("user order deleted ",deletedUserFromTable);
        res.status(200).send('user order deleted successfully');
    }
    catch(err){
        console.error('Unable to query items:', err);
        res.status(500).send('Unable to query items');
    
    }
 }

   const deleteUserFromTable=async(req,res)=>{
    try{
    const userPhoneNumber=parseInt(req.params.userNumber);
    
    console.log("delete", userNumber);
    const dataTobeRemove = {
        TableName: 'UserOrdersTable',
        Key: {
            'Pk': userPhoneNumber
        }
    };

   const deletedUserFromTable=   await docClient.delete(dataTobeRemove).promise();
   
    console.log("user deleted ",deletedUserFromTable);
    res.status(200).send('user deleted successfully');
}
catch(err){
    console.error('Unable to query items:', err);
    res.status(500).send('User not  exist in order table  ');

}

   }




module.exports={createTable,addNewUserOrder,getLasttransactionHistory,getParticularUserDetails,deleteUserFromTable,deleteParticularUserOrder,getParticularUserOrderDetails}