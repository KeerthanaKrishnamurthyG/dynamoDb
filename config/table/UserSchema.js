/*
 * Trinom Digital Pvt Ltd ("COMPANY") CONFIDENTIAL                             *
 * Copyright (c) 2024 Trinom Digital Pvt Ltd, All rights reserved              *
 *                                                                             *
 * NOTICE:  All information contained herein is, and remains the property      *
 * of COMPANY. The intellectual and technical concepts contained herein are    *
 * proprietary to COMPANY and may be covered by Indian and Foreign Patents,    *
 * patents in process, and are protected by trade secret or copyright law.     *
 * Dissemination of this information or reproduction of this material is       *
 * strictly forbidden unless prior written permission is obtained from         *
 * COMPANY. Access to the source code contained herein is hereby forbidden     *
 * to anyone except current COMPANY employees, managers or contractors who     *
 * have executed Confidentiality and Non-disclosure agreements explicitly      *
 * covering such access.                                                       *
 *                                                                             *
 * The copyright notice above does not evidence any actual or intended         *
 * publication or disclosure of this source code, which includes               *
 * information that is confidential and/or proprietary, and is a trade secret, *
 * of COMPANY. ANY REPRODUCTION, MODIFICATION, DISTRIBUTION, PUBLIC            *
 * PERFORMANCE, OR PUBLIC DISPLAY OF OR THROUGH USE OF THIS SOURCE CODE        *
 * WITHOUT THE EXPRESS WRITTEN CONSENT OF COMPANY IS STRICTLY PROHIBITED,      *
 * AND IN VIOLATION OF APPLICABLE LAWS AND INTERNATIONAL TREATIES. THE         *
 * RECEIPT OR POSSESSION OF THIS SOURCE CODE AND/OR RELATED INFORMATION DOES   *
 * NOT CONVEY OR IMPLY ANY RIGHTS TO REPRODUCE, DISCLOSE OR DISTRIBUTE ITS     *
 * CONTENTS, OR TO MANUFACTURE, USE, OR SELL ANYTHING THAT IT MAY DESCRIBE,    *
 * IN WHOLE OR IN PART.                                                        *
 *                                                                             *
 * File: \config\table\UserSchema.js                                           *
 * Project: medicinedata                                                       *
 * Created Date: Saturday, April 20th 2024, 9:03:33 pm                         *
 * Author: Keerthana K <keerthana@codestax.ai>                                 *
 * -----                                                                       *
 * Last Modified: April 23rd 2024, 12:47:44 pm                                 *
 * Modified By: Keerthana K                                                    *
 * -----                                                                       *
 * Any app that can be written in JavaScript,                                  *
 *     will eventually be written in JavaScript !!                             *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date         By  Comments                                                   *
 * --------------------------------------------------------------------------- *
 */

const AWS= require('../awsConfig');
const Joi=require('joi');
const express = require('express');

const MedicineProductSchema=require('./MedicineProductSchema')
const pkUuid="USER";
const userSchema=Joi.object({
    userName:Joi.string().required(),
    userPhoneNumber:Joi.number().required(),
    userEmailId:Joi.string().required(),
});

