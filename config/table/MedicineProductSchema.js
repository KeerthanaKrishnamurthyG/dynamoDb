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
 * File: \config\table\MedicineProductSchema.js                                *
 * Project: medicinedata                                                       *
 * Created Date: Friday, April 19th 2024, 10:28:17 pm                          *
 * Author: Keerthana K <keerthana@codestax.ai>                                 *
 * -----                                                                       *
 * Last Modified: April 25th 2024, 6:40:42 am                                  *
 * Modified By: Keerthana K                                                    *
 * -----                                                                       *
 * Any app that can be written in JavaScript,                                  *
 *     will eventually be written in JavaScript !!                             *
 * -----                                                                       *
 * HISTORY:                                                                    *
 * Date         By  Comments                                                   *
 * --------------------------------------------------------------------------- *
 */

const express = require('express');

const csv = require('csv-parser');
const fs = require('fs');
const AWS= require('../awsConfig');
const { v4: uuidv4 } = require('uuid');

const Joi = require('joi');
const MedicineproductSchema = Joi.object({
    medicineName: Joi.string().required(),
    price: Joi.number().required(),
    description: Joi.string().required(),
    quantity: Joi.number().required()
});






const createTables=async(req,res) => {

    const dynamoDB = new AWS.DynamoDB();

    const  medicineTable={ 
     TableName: "MedicineProductsTable",
     KeySchema: [
         { AttributeName: 'Pk', KeyType: 'HASH' }, // Partition key
          { AttributeName: 'Sk', KeyType: 'RANGE' } // Sort key for price
     ],
     AttributeDefinitions: [
         { AttributeName: 'Pk', AttributeType: 'S' }, // String
         { AttributeName: 'Sk', AttributeType: 'S' }, // Number
         { AttributeName: 'Price', AttributeType: 'N' }, // Number
          { AttributeName: 'MedicineName', AttributeType: 'S' } // String
     ],
     ProvisionedThroughput: {
         ReadCapacityUnits: 25, // Adjust as needed
         WriteCapacityUnits: 25 // Adjust as needed
     },
     LocalSecondaryIndexes: [
         {
             IndexName: 'PriceIndex',
             KeySchema: [
                 { AttributeName: 'Pk', KeyType: 'HASH' }, // Same partition key as main table
                 { AttributeName: 'Price', KeyType: 'RANGE' } // Sort key for quantity
             ],
             Projection: { ProjectionType: 'ALL' } // Include all attributes in projection
         },
         {
             IndexName: 'NameIndex',
             KeySchema: [
                 { AttributeName: 'Pk', KeyType: 'HASH' }, // Same partition key as main table
                 { AttributeName: 'MedicineName', KeyType: 'RANGE' } // Sort key for quantity
             ],
             Projection: { ProjectionType: 'ALL' } // Include all attributes in projection
         }
     ],
        
  };

  try {
 
    console.log(medicineTable);
   const data= await dynamoDB.createTable(medicineTable).promise();

    console.log('Table created successfully.', data);
    return res.send("ceatedSuccessFully").status(200);
  }
   catch (error) {
    console.error('Error creating table:', error);
    return res.send("not crested").status(400);
  }
}



// const deleteParticularSortKeyInTable = async (req,res) => {
//     const sortKeyTobeDeleted=req.params.sortKeyTobeDeleted;
//     const params = {
//      TableName: "MedicineProductTable",
    
//         Key: {
//             '':MedicineName,
//             'Price': sortKeyTobeDeleted
//         }
//     };

//     docClient.delete(params, (err, data) => {
//         if (err) {
//             console.error("Unable to delete sorted key in table. Error JSON:", JSON.stringify(err, null, 2));
//         } else {
//             console.log("Sorted key deleted successfully deleted successfully:", JSON.stringify(data, null, 2));
//         }
//     });
// };

//  const deleteTable=dynamodb.deleteTable(medicineTable, (err, data) => {
//     if (err) {
//         console.error('Unable to delete table. Error JSON:', JSON.stringify(err, null, 2));
//     } else {
//         console.log('Table deleted successfully.');
//     }
// });

//  crud operation in data 

const docClient = new AWS.DynamoDB.DocumentClient();

const pkUuid = 'MED';
console.log("pk uuid",pkUuid);

const addDataInTable=async(req,res)=>{


    try {
        console.log("added single entry request ",req);
        
        const {error}=MedicineproductSchema.validate(req.body);
        
        if (error) {
            console.log("error" ,error);
            return res.status(400).send("enter the product details correectly");
        }
       
        const skUuid=uuidv4();
        var addnewProduct = {                                                                                                                                           
     TableName: "MedicineProductsTable",
           
            Item: {
                'Pk':pkUuid,
                'Sk':skUuid,
                'MedicineId':skUuid,
                'MedicineName': req.body.medicineName,
                'Price': req.body.price,
                'Description': req.body.description,
                'Quantity': req.body.quantity
            }
        };
       console.log("added Product",addnewProduct ,"inside " , "pk",pkUuid,"sk",skUuid);
      await  docClient.put(addnewProduct, function(err, data) {
        console.log("err",err,"data",data);
            if (err) {
                console.error(err);
            } else {
                
                console.log("Item added  succeeded:", data);
            }
         });
    
        res.status(200).send('Item added to ProductTable');
    } catch (err) {
        console.error('Unable to add item to DynamoDB:', err);
        res.status(500).send('Unable to add item to DynamoDB');
    }
};


