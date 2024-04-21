const AWS= require('../awsConfig');
const Joi=require('joi');
const express = require('express');

const MedicineProductSchema=require('./MedicineProductSchema')
const userTableSchema=Joi.object({
    userNumber: Joi.number().required(),
      medicineList: Joi.array().items(
        Joi.object({
          medicineName: Joi.string().required(),
          quantity: Joi.number().integer().min(1).required()
        })
      ).required(),
      saleDiscountPrice:Joi.number().optional()
    });


const createTable=async(req,res)=>{
    const dynamoDB = new AWS.DynamoDB();
   const userTable={ 
    TableName: "UserTable",
    KeySchema: [
        { AttributeName: 'userNumber', KeyType: 'HASH' }, // Partition key
         
    ],
    AttributeDefinitions: [
        { AttributeName: 'userNumber', AttributeType: 'N' }, // String
        
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 25, // Adjust as needed
        WriteCapacityUnits: 25 // Adjust as needed
    },
}
try{
    const newUserTable=await dynamoDB.createTable(userTable).promise();
    console.log('Table created successfully.', newUserTable);
    return res.send("ceatedSuccessFully").status(200);
  }
   catch (error) {
    console.error('Error creating table:', error);
    return res.send("not crested").status(400);
  }
}

const stockUpdates= async (req,res,medicineList)=>{
    const docClient = new AWS.DynamoDB.DocumentClient();
    var flag=true;
    var  totalAmount=0;
    for (let eachMedicine of medicineList){
       
       
        const currentMedicine= {
            TableName: 'MedicineTable',
      
            KeyConditionExpression: 'MedicineName = :name',
            ExpressionAttributeValues: {
                ':name': eachMedicine.medicineName
            }
        };
         
     
        const currentMedicineList= await docClient.query(currentMedicine).promise();
        const medicineStock=parseInt(eachMedicine.quantity);
        const currentStock=parseInt(currentMedicineList.Items[0].Quantity);
        const Price=currentMedicineList.Items[0].Price;
        console.log("curMedicineData from stockUpdates ",currentMedicineList,"currentStock",currentStock,"medicineStock",medicineStock,currentStock>=medicineStock);
        
        if (currentStock>=medicineStock){
            const total = medicineStock * Price;
      
            totalAmount+=total;
            console.log("totalAmount ",total);
            const updatedMedicineVal  = {
            TableName: 'MedicineTable',
            Key: {
                'MedicineName': eachMedicine.medicineName ,
                'Price':Price
               
              },

              UpdateExpression: 'SET quantity = :quantity', // Replace 'AttributeName' with the attribute you want to update
              ExpressionAttributeValues: {
                ':quantity': currentStock-medicineStock // Replace 'NewValue' with the new value you want to set for the attribute
              },
          };


          console.log("updateQuery Param",   updatedMedicineVal );

         
        const data = await docClient.update(updatedMedicineVal).promise();
        if (data){
            console.log("quantity changed success Fully");
            // res.send("quantity changed SuccessFully").status(200);
        }
        else{
            console.log(  "quantity not changed success Fully");
            flag=false;
            break;
            // res.send("quantity not changed SuccessFully").status(400);

        }
        
           
        }
        else{
            flag=false;
            break;
        }
    }
    if (flag){
        return totalAmount;}
    else{
        return 0;
    }
    
}



const stockVerification= async (medicineList)=>{
    const docClient = new AWS.DynamoDB.DocumentClient();


    for (let eachMedicine of medicineList){
        const currentMedicine= {
            TableName: 'MedicineTable',
      
            KeyConditionExpression: 'MedicineName = :name',
            ExpressionAttributeValues: {
                ':name': eachMedicine.medicineName
            }
        
        }
      
        const currentMedicineList= await docClient.query(currentMedicine).promise();
   

// Fetch the quantity from the first item
const currentStock = currentMedicineList.Items[0].quantity;

        let orderesStock=eachMedicine.quantity;
        // console.log("orderesStock",orderesStock,"currentStock",currentStock);
        if (orderesStock>currentStock ){
            return false;
        }
    }
    return true;
    };