const createTable=async(req,res)=>{
    console.log("from user");
    const dynamoDB = new AWS.DynamoDB();
   const userTable={ 
    TableName: "UserDataTable",
    KeySchema: [
        { AttributeName: 'Pk', KeyType: 'HASH' }, 
        { AttributeName: 'Sk', KeyType: 'RANGE' }// Partition key
         
    ],
    AttributeDefinitions: [
        { AttributeName: 'Pk', AttributeType: 'S' },
        { AttributeName: 'Sk', AttributeType: 'N' },
        { AttributeName: 'UserName', AttributeType: 'S' }, // String
        { AttributeName: 'UserEmailId', AttributeType: 'S' }
        
    ],
 
    ProvisionedThroughput: {
        ReadCapacityUnits: 25, // Adjust as needed
        WriteCapacityUnits: 25 // Adjust as needed
    },
    LocalSecondaryIndexes: [
        {
            IndexName: 'UserNameIndex',
            KeySchema: [
                { AttributeName: 'Pk', KeyType: 'HASH' }, // Same partition key as main table
                { AttributeName: 'UserName', KeyType: 'RANGE' } // Sort key for quantity
            ],
            Projection: { ProjectionType: 'ALL' } // Include all attributes in projection
        },
        {
            IndexName: 'EmailIndex',
            KeySchema: [
                { AttributeName: 'Pk', KeyType: 'HASH' }, // Same partition key as main table
                { AttributeName: 'UserEmailId', KeyType: 'RANGE' } // Sort key for quantity
            ],
            Projection: { ProjectionType: 'ALL' } // Include all attributes in projection
        }
    
    ]
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
    const {userName,userPhoneNumber, userEmailId }=req.body;
    console.log( "reqbody data", userName,userPhoneNumber, userEmailId);
    const{error}= userSchema.validate(req.body);
    if (error){
        console.log("error" ,error);
        return res.status(500).send("enter the medicine details and user details correctly");
    }

    try{
        console.log("added user entry request ",req);
  
 
        var addnewProduct = {                                                                                                                                           
     TableName: "UserDataTable",
           
            Item: {
                'Pk':pkUuid,
                'Sk':userPhoneNumber,
                "UserName":userName,
                "UserPhoneNumber": userPhoneNumber,
                "UserEmailId":userEmailId
            }
        };
 
    //    console.log("added Product",addnewProduct ,"inside " , "pk",pkUuid,"sk",skUuid);
      await  docClient.put(addnewProduct, function(err, data) {
        console.log("err",err,"data",data);
            if (err) {
                console.error(err);
                res.status(400).send('error occured while adding user in userTable');
            } else {
                
                console.log("Item added  succeeded:", data);
                res.status(200).send('Item added to UserTable');
            }
         });
    
    
    }
    catch(err){
        console.log("error occured while uploading data in db");
        res.send("error ocured").status(500);
    }
}

const addUserMedicineListData=async(req,res)=>{
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
            TableName: "UserDataTable",
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
            TableName: "UserDataTable",
         KeyConditionExpression:'Pk= :pkName',
         ExpressionAttributeValues: {
             ':pkName': pkUuid
 
         },
         ProjectionExpression: 'UserEmailId,UserPhoneNumber,UserName'
         };
 
         const data = await docClient.query(tableDetails).promise();
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
        console.log("userNumber",userNumber);

        const curUserDetails = {
            TableName: "UserDataTable",
            KeyConditionExpression:'Pk= :pkName',
            ExpressionAttributeValues: {
                ':pkName': pkUuid
    
            },
            ProjectionExpression: 'UserEmailId,UserPhoneNumber,UserName'
            };

    console.log("currentMedicine",curUserDetails);

     const data = await docClient.query(curUserDetails).promise();
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
        TableName: "UserDataTable",
        Key: {
            'Pk': pkUuid,
            'Sk': userNumber
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


   const updateUserData=async(req,res)=>{
    try {
        
        const userPhoneNumber =parseInt( req.params.userNumber);
        console.log("userPhone Number ",userPhoneNumber);
      
        const { UserEmailId,UserName } = req.body;
        
        console.log("data ",UserEmailId,userPhoneNumber,UserName);

        if (UserEmailId){
            const updatedUserVal= {
                TableName: "UserDataTable",
                Key:{'Pk': pkUuid,
                       'Sk': userPhoneNumber
                    },
             
                UpdateExpression: 'SET UserEmailId = :emailId',
                ExpressionAttributeValues: {
                   
                      ':emailId':UserEmailId,
                    
                },
                ReturnValues: 'ALL_NEW'
            };
            console.log("update user data ", updatedUserVal);
            const data = await docClient.update(updatedUserVal).promise();
            if (data){
                console.log("user email  changed success Fully");
                // res.send("medicine name  changed SuccessFully").status(200);
            }
            else{
                console.log(  " user email not changed success Fully");
                res.send(" user  email  not changed SuccessFully").status(400);

            }
        }

        if (UserName){
            const updatedUserVal= {
                TableName: "UserDataTable",
                Key:{'Pk': pkUuid,
                       'Sk': userPhoneNumber
                    },
             
                UpdateExpression: 'SET UserName = :userName',
                ExpressionAttributeValues: {
                   
                      ':userName':UserName,
                    
                },
                ReturnValues: 'ALL_NEW'
            };
            console.log("update user data ", updatedUserVal);
            const data = await docClient.update(updatedUserVal).promise();
            if (data){
                console.log("user name  changed success Fully");
                // res.send("medicine name  changed SuccessFully").status(200);
            }
            else{
                console.log(  " user name not changed success Fully");
                res.send(" user  name  not changed SuccessFully").status(400);

            }



        }
        res.send("updated success").status(200);
    }
        catch(err){
            console.error('Unable to query items:', err);
            res.status(500).send('Unable to query items');
        }
}
   




   







  
    module.exports={createTable,addUserMedicineListData, updateUserData,addUserData,getAllUserDataFromTable,deleteUserFromTable,getParticularUserDetails};