const addBulkDataInTable=(async (req, res) => {
   
    try {
        // Access the uploaded CSV file
        const file = req.file;

        // Check if file exists
        if (!file) {
            return res.status(400).send('No file uploaded');
        }

        // Process the uploaded CSV file
        const results = [];
        fs.createReadStream(file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                // Process each row in the CSV file
                for (const row of results) {
                  console.log("medicine name in csv row" ,row.MedicineName);
                    try {
                        
                      
                        // Check if item exists in DynamoDB
                        const params = {
                          TableName: 'MedicineProductsTable',
                          // Name of your LSI
                          // dynamic
                          IndexName: 'NameIndex',
                          KeyConditionExpression: 'Pk = :pkname AND MedicineName = :skName',
                        //   KeyConditionExpression: 'Pk = :Pkname, Sk=:skName',
                          ExpressionAttributeValues: {
                              ':pkname': pkUuid,
                              ':skName':row.MedicineName
                          }    
                        };


                        console.log("params of lsi", params);
                        const data = await docClient.query(params).promise();

                        if (data.Items.length > 0) {
                            const primaryIndexPK = data.Items[0].Pk;
                            const primaryIndexSK = data.Items[0].Sk;
                            console.log("fetchedLSI Pk and Sk",primaryIndexPK,primaryIndexSK);
                         
                            // If item exists, update it
                            const updateParams = {
                                TableName: "MedicineProductTable",
                                Key: { 'Pk':pkUuid,'Sk':primaryIndexSK},
                                UpdateExpression: 'SET Price = :price, Description = :description, Quantity = :quantity',
                                ExpressionAttributeValues: {
                                    ':price': parseInt(row.Price,10),
                                    ':description': row.Description,
                                    ':quantity': parseInt(row.Quantity,10)
                                },
                                ReturnValues: 'ALL_NEW'
                            };
                            console.log("update entry",updateParams);
                            await docClient.update(updateParams).promise();
                            console.log(`Item updated: ${row.MedicineName}`);
                        } else {
                            // If item doesn't exist, create a new item
                          //   console.log("price",typeof(row.Price),"quantity",typeof(row.Quantity));
                          const skUuid=uuidv4();
                          const currentDate = new Date();
                          const formattedDate = currentDate.toISOString(); 
                            const createParams = {
                                TableName: "MedicineProductsTable",
                                Item: {
                                    'Pk':pkUuid,
                                    'Sk':skUuid,
                                    'MedicineId':skUuid,
                                    'MedicineName': row.MedicineName,
                                    'Price': parseInt(row.Price),
                                    'Description':row.Description,
                                    'Quantity': parseInt(row.Quantity),
                                    // 'UpdatedAt':formattedDate

                                }
                            };
                           console.log("added Product",createParams ,"inside " , "pk",pkUuid,"sk",skUuid);
                        
                          //   console.log("price",typeof(parseInt(row.Price)),"quantity",typeof(parseInt(row.Quantity)));
                            await docClient.put(createParams).promise();
                            console.log(`Item created: ${row.MedicineName}`);
                        }
                    } catch (error) {
                        console.error('Error processing row:', error);
                    }
                }
                
                res.status(200).send('CSV file uploaded and processed successfully');
            });
  } catch (error) {
      console.error('Error processing CSV file:', error);
      res.status(500).send('Error processing CSV file');
 
  }
}) ;