//  crud operation in data 

const docClient = new AWS.DynamoDB.DocumentClient();

const addUserData=async(req,res)=>{
    const { userNumber, medicineList,saleDiscountPrice }=req.body;
    console.log(userNumber,medicineList,saleDiscountPrice);
    const{error}= userTableSchema.validate(req.body);
    if (error){
        console.log("error" ,error);
        return res.status(500).send("enter the medicine details and user details correctly");
    }
    const stockValidation=await stockVerification(medicineList);
    console.log("stockValid",stockValidation);

    if(stockValidation){
    try{
    
        var totalAmount= await stockUpdates(req,res,medicineList);
        console.log("totalAmount value ",totalAmount);

        if (totalAmount==0){
            console.log("error occured while adding medicine price");
            res.send("error ocuured").status(400);
        }
       
        if (saleDiscountPrice>0 && saleDiscountPrice<100){
          
            totalAmount=Math.floor(totalAmount-((totalAmount*saleDiscountPrice)/100));
        
         }
        console.log("disocuntedAmount",totalAmount);
        var newuserData={
            TableName:'UserTable',
            Item:{
                'userNumber':userNumber,
                'medicineList':medicineList,
                'amount':totalAmount
            }
        }
     
        await  docClient.put(newuserData, function(error, data) {
            if (error) {
                
                res.send("issue in booking medice ").status(400);

            } else {
                console.log("user added succeeded:", newuserData);
                res.send('user booked medicine successfully and amount to be paid '+ " "+ totalAmount.toString()).status(200);
            }
         });
     
        

       
            
    }
    catch(err){
     console.log("error occured while uploading data in db");
        res.send("error ocured").status(500);
    }
    }
    else{
        console.log("quantity Out of stock");
        res.send("quantity out of stock").status(400);
    }
}


const getAllUserDataFromTable = async (req, res) => {
    try {
       const tableDetails = {
            TableName: 'UserTable', 
        };

        const data = await docClient.scan(tableDetails).promise();
        console.log('Successfully retrieved all data:', JSON.stringify(data, null, 2));
        res.status(200).json(data.Items);
    } catch (error) {
        console.error('Unable to retrieve data from DynamoDB:', JSON.stringify(error, null, 2));
        res.status(500).send('Unable to retrieve data from DynamoDB');
    }

};


   const  getParticularUserDetails= async(req,res)=>{
    
  
    try{
       
        const userNumber = parseInt(req.params.userNumber);

    const currentMedicine= {
        TableName: 'UserTable',
  
        KeyConditionExpression: 'userNumber = :name',
        ExpressionAttributeValues: {
            ':name': userNumber,
        }
    };

     const data = await docClient.query(currentMedicine).promise();
    // const data = await docClient.scan(currentMedicine).promise();
    console.log(data);
    if (data.Items.length === 0) {
        console.log("user not found")
        res.status(404).send('user  not found');
    } else {
        console.log(data.Items);
        res.send(data.Items).status(200);
        

 }
}

 catch (error) {
    console.error('Unable to fetch user:', error);
   
    res.status(500).send('Unable to fetch user');
    
    
}
   }



   const deleteUserFromTable=async(req,res)=>{
    try{
    const userNumber=parseInt(req.params.userNumber);
    
    console.log("delete", userNumber);
    const dataTobeRemove = {
        TableName: 'UserTable',
        Key: {
            'userNumber': userNumber
        }
    };

   const deletedUserFromTable=   await docClient.delete(dataTobeRemove).promise();
   
    console.log("user deleted ",deletedUserFromTable);
    res.status(200).send('user deleted successfully');
}
catch(err){
    console.error('Unable to query items:', err);
    res.status(500).send('Unable to query items');

}

   }





module.exports={createTable,addUserData,getAllUserDataFromTable,deleteUserFromTable,getParticularUserDetails};

