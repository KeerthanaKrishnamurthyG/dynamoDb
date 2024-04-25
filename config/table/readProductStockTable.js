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
 * File: \config\table\readProductStockTable.js                                *
 * Project: medicinedata                                                       *
 * Created Date: Wednesday, April 24th 2024, 6:14:35 am                        *
 * Author: Keerthana K <keerthana@codestax.ai>                                 *
 * -----                                                                       *
 * Last Modified: April 24th 2024, 10:34:55 am                                 *
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
const dynamodb = new AWS.DynamoDB.DocumentClient();
const pkUuid='MED';

const Joi = require('joi');
const createTables=async(req,res) => {

    const dynamoDB = new AWS.DynamoDB();

    const  medicineTable={ 
     TableName: "MedicineProductsUpdate",
     KeySchema: [
         { AttributeName: 'Pk', KeyType: 'HASH' }, // Partition key
          { AttributeName: 'Sk', KeyType: 'RANGE' } // Sort key for price
     ],
     AttributeDefinitions: [
         { AttributeName: 'Pk', AttributeType: 'S' }, // String
         { AttributeName: 'Sk', AttributeType: 'S' }, // Number
       
     ],
     ProvisionedThroughput: {
         ReadCapacityUnits: 25, // Adjust as needed
         WriteCapacityUnits: 25 // Adjust as needed
     },
  
        
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
};

const getAllDataFromTable = async (req,res) => {
        try {
           const tableDetails = {
            TableName:"MedicineProductsUpdate", 
          
            };
    
            const data = await docClient.scan(tableDetails).promise();
            console.log('Successfully retrieved all data:', JSON.stringify(data, null, 2));
            res.status(200).json(data.Items);
        } catch (error) {
            console.error('Unable to retrieve data from DynamoDB:', JSON.stringify(error, null, 2));
            res.status(500).send('Unable to retrieve data from DynamoDB');
        }};
    



async function updateOrCreateItem( itemId,  currentTimeStamp) {
    try {
        let result = null;


        // Check if the item already exists
        const getItemParams = {
            TableName: "MedicineProductsUpdate",
            Key: { Pk: itemId },
            // ProjectionExpression: ', quantity, #timestampAttr', // Include the timestamp attribute in the projection
            // ExpressionAttributeNames: { '#timestampAttr': 'timestamp' }
        };

        const existingItem = await dynamodb.get(getItemParams).promise();

        // If the item exists and its timestamp is less than or equal to the current timestamp, update its timestamp attribute
        if (existingItem && existingItem.Item) {
            const updateItemParams = {
                TableName: "MedicineProductsUpdate",
                Key: { Pk: itemId },
                UpdateExpression: 'SET Sk = :timestampValue',
                ConditionExpression: 'Sk <= :currentTimeStamp ', // Add conditions to check the timestamp and quantity
                // ExpressionAttributeNames: { '#timestampAttr': 'timestamp' },
                ExpressionAttributeValues: {
                    ':timestampValue': new Date().toISOString(),
                    ':currentTimeStamp': currentTimeStamp, // Specify the current timestamp in the expression attribute values
                    // ':currentQuantity': currentQuantity // Specify the current quantity in the expression attribute values
                },
                ReturnValues: 'ALL_NEW' // Return the updated item
            };

            const updatedItem = await dynamodb.update(updateItemParams).promise();
            result = { lastUpdatedTime: updatedItem.Sk };
            console.log('Item updated:', updatedItem);
        } else {
            // If the item doesn't exist or its timestamp is greater than the current timestamp, create a new entry
            const putItemParams = {
                TableName: "MedicineProductsUpdate",
                Item: {
                    Pk: itemId ,
                    Sk: new Date().toISOString(),
                    // quantity: currentQuantity // Specify the current quantity for the new item
                }
            };

            const newItem = await dynamodb.put(putItemParams).promise();
            result = { lastUpdatedTime: newItem.Sk};
            console.log('New item added:', itemId);
        }

        return result;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}




module.exports={createTables,getAllDataFromTable,updateOrCreateItem}






//   const updateLastReadTimestamp=async (itemID)=>{
//     console.log("inside last read func ",itemID);
//     const queryParams = {
//         TableName: "MedicineProductsUpdate",
//         Key: {
//             "Pk": pkUuid,
//             "Sk":itemID
//         }
//     };
    
//     console.log("inside update funct", queryParams);
//    await dynamodb.get(queryParams, (err, data) => {
//         if (err) {
//             console.error("Error retrieving user entry:", err);
//         } else {
//             if (data.Item) {
//                 // User entry exists, update the timestamp
//                 const updateParams = {
//                     TableName: "MedicineProductsUpdate",
//                     Key: {
//                         "Pk": pkUuid,
//             "Sk":itemID
//                     },
//                     UpdateExpression: "SET Timestamp = :timestamp",
//                     ExpressionAttributeValues: {
//                         ":timestamp": { "S": new Date().toISOString() }
//                     },
//                     ReturnValues: "UPDATED_NEW"
//                 };
    
//          dynamodb.update(updateParams, (updateErr, updateData) => {
//                     if (updateErr) {
//                         console.error("Error updating user entry:", updateErr);
//                     } else {
//                         console.log("medicine  entry updated successfully with timeStamp.",updateData.Timestamp);
                      
                        
//                     }
//                 });
//             } else {
//                 // User entry doesn't exist, create a new entry
//                 const insertParams = {
//                     TableName: "MedicineProductsUpdate",
//                     Item: {
//                         "Pk": pkUuid,
//                         "Sk":itemID,
//                         "Timestamp": { "S": new Date().toISOString() }
//                     }
//                 };
    
//               dynamodb.put(insertParams, (insertErr, insertData) => {
//                     if (insertErr) {
//                         console.error("Error inserting user entry:", insertErr);
//                     } else {
//                         console.log("New user entry created successfully.", insertData.Timestamp);
//                         // return insertData.Timestamp;
//                     }
//                 });
//             }
//         }
//     });
    
    
    
    
    
    
    
    // try {
    //     // Define the table name
    //     const readTimeTableName = 'MedicineProductsUpdate';

    //     // Get the current read timestamp
    //     const readTimestamp = new Date().toISOString();

    //     // Define the parameters for the write operation
    //     const params = {
    //         TableName: 'MedicineProductsUpdate',
    //         Item: {
    //             Pk: itemID,
    //             Sk: readTimestamp
    //         }
    //     };

    //     // Perform the write operation
    //     await dynamodb.put(params).promise();
    //     console.log("Last read timestamp updated successfully:", readTimestamp);
    // } catch (error) {
    //     console.error("Error updating last read timestamp:", error);
    // }
// }