const getAllDataFromTable = async (req, res) => {
    try {
       const tableDetails = {
        TableName: "MedicineProductsTable", 
        KeyConditionExpression:'Pk= :pkName',
        ExpressionAttributeValues: {
            ':pkName': pkUuid

        },
        ProjectionExpression: 'MedicineId, MedicineName, Description, Price, Quantity'
        };

        const data = await docClient.query(tableDetails).promise();
        console.log('Successfully retrieved all data:', JSON.stringify(data, null, 2));
        res.status(200).json(data.Items);
    } catch (error) {
        console.error('Unable to retrieve data from DynamoDB:', JSON.stringify(error, null, 2));
        res.status(500).send('Unable to retrieve data from DynamoDB');
    }};


   const  getParticularDetails= async(req,res)=>{
    

    try{
       
                    const medicineId = req.params.medicineId;
        console.log("Req body",medicineId);
        
        console.log("medicine Id",medicineId);

  
    
    const currentMedicine= {
        TableName: "MedicineProductsTable",
  
        KeyConditionExpression: 'Pk = :pkval AND Sk = :skval',
        ExpressionAttributeValues: {
            ':pkval': pkUuid,
            ':skval': medicineId
        },
        ProjectionExpression: 'MedicineId, MedicineName, Description, Price, Quantity'
    };
    console.log("currentMedicine",currentMedicine);
 
     const data = await docClient.query(currentMedicine).promise();
    //  const data = await docClient.scan(currentMedicine).promise();
    console.log(data);
    if (data.Items.length === 0) {
        console.log("Medicine not found")
        res.status(404).send('Medicine not found');
    } else {
        console.log(data.Items);
        res.send(data.Items).status(200);
        

 }
}

 catch (error) {
    console.error('Unable to fetch item:', error);
   
    // res.status(500).send('Unable to fetch item');
    
    
}
}




 const updateMedicineData=async(req,res)=>{
    try {
        const medicineId = req.params.medicineId;
        console.log("medicine data ",medicineId);
      
        const { medicineName, price, description, quantity } = req.body;
        
        console.log("data ", medicineName,price,quantity,description);

        if (medicineName){
            const updatedMedicineVal = {
                TableName: "MedicineProductsTable",

                Key:{'Pk': pkUuid,
                       'Sk': medicineId
                    },
             
                UpdateExpression: 'SET  MedicineName = :medicineName',
                ExpressionAttributeValues: {
                   
                      ':medicineName':medicineName,
                    
                },
                ReturnValues: 'ALL_NEW'
            };
            console.log("update medicine data ", updatedMedicineVal);
            const data = await docClient.update(updatedMedicineVal).promise();
            if (data){
                console.log("medicine name   changed success Fully");
                // res.send("medicine name  changed SuccessFully").status(200);
            }
            else{
                console.log(  " medicine name not changed success Fully");
                res.send(" medicine name  not changed SuccessFully").status(400);

            }
        }
        
        if (price){
            const updatedMedicineVal = {
                TableName: "MedicineProductsTable",

                Key:{'Pk': pkUuid,
                       'Sk': medicineId
                    },
             
                UpdateExpression: 'SET  Price = :price',
                ExpressionAttributeValues: {
                   
                      ':price':price,
                    
                },
                ReturnValues: 'ALL_NEW'
            };
            console.log("update medicine data ", updatedMedicineVal);
            const data = await docClient.update(updatedMedicineVal).promise();
            if (data){
                console.log("Price  changed success Fully");
                // res.send("price changed SuccessFully").status(200);
            }
            else{
                console.log(  " price not changed success Fully");
                res.send(" price  not changed SuccessFully").status(400);

            }
        }

        if (description){
            const updatedMedicineVal = {
                TableName: "MedicineProductsTable",

                Key:{'Pk': pkUuid,
                       'Sk': medicineId
                    },
             
                UpdateExpression: 'SET  Description = :description',
                ExpressionAttributeValues: {
                   
                      ':description': description,
                    
                },
                ReturnValues: 'ALL_NEW'
            };
            console.log("update medicine data ", updatedMedicineVal);
    
            const data = await docClient.update(updatedMedicineVal).promise();
            if (data){
                console.log("description changed success Fully");
                // res.send("description changed SuccessFully").status(200);
            }
            else{
                console.log(  "description not changed success Fully");
                res.send("description not changed SuccessFully").status(400);

            }
        }
        if (quantity){
            const updatedMedicineVal = {
                TableName: "MedicineProductsTable",
  
                Key:{'Pk': pkUuid,
                         'Sk':medicineId
                    },
             
                UpdateExpression: 'SET  Quantity = :quantity',
                ExpressionAttributeValues: {
                   
                      ':quantity': quantity,
                    
                },
                ReturnValues: 'ALL_NEW'
            };
            console.log("update medicine data ", updatedMedicineVal);
            const data = await docClient.update(updatedMedicineVal).promise();
            if (data){
                console.log("quantity changed success Fully");
                // res.send("quantity changed SuccessFully").status(200);
            }
            else{
                console.log(  "quantity not changed success Fully");
                res.send("quantity not changed SuccessFully").status(400);

            }

        }

        res.send("changes are updated").status(200);



    } catch (error) {
        console.error('Unable to update item:', error);
        res.status(500).send('Unable to update item');
    }
}


 const deleteParticularMedicine=async(req,res)=>{
 
    try{
        const medicineId=req.params.medicineId;
    
        console.log("delete Medicine Id ", medicineId);
        const dataTobeRemove = {
            TableName: 'MedicineProductsTable',
            Key: {
                'Pk': pkUuid,
                'Sk':medicineId
            }
        };
       console.log("item to be deleted from ",dataTobeRemove );

       const deletedMedicineProduct=   await docClient.delete(dataTobeRemove).promise();
       
        console.log("Item deleted successfully",deletedMedicineProduct);
        res.status(200).send('Item deleted successfully');
    }
    catch(err){
        console.error('Unable to query items:', err);
        res.status(500).send('Unable to query items');

    }
}

 module.exports ={ createTables,addBulkDataInTable,

    deleteParticularMedicine,updateMedicineData,getParticularDetails, getAllDataFromTable,addDataInTable,addDataInTable}

 










